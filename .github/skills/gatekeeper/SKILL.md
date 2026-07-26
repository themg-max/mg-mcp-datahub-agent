# DataHub Devpost Gatekeeper

Gatekeeper is the repository-local governance entry point for the durable repository
`themg-max/mg-mcp-datahub-agent`. It prevents work in this public Devpost repository from
silently inheriting lanes, checks, hooks, paths, or proof duties from another repository.

## Identity and local authority

Identity is **REMOTE_VERIFIED** when an existing `origin` normalizes to the exact durable
slug. In a managed snapshot without `origin`, identity is **SNAPSHOT_VERIFIED** only when
the package name, architecture artifact, and expected base commit all match. Otherwise,
fail closed; never fall back to another repository profile.

The proposed policy is `.ai/governance/repository-profile.md`; lanes are registered in
`.ai/active-lanes/datahub-devpost.json`. The trusted-mainline registry is authoritative.
The worktree copy is only `proposal_registry`; it cannot authorize its own lane, owner,
branch mapping, or allowlist. Neither proposed policy nor branch registry is durable
authority until its pull request merges.

## Modes

- **inspect**: read-only identity, branch, worktree, and lane reporting; allowed on main.
- **mutation**: resolves the exact registered APPROVED lane from the current branch, reads
  that lane's required literal `allowed_paths` from trusted mainline, and validates the
  task-scoped worktree; forbidden on main and does not itself mutate anything.
- **merge**: validates only; requires REMOTE_VERIFIED identity and current GitHub merge
  evidence: `GATEKEEPER_PR_NUMBER`, `GATEKEEPER_EXPECTED_HEAD`,
  `GATEKEEPER_CURRENT_HEAD`, `GATEKEEPER_CHECKS_STATUS`,
  `GATEKEEPER_REVIEW_THREADS`, `GATEKEEPER_DISPOSITION`, and
  `GATEKEEPER_HUMAN_AUTHORIZED`. Gatekeeper never merges or authorizes a merge.
- **cleanup**: validates only; requires REMOTE_VERIFIED identity and verified merged-PR
  evidence: `GATEKEEPER_PR_STATE` and `GATEKEEPER_MERGE_COMMIT`. It never deletes
  anything; cleanup remains a separate human-authorized action.

Human authorization is REQUIRED for every merge. One task owner is REQUIRED. Before
mutation, record the owner, objective, allowed scope, blocked scope, validation, proof,
definition of done, and stop condition.

For REMOTE_VERIFIED identity, normal authority is `origin/main`. CI may set
`GATEKEEPER_CI_PR_BASE_SHA` to the exact PR base SHA. CI is responsible for ensuring it is
the actual base rather than an arbitrary ancestor; Gatekeeper requires a 40-hex commit in
this repository that is an ancestor of both `HEAD` and trusted `origin/main`, and uses that
exact value. Missing `origin/main` fails closed. The authority registry is loaded with
`git show <authority-commit>:.ai/active-lanes/datahub-devpost.json` into a temporary buffer,
never from the worktree. SNAPSHOT_VERIFIED mutation is prohibited.

## Authority order

1. Git and GitHub are durable current-state authority.
2. A merged GitHub pull request is completion authority.
3. The merged repository profile is repository-policy authority.
4. The merged active-lane registry is lane authority.
5. Approved repository architecture is architecture authority.
6. MG MCP is read-only supporting context.
7. Chat, Cloud workspace state, and terminal output are temporary supporting evidence.

## Controls and boundaries

- **REQUIRED**: exact identity, non-main mutation branch, registered lane with one owner
  and a valid non-empty literal file allowlist, bounded scope, validation evidence, human
  merge authorization, and fail-closed handling.
- **OPTIONAL**: local convenience hooks and additional read-only checks. Missing optional
  local hooks are not blockers.
- **NOT_APPLICABLE**: controls belonging only to another repository or unrelated surface.

Gatekeeper must keep MG MCP read-only. It prohibits deployment, IAM or secret changes,
protected-data mutation, direct DataHub writes, force pushes, and local mutation on main.

Mutation scope is lane-local. Allowlist entries are unique literal repository-relative
file paths, never directories, `.git` paths, absolute or traversing paths, globs, or regular
expressions. Every changed path must match literally; rename records validate both paths.
Valid authority with an out-of-scope change exits 14. Missing or malformed lane authority,
including an invalid APPROVED-lane allowlist, exits 15.

There is no self-authorization. Future lanes follow the serialized workflow
`registry intake PR -> merge -> actual branch from updated main`; closeout reuses
`chore/lane-registry-intake`, with one active intake PR at a time. This repair PR is a
one-time `BOOTSTRAP_TRANSITION`, authorized only by independent GitHub review, CI, Reviewer
Disposition, and explicit human merge authorization. Its proposed lane becomes authority
only after merge.
