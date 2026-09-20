import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChatInput } from "./ChatInput";

describe("ChatInput", () => {
  it("has no character cap", () => {
    render(<ChatInput status="idle" disabled={false} onSend={vi.fn()} />);
    const textarea = screen.getByPlaceholderText("Ask anything…");
    expect(textarea).not.toHaveAttribute("maxlength");
  });

  it("sends on click and clears the draft", () => {
    const onSend = vi.fn();
    render(<ChatInput status="idle" disabled={false} onSend={onSend} />);
    const textarea = screen.getByPlaceholderText("Ask anything…") as HTMLTextAreaElement;

    fireEvent.change(textarea, { target: { value: "hello there" } });
    fireEvent.click(screen.getByLabelText("Send"));

    expect(onSend).toHaveBeenCalledWith("hello there");
    expect(textarea.value).toBe("");
  });

  it("sends on Enter without Shift, but not with Shift", () => {
    const onSend = vi.fn();
    render(<ChatInput status="idle" disabled={false} onSend={onSend} />);
    const textarea = screen.getByPlaceholderText("Ask anything…");

    fireEvent.change(textarea, { target: { value: "hello" } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });
    expect(onSend).not.toHaveBeenCalled();

    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });
    expect(onSend).toHaveBeenCalledWith("hello");
  });

  it("does not send an empty or whitespace-only draft", () => {
    const onSend = vi.fn();
    render(<ChatInput status="idle" disabled={false} onSend={onSend} />);
    const textarea = screen.getByPlaceholderText("Ask anything…");

    fireEvent.change(textarea, { target: { value: "   " } });
    fireEvent.click(screen.getByLabelText("Send"));

    expect(onSend).not.toHaveBeenCalled();
  });

  it("disables input while busy", () => {
    render(<ChatInput status="thinking" disabled={false} onSend={vi.fn()} />);
    const textarea = screen.getByPlaceholderText("Ask anything…");
    expect(textarea).toBeDisabled();
  });
});
