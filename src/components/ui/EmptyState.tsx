import { Icon } from "./Icon";
import styles from "./EmptyState.module.css";

export function EmptyState() {
  return (
    <div className={styles.empty}>
      <div className={styles.illustration}>
        <Icon name="spark" size={28} />
      </div>
      <h3 className={styles.title}>Начните новый диалог</h3>
      <p className={styles.text}>
        Выберите существующий чат или нажмите кнопку создания, чтобы собрать новый сценарий
        общения.
      </p>
    </div>
  );
}
