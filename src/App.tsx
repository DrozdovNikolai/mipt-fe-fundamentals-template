import { useState } from "react";
import styles from "./App.module.css";
import { AuthForm } from "./components/auth/AuthForm";
import { ChatWindow } from "./components/chat/ChatWindow";
import { AppLayout } from "./components/layout/AppLayout";
import { SettingsPanel } from "./components/settings/SettingsPanel";
import { Sidebar } from "./components/sidebar/Sidebar";
import { defaultSettings, mockChats } from "./data/mockData";
import type { AuthFormValues, SettingsData } from "./types/chat";

const EMPTY_CHAT_ID = "chat-006";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [activeChatId, setActiveChatId] = useState(mockChats[0].id);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState(defaultSettings);
  const [draftSettings, setDraftSettings] = useState<SettingsData>(defaultSettings);
  const [inputValue, setInputValue] = useState("");

  const filteredChats = mockChats.filter((chat) => {
    const normalizedQuery = searchValue.trim().toLowerCase();
    if (!normalizedQuery) {
      return true;
    }

    return (
      chat.title.toLowerCase().includes(normalizedQuery) ||
      chat.preview.toLowerCase().includes(normalizedQuery)
    );
  });

  const activeChat = mockChats.find((chat) => chat.id === activeChatId) ?? mockChats[0];

  const handleLogin = (_values: AuthFormValues) => {
    setIsAuthenticated(true);
  };

  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
    setIsSidebarOpen(false);
  };

  const handleNewChat = () => {
    setSearchValue("");
    setActiveChatId(EMPTY_CHAT_ID);
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

  const handleSubmitMessage = (value: string) => {
    if (!value.trim()) {
      return;
    }

    setInputValue("");
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
            <ChatWindow
              chat={activeChat}
              inputValue={inputValue}
              onInputChange={setInputValue}
              onInputSubmit={handleSubmitMessage}
              onOpenSettings={openSettings}
              onOpenSidebar={() => setIsSidebarOpen(true)}
              showTyping={activeChat.messages.length > 0}
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
