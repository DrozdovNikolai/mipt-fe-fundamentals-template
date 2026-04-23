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

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
};

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

const extractErrorMessage = async (response: Response) => {
  try {
    const payload = (await response.json()) as { error?: string; message?: string };
    return payload.error ?? payload.message ?? `HTTP error ${response.status}`;
  } catch {
    const fallbackText = await response.text();
    return fallbackText || `HTTP error ${response.status}`;
  }
};

const buildProxyHeaders = (
  upstreamHeaders: Headers,
  options: {
    defaultContentType: string;
    includeCacheControl?: boolean;
  },
) => {
  const headers = new Headers();
  headers.set("Content-Type", upstreamHeaders.get("content-type") ?? options.defaultContentType);

  if (options.includeCacheControl) {
    headers.set("Cache-Control", upstreamHeaders.get("cache-control") ?? "no-cache, no-transform");
  }

  return headers;
};

const requestAccessToken = async (credentials: string, scope: string) => {
  const response = await fetch("https://ngw.devices.sberbank.ru:9443/api/v2/oauth", {
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

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }

  const payload = (await response.json()) as GigaChatTokenResponse;
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
    const upstreamResponse = await fetch("https://gigachat.devices.sberbank.ru/api/v1/chat/completions", {
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
    });

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers: buildProxyHeaders(upstreamResponse.headers, {
        defaultContentType: body.stream ? "text/event-stream; charset=utf-8" : "application/json; charset=utf-8",
        includeCacheControl: Boolean(body.stream),
      }),
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
    const upstreamResponse = await fetch("https://gigachat.devices.sberbank.ru/api/v1/models", {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
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
    const upstreamResponse = await fetch("https://gigachat.devices.sberbank.ru/api/v1/files", {
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
      body: request.body,
      duplex: "half",
    } as RequestInit & { duplex: "half" });

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers: buildProxyHeaders(upstreamResponse.headers, {
        defaultContentType: "application/json; charset=utf-8",
      }),
    });
  } catch (error) {
    return jsonError(
      error instanceof Error
        ? `Ошибка загрузки файла в GigaChat API: ${error.message}`
        : "Ошибка загрузки файла в GigaChat API.",
    );
  }
};
