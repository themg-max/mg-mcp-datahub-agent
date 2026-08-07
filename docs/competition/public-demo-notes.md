# Public Demo Notes (≤3 minutes)

## Goal

Show a judge a reproducible, zero-secrets DataHub → governed WorkPacket path and
the fail-closed local-live gate.

## Script

1. **Story (20s)**  
   AI agents fail on stale/untrusted context. This adapter turns DataHub-shaped
   metadata into a human-reviewable WorkPacket. Retrieval is not approval.

2. **Install + preflight (40s)**

   ```bash
   npm ci
   ./scripts/datahub-judge-preflight.sh
   ```

3. **Mode A demo (60s)**

   ```bash
   ./scripts/datahub-judge-demo.sh --mode=fixture
   jq '{status, retrieval_mode, tool_identity, validation_result}' \
     examples/official-mcp-proof/read-only-retrieval-summary.json
   ```

   Call out: `status=PASS`, `human_approval_required=true`, no secrets.

4. **Fail-closed Mode B + OSS story (40s)**

   ```bash
   env -u DATAHUB_LOCAL_MCP_ALLOW ./scripts/datahub-judge-demo.sh --mode=local-oss
   echo exit:$?
   ```

   Expected: exit 3, `BLOCKED`, no MCP request.

   Video contract (optional live cut): **DataHub OSS → official mcp-server-datahub →
   one read-only tools/call → governed WorkPacket** with
   `consumer_eligibility=PROPOSED` and `human_approval_required=true`. Point to
   sanitized VERIFIED_LOCAL_ONLY summary when the stack is not running.

5. **Close (20s)**  
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
