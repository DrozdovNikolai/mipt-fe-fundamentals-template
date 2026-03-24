import type { MessageData } from "../../types/chat";
import { EmptyState } from "../ui/EmptyState";
import { ErrorMessage } from "../ui/ErrorMessage";
import { Icon } from "../ui/Icon";
import { Button } from "../ui/Button";
import { InputArea } from "./InputArea";
import { MessageList } from "./MessageList";
import styles from "./ChatWindow.module.css";

interface ChatWindowProps {
  title: string;
  messages: MessageData[];
  isLoading: boolean;
  error: Error | null;
  onSubmitMessage: (content: string) => void | Promise<void>;
  onStop: () => void;
  onReload: () => void | Promise<void>;
  onOpenSettings: () => void;
  onOpenSidebar: () => void;
  showTyping: boolean;
}

export function ChatWindow({
  title,
  messages,
  isLoading,
  error,
  onSubmitMessage,
  onStop,
  onReload,
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
            <h2 className={styles.title}>{title}</h2>
          </div>
        </div>

        <Button onClick={onOpenSettings} type="button" variant="secondary">
          <Icon name="settings" size={18} />
          Настройки
        </Button>
      </header>

      <div className={styles.content}>
        {messages.length ? (
          <MessageList messages={messages} showTyping={showTyping} />
        ) : (
          <EmptyState />
        )}
      </div>

      {error ? <ErrorMessage message={error.message} /> : null}

      <InputArea
        hasError={Boolean(error)}
        isLoading={isLoading}
        onReload={onReload}
        onStop={onStop}
        onSubmitMessage={onSubmitMessage}
      />
    </section>
  );
}
