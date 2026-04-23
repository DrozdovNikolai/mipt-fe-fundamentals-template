import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ChatProvider, useChatStore } from "./ChatProvider";
import { requestAssistantCompletion } from "../../api/gigachat";

vi.mock("../../api/gigachat", () => ({
  requestAssistantCompletion: vi.fn(),
  uploadAttachment: vi.fn(),
}));

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

const installStorageMock = (storageName: "localStorage" | "sessionStorage", storage: Storage) => {
  vi.stubGlobal(storageName, storage);
  Object.defineProperty(window, storageName, {
    configurable: true,
    value: storage,
  });
};

function StopConsumer() {
  const { activeChat, login, sendMessage, state, stopGeneration } = useChatStore();

  return (
    <>
      <button
        onClick={() => {
          login({
            credentials: "test-credentials",
            scope: "GIGACHAT_API_PERS",
          });
        }}
        type="button"
      >
        Войти
      </button>
      <button
        onClick={() => {
          void sendMessage("Сгенерируй длинный ответ");
        }}
        type="button"
      >
        Отправить
      </button>
      <button onClick={stopGeneration} type="button">
        Стоп
      </button>
      <span data-testid="loading">{String(state.isLoading)}</span>
      <div data-testid="messages">
        {activeChat?.messages.map((message) => `${message.role}:${message.content}`).join("|") ?? ""}
      </div>
    </>
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("ChatProvider stopGeneration", () => {
  it("keeps the streamed assistant text when generation is stopped", async () => {
    installStorageMock("localStorage", createStorageMock());
    installStorageMock("sessionStorage", createStorageMock());

    vi.mocked(requestAssistantCompletion).mockImplementation(async ({ onChunk, signal }) => {
      onChunk?.("Часть ответа");

      return new Promise<string>((_, reject) => {
        signal?.addEventListener(
          "abort",
          () => {
            reject(new DOMException("Aborted", "AbortError"));
          },
          { once: true },
        );
      });
    });

    render(
      <ChatProvider>
        <StopConsumer />
      </ChatProvider>,
    );

    await act(async () => {
      screen.getByRole("button", { name: "Войти" }).click();
    });

    await act(async () => {
      screen.getByRole("button", { name: "Отправить" }).click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("messages")).toHaveTextContent("assistant:Часть ответа");
      expect(screen.getByTestId("loading")).toHaveTextContent("true");
    });

    await act(async () => {
      screen.getByRole("button", { name: "Стоп" }).click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
      expect(screen.getByTestId("messages")).toHaveTextContent("assistant:Часть ответа");
    });
  });
});
