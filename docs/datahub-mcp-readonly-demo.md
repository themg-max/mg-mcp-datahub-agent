# Official-MCP Recorded-Response Contract Harness (Local Slice)

## Purpose

Demonstrate one narrow **official-MCP recorded-response contract harness** that the governed context workflow can consume while preserving:

- attribution
- provenance
- authority state
- fail-closed behavior
- deterministic WorkPacket output
- mandatory human approval

**Claim scope (explicit — Mode A):** this path is a recorded-response contract harness only.
**No live MCP connection or official tool invocation occurs in Mode A.** Recorded
`source_identity` / `tool_identity` values are fixture contract labels, not discovered
server inventory. Mode A runtime classification: `MODE_A_RUNTIME=UNKNOWN`.

Live local-OSS verification is a **separate Mode B** path already verified on public main
(`MODE_B_RUNTIME=VERIFIED_LOCAL_ONLY`). See [datahub-judge-quickstart.md](./datahub-judge-quickstart.md).

Mode A does **not** perform live network MCP calls, store credentials, write to DataHub, write to MG MCP, deploy, or mutate IAM/OAuth.

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
| `fixture` | default / `--mode=fixture` | Safe default. Consumes the recorded envelope as fixture-backed replay. Authority `record_status=FIXTURE`. `MODE_A_RUNTIME=UNKNOWN`. |
| `mcp` | **explicit** `--mode=mcp` | Recorded-response contract label for the official-MCP path. Still uses a **local recorded** envelope in this slice (no live credentials/network; no official tool invocation). Authority `record_status=MCP_READONLY_RECORDED`. `MODE_A_RUNTIME=UNKNOWN`. |
| `local-oss` | **explicit** `--mode=local-oss` | Optional **live local DataHub OSS** path via official `mcp-server-datahub==0.6.0` over **HTTP** (`http://127.0.0.1:8000/mcp`) (Mode B). Fail-closed unless `DATAHUB_LOCAL_MCP_ALLOW=true` (exact literal). Exactly one read-only `tools/call`. Authority `record_status=LOCAL_OSS_MCP_LIVE_READ`, `runtime_retrieval_status=VERIFIED_LOCAL_ONLY` (`MODE_B_RUNTIME=VERIFIED_LOCAL_ONLY`). See [datahub-judge-quickstart.md](./datahub-judge-quickstart.md). |

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
- Mode A `runtime_retrieval_status` remains `UNKNOWN` (no live runtime claim)
- Mode B (when allowed) sets `runtime_retrieval_status=VERIFIED_LOCAL_ONLY` after exactly one read-only call

## Key paths

| Path | Role |
|------|------|
| `src/datahub/mcp-client.ts` | Official MCP read-only client (local recorded responses) |
| `src/datahub/context-adapter.ts` | Normalize + WorkPacket builder + proof summary |
| `src/cli.ts` | CLI entrypoint |
| `fixtures/datahub-mcp-readonly-response.json` | Recorded official MCP read-only envelope |
| `tests/datahub-mcp-readonly.test.ts` | Focused tests |
| `examples/generated-work-packet/datahub-mcp-readonly-work-packet.json` | Deterministic WorkPacket golden |
| `examples/official-mcp-proof/read-only-retrieval-summary.json` | Mode A proof summary |
| `examples/official-mcp-proof/local-oss-live-readonly-validation-summary.json` | Mode B public-main `VERIFIED_LOCAL_ONLY` proof |
| `examples/showcase-ecommerce/customer-email-normalization/` | Judge-visible generated development example (SYNTHETIC_FIXTURE) |
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

### Mode A — `examples/official-mcp-proof/read-only-retrieval-summary.json`

Includes harness class, retrieval mode, fixture contract labels for source/tool identity,
attribution, digests, freshness `UNKNOWN`, validation result, and notes that Mode A does
not perform live MCP connection or official tool invocation.

It excludes credentials, tokens, private endpoints, and production identifiers.

### Mode B — `examples/official-mcp-proof/local-oss-live-readonly-validation-summary.json`

Public-main verification against local DataHub OSS + official `mcp-server-datahub==0.6.0`
over HTTP. Records live server identity, tools/list inventory, selected read-only tool,
exactly one metadata `tools/call`, attributable entity identity, and
`runtime_retrieval_status=VERIFIED_LOCAL_ONLY`. Consumer eligibility remains `PROPOSED`.
No DataHub writes. No production activation. No managed Cloud OAuth.

## Remaining non-claims (not a pending Mode B gap)

These remain intentionally out of scope even after Mode B local-OSS verification:

1. approved metadata freshness window (current status remains `UNKNOWN`; no threshold invented)
2. managed Cloud OAuth / production tenant activation
3. DataHub writes or MG MCP writes
4. autonomous merge, deployment, or IAM mutation
5. treating Mode B entity identity as schema authority for unrelated generated SQL examples

Mode B live inventory + one read-only call is **already verified** on public main and is
not listed as a pending contract gap.

## Relationship to prior local vertical slice

The earlier fixture YAML planning surface under `docs/fixtures/showcase-ecommerce/**`
remains the synthetic fixture contract for competition packaging.

The judge-visible generated development example under
`examples/showcase-ecommerce/customer-email-normalization/` is **SYNTHETIC_FIXTURE**
packaging for competition review and is not live-MCP-derived schema.

## Stop condition

Mode A: stop after local recorded-response harness proof is ready for independent review.
Mode B: optional operator-owned local OSS path only; do not expand into Cloud OAuth,
writes, deployment, or production activation from this guide.
