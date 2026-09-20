import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChatThread } from "./ChatThread";
import type { ChatMessage } from "../hooks/useChatSession";

describe("ChatThread", () => {
  it("renders assistant markdown as structured HTML, not raw syntax", () => {
    const messages: ChatMessage[] = [
      {
        id: "m1",
        role: "assistant",
        content: "### Centering a `<div>`\n\nUse `margin: 0 auto;` to center it.",
      },
    ];

    render(<ChatThread messages={messages} status="idle" />);

    expect(screen.getByRole("heading", { level: 3, name: "Centering a <div>" })).toBeVisible();
    expect(screen.getByText("margin: 0 auto;")).toBeVisible();
    expect(screen.queryByText(/###/)).not.toBeInTheDocument();
  });

  it("renders a markdown table as an actual table", () => {
    const messages: ChatMessage[] = [
      {
        id: "m1",
        role: "assistant",
        content: "| Method | Use |\n| --- | --- |\n| Flexbox | Centering |",
      },
    ];

    render(<ChatThread messages={messages} status="idle" />);

    expect(screen.getByRole("table")).toBeVisible();
    expect(screen.getByRole("columnheader", { name: "Method" })).toBeVisible();
    expect(screen.getByRole("cell", { name: "Flexbox" })).toBeVisible();
  });

  it("renders user messages as plain text, not markdown", () => {
    const messages: ChatMessage[] = [
      { id: "m1", role: "user", content: "how do I center a **div**?" },
    ];

    render(<ChatThread messages={messages} status="idle" />);

    expect(screen.getByText("how do I center a **div**?")).toBeVisible();
    expect(screen.queryByText("div", { selector: "strong" })).not.toBeInTheDocument();
  });
});
