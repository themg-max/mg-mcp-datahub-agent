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
- Default path consumes **synthetic / recorded** DataHub-shaped metadata (fixtures).
- Optional future live transport remains read-only and is not required for the judge demo.
- Official open-source `mcp-server-datahub` local verification is documented as optional historical evidence only.

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

**Recorded MCP read-only contract harness is verified. Live official MCP server validation remains a separate validation step.**

No live MCP connection, production DataHub access, or autonomous execution is claimed by this harness.

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
- The MG MCP governance architecture (lane/worktree discipline, authority model, review handoffs) existed prior to this public adapter. That baseline provides the policy and operational context this adapter targets.

## What was built during the competition
- A public TypeScript reference implementation that:
  - Normalizes DataHub-shaped metadata into source-neutral context records.
  - Produces deterministic, canonicalized work packets with provenance and sorted, deduplicated arrays for stable output.
  - Adds tests that prove reordered inputs and duplicate provenance are handled deterministically.
  - Adds fixture-driven demo and CI workflow suitable for public review.
  - Adds an official-MCP recorded-response read-only contract harness with committed proof summary.
  - Adds judge preflight/demo scripts, quickstart, competition evidence index, and sanitized VERIFIED_LOCAL_ONLY local-oss proof packaging.
- Baseline vs new-work disclosure: [docs/competition/baseline-new-work-disclosure.md](docs/competition/baseline-new-work-disclosure.md)

## What remains private
- Production MG MCP servers, private configuration, and any internal integration code remain in private repositories and are not part of this public adapter.
- No private data, credentials, or operational secrets are included in this repository.

## Next phase: official DataHub MCP integration
The next phase is official DataHub MCP integration in PR #2 of this public repository. That work will happen in a separate, authorized workstream with the appropriate access controls, credentials, and operational governance.

## Competition Evidence
- Competition: Build with DataHub: The Agent Hackathon
- Baseline (pre-existing): MG MCP governance and architecture existed prior to this public adapter
- New public work: This TypeScript DataHub adapter and deterministic work-packet generator
- AI contribution: Copilot coding agent assisted in edits; human reviewers scoped, approved, and validated the public reference implementation and the no-write, fixture-first demo boundary
- Validation carried out: `npm ci`, `npm run typecheck`, `npm test`, `npm run build`, `npm run demo:json` (JSON parse validation), security scan
- Pull request: Draft PR #1 on branch `copilot/initial-implementation`
- Demo video: Not yet recorded

## License
Apache-2.0 (`LICENSE`)
