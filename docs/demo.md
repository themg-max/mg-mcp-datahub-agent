# Deterministic Demo (2-3 Minutes)

## Goal
Demonstrate how synthetic DataHub metadata can be normalized into governed context and then represented as a bounded, human-reviewable work packet.

## Prerequisites
- Node.js 20+
- npm 10+
- Local clone of this repository

## Install
```bash
npm install
```

## Build and typecheck
```bash
npm run typecheck
npm run build
```

## Demo steps
1. **Explain the context problem**
   - Context can be stale, conflicting, planning-only, or missing authority.
2. **Inspect synthetic metadata outcome**
   - Open `examples/generated-work-packet/work-packet.json`.
3. **Show normalized authority states**
   - Point out records with `approved`, `planning_only`, `quarantined`, and `unknown`.
4. **Inspect bounded scope and validation**
   - Review `allowedScope`, `blockedScope`, `requiredValidation`, and `unknowns`.
5. **Explain human approval boundary**
   - Confirm `humanApprovalRequired` is always `true` and no autonomous execution is included.
6. **Show provider-agnostic extension path**
   - Reference `src/datahub/context-adapter.ts` and the `ContextAdapter<TSource>` contract.

## Expected output
- `npm run typecheck` completes without TypeScript errors.
- `npm run build` emits declarations and JavaScript into `dist/`.
- The committed synthetic work packet remains deterministic and valid JSON.

## Reset instructions
```bash
npm run clean
rm -rf node_modules package-lock.json
```

## Fallback demonstration
If build tooling is unavailable, use the committed JSON and docs only:
- `examples/generated-work-packet/work-packet.json`
- `docs/architecture.md`
- `examples/sample-pr/README.md`

## Limitations
- No live DataHub connection is required or configured by default.
- No real pull-request creation, merge, deployment, or IAM update exists in this reference implementation.
- The demo uses synthetic metadata and fictional identifiers.
