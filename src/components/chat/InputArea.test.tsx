import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { InputArea } from "./InputArea";

const renderInputArea = (onSubmitMessage = vi.fn()) => {
  render(
    <InputArea
      hasError={false}
      isLoading={false}
      onReload={vi.fn()}
      onStop={vi.fn()}
      onSubmitMessage={onSubmitMessage}
    />,
  );

  return {
    onSubmitMessage,
    textarea: screen.getByLabelText("Введите сообщение"),
    submitButton: screen.getByRole("button", { name: /отправить/i }),
  };
};

describe("InputArea", () => {
  it("calls onSubmitMessage with textarea value after clicking Send", async () => {
    const user = userEvent.setup();
    const { onSubmitMessage, submitButton, textarea } = renderInputArea();

    await user.type(textarea, "Привет, GigaChat");
    await user.click(submitButton);

    expect(onSubmitMessage).toHaveBeenCalledTimes(1);
    expect(onSubmitMessage).toHaveBeenCalledWith("Привет, GigaChat");
    expect(textarea).toHaveValue("");
  });

  it("calls onSubmitMessage after pressing Enter with non-empty input", async () => {
    const user = userEvent.setup();
    const { onSubmitMessage, textarea } = renderInputArea();

    await user.type(textarea, "Отправь это{Enter}");

    expect(onSubmitMessage).toHaveBeenCalledTimes(1);
    expect(onSubmitMessage).toHaveBeenCalledWith("Отправь это");
  });

  it("keeps newline on Shift+Enter and grows textarea until max height", async () => {
    const user = userEvent.setup();
    const { onSubmitMessage, textarea } = renderInputArea();

    Object.defineProperty(textarea, "scrollHeight", {
      configurable: true,
      value: 240,
    });

    await user.type(textarea, "Первая строка{Shift>}{Enter}{/Shift}Вторая строка");

    expect(onSubmitMessage).not.toHaveBeenCalled();
    expect(textarea).toHaveValue("Первая строка\nВторая строка");
    expect(textarea).toHaveStyle({
      height: "176px",
      overflowY: "auto",
    });
  });

  it("keeps Send button disabled for an empty or whitespace-only input", async () => {
    const user = userEvent.setup();
    const { submitButton, textarea } = renderInputArea();

    expect(submitButton).toBeDisabled();

    await user.type(textarea, "   ");

    expect(submitButton).toBeDisabled();
  });
});
