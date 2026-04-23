import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "../ui/Button";
import { ErrorMessage } from "../ui/ErrorMessage";
import { Icon } from "../ui/Icon";
import styles from "./InputArea.module.css";

interface InputAreaProps {
  isLoading: boolean;
  hasError: boolean;
  onSubmitMessage: (content: string, attachments?: File[]) => void | Promise<void>;
  onStop: () => void;
  onReload: () => void | Promise<void>;
}

const MAX_IMAGE_SIZE = 15 * 1024 * 1024;

export function InputArea({
  isLoading,
  hasError,
  onSubmitMessage,
  onStop,
  onReload,
}: InputAreaProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [value, setValue] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [attachmentError, setAttachmentError] = useState("");
  const trimmedValue = value.trim();
  const canSubmit = (trimmedValue.length > 0 || Boolean(selectedImage)) && !isLoading;

  useEffect(() => {
    if (isLoading) {
      return;
    }

    textareaRef.current?.focus();
  }, [isLoading]);

  const handleFileSelect = (file: File | null) => {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setAttachmentError("Можно прикрепить только изображение.");
      setSelectedImage(null);
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setAttachmentError("Изображение не должно превышать 15 МБ.");
      setSelectedImage(null);
      return;
    }

    setAttachmentError("");
    setSelectedImage(file);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    const messageContent = value;
    const attachedFiles = selectedImage ? [selectedImage] : undefined;
    setValue("");
    setSelectedImage(null);
    setAttachmentError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (attachedFiles?.length) {
      await onSubmitMessage(messageContent, attachedFiles);
      return;
    }

    await onSubmitMessage(messageContent);
  };

  return (
    <form aria-busy={isLoading} className={styles.wrap} onSubmit={handleSubmit}>
      <input
        accept="image/*"
        className={styles.fileInput}
        onChange={(event) => handleFileSelect(event.currentTarget.files?.[0] ?? null)}
        ref={fileInputRef}
        type="file"
      />

      {selectedImage ? (
        <div className={styles.attachment}>
          <div className={styles.attachmentMeta}>
            <Icon name="image" size={16} />
            <span className={styles.attachmentName}>{selectedImage.name}</span>
          </div>

          <button
            aria-label="Удалить прикрепленное изображение"
            className={styles.attachmentRemove}
            onClick={() => {
              setSelectedImage(null);
              setAttachmentError("");

              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
            }}
            type="button"
          >
            <Icon name="close" size={14} />
          </button>
        </div>
      ) : null}

      {attachmentError ? <ErrorMessage message={attachmentError} /> : null}

      <div className={styles.controls}>
        <button
          aria-label="Прикрепить изображение"
          className={styles.iconButton}
          disabled={isLoading}
          onClick={() => fileInputRef.current?.click()}
          type="button"
        >
          <Icon name="image" size={18} />
        </button>

        <textarea
          aria-label="Введите сообщение"
          className={styles.textarea}
          disabled={isLoading}
          enterKeyHint={isLoading ? "done" : "send"}
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
              : "Введите сообщение или прикрепите изображение. Enter отправляет, Shift+Enter переносит строку."
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

          {isLoading ? (
            <Button onClick={onStop} type="button" variant="ghost">
              <Icon name="stop" size={18} />
              Стоп
            </Button>
          ) : (
            <Button disabled={!canSubmit} type="submit">
              <Icon name="send" size={18} />
              Отправить
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
