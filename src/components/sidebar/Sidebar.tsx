import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import type { ChatData } from "../../types/chat";
import { ChatList } from "./ChatList";
import { SearchInput } from "./SearchInput";
import styles from "./Sidebar.module.css";

interface SidebarProps {
  chats: ChatData[];
  activeChatId: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onNewChat: () => void;
  onSelectChat: (chatId: string) => void;
}

export function Sidebar({
  chats,
  activeChatId,
  searchValue,
  onSearchChange,
  onNewChat,
  onSelectChat,
}: SidebarProps) {
  return (
    <section className={styles.sidebar}>
      <div className={styles.top}>
        <div>
          <p className={styles.eyebrow}>GigaChat Workspace</p>
          <h1 className={styles.title}>Мои диалоги</h1>
        </div>

        <Button onClick={onNewChat} type="button">
          <Icon name="plus" size={18} />
          Новый чат
        </Button>
      </div>

      <SearchInput value={searchValue} onChange={onSearchChange} />

      <div className={styles.listWrap}>
        <ChatList chats={chats} activeChatId={activeChatId} onSelectChat={onSelectChat} />
      </div>

      <footer className={styles.footer}>
        <span>{chats.length} чатов найдено</span>
        <span>Streaming mock /api/chat</span>
      </footer>
    </section>
  );
}
