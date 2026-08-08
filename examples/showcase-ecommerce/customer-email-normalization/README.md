# Generated development artifact — customer email normalization

Judge-visible **proposal-only** example showing how governed context can yield a
bounded, reviewable development change.

## Provenance (explicit)

| Field | Value |
|-------|--------|
| Input identity | `showcase-ecommerce` (committed public fixture contract) |
| Scenario | `safe-customer-email-migration` |
| Classification | **SYNTHETIC_FIXTURE** |
| Source paths | `docs/fixtures/showcase-ecommerce/*`, `fixtures/datahub-context.json` |
| Live MCP input | **Not used** — this example is **not** derived from the Mode B PowerBI entity |

This artifact does **not** claim that the live Mode B retrieved dataset supplied
schema for the SQL below. Mode B proof remains a separate local-OSS read-only
validation under `examples/official-mcp-proof/`.

## What was generated

| File | Role |
|------|------|
| `customer_email_normalized.sql` | Non-destructive SELECT that preserves customer id + raw email and adds trim/lowercase normalization |
| `schema.yml` | Reviewable dbt-style model/column contract + tests |
| `validate_customer_email.sql` | Offline validation queries (null/blank + duplicate detection) |
| `generation-proof.json` | Authority, scope, unknowns, and validation results |

## What it demonstrates

- Customer identifier preserved
- Raw email retained beside normalized form
- `trim` + `lower` normalization
- Null/blank validation
- Duplicate detection on normalized email
- Reviewable validation proof (`generation-proof.json`)

## What it does **not** do

- No `UPDATE` / `DELETE` / `DROP`
- No production execution or deployment
- No DataHub write
- No MG MCP write
- No secret material

## Offline validation (optional)

Requires `sqlite3` only:

```bash
cd examples/showcase-ecommerce/customer-email-normalization
sqlite3 :memory: < validate_customer_email.sql
```

Expected: printed validation rows with `status=PASS` for the synthetic sample set.

## Authority

- `consumer_eligibility` = `PROPOSED`
- `human_approval_required` = `true`
- Retrieval or generation is **not** approval
