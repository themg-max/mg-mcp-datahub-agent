#!/usr/bin/env bash
# Judge preflight for the public mg-mcp-datahub-agent repository.
# No live DataHub/MCP calls. No secrets required.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "DataHub Judge Preflight (public repo)"
echo "cwd: $ROOT"
echo "Node: $(node --version 2>/dev/null || echo NODE_MISSING)"
echo "npm: $(npm --version 2>/dev/null || echo NPM_MISSING)"
echo "docker: $(docker --version 2>/dev/null || echo DOCKER_MISSING_OPTIONAL)"
echo "npx: $(npx --version 2>/dev/null || echo NPX_MISSING_OPTIONAL)"

missing=0
require_file() {
  local path="$1"
  if [ -f "$path" ]; then
    echo "present: $path"
  else
    echo "missing: $path"
    missing=1
  fi
}

require_file "package.json"
require_file "tests/datahub-mcp-readonly.test.ts"
require_file "fixtures/datahub-mcp-readonly-response.json"
require_file "examples/official-mcp-proof/read-only-retrieval-summary.json"
require_file "docs/datahub-judge-quickstart.md"
require_file "scripts/datahub-judge-demo.sh"

if [ -n "${DATAHUB_LOCAL_MCP_ALLOW-}" ]; then
  echo "DATAHUB_LOCAL_MCP_ALLOW is set — optional local-oss mode may contact a local MCP if enabled"
else
  echo "DATAHUB_LOCAL_MCP_ALLOW is not set — local-oss mode remains fail-closed (default)"
fi

if [ "$missing" -ne 0 ]; then
  echo "PREFLIGHT FAIL"
  exit 1
fi

echo "PREFLIGHT OK"
exit 0
