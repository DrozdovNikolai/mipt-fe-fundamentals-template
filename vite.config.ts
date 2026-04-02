import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import https from "node:https";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

type ChatRequestMessage = {
  role?: "user" | "assistant" | "system";
  content?: string;
};

type GigaChatProxyRequest = {
  credentials?: string;
  scope?: string;
  model?: string;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
  messages?: ChatRequestMessage[];
};

type StreamingRequestBody = {
  messages?: ChatRequestMessage[];
  prompt?: string;
};

type GigaChatTokenResponse = {
  access_token?: string;
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
const useStrictSsl = process.env.GIGACHAT_VERIFY_SSL === "1";

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

const readExternalResponse = (
  url: URL,
  options: {
    method: string;
    headers?: Record<string, string>;
    body?: string;
  },
) =>
  new Promise<{
    body: string;
    headers: IncomingMessage["headers"];
    statusCode: number;
  }>((resolve, reject) => {
    const request = https.request(
      {
        method: options.method,
        hostname: url.hostname,
        port: url.port,
        path: `${url.pathname}${url.search}`,
        headers: options.headers,
        rejectUnauthorized: useStrictSsl,
      },
      (response) => {
        const chunks: Buffer[] = [];

        response.on("data", (chunk) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });

        response.on("end", () => {
          resolve({
            body: Buffer.concat(chunks).toString("utf8"),
            headers: response.headers,
            statusCode: response.statusCode ?? 500,
          });
        });
      },
    );

    request.on("error", reject);

    if (options.body) {
      request.write(options.body);
    }

    request.end();
  });

const requestAccessToken = async (credentials: string, scope: string) => {
  const response = await readExternalResponse(new URL("https://ngw.devices.sberbank.ru:9443/api/v2/oauth"), {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
      RqUID: randomUUID(),
    },
    body: new URLSearchParams({
      scope,
    }).toString(),
  });

  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(response.body || "Не удалось получить access token GigaChat.");
  }

  const payload = JSON.parse(response.body) as GigaChatTokenResponse;
  if (!payload.access_token) {
    throw new Error("GigaChat не вернул access_token.");
  }

  return payload.access_token;
};

const proxyChatCompletion = async (
  request: IncomingMessage,
  response: ServerResponse,
  body: GigaChatProxyRequest,
) => {
  if (!body.credentials || !body.scope) {
    response.writeHead(400, {
      "Content-Type": "application/json; charset=utf-8",
    });
    response.end(JSON.stringify({ error: "Не переданы credentials или scope." }));
    return;
  }

  const accessToken = await requestAccessToken(body.credentials, body.scope);
  const upstreamBody = JSON.stringify({
    model: body.model,
    temperature: body.temperature,
    top_p: body.top_p,
    max_tokens: body.max_tokens,
    stream: Boolean(body.stream),
    messages: body.messages ?? [],
  });

  const upstreamRequest = https.request(
    {
      method: "POST",
      hostname: "gigachat.devices.sberbank.ru",
      path: "/api/v1/chat/completions",
      headers: {
        Accept: body.stream ? "text/event-stream" : "application/json",
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      rejectUnauthorized: useStrictSsl,
    },
    (upstreamResponse) => {
      response.writeHead(upstreamResponse.statusCode ?? 500, {
        "Cache-Control":
          (Array.isArray(upstreamResponse.headers["cache-control"])
            ? upstreamResponse.headers["cache-control"][0]
            : upstreamResponse.headers["cache-control"]) ?? "no-cache, no-transform",
        Connection: body.stream ? "keep-alive" : "close",
        "Content-Type":
          (Array.isArray(upstreamResponse.headers["content-type"])
            ? upstreamResponse.headers["content-type"][0]
            : upstreamResponse.headers["content-type"]) ??
          (body.stream ? "text/event-stream; charset=utf-8" : "application/json; charset=utf-8"),
      });

      upstreamResponse.on("data", (chunk) => {
        response.write(chunk);
      });

      upstreamResponse.on("end", () => {
        response.end();
      });

      upstreamResponse.on("error", (error) => {
        if (!response.writableEnded) {
          response.writeHead(500, {
            "Content-Type": "application/json; charset=utf-8",
          });
          response.end(JSON.stringify({ error: error.message }));
        }
      });
    },
  );

  const cleanup = () => {
    upstreamRequest.destroy();
  };

  request.on("close", cleanup);
  response.on("close", cleanup);

  upstreamRequest.on("error", (error) => {
    if (response.writableEnded) {
      return;
    }

    response.writeHead(500, {
      "Content-Type": "application/json; charset=utf-8",
    });
    response.end(
      JSON.stringify({
        error: `Ошибка запроса к GigaChat API: ${error.message}`,
      }),
    );
  });

  upstreamRequest.write(upstreamBody);
  upstreamRequest.end();
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
      if (request.method === "POST" && url.pathname === "/api/gigachat/chat/completions") {
        const body = (await readRequestBody(request)) as GigaChatProxyRequest;
        await proxyChatCompletion(request, response, body);
        return;
      }

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
