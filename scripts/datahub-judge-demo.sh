#!/usr/bin/env bash
# Public judge demo harness.
# Mode A (default): deterministic fixture / recorded-response path.
# Mode B (optional): local-oss — fail-closed unless DATAHUB_LOCAL_MCP_ALLOW=true.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

MODE="${1:---mode=fixture}"

print_proof() {
  local path="$1"
  if command -v jq >/dev/null 2>&1; then
    jq . "$path" | sed -n '1,200p'
  else
    sed -n '1,200p' "$path"
  fi
}

if [ "$MODE" = "--mode=fixture" ]; then
  echo "Running deterministic fixture demo (Mode A)"
  if [ ! -d node_modules ]; then
    echo "Installing dependencies (npm ci)"
    npm ci
  fi
  npm run build
  node dist/src/cli.js --mode=fixture --write-examples

  PROOF="examples/official-mcp-proof/read-only-retrieval-summary.json"
  if [ ! -f "$PROOF" ]; then
    echo "FAIL: missing $PROOF"
    exit 1
  fi

  if command -v jq >/dev/null 2>&1; then
    status="$(jq -r '.status // empty' "$PROOF")"
    if [ "$status" != "PASS" ]; then
      echo "FAIL: proof status is not PASS (got: ${status:-empty})"
      exit 1
    fi
  fi

  echo "Generated/verified proof at $PROOF"
  print_proof "$PROOF"
  exit 0

elif [ "$MODE" = "--mode=local-oss" ]; then
  echo "Running local-oss demo (Mode B) — requires DATAHUB_LOCAL_MCP_ALLOW=true"
  if [ "${DATAHUB_LOCAL_MCP_ALLOW-}" != "true" ]; then
    echo "BLOCKED: DATAHUB_LOCAL_MCP_ALLOW != true — refusing to contact local MCP or DataHub."
    echo "No MCP request will be issued."
    echo "Historical sanitized proof (do not treat as re-run): examples/official-mcp-proof/local-oss-live-readonly-validation-summary.json"
    echo "To allow optional local-oss validation when a local stack is ready: export DATAHUB_LOCAL_MCP_ALLOW=true"
    exit 3
  fi

  # Public package does not ship a live MCP driver. With allow set, still refuse
  # silent live contact and point operators at the historical sanitized proof.
  echo "BLOCKED: public package has no live local-oss MCP driver in this release."
  echo "DATAHUB_LOCAL_MCP_ALLOW=true was set, but no MCP request was issued."
  echo "See sanitized VERIFIED_LOCAL_ONLY summary:"
  echo "  examples/official-mcp-proof/local-oss-live-readonly-validation-summary.json"
  exit 3

else
  echo "Unknown mode. Use --mode=fixture (default) or --mode=local-oss"
  exit 2
fi
