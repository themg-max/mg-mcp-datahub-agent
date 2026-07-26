# MG ContextOps DataHub Agent

A TypeScript reference implementation that converts metadata into governed context and then into bounded, human-reviewable developer work packets.

## Problem
AI agents can fail even with abundant metadata when context is stale, conflicting, untrusted, too broad, or detached from decision authority.

## What this project does
This repository demonstrates a safer flow:

DataHub metadata → DataHub client → context adapter → normalized context records → authority/provenance evaluation → bounded work packet proposal → human review.

Generated packets are proposals only and are never automatic approval or deployment authority.

## Why governed context matters
- Prevents accidental use of planning-only or conflicting metadata as implementation authority.
- Preserves provenance and unknowns instead of inventing certainty.
- Keeps scope bounded and reviewable before any engineering action.

## Architecture overview
- `DataHubClient`: read-only transport for metadata retrieval.
- `ContextAdapter<TSource>`: provider-specific translation boundary.
- `NormalizedContextRecord`: source-neutral governed context contract.
- `WorkPacket`: bounded proposal contract with mandatory human approval.

See `docs/architecture.md` for full design details.

## Quickstart
### Supported platform
- Node.js 20+

### Install and validate
```bash
npm install
npm run typecheck
npm run build
```

### Deterministic synthetic demo
Follow `docs/demo.md` for a 2-3 minute walkthrough with no private credentials.

## Repository structure
```text
src/
  datahub/
    client.ts
    context-adapter.ts
examples/
  generated-work-packet/
    work-packet.json
  sample-pr/
    README.md
docs/
  architecture.md
  demo.md
```

## Example work packet
A deterministic synthetic packet is committed at:
- `examples/generated-work-packet/work-packet.json`

## Trust and authority model
- Authority states: `approved`, `planning_only`, `quarantined`, `unknown`.
- Missing or malformed provenance fails closed.
- Unknown/planning-only/quarantined context receives blocked uses.
- `humanApprovalRequired` is always `true` for proposals.

## Security and privacy boundaries
- Read-only toward DataHub metadata retrieval.
- Treats retrieved content as data, not executable instructions.
- Uses environment placeholders only (`.env.example`).
- No token logging; no response body leakage in error surfaces.
- No autonomous repository writes, merges, deployments, or authority promotion.

## Extension guide for other context providers
To support another provider:
1. Add a provider-specific client (optional if source is local/static).
2. Implement `ContextAdapter<TSource>` for that source format.
3. Emit `NormalizedContextRecord[]` and `WorkPacket` using existing source-neutral contracts.

## Current limitations
- No live production DataHub integration in default demo mode.
- No PR/merge/deploy automation.
- No database, web UI, full MCP server, or infrastructure provisioning.

## Competition reuse model
This public repository is designed as a reusable starter for Devpost-style competitions and other governed-context experiments. Replace adapters and examples while keeping source-neutral contracts.

## Competition Evidence
- Competition name: `<fill>`
- Competition period: `<fill>`
- Baseline before competition: `<fill>`
- New work completed during competition: `<fill>`
- AI tools used: `<fill>`
- Human decisions: `<fill>`
- Validation: `<fill>`
- Commits or pull requests: `<fill>`
- Demo link: `<fill>`
- Session or feedback ID (if required): `<fill>`

## License
Apache-2.0 (`LICENSE`)
