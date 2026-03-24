import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import styles from "./InputArea.module.css";

interface InputAreaProps {
  isLoading: boolean;
  hasError: boolean;
  onSubmitMessage: (content: string) => void | Promise<void>;
  onStop: () => void;
  onReload: () => void | Promise<void>;
}

export function InputArea({
  isLoading,
  hasError,
  onSubmitMessage,
  onStop,
  onReload,
}: InputAreaProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [value, setValue] = useState("");
  const canSubmit = value.trim().length > 0 && !isLoading;

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = "0px";

    const nextHeight = Math.min(textarea.scrollHeight, 144);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > 144 ? "auto" : "hidden";
  }, [value]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    textareaRef.current?.focus();
  }, [isLoading]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    const messageContent = value;
    setValue("");
    await onSubmitMessage(messageContent);
  };

  return (
    <form aria-busy={isLoading} className={styles.wrap} onSubmit={handleSubmit}>
      <div className={styles.controls}>
        <button
          aria-label="Прикрепить изображение"
          className={styles.iconButton}
          disabled
          type="button"
        >
          <Icon name="image" size={18} />
        </button>

        <textarea
          className={styles.textarea}
          disabled={isLoading}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing) {
              return;
            }

            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          placeholder={
            isLoading
              ? "Дождитесь ответа ассистента..."
              : "Введите сообщение. Enter отправляет, Shift+Enter переносит строку."
          }
          ref={textareaRef}
          rows={1}
          value={value}
        />

        <div className={styles.actions}>
          {hasError ? (
            <Button onClick={onReload} type="button" variant="secondary">
              <Icon name="refresh" size={18} />
              Повторить
            </Button>
          ) : null}

          <Button disabled={!isLoading} onClick={onStop} type="button" variant="ghost">
            <Icon name="stop" size={18} />
            Стоп
          </Button>
          <Button disabled={!canSubmit} type="submit">
            <Icon name="send" size={18} />
            {isLoading ? "Ждем ответ..." : "Отправить"}
          </Button>
        </div>
      </div>
    </form>
  );
}
