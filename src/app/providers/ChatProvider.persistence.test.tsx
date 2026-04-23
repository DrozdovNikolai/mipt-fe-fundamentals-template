import { act, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, afterEach } from "vitest";
import { defaultSettings } from "../../data/mockData";
import { ChatProvider, useChatStore } from "./ChatProvider";

vi.mock("../../api/gigachat", () => ({
  requestAssistantCompletion: vi.fn(),
}));

const CHAT_STATE_STORAGE_KEY = "gigachat-ui:chat-state";

const createStorageMock = () => {
  const store: Record<string, string> = {};

  return {
    get length() {
      return Object.keys(store).length;
    },
    clear: vi.fn(() => {
      for (const key of Object.keys(store)) {
        delete store[key];
      }
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

const installStorageMock = (storageName: "localStorage" | "sessionStorage", storage: Storage) => {
  vi.stubGlobal(storageName, storage);
  Object.defineProperty(window, storageName, {
    configurable: true,
    value: storage,
  });
};

function StoreConsumer() {
  const { createChat, state } = useChatStore();

  return (
    <>
      <span data-testid="chat-count">{state.chats.length}</span>
      <button onClick={createChat} type="button">
        Создать чат
      </button>
    </>
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("ChatProvider persistence", () => {
  it("saves chat state to localStorage after a store state change", async () => {
    const localStorageMock = createStorageMock();
    installStorageMock("localStorage", localStorageMock);
    installStorageMock("sessionStorage", createStorageMock());

    render(
      <ChatProvider>
        <StoreConsumer />
      </ChatProvider>,
    );

    const initialChatCount = Number(screen.getByTestId("chat-count").textContent);

    await act(async () => {
      screen.getByRole("button", { name: "Создать чат" }).click();
    });

    expect(screen.getByTestId("chat-count")).toHaveTextContent(String(initialChatCount + 1));

    await waitFor(() => {
      const savedPayloads = vi.mocked(localStorageMock.setItem).mock.calls
        .filter(([key]) => key === CHAT_STATE_STORAGE_KEY)
        .map(([, value]) => JSON.parse(value) as { chats: unknown[]; settings: unknown });
      const lastPayload = savedPayloads[savedPayloads.length - 1];

      expect(lastPayload.chats).toHaveLength(initialChatCount + 1);
      expect(lastPayload.settings).toEqual(defaultSettings);
    });
  });
});
