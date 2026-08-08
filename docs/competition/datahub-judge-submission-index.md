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
- Public Mode B implementation merge: PR `#29` on main
  (`b2f5cb35fa371fd185e084865da907e8a9956d17` lineage)

## Runtime classification

| Mode | Runtime | Claim |
|------|---------|-------|
| A | `MODE_A_RUNTIME=UNKNOWN` | Deterministic fixture / recorded-response; no live invocation |
| B | `MODE_B_RUNTIME=VERIFIED_LOCAL_ONLY` | Local DataHub OSS + official MCP HTTP; exactly one read-only call when allowed |

## What to run (Mode A — default)

```bash
npm ci
./scripts/datahub-judge-preflight.sh
./scripts/datahub-judge-demo.sh --mode=fixture
jq . examples/official-mcp-proof/read-only-retrieval-summary.json
ls examples/showcase-ecommerce/customer-email-normalization/
jq . examples/showcase-ecommerce/customer-email-normalization/generation-proof.json
```

## Optional Mode B (local DataHub OSS official MCP)

Fail-closed without allow:

```bash
env -u DATAHUB_LOCAL_MCP_ALLOW ./scripts/datahub-judge-demo.sh --mode=local-oss
```

Expected: exit `3`, `BLOCKED`, no MCP request.

With allow + operator-owned local OSS GMS + official `mcp-server-datahub==0.6.0` over
**HTTP** (`DATAHUB_LOCAL_MCP_URL=http://127.0.0.1:8000/mcp`, GMS `http://localhost:8080`),
Mode B performs initialize → tools/list → **exactly one** read-only tools/call and writes a
sanitized proof. Classification: OPTIONAL · VERIFIED_LOCAL_ONLY · NOT_PRODUCTION_ACTIVATION.

Verified server-start command:

```bash
uvx --from mcp-server-datahub==0.6.0 \
  mcp-server-datahub --transport http
```

`DATAHUB_LOCAL_MCP_ALLOW=true` must be the exact literal string `true`.
Stdio spawn is non-canonical for judges; see `docs/datahub-judge-quickstart.md`.

## Proof files

| Mode | Path | Claim |
|------|------|-------|
| A | `examples/official-mcp-proof/read-only-retrieval-summary.json` | Deterministic recorded-response harness PASS (`runtime_retrieval_status=UNKNOWN`) |
| B | `examples/official-mcp-proof/local-oss-live-readonly-validation-summary.json` | Public-main VERIFIED_LOCAL_ONLY summary (`metadata_call_count=1` on PASS) |
| Generated example | `examples/showcase-ecommerce/customer-email-normalization/generation-proof.json` | SYNTHETIC_FIXTURE proposal-only development artifact |

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
| `scripts/datahub-judge-preflight.sh` | Environment/fixture presence check (+ optional GMS probe) |
| `scripts/datahub-judge-demo.sh --mode=fixture` | Deterministic Mode A |
| `scripts/datahub-judge-demo.sh --mode=local-oss` | Fail-closed gate or real Mode B driver when allowed |

## Authority boundaries

- Retrieval is not approval.
- Consumer eligibility remains PROPOSED until human approval.
- Freshness remains UNKNOWN without approved policy.
- No production activation claim is made by these proofs.
- No DataHub write path is included.
- Generated development examples remain proposal-only and synthetic unless stated otherwise.
