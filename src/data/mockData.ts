import type { ChatData, ModelOption, ScopeOption, SettingsData } from "../types/chat";

export const modelOptions: ModelOption[] = [
  "GigaChat",
  "GigaChat-Plus",
  "GigaChat-Pro",
  "GigaChat-Max",
];

export const scopeOptions: ScopeOption[] = [
  "GIGACHAT_API_PERS",
  "GIGACHAT_API_B2B",
  "GIGACHAT_API_CORP",
];

export const defaultSettings: SettingsData = {
  model: "GigaChat-Pro",
  temperature: 0.7,
  topP: 0.85,
  maxTokens: 2048,
  systemPrompt:
    "You are a helpful assistant for a frontend developer. Answer clearly, structure UI suggestions, and keep examples concise.",
  theme: "light",
};

export const mockChats: ChatData[] = [
  {
    id: "chat-001",
    title: "Каркас итогового интерфейса GigaChat для дипломного проекта",
    updatedAt: "11 мар",
    preview: "Могу помочь разложить экран на отдельные React-компоненты.",
    messages: [
      {
        id: "msg-001",
        role: "assistant",
        author: "GigaChat",
        createdAt: "09:12",
        content:
          "Соберем **UI-оболочку** без API, чтобы потом спокойно подключить реальную логику.",
      },
      {
        id: "msg-002",
        role: "user",
        author: "Вы",
        createdAt: "09:13",
        content:
          "Нужен layout: sidebar слева, чат справа. И важно, чтобы все выглядело аккуратно и адаптивно.",
      },
      {
        id: "msg-003",
        role: "assistant",
        author: "GigaChat",
        createdAt: "09:14",
        content:
          "Тогда разбиваем интерфейс на блоки:\n\n- `Sidebar`\n- `ChatWindow`\n- `InputArea`\n- `SettingsPanel`",
      },
      {
        id: "msg-004",
        role: "user",
        author: "Вы",
        createdAt: "09:15",
        content:
          "И еще нужен markdown в сообщениях: **жирный**, *курсив*, списки и кодовые блоки.",
      },
      {
        id: "msg-005",
        role: "assistant",
        author: "GigaChat",
        createdAt: "09:16",
        content:
          "Под это подойдет `react-markdown`.\n\n```tsx\n<Message variant=\"assistant\" text={markdown} />\n```",
      },
      {
        id: "msg-006",
        role: "user",
        author: "Вы",
        createdAt: "09:18",
        content:
          "Отлично. Добавь еще авторизацию, настройки модели и индикатор набора ответа.",
      },
    ],
  },
  {
    id: "chat-002",
    title: "Список задач по frontend-модулю",
    updatedAt: "10 мар",
    preview: "Собрать моковые данные и продумать пользовательские состояния.",
    messages: [
      {
        id: "msg-101",
        role: "assistant",
        author: "GigaChat",
        createdAt: "18:20",
        content: "Подготовил список экранов и обязательных компонентов.",
      },
    ],
  },
  {
    id: "chat-003",
    title: "Подбор визуального стиля для чат-приложения",
    updatedAt: "09 мар",
    preview: "Лучше использовать спокойный фон и контрастные акценты.",
    messages: [
      {
        id: "msg-201",
        role: "assistant",
        author: "GigaChat",
        createdAt: "13:04",
        content: "Можно сделать интерфейс светлым днем и темным вечером.",
      },
    ],
  },
  {
    id: "chat-004",
    title: "Очень длинное название чата, чтобы проверить переполнение и ellipsis в списке",
    updatedAt: "08 мар",
    preview: "Проверяем, что длинный текст не ломает строку в sidebar.",
    messages: [
      {
        id: "msg-301",
        role: "assistant",
        author: "GigaChat",
        createdAt: "11:48",
        content: "Название должно оставаться в одну строку и корректно обрезаться.",
      },
    ],
  },
  {
    id: "chat-005",
    title: "Идеи для системного промпта",
    updatedAt: "07 мар",
    preview: "Нужно уточнить тон ответа, формат и ограничения для ассистента.",
    messages: [
      {
        id: "msg-401",
        role: "assistant",
        author: "GigaChat",
        createdAt: "15:30",
        content: "Опиши роль, стиль ответа и желаемый формат вывода.",
      },
    ],
  },
  {
    id: "chat-006",
    title: "Новый диалог",
    updatedAt: "Сейчас",
    preview: "Сообщений пока нет.",
    messages: [],
  },
];
