import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChatInput } from "./ChatInput";
import { FREE_CHAR_CAP } from "../constants";

describe("ChatInput", () => {
  it("blocks typing past the free char cap via maxLength", () => {
    render(<ChatInput tier="free" status="idle" disabled={false} onSend={vi.fn()} />);
    const textarea = screen.getByPlaceholderText("Ask anything…");
    expect(textarea).toHaveAttribute("maxlength", String(FREE_CHAR_CAP));
  });

  it("auto-sends once the draft reaches the free cap", () => {
    const onSend = vi.fn();
    render(<ChatInput tier="free" status="idle" disabled={false} onSend={onSend} />);
    const textarea = screen.getByPlaceholderText("Ask anything…");

    const capText = "x".repeat(FREE_CHAR_CAP);
    fireEvent.change(textarea, { target: { value: capText } });

    expect(onSend).toHaveBeenCalledTimes(1);
    expect(onSend).toHaveBeenCalledWith(capText);
  });

  it("does not auto-send below the cap, only on explicit send", () => {
    const onSend = vi.fn();
    render(<ChatInput tier="free" status="idle" disabled={false} onSend={onSend} />);
    const textarea = screen.getByPlaceholderText("Ask anything…");

    fireEvent.change(textarea, { target: { value: "short question" } });
    expect(onSend).not.toHaveBeenCalled();

    fireEvent.click(screen.getByLabelText("Send"));
    expect(onSend).toHaveBeenCalledWith("short question");
  });

  it("has no cap once tier is paid", () => {
    render(<ChatInput tier="paid" status="idle" disabled={false} onSend={vi.fn()} />);
    const textarea = screen.getByPlaceholderText("Ask anything…");
    expect(textarea).not.toHaveAttribute("maxlength");
  });
});
