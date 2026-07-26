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

const canonicalUrl = "https://catalog.example/shared/entity/1";

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

test("keeps same URL with different ids distinct", () => {
  const first: NormalizedContextRecord = {
    ...recordA,
    provenance: [
      {
        id: "urn:shared:entity:alpha",
        title: "Alpha",
        canonicalUrl,
        sourceType: "datahub_document",
        retrievedAt: new Date("2026-07-20T12:00:00.000Z").toISOString()
      }
    ]
  };

  const second: NormalizedContextRecord = {
    ...recordB,
    provenance: [
      {
        id: "urn:shared:entity:beta",
        title: "Beta",
        canonicalUrl,
        sourceType: "datahub_document",
        retrievedAt: new Date("2026-07-20T12:00:00.000Z").toISOString()
      }
    ]
  };

  const packet = buildWorkPacket({
    objective: "obj",
    currentContext: [first, second],
    allowedScope: ["src/index.ts"]
  });

  assert.equal(packet.sourceReferences.length, 2);
  assert.notEqual(packet.sourceReferences[0]?.id, packet.sourceReferences[1]?.id);
});

test("keeps same source id with different retrievedAt distinct", () => {
  const first: NormalizedContextRecord = {
    ...recordA,
    provenance: [
      {
        id: "urn:shared:entity:1",
        title: "Shared Entity",
        canonicalUrl,
        sourceType: "datahub_document",
        retrievedAt: new Date("2026-07-20T12:00:00.000Z").toISOString()
      }
    ]
  };

  const second: NormalizedContextRecord = {
    ...recordB,
    provenance: [
      {
        id: "urn:shared:entity:1",
        title: "Shared Entity",
        canonicalUrl,
        sourceType: "datahub_document",
        retrievedAt: new Date("2026-07-21T12:00:00.000Z").toISOString()
      }
    ]
  };

  const packet = buildWorkPacket({
    objective: "obj",
    currentContext: [first, second],
    allowedScope: ["src/index.ts"]
  });

  assert.equal(packet.sourceReferences.length, 2);
  assert.notEqual(packet.sourceReferences[0]?.retrievedAt, packet.sourceReferences[1]?.retrievedAt);
});

test("duplicate context ids throw", () => {
  assert.throws(
    () =>
      buildWorkPacket({
        objective: "obj",
        currentContext: [
          { ...recordA, id: "dup" },
          { ...recordB, id: "dup" }
        ],
        allowedScope: ["src/index.ts"]
      }),
    /Duplicate NormalizedContextRecord id: dup/
  );
});

test("whitespace-only values are removed and trimmed duplicates collapse", () => {
  const packet = buildWorkPacket({
    objective: "obj",
    currentContext: [recordA],
    allowedScope: ["  src/z.ts  ", "", "src/a.ts", "src/a.ts"],
    blockedScope: [" ", "block-b", " block-a ", "block-b"],
    requiredValidation: ["  custom review  ", "custom review"],
    unknowns: ["", "  unknown-a  ", "unknown-a"]
  });

  assert.deepEqual(packet.allowedScope, ["src/a.ts", "src/z.ts"]);
  assert.deepEqual(packet.blockedScope, ["block-a", "block-b"]);
  assert.deepEqual(packet.requiredValidation, [
    "custom review",
    "Human review before any code, pull request, merge, deployment, or authority change.",
    "Validate approved context against the proposed file set."
  ]);
  assert.deepEqual(packet.unknowns, ["unknown-a"]);
});

test("reordered inputs produce identical work packets", () => {
  const first = buildWorkPacket({
    objective: "obj",
    currentContext: [recordA, recordB],
    allowedScope: ["src/utils.ts", "src/index.ts"]
  });

  const second = buildWorkPacket({
    objective: "obj",
    currentContext: [recordB, recordA],
    allowedScope: ["src/index.ts", "src/utils.ts"]
  });

  assert.deepEqual(first, second, "work packets should be identical regardless of input record order");
});
