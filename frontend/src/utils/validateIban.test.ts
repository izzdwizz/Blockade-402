import { describe, expect, it } from "vitest";
import { checkIban } from "./validateIban";

describe("checkIban", () => {
  it("accepts a known-valid German IBAN", () => {
    const result = checkIban("DE89370400440532013000");
    expect(result.valid).toBe(true);
    expect(result.countryCode).toBe("DE");
    expect(result.countryName).toBe("Germany");
  });

  it("accepts a known-valid IBAN with spaces, case-insensitively", () => {
    const result = checkIban("de89 3704 0044 0532 0130 00");
    expect(result.valid).toBe(true);
  });

  it("rejects an IBAN with a mutated checksum digit", () => {
    const result = checkIban("DE89370400440532013001");
    expect(result.valid).toBe(false);
    expect(result.countryCode).toBeNull();
  });

  it("rejects a string that doesn't match the basic IBAN shape", () => {
    const result = checkIban("not an iban");
    expect(result.valid).toBe(false);
  });

  it("rejects an empty string", () => {
    const result = checkIban("");
    expect(result.valid).toBe(false);
  });
});
