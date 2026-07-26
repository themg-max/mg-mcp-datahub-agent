# Repository governance profile

**Status: PROPOSED** — this profile becomes policy authority only after merge.

## Repository and product

This is the public Devpost contest repository `themg-max/mg-mcp-datahub-agent`. MG MCP is
the primary developer-tools product. MG Guide and the DataHub proof application are only
demonstration context; they do not supply governance.

With `origin`, normalize HTTPS or SSH form and require the exact slug. In a managed
snapshot without a remote, require package `@themg/contextops-datahub-agent`, artifact
`docs/datahub-skill-execution-architecture.md`, and ancestry from commit
`1e5e7a19bfff280d351373ae43c41cefeaab56f9`. This yields SNAPSHOT_VERIFIED, not remote
proof. Never inherit private or cross-repository governance.

## Source authority

1. Git and GitHub are durable current-state authority.
2. Merged GitHub pull requests are completion authority.
3. This profile and the active-lane registry become their respective authorities only
   after merge.
4. Approved repository architecture is architecture authority.
5. MG MCP is read-only supporting context.
6. Chat, Cloud snapshots, and terminal output are temporary evidence.

## Effective merge policy

Main requires a pull request. Merge commits and squash merges are allowed; repository
rebase merges and required linear history are disabled. Review-thread resolution is
required. Deletion and non-fast-forward updates are protected. Fresh passing CI and a
Reviewer Disposition are required before human merge authorization. Gatekeeper cannot
authorize or perform a merge.

## Branches, worktrees, and lifecycle

Never mutate main, force push, or mix lanes. Use one owner and a registered, bounded
branch/worktree. A PR must preserve scope, receive fresh validation and Reviewer
Disposition, resolve review threads, and obtain human authorization. A merged PR is the
completion boundary; retain evidence until merge is verified.

## Validation by changed surface

Validate Markdown readability and references; parse JSON; run `bash -n` and both script
invocation forms for shell; run relevant project tests for implementation changes; and
always run `git diff --check` plus an exact path-scope review.

## Security and privacy

No deployment, traffic, IAM, secrets, environment, protected or production data, direct
DataHub writes, credential exposure, or unrelated runtime activation is authorized.
Repository governance never imports rules, checks, hooks, or proof obligations from a
private MG source or any other repository.

