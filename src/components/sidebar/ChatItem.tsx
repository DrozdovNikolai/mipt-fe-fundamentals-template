import { useEffect, useState } from "react";
import type { ChatData } from "../../types/chat";
import { Icon } from "../ui/Icon";
import styles from "./ChatItem.module.css";

interface ChatItemProps {
  chat: ChatData;
  active: boolean;
  onDelete: (chatId: string) => void;
  onRename: (chatId: string, title: string) => void;
  onClick: () => void;
}

export function ChatItem({ chat, active, onDelete, onRename, onClick }: ChatItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(chat.title);

  useEffect(() => {
    if (!isEditing) {
      setDraftTitle(chat.title);
    }
  }, [chat.title, isEditing]);

  const handleRenameSubmit = () => {
    const nextTitle = draftTitle.trim();
    if (!nextTitle) {
      return;
    }

    onRename(chat.id, nextTitle);
    setIsEditing(false);
  };

  const handleCancelRename = () => {
    setDraftTitle(chat.title);
    setIsEditing(false);
  };

  return (
    <li
      className={[
        styles.item,
        active ? styles.active : "",
        isEditing ? styles.editing : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {isEditing ? (
        <div className={styles.trigger}>
          <div className={styles.editor}>
            <div className={styles.row}>
              <input
                autoFocus
                className={styles.editorInput}
                onChange={(event) => setDraftTitle(event.currentTarget.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleRenameSubmit();
                  }

                  if (event.key === "Escape") {
                    event.preventDefault();
                    handleCancelRename();
                  }
                }}
                value={draftTitle}
              />
              <time className={styles.date}>{chat.updatedAt}</time>
            </div>

            <span className={styles.preview}>{chat.preview}</span>
          </div>
        </div>
      ) : (
        <button className={styles.trigger} onClick={onClick} type="button">
          <span className={styles.row}>
            <span className={styles.title} title={chat.title}>
              {chat.title}
            </span>
            <time className={styles.date}>{chat.updatedAt}</time>
          </span>

          <span className={styles.preview}>{chat.preview}</span>
        </button>
      )}

      <div className={styles.actions}>
        {isEditing ? (
          <>
            <button
              aria-label="Сохранить название"
              className={styles.iconButton}
              onClick={handleRenameSubmit}
              type="button"
            >
              <Icon name="check" size={16} />
            </button>
            <button
              aria-label="Отменить редактирование"
              className={styles.iconButton}
              onClick={handleCancelRename}
              type="button"
            >
              <Icon name="close" size={16} />
            </button>
          </>
        ) : (
          <>
            <button
              aria-label="Редактировать чат"
              className={styles.iconButton}
              onClick={() => setIsEditing(true)}
              type="button"
            >
              <Icon name="edit" size={16} />
            </button>
            <button
              aria-label="Удалить чат"
              className={styles.iconButton}
              onClick={() => onDelete(chat.id)}
              type="button"
            >
              <Icon name="trash" size={16} />
            </button>
          </>
        )}
      </div>
    </li>
  );
}
