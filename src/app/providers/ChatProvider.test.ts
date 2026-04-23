import { describe, expect, it, vi } from "vitest";
import { defaultSettings } from "../../data/mockData";
import type { ChatData, ChatState, MessageData } from "../../types/chat";
import { chatReducer } from "./ChatProvider";

vi.mock("../../api/gigachat", () => ({
  requestAssistantCompletion: vi.fn(),
}));

const buildMessage = (id: string, content: string, role: MessageData["role"] = "user"): MessageData => ({
  id,
  role,
  content,
  author: role === "assistant" ? "GigaChat" : "Вы",
  createdAt: "10:00",
  timestamp: "2026-04-10T07:00:00.000Z",
});

const buildChat = (id: string, title: string, messages: MessageData[] = []): ChatData => ({
  id,
  title,
  isTitleGenerated: false,
  updatedAt: "10:00",
  preview: messages[messages.length - 1]?.content ?? "Сообщений пока нет.",
  messages,
});

const buildState = (overrides: Partial<ChatState> = {}): ChatState => ({
  chats: [buildChat("chat-1", "Первый чат", [buildMessage("message-1", "Привет")])],
  activeChatId: "chat-1",
  isLoading: false,
  error: null,
  authSession: null,
  settings: defaultSettings,
  ...overrides,
});

describe("chatReducer", () => {
  it("APPEND_MESSAGE adds a message to the end of the selected chat", () => {
    const state = buildState();
    const message = buildMessage("message-2", "Новое сообщение");

    const nextState = chatReducer(state, {
      type: "APPEND_MESSAGE",
      payload: {
        chatId: "chat-1",
        message,
      },
    });

    expect(nextState.chats[0].messages).toHaveLength(2);
    expect(nextState.chats[0].messages[nextState.chats[0].messages.length - 1]).toEqual(message);
  });

  it("CREATE_CHAT inserts a new chat and makes it active", () => {
    const state = buildState();
    const chat = buildChat("chat-2", "Новый чат");

    const nextState = chatReducer(state, {
      type: "CREATE_CHAT",
      payload: chat,
    });

    expect(nextState.chats).toHaveLength(2);
    expect(nextState.chats[0].id).toBe("chat-2");
    expect(nextState.chats[0].id).not.toBe(state.chats[0].id);
    expect(nextState.activeChatId).toBe("chat-2");
  });

  it("DELETE_CHAT removes a chat and resets activeChatId for the deleted active chat", () => {
    const state = buildState({
      chats: [
        buildChat("chat-1", "Первый чат"),
        buildChat("chat-2", "Второй чат"),
      ],
      activeChatId: "chat-1",
    });

    const nextState = chatReducer(state, {
      type: "DELETE_CHAT",
      payload: {
        chatId: "chat-1",
      },
    });

    expect(nextState.chats.map((chat) => chat.id)).toEqual(["chat-2"]);
    expect(nextState.activeChatId).toBeNull();
  });

  it("RENAME_CHAT updates only the selected chat title", () => {
    const state = buildState({
      chats: [
        buildChat("chat-1", "Старое название"),
        buildChat("chat-2", "Без изменений"),
      ],
    });

    const nextState = chatReducer(state, {
      type: "RENAME_CHAT",
      payload: {
        chatId: "chat-1",
        title: "  Новое название  ",
      },
    });

    expect(nextState.chats.find((chat) => chat.id === "chat-1")?.title).toBe("Новое название");
    expect(nextState.chats.find((chat) => chat.id === "chat-2")?.title).toBe("Без изменений");
  });
});
