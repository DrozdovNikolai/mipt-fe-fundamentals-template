import type { ModelOption, ScopeOption, SettingsData } from "../types/chat";

export const modelOptions: ModelOption[] = [
  "GigaChat-2",
  "GigaChat-2-Pro",
  "GigaChat-2-Max",
];

export const scopeOptions: ScopeOption[] = [
  "GIGACHAT_API_PERS",
  "GIGACHAT_API_B2B",
  "GIGACHAT_API_CORP",
];

export const defaultSettings: SettingsData = {
  model: "GigaChat-2-Pro",
  temperature: 0.7,
  topP: 0.85,
  maxTokens: 2048,
  repetitionPenalty: 1,
  systemPrompt:
    "You are a helpful assistant for a frontend developer. Answer clearly, structure UI suggestions, and keep examples concise.",
  theme: "light",
};
