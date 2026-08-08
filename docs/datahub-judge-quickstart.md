# DataHub Judge Reproducibility Quickstart

Public repository: `themg-max/mg-mcp-datahub-agent`

This quickstart is the default **deterministic judge experience (Mode A)** plus the optional
**local DataHub OSS official MCP** path (Mode B). Mode A requires no secrets and performs no
DataHub writes. Mode B is operator-gated and fail-closed by default.

### Runtime classification (explicit)

| Mode | Runtime status | Meaning |
|------|----------------|---------|
| A | `MODE_A_RUNTIME=UNKNOWN` | Deterministic fixture / recorded-response only; no live invocation claim |
| B | `MODE_B_RUNTIME=VERIFIED_LOCAL_ONLY` | Public implementation verified on local DataHub OSS; not production activation |

## Prerequisites

- Git
- Node.js 20+
- npm
- Docker (optional; only if you operate a local DataHub OSS stack yourself)
- `uvx` (optional; Mode B only)
- `jq` (optional; nicer proof inspection)
- `sqlite3` (optional; offline generated-artifact validation)

## Mode A — Deterministic (zero-secrets) [Default]

1. Clone and enter the repository:

   ```bash
   git clone https://github.com/themg-max/mg-mcp-datahub-agent.git
   cd mg-mcp-datahub-agent
   ```

2. Install dependencies:

   ```bash
   npm ci
   ```

3. Preflight:

   ```bash
   ./scripts/datahub-judge-preflight.sh
   ```

4. Run the deterministic demo (fixture / recorded-response harness):

   ```bash
   ./scripts/datahub-judge-demo.sh --mode=fixture
   ```

5. Inspect the Mode A proof:

   ```bash
   jq . examples/official-mcp-proof/read-only-retrieval-summary.json
   ```

6. Inspect the generated development example:

   ```bash
   ls examples/showcase-ecommerce/customer-email-normalization/
   jq . examples/showcase-ecommerce/customer-email-normalization/generation-proof.json
   sqlite3 :memory: < examples/showcase-ecommerce/customer-email-normalization/validate_customer_email.sql
   ```

Expected:

- exit code `0`
- proof `status` = `PASS`
- `human_approval_required` = `true`
- `runtime_retrieval_status` = `UNKNOWN` (no live runtime claim)
- no credentials required
- generated artifact `input_classification` = `SYNTHETIC_FIXTURE`
- generated artifact offline validation overall `PASS`

### What Mode A proves

- A recorded official DataHub MCP read-only response can be normalized into a governed
  context record and a deterministic WorkPacket.
- Attribution and provenance travel beside content.
- Consumer eligibility remains `PROPOSED` until human approval.
- Freshness remains `UNKNOWN` without an approved policy window.
- A bounded, non-destructive development proposal can be packaged for human review from
  committed synthetic fixture context.

### What Mode A does **not** claim

- Live MCP tool invocation against a running server (that is Mode B)
- Production activation
- Managed Cloud OAuth completion
- DataHub or MG MCP writes

## Mode B — Optional local DataHub OSS official MCP (fail-closed)

Mode B is **OPTIONAL · VERIFIED_LOCAL_ONLY · NOT_PRODUCTION_ACTIVATION**.

The public implementation was verified against local DataHub OSS using the official
`mcp-server-datahub==0.6.0` server over HTTP. The validation discovered the live MCP tool
inventory (8 tools), selected a server-annotated read-only tool (`search`,
`readOnlyHint=true`), executed exactly one attributable metadata retrieval, and preserved
downstream authority as `PROPOSED`.

**Canonical validated transport (public live proof):**

| Item | Value |
|------|--------|
| Official package | `mcp-server-datahub==0.6.0` |
| Server transport | **HTTP** (`http-jsonrpc-stateless`) |
| MCP URL | `http://127.0.0.1:8000/mcp` |
| GMS | `http://localhost:8080` |

Committed public-main Mode B proof:

`examples/official-mcp-proof/local-oss-live-readonly-validation-summary.json`

That proof records `mcp_server.transport = http-jsonrpc-stateless`,
`mcp_package_version = 0.6.0`, `metadata_call_count = 1`, and
`runtime_retrieval_status = VERIFIED_LOCAL_ONLY`.

### Fail-closed default (no MCP request)

```bash
env -u DATAHUB_LOCAL_MCP_ALLOW ./scripts/datahub-judge-demo.sh --mode=local-oss
```

Expected:

- exit code `3`
- stdout contains `BLOCKED`
- no MCP request is issued

### Explicit allow — real local official MCP over HTTP (operator-owned stack)

```bash
# 1) Run local DataHub OSS GMS (operator responsibility; quickstart/compose outside this repo)
#    GMS expected at http://localhost:8080

# 2) Start official MCP server on HTTP (separate terminal; pin 0.6.0)
#    Verified server-start command:
export DATAHUB_GMS_URL=http://localhost:8080
export DATAHUB_GMS_TOKEN="<local-gms-token-placeholder>"
uvx --from mcp-server-datahub==0.6.0 \
  mcp-server-datahub --transport http

# 3) Export local-only env for the judge harness (never commit tokens; never pass tokens on argv)
export DATAHUB_LOCAL_MCP_ALLOW=true
export DATAHUB_GMS_URL=http://localhost:8080
export DATAHUB_GMS_TOKEN="<local-gms-token-placeholder>"
# Canonical HTTP endpoint (demo script also defaults this when unset):
export DATAHUB_LOCAL_MCP_URL=http://127.0.0.1:8000/mcp

./scripts/datahub-judge-demo.sh --mode=local-oss
jq . examples/official-mcp-proof/local-oss-live-readonly-validation-summary.json
```

`DATAHUB_LOCAL_MCP_ALLOW` must be exactly the literal string `true` (case-sensitive).

Expected on success:

- exit code `0`
- proof `status` = `PASS`
- `runtime_retrieval_status` = `VERIFIED_LOCAL_ONLY`
- `mcp_server.transport` = `http-jsonrpc-stateless`
- `metadata_call_count` = `1`
- `selected_tool_readonly` = `true`
- attributable `entity_identity` present
- `consumer_eligibility` = `PROPOSED`
- `human_approval_required` = `true`
- `production_activation` = `false`
- `datahub_writes` = `false`
- `managed_cloud_oauth` = `false`

### Stdio spawn path (non-canonical)

An alternate **stdio subprocess** spawn exists in the client for development only
(`uvx --from mcp-server-datahub==0.6.0 mcp-server-datahub` without `--transport http`).
That path is **not** the public judge contract: it is classified
**KNOWN_NON_BLOCKING / non-canonical** and has timed out in judge-like environments.
Do **not** omit `DATAHUB_LOCAL_MCP_URL` expecting stdio to reproduce the committed
HTTP live proof. Credentials for any child process are passed only via environment —
never on argv or in logs.

## Standard package validation

```bash
npm run typecheck
npm test
npm run build
npm run demo
```

## Security and reproducibility notes

- Mode A uses only committed fixtures and deterministic processing.
- Mode B requires `DATAHUB_LOCAL_MCP_ALLOW` to be exactly the literal string `true`.
- No production credentials, tokens, or JWTs are required or committed for Mode A.
- Do not echo tokens; do not put tokens on CLI argv.
- Private monorepo governance paths are not required to run Mode A.
- Retrieval is not approval. Human approval remains mandatory.
- Hackathon path uses **DataHub OSS** + official open-source MCP server — not a managed cloud tenant claim.
- The generated customer-email example is **SYNTHETIC_FIXTURE** and is not schema-bound to the Mode B PowerBI entity.

## If something fails

Capture platform, Node/npm versions, commands run, full stdout/stderr (redact any tokens),
and open a reproducibility issue on this repository.
