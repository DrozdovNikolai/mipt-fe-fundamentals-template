import { useCallback, useDeferredValue, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useChatStore } from "../../app/providers/ChatProvider";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { ChatList } from "./ChatList";
import { SearchInput } from "./SearchInput";
import styles from "./Sidebar.module.css";

interface SidebarProps {
  onNavigate?: () => void;
}

const collapseWhitespace = (value: string) => value.replace(/\s+/g, " ").trim();

export function Sidebar({ onNavigate }: SidebarProps) {
  const navigate = useNavigate();
  const { state, createChat, deleteChat, renameChat, setActiveChatId } = useChatStore();
  const [searchValue, setSearchValue] = useState("");
  const deferredSearchValue = useDeferredValue(searchValue.trim().toLowerCase());

  const filteredChats = useMemo(
    () =>
      state.chats.filter((chat) => {
        if (!deferredSearchValue) {
          return true;
        }

        const lastMessageContent = collapseWhitespace(chat.messages[chat.messages.length - 1]?.content ?? "")
          .toLowerCase();

        return (
          chat.title.toLowerCase().includes(deferredSearchValue) ||
          lastMessageContent.includes(deferredSearchValue)
        );
      }),
    [deferredSearchValue, state.chats],
  );

  const handleSelectChat = useCallback((chatId: string) => {
    setActiveChatId(chatId);
    navigate(`/chat/${chatId}`);
    onNavigate?.();
  }, [navigate, onNavigate, setActiveChatId]);

  const handleNewChat = useCallback(() => {
    const chatId = createChat();
    navigate(`/chat/${chatId}`);
    onNavigate?.();
  }, [createChat, navigate, onNavigate]);

  const handleRenameChat = useCallback((chatId: string, title: string) => {
    renameChat(chatId, title);
  }, [renameChat]);

  const handleDeleteChat = useCallback((chatId: string) => {
    const chat = state.chats.find((item) => item.id === chatId);
    if (!chat) {
      return;
    }

    if (!window.confirm(`Удалить чат "${chat.title}"?`)) {
      return;
    }

    const isActiveChat = state.activeChatId === chatId;
    deleteChat(chatId);

    if (isActiveChat) {
      navigate("/", { replace: true });
    }

    onNavigate?.();
  }, [deleteChat, navigate, onNavigate, state.activeChatId, state.chats]);

  return (
    <section className={styles.sidebar}>
      <div className={styles.top}>
        <div>
          <p className={styles.eyebrow}>GigaChat Workspace</p>
          <h1 className={styles.title}>Мои диалоги</h1>
        </div>

        <Button onClick={handleNewChat} type="button">
          <Icon name="plus" size={18} />
          Новый чат
        </Button>
      </div>

      <SearchInput value={searchValue} onChange={setSearchValue} />

      <div className={styles.listWrap}>
        <ChatList
          activeChatId={state.activeChatId}
          chats={filteredChats}
          onDeleteChat={handleDeleteChat}
          onRenameChat={handleRenameChat}
          onSelectChat={handleSelectChat}
        />
      </div>

      <footer className={styles.footer}>
        <span>{filteredChats.length} чатов найдено</span>
        <span>GigaChat API • localStorage</span>
      </footer>
    </section>
  );
}
