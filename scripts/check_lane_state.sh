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
if [ -z "$branch" ] && [ "$mode" != "inspect" ]; then
  printf '%s\n' 'ERROR detached HEAD is not allowed for this mode' >&2
  exit 12
fi

lane_id="NONE"
lane_status="UNKNOWN"
if [ -f "$registry" ] && [ -n "$branch" ]; then
  lane_block="$(awk -v branch="$branch" '
    /\{/ { block=$0 ORS; next }
    block != "" { block=block $0 ORS }
    /\}/ {
      if (block ~ "\"(durable_branch|managed_workspace_branch|branch)\"[[:space:]]*:[[:space:]]*\"" branch "\"") print block
      block=""
    }
  ' "$registry")"
  lane_id="$(printf '%s' "$lane_block" | sed -n 's/.*"id"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -n 1)"
  lane_status="$(printf '%s' "$lane_block" | sed -n 's/.*"status"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -n 1)"
  lane_id="${lane_id:-NONE}"
  lane_status="${lane_status:-UNKNOWN}"
fi

printf 'mode=%s\nroot=%s\nidentity=%s\nrepository=%s\nbranch=%s\nlane=%s\nstatus=%s\n' \
  "$mode" "$root" "$identity_mode" "$expected_slug" "${branch:-DETACHED}" "$lane_id" "$lane_status"

if [ "$mode" = "inspect" ]; then
  printf '%s\n' 'result=PASS (read-only inspection)'
  exit 0
fi

if [ "$mode" = "mutation" ]; then
  if [ "$branch" = "main" ]; then
    printf '%s\n' 'ERROR mutation on main is prohibited' >&2
    exit 13
  fi
  if [ "$lane_id" = "NONE" ] || [ "$lane_status" != "APPROVED" ]; then
    printf '%s\n' 'ERROR current branch has no approved active lane' >&2
    exit 15
  fi
  allowed='^(.github/skills/gatekeeper/SKILL.md|.github/skills/gatekeeper/references/session-start.md|.github/skills/gatekeeper/references/session-stop.md|.ai/governance/repository-profile.md|.ai/active-lanes/README.md|.ai/active-lanes/datahub-devpost.json|scripts/check_lane_state.sh)$'
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
    printf '%s\n' 'ERROR merge validation requires REMOTE_VERIFIED identity and current GitHub PR, CI, review-thread, Reviewer Disposition, and human-authorization evidence' >&2
    exit 17
  fi
  printf '%s\n' 'ERROR cleanup validation requires REMOTE_VERIFIED identity and verified merged-PR evidence; no cleanup was performed' >&2
  exit 18
fi

if [ "$mode" = "merge" ]; then
  printf '%s\n' 'ERROR provide current GitHub PR, CI, review-thread, Reviewer Disposition, and human-authorization evidence; no merge was performed' >&2
  exit 17
fi
printf '%s\n' 'ERROR provide verified merged-PR evidence before cleanup; nothing was deleted' >&2
exit 18
