export type MessageVariant = "user" | "assistant";
export type ThemeMode = "light" | "dark";
export type ScopeOption =
  | "GIGACHAT_API_PERS"
  | "GIGACHAT_API_B2B"
  | "GIGACHAT_API_CORP";
export type ModelOption =
  | "GigaChat"
  | "GigaChat-Plus"
  | "GigaChat-Pro"
  | "GigaChat-Max";

export interface MessageData {
  id: string;
  role: MessageVariant;
  author: string;
  content: string;
  createdAt: string;
}

export interface ChatData {
  id: string;
  title: string;
  updatedAt: string;
  preview: string;
  messages: MessageData[];
}

export interface SettingsData {
  model: ModelOption;
  temperature: number;
  topP: number;
  maxTokens: number;
  systemPrompt: string;
  theme: ThemeMode;
}

export interface AuthFormValues {
  credentials: string;
  scope: ScopeOption;
}
