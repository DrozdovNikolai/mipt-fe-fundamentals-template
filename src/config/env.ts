import type { AuthSession, ScopeOption } from "../types/chat";

const ALLOWED_SCOPES: ScopeOption[] = [
  "GIGACHAT_API_PERS",
  "GIGACHAT_API_B2B",
  "GIGACHAT_API_CORP",
];

const credentials = import.meta.env.VITE_GIGACHAT_CREDENTIALS?.trim() ?? "";
const rawScope = import.meta.env.VITE_GIGACHAT_SCOPE?.trim() ?? "";

const isScopeOption = (value: string): value is ScopeOption =>
  ALLOWED_SCOPES.includes(value as ScopeOption);

export const configuredAuthSession: AuthSession | null =
  credentials && isScopeOption(rawScope)
    ? {
        credentials,
        scope: rawScope,
      }
    : null;

export const gigachatEnvError = !credentials
  ? "Не задана переменная окружения VITE_GIGACHAT_CREDENTIALS."
  : !isScopeOption(rawScope)
    ? "Не задана или некорректна переменная VITE_GIGACHAT_SCOPE."
    : null;
