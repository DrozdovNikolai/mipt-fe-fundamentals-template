import type { AuthSession, ChatData, ChatState, MessageData, SettingsData } from "../types/chat";

const CHAT_STATE_STORAGE_KEY = "gigachat-ui:chat-state";
const AUTH_SESSION_STORAGE_KEY = "gigachat-ui:auth-session";

type PersistedChatState = Pick<ChatState, "activeChatId" | "chats" | "settings">;

const canUseStorage = () => typeof window !== "undefined";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isMessageData = (value: unknown): value is MessageData =>
  isRecord(value) &&
  typeof value.id === "string" &&
  (value.role === "user" || value.role === "assistant") &&
  typeof value.content === "string";

const isChatData = (value: unknown): value is ChatData =>
  isRecord(value) &&
  typeof value.id === "string" &&
  typeof value.title === "string" &&
  typeof value.updatedAt === "string" &&
  typeof value.preview === "string" &&
  Array.isArray(value.messages) &&
  value.messages.every(isMessageData);

const isSettingsData = (value: unknown): value is SettingsData =>
  isRecord(value) &&
  typeof value.model === "string" &&
  typeof value.temperature === "number" &&
  typeof value.topP === "number" &&
  typeof value.maxTokens === "number" &&
  typeof value.systemPrompt === "string" &&
  (value.theme === "light" || value.theme === "dark");

const isAuthSession = (value: unknown): value is AuthSession =>
  isRecord(value) && typeof value.credentials === "string" && typeof value.scope === "string";

export const loadPersistedChatState = (): PersistedChatState | null => {
  if (!canUseStorage()) {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(CHAT_STATE_STORAGE_KEY);
    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue) as Partial<PersistedChatState>;
    const chats = Array.isArray(parsed.chats) ? parsed.chats.filter(isChatData) : null;
    const settings = isSettingsData(parsed.settings) ? parsed.settings : null;
    const activeChatId = typeof parsed.activeChatId === "string" ? parsed.activeChatId : null;

    if (!chats || !settings) {
      return null;
    }

    return {
      chats,
      activeChatId,
      settings,
    };
  } catch {
    return null;
  }
};

export const savePersistedChatState = (state: PersistedChatState) => {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(CHAT_STATE_STORAGE_KEY, JSON.stringify(state));
};

export const loadAuthSession = (): AuthSession | null => {
  if (!canUseStorage()) {
    return null;
  }

  try {
    const rawValue = window.sessionStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue) as AuthSession;
    return isAuthSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const saveAuthSession = (authSession: AuthSession | null) => {
  if (!canUseStorage()) {
    return;
  }

  if (!authSession) {
    window.sessionStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    return;
  }

  window.sessionStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(authSession));
};
