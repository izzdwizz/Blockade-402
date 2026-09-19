import { describe, expect, it } from "vitest";
import { formatUsdc } from "./formatUsdc";

describe("formatUsdc", () => {
  it("converts 6-decimal base units to a dollar amount", () => {
    expect(formatUsdc("5000")).toBe("0.005");
  });

  it("trims trailing zeros", () => {
    expect(formatUsdc("10000")).toBe("0.01");
  });

  it("handles whole-dollar amounts", () => {
    expect(formatUsdc("1000000")).toBe("1");
  });
});
