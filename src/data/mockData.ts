import type { ModelOption, ScopeOption, SettingsData } from "../types/chat";

type ModelPreset = Pick<
  SettingsData,
  "samplingMode" | "temperature" | "topP" | "maxTokens" | "repetitionPenalty"
>;

type ModelProfile = {
  description: string;
  preset: ModelPreset;
};

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
  samplingMode: "temperature",
  temperature: 0.7,
  topP: 0.85,
  maxTokens: 2048,
  repetitionPenalty: 1,
  systemPrompt:
    "You are a helpful assistant for a frontend developer. Answer clearly, structure UI suggestions, and keep examples concise.",
  theme: "light",
};

const modelProfiles: Record<string, ModelProfile> = {
  "GigaChat-2": {
    description: "Быстрая и более экономичная модель для простых сценариев и частых запросов.",
    preset: {
      samplingMode: "temperature",
      temperature: 0.55,
      topP: 0.8,
      maxTokens: 1536,
      repetitionPenalty: 1.05,
    },
  },
  "GigaChat-2-Pro": {
    description: "Сбалансированная модель для рабочих диалогов, редактирования и сложных инструкций.",
    preset: {
      samplingMode: "temperature",
      temperature: 0.7,
      topP: 0.85,
      maxTokens: 2048,
      repetitionPenalty: 1,
    },
  },
  "GigaChat-2-Max": {
    description: "Продвинутая модель для сложных задач, длинного контекста и более креативных ответов.",
    preset: {
      samplingMode: "temperature",
      temperature: 0.9,
      topP: 0.9,
      maxTokens: 3072,
      repetitionPenalty: 1,
    },
  },
};

export const getModelSettingsPreset = (model: string) => modelProfiles[model]?.preset ?? null;

export const getModelDescription = (model: string) => modelProfiles[model]?.description ?? "";
