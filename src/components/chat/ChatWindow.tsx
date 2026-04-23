import { useCallback } from "react";
import { useChatStore } from "../../app/providers/ChatProvider";
import { useLocation, useNavigate } from "react-router-dom";
import { EmptyState } from "../ui/EmptyState";
import { ErrorBoundary } from "../ui/ErrorBoundary";
import { ErrorMessage } from "../ui/ErrorMessage";
import { Icon } from "../ui/Icon";
import { Button } from "../ui/Button";
import { InputArea } from "./InputArea";
import { MessageList } from "./MessageList";
import styles from "./ChatWindow.module.css";

interface ChatWindowProps {
  onOpenSettings: () => void;
  onOpenSidebar: () => void;
}

export function ChatWindow({
  onOpenSettings,
  onOpenSidebar,
}: ChatWindowProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeChat, reloadLastResponse, sendMessage, state, stopGeneration } = useChatStore();
  const messages = activeChat?.messages ?? [];
  const lastMessage = messages[messages.length - 1];
  const showTyping = state.isLoading && (!lastMessage || !lastMessage.content.trim());
  const title = activeChat?.title ?? "Новый диалог";
  const resetKey = activeChat?.id ?? "empty-chat";

  const handleSubmitMessage = useCallback(async (content: string, attachments?: File[]) => {
    const chatId = await sendMessage(content, attachments);

    if (chatId && location.pathname !== `/chat/${chatId}`) {
      navigate(`/chat/${chatId}`);
    }
  }, [location.pathname, navigate, sendMessage]);

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
        <ErrorBoundary
          fallbackMessage="Ошибка рендера сообщений. Список чатов и поле ввода продолжают работать."
          resetKey={resetKey}
        >
          {messages.length ? (
            <MessageList messages={messages} showTyping={showTyping} />
          ) : (
            <EmptyState />
          )}
        </ErrorBoundary>
      </div>

      {state.error ? <ErrorMessage message={state.error} /> : null}

      <InputArea
        hasError={Boolean(state.error)}
        isLoading={state.isLoading}
        onReload={reloadLastResponse}
        onStop={stopGeneration}
        onSubmitMessage={handleSubmitMessage}
      />
    </section>
  );
}
