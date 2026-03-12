import type { ChatData } from "../../types/chat";
import { Icon } from "../ui/Icon";
import styles from "./ChatItem.module.css";

interface ChatItemProps {
  chat: ChatData;
  active: boolean;
  onClick: () => void;
}

export function ChatItem({ chat, active, onClick }: ChatItemProps) {
  return (
    <button
      className={[styles.item, active ? styles.active : ""].filter(Boolean).join(" ")}
      onClick={onClick}
      type="button"
    >
      <div className={styles.row}>
        <h3 className={styles.title} title={chat.title}>
          {chat.title}
        </h3>
        <time className={styles.date}>{chat.updatedAt}</time>
      </div>

      <p className={styles.preview}>{chat.preview}</p>

      <div className={styles.actions}>
        <button
          aria-label="Редактировать чат"
          className={styles.iconButton}
          onClick={(event) => event.stopPropagation()}
          type="button"
        >
          <Icon name="edit" size={16} />
        </button>
        <button
          aria-label="Удалить чат"
          className={styles.iconButton}
          onClick={(event) => event.stopPropagation()}
          type="button"
        >
          <Icon name="trash" size={16} />
        </button>
      </div>
    </button>
  );
}
