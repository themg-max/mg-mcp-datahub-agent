# MG ContextOps DataHub Agent

A public TypeScript reference implementation that turns synthetic DataHub metadata into governed context and a bounded, human-reviewable work packet.

## Problem
AI agents can fail when context is stale, conflicting, untrusted, too broad, or detached from decision authority.

## What this project does
- Loads fixture data by default.
- Normalizes DataHub-shaped metadata into source-neutral context records.
- Builds a deterministic work packet with allowed scope, blocked scope, validation, and unknowns.
- Prints valid JSON for human review.

Generated packets are proposals only. They are never approval, deployment authority, or a write-back mechanism.

## DataHub usage
- Default judge path consumes **synthetic / recorded** DataHub-shaped metadata (fixtures) with zero secrets.
- Official DataHub MCP Server integration has been verified against **local DataHub OSS** in a bounded read-only validation.
- A sanitized `VERIFIED_LOCAL_ONLY` proof is committed under `examples/official-mcp-proof/`.
- The default judge path remains deterministic and zero-secret; no production activation or DataHub writes are claimed.

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

Optional Mode B is fail-closed unless explicitly allowed and does not claim production activation:

```bash
env -u DATAHUB_LOCAL_MCP_ALLOW ./scripts/datahub-judge-demo.sh --mode=local-oss
# expected: exit 3, BLOCKED, no MCP request
```

Sanitized historical local-only proof (VERIFIED_LOCAL_ONLY):
`examples/official-mcp-proof/local-oss-live-readonly-validation-summary.json`

Full guide: [docs/datahub-judge-quickstart.md](docs/datahub-judge-quickstart.md)
Competition index: [docs/competition/datahub-judge-submission-index.md](docs/competition/datahub-judge-submission-index.md)

## Official-MCP recorded-response contract harness

Bounded **official-MCP recorded-response contract harness**: a recorded DataHub MCP read-only response is normalized into a deterministic WorkPacket while preserving attribution, provenance, authority state, fail-closed behavior, and mandatory human approval.

**Recorded MCP read-only contract harness is verified (Mode A default).**
**Optional local OSS official MCP validation is documented as sanitized historical `VERIFIED_LOCAL_ONLY` evidence and is not production activation.**

Mode A claims no live MCP connection. No production DataHub access, DataHub writes, or autonomous execution are claimed.

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
examples/
  generated-work-packet/
    work-packet.json
  official-mcp-proof/
    read-only-retrieval-summary.json
    local-oss-live-readonly-validation-summary.json
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
tests/
  context-adapter.test.ts
  datahub-client.test.ts
  work-packet.test.ts
  work-packet.dedup.test.ts
```

## Example work packet
A deterministic example is committed at `fixtures/datahub-context.json`.

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
- Default demo and judge Mode A are fixture / recorded-response only.
- Recorded MCP read-only contract harness is verified in-repo.
- Optional local OSS Mode B is fail-closed by default; historical local proof is VERIFIED_LOCAL_ONLY and is not production activation.
- Managed Cloud OAuth / production tenant activation is not claimed.
- No DataHub writes, MG MCP writes, autonomous PR merge, deployment, IAM, or secret mutation paths are included.

## How this advances MG MCP
This repository is a focused, public proof-of-concept adapter that demonstrates how provider-shaped metadata (DataHub-shaped records) can be translated into a public model inspired by MG MCP: `NormalizedContextRecord[]` and a deterministic `WorkPacket` suitable for human review.

## What existed before the competition
- MG MCP governance concepts and earlier fixture/bootstrap work pre-existed this competition submission (lane/worktree discipline, authority model, human approval, fail-closed unknowns, review handoffs, and early public fixture-first bootstrap).
- This repository does **not** claim the whole MG platform was created during the competition.

## What was built during the competition
- Competition work added:
  - official MCP recorded-response integration and proof
  - live-local official MCP read-only validation (sanitized `VERIFIED_LOCAL_ONLY` public proof)
  - deterministic Mode A judge packaging and fail-closed Mode B gate
  - tests, quickstart, competition evidence index, and public examples
  - governed WorkPacket generation from DataHub-shaped metadata
- Baseline vs new-work disclosure: [docs/competition/baseline-new-work-disclosure.md](docs/competition/baseline-new-work-disclosure.md)

## What remains private
- Production MG MCP servers, private configuration, and any internal integration code remain in private repositories and are not part of this public adapter.
- No private data, credentials, or operational secrets are included in this repository.

## Official MCP status (submission-aligned)
Official DataHub MCP Server integration has been verified against local DataHub OSS in a bounded read-only validation. The public repository includes a sanitized `VERIFIED_LOCAL_ONLY` proof. The default judge path remains deterministic and zero-secret; no production activation or DataHub writes are claimed.

Managed Cloud OAuth / production tenant activation remains out of scope.

## Competition Evidence
- Competition: Build with DataHub: The Agent Hackathon
- Category target: Metadata-Aware Code Generation & Development
- Technologies: DataHub OSS / Core Platform; DataHub MCP Server
- Baseline form choice: **Includes pre-existing code** (see disclosure doc above)
- Public repo: https://github.com/themg-max/mg-mcp-datahub-agent
- Sample output: https://github.com/themg-max/mg-mcp-datahub-agent/tree/main/examples
- Judge packaging sync: PR #26 (`4e567221687a6e9c42fcc81fa05e4ea06281259d`)
- Validation carried out on clean `main`: `npm ci`, preflight, Mode A demo PASS, fail-closed Mode B exit 3, `npm test` (31 pass)
- Demo video: record 2:40–2:55 covering problem thesis, VERIFIED_LOCAL_ONLY proof, Mode A run, generated WorkPacket, fail-closed Mode B, baseline disclosure, and judge quickstart; publish on public YouTube or Vimeo and verify in incognito

## License
Apache-2.0 (`LICENSE`)
