import type { IncomingMessage, ServerResponse } from "node:http";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

type ChatRequestMessage = {
  role?: "user" | "assistant" | "system";
  content?: string;
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

const createChatApiMiddleware =
  () => async (request: IncomingMessage, response: ServerResponse, next: () => void) => {
    if (request.method !== "POST" || request.url !== "/api/chat") {
      next();
      return;
    }

    try {
      const body = await readRequestBody(request);
      const replyChunks = chunkReply(buildReply(body.messages));

      response.writeHead(200, {
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "Content-Type": "text/event-stream; charset=utf-8",
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

        if (chunkIndex >= replyChunks.length) {
          response.write("data: [DONE]\n\n");
          closeStream();
          return;
        }

        sendSseChunk(response, replyChunks[chunkIndex]);
        chunkIndex += 1;
        timeoutId = setTimeout(streamNextChunk, 110);
      };

      streamNextChunk();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid request body";
      response.writeHead(500, {
        "Content-Type": "application/json; charset=utf-8",
      });
      response.end(JSON.stringify({ error: message }));
    }
  };

const mockChatApiPlugin = (): Plugin => {
  const middleware = createChatApiMiddleware();

  return {
    name: "mock-chat-api",
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
};

export default defineConfig({
  plugins: [react(), mockChatApiPlugin()],
});
