import { describe, expect, it } from "vitest";
import { initialPayAndAskState, payAndAskReducer, type PaymentTerms } from "./payAndAskReducer";

const terms: PaymentTerms = {
  amount: "10000",
  recipient: "0x1234",
  chain_id: 999,
  resource: "0x1234",
  request_hash: "0xabc",
};

describe("payAndAskReducer", () => {
  it("starts idle", () => {
    expect(initialPayAndAskState.status).toBe("idle");
  });

  it("moves idle -> challenged on CHALLENGE_RECEIVED", () => {
    const state = payAndAskReducer(initialPayAndAskState, { type: "CHALLENGE_RECEIVED", terms });
    expect(state.status).toBe("challenged");
    expect(state.terms).toEqual(terms);
  });

  it("moves challenged -> paying on PAY_STARTED", () => {
    const challenged = payAndAskReducer(initialPayAndAskState, { type: "CHALLENGE_RECEIVED", terms });
    const state = payAndAskReducer(challenged, { type: "PAY_STARTED" });
    expect(state.status).toBe("paying");
  });

  it("ignores PAY_STARTED when not challenged", () => {
    const state = payAndAskReducer(initialPayAndAskState, { type: "PAY_STARTED" });
    expect(state.status).toBe("idle");
  });

  it("moves paying -> verifying on PAY_SUBMITTED with txHash", () => {
    const paying = { status: "paying" as const, terms };
    const state = payAndAskReducer(paying, { type: "PAY_SUBMITTED", txHash: "0xdeadbeef" });
    expect(state.status).toBe("verifying");
    expect(state.txHash).toBe("0xdeadbeef");
  });

  it("moves verifying -> served on VERIFIED with response", () => {
    const verifying = { status: "verifying" as const, terms, txHash: "0xdeadbeef" };
    const state = payAndAskReducer(verifying, { type: "VERIFIED", response: "42" });
    expect(state.status).toBe("served");
    expect(state.response).toBe("42");
  });

  it("moves to error on FAILED from any state", () => {
    const verifying = { status: "verifying" as const, terms, txHash: "0xdeadbeef" };
    const state = payAndAskReducer(verifying, { type: "FAILED", error: "underpayment" });
    expect(state.status).toBe("error");
    expect(state.error).toBe("underpayment");
  });

  it("returns to idle on RESET", () => {
    const served = { status: "served" as const, terms, response: "42" };
    const state = payAndAskReducer(served, { type: "RESET" });
    expect(state).toEqual(initialPayAndAskState);
  });
});
