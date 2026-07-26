import assert from "node:assert/strict";
import test from "node:test";
import { DataHubClient } from "../src/datahub/client.js";

const DEFAULT_ENDPOINTS = { searchPath: "/api/v1/search", entityPath: "/api/v1/entities/" } as const;

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
    const client = new DataHubClient({ baseUrl: "https://catalog.example", timeoutMs: 1, endpoints: DEFAULT_ENDPOINTS });
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
    const client = new DataHubClient({ baseUrl: "https://catalog.example", endpoints: DEFAULT_ENDPOINTS });
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

test("Authorization header is omitted without a token and present when configured", async () => {
  const originalFetch = globalThis.fetch;
  const calls: Array<RequestInit | undefined> = [];

  globalThis.fetch = (async (_url: string, init?: RequestInit) => {
    calls.push(init);
    return {
      ok: true,
      status: 200,
      statusText: "OK",
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({})
    } as unknown as Response;
  }) as unknown as typeof fetch;

  try {
    const clientNoToken = new DataHubClient({ baseUrl: "https://catalog.example", endpoints: DEFAULT_ENDPOINTS });
    await clientNoToken.search("q");
    const firstHeaders = calls[0]?.headers as Record<string, string> | undefined;
    assert.ok(firstHeaders);
    assert.equal((firstHeaders as any).Authorization, undefined);

    const clientWithToken = new DataHubClient({ baseUrl: "https://catalog.example", token: "s3cr3t", endpoints: DEFAULT_ENDPOINTS });
    await clientWithToken.search("q");
    const secondHeaders = calls[1]?.headers as Record<string, string> | undefined;
    assert.ok(secondHeaders);
    assert.equal((secondHeaders as any).Authorization, "Bearer s3cr3t");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
