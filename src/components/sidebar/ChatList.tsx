import type { ChatData } from "../../types/chat";
import { ChatItem } from "./ChatItem";
import styles from "./ChatList.module.css";

interface ChatListProps {
  chats: ChatData[];
  activeChatId: string;
  onSelectChat: (chatId: string) => void;
}

export function ChatList({ chats, activeChatId, onSelectChat }: ChatListProps) {
  if (!chats.length) {
    return (
      <div className={styles.empty}>
        <p>Ничего не найдено.</p>
        <span>Попробуйте другой запрос или создайте новый чат.</span>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {chats.map((chat) => (
        <ChatItem
          active={chat.id === activeChatId}
          chat={chat}
          key={chat.id}
          onClick={() => onSelectChat(chat.id)}
        />
      ))}
    </div>
  );
}
