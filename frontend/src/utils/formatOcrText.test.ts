import { describe, expect, it } from "vitest";
import { formatOcrText } from "./formatOcrText";

describe("formatOcrText", () => {
  it("trims leading and trailing whitespace", () => {
    expect(formatOcrText("  \n hello \n  ")).toBe("hello");
  });

  it("normalizes CRLF line endings to LF", () => {
    expect(formatOcrText("a\r\nb")).toBe("a\nb");
  });

  it("strips trailing whitespace on each line", () => {
    expect(formatOcrText("a   \nb\t\nc")).toBe("a\nb\nc");
  });

  it("collapses 3+ blank lines down to a single blank line", () => {
    expect(formatOcrText("a\n\n\n\n\nb")).toBe("a\n\nb");
  });

  it("leaves a single blank line between paragraphs untouched", () => {
    expect(formatOcrText("a\n\nb")).toBe("a\n\nb");
  });
});
