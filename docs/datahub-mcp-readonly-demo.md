# Official-MCP Recorded-Response Contract Harness (Local Slice)

## Purpose

Demonstrate one narrow **official-MCP recorded-response contract harness** that the governed context workflow can consume while preserving:

- attribution
- provenance
- authority state
- fail-closed behavior
- deterministic WorkPacket output
- mandatory human approval

**Claim scope (explicit):** this path is a recorded-response contract harness only. **No live MCP connection or official tool invocation has yet occurred.** Recorded `source_identity` / `tool_identity` values are fixture contract labels, not discovered server inventory.

This slice does **not** perform live network MCP calls, store credentials, write to DataHub, write to MG MCP, deploy, or mutate IAM/OAuth.

## Architecture

```text
Recorded official DataHub MCP read-only response (fixture envelope)
        ↓
src/datahub/mcp-client.ts   (retrieve + validate + provenance)
        ↓
src/datahub/context-adapter.ts
        ↓
NormalizedContextRecord  (authority-aware, content is data only)
        ↓
WorkPacket               (deterministic, human_approval_required=true)
```

## Modes

| Mode | How to select | Behavior |
|------|---------------|----------|
| `fixture` | default / `--mode=fixture` | Safe default. Consumes the recorded envelope as fixture-backed replay. Authority `record_status=FIXTURE`. |
| `mcp` | **explicit** `--mode=mcp` | Recorded-response contract label for the official-MCP path. Still uses a **local recorded** envelope in this slice (no live credentials/network; no official tool invocation). Authority `record_status=MCP_READONLY_RECORDED`. |

## Quickstart

```bash
# Default fixture mode
node dist/src/cli.js --mode=fixture

# Explicit official MCP read-only mode (local recorded response)
node dist/src/cli.js --mode=mcp

# Materialize example WorkPacket + proof summary
node dist/src/cli.js --mode=fixture --write-examples
```

## Focused validation

```bash
# Focused slice tests (run from repository / worktree root)
npm test

# CLI modes
node dist/src/cli.js --mode=fixture
node dist/src/cli.js --mode=mcp

# Existing local DataHub vertical slice still works
git diff --check
```

Optional strict typecheck without mutating `package.json` (uses ambient `@types/node` when available):

```bash
# Example: point typeRoots at an available @types directory, then:
# npx tsc -p /tmp/tsconfig-datahub-mcp-readonly.json
```

> Public package scripts: `npm run typecheck`, `npm test`, `npm run build`, `npm run demo:json` (legacy fixture demo).

## Fail-closed rules

- Missing or incomplete `attribution` → refuse before content is trusted
- `attribution.owner_team` / `data_governance_owner` conflict with `content.ownership` → `ATTRIBUTION_CONFLICT`
- `provenance.retrieved_at` must be a valid ISO-8601 timestamp → otherwise `INVALID_PROVENANCE`
- `contract_class` must be exactly `official-datahub-mcp-readonly-recorded-response` → otherwise `CONTRACT_MISMATCH`
- Metadata `freshness_status` remains `UNKNOWN` until an explicit freshness window is approved (no threshold invented)
- `tool.operation` must be exactly `read`
- Explicit `--mode=mcp` requires `retrieval_mode=official_datahub_mcp_readonly` and `source.system=DataHub`
- WorkPacket always sets `human_approval_required: true`
- `consumer_eligibility` remains `PROPOSED`
- `runtime_retrieval_status` remains `UNKNOWN` (no live runtime claim)

## Key paths

| Path | Role |
|------|------|
| `src/datahub/mcp-client.ts` | Official MCP read-only client (local recorded responses) |
| `src/datahub/context-adapter.ts` | Normalize + WorkPacket builder + proof summary |
| `src/cli.ts` | CLI entrypoint |
| `fixtures/datahub-mcp-readonly-response.json` | Recorded official MCP read-only envelope |
| `tests/datahub-mcp-readonly.test.ts` | Focused tests |
| `examples/generated-work-packet/datahub-mcp-readonly-work-packet.json` | Deterministic WorkPacket golden |
| `examples/official-mcp-proof/read-only-retrieval-summary.json` | Proof summary |
| `docs/datahub-mcp-readonly-demo.md` | This demo guide |

## Digest contract

| Field | Definition |
|-------|------------|
| `content_digest` | SHA-256 of canonical retrieved content payload |
| `envelope_digest` | SHA-256 of canonical recorded response envelope |
| `normalized_record_digest` | SHA-256 of canonical normalized record draft (pre-final embed) |
| `packet_content_digest` | SHA-256 of the **pre-final** WorkPacket body (before this digest field is embedded) |
| `artifact_sha256` | SHA-256 of the **complete serialized** WorkPacket file bytes |

WorkPacket, proof summary, CLI output, tests, and docs use these same definitions. `packet_content_digest` and `artifact_sha256` are intentionally different values.

## Proof summary fields

`examples/official-mcp-proof/read-only-retrieval-summary.json` includes:

- harness class (`official-mcp-recorded-response-contract-harness`)
- retrieval mode
- source identity (fixture contract label)
- tool identity (fixture contract label)
- attribution
- content digest
- normalized record digest
- packet content digest
- artifact sha256
- freshness status (`UNKNOWN` until policy approval)
- validation result
- claim notes stating no live MCP connection or official tool invocation has yet occurred

It excludes credentials, tokens, private endpoints, and production identifiers.

Independent verification: `sha256(serialized WorkPacket) == artifact_sha256` and
`sha256(pre-final packet body) == packet_content_digest`, with
`packet_content_digest != artifact_sha256`.

## Contract-gap inventory (pending live pass)

Recorded as pending before any public-repo / live-MCP execution claim:

1. actual `tools/list` from a live official DataHub MCP server
2. actual server/connection identity
3. actual read-tool identity (not fixture labels)
4. one isolated read-only call over a live MCP connection
5. approved metadata freshness window (current status remains `UNKNOWN`; no threshold invented)
6. public-repository promotion/CI and independent Reviewer Disposition
7. successor lane `datahub-official-mcp-live-readonly-validation-v1` (do not extend the recorded-response lane)

## Relationship to prior local vertical slice

The earlier fixture YAML → generated artifact demo under `scripts/lib/datahub-vertical-slice/**` remains intact and is the prior PASS path for synthetic DataHub-inspired metadata.

This lane adds a **separate** official-MCP recorded-response contract harness under the allowed TypeScript surface without modifying the prior slice libraries.

## Stop condition

Stop after local recorded-response harness proof is ready for independent review. Do not connect live DataHub MCP, invoke official tools, package secrets, deploy, or expand scope.
