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
`.ai/active-lanes/datahub-devpost.json`. Neither is durable authority until its pull
request merges.

## Modes

- **inspect**: read-only identity, branch, worktree, and lane reporting; allowed on main.
- **mutation**: validates a registered approved lane and task-scoped worktree; forbidden
  on main and does not itself mutate anything.
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

## Authority order

1. Git and GitHub are durable current-state authority.
2. A merged GitHub pull request is completion authority.
3. The merged repository profile is repository-policy authority.
4. The merged active-lane registry is lane authority.
5. Approved repository architecture is architecture authority.
6. MG MCP is read-only supporting context.
7. Chat, Cloud workspace state, and terminal output are temporary supporting evidence.

## Controls and boundaries

- **REQUIRED**: exact identity, non-main mutation branch, registered lane, bounded scope,
  validation evidence, human merge authorization, and fail-closed handling.
- **OPTIONAL**: local convenience hooks and additional read-only checks. Missing optional
  local hooks are not blockers.
- **NOT_APPLICABLE**: controls belonging only to another repository or unrelated surface.

Gatekeeper must keep MG MCP read-only. It prohibits deployment, IAM or secret changes,
protected-data mutation, direct DataHub writes, force pushes, and local mutation on main.
