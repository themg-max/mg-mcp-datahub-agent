import assert from "node:assert/strict";
import test from "node:test";
import { DataHubClient } from "../src/datahub/client.js";

test("timeouts without exposing response bodies", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = ((_: string, init?: RequestInit) => {
    return new Promise<Response>((_, reject) => {
      init?.signal?.addEventListener("abort", () => {
        reject(new DOMException("Aborted", "AbortError"));
      });
    });
  }) as unknown as typeof fetch;

  try {
    const client = new DataHubClient({ baseUrl: "https://catalog.example", timeoutMs: 1 });
    await assert.rejects(() => client.search("customer profile"), /timed out/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("redacts sensitive response content in errors", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => ({
    ok: false,
    status: 500,
    statusText: "Server Error",
    headers: new Headers({ "content-type": "text/plain" }),
    json: async () => ({ secret: "should-not-leak" }),
    text: async () => "secret token=abc123"
  })) as unknown as typeof fetch;

  try {
    const client = new DataHubClient({ baseUrl: "https://catalog.example" });
    await assert.rejects(
      () => client.fetchByUrn("urn:test:entity"),
      (error: unknown) => {
        if (!(error instanceof Error)) {
          return false;
        }

        assert.match(error.message, /status 500/);
        assert.equal(error.message.includes("secret token"), false);
        assert.equal(error.message.includes("abc123"), false);
        return true;
      }
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
