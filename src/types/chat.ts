export type MessageVariant = "user" | "assistant";
export type ThemeMode = "light" | "dark";
export type ScopeOption =
  | "GIGACHAT_API_PERS"
  | "GIGACHAT_API_B2B"
  | "GIGACHAT_API_CORP";
export type ModelOption = string;

export interface MessageAttachment {
  id: string;
  kind: "image";
  name: string;
  mimeType: string;
}

export interface MessageData {
  id: string;
  role: MessageVariant;
  content: string;
  author: string;
  createdAt: string;
  timestamp?: string;
  attachments?: MessageAttachment[];
}

export interface ChatData {
  id: string;
  title: string;
  isTitleGenerated?: boolean;
  updatedAt: string;
  preview: string;
  messages: MessageData[];
}

export interface SettingsData {
  model: ModelOption;
  temperature: number;
  topP: number;
  maxTokens: number;
  repetitionPenalty: number;
  systemPrompt: string;
  theme: ThemeMode;
}

export interface AuthFormValues {
  credentials: string;
  scope: ScopeOption;
}

export interface AuthSession extends AuthFormValues {}

export interface ChatState {
  chats: ChatData[];
  activeChatId: string | null;
  isLoading: boolean;
  error: string | null;
  authSession: AuthSession | null;
  settings: SettingsData;
}

export type ChatAction =
  | {
      type: "HYDRATE";
      payload: Pick<ChatState, "chats" | "activeChatId" | "settings" | "authSession">;
    }
  | {
      type: "SET_AUTH_SESSION";
      payload: AuthSession | null;
    }
  | {
      type: "SET_SETTINGS";
      payload: SettingsData;
    }
  | {
      type: "SET_ACTIVE_CHAT";
      payload: string | null;
    }
  | {
      type: "CREATE_CHAT";
      payload: ChatData;
    }
  | {
      type: "RENAME_CHAT";
      payload: {
        chatId: string;
        title: string;
      };
    }
  | {
      type: "DELETE_CHAT";
      payload: {
        chatId: string;
      };
    }
  | {
      type: "APPEND_MESSAGE";
      payload: {
        chatId: string;
        message: MessageData;
      };
    }
  | {
      type: "APPEND_MESSAGE_CONTENT";
      payload: {
        chatId: string;
        messageId: string;
        content: string;
      };
    }
  | {
      type: "SET_MESSAGE_CONTENT";
      payload: {
        chatId: string;
        messageId: string;
        content: string;
      };
    }
  | {
      type: "REMOVE_MESSAGE";
      payload: {
        chatId: string;
        messageId: string;
      };
    }
  | {
      type: "SET_LOADING";
      payload: boolean;
    }
  | {
      type: "SET_ERROR";
      payload: string | null;
    };
