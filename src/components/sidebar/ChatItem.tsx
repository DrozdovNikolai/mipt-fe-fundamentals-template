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
    <li className={[styles.item, active ? styles.active : ""].filter(Boolean).join(" ")}>
      <button className={styles.trigger} onClick={onClick} type="button">
        <span className={styles.row}>
          <span className={styles.title} title={chat.title}>
            {chat.title}
          </span>
          <time className={styles.date}>{chat.updatedAt}</time>
        </span>

        <span className={styles.preview}>{chat.preview}</span>
      </button>

      <div className={styles.actions}>
        <button aria-label="Редактировать чат" className={styles.iconButton} type="button">
          <Icon name="edit" size={16} />
        </button>
        <button aria-label="Удалить чат" className={styles.iconButton} type="button">
          <Icon name="trash" size={16} />
        </button>
      </div>
    </li>
  );
}
