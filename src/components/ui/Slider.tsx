import styles from "./Slider.module.css";

interface SliderProps {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}

export function Slider({ id, label, min, max, step, value, onChange }: SliderProps) {
  return (
    <label className={styles.wrap} htmlFor={id}>
      <span className={styles.row}>
        <span className={styles.label}>{label}</span>
        <span className={styles.value}>{value.toFixed(step < 1 ? 2 : 0)}</span>
      </span>
      <input
        className={styles.input}
        id={id}
        max={max}
        min={min}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
        step={step}
        type="range"
        value={value}
      />
    </label>
  );
}
