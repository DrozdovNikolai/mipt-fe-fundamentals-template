import type { ChatData } from "../../types/chat";
import { EmptyState } from "../ui/EmptyState";
import { Icon } from "../ui/Icon";
import { Button } from "../ui/Button";
import { InputArea } from "./InputArea";
import { MessageList } from "./MessageList";
import styles from "./ChatWindow.module.css";

interface ChatWindowProps {
  chat: ChatData;
  inputValue: string;
  onInputChange: (value: string) => void;
  onInputSubmit: (value: string) => void;
  onOpenSettings: () => void;
  onOpenSidebar: () => void;
  showTyping: boolean;
}

export function ChatWindow({
  chat,
  inputValue,
  onInputChange,
  onInputSubmit,
  onOpenSettings,
  onOpenSidebar,
  showTyping,
}: ChatWindowProps) {
  return (
    <section className={styles.window}>
      <header className={styles.header}>
        <div className={styles.headerMain}>
          <Button
            aria-label="Открыть список чатов"
            className={styles.burger}
            onClick={onOpenSidebar}
            type="button"
            variant="icon"
          >
            <Icon name="menu" size={18} />
          </Button>

          <div>
            <p className={styles.meta}>Текущий чат</p>
            <h2 className={styles.title}>{chat.title}</h2>
          </div>
        </div>

        <Button onClick={onOpenSettings} type="button" variant="secondary">
          <Icon name="settings" size={18} />
          Настройки
        </Button>
      </header>

      <div className={styles.content}>
        {chat.messages.length ? (
          <MessageList messages={chat.messages} showTyping={showTyping} />
        ) : (
          <EmptyState />
        )}
      </div>

      <InputArea value={inputValue} onChange={onInputChange} onSubmit={onInputSubmit} />
    </section>
  );
}
