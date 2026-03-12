import styles from "./Toggle.module.css";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function Toggle({ checked, onChange }: ToggleProps) {
  return (
    <button
      aria-checked={checked}
      className={[styles.toggle, checked ? styles.checked : ""].filter(Boolean).join(" ")}
      onClick={() => onChange(!checked)}
      role="switch"
      type="button"
    >
      <span className={styles.thumb} />
    </button>
  );
}
