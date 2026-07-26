# Active-lane registry

`datahub-devpost.json` is scoped only to `themg-max/mg-mcp-datahub-agent`. Each lane has
an `id`, allowed `status`, and evidence appropriate to its purpose. Execution lanes also
identify one `owner` and branch mapping; artifact, commit, base, PR, and note fields carry
durable scope or proof where applicable.

Allowed statuses are `PROPOSED`, `PLANNING_ONLY`, `APPROVED`, `VERIFIED`, `SUPERSEDED`,
and `UNKNOWN`. APPROVED permits bounded execution; it does not mean merged or make
proposed policy authoritative. VERIFIED records confirmed durable completion. A durable
preservation outcome is recorded as `status: VERIFIED` with `disposition: PRESERVED`.

`durable_branch` is the connected repository branch. `managed_workspace_branch` maps an
ephemeral snapshot branch to that same lane without pretending it is durable evidence.
Required lane fields are `id` and `status`; every APPROVED mutation lane additionally
requires one owner, a matching branch field, and a non-empty `allowed_paths` array.

Each `allowed_paths` entry is one literal repository-relative file path. Entries must be
unique and must not be empty, absolute, traversing, directories, Git metadata paths, globs,
or regular expressions. Gatekeeper resolves the exact lane from the current branch and
compares every changed path literally, including both sides of a rename.

The registry committed on trusted mainline is authoritative. A branch worktree registry is
only `proposal_registry`: it cannot approve its own lane, owner, branch mapping, or allowlist.
There is no self-authorization. Register future work through the serialized workflow
`registry intake PR -> merge -> actual branch from updated main`. Closeout uses the same
serialized `chore/lane-registry-intake` branch; only one active intake PR may exist at a time.

For CI pull-request validation, `GATEKEEPER_CI_PR_BASE_SHA` may identify the exact base
commit. CI is responsible for supplying the actual PR base SHA, not an arbitrary ancestor;
Gatekeeper requires exactly 40 hexadecimal characters, a commit in this repository, an
ancestor of `HEAD`, and an ancestor of trusted `origin/main`, then uses that exact value.
If `origin/main` is unavailable, validation fails closed. Without the CI value,
REMOTE_VERIFIED authority is `origin/main`.

The current allowlist repair PR is a one-time `BOOTSTRAP_TRANSITION`. It is authorized only
by independent GitHub review, CI, Reviewer Disposition, and explicit human merge
authorization. Its branch registry remains a proposal and becomes authority only after
merge. Repository-local hooks are optional and may be absent.

Close a lane only after durable outcome and proof are recorded. Mark a replaced lane
SUPERSEDED and point future work to its replacement rather than rewriting history. Do
not delete branches, worktrees, commits, or other evidence before a merged PR is verified.
Never load or use a lane registered for another repository.
