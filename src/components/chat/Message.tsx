import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { MessageData } from "../../types/chat";
import { Icon } from "../ui/Icon";
import styles from "./Message.module.css";

interface MessageProps {
  message: MessageData;
}

export function Message({ message }: MessageProps) {
  const [copied, setCopied] = useState(false);
  const isAssistant = message.role === "assistant";

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timeoutId = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timeoutId);
  }, [copied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <article
      className={[styles.message, isAssistant ? styles.assistant : styles.user]
        .filter(Boolean)
        .join(" ")}
    >
      {isAssistant ? <div className={styles.avatar}>G</div> : null}

      <div className={styles.body}>
        <button className={styles.copy} onClick={handleCopy} type="button">
          <Icon name="copy" size={14} />
          {copied ? "Скопировано" : "Копировать"}
        </button>

        <div className={styles.meta}>
          <span>{message.author}</span>
          <span>{message.createdAt}</span>
        </div>

        <div className={styles.bubble}>
          <div className={styles.markdown}>
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        </div>
      </div>
    </article>
  );
}
