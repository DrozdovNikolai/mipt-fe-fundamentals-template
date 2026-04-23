import { proxyFileUpload } from "../_lib/gigachat.js";

export const POST = (request: Request) => proxyFileUpload(request);
