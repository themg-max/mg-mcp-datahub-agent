# MG ContextOps DataHub Agent

A public TypeScript reference implementation that turns synthetic DataHub metadata into governed context and a bounded, human-reviewable work packet.

## Problem
AI agents can fail when context is stale, conflicting, untrusted, too broad, or detached from decision authority.

## What this project does
- Loads fixture data by default.
- Normalizes DataHub-shaped metadata into source-neutral context records.
- Builds a deterministic work packet with allowed scope, blocked scope, validation, and unknowns.
- Prints valid JSON for human review.
- Packages one judge-visible generated development example under `examples/showcase-ecommerce/customer-email-normalization/`.

Generated packets and generated code examples are proposals only. They are never approval, deployment authority, or a write-back mechanism.

## DataHub usage
- **Mode A (default):** deterministic fixture / recorded-response harness. Zero secrets.
  `runtime_retrieval_status=UNKNOWN`. No live MCP invocation claim.
- **Mode B (optional, verified on public main against local DataHub OSS):** the public
  implementation was verified against local DataHub OSS using the official
  `mcp-server-datahub==0.6.0` server over HTTP. The validation discovered the live MCP
  tool inventory, selected a server-annotated read-only tool, executed exactly one
  attributable metadata retrieval, and preserved downstream authority as `PROPOSED`.
  Mode B requires `DATAHUB_LOCAL_MCP_ALLOW` to be exactly the literal string `true`
  (fail-closed otherwise). Classification: `VERIFIED_LOCAL_ONLY`.
- No DataHub writes, no managed Cloud OAuth, and no production activation are claimed.

### Runtime classification (explicit)

| Mode | Runtime status | Live invocation |
|------|----------------|-----------------|
| A | `MODE_A_RUNTIME=UNKNOWN` | No |
| B | `MODE_B_RUNTIME=VERIFIED_LOCAL_ONLY` | Exactly one read-only `tools/call` when allowed |

## Why governed context matters
- Planning-only evidence should not authorize implementation.
- Quarantined evidence should stay out of authority decisions.
- Unknown dependencies should fail closed instead of being guessed.

## Judge path (deterministic)

Default judge experience is **Mode A** (zero secrets, recorded-response harness):

```bash
npm ci
./scripts/datahub-judge-preflight.sh
./scripts/datahub-judge-demo.sh --mode=fixture
jq . examples/official-mcp-proof/read-only-retrieval-summary.json
```

Inspect the generated development example:

```bash
ls examples/showcase-ecommerce/customer-email-normalization/
jq . examples/showcase-ecommerce/customer-email-normalization/generation-proof.json
sqlite3 :memory: < examples/showcase-ecommerce/customer-email-normalization/validate_customer_email.sql
```

Optional Mode B is fail-closed unless explicitly allowed. With allow + local OSS GMS +
official MCP over **HTTP**, it performs exactly one live read-only metadata call
(not production activation). Canonical transport matches the committed live proof:

- package: `mcp-server-datahub==0.6.0`
- transport: HTTP JSON-RPC (`http-jsonrpc-stateless`)
- MCP URL: `http://127.0.0.1:8000/mcp`
- GMS: `http://localhost:8080`
- discovered tools: 8
- selected tool: `search` (`readOnlyHint=true`)
- `metadata_call_count=1`
- attributable entity identity present in proof
- `consumer_eligibility=PROPOSED`, `human_approval_required=true`

```bash
env -u DATAHUB_LOCAL_MCP_ALLOW ./scripts/datahub-judge-demo.sh --mode=local-oss
# expected: exit 3, BLOCKED, no MCP request

# Optional live path (operator-owned local stack; placeholders only):
# 1) GMS at http://localhost:8080
# 2) uvx --from mcp-server-datahub==0.6.0 mcp-server-datahub --transport http
# 3) then:
# export DATAHUB_LOCAL_MCP_ALLOW=true
# export DATAHUB_GMS_URL=http://localhost:8080
# export DATAHUB_GMS_TOKEN="<local-token>"
# export DATAHUB_LOCAL_MCP_URL=http://127.0.0.1:8000/mcp
# ./scripts/datahub-judge-demo.sh --mode=local-oss
```

Committed public-main Mode B proof (`VERIFIED_LOCAL_ONLY`):
`examples/official-mcp-proof/local-oss-live-readonly-validation-summary.json`

Full guide: [docs/datahub-judge-quickstart.md](docs/datahub-judge-quickstart.md)
Competition index: [docs/competition/datahub-judge-submission-index.md](docs/competition/datahub-judge-submission-index.md)

## Official-MCP recorded-response contract harness

Bounded **official-MCP recorded-response contract harness** (Mode A): a recorded DataHub MCP read-only response is normalized into a deterministic WorkPacket while preserving attribution, provenance, authority state, fail-closed behavior, and mandatory human approval.

**Mode A is verified in-repo and is not a live invocation claim.** Mode B separately
verifies the official open-source MCP server against **local DataHub OSS** when
explicitly allowed; that path is already `VERIFIED_LOCAL_ONLY` on public main.

No production DataHub access, managed Cloud OAuth, DataHub writes, or autonomous execution is claimed.

```bash
npm ci
npm run typecheck
npm test
npm run build
node dist/src/cli.js --mode=fixture
node dist/src/cli.js --mode=mcp
```

Details: [docs/datahub-mcp-readonly-demo.md](docs/datahub-mcp-readonly-demo.md)

## Architecture overview
- `DataHubClient`: read-only transport for optional metadata retrieval.
- `DataHubContextAdapter`: defensive normalization for synthetic or future provider input.
- `NormalizedContextRecord`: source-neutral governed context.
- `WorkPacket`: bounded proposal with mandatory human approval.
- `buildWorkPacket(...)`: deterministic packet builder for review output.

See `docs/architecture.md` for the full boundary model.

## Quickstart
### Supported platform
- Node.js 20+

### Install
```bash
npm ci
```

### Run the deterministic demo
```bash
npm run demo
```

### Validate
```bash
npm run typecheck
npm test
npm run build
```

## One-command demo
`npm run demo` builds the project, reads the committed fixture, and prints JSON to stdout.

## Repository structure
```text
README.md
LICENSE
.env.example
package.json
package-lock.json
tsconfig.json
.github/workflows/ci.yml
docs/
  architecture.md
  demo.md
  datahub-judge-quickstart.md
  datahub-mcp-readonly-demo.md
  mg-mcp-alignment.md
  competition/
  fixtures/showcase-ecommerce/
examples/
  generated-work-packet/
    work-packet.json
  official-mcp-proof/
    read-only-retrieval-summary.json
    local-oss-live-readonly-validation-summary.json
  showcase-ecommerce/
    customer-email-normalization/
  sample-pr/
    README.md
scripts/
  datahub-judge-preflight.sh
  datahub-judge-demo.sh
fixtures/
  datahub-context.json
  invalid-datahub-context.json
src/
  cli.ts
  work-packet.ts
  datahub/
    client.ts
    context-adapter.ts
    mcp-client.ts
    local-oss-mcp-client.ts
    local-oss-validation.ts
tests/
  context-adapter.test.ts
  datahub-client.test.ts
  datahub-mcp-readonly.test.ts
  datahub-mcp-local-readonly.test.ts
  work-packet.test.ts
  work-packet.dedup.test.ts
```

## Example work packet
Generated output: `examples/generated-work-packet/work-packet.json`

Input fixture: `fixtures/datahub-context.json`

## Generated development example
Path: `examples/showcase-ecommerce/customer-email-normalization/`

- Input classification: **SYNTHETIC_FIXTURE** (repository fixture contract `showcase-ecommerce`)
- Non-destructive SQL + schema + offline validation + `generation-proof.json`
- `consumer_eligibility=PROPOSED`, `human_approval_required=true`

## Trust and authority model
- Authority states: `approved`, `planning_only`, `quarantined`, `unknown`.
- Missing provenance fails closed.
- `humanApprovalRequired` is always `true`.
- Unknown, planning-only, and quarantined context is never treated as execution authority.

## Security and privacy boundaries
- No production DataHub credentials are required.
- Private configuration stays external to this repository.
- No autonomous GitHub writes, merges, deployments, or IAM changes exist.
- Environment variables are placeholders only.
- Errors avoid leaking response bodies or secrets.
- Default demo mode is fixture-based.

## Extension guide for other context providers
1. Add a provider-specific adapter that emits `NormalizedContextRecord[]`.
2. Keep transport separate from governance decisions.
3. Reuse `buildWorkPacket(...)` for bounded review output.

## Current limitations
- Default demo and judge Mode A are fixture / recorded-response only (`MODE_A_RUNTIME=UNKNOWN`).
- Recorded MCP read-only contract harness is verified in-repo for Mode A.
- Optional local OSS Mode B is fail-closed by default; public-main verification used official
  `mcp-server-datahub==0.6.0` for exactly one local read (`MODE_B_RUNTIME=VERIFIED_LOCAL_ONLY`).
  That is not production activation.
- Managed Cloud OAuth / production tenant activation is not claimed.
- No DataHub writes, MG MCP writes, autonomous PR merge, deployment, IAM, or secret mutation paths are included.

## How this advances MG MCP
This repository is a focused, public proof-of-concept adapter that demonstrates how provider-shaped metadata (DataHub-shaped records) can be translated into a public model inspired by MG MCP: `NormalizedContextRecord[]` and a deterministic `WorkPacket` suitable for human review.

## What existed before the competition
- The MG MCP governance architecture (lane/worktree discipline, authority model, review handoffs) existed prior to this public adapter. That baseline provides the policy and operational context this adapter targets.

## What was built during the competition
- A public TypeScript reference implementation that:
  - Normalizes DataHub-shaped metadata into source-neutral context records.
  - Produces deterministic, canonicalized work packets with provenance and sorted, deduplicated arrays for stable output.
  - Adds tests that prove reordered inputs and duplicate provenance are handled deterministically.
  - Adds fixture-driven demo and CI workflow suitable for public review.
  - Adds an official-MCP recorded-response read-only contract harness with committed proof summary.
  - Adds judge preflight/demo scripts, quickstart, competition evidence index, and public-main Mode B `VERIFIED_LOCAL_ONLY` proof packaging.
  - Ports the optional local DataHub OSS official MCP read-only driver (Mode B) with
    fail-closed allow gate, pinned `mcp-server-datahub==0.6.0`, and exactly one metadata read.
  - Adds one judge-visible generated development artifact for customer-email normalization
    under `examples/showcase-ecommerce/customer-email-normalization/` (**SYNTHETIC_FIXTURE**).
- Baseline vs new-work disclosure: [docs/competition/baseline-new-work-disclosure.md](docs/competition/baseline-new-work-disclosure.md)

## What remains private
- Production MG MCP servers, private configuration, and any internal integration code remain in private repositories and are not part of this public adapter.
- No private data, credentials, or operational secrets are included in this repository.

## Competition Evidence
- Competition: Build with DataHub: The Agent Hackathon
- Baseline (pre-existing): MG MCP governance and architecture existed prior to this public adapter
- New public work: hardened deterministic WorkPacket generation and provenance/authority contracts; the public adapter, proofs, Mode B local-OSS verification packaging, generated development example, and judge packaging were created or hardened during the competition and are packaged here as public-safe evidence.
- AI contribution: Copilot coding agent assisted in edits; human reviewers scoped, approved, and validated the public reference implementation and the no-write, fixture-first demo boundary
- Validation carried out: `npm ci`, `npm run typecheck`, `npm test`, `npm run build`, Mode A judge demo, Mode B fail-closed gate, offline generated-artifact validation, security scan
- Public implementation PRs (merged): `#1` initial reference implementation; `#25` recorded-response harness; `#29` public Mode B local-OSS read-only path
- Current submission packaging PR: see open `docs/datahub-final-publication-reconciliation-v1` PR on this repository
- Demo video: prepare from [docs/competition/public-demo-notes.md](docs/competition/public-demo-notes.md) (URL added when published)

## License
Apache-2.0 (`LICENSE`)
