import {
  startTransition,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";

const DEFAULT_API = "/api/chat";

export type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: Date;
};

export type UseChatOptions = {
  api?: string;
  initialMessages?: Message[];
  onFinish?: (message: Message) => void;
  onError?: (error: Error) => void;
};

export type UseChatResult = {
  messages: Message[];
  input: string;
  handleInputChange: (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  stop: () => void;
  reload: () => Promise<void>;
  setMessages: Dispatch<SetStateAction<Message[]>>;
};

type StreamChunk = {
  choices?: Array<{
    delta?: {
      content?: string;
    };
  }>;
  content?: string;
};

const generateId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const isAbortError = (error: unknown) =>
  error instanceof DOMException
    ? error.name === "AbortError"
    : typeof error === "object" &&
      error !== null &&
      "name" in error &&
      error.name === "AbortError";

const normalizeError = (error: unknown) =>
  error instanceof Error ? error : new Error("Не удалось выполнить запрос.");

export function useChat(options: UseChatOptions = {}): UseChatResult {
  const [messages, setMessages] = useState<Message[]>(() => options.initialMessages ?? []);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const lastRequestMessagesRef = useRef<Message[] | null>(null);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setInput(event.target.value);
  };

  const handleStream = async (response: Response) => {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error("Поток ответа недоступен.");
    }

    const assistantMessage: Message = {
      id: generateId(),
      role: "assistant",
      content: "",
      createdAt: new Date(),
    };

    setMessages((currentMessages) => [...currentMessages, assistantMessage]);

    let buffer = "";
    let isDone = false;

    const appendAssistantContent = (content: string) => {
      if (!content) {
        return;
      }

      assistantMessage.content += content;

      startTransition(() => {
        setMessages((currentMessages) =>
          currentMessages.map((message) =>
            message.id === assistantMessage.id
              ? { ...message, content: message.content + content }
              : message,
          ),
        );
      });
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
          const content = parsed.choices?.[0]?.delta?.content ?? parsed.content ?? "";
          appendAssistantContent(content);
        } catch {
          // Некорректный служебный блок пропускаем и продолжаем поток.
        }
      }
    };

    while (!isDone) {
      const { value, done } = await reader.read();

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

    options.onFinish?.({ ...assistantMessage });
  };

  const sendMessages = async (requestMessages: Message[]) => {
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(options.api ?? DEFAULT_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: requestMessages,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await handleStream(response);
    } catch (requestError) {
      if (isAbortError(requestError)) {
        return;
      }

      const nextError = normalizeError(requestError);
      setError(nextError);
      options.onError?.(nextError);
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }

      setIsLoading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!input.trim() || isLoading) {
      return;
    }

    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content: input,
      createdAt: new Date(),
    };

    const requestMessages = [...messages, userMessage];

    lastRequestMessagesRef.current = requestMessages;
    setMessages((currentMessages) => [...currentMessages, userMessage]);
    setInput("");

    await sendMessages(requestMessages);
  };

  const stop = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsLoading(false);
  };

  const reload = async () => {
    if (isLoading || !lastRequestMessagesRef.current) {
      return;
    }

    setMessages(lastRequestMessagesRef.current);
    setError(null);

    await sendMessages(lastRequestMessagesRef.current);
  };

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    stop,
    reload,
    setMessages,
  };
}
