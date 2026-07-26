# Deterministic Demo

## Goal
Show a one-command fixture-driven flow from metadata to a bounded work packet.

## Prerequisites
- Node.js 20+
- npm

## Install
```bash
npm ci
```

## One-command demo
```bash
npm run demo
```

## Expected output
- Valid JSON on stdout.
- `normalizedRecords` showing approved, planning-only, quarantined, and unknown states.
- `workPacket` showing allowed scope, blocked scope, required validation, unknowns, source references, and `humanApprovalRequired: true`.

## Invalid input path
```bash
node dist/src/cli.js --input fixtures/invalid-datahub-context.json
```
This should exit nonzero and print a plain error message to stderr.

## Validation commands
```bash
npm run typecheck
npm test
npm run build
```

## Reset
```bash
npm run clean
```

## Fallback demonstration
If build tooling is unavailable, inspect:
- `fixtures/datahub-context.json`
- `fixtures/invalid-datahub-context.json`
- `README.md`

## Limitations
- The demo is synthetic and fixture-based.
- No production DataHub instance is required or connected.
- No repository writes, merges, deployments, or authority promotion occur.
- Live DataHub endpoint paths are intentionally optional and unverified.
