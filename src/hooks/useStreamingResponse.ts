import { useCallback, useEffect, useRef, useState } from "react";

type StreamChunk = {
  choices?: Array<{
    delta?: {
      content?: string;
    };
  }>;
  content?: string;
};

type AbortHandle = {
  abort: () => void;
};

export type StreamingMetadata = {
  startTime: number | null;
  endTime: number | null;
  responseTime: string;
  chunkCount: number;
};

export type UseStreamingResponseOptions = {
  url: string;
  enabled?: boolean;
  method?: "GET" | "POST";
  body?: unknown;
  headers?: Record<string, string>;
  onChunk?: (chunk: string) => void;
  onComplete?: (fullText: string) => void;
  onError?: (error: Error) => void;
  parseChunk?: (rawChunk: Uint8Array) => string;
};

const createInitialMetadata = (): StreamingMetadata => ({
  startTime: null,
  endTime: null,
  responseTime: "",
  chunkCount: 0,
});

const normalizeError = (error: unknown) =>
  error instanceof Error ? error : new Error("Не удалось обработать поток.");

const isAbortError = (error: unknown) =>
  error instanceof DOMException
    ? error.name === "AbortError"
    : typeof error === "object" &&
      error !== null &&
      "name" in error &&
      error.name === "AbortError";

const extractSseContent = (chunkText: string) => {
  try {
    const parsed = JSON.parse(chunkText) as StreamChunk;
    return parsed.choices?.[0]?.delta?.content ?? parsed.content ?? "";
  } catch {
    return chunkText;
  }
};

const canUseEventSource = (options: UseStreamingResponseOptions) =>
  typeof EventSource !== "undefined" &&
  options.method === "GET" &&
  options.body === undefined &&
  Object.keys(options.headers ?? {}).length === 0;

export const useStreamingResponse = (options: UseStreamingResponseOptions) => {
  const [data, setData] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [streamedChunks, setStreamedChunks] = useState<string[]>([]);
  const [metadata, setMetadata] = useState<StreamingMetadata>(createInitialMetadata);

  const abortControllerRef = useRef<AbortHandle | null>(null);
  const decoderRef = useRef(new TextDecoder());
  const optionsRef = useRef(options);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const abort = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsStreaming(false);
  }, []);

  const reset = useCallback(() => {
    setData("");
    setStreamedChunks([]);
    setError(null);
    setMetadata(createInitialMetadata());
  }, []);

  const processStream = useCallback(
    async (body: ReadableStream<Uint8Array>, startTime: number) => {
      const reader = body.getReader();
      let accumulatedText = "";
      let chunkIndex = 0;

      decoderRef.current = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            const trailingChunk = optionsRef.current.parseChunk
              ? ""
              : decoderRef.current.decode();

            if (trailingChunk) {
              accumulatedText += trailingChunk;
              chunkIndex += 1;

              setData(accumulatedText);
              setStreamedChunks((previousChunks) => [...previousChunks, trailingChunk]);
            }

            const endTime = Date.now();
            const responseTime = `${endTime - startTime}ms`;

            setMetadata({
              startTime,
              endTime,
              responseTime,
              chunkCount: chunkIndex,
            });

            optionsRef.current.onComplete?.(accumulatedText);
            break;
          }

          if (!value) {
            continue;
          }

          const chunkText = optionsRef.current.parseChunk
            ? optionsRef.current.parseChunk(value)
            : decoderRef.current.decode(value, { stream: true });

          accumulatedText += chunkText;
          chunkIndex += 1;

          setData(accumulatedText);
          setStreamedChunks((previousChunks) => [...previousChunks, chunkText]);
          setMetadata((previousMetadata) => ({
            ...previousMetadata,
            chunkCount: chunkIndex,
          }));

          optionsRef.current.onChunk?.(chunkText);
        }
      } finally {
        reader.releaseLock();
      }
    },
    [],
  );

  const startFetchStream = useCallback(async () => {
    abortControllerRef.current?.abort();
    setIsStreaming(true);
    setError(null);
    setData("");
    setStreamedChunks([]);

    const startTime = Date.now();
    setMetadata({
      startTime,
      endTime: null,
      responseTime: "",
      chunkCount: 0,
    });

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const response = await fetch(optionsRef.current.url, {
        method: optionsRef.current.method ?? "POST",
        headers: {
          "Content-Type": "application/json",
          ...optionsRef.current.headers,
        },
        body:
          optionsRef.current.body !== undefined
            ? JSON.stringify(optionsRef.current.body)
            : undefined,
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response body available");
      }

      await processStream(response.body, startTime);
    } catch (streamError) {
      if (isAbortError(streamError)) {
        return;
      }

      const nextError = normalizeError(streamError);
      setError(nextError);
      optionsRef.current.onError?.(nextError);
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }

      setIsStreaming(false);
    }
  }, [processStream]);

  const startSSEStream = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsStreaming(true);
    setError(null);
    setData("");
    setStreamedChunks([]);

    const startTime = Date.now();
    setMetadata({
      startTime,
      endTime: null,
      responseTime: "",
      chunkCount: 0,
    });

    const eventSource = new EventSource(optionsRef.current.url);
    let accumulatedText = "";
    let chunkIndex = 0;
    let isClosed = false;

    const finalize = () => {
      const endTime = Date.now();
      const responseTime = `${endTime - startTime}ms`;

      setMetadata({
        startTime,
        endTime,
        responseTime,
        chunkCount: chunkIndex,
      });

      optionsRef.current.onComplete?.(accumulatedText);
    };

    const close = () => {
      if (isClosed) {
        return;
      }

      isClosed = true;
      eventSource.close();
      setIsStreaming(false);

      if (abortControllerRef.current === abortHandle) {
        abortControllerRef.current = null;
      }
    };

    const abortHandle: AbortHandle = {
      abort: close,
    };

    eventSource.onmessage = (event) => {
      const chunkText = event.data;

      if (chunkText === "[DONE]") {
        close();
        finalize();
        return;
      }

      const content = extractSseContent(chunkText);

      if (!content) {
        return;
      }

      accumulatedText += content;
      chunkIndex += 1;

      setData(accumulatedText);
      setStreamedChunks((previousChunks) => [...previousChunks, content]);
      setMetadata((previousMetadata) => ({
        ...previousMetadata,
        chunkCount: chunkIndex,
      }));

      optionsRef.current.onChunk?.(content);
    };

    eventSource.onerror = () => {
      if (isClosed) {
        return;
      }

      close();

      const nextError = new Error("SSE connection error");
      setError(nextError);
      optionsRef.current.onError?.(nextError);
    };

    abortControllerRef.current = abortHandle;
  }, []);

  const startStream = useCallback(() => {
    if (canUseEventSource(optionsRef.current)) {
      startSSEStream();
      return Promise.resolve();
    }

    return startFetchStream();
  }, [startFetchStream, startSSEStream]);

  useEffect(() => {
    if (options.enabled) {
      void startStream();
    }

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [options.enabled, options.url, startStream]);

  return {
    data,
    isStreaming,
    error,
    streamedChunks,
    metadata,
    abort,
    reset,
    startStream,
  };
};
