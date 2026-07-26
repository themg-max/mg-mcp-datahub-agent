import assert from "node:assert/strict";
import test from "node:test";
import { DataHubContextAdapter } from "../src/datahub/context-adapter.js";
import { readFile } from "node:fs/promises";

const adapter = new DataHubContextAdapter();

test("maps authority states and blocked uses", () => {
  const records = adapter.normalize({
    entities: [
      {
        urn: "urn:test:approved",
        title: "Approved",
        description: "Approved context",
        authority: "approved",
        retrievedAt: "2026-07-20T12:00:00.000Z",
        sourceType: "datahub_document"
      },
      {
        urn: "urn:test:planning",
        title: "Planning",
        description: "Planning only",
        authority: "planning_only",
        retrievedAt: "2026-07-20T12:00:00.000Z"
      },
      {
        urn: "urn:test:quarantine",
        title: "Quarantine",
        description: "Quarantined",
        authority: "quarantined",
        retrievedAt: "2026-07-20T12:00:00.000Z"
      },
      {
        urn: "urn:test:unknown",
        title: "Unknown",
        description: "Unknown",
        retrievedAt: "2026-07-20T12:00:00.000Z"
      }
    ]
  });

  assert.equal(records.length, 4);
  assert.equal(records[0]?.authority, "approved");
  assert.equal(records[1]?.authority, "planning_only");
  assert.equal(records[1]?.blockedUses.includes("Do not use to approve implementation without approved evidence."), true);
  assert.equal(records[2]?.authority, "quarantined");
  assert.equal(records[2]?.blockedUses.includes("Do not use in planning or implementation decisions."), true);
  assert.equal(records[3]?.authority, "unknown");
  assert.equal(records[3]?.blockedUses.includes("Do not use as implementation authority."), true);
});

test("skips malformed input and missing provenance", async () => {
  const malformed = adapter.normalize({
    entities: [null, 42, { urn: "urn:test:missing-provenance", title: "Missing provenance" }]
  });

  assert.deepEqual(malformed, []);

  const raw = JSON.parse(await readFile(new URL("../../fixtures/invalid-datahub-context.json", import.meta.url), "utf8")) as unknown;
  assert.deepEqual(adapter.normalize(raw), []);
});
