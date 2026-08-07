# DataHub Judge Reproducibility Quickstart

Public repository: `themg-max/mg-mcp-datahub-agent`

This quickstart is the default **deterministic judge experience (Mode A)** plus the optional
**local DataHub OSS official MCP** path (Mode B). Mode A requires no secrets and performs no
DataHub writes. Mode B is operator-gated and fail-closed by default.

## Prerequisites

- Git
- Node.js 20+
- npm
- Docker (optional; only if you operate a local DataHub OSS stack yourself)
- `uvx` or Python with `mcp-server-datahub==0.6.0` (optional; Mode B spawn path)
- `jq` (optional; nicer proof inspection)

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

Expected:

- exit code `0`
- proof `status` = `PASS`
- `human_approval_required` = `true`
- `runtime_retrieval_status` = `UNKNOWN` (no live runtime claim)
- no credentials required

### What Mode A proves

- A recorded official DataHub MCP read-only response can be normalized into a governed
  context record and a deterministic WorkPacket.
- Attribution and provenance travel beside content.
- Consumer eligibility remains `PROPOSED` until human approval.
- Freshness remains `UNKNOWN` without an approved policy window.

### What Mode A does **not** claim

- Live MCP tool invocation against a running server (that is Mode B)
- Production activation
- Managed Cloud OAuth completion
- DataHub or MG MCP writes

## Mode B — Optional local DataHub OSS official MCP (fail-closed)

Mode B is **OPTIONAL · VERIFIED_LOCAL_ONLY · NOT_PRODUCTION_ACTIVATION**.

When explicitly allowed, the public package can spawn or contact the **official open-source**
`mcp-server-datahub==0.6.0` against a **local** DataHub OSS GMS, discover tools via
`tools/list`, and perform **exactly one** read-only `tools/call` (prefer `search`).

A sanitized historical local-only proof is committed at:

`examples/official-mcp-proof/local-oss-live-readonly-validation-summary.json`

### Fail-closed default (no MCP request)

```bash
env -u DATAHUB_LOCAL_MCP_ALLOW ./scripts/datahub-judge-demo.sh --mode=local-oss
```

Expected:

- exit code `3`
- stdout contains `BLOCKED`
- no MCP request is issued

### Explicit allow — real local official MCP (operator-owned stack)

```bash
# 1) Run local DataHub OSS (operator responsibility; quickstart/compose outside this repo)
# 2) Export local-only env (never commit tokens; never pass tokens on argv)
export DATAHUB_LOCAL_MCP_ALLOW=true
export DATAHUB_GMS_URL=http://localhost:8080
export DATAHUB_GMS_TOKEN="<local-gms-token-placeholder>"

# Optional: talk to an already-running local HTTP MCP instead of spawning:
# export DATAHUB_LOCAL_MCP_URL=http://127.0.0.1:8000/mcp

./scripts/datahub-judge-demo.sh --mode=local-oss
jq . examples/official-mcp-proof/local-oss-live-readonly-validation-summary.json
```

Expected on success:

- exit code `0`
- proof `status` = `PASS`
- `runtime_retrieval_status` = `VERIFIED_LOCAL_ONLY`
- `metadata_call_count` = `1`
- `consumer_eligibility` = `PROPOSED`
- `human_approval_required` = `true`
- `production_activation` = `false`
- `datahub_writes` = `false`
- `managed_cloud_oauth` = `false`

Spawn path uses (in order): `uvx --from mcp-server-datahub==0.6.0 mcp-server-datahub`,
else `python3 -m mcp_server_datahub`, else `mcp-server-datahub` on PATH. Credentials are
passed only via process environment to the child — never on argv or in logs.

## Standard package validation

```bash
npm run typecheck
npm test
npm run build
npm run demo
```

## Security and reproducibility notes

- Mode A uses only committed fixtures and deterministic processing.
- Mode B refuses contact unless `DATAHUB_LOCAL_MCP_ALLOW` lowercases to exactly `true`.
- No production credentials, tokens, or JWTs are required or committed for Mode A.
- Do not echo tokens; do not put tokens on CLI argv.
- Private monorepo governance paths are not required to run Mode A.
- Retrieval is not approval. Human approval remains mandatory.
- Hackathon path uses **DataHub OSS** + official open-source MCP server — not a managed cloud tenant claim.

## If something fails

Capture platform, Node/npm versions, commands run, full stdout/stderr (redact any tokens),
and open a reproducibility issue on this repository.
