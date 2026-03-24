import { useEffect, useRef } from "react";
import { useChat, type Message as ChatMessage } from "../../hooks/useChat";
import type { ChatData, MessageData } from "../../types/chat";
import { ChatWindow } from "./ChatWindow";

interface ChatSessionProps {
  chat: ChatData;
  api?: string;
  onMessagesChange: (chatId: string, messages: ChatMessage[]) => void;
  onOpenSettings: () => void;
  onOpenSidebar: () => void;
}

const formatMessageTime = (date?: Date) => {
  if (!date) {
    return "Сейчас";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const resolveAuthor = (role: ChatMessage["role"]) => {
  if (role === "user") {
    return "Вы";
  }

  if (role === "system") {
    return "System";
  }

  return "GigaChat";
};

const toHookMessage = (message: MessageData): ChatMessage => ({
  id: message.id,
  role: message.role,
  content: message.content,
  createdAt: message.timestamp ? new Date(message.timestamp) : undefined,
});

const toUiMessage = (message: ChatMessage, existingMessage?: MessageData): MessageData => ({
  id: message.id,
  role: message.role === "system" ? "assistant" : message.role,
  author: existingMessage?.author ?? resolveAuthor(message.role),
  content: message.content,
  createdAt: existingMessage?.createdAt ?? formatMessageTime(message.createdAt),
  timestamp: existingMessage?.timestamp ?? message.createdAt?.toISOString(),
});

const isVisibleMessage = (message: ChatMessage) =>
  message.role !== "system" && (message.role !== "assistant" || message.content.trim().length > 0);

export function ChatSession({
  chat,
  api,
  onMessagesChange,
  onOpenSettings,
  onOpenSidebar,
}: ChatSessionProps) {
  const syncMessagesRef = useRef(onMessagesChange);

  useEffect(() => {
    syncMessagesRef.current = onMessagesChange;
  }, [onMessagesChange]);

  const { messages, submitMessage, isLoading, error, stop, reload } = useChat({
    api,
    initialMessages: chat.messages.map(toHookMessage),
  });

  useEffect(() => {
    syncMessagesRef.current(chat.id, messages);
  }, [chat.id, messages]);

  const existingMessages = new Map(chat.messages.map((message) => [message.id, message]));
  const visibleMessages = messages
    .filter(isVisibleMessage)
    .map((message) => toUiMessage(message, existingMessages.get(message.id)));

  const lastMessage = visibleMessages[visibleMessages.length - 1];
  const showTyping = isLoading && (!lastMessage || !lastMessage.content.trim());

  return (
    <ChatWindow
      error={error}
      isLoading={isLoading}
      messages={visibleMessages}
      onOpenSettings={onOpenSettings}
      onOpenSidebar={onOpenSidebar}
      onReload={reload}
      onStop={stop}
      onSubmitMessage={submitMessage}
      showTyping={showTyping}
      title={chat.title}
    />
  );
}
