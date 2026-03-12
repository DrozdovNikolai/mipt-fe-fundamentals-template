import { useEffect, useRef } from "react";
import type { MessageData } from "../../types/chat";
import { Message } from "./Message";
import { TypingIndicator } from "./TypingIndicator";
import styles from "./MessageList.module.css";

interface MessageListProps {
  messages: MessageData[];
  showTyping: boolean;
}

export function MessageList({ messages, showTyping }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    element.scrollTop = element.scrollHeight;
  }, [messages, showTyping]);

  return (
    <div className={styles.list} ref={containerRef}>
      {messages.map((message) => (
        <Message key={message.id} message={message} />
      ))}
      <TypingIndicator isVisible={showTyping} />
    </div>
  );
}
