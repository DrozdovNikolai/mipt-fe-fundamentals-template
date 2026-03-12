import { Icon } from "../ui/Icon";
import styles from "./SearchInput.module.css";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchInput({ value, onChange }: SearchInputProps) {
  return (
    <label className={styles.field}>
      <Icon name="search" size={18} />
      <input
        className={styles.input}
        onChange={(event) => onChange(event.currentTarget.value)}
        placeholder="Поиск по чатам"
        type="search"
        value={value}
      />
    </label>
  );
}
