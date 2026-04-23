import { proxyModelsRequest } from "../_lib/gigachat.js";

export const POST = (request: Request) => proxyModelsRequest(request);
