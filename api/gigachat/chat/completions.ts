import { proxyChatCompletion } from "../../_lib/gigachat.js";

export const POST = (request: Request) => proxyChatCompletion(request);
