import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultSettings } from "../data/mockData";
import type { ChatData } from "../types/chat";
import { loadPersistedChatState, savePersistedChatState } from "./storage";

const STORAGE_KEY = "gigachat-ui:chat-state";

const chat: ChatData = {
  id: "chat-1",
  title: "Сохраненный чат",
  updatedAt: "10:00",
  preview: "Привет",
  messages: [
    {
      id: "message-1",
      role: "user",
      content: "Привет",
      author: "Вы",
      createdAt: "10:00",
      timestamp: "2026-04-10T07:00:00.000Z",
    },
  ],
};

const createStorageMock = (initialStore: Record<string, string> = {}) => {
  let store = { ...initialStore };

  return {
    get length() {
      return Object.keys(store).length;
    },
    clear: vi.fn(() => {
      store = {};
    }),
    getItem: vi.fn((key: string) => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null)),
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
  } as Storage;
};

const installLocalStorageMock = (storage: Storage) => {
  vi.stubGlobal("localStorage", storage);
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: storage,
  });
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("storage", () => {
  it("saves persisted chat state to localStorage", () => {
    const localStorageMock = createStorageMock();
    const setItemSpy = vi.spyOn(localStorageMock, "setItem");
    installLocalStorageMock(localStorageMock);

    savePersistedChatState({
      chats: [chat],
      activeChatId: "chat-1",
      settings: defaultSettings,
    });

    expect(setItemSpy).toHaveBeenCalledTimes(1);
    expect(setItemSpy).toHaveBeenCalledWith(STORAGE_KEY, expect.any(String));
    expect(JSON.parse(setItemSpy.mock.calls[0][1])).toMatchObject({
      activeChatId: "chat-1",
      chats: [{ id: "chat-1", title: "Сохраненный чат" }],
      settings: defaultSettings,
    });
  });

  it("loads persisted chat state from localStorage", () => {
    installLocalStorageMock(
      createStorageMock({
        [STORAGE_KEY]: JSON.stringify({
          chats: [chat],
          activeChatId: "chat-1",
          settings: defaultSettings,
        }),
      }),
    );

    const state = loadPersistedChatState();

    expect(state?.activeChatId).toBe("chat-1");
    expect(state?.chats).toHaveLength(1);
    expect(state?.chats[0].title).toBe("Сохраненный чат");
    expect(state?.settings).toEqual(defaultSettings);
  });

  it("returns null and does not throw when localStorage contains broken JSON", () => {
    installLocalStorageMock(
      createStorageMock({
        [STORAGE_KEY]: "{broken-json",
      }),
    );

    expect(() => loadPersistedChatState()).not.toThrow();
    expect(loadPersistedChatState()).toBeNull();
  });

  it("filters legacy seeded chats from persisted state", () => {
    installLocalStorageMock(
      createStorageMock({
        [STORAGE_KEY]: JSON.stringify({
          chats: [
            {
              id: "chat-001",
              title: "Legacy demo chat",
              updatedAt: "Сейчас",
              preview: "Demo",
              messages: [],
            },
            chat,
          ],
          activeChatId: "chat-1",
          settings: defaultSettings,
        }),
      }),
    );

    const state = loadPersistedChatState();

    expect(state?.chats).toHaveLength(1);
    expect(state?.chats[0].id).toBe("chat-1");
  });
});
