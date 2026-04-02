import { useEffect, useState } from "react";
import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import css from "highlight.js/lib/languages/css";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import markdown from "highlight.js/lib/languages/markdown";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import ReactMarkdown from "react-markdown";
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
        {isAssistant ? (
          <button
            className={[styles.copy, copied ? styles.copied : ""].filter(Boolean).join(" ")}
            onClick={handleCopy}
            type="button"
          >
            <Icon name="copy" size={14} />
            {copied ? "Скопировано" : "Копировать"}
          </button>
        ) : null}

        <div className={styles.meta}>
          <span>{message.author}</span>
          {message.timestamp ? (
            <time dateTime={message.timestamp}>{message.createdAt}</time>
          ) : (
            <span>{message.createdAt}</span>
          )}
        </div>

        <div className={styles.bubble}>
          <div className={styles.markdown}>
            <ReactMarkdown
              components={{
                code({ className, children, ...props }) {
                  const code = String(children).replace(/\n$/, "");
                  const language = className?.replace("language-", "") ?? "";

                  if (!className?.startsWith("language-")) {
                    return (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  }

                  const highlightedCode = language && hljs.getLanguage(language)
                    ? hljs.highlight(code, { language }).value
                    : hljs.highlightAuto(code).value;

                  return (
                    <pre className={styles.codeBlock}>
                      <code
                        className={`hljs ${className ?? ""}`.trim()}
                        dangerouslySetInnerHTML={{ __html: highlightedCode }}
                      />
                    </pre>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </article>
  );
}
