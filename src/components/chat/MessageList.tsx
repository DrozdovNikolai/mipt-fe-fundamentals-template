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
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, showTyping]);

  return (
    <div className={styles.list}>
      {messages.map((message) => (
        <Message key={message.id} message={message} variant={message.role} />
      ))}
      <TypingIndicator isVisible={showTyping} />
      <div aria-hidden="true" className={styles.scrollAnchor} ref={endRef} />
    </div>
  );
}
