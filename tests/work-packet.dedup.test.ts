import assert from "node:assert/strict";
import test from "node:test";
import { buildWorkPacket } from "../src/work-packet.js";
import type { NormalizedContextRecord, SourceReference } from "../src/datahub/context-adapter.js";

const commonProvenance: SourceReference = {
  id: "urn:shared:entity:1",
  title: "Shared Entity",
  canonicalUrl: "https://catalog.example/shared/entity/1",
  sourceType: "datahub_document",
  retrievedAt: new Date("2026-07-20T12:00:00.000Z").toISOString()
};

const recordA: NormalizedContextRecord = {
  id: "a",
  title: "Record A",
  summary: "A",
  authority: "approved",
  provenance: [commonProvenance],
  tags: [],
  constraints: [],
  blockedUses: []
};

const recordB: NormalizedContextRecord = {
  id: "b",
  title: "Record B",
  summary: "B",
  authority: "approved",
  provenance: [commonProvenance],
  tags: [],
  constraints: [],
  blockedUses: []
};

test("removes duplicate provenance across records", () => {
  const packet = buildWorkPacket({
    objective: "obj",
    currentContext: [recordA, recordB],
    allowedScope: ["src/index.ts"]
  });

  assert.equal(packet.sourceReferences.length, 1, "duplicate provenance should be deduplicated");
  assert.equal(packet.sourceReferences[0]?.canonicalUrl, commonProvenance.canonicalUrl);
});

test("reordered inputs produce identical work packets", () => {
  const first = buildWorkPacket({
    objective: "obj",
    currentContext: [recordA, recordB],
    allowedScope: ["src/index.ts"]
  });

  const second = buildWorkPacket({
    objective: "obj",
    currentContext: [recordB, recordA],
    allowedScope: ["src/index.ts"]
  });

  assert.deepEqual(first, second, "work packets should be identical regardless of input record order");
});
