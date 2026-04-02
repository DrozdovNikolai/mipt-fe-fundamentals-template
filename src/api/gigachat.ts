import type { AuthSession, SettingsData } from "../types/chat";

export type GigaChatRole = "system" | "user" | "assistant";

export interface GigaChatMessage {
  role: GigaChatRole;
  content: string;
}

interface ChatCompletionOptions {
  authSession: AuthSession;
  settings: SettingsData;
  messages: GigaChatMessage[];
  signal?: AbortSignal;
  onChunk?: (chunk: string) => void;
}

type StreamChunk = {
  choices?: Array<{
    delta?: {
      content?: string;
    };
    message?: {
      content?: string;
    };
  }>;
};

const API_URL = "/api/gigachat/chat/completions";

const isAbortError = (error: unknown) =>
  error instanceof DOMException
    ? error.name === "AbortError"
    : typeof error === "object" &&
      error !== null &&
      "name" in error &&
      error.name === "AbortError";

const extractErrorMessage = async (response: Response) => {
  try {
    const payload = (await response.json()) as { error?: string; message?: string };
    return payload.error ?? payload.message ?? `HTTP error ${response.status}`;
  } catch {
    const fallbackText = await response.text();
    return fallbackText || `HTTP error ${response.status}`;
  }
};

const createRequestBody = ({ authSession, settings, messages, stream }: ChatCompletionOptions & { stream: boolean }) => ({
  credentials: authSession.credentials,
  scope: authSession.scope,
  model: settings.model,
  temperature: settings.temperature,
  top_p: settings.topP,
  max_tokens: settings.maxTokens,
  messages,
  stream,
});

export const requestChatCompletion = async (options: ChatCompletionOptions) => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(createRequestBody({ ...options, stream: false })),
    signal: options.signal,
  });

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }

  const payload = (await response.json()) as StreamChunk & { content?: string };
  const content =
    payload.choices?.[0]?.message?.content ?? payload.choices?.[0]?.delta?.content ?? payload.content ?? "";

  if (!content.trim()) {
    throw new Error("GigaChat вернул пустой ответ.");
  }

  return content;
};

export const streamChatCompletion = async (options: ChatCompletionOptions) => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(createRequestBody({ ...options, stream: true })),
    signal: options.signal,
  });

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Поток ответа недоступен.");
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";
  let isDone = false;

  const appendContent = (content: string) => {
    if (!content) {
      return;
    }

    fullText += content;
    options.onChunk?.(content);
  };

  const processEvent = (event: string) => {
    if (!event.trim()) {
      return;
    }

    const lines = event.split("\n");

    for (const line of lines) {
      if (!line.startsWith("data: ")) {
        continue;
      }

      const data = line.slice(6).trim();
      if (!data) {
        continue;
      }

      if (data === "[DONE]") {
        isDone = true;
        continue;
      }

      try {
        const parsed = JSON.parse(data) as StreamChunk;
        appendContent(parsed.choices?.[0]?.delta?.content ?? "");
      } catch {
        appendContent(data);
      }
    }
  };

  while (!isDone) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    if (!value) {
      continue;
    }

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const event of events) {
      processEvent(event);

      if (isDone) {
        break;
      }
    }
  }

  buffer += decoder.decode();

  if (!isDone && buffer.trim()) {
    processEvent(buffer);
  }

  if (!fullText.trim()) {
    throw new Error("Потоковый ответ GigaChat оказался пустым.");
  }

  return fullText;
};

export const requestAssistantCompletion = async (options: ChatCompletionOptions) => {
  let hasStreamedChunk = false;

  try {
    return await streamChatCompletion({
      ...options,
      onChunk: (chunk) => {
        hasStreamedChunk = true;
        options.onChunk?.(chunk);
      },
    });
  } catch (error) {
    if (isAbortError(error) || options.signal?.aborted || hasStreamedChunk) {
      throw error;
    }

    return requestChatCompletion(options);
  }
};
