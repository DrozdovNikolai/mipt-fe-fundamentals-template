import { Children, isValidElement, useEffect, useState, type ReactNode } from "react";
import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import css from "highlight.js/lib/languages/css";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import markdown from "highlight.js/lib/languages/markdown";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import ReactMarkdown from "react-markdown";
import "highlight.js/styles/github-dark.css";
import type { MessageData, MessageVariant } from "../../types/chat";
import { Icon } from "../ui/Icon";
import styles from "./Message.module.css";

hljs.registerLanguage("bash", bash);
hljs.registerLanguage("css", css);
hljs.registerLanguage("html", xml);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("json", json);
hljs.registerLanguage("markdown", markdown);
hljs.registerLanguage("tsx", typescript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("xml", xml);

interface MessageProps {
  message: MessageData;
  variant: MessageVariant;
}

const extractCodeText = (value: ReactNode): string =>
  Children.toArray(value)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number") {
        return String(child);
      }

      if (isValidElement<{ children?: ReactNode }>(child)) {
        return extractCodeText(child.props.children);
      }

      return "";
    })
    .join("");

const renderHighlightedCode = (code: string, className?: string) => {
  const language = className?.replace("language-", "") ?? "";
  const normalizedCode = code.replace(/\n$/, "");
  const highlightedCode =
    language && hljs.getLanguage(language)
      ? hljs.highlight(normalizedCode, { language }).value
      : hljs.highlightAuto(normalizedCode).value;

  return (
    <pre className={styles.codeBlock}>
      <code
        className={`hljs ${className ?? ""}`.trim()}
        dangerouslySetInnerHTML={{ __html: highlightedCode }}
      />
    </pre>
  );
};

export function Message({ message, variant }: MessageProps) {
  const [copied, setCopied] = useState(false);
  const isAssistant = variant === "assistant";

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timeoutId = window.setTimeout(() => setCopied(false), 2000);
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
        <div className={styles.meta}>
          <span>{message.author}</span>
          {message.timestamp ? (
            <time dateTime={message.timestamp}>{message.createdAt}</time>
          ) : (
            <span>{message.createdAt}</span>
          )}
        </div>

        <div className={styles.bubble}>
          {message.attachments?.length ? (
            <div className={styles.attachments}>
              {message.attachments.map((attachment) => (
                <div className={styles.attachment} key={attachment.id}>
                  <Icon name="image" size={16} />
                  <span>{attachment.name}</span>
                </div>
              ))}
            </div>
          ) : null}

          <div className={styles.markdown}>
            <ReactMarkdown
              components={{
                pre({ children }) {
                  const firstChild = Children.toArray(children)[0];

                  if (!isValidElement<{ className?: string; children?: ReactNode }>(firstChild)) {
                    return <pre>{children}</pre>;
                  }

                  return renderHighlightedCode(
                    extractCodeText(firstChild.props.children),
                    firstChild.props.className,
                  );
                },
                code({ className, children, ...props }) {
                  return (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        </div>

        {isAssistant ? (
          <button
            aria-label={copied ? "Скопировано" : "Копировать сообщение"}
            className={[styles.copy, copied ? styles.copied : ""].filter(Boolean).join(" ")}
            onClick={handleCopy}
            title={copied ? "Скопировано" : "Копировать сообщение"}
            type="button"
          >
            <Icon name={copied ? "check" : "copy"} size={16} />
          </button>
        ) : null}
      </div>
    </article>
  );
}
