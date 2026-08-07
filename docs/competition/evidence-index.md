# Competition Evidence Index (Public Lite)

Maps judge-facing claims to public repository paths only.

| Claim | Public evidence | Notes |
|------|-----------------|-------|
| Deterministic zero-secrets demo exists | `scripts/datahub-judge-demo.sh`, `docs/datahub-judge-quickstart.md` | Mode A default |
| Recorded official-MCP read-only contract harness | `src/datahub/mcp-client.ts`, `fixtures/datahub-mcp-readonly-response.json`, `docs/datahub-mcp-readonly-demo.md` | No live call in Mode A |
| Mode A proof summary PASS | `examples/official-mcp-proof/read-only-retrieval-summary.json` | `status=PASS` |
| Human approval required | WorkPacket + proof `human_approval_required` / `humanApprovalRequired` | Always true |
| Fail-closed without local allow | `scripts/datahub-judge-demo.sh --mode=local-oss` | exit 3, BLOCKED, no MCP request |
| Optional local OSS official MCP driver | `src/datahub/local-oss-mcp-client.ts`, `src/datahub/local-oss-validation.ts` | Exactly one tools/call when allowed |
| Optional local-only proof | `examples/official-mcp-proof/local-oss-live-readonly-validation-summary.json` | Sanitized VERIFIED_LOCAL_ONLY; `metadata_call_count` |
| Tests | `npm test`, `tests/datahub-mcp-readonly.test.ts`, `tests/datahub-mcp-local-readonly.test.ts` | CI on PRs |
| No production credentials required | README security section, `.env.example` placeholders only | |
| Baseline vs new work disclosed | `docs/competition/baseline-new-work-disclosure.md`, README | |
| Architecture boundaries | `docs/architecture.md`, `docs/mg-mcp-alignment.md` | |

## Explicit non-claims

- No production activation
- No DataHub write API
- No autonomous merge/deploy
- No customer/production datasets committed
- No private filesystem paths or tokens in public proofs
