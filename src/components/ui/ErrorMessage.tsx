import { Icon } from "./Icon";
import styles from "./ErrorMessage.module.css";

interface ErrorMessageProps {
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className={styles.error} role="alert">
      <Icon name="warning" size={16} />
      <span>{message}</span>
    </div>
  );
}
