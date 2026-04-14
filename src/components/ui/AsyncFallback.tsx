import styles from "./AsyncFallback.module.css";

interface AsyncFallbackProps {
  description?: string;
  title?: string;
}

export function AsyncFallback({
  description = "Компонент загружается асинхронно.",
  title = "Загрузка...",
}: AsyncFallbackProps) {
  return (
    <div className={styles.fallback} role="status">
      <strong className={styles.title}>{title}</strong>
      <span>{description}</span>
    </div>
  );
}
