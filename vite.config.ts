import type { IncomingMessage, ServerResponse } from "node:http";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

type ChatRequestMessage = {
  role?: "user" | "assistant" | "system";
  content?: string;
};

type StreamingRequestBody = {
  messages?: ChatRequestMessage[];
  prompt?: string;
};

const readRequestBody = async (request: IncomingMessage) => {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  if (!chunks.length) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as {
    messages?: ChatRequestMessage[];
    prompt?: string;
  };
};

const collapseWhitespace = (value: string) => value.replace(/\s+/g, " ").trim();

const buildReply = (messages: ChatRequestMessage[] = []) => {
  const lastUserMessage = [...messages].reverse().find((message) => message.role === "user");
  const userPrompt = collapseWhitespace(lastUserMessage?.content ?? "");

  const summary = userPrompt
    ? `Понял запрос: "${userPrompt.slice(0, 120)}".`
    : "Сообщение получено.";

  return [
    summary,
    "",
    "Что делает этот mock API:",
    "- принимает массив сообщений через `POST /api/chat`",
    "- отвечает SSE-потоком через `ReadableStream`",
    "- отправляет ответ ассистента частями, чтобы проверить стриминг в `useChat`",
    "",
    "Можно останавливать генерацию кнопкой `Стоп` и повторять последний запрос через `Повторить`.",
  ].join("\n");
};

const chunkReply = (content: string) =>
  content.match(/.{1,28}(\s|$)|\S+/g)?.map((chunk) => chunk.trimStart()) ?? [content];

const buildStreamingReply = (prompt: string, mode: "stream" | "sse") => {
  const summary = prompt
    ? `Поток для запроса "${prompt.slice(0, 90)}".`
    : "Тестовый поток запущен.";

  return [
    summary,
    "",
    mode === "sse"
      ? "Ответ идёт через server-sent events."
      : "Ответ идёт через обычный ReadableStream.",
    "Хук должен накопить данные, массив чанков и метаданные ответа.",
    "После завершения поток отправит финальный сигнал окончания.",
  ].join(" ");
};

const sendSseChunk = (response: ServerResponse, content: string) => {
  response.write(
    `data: ${JSON.stringify({
      choices: [
        {
          delta: {
            content,
          },
        },
      ],
    })}\n\n`,
  );
};

const sendTextChunk = (response: ServerResponse, content: string) => {
  response.write(content);
};

type StreamOptions = {
  contentType: string;
  delay?: number;
  includeDoneSignal?: boolean;
  sendChunk: (response: ServerResponse, chunk: string) => void;
};

const streamResponse = (
  request: IncomingMessage,
  response: ServerResponse,
  chunks: string[],
  options: StreamOptions,
) => {
  response.writeHead(200, {
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "Content-Type": options.contentType,
  });

  let chunkIndex = 0;
  let timeoutId: NodeJS.Timeout | null = null;

  const cleanup = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  const closeStream = () => {
    cleanup();

    if (!response.writableEnded) {
      response.end();
    }
  };

  request.on("close", cleanup);
  response.on("close", cleanup);

  const streamNextChunk = () => {
    if (response.writableEnded) {
      cleanup();
      return;
    }

    if (chunkIndex >= chunks.length) {
      if (options.includeDoneSignal) {
        response.write("data: [DONE]\n\n");
      }

      closeStream();
      return;
    }

    options.sendChunk(response, chunks[chunkIndex]);
    chunkIndex += 1;
    timeoutId = setTimeout(streamNextChunk, options.delay ?? 110);
  };

  streamNextChunk();
};

const createStreamingApiMiddleware =
  () => async (request: IncomingMessage, response: ServerResponse, next: () => void) => {
    const url = new URL(request.url ?? "/", "http://localhost");

    try {
      if (request.method === "POST" && url.pathname === "/api/chat") {
        const body = await readRequestBody(request);
        const replyChunks = chunkReply(buildReply(body.messages));

        streamResponse(request, response, replyChunks, {
          contentType: "text/event-stream; charset=utf-8",
          includeDoneSignal: true,
          sendChunk: sendSseChunk,
        });
        return;
      }

      if ((request.method === "GET" || request.method === "POST") && url.pathname === "/api/stream") {
        const body =
          request.method === "POST"
            ? ((await readRequestBody(request)) as StreamingRequestBody)
            : undefined;
        const prompt = collapseWhitespace(body?.prompt ?? url.searchParams.get("prompt") ?? "");
        const replyChunks = chunkReply(buildStreamingReply(prompt, "stream"));

        streamResponse(request, response, replyChunks, {
          contentType: "text/plain; charset=utf-8",
          sendChunk: sendTextChunk,
        });
        return;
      }

      if (request.method === "GET" && url.pathname === "/api/sse") {
        const prompt = collapseWhitespace(url.searchParams.get("prompt") ?? "");
        const replyChunks = chunkReply(buildStreamingReply(prompt, "sse"));

        streamResponse(request, response, replyChunks, {
          contentType: "text/event-stream; charset=utf-8",
          includeDoneSignal: true,
          sendChunk: sendSseChunk,
        });
        return;
      }

      next();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid request body";
      response.writeHead(500, {
        "Content-Type": "application/json; charset=utf-8",
      });
      response.end(JSON.stringify({ error: message }));
    }
  };

const mockStreamingApiPlugin = (): Plugin => {
  const middleware = createStreamingApiMiddleware();

  return {
    name: "mock-streaming-api",
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
};

export default defineConfig({
  plugins: [react(), mockStreamingApiPlugin()],
});
