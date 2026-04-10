import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { MessageData } from "../../types/chat";
import { Message } from "./Message";

const buildMessage = (content: string, role: MessageData["role"]): MessageData => ({
  id: `${role}-message`,
  role,
  content,
  author: role === "assistant" ? "GigaChat" : "Вы",
  createdAt: "10:00",
  timestamp: "2026-04-10T07:00:00.000Z",
});

describe("Message", () => {
  it("renders user message content with user class and without copy button", () => {
    render(<Message message={buildMessage("Текст пользователя", "user")} variant="user" />);

    const messageText = screen.getByText("Текст пользователя");
    const article = messageText.closest("article");

    expect(messageText).not.toBeNull();
    expect(article?.className).toContain("user");
    expect(screen.queryByRole("button", { name: /копировать/i })).toBeNull();
  });

  it("renders assistant message content with assistant class and copy button", () => {
    render(<Message message={buildMessage("Ответ ассистента", "assistant")} variant="assistant" />);

    const messageText = screen.getByText("Ответ ассистента");
    const article = messageText.closest("article");

    expect(messageText).not.toBeNull();
    expect(article?.className).toContain("assistant");
    expect(screen.getByRole("button", { name: /копировать/i })).not.toBeNull();
  });
});
