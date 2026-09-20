import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchAsk, fetchUnlock } from "./api";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchAsk", () => {
  it("returns response and tier on a 200 response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 200,
        json: async () => ({ response: "42", tier: "free" }),
      }),
    );

    const result = await fetchAsk("hello");
    expect(result).toEqual({ response: "42", tier: "free" });
  });

  it("includes wallet and quality in the query string when provided", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      json: async () => ({ response: "42", tier: "paid" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await fetchAsk("hello", { wallet: "0xabc", quality: "brief" });

    const calledUrl = fetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain("wallet=0xabc");
    expect(calledUrl).toContain("quality=brief");
  });

  it("sets the Authorization header when accessToken is provided", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      json: async () => ({ response: "42", tier: "paid" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await fetchAsk("hello", { wallet: "0xabc", accessToken: "tok123" });

    const [, init] = fetchMock.mock.calls[0];
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer tok123");
  });

  it("omits the Authorization header when accessToken is not provided", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      json: async () => ({ response: "42", tier: "free" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await fetchAsk("hello");

    const [, init] = fetchMock.mock.calls[0];
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined();
  });
});

describe("fetchUnlock", () => {
  it("returns ok:false with terms on a 402 response", async () => {
    const terms = {
      amount: "1000",
      recipient: "0xabc",
      chain_id: 5042002,
      resource: "0xabc",
      request_hash: "0xdead",
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ status: 402, json: async () => terms }));

    const result = await fetchUnlock("ocr", { wallet: "0xabc" });
    expect(result).toEqual({ ok: false, terms });
  });

  it("returns ok:true on a 200 response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ status: 200, json: async () => ({ unlocked: true }) }),
    );

    const result = await fetchUnlock("ocr", { wallet: "0xabc" });
    expect(result).toEqual({ ok: true });
  });

  it("includes wallet and tx_hash in the query string when provided", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      json: async () => ({ unlocked: true }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await fetchUnlock("ocr", { wallet: "0xabc", txHash: "0xdeadbeef" });

    const calledUrl = fetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain("/unlock/ocr");
    expect(calledUrl).toContain("wallet=0xabc");
    expect(calledUrl).toContain("tx_hash=0xdeadbeef");
  });
});
