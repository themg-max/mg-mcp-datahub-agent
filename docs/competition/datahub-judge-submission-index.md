# DataHub Judge Submission Index (Public)

This index points judges to the frozen public-facing DataHub judge path for
`themg-max/mg-mcp-datahub-agent`.

It does **not** authorize deployment, writes, OAuth, IAM changes, Devpost mutation,
or production activation.

## Source freeze (internal evidence package)

- Internal freeze merge: `0a25a551fa2ef828956dd6052da284ff2707faf2`
- Internal PR: `#2768` (`feature/datahub-demo-freeze-and-submission-evidence-v1`)
- Public packaging: public-safe transformation only (no private paths, tokens, or
  internal governance fragments)

## What to run (Mode A — default)

```bash
npm ci
./scripts/datahub-judge-preflight.sh
./scripts/datahub-judge-demo.sh --mode=fixture
jq . examples/official-mcp-proof/read-only-retrieval-summary.json
```

## Optional Mode B (local-only, fail-closed)

```bash
env -u DATAHUB_LOCAL_MCP_ALLOW ./scripts/datahub-judge-demo.sh --mode=local-oss
```

Expected: exit `3`, `BLOCKED`, no MCP request.

Classification: OPTIONAL · VERIFIED_LOCAL_ONLY · NOT_PRODUCTION_ACTIVATION

## Proof files

| Mode | Path | Claim |
|------|------|-------|
| A | `examples/official-mcp-proof/read-only-retrieval-summary.json` | Deterministic recorded-response harness PASS |
| B | `examples/official-mcp-proof/local-oss-live-readonly-validation-summary.json` | Sanitized historical VERIFIED_LOCAL_ONLY summary |

## Docs

| Doc | Path |
|-----|------|
| Judge quickstart | `docs/datahub-judge-quickstart.md` |
| Recorded-response harness demo | `docs/datahub-mcp-readonly-demo.md` |
| Architecture | `docs/architecture.md` |
| Baseline / new-work disclosure | `docs/competition/baseline-new-work-disclosure.md` |
| Evidence matrix (public lite) | `docs/competition/evidence-index.md` |
| Public demo notes | `docs/competition/public-demo-notes.md` |

## Scripts

| Script | Role |
|--------|------|
| `scripts/datahub-judge-preflight.sh` | Zero-secrets environment/fixture presence check |
| `scripts/datahub-judge-demo.sh --mode=fixture` | Deterministic Mode A |
| `scripts/datahub-judge-demo.sh --mode=local-oss` | Fail-closed Mode B gate |

## Authority boundaries

- Retrieval is not approval.
- Consumer eligibility remains PROPOSED until human approval.
- Freshness remains UNKNOWN without approved policy.
- No production activation claim is made by these proofs.
- No DataHub write path is included.
