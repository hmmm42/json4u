import { describe, it, expect, vi, afterEach } from "vitest";

describe("document persistence", () => {

  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("writes and reads last document via IndexedDB", async () => {
    vi.doMock("idb-keyval", () => {
      const m = new Map<string, string>();
      return {
        createStore: () => ({}),
        set: async (key: string, val: string) => {
          m.set(key, val);
        },
        get: async (key: string) => m.get(key) ?? null,
        del: async (key: string) => {
          m.delete(key);
        },
      };
    });
    const { setLastDocument, getLastDocument } = await import("@/lib/db/document");
    await setLastDocument("{\"a\":1}", 1);
    const saved = await getLastDocument();
    expect(saved?.text).toBe("{\"a\":1}");
    expect(saved?.version).toBe(1);
  });

  it("falls back to localStorage on InvalidStateError", async () => {
    vi.mock("idb-keyval", () => {
      return {
        createStore: () => ({}),
        set: () => {
          const e = new Error("x");
          (e as any).name = "InvalidStateError";
          throw e;
        },
        get: () => {
          const e = new Error("x");
          (e as any).name = "InvalidStateError";
          throw e;
        },
        del: () => {
          const e = new Error("x");
          (e as any).name = "InvalidStateError";
          throw e;
        },
      };
    });

    const { setLastDocument, getLastDocument } = await import("@/lib/db/document");
    await setLastDocument("{\"b\":2}", 2);
    const saved = await getLastDocument();
    expect(saved?.text).toBe("{\"b\":2}");
    expect(saved?.version).toBe(2);
  });
});
