import { useEffect, useRef } from "react";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import styles from "./InputArea.module.css";

interface InputAreaProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
}

export function InputArea({ value, onChange, onSubmit }: InputAreaProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const canSubmit = value.trim().length > 0;

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

  const handleSubmit = () => {
    if (!canSubmit) {
      return;
    }

    onSubmit(value);
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.controls}>
        <button aria-label="Прикрепить изображение" className={styles.iconButton} type="button">
          <Icon name="image" size={18} />
        </button>

        <textarea
          className={styles.textarea}
          onChange={(event) => onChange(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing) {
              return;
            }

            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="Введите сообщение. Enter отправляет, Shift+Enter переносит строку."
          ref={textareaRef}
          rows={1}
          value={value}
        />

        <div className={styles.actions}>
          <Button disabled type="button" variant="ghost">
            <Icon name="stop" size={18} />
            Стоп
          </Button>
          <Button disabled={!canSubmit} onClick={handleSubmit} type="button">
            <Icon name="send" size={18} />
            Отправить
          </Button>
        </div>
      </div>
    </div>
  );
}
