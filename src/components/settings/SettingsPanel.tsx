import { useEffect, useState } from "react";
import { fetchAvailableModels } from "../../api/gigachat";
import { useChatStore } from "../../app/providers/ChatProvider";
import { modelOptions } from "../../data/mockData";
import type { SettingsData, ThemeMode } from "../../types/chat";
import { Button } from "../ui/Button";
import { ErrorMessage } from "../ui/ErrorMessage";
import { Icon } from "../ui/Icon";
import { Slider } from "../ui/Slider";
import { Toggle } from "../ui/Toggle";
import styles from "./SettingsPanel.module.css";

interface SettingsPanelProps {
  isOpen: boolean;
  settings: SettingsData;
  onChange: (next: SettingsData) => void;
  onClose: () => void;
  onSave: () => void;
  onReset: () => void;
}

export function SettingsPanel({
  isOpen,
  settings,
  onChange,
  onClose,
  onSave,
  onReset,
}: SettingsPanelProps) {
  const { state } = useChatStore();
  const [availableModels, setAvailableModels] = useState(modelOptions);
  const [modelsError, setModelsError] = useState("");
  const modelChoices = Array.from(new Set([settings.model, ...availableModels]));

  useEffect(() => {
    if (!isOpen || !state.authSession) {
      return;
    }

    const abortController = new AbortController();

    fetchAvailableModels(state.authSession, abortController.signal)
      .then((models) => {
        setAvailableModels(models);
        setModelsError("");
      })
      .catch((error) => {
        if (abortController.signal.aborted) {
          return;
        }

        setAvailableModels(modelOptions);
        setModelsError(
          error instanceof Error
            ? `${error.message} Используем локальный fallback-список моделей.`
            : "Не удалось загрузить список моделей. Используем fallback-список.",
        );
      });

    return () => {
      abortController.abort();
    };
  }, [isOpen, state.authSession]);

  if (!isOpen) {
    return null;
  }

  const update = <Key extends keyof SettingsData>(key: Key, value: SettingsData[Key]) => {
    onChange({
      ...settings,
      [key]: value,
    });
  };

  return (
    <>
      <button
        aria-label="Закрыть панель настроек"
        className={styles.overlay}
        onClick={onClose}
        type="button"
      />

      <aside className={styles.panel}>
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>System Control</p>
            <h2 className={styles.title}>Настройки модели</h2>
          </div>

          <Button aria-label="Закрыть" onClick={onClose} type="button" variant="icon">
            <Icon name="close" size={18} />
          </Button>
        </div>

        <div className={styles.content}>
          <label className={styles.field}>
            <span className={styles.label}>Модель</span>
            <select
              className={styles.select}
              onChange={(event) => update("model", event.currentTarget.value as SettingsData["model"])}
              value={settings.model}
            >
              {modelChoices.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          {modelsError ? <ErrorMessage message={modelsError} /> : null}

          <Slider
            id="temperature"
            label="Temperature"
            max={2}
            min={0}
            onChange={(value) => update("temperature", value)}
            step={0.1}
            value={settings.temperature}
          />

          <Slider
            id="topP"
            label="Top-P"
            max={1}
            min={0}
            onChange={(value) => update("topP", value)}
            step={0.05}
            value={settings.topP}
          />

          <Slider
            id="repetitionPenalty"
            label="Repetition Penalty"
            max={2}
            min={0}
            onChange={(value) => update("repetitionPenalty", value)}
            step={0.05}
            value={settings.repetitionPenalty}
          />

          <label className={styles.field}>
            <span className={styles.label}>Max Tokens</span>
            <input
              className={styles.input}
              min={1}
              onChange={(event) => update("maxTokens", Number(event.currentTarget.value))}
              type="number"
              value={settings.maxTokens}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>System Prompt</span>
            <textarea
              className={[styles.input, styles.prompt].join(" ")}
              onChange={(event) => update("systemPrompt", event.currentTarget.value)}
              rows={6}
              value={settings.systemPrompt}
            />
          </label>

          <div className={styles.toggleRow}>
            <div>
              <p className={styles.label}>Тема</p>
              <span className={styles.caption}>
                {settings.theme === "light" ? "Светлая тема" : "Темная тема"}
              </span>
            </div>
            <Toggle
              checked={settings.theme === "dark"}
              onChange={(checked) => update("theme", (checked ? "dark" : "light") as ThemeMode)}
            />
          </div>
        </div>

        <div className={styles.actions}>
          <Button onClick={onReset} type="button" variant="ghost">
            Сбросить
          </Button>
          <Button onClick={onSave} type="button">
            Сохранить
          </Button>
        </div>
      </aside>
    </>
  );
}
