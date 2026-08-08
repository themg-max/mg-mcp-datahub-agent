# Public Demo Notes (≤3 minutes)

## Goal

Show a judge a reproducible, zero-secrets DataHub → governed WorkPacket path, one
generated development example, the committed Mode B local-OSS proof, and the
fail-closed local-live gate.

## Script

1. **Story (20s)**
   AI agents fail on stale/untrusted context. This adapter turns DataHub-shaped
   metadata into a human-reviewable WorkPacket. Retrieval is not approval.
   Mode A is deterministic (`MODE_A_RUNTIME=UNKNOWN`). Mode B is verified local-only
   (`MODE_B_RUNTIME=VERIFIED_LOCAL_ONLY`).

2. **Install + preflight (30s)**

   ```bash
   npm ci
   ./scripts/datahub-judge-preflight.sh
   ```

3. **Mode A demo (50s)**

   ```bash
   ./scripts/datahub-judge-demo.sh --mode=fixture
   jq '{status, retrieval_mode, tool_identity, validation_result}' \
     examples/official-mcp-proof/read-only-retrieval-summary.json
   ```

   Call out: `status=PASS`, `human_approval_required=true`, no secrets,
   runtime UNKNOWN (not a live claim).

4. **Generated artifact (30s)**

   ```bash
   ls examples/showcase-ecommerce/customer-email-normalization/
   jq '{input_classification, consumer_eligibility, human_approval_required, datahub_write}' \
     examples/showcase-ecommerce/customer-email-normalization/generation-proof.json
   ```

   Call out: SYNTHETIC_FIXTURE, proposal-only, non-destructive, not Mode B schema reuse.

5. **Mode B proof + fail-closed gate (40s)**

   ```bash
   jq '{status, authority, metadata_call_count, tool_inventory:{selected_tool,selected_tool_readonly,count}, mcp_server}' \
     examples/official-mcp-proof/local-oss-live-readonly-validation-summary.json

   env -u DATAHUB_LOCAL_MCP_ALLOW ./scripts/datahub-judge-demo.sh --mode=local-oss
   echo exit:$?
   ```

   Expected: committed proof `VERIFIED_LOCAL_ONLY` with one metadata call; fail-closed
   re-run exits 3, `BLOCKED`, no MCP request.

   Video contract (optional live cut): **DataHub OSS GMS → official
   mcp-server-datahub==0.6.0 over HTTP (`http://127.0.0.1:8000/mcp`) →
   one read-only tools/call → governed WorkPacket** with
   `consumer_eligibility=PROPOSED` and `human_approval_required=true`.
   Stdio spawn is non-canonical for judges.

6. **Close (20s)**
   Baseline vs competition work is disclosed. Production activation and writes
   are not claimed. Hackathon path uses DataHub OSS, not a managed cloud tenant.

## Supported platform

- Node.js 20+
- macOS/Linux shells with bash

## Privacy / security talking points

- Fixture-first default
- No committed tokens/JWTs
- Errors do not dump secret material
- Optional local mode is operator-gated and fail-closed
- Generated SQL example uses synthetic sample rows only
