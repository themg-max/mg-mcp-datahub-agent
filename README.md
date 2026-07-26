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

## Why governed context matters
- Planning-only evidence should not authorize implementation.
- Quarantined evidence should stay out of authority decisions.
- Unknown dependencies should fail closed instead of being guessed.

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
src/
  cli.ts
  work-packet.ts
  datahub/
    client.ts
    context-adapter.ts
fixtures/
  datahub-context.json
  invalid-datahub-context.json
tests/
  context-adapter.test.ts
  datahub-client.test.ts
  work-packet.test.ts
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
- No autonomous GitHub writes, merges, deployments, or IAM changes exist.
- Environment variables are placeholders only.
- Errors avoid leaking response bodies or secrets.
- Default demo mode is fixture-based.

## Extension guide for other context providers
1. Add a provider-specific adapter that emits `NormalizedContextRecord[]`.
2. Keep transport separate from governance decisions.
3. Reuse `buildWorkPacket(...)` for bounded review output.

## Current limitations
- The default demo uses synthetic fixture data only.
- Live DataHub endpoints are intentionally unverified and optional.
- No PR creation, merge, deployment, database, web UI, or MCP server is included.

## How this advances MG MCP
This repository is a focused, public proof-of-concept adapter that demonstrates how provider-shaped metadata (DataHub-shaped records) can be translated into the MG MCP `NormalizedContextRecord[]` model and a deterministic `WorkPacket` suitable for human review.

## What existed before the competition
- The MG MCP governance architecture (lane/worktree discipline, authority model, review handoffs) existed prior to this public adapter. That baseline provides the policy and operational context this adapter targets.

## What was built during the competition
- A public TypeScript reference implementation that:
  - Normalizes DataHub-shaped metadata into source-neutral context records.
  - Produces deterministic, canonicalized work packets with provenance and sorted, deduplicated arrays for stable output.
  - Adds tests that prove reordered inputs and duplicate provenance are handled deterministically.
  - Adds fixture-driven demo and CI workflow suitable for public review.

## What remains private
- Production MG MCP servers, private configuration, and any internal integration code remain in private repositories and are not part of this public adapter.
- No private data, credentials, or operational secrets are included in this repository.

## Next phase: official DataHub MCP integration
The next phase is an integration with an official DataHub MCP Server (or certified MG MCP server) in a separate, authorized workstream. That integration will be done in a repository with the appropriate access controls, credentials, and operational governance.

## Competition Evidence
- Competition: Build with DataHub: The Agent Hackathon
- Baseline (pre-existing): MG MCP governance and architecture existed prior to this public adapter
- New public work: This TypeScript DataHub adapter and deterministic work-packet generator
- AI contribution: Copilot coding agent assisted in edits; human reviewers scoped, approved, and validated the public reference implementation and the no-write, fixture-first demo boundary
- Validation carried out: `npm ci`, `npm run typecheck`, `npm test`, `npm run build`, `npm run demo:json` (JSON parse validation), security scan
- Pull request: Draft PR #1 on branch `copilot/initial-implementation`
- Demo link: `<fill>`

## License
Apache-2.0 (`LICENSE`)
