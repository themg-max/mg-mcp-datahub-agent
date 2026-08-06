import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { parseArgs, runCli } from '../src/cli.js';
import {
  buildProofSummary,
  buildMcpReadonlyWorkPacket,
  normalizeRetrieval,
  runReadonlyContextPipeline,
} from '../src/datahub/context-adapter.js';
import {
  DEFAULT_MCP_READONLY_FIXTURE_REL_PATH,
  loadOfficialMcpReadonlyResponse,
  McpReadonlyError,
  METADATA_FRESHNESS_POLICY,
  parseOfficialMcpReadonlyResponse,
  REQUIRED_RECORDED_CONTRACT_CLASS,
  retrieveReadonly,
  sha256Hex,
  stableJsonStringify,
} from '../src/datahub/mcp-client.js';

// Tests are intended to run from the lane worktree / repository root.
const repoRoot = process.cwd();

function readFixtureJson(): unknown {
  const abs = path.join(repoRoot, DEFAULT_MCP_READONLY_FIXTURE_REL_PATH);
  return JSON.parse(fs.readFileSync(abs, 'utf8'));
}

function writeTempResponse(mutator: (value: Record<string, unknown>) => void): string {
  const base = readFixtureJson() as Record<string, unknown>;
  const clone = structuredClone(base);
  mutator(clone);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'datahub-mcp-readonly-'));
  const file = path.join(dir, 'response.json');
  fs.writeFileSync(file, `${JSON.stringify(clone, null, 2)}\n`, 'utf8');
  return file;
}

test('fixture mode is the default retrieval mode', () => {
  const opts = parseArgs([], repoRoot);
  // CLI default without --mode remains legacy fixture demo; harness mode defaults at retrieveReadonly.
  assert.equal(opts.mode, undefined);

  const result = retrieveReadonly({ repoRoot });
  assert.equal(result.mode, 'fixture');
  assert.equal(result.response_path, DEFAULT_MCP_READONLY_FIXTURE_REL_PATH);
});

test('fixture mode produces normalized record and deterministic work packet', () => {
  const a = runReadonlyContextPipeline({ mode: 'fixture', repoRoot });
  const b = runReadonlyContextPipeline({ mode: 'fixture', repoRoot });

  assert.equal(a.normalized.record.authority.record_status, 'FIXTURE');
  assert.equal(a.normalized.record.authority.consumer_eligibility, 'PROPOSED');
  assert.equal(a.normalized.record.authority.runtime_retrieval_status, 'UNKNOWN');
  assert.equal(a.workPacket.packet.human_approval_required, true);
  assert.equal(a.workPacket.text, b.workPacket.text);
  assert.equal(a.workPacket.artifact_sha256, b.workPacket.artifact_sha256);
  assert.equal(a.normalized.text, b.normalized.text);
  assert.equal(a.retrieval.content_digest, b.retrieval.content_digest);
  assert.match(a.retrieval.content.dataset_urn, /^urn:li:dataset:/);
  // Digest contract: packet_content_digest is pre-final; artifact_sha256 is full file.
  assert.ok(a.workPacket.packet.digests.packet_content_digest);
  assert.ok(a.workPacket.artifact_sha256);
  assert.notEqual(
    a.workPacket.packet.digests.packet_content_digest,
    a.workPacket.artifact_sha256,
  );
});

test('explicit mcp mode consumes recorded official readonly path', () => {
  const result = runReadonlyContextPipeline({ mode: 'mcp', repoRoot });
  assert.equal(result.retrieval.mode, 'mcp');
  assert.equal(result.normalized.record.authority.record_status, 'MCP_READONLY_RECORDED');
  assert.equal(
    result.normalized.record.authority.source_binding_status,
    'MCP_READONLY_RECORDED_LOCAL',
  );
  assert.equal(result.retrieval.source.system, 'DataHub');
  assert.equal(result.retrieval.tool.operation, 'read');
  assert.equal(result.workPacket.packet.human_approval_required, true);
  assert.equal(result.workPacket.packet.retrieval.mode, 'mcp');
  // Fixture contract labels only — not discovered live server inventory.
  assert.equal(result.workPacket.packet.retrieval.source_identity, 'datahub-official-mcp');
  assert.equal(result.workPacket.packet.retrieval.tool_identity, 'datahub.mcp.getDataset');
  assert.match(
    result.workPacket.packet.objective,
    /No live MCP connection or official tool invocation has yet occurred/,
  );
  assert.ok(
    result.workPacket.packet.unknowns.some((item) =>
      item.includes('actual tools/list from a live official DataHub MCP server'),
    ),
  );
});

test('missing attribution fails closed before content normalization', () => {
  const temp = writeTempResponse((value) => {
    delete value.attribution;
  });

  assert.throws(
    () => retrieveReadonly({ mode: 'fixture', responsePath: temp, repoRoot }),
    (error: unknown) =>
      error instanceof McpReadonlyError && error.code === 'MISSING_ATTRIBUTION',
  );

  assert.throws(
    () => {
      const raw = readFixtureJson() as Record<string, unknown>;
      delete raw.attribution;
      parseOfficialMcpReadonlyResponse(raw);
    },
    (error: unknown) =>
      error instanceof McpReadonlyError && error.code === 'MISSING_ATTRIBUTION',
  );
});

test('incomplete attribution fields fail closed', () => {
  const temp = writeTempResponse((value) => {
    const attribution = value.attribution as Record<string, unknown>;
    attribution.owner_team = '';
  });

  assert.throws(
    () => retrieveReadonly({ mode: 'mcp', responsePath: temp, repoRoot }),
    (error: unknown) =>
      error instanceof McpReadonlyError && error.code === 'MISSING_REQUIRED_FIELD',
  );
});

test('attribution conflict with content ownership fails closed', () => {
  const temp = writeTempResponse((value) => {
    const attribution = value.attribution as Record<string, unknown>;
    attribution.owner_team = 'team-a';
    const content = value.content as Record<string, unknown>;
    const ownership = content.ownership as Record<string, unknown>;
    ownership.owner_team = 'team-b';
  });

  assert.throws(
    () => retrieveReadonly({ mode: 'mcp', responsePath: temp, repoRoot }),
    (error: unknown) =>
      error instanceof McpReadonlyError && error.code === 'ATTRIBUTION_CONFLICT',
  );
});

test('invalid provenance retrieved_at fails closed', () => {
  const temp = writeTempResponse((value) => {
    const provenance = value.provenance as Record<string, unknown>;
    provenance.retrieved_at = 'invalid';
  });

  assert.throws(
    () => retrieveReadonly({ mode: 'mcp', responsePath: temp, repoRoot }),
    (error: unknown) =>
      error instanceof McpReadonlyError && error.code === 'INVALID_PROVENANCE',
  );
});

test('contract_class mismatch fails closed', () => {
  const temp = writeTempResponse((value) => {
    value.contract_class = 'not-the-recorded-response-contract';
  });

  assert.throws(
    () => retrieveReadonly({ mode: 'fixture', responsePath: temp, repoRoot }),
    (error: unknown) =>
      error instanceof McpReadonlyError &&
      error.code === 'CONTRACT_MISMATCH' &&
      error.details.expected === REQUIRED_RECORDED_CONTRACT_CLASS,
  );
});

test('freshness_status remains UNKNOWN without approved policy', () => {
  const result = retrieveReadonly({ mode: 'fixture', repoRoot });
  assert.equal(result.freshness_status, 'UNKNOWN');
  assert.equal(result.freshness_policy, METADATA_FRESHNESS_POLICY);

  const proof = buildProofSummary(runReadonlyContextPipeline({ mode: 'fixture', repoRoot }));
  assert.equal(proof.freshness_status, 'UNKNOWN');
  assert.equal(proof.validation_result.freshness_status, 'UNKNOWN');
  assert.match(proof.freshness_policy, /UNKNOWN until approved/);
});

test('non-read tool operation fails closed', () => {
  const temp = writeTempResponse((value) => {
    const tool = value.tool as Record<string, unknown>;
    tool.operation = 'write';
  });

  assert.throws(
    () => retrieveReadonly({ mode: 'mcp', responsePath: temp, repoRoot }),
    (error: unknown) =>
      error instanceof McpReadonlyError && error.code === 'NON_READONLY_OPERATION',
  );
});

test('explicit mcp mode rejects envelopes that are not official readonly', () => {
  const temp = writeTempResponse((value) => {
    value.retrieval_mode = 'something-else';
  });

  assert.throws(
    () => retrieveReadonly({ mode: 'mcp', responsePath: temp, repoRoot }),
    (error: unknown) =>
      error instanceof McpReadonlyError && error.code === 'MCP_MODE_CONTRACT_MISMATCH',
  );
});

test('retrieved content remains data only in normalized record', () => {
  const result = runReadonlyContextPipeline({ mode: 'fixture', repoRoot });
  const dataKeys = Object.keys(result.normalized.record.data).sort();
  assert.deepEqual(dataKeys, [
    'dataset_urn',
    'description',
    'governance_labels',
    'name',
    'ownership',
    'platform',
    'quality_assertions',
    'schema',
    'upstream_lineage',
  ]);
  assert.equal('credentials' in result.normalized.record.data, false);
  assert.equal('token' in (result.normalized.record as unknown as Record<string, unknown>), false);
});

test('proof summary captures required retrieval fields without secrets', () => {
  const result = runReadonlyContextPipeline({ mode: 'mcp', repoRoot });
  const proof = buildProofSummary(result);
  const text = stableJsonStringify(proof);

  assert.equal(proof.status, 'PASS');
  assert.equal(proof.harness_class, 'official-mcp-recorded-response-contract-harness');
  assert.equal(proof.retrieval_mode, 'mcp');
  assert.ok(proof.source_identity);
  assert.ok(proof.tool_identity);
  assert.ok(proof.attribution.owner_team);
  assert.ok(proof.content_digest);
  assert.ok(proof.normalized_record_digest);
  assert.equal(
    proof.packet_content_digest,
    result.workPacket.packet.digests.packet_content_digest,
  );
  assert.equal(proof.artifact_sha256, result.workPacket.artifact_sha256);
  assert.notEqual(proof.packet_content_digest, proof.artifact_sha256);
  assert.equal(proof.validation_result.ok, true);
  assert.match(text, /human_approval_required/);
  assert.match(text, /No live MCP connection or official tool invocation has yet occurred/);
  assert.match(text, /fixture contract labels, not discovered server inventory/);
  // Reject credential-shaped values; allow governance words like "secret_materialization" in deny-lists.
  assert.equal(
    /password\s*[:=]|api[_-]?key\s*[:=]|Bearer\s+[A-Za-z0-9._-]+|-----BEGIN/i.test(text),
    false,
  );
});

test('stableJsonStringify preserves dangerous own keys at top level and nested', () => {
  // Object-literal `__proto__` would mutate [[Prototype]]; define own keys explicitly.
  const nested = Object.create(null) as Record<string, unknown>;
  for (const [key, value] of [
    ['a', 1],
    ['b', 2],
    ['__proto__', 'nested-proto-value'],
    ['constructor', 'nested-constructor-value'],
    ['prototype', 'nested-prototype-value'],
  ] as Array<[string, unknown]>) {
    Object.defineProperty(nested, key, {
      value,
      enumerable: true,
      writable: true,
      configurable: true,
    });
  }

  const sample = Object.create(null) as Record<string, unknown>;
  for (const [key, value] of [
    ['z', 1],
    ['__proto__', { polluted: true }],
    ['constructor', { note: 'own-constructor-key' }],
    ['prototype', { note: 'own-prototype-key' }],
    ['nested', nested],
  ] as Array<[string, unknown]>) {
    Object.defineProperty(sample, key, {
      value,
      enumerable: true,
      writable: true,
      configurable: true,
    });
  }

  const first = stableJsonStringify(sample);
  const second = stableJsonStringify(sample);
  assert.equal(first, second, 'repeated serialization must be byte-identical');

  const own = (obj: object, key: string): unknown =>
    Object.getOwnPropertyDescriptor(obj, key)?.value;

  const parsed = JSON.parse(first) as Record<string, unknown>;
  assert.equal(Object.prototype.hasOwnProperty.call(parsed, '__proto__'), true);
  assert.equal(Object.prototype.hasOwnProperty.call(parsed, 'constructor'), true);
  assert.equal(Object.prototype.hasOwnProperty.call(parsed, 'prototype'), true);
  assert.deepEqual(own(parsed, '__proto__'), { polluted: true });
  assert.deepEqual(own(parsed, 'constructor'), { note: 'own-constructor-key' });
  assert.deepEqual(own(parsed, 'prototype'), { note: 'own-prototype-key' });

  const nestedParsed = own(parsed, 'nested') as Record<string, unknown>;
  assert.equal(Object.prototype.hasOwnProperty.call(nestedParsed, '__proto__'), true);
  assert.equal(own(nestedParsed, '__proto__'), 'nested-proto-value');
  assert.equal(own(nestedParsed, 'constructor'), 'nested-constructor-value');
  assert.equal(own(nestedParsed, 'prototype'), 'nested-prototype-value');

  // Keys remain sorted in the canonical text.
  assert.match(first, /"__proto__"/);
  assert.ok(first.indexOf('"__proto__"') < first.indexOf('"constructor"'));
  assert.ok(first.indexOf('"constructor"') < first.indexOf('"nested"'));
  assert.ok(first.indexOf('"nested"') < first.indexOf('"prototype"'));
  assert.ok(first.indexOf('"prototype"') < first.indexOf('"z"'));

  // Round-trip through JSON.parse: own dangerous keys must survive re-canonicalization.
  // Prefer descriptor-based rebuild because JSON.parse may special-case `__proto__`.
  const reparsed = JSON.parse(first) as Record<string, unknown>;
  const rebuilt = Object.create(null) as Record<string, unknown>;
  for (const key of Object.keys(reparsed).sort()) {
    Object.defineProperty(rebuilt, key, {
      value: reparsed[key],
      enumerable: true,
      writable: true,
      configurable: true,
    });
  }
  // Ensure __proto__ own key is copied even if Object.keys omitted it after parse.
  if (Object.prototype.hasOwnProperty.call(reparsed, '__proto__')) {
    Object.defineProperty(rebuilt, '__proto__', {
      value: Object.getOwnPropertyDescriptor(reparsed, '__proto__')?.value,
      enumerable: true,
      writable: true,
      configurable: true,
    });
  }
  const roundTrip = stableJsonStringify(rebuilt);
  assert.equal(roundTrip, first);

  // Direct repeated stableJsonStringify on the original sample remains byte-identical
  // (primary regression: own-key preservation through sortKeysDeep).
  assert.equal(stableJsonStringify(sample), first);
});

test('CLI default fixture mode and explicit mcp mode both succeed', () => {
  const fixtureRun = runCli([], repoRoot);
  assert.equal(fixtureRun.exitCode, 0, fixtureRun.stderr);
  const fixtureJson = JSON.parse(fixtureRun.stdout);
  assert.equal(fixtureJson.retrieval_mode, 'fixture');
  assert.equal(fixtureJson.human_approval_required, true);
  assert.equal(
    fixtureJson.harness_class,
    'official-mcp-recorded-response-contract-harness',
  );
  assert.ok(fixtureJson.digests.packet_content_digest);
  assert.ok(fixtureJson.digests.artifact_sha256);
  assert.notEqual(
    fixtureJson.digests.packet_content_digest,
    fixtureJson.digests.artifact_sha256,
  );
  assert.equal(fixtureJson.claim_scope.live_mcp_connection, false);
  assert.equal(fixtureJson.claim_scope.official_tool_invocation, false);

  const mcpRun = runCli(['--mode=mcp'], repoRoot);
  assert.equal(mcpRun.exitCode, 0, mcpRun.stderr);
  const mcpJson = JSON.parse(mcpRun.stdout);
  assert.equal(mcpJson.retrieval_mode, 'mcp');
  assert.equal(mcpJson.status, 'PASS');
  assert.equal(mcpJson.claim_scope.live_mcp_connection, false);
});

test('CLI write-examples emits deterministic goldens under examples/**', () => {
  const first = runCli(['--mode=fixture', '--write-examples'], repoRoot);
  assert.equal(first.exitCode, 0, first.stderr);

  const workPacketPath = path.join(
    repoRoot,
    'examples/generated-work-packet/datahub-mcp-readonly-work-packet.json',
  );
  const proofPath = path.join(
    repoRoot,
    'examples/official-mcp-proof/read-only-retrieval-summary.json',
  );
  assert.equal(fs.existsSync(workPacketPath), true);
  assert.equal(fs.existsSync(proofPath), true);

  const workPacketText = fs.readFileSync(workPacketPath, 'utf8');
  const proofText = fs.readFileSync(proofPath, 'utf8');

  const second = runCli(['--mode=fixture', '--write-examples'], repoRoot);
  assert.equal(second.exitCode, 0, second.stderr);
  assert.equal(fs.readFileSync(workPacketPath, 'utf8'), workPacketText);
  assert.equal(fs.readFileSync(proofPath, 'utf8'), proofText);

  const packet = JSON.parse(workPacketText);
  assert.equal(packet.human_approval_required, true);
  assert.equal(packet.packet_type, 'datahub_mcp_readonly_work_packet');

  // Re-normalize from source and compare byte-for-byte with golden WorkPacket body fields.
  const live = runReadonlyContextPipeline({ mode: 'fixture', repoRoot });
  assert.equal(live.workPacket.text, workPacketText);
});

test('adapter normalize + work packet helpers stay pure given a retrieval result', () => {
  const retrieval = retrieveReadonly({ mode: 'fixture', repoRoot });
  const normalized = normalizeRetrieval(retrieval);
  const workPacket = buildMcpReadonlyWorkPacket(normalized.record);
  assert.equal(workPacket.packet.digests.content_digest, retrieval.content_digest);
  assert.equal(
    workPacket.packet.digests.normalized_record_digest,
    normalized.record.digests.normalized_record_digest,
  );
});

test('independent digest verification recomputes packet_content_digest and artifact_sha256', () => {
  const result = runReadonlyContextPipeline({ mode: 'fixture', repoRoot });
  const proof = buildProofSummary(result);

  // Independent recompute of complete serialized WorkPacket file hash.
  const recomputedArtifactSha = sha256Hex(result.workPacket.text);
  assert.equal(recomputedArtifactSha, result.workPacket.artifact_sha256);
  assert.equal(proof.artifact_sha256, result.workPacket.artifact_sha256);

  // Independent recompute of pre-final packet body digest:
  // strip packet_content_digest, re-canonicalize, hash.
  const packetClone = structuredClone(result.workPacket.packet) as unknown as {
    digests: { packet_content_digest?: string } & Record<string, unknown>;
  } & Record<string, unknown>;
  delete packetClone.digests.packet_content_digest;
  const recomputedPacketContentDigest = sha256Hex(stableJsonStringify(packetClone));
  assert.equal(
    recomputedPacketContentDigest,
    result.workPacket.packet.digests.packet_content_digest,
  );
  assert.equal(proof.packet_content_digest, recomputedPacketContentDigest);

  // The two digests must remain distinct classes of evidence.
  assert.notEqual(proof.packet_content_digest, proof.artifact_sha256);
  assert.ok(proof.packet_content_digest);
  assert.ok(proof.artifact_sha256);
});

test('loadOfficialMcpReadonlyResponse reads the checked-in fixture', () => {
  const abs = path.join(repoRoot, DEFAULT_MCP_READONLY_FIXTURE_REL_PATH);
  const response = loadOfficialMcpReadonlyResponse(abs);
  assert.equal(response.tool.operation, 'read');
  assert.equal(response.source.identity, 'datahub-official-mcp');
});
