import { type FormEvent, useState } from "react";
import { scopeOptions } from "../../data/mockData";
import type { AuthFormValues, ScopeOption } from "../../types/chat";
import { Button } from "../ui/Button";
import { ErrorMessage } from "../ui/ErrorMessage";
import { Icon } from "../ui/Icon";
import styles from "./AuthForm.module.css";

interface AuthFormProps {
  onSubmit: (values: AuthFormValues) => void;
}

export function AuthForm({ onSubmit }: AuthFormProps) {
  const [credentials, setCredentials] = useState("");
  const [scope, setScope] = useState<ScopeOption>("GIGACHAT_API_PERS");
  const [error, setError] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!credentials.trim()) {
      setError("Введите credentials в формате Base64.");
      return;
    }

    setError("");
    onSubmit({
      credentials,
      scope,
    });
  };

  return (
    <main className={styles.screen}>
      <section className={styles.hero}>
        <div className={styles.badge}>
          <Icon name="spark" size={18} />
          React + TypeScript GigaChat client
        </div>
        <h1 className={styles.title}>Авторизация в учебное приложение GigaChat</h1>
        <p className={styles.subtitle}>
          Введите Base64 credentials и scope, чтобы подключить интерфейс к реальному GigaChat API
          через локальный proxy-слой.
        </p>

      </section>

      <section className={styles.panel}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div>
            <p className={styles.eyebrow}>Sign in</p>
            <h2 className={styles.formTitle}>Вход по credentials</h2>
          </div>

          <label className={styles.field}>
            <span className={styles.label}>Credentials</span>
            <input
              className={styles.input}
              onChange={(event) => setCredentials(event.currentTarget.value)}
              placeholder="Введите Base64-строку"
              type="password"
              value={credentials}
            />
          </label>

          {error ? <ErrorMessage message={error} /> : null}

          <fieldset className={styles.scopeGroup}>
            <legend className={styles.label}>Scope</legend>

            {scopeOptions.map((option) => (
              <label className={styles.scopeOption} key={option}>
                <input
                  checked={scope === option}
                  name="scope"
                  onChange={() => setScope(option)}
                  type="radio"
                  value={option}
                />
                <span>{option}</span>
              </label>
            ))}
          </fieldset>

          <Button fullWidth type="submit">
            Войти
          </Button>
        </form>
      </section>
    </main>
  );
}
