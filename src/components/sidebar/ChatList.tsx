import type { ChatData } from "../../types/chat";
import { ChatItem } from "./ChatItem";
import styles from "./ChatList.module.css";

interface ChatListProps {
  chats: ChatData[];
  activeChatId: string | null;
  onDeleteChat: (chatId: string) => void;
  onRenameChat: (chatId: string, title: string) => void;
  onSelectChat: (chatId: string) => void;
}

export function ChatList({
  chats,
  activeChatId,
  onDeleteChat,
  onRenameChat,
  onSelectChat,
}: ChatListProps) {
  if (!chats.length) {
    return (
      <div className={styles.empty}>
        <p>Ничего не найдено.</p>
        <span>Попробуйте другой запрос или создайте новый чат.</span>
      </div>
    );
  }

  return (
    <ul className={styles.list}>
      {chats.map((chat) => (
        <ChatItem
          active={chat.id === activeChatId}
          chat={chat}
          key={chat.id}
          onDelete={onDeleteChat}
          onRename={onRenameChat}
          onClick={() => onSelectChat(chat.id)}
        />
      ))}
    </ul>
  );
}
