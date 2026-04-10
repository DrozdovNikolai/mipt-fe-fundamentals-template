import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi, afterEach } from "vitest";
import { defaultSettings } from "../../data/mockData";
import type { ChatData, ChatState, MessageData } from "../../types/chat";
import { Sidebar } from "./Sidebar";

const providerMock = vi.hoisted(() => ({
  useChatStore: vi.fn(),
}));

vi.mock("../../app/providers/ChatProvider", () => ({
  useChatStore: providerMock.useChatStore,
}));

const buildMessage = (id: string, content: string): MessageData => ({
  id,
  role: "user",
  content,
  author: "Вы",
  createdAt: "10:00",
  timestamp: "2026-04-10T07:00:00.000Z",
});

const chats: ChatData[] = [
  {
    id: "react",
    title: "React roadmap",
    updatedAt: "10:00",
    preview: "Компоненты и хуки",
    messages: [buildMessage("message-1", "Компоненты и хуки")],
  },
  {
    id: "design",
    title: "Design system",
    updatedAt: "11:00",
    preview: "Токены и кнопки",
    messages: [buildMessage("message-2", "Токены и кнопки")],
  },
  {
    id: "api",
    title: "GigaChat API",
    updatedAt: "12:00",
    preview: "Streaming responses",
    messages: [buildMessage("message-3", "Streaming responses")],
  },
];

const buildState = (stateChats = chats): ChatState => ({
  chats: stateChats,
  activeChatId: "react",
  isLoading: false,
  error: null,
  authSession: null,
  settings: defaultSettings,
});

const renderSidebar = () => {
  const store = {
    state: buildState(),
    createChat: vi.fn(() => "new-chat"),
    deleteChat: vi.fn(),
    renameChat: vi.fn(),
    setActiveChatId: vi.fn(),
  };

  providerMock.useChatStore.mockReturnValue(store);

  render(
    <MemoryRouter>
      <Sidebar />
    </MemoryRouter>,
  );

  return store;
};

afterEach(() => {
  vi.restoreAllMocks();
  providerMock.useChatStore.mockReset();
});

describe("Sidebar", () => {
  it("renders all chats when search query is empty", () => {
    renderSidebar();

    expect(screen.getByText("React roadmap")).not.toBeNull();
    expect(screen.getByText("Design system")).not.toBeNull();
    expect(screen.getByText("GigaChat API")).not.toBeNull();
  });

  it("filters chats by title while typing in search", async () => {
    const user = userEvent.setup();
    renderSidebar();

    await user.type(screen.getByPlaceholderText("Поиск по чатам"), "design");

    await waitFor(() => {
      expect(screen.getByText("Design system")).not.toBeNull();
      expect(screen.queryByText("React roadmap")).toBeNull();
      expect(screen.queryByText("GigaChat API")).toBeNull();
    });
  });

  it("asks for confirmation when Delete chat button is clicked", async () => {
    const user = userEvent.setup();
    const store = renderSidebar();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    await user.click(screen.getAllByLabelText("Удалить чат")[0]);

    expect(confirmSpy).toHaveBeenCalledWith('Удалить чат "React roadmap"?');
    expect(store.deleteChat).toHaveBeenCalledWith("react");
  });
});
