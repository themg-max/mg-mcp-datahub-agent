# Gatekeeper session stop

Report all of the following:

- outcome and repository identity mode;
- repository root, branch, and worktree;
- every changed file;
- commit and pull request, if available;
- validation results and blockers;
- complete uncommitted-change status;
- durable proof path;
- next step and one next owner.

For merge evidence, record `GATEKEEPER_PR_NUMBER`, `GATEKEEPER_EXPECTED_HEAD`,
`GATEKEEPER_CURRENT_HEAD`, `GATEKEEPER_CHECKS_STATUS`, `GATEKEEPER_REVIEW_THREADS`,
`GATEKEEPER_DISPOSITION`, and `GATEKEEPER_HUMAN_AUTHORIZED`. For cleanup evidence,
record `GATEKEEPER_PR_STATE` and `GATEKEEPER_MERGE_COMMIT`.

Chat, Cloud workspace state, and terminal output alone never prove completion. Completion
requires a verified merged GitHub pull request. Never clean a branch or worktree before
verified merge evidence. Preserve recovery branches and evidence branches, including
preservation lanes, until their durable disposition is verified.
