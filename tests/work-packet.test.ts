import assert from "node:assert/strict";
import test from "node:test";
import { DataHubContextAdapter } from "../src/datahub/context-adapter.js";
import { buildWorkPacket } from "../src/work-packet.js";
import { readFile } from "node:fs/promises";

const adapter = new DataHubContextAdapter();

test("builds deterministic work packets from the fixture", async () => {
  const fixture = JSON.parse(await readFile(new URL("../../fixtures/datahub-context.json", import.meta.url), "utf8")) as { objective: string; allowedScope: string[]; blockedScope: string[]; requiredValidation: string[]; source: unknown };
  const normalized = adapter.normalize(fixture.source);
  const first = buildWorkPacket({
    objective: fixture.objective,
    currentContext: normalized,
    allowedScope: fixture.allowedScope,
    blockedScope: fixture.blockedScope,
    requiredValidation: fixture.requiredValidation
  });
  const second = buildWorkPacket({
    objective: fixture.objective,
    currentContext: normalized,
    allowedScope: fixture.allowedScope,
    blockedScope: fixture.blockedScope,
    requiredValidation: fixture.requiredValidation
  });

  assert.deepEqual(first, second);
  assert.equal(first.humanApprovalRequired, true);
  assert.ok(first.blockedScope.some((item) => item.includes("Planning-only")));
  assert.ok(first.blockedScope.some((item) => item.includes("Quarantined")));
  assert.ok(first.unknowns.some((item) => item.includes("Customer Risk Lookup Dependency")));
  assert.equal(first.sourceReferences.length, 4);
});
