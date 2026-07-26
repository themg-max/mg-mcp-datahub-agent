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

## Competition reuse model
This repository is designed as a reusable starter for future Devpost-style competitions and other governed-context demos.

## Competition Evidence
- Competition name: Draft PR #1, `mg-mcp-datahub-agent`
- Competition period: `2026-07-26`
- Baseline before competition: scaffold with docs and a minimal adapter/client skeleton
- New work completed during competition: added fixture-driven CLI, deterministic packet builder, tests, and CI
- AI tools used: Copilot coding agent
- Human decisions: approved the public reference scope, fixture-only demo, and no-write boundary
- Validation: `npm ci`, `npm run typecheck`, `npm test`, `npm run build`, `npm run demo`, JSON validation, secret scan
- Commits or pull requests: Draft PR #1 on `copilot/initial-implementation`
- Demo link: `<fill>`
- Session or feedback ID (if required): `<fill>`

## License
Apache-2.0 (`LICENSE`)
