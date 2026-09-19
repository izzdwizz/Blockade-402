import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchAsk } from "./api";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchAsk", () => {
  it("returns ok:false with terms on a 402 response", async () => {
    const terms = {
      amount: "5000",
      recipient: "0xabc",
      chain_id: 5042,
      resource: "0xabc",
      request_hash: "0xdead",
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ status: 402, json: async () => terms }),
    );

    const result = await fetchAsk("hello");
    expect(result).toEqual({ ok: false, terms });
  });

  it("returns ok:true with response and tier on a 200 response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 200,
        json: async () => ({ response: "42", tier: "free" }),
      }),
    );

    const result = await fetchAsk("hello");
    expect(result).toEqual({ ok: true, response: "42", tier: "free" });
  });

  it("includes wallet and tx_hash in the query string when provided", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      json: async () => ({ response: "42", tier: "paid" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await fetchAsk("hello", { wallet: "0xabc", txHash: "0xdeadbeef" });

    const calledUrl = fetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain("wallet=0xabc");
    expect(calledUrl).toContain("tx_hash=0xdeadbeef");
  });
});
