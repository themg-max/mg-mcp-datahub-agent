#!/usr/bin/env bash
# Judge preflight for the public mg-mcp-datahub-agent repository.
# Mode A requires no secrets. Mode B optional checks are non-fatal.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "DataHub Judge Preflight (public repo)"
echo "cwd: $ROOT"
echo "Node: $(node --version 2>/dev/null || echo NODE_MISSING)"
echo "npm: $(npm --version 2>/dev/null || echo NPM_MISSING)"
echo "docker: $(docker --version 2>/dev/null || echo DOCKER_MISSING_OPTIONAL)"
echo "npx: $(npx --version 2>/dev/null || echo NPX_MISSING_OPTIONAL)"
echo "uvx: $(uvx --version 2>/dev/null || echo UVX_MISSING_OPTIONAL_FOR_MODE_B)"

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
require_file "tests/datahub-mcp-local-readonly.test.ts"
require_file "fixtures/datahub-mcp-readonly-response.json"
require_file "examples/official-mcp-proof/read-only-retrieval-summary.json"
require_file "examples/official-mcp-proof/local-oss-live-readonly-validation-summary.json"
require_file "docs/datahub-judge-quickstart.md"
require_file "scripts/datahub-judge-demo.sh"
require_file "src/datahub/local-oss-mcp-client.ts"
require_file "src/datahub/local-oss-validation.ts"

if [ "${DATAHUB_LOCAL_MCP_ALLOW-}" = "true" ]; then
  echo "DATAHUB_LOCAL_MCP_ALLOW is exactly 'true' — optional local-oss mode may contact a local MCP if enabled"
else
  echo "DATAHUB_LOCAL_MCP_ALLOW is not exactly 'true' — local-oss mode remains fail-closed (default)"
fi

echo "Mode B canonical transport: HTTP mcp-server-datahub==0.6.0 at DATAHUB_LOCAL_MCP_URL=${DATAHUB_LOCAL_MCP_URL:-http://127.0.0.1:8000/mcp}"
echo "Mode B tip: uvx --from mcp-server-datahub==0.6.0 mcp-server-datahub --transport http"
echo "Mode B note: stdio spawn without HTTP URL is non-canonical for public judges"

if [ "$missing" -ne 0 ]; then
  echo "PREFLIGHT FAIL"
  exit 1
fi

echo "PREFLIGHT OK"
exit 0
