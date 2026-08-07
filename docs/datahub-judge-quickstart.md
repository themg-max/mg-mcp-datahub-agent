# DataHub Judge Reproducibility Quickstart

Public repository: `themg-max/mg-mcp-datahub-agent`

This quickstart is the default **deterministic judge experience (Mode A)** plus the optional
fail-closed local-live path (Mode B). It requires no secrets and performs no DataHub writes.

## Prerequisites

- Git
- Node.js 20+
- npm
- Docker (optional; only if you operate a local DataHub OSS stack yourself)
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

- Live MCP tool invocation against a running server
- Production activation
- Managed Cloud OAuth completion
- DataHub or MG MCP writes

## Mode B — Optional local DataHub OSS (fail-closed)

Mode B is **OPTIONAL · VERIFIED_LOCAL_ONLY · NOT_PRODUCTION_ACTIVATION**.

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

### Explicit allow (still no silent live contact in this public package)

```bash
export DATAHUB_LOCAL_MCP_ALLOW=true
./scripts/datahub-judge-demo.sh --mode=local-oss
```

The public package remains fail-closed for live contact in this release and points judges
to the sanitized historical proof rather than inventing a live path.

## Standard package validation

```bash
npm run typecheck
npm test
npm run build
npm run demo
```

## Security and reproducibility notes

- Mode A uses only committed fixtures and deterministic processing.
- No production credentials, tokens, or JWTs are required or committed.
- Private monorepo governance paths are not required to run Mode A.
- Retrieval is not approval. Human approval remains mandatory.

## If something fails

Capture platform, Node/npm versions, commands run, full stdout/stderr, and open a
reproducibility issue on this repository.
