import { useState } from "react";
import styles from "./App.module.css";
import { AuthForm } from "./components/auth/AuthForm";
import { ChatSession } from "./components/chat/ChatSession";
import { AppLayout } from "./components/layout/AppLayout";
import { SettingsPanel } from "./components/settings/SettingsPanel";
import { Sidebar } from "./components/sidebar/Sidebar";
import { defaultSettings, mockChats } from "./data/mockData";
import type { Message as ChatMessage } from "./hooks/useChat";
import type { AuthFormValues, ChatData, MessageData, SettingsData } from "./types/chat";

const EMPTY_CHAT_ID = "chat-006";
const CHAT_API_URL = "/api/chat";

const collapseWhitespace = (value: string) => value.replace(/\s+/g, " ").trim();

const truncateText = (value: string, maxLength: number) =>
  value.length <= maxLength ? value : `${value.slice(0, maxLength - 1).trimEnd()}…`;

const formatCreatedAt = (date?: Date) => {
  if (!date) {
    return "Сейчас";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const resolveAuthor = (role: ChatMessage["role"]) => {
  if (role === "user") {
    return "Вы";
  }

  if (role === "system") {
    return "System";
  }

  return "GigaChat";
};

const isRenderableMessage = (
  message: ChatMessage,
): message is ChatMessage & { role: "user" | "assistant" } =>
  message.role !== "system" && (message.role !== "assistant" || collapseWhitespace(message.content).length > 0);

const buildPreview = (messages: MessageData[]) => {
  const lastMessage = [...messages]
    .reverse()
    .find((message) => collapseWhitespace(message.content).length > 0);

  if (!lastMessage) {
    return "Сообщений пока нет.";
  }

  return truncateText(collapseWhitespace(lastMessage.content), 76);
};

const buildTitle = (chat: ChatData, messages: MessageData[]) => {
  if (chat.id !== EMPTY_CHAT_ID) {
    return chat.title;
  }

  const firstUserMessage = messages.find(
    (message) => message.role === "user" && collapseWhitespace(message.content).length > 0,
  );

  if (!firstUserMessage) {
    return "Новый диалог";
  }

  return truncateText(collapseWhitespace(firstUserMessage.content), 42);
};

const toUiMessages = (existingMessages: MessageData[], nextMessages: ChatMessage[]) => {
  const existingById = new Map(existingMessages.map((message) => [message.id, message]));

  return nextMessages
    .filter(isRenderableMessage)
    .map<MessageData>((message) => {
      const existingMessage = existingById.get(message.id);

      return {
        id: message.id,
        role: message.role,
        author: existingMessage?.author ?? resolveAuthor(message.role),
        content: message.content,
        createdAt: existingMessage?.createdAt ?? formatCreatedAt(message.createdAt),
      };
    });
};

const buildEmptyChat = (): ChatData => ({
  id: EMPTY_CHAT_ID,
  title: "Новый диалог",
  updatedAt: "Сейчас",
  preview: "Сообщений пока нет.",
  messages: [],
});

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [chats, setChats] = useState<ChatData[]>(mockChats);
  const [searchValue, setSearchValue] = useState("");
  const [activeChatId, setActiveChatId] = useState(mockChats[0].id);
  const [chatViewKey, setChatViewKey] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState(defaultSettings);
  const [draftSettings, setDraftSettings] = useState<SettingsData>(defaultSettings);

  const filteredChats = chats.filter((chat) => {
    const normalizedQuery = searchValue.trim().toLowerCase();
    if (!normalizedQuery) {
      return true;
    }

    return (
      chat.title.toLowerCase().includes(normalizedQuery) ||
      chat.preview.toLowerCase().includes(normalizedQuery)
    );
  });

  const activeChat = chats.find((chat) => chat.id === activeChatId) ?? chats[0] ?? buildEmptyChat();

  const handleLogin = (_values: AuthFormValues) => {
    setIsAuthenticated(true);
  };

  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
    setChatViewKey((currentKey) => currentKey + 1);
    setIsSidebarOpen(false);
  };

  const handleNewChat = () => {
    setSearchValue("");
    setChats((currentChats) =>
      currentChats.map((chat) => (chat.id === EMPTY_CHAT_ID ? buildEmptyChat() : chat)),
    );
    setActiveChatId(EMPTY_CHAT_ID);
    setChatViewKey((currentKey) => currentKey + 1);
    setIsSidebarOpen(false);
  };

  const openSettings = () => {
    setDraftSettings(settings);
    setIsSettingsOpen(true);
  };

  const closeSettings = () => {
    setDraftSettings(settings);
    setIsSettingsOpen(false);
  };

  const saveSettings = () => {
    setSettings(draftSettings);
    setIsSettingsOpen(false);
  };

  const resetSettings = () => {
    setDraftSettings(defaultSettings);
  };

  const syncChatMessages = (chatId: string, nextMessages: ChatMessage[]) => {
    setChats((currentChats) =>
      currentChats.map((chat) => {
        if (chat.id !== chatId) {
          return chat;
        }

        const messages = toUiMessages(chat.messages, nextMessages);
        const lastMessage = messages[messages.length - 1];

        return {
          ...chat,
          title: buildTitle(chat, messages),
          updatedAt: lastMessage?.createdAt ?? "Сейчас",
          preview: buildPreview(messages),
          messages,
        };
      }),
    );
  };

  return (
    <div className={styles.appRoot} data-theme={settings.theme}>
      {!isAuthenticated ? (
        <AuthForm onSubmit={handleLogin} />
      ) : (
        <>
          <AppLayout
            isSidebarOpen={isSidebarOpen}
            onCloseSidebar={() => setIsSidebarOpen(false)}
            sidebar={
              <Sidebar
                chats={filteredChats}
                activeChatId={activeChatId}
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                onNewChat={handleNewChat}
                onSelectChat={handleSelectChat}
              />
            }
          >
            <ChatSession
              api={CHAT_API_URL}
              chat={activeChat}
              key={`${activeChat.id}-${chatViewKey}`}
              onMessagesChange={syncChatMessages}
              onOpenSettings={openSettings}
              onOpenSidebar={() => setIsSidebarOpen(true)}
            />
          </AppLayout>
          <SettingsPanel
            isOpen={isSettingsOpen}
            settings={draftSettings}
            onChange={setDraftSettings}
            onClose={closeSettings}
            onSave={saveSettings}
            onReset={resetSettings}
          />
        </>
      )}
    </div>
  );
}

export default App;
