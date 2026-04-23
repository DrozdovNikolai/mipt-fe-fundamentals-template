import type { IncomingHttpHeaders, IncomingMessage } from "node:http";
import https from "node:https";
import { Readable } from "node:stream";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";

type ChatRequestMessage = {
  role?: "user" | "assistant" | "system";
  content?: string;
  attachments?: string[];
};

type GigaChatProxyRequest = {
  credentials?: string;
  scope?: string;
  model?: string;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  repetition_penalty?: number;
  stream?: boolean;
  messages?: ChatRequestMessage[];
};

type GigaChatAuthRequest = {
  credentials?: string;
  scope?: string;
};

type GigaChatTokenResponse = {
  access_token?: string;
};

type ExternalRequestOptions = {
  method: string;
  headers?: Record<string, string>;
  body?: string;
};

type ProxyRequestOptions = {
  method: string;
  headers?: Record<string, string>;
  body?: string;
  bodyStream?: Readable;
  defaultContentType: string;
  includeCacheControl?: boolean;
};

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
};

const useStrictSsl = process.env.GIGACHAT_VERIFY_SSL === "1";

const jsonError = (message: string, status = 500) =>
  Response.json(
    {
      error: message,
    },
    {
      status,
      headers: JSON_HEADERS,
    },
  );

const readJson = async <T>(request: Request) => {
  try {
    return (await request.json()) as T;
  } catch {
    throw new Error("Некорректное JSON-тело запроса.");
  }
};

const getHeaderValue = (headers: IncomingHttpHeaders, name: string) => {
  const headerValue = headers[name.toLowerCase()];

  return Array.isArray(headerValue) ? headerValue[0] : headerValue;
};

const buildProxyHeaders = (
  upstreamHeaders: IncomingHttpHeaders,
  options: {
    defaultContentType: string;
    includeCacheControl?: boolean;
  },
) => {
  const headers = new Headers();
  headers.set("Content-Type", getHeaderValue(upstreamHeaders, "content-type") ?? options.defaultContentType);

  if (options.includeCacheControl) {
    headers.set("Cache-Control", getHeaderValue(upstreamHeaders, "cache-control") ?? "no-cache, no-transform");
  }

  return headers;
};

const readExternalResponse = (url: URL, options: ExternalRequestOptions) =>
  new Promise<{
    body: string;
    headers: IncomingHttpHeaders;
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
      (response: IncomingMessage) => {
        const chunks: Buffer[] = [];

        response.on("data", (chunk: Buffer | string) => {
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

const proxyExternalResponse = (url: URL, options: ProxyRequestOptions) =>
  new Promise<Response>((resolve, reject) => {
    const upstreamRequest = https.request(
      {
        method: options.method,
        hostname: url.hostname,
        port: url.port,
        path: `${url.pathname}${url.search}`,
        headers: options.headers,
        rejectUnauthorized: useStrictSsl,
      },
      (upstreamResponse: IncomingMessage) => {
        resolve(
          new Response(Readable.toWeb(upstreamResponse) as ReadableStream, {
            status: upstreamResponse.statusCode ?? 500,
            headers: buildProxyHeaders(upstreamResponse.headers, {
              defaultContentType: options.defaultContentType,
              includeCacheControl: options.includeCacheControl,
            }),
          }),
        );
      },
    );

    upstreamRequest.on("error", reject);

    if (options.bodyStream) {
      options.bodyStream.on("error", reject);
      options.bodyStream.pipe(upstreamRequest);
      return;
    }

    if (options.body) {
      upstreamRequest.write(options.body);
    }

    upstreamRequest.end();
  });

const requestAccessToken = async (credentials: string, scope: string) => {
  const response = await readExternalResponse(new URL("https://ngw.devices.sberbank.ru:9443/api/v2/oauth"), {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
      RqUID: crypto.randomUUID(),
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

export const proxyChatCompletion = async (request: Request) => {
  try {
    const body = await readJson<GigaChatProxyRequest>(request);

    if (!body.credentials || !body.scope) {
      return jsonError("Не переданы credentials или scope.", 400);
    }

    const accessToken = await requestAccessToken(body.credentials, body.scope);

    return proxyExternalResponse(new URL("https://gigachat.devices.sberbank.ru/api/v1/chat/completions"), {
      method: "POST",
      headers: {
        Accept: body.stream ? "text/event-stream" : "application/json",
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: body.model,
        temperature: body.temperature,
        top_p: body.top_p,
        max_tokens: body.max_tokens,
        repetition_penalty: body.repetition_penalty,
        stream: Boolean(body.stream),
        messages: body.messages ?? [],
      }),
      defaultContentType: body.stream ? "text/event-stream; charset=utf-8" : "application/json; charset=utf-8",
      includeCacheControl: Boolean(body.stream),
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? `Ошибка запроса к GigaChat API: ${error.message}` : "Ошибка запроса к GigaChat API.",
    );
  }
};

export const proxyModelsRequest = async (request: Request) => {
  try {
    const body = await readJson<GigaChatAuthRequest>(request);

    if (!body.credentials || !body.scope) {
      return jsonError("Не переданы credentials или scope.", 400);
    }

    const accessToken = await requestAccessToken(body.credentials, body.scope);
    const upstreamResponse = await readExternalResponse(new URL("https://gigachat.devices.sberbank.ru/api/v1/models"), {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.statusCode,
      headers: buildProxyHeaders(upstreamResponse.headers, {
        defaultContentType: "application/json; charset=utf-8",
      }),
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? `Ошибка запроса списка моделей: ${error.message}` : "Ошибка запроса списка моделей.",
    );
  }
};

export const proxyFileUpload = async (request: Request) => {
  try {
    const credentials = request.headers.get("x-gigachat-credentials");
    const scope = request.headers.get("x-gigachat-scope");

    if (!credentials || !scope) {
      return jsonError("Не переданы credentials или scope.", 400);
    }

    if (!request.body) {
      return jsonError("Пустое тело запроса при загрузке файла.", 400);
    }

    const accessToken = await requestAccessToken(credentials, scope);

    return proxyExternalResponse(new URL("https://gigachat.devices.sberbank.ru/api/v1/files"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": request.headers.get("content-type") ?? "multipart/form-data",
        ...(request.headers.get("content-length")
          ? {
              "Content-Length": request.headers.get("content-length") as string,
            }
          : {}),
      },
      bodyStream: Readable.fromWeb(request.body as unknown as NodeReadableStream),
      defaultContentType: "application/json; charset=utf-8",
    });
  } catch (error) {
    return jsonError(
      error instanceof Error
        ? `Ошибка загрузки файла в GigaChat API: ${error.message}`
        : "Ошибка загрузки файла в GigaChat API.",
    );
  }
};
