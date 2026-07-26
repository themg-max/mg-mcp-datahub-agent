#!/usr/bin/env bash

mode="${1:-inspect}"
expected_slug="themg-max/mg-mcp-datahub-agent"
expected_commit="1e5e7a19bfff280d351373ae43c41cefeaab56f9"
expected_package="@themg/contextops-datahub-agent"
architecture_artifact="docs/datahub-skill-execution-architecture.md"

case "$mode" in
  inspect|mutation|merge|cleanup) ;;
  *) printf 'ERROR invalid mode: %s\nUsage: %s [inspect|mutation|merge|cleanup]\n' "$mode" "$0" >&2; exit 2 ;;
esac

root="$(git rev-parse --show-toplevel 2>/dev/null)" || {
  printf '%s\n' 'ERROR not inside a Git repository' >&2
  exit 10
}
registry="$root/.ai/active-lanes/datahub-devpost.json"

normalize_remote() {
  value="$1"
  value="${value#git@github.com:}"
  value="${value#ssh://git@github.com/}"
  value="${value#https://github.com/}"
  value="${value#http://github.com/}"
  value="${value%/}"
  value="${value%.git}"
  printf '%s\n' "$value"
}

origin="$(git -C "$root" remote get-url origin 2>/dev/null || true)"
identity_mode=""
normalized_slug=""
if [ -n "$origin" ]; then
  normalized_slug="$(normalize_remote "$origin")"
  if [ "$normalized_slug" != "$expected_slug" ]; then
    printf 'ERROR wrong repository: expected %s, found %s\n' "$expected_slug" "$normalized_slug" >&2
    exit 11
  fi
  identity_mode="REMOTE_VERIFIED"
else
  if [ ! -f "$root/$architecture_artifact" ] || [ ! -f "$root/package.json" ]; then
    printf '%s\n' 'ERROR required snapshot identity artifact missing' >&2
    exit 16
  fi
  if ! command -v node >/dev/null 2>&1; then
    printf '%s\n' 'ERROR required dependency missing: node' >&2
    exit 16
  fi
  package_name="$(node -p "require(process.argv[1]).name" "$root/package.json" 2>/dev/null || true)"
  if [ "$package_name" != "$expected_package" ] || ! git -C "$root" merge-base --is-ancestor "$expected_commit" HEAD 2>/dev/null; then
    printf '%s\n' 'ERROR snapshot repository identity verification failed' >&2
    exit 11
  fi
  identity_mode="SNAPSHOT_VERIFIED"
fi

branch="$(git -C "$root" symbolic-ref --quiet --short HEAD 2>/dev/null || true)"

resolve_lane() {
  node -e '
const fs = require("fs");
const [registryPath, expectedSlug, branch] = process.argv.slice(1);
const statuses = ["PROPOSED", "PLANNING_ONLY", "APPROVED", "VERIFIED", "SUPERSEDED", "UNKNOWN"];
let registry;
try { registry = JSON.parse(fs.readFileSync(registryPath, "utf8")); } catch { process.exit(2); }
if (!registry || registry.repository !== expectedSlug) process.exit(3);
if (!Array.isArray(registry.allowed_statuses) || registry.allowed_statuses.length !== statuses.length ||
    statuses.some((status, index) => registry.allowed_statuses[index] !== status) || !Array.isArray(registry.lanes)) process.exit(2);
const matches = registry.lanes.filter((lane) => lane && [lane.durable_branch, lane.managed_workspace_branch, lane.branch].includes(branch));
if (matches.length !== 1 || typeof matches[0].id !== "string" || typeof matches[0].status !== "string") process.exit(1);
const lane = matches[0];
const field = (value) => String(value || "").replace(/[\r\n\t]/g, " ");
process.stdout.write([field(lane.id), field(lane.status), field(lane.owner)].join("\t") + "\n");
' "$registry" "$expected_slug" "$branch"
}

lane_id="NONE"
lane_status="UNKNOWN"
lane_owner=""
if [ ! -f "$registry" ]; then
  printf '%s\n' 'ERROR active-lane registry is missing or invalid' >&2
  exit 15
fi
lane_data="$(resolve_lane 2>/dev/null)"
lane_result=$?
case "$lane_result" in
  0) IFS=$'\t' read -r lane_id lane_status lane_owner <<< "$lane_data" ;;
  1) ;;
  3) printf '%s\n' 'ERROR active-lane registry repository does not match the durable repository' >&2; exit 11 ;;
  *) printf '%s\n' 'ERROR active-lane registry is missing or invalid' >&2; exit 15 ;;
esac

printf 'mode=%s\nroot=%s\nidentity=%s\nrepository=%s\nbranch=%s\nlane=%s\nstatus=%s\nowner=%s\n' \
  "$mode" "$root" "$identity_mode" "$expected_slug" "${branch:-DETACHED}" "$lane_id" "$lane_status" "${lane_owner:-NONE}"

if [ "$mode" = "inspect" ]; then
  printf '%s\n' 'result=PASS (read-only inspection)'
  exit 0
fi

if [ -z "$branch" ]; then
  printf '%s\n' 'ERROR detached HEAD is not allowed for this mode' >&2
  exit 12
fi

if [ "$mode" = "mutation" ]; then
  if [ "$branch" = "main" ]; then
    printf '%s\n' 'ERROR mutation on main is prohibited' >&2
    exit 13
  fi
  if [ "$lane_id" = "NONE" ] || [ "$lane_status" != "APPROVED" ] || [ -z "$lane_owner" ]; then
    printf '%s\n' 'ERROR current branch requires an approved active lane with an owner' >&2
    exit 15
  fi
  allowed='^(\.github/skills/gatekeeper/SKILL\.md|\.github/skills/gatekeeper/references/session-start\.md|\.github/skills/gatekeeper/references/session-stop\.md|\.ai/governance/repository-profile\.md|\.ai/active-lanes/README\.md|\.ai/active-lanes/datahub-devpost\.json|scripts/check_lane_state\.sh)$'
  changed="$(git -C "$root" status --short --untracked-files=all | sed -E 's/^.. //' | sed -E 's/.* -> //' || true)"
  if [ -n "$changed" ] && printf '%s\n' "$changed" | awk -v allowed="$allowed" '$0 !~ allowed { bad=1 } END { exit bad }'; then
    :
  elif [ -n "$changed" ]; then
    printf '%s\n' 'ERROR worktree contains changes outside the active lane scope' >&2
    exit 14
  fi
  printf '%s\n' 'result=PASS (validation only; no mutation performed)'
  exit 0
fi

if [ "$identity_mode" != "REMOTE_VERIFIED" ]; then
  if [ "$mode" = "merge" ]; then
    printf '%s\n' 'ERROR merge validation requires REMOTE_VERIFIED identity; no merge was performed' >&2
    exit 17
  fi
  printf '%s\n' 'ERROR cleanup validation requires REMOTE_VERIFIED identity; nothing was deleted' >&2
  exit 18
fi

if [ "$mode" = "merge" ]; then
  if [[ "$GATEKEEPER_PR_NUMBER" =~ ^[0-9]+$ ]] && \
     [[ "$GATEKEEPER_EXPECTED_HEAD" =~ ^[0-9A-Fa-f]{40}$ ]] && \
     [[ "$GATEKEEPER_CURRENT_HEAD" = "$GATEKEEPER_EXPECTED_HEAD" ]] && \
     [ "$GATEKEEPER_CHECKS_STATUS" = "SUCCESS" ] && \
     [ "$GATEKEEPER_REVIEW_THREADS" = "RESOLVED" ] && \
     { [ "$GATEKEEPER_DISPOSITION" = "APPROVE" ] || [ "$GATEKEEPER_DISPOSITION" = "APPROVE_WITH_FOLLOW_UP" ]; } && \
     [ "$GATEKEEPER_HUMAN_AUTHORIZED" = "true" ]; then
    printf '%s\n' 'result=PASS (merge evidence complete; no merge performed)'
    exit 0
  fi
  printf '%s\n' 'ERROR merge evidence is incomplete or invalid; no merge was performed' >&2
  exit 17
fi

if [ "$GATEKEEPER_PR_STATE" = "MERGED" ] && \
   [[ "$GATEKEEPER_MERGE_COMMIT" =~ ^[0-9A-Fa-f]{40}$ ]] && \
   git -C "$root" cat-file -e "${GATEKEEPER_MERGE_COMMIT}^{commit}" 2>/dev/null; then
  main_ref="origin/main"
  if ! git -C "$root" rev-parse --verify --quiet "$main_ref" >/dev/null; then
    main_ref="main"
  fi
  if git -C "$root" rev-parse --verify --quiet "$main_ref" >/dev/null && \
     git -C "$root" merge-base --is-ancestor "$GATEKEEPER_MERGE_COMMIT" "$main_ref"; then
    printf '%s\n' 'result=PASS (cleanup evidence complete; nothing was deleted)'
    exit 0
  fi
fi
printf '%s\n' 'ERROR cleanup evidence is incomplete or invalid; nothing was deleted' >&2
exit 18
