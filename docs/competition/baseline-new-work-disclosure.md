# Baseline vs New Work Disclosure (Public)

Public packaging derived from internal freeze merge
`0a25a551fa2ef828956dd6052da284ff2707faf2` (PR #2768 evidence package) and the
already-merged public recorded-response harness (PR #25).

## What existed before the competition

- MG MCP governance concepts: lane/worktree discipline, authority states, human
  approval, fail-closed unknowns, review handoffs.
- Public repository bootstrap for a fixture-first DataHub → governed WorkPacket
  adapter (`@themg/contextops-datahub-agent`).
- Architecture docs for skill-execution boundaries and MG MCP alignment intent.
- CI for typecheck, tests, and demo JSON validity.

## What was added during the competition (public-safe)

- Official-MCP **recorded-response** read-only contract harness:
  - `src/datahub/mcp-client.ts`
  - recorded fixture envelope
  - deterministic proof summary under `examples/official-mcp-proof/`
  - focused tests (`tests/datahub-mcp-readonly.test.ts`)
- Judge reproducibility packaging (this sync):
  - `docs/datahub-judge-quickstart.md`
  - `scripts/datahub-judge-preflight.sh`
  - `scripts/datahub-judge-demo.sh` (Mode A + fail-closed Mode B)
  - competition evidence index and demo notes
  - sanitized historical VERIFIED_LOCAL_ONLY Mode B summary
- Explicit baseline/new-work and limitation statements in README.

## What remains out of scope / not claimed

- Managed Cloud OAuth / production tenant activation
- Live production DataHub reads
- DataHub writes or MG MCP writes
- IAM / secret / deployment changes
- Devpost field mutation from this packaging lane
- Private monorepo governance fragments and protected decisions

## Classification summary

| Surface | Classification |
|---------|----------------|
| Mode A fixture/recorded harness | DEFAULT · DETERMINISTIC · PUBLIC_SAFE |
| Mode B local OSS live read | OPTIONAL · VERIFIED_LOCAL_ONLY · historical sanitized summary only |
| Production activation | NOT CLAIMED |
