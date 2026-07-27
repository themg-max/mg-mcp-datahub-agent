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

REMOTE_VERIFIED mutation normally reads authority from `origin/main`. In CI,
`GATEKEEPER_CI_PR_BASE_SHA` may provide the exact PR base SHA; CI must supply the actual
base, never an arbitrary ancestor. The checker requires 40 hex characters, a commit in the
expected repository, ancestry to `HEAD`, and ancestry to trusted `origin/main`, then uses
the exact value. Missing `origin/main` fails closed. It loads the registry only with
`git show <authority-commit>:.ai/active-lanes/datahub-devpost.json` into a temporary file.
The worktree registry printed as `proposal_registry` is never mutation authority.
SNAPSHOT_VERIFIED mutation exits 15.

Before work, confirm one owner, the active lane and branch mapping, objective, allowed
paths, blocked paths, validation, proof, definition of done, and stop condition. Inspect
the complete worktree status and reject unrelated changes. Fail closed on missing or
conflicting identity, detached or main mutation branches, unknown lanes, scope drift, or
missing controls. Never substitute policy or a lane from another repository.

For mutation, the exact branch mapping selects exactly one APPROVED lane. Its non-empty
`allowed_paths` must contain only unique literal repository-relative file paths. The
checker prints the resolved count and compares every porcelain path literally, including
both source and destination for renames. Out-of-scope changes exit 14; missing or malformed
lane authority exits 15.

There is no self-authorization. Use the serialized workflow
`registry intake PR -> merge -> actual branch from updated main`; closeout reuses
`chore/lane-registry-intake`, and only one intake PR may be active. The current repair is a
one-time `BOOTSTRAP_TRANSITION` authorized only by independent GitHub review, CI, Reviewer
Disposition, and explicit human merge authorization. The merge-only bootstrap path is bound
to PR 4, the exact repair branch, trusted base
`c9d9d851df3b1d523e9bc84f57f1aa676673fc8f`, matching externally supplied expected/current
`HEAD`, and the fixed six-file scope. It independently validates the candidate registry at
`HEAD` but never uses candidate content to authorize the branch. Hooks are optional and may
be absent.
