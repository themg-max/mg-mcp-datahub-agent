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
Required lane fields are `id` and `status`; an executable mutation lane additionally
requires an owner and a matching branch field.

Close a lane only after durable outcome and proof are recorded. Mark a replaced lane
SUPERSEDED and point future work to its replacement rather than rewriting history. Do
not delete branches, worktrees, commits, or other evidence before a merged PR is verified.
Never load or use a lane registered for another repository.
