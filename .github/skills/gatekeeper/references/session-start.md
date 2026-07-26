# Gatekeeper session start

Run commands individually in bash or zsh; do not paste them beneath a top-level `set -e`.

```sh
ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || printf '%s\n' 'FAIL: not in Git'
printf 'root=%s\n' "$ROOT"
git -C "$ROOT" remote get-url origin 2>/dev/null || printf '%s\n' 'origin=absent'
git -C "$ROOT" branch --show-current
git -C "$ROOT" status --short --untracked-files=all
git -C "$ROOT" worktree list --porcelain
"$ROOT/scripts/check_lane_state.sh" inspect
BRANCH="$(git -C "$ROOT" branch --show-current)"
if [ -z "$BRANCH" ]; then
  printf '%s\n' 'mutation validation skipped: detached HEAD is inspection-only'
elif [ "$BRANCH" = "main" ]; then
  printf '%s\n' 'mutation validation skipped: main is inspection-only'
else
  "$ROOT/scripts/check_lane_state.sh" mutation
fi
```

The checker dynamically finds the root. If `origin` exists, it must normalize to
`themg-max/mg-mcp-datahub-agent`. If absent, the package name, architecture artifact,
and expected base ancestry must establish SNAPSHOT_VERIFIED identity.

Before work, confirm one owner, the active lane and branch mapping, objective, allowed
paths, blocked paths, validation, proof, definition of done, and stop condition. Inspect
the complete worktree status and reject unrelated changes. Fail closed on missing or
conflicting identity, detached or main mutation branches, unknown lanes, scope drift, or
missing controls. Never substitute policy or a lane from another repository.
