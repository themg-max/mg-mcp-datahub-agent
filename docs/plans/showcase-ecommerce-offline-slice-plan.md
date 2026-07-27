# Showcase-ecommerce offline vertical slice plan

## Status and authority

- Status: `APPROVED` planning artifact; implementation remains unauthorized.
- Lane: `datahub-showcase-ecommerce-offline-slice-plan`
- Owner: `datahub-offline-slice-planning-owner`
- Repository: `themg-max/mg-mcp-datahub-agent`
- Branch: `plan/datahub-showcase-ecommerce-offline-slice`
- Trusted authority: PR #12 merge commit `8ada6b3844c3f76f96069a27b8cc4691c5cb91ac`
- Writable path: `docs/plans/showcase-ecommerce-offline-slice-plan.md` only

Normative order: `docs/datahub-mg-mcp-skill-bridge-architecture.md`, then
`docs/datahub-skill-execution-architecture.md`, then the approved
`docs/fixtures/showcase-ecommerce/*` contracts, then this plan. A higher-ranked
contract controls any duplicated wording.

## Objective

For `logical_dataset=showcase-ecommerce`,
`scenario_key=safe-customer-email-migration`, and
`source_mode=OFFLINE_FIXTURE`, load attributable synthetic metadata, build
governed context, produce a bounded packet, and return either an in-memory SQL
and dbt-YAML proposal or a deterministic fail-closed result. The result is never
implementation, deployment, DataHub-write, MG-MCP-write, or merge authority.

## Packet lifecycle

Use `packet_representation_version: split-v1` and
`packet_lifecycle_version: two-stage-v1`.

1. Before retrieval, create immutable `pre_retrieval_packet_content` containing
   the exact request, canonical manifest and digest, declared budgets, fixture
   record ID and digest, immutable skill identity, validated tool-inventory
   binding, expected worktree identity, literal paths/tools/commands, approval
   requirement, expiry, proof obligation, and stop condition. It has its own
   immutable record ID and RFC 8785 JCS SHA-256 content digest.
2. Create mutable `packet_state` with its own ID, version, state digest, and exact
   references to the pre-retrieval record. It has no final packet binding yet.
3. After successful retrieval, observed connection validation, runtime budget
   enforcement, freshness, screening, and canonical context construction, create
   a new immutable final `packet_content`. Never mutate the pre-retrieval record.
4. Final `packet_content` copies every pre-retrieval authorization field
   byte-for-byte, carries `supersedes_record_id`, `pre_retrieval_record_id`, and
   `pre_retrieval_content_digest`, and adds only validated retrieval,
   connection, inventory, screening, context, and execution bindings.
5. Final `packet_content` is the singular governed packet for approval and proof.
   Proof separately carries `retrieval_authorization_binding` to the immutable
   pre-retrieval record. Missing lifecycle evidence is `PROOF_INCOMPLETE`;
   carried-forward drift is `DIGEST_INVALID`; approval or proof bound to the
   wrong record is `PACKET_APPROVAL_MISMATCH`.

## Non-reorderable workflow

1. Validate `OFFLINE_FIXTURE`; blocked modes return `SOURCE_MODE_BLOCKED`.
2. Create the immutable pre-retrieval record and mutable state record.
3. Validate manifest canonicalization and digest; failure is `DIGEST_INVALID`.
4. Validate declared fixture ID/digest syntax, declared budgets, immutable skill
   ID/source/version/license/digest, and a visible fresh tool inventory.
5. Missing or changed skill evidence is `SKILL_BINDING_FAILED`; missing, stale,
   malformed, or digest-mismatched inventory is `TOOL_INVENTORY_INVALID`.
6. Create a retrieval-attempt record before the first read.
7. Retrieve through a cancellable iterator or equivalent bounded stream. Do not
   load the complete fixture before enforcing limits.
8. After every entity, lineage edge, record, and token increment, update counters
   and compare them with the declared limits. Check a monotonic deadline while
   the read is running. Abort on the first breach.
9. Entity, lineage-depth, lineage-edge, record, token, or elapsed-time breach is
   `BUDGET_EXCEEDED`; cancel the reader, retain attempt evidence, and discard the
   partial canonical result.
10. Record each attempt's stable ID, exact query, source mode, start/completion
    timestamps, outcome, record count, content digest, and failure code. Timeout
    carries `BUDGET_EXCEEDED`; empty, partial, or failed required retrieval
    carries `RETRIEVAL_EVIDENCE_INVALID`.
11. Compare the observed fixture record ID and content digest with the manifest
    binding before using returned data. Missing or mismatched observed evidence
    is `CONNECTION_MISMATCH`.
12. Require context and proof retrieval-attempt arrays to match field-for-field;
    missing or inconsistent evidence is `RETRIEVAL_EVIDENCE_INVALID`.
13. Validate every safety-critical record's attributable `source_updated_at`.
    Compute `checked_at - source_updated_at`. Missing, malformed, future-dated,
    or over-age evidence is `FRESHNESS_EXCEEDED`, never `BUDGET_EXCEEDED`.
14. Screen retrieved text as data only. Missing/pending evidence is
    `SCREENING_REQUIRED`; rejected sanitization/injection screening is
    `SCREENING_FAILED`.
15. Build canonical context and create final immutable `packet_content` through
    the supersession contract.
16. Resolve repository root, Git common directory, absolute registered worktree,
    non-`main` branch, exact head, and canonical Git status. Require
    `untracked_policy: deny_all` and a clean checkout before approval.
17. Validate observed connection evidence, retrieval attempts, budgets,
    inventory, screening, context, packet lifecycle, and worktree.
18. Validate affirmative approval and compute `approval_core_digest` over
    `human_approved`, reviewer, disposition, approved time/head/digests,
    immutable packet references, approved worktree-status digest, and expiry.
19. Validate trusted time before approval, before render, at render completion,
    at validation, and immediately before final emission. Late or invalid
    evidence is `PACKET_EXPIRED`.
20. Immediately before rendering, revalidate the complete approval core, current
    packet-state digest/version and references, tool inventory, packet,
    worktree, and expiry.
21. Render only through a pure in-memory function that returns strings/bytes and
    has no filesystem, subprocess, Git, network, DataHub-write, or MG-MCP-write
    capability.
22. Immediately after rendering, run a fresh Git identity/status check as defense
    in depth.
23. Immediately before `proposal_ready`, re-read mutable `packet_state` and
    revalidate `human_approved`, reviewer, disposition, approved head/digests,
    immutable references, worktree digest, expiry, `approval_core_digest`,
    current state digest/version, inventory, and transition chain.
24. Emit only when all gates pass; otherwise discard the in-memory proposal and
    return the exact blocked result.

## Retrieval budgets and freshness

Declared limits are: 8 entities, lineage depth 1, 2 lineage edges, 16 records,
4,000 estimated tokens, and 30 seconds. These limits are enforced incrementally
while retrieval is running; post-completion measurement is only a consistency
check. `max_freshness_age` is a separate ISO-8601 source-freshness limit.
Observed per-record source age routes only to `FRESHNESS_EXCEEDED`.

## Offline connection and retrieval-attempt proof

Manifest, context, and proof fixture record ID/content digest must match exactly.
Conditional fixture mismatch is `CONNECTION_MISMATCH`; canonical manifest or
record digest failure remains `DIGEST_INVALID`.

Context and proof reproduce identical `retrieval_attempts` entries by attempt ID,
query, source mode, timestamps, outcome, record count, digest, and failure code.
Empty, partial, timeout, and failed outcomes remain visible and cannot collapse
into generic `UNKNOWN`.

## Tool inventory and authorization

Even offline mode requires visible inventory evidence: runtime ID/version,
protocol version, `discovered_at`, maximum age, canonical tools digest, allowed
and denied tools, and validation. Bind the same inventory to the pre-retrieval
packet, final packet, context, and proof; revalidate it before retrieval, before
rendering, and before emission.

Actual tools and commands are literal subsets of packet allowlists. A non-member
tool is `UNAUTHORIZED_TOOL`; a non-member command is `UNAUTHORIZED_COMMAND`.
The renderer inventory denies filesystem writes, shell/subprocess, Git mutation,
network, DataHub writes, and MG MCP writes.

## Worktree and renderer precedence

The renderer is side-effect-free by construction, so a conforming success
truthfully has `executed_writes: []`. The post-render Git check detects external
or implementation drift; it is not permission to write and clean up later.

Failure precedence is deterministic:

1. Any observed changed path outside the literal packet allowlist returns
   `SCOPE_VIOLATION`.
2. Otherwise, repository identity mismatch or dirty staged/unstaged/untracked
   state returns `WORKTREE_INVALID`.

Blocked proof records `observed_changed_paths` and must not claim no mutation
when evidence shows one.

## Mutable approval-state revalidation

Final emission cannot rely on a pre-render mutable-state snapshot. Re-read the
current state and require affirmative approval, unchanged reviewer/disposition,
approved head and digests, immutable record references, approved worktree digest,
expiry, and `approval_core_digest`, plus a valid state digest/version and
permitted transition chain.

- revoked or false approval -> `APPROVAL_REQUIRED`;
- malformed state -> `APPROVAL_INVALID`;
- missing/invalid exact-head evidence -> `APPROVAL_HEAD_MISMATCH`;
- packet, content, worktree, head, state, or proof binding drift ->
  `PACKET_APPROVAL_MISMATCH`.

## Exact failure codes

- `SOURCE_MODE_BLOCKED`
- `DIGEST_INVALID`
- `CONNECTION_MISMATCH`
- `SKILL_BINDING_FAILED`
- `TOOL_INVENTORY_INVALID`
- `UNAUTHORIZED_TOOL`
- `UNAUTHORIZED_COMMAND`
- `BUDGET_EXCEEDED`
- `RETRIEVAL_EVIDENCE_INVALID`
- `FRESHNESS_EXCEEDED`
- `SCREENING_REQUIRED`
- `SCREENING_FAILED`
- `SCOPE_VIOLATION`
- `WORKTREE_INVALID`
- `APPROVAL_REQUIRED`
- `APPROVAL_INVALID`
- `APPROVAL_HEAD_MISMATCH`
- `PACKET_APPROVAL_MISMATCH`
- `PACKET_EXPIRED`
- `AUTHORITY_CONFLICT`
- `FORBIDDEN_OPERATION_ATTEMPTED`
- `PROOF_INCOMPLETE`

## Success and proof

A success result includes exact request/mode, manifest and observed fixture
bindings, immutable skill, fresh tool inventory, retrieval attempts, declared
and observed budgets, canonical context/provenance/freshness, retrieval and final
packet bindings, current packet-state ID/version/digest, complete approval core,
worktree and transition evidence, authorized tool/command evidence, in-memory SQL
and dbt-YAML strings, `executed_writes: []`, and a non-self-referential RFC 8785
JCS SHA-256 proof digest.

Proof acceptance requires exact packet/context/proof equality for connection,
attempts, skill, inventory, budgets, freshness, screening, worktree, approval,
expiry, scope, and actual tools/commands.

## Proposed implementation paths

A separate `APPROVED` implementation lane may later authorize:

1. `src/showcase-ecommerce/scenario.ts` — mode, manifest, connection, skill,
   inventory, declared budgets, and failure routing.
2. `src/showcase-ecommerce/context.ts` — cancellable incremental reader,
   counters, retrieval attempts, observed connection binding, freshness,
   screening, provenance, and canonical context.
3. `src/showcase-ecommerce/approval.ts` — two-stage packet lifecycle, mutable
   state, approval-core digest, worktree binding, final-state validation, expiry.
4. `src/showcase-ecommerce/proposal.ts` — pure in-memory renderer.
5. `src/showcase-ecommerce/proof.ts` — connection, attempts, inventory, budgets,
   packet bindings, worktree, approval, scope, transition, and digest evidence.
6. `src/cli.ts`, bounded fixtures, tests, and judge examples only as explicitly
   allowlisted by that future lane.

The first executable slice remains network-free and does not add live DataHub.

## Required deterministic tests

Tests must cover manifest digest, observed connection mismatch, immutable skill,
tool inventory, unauthorized tool/command, incremental cancellation for every
runtime budget, complete attempt evidence for empty/partial/timeout/failure,
source freshness, screening, packet supersession, worktree identity and scope
precedence, side-effect-free rendering, mutable approval-state change, expiry at
every transition, and incomplete proof.

## Planning PR validation

```bash
./scripts/check_lane_state.sh mutation
test -s docs/plans/showcase-ecommerce-offline-slice-plan.md
git diff --check
test "$(git diff --name-only origin/main...HEAD | wc -l | tr -d ' ')" -eq 1
test "$(git diff --name-only origin/main...HEAD)" = "docs/plans/showcase-ecommerce-offline-slice-plan.md"
npm ci
npm run typecheck
npm test
npm run demo:json
```

The proof return records the exact head, one-file scope, Gatekeeper result,
package-command results, CI, Codex review, Reviewer Disposition, and unresolved
items. Proof is evidence, not merge authority.

## Blocked scope

This planning lane blocks runtime, fixtures, tests, examples, hooks, Gatekeeper
changes, packages, workflows, live/private DataHub, credentials, DataHub writes,
MG MCP writes, deployment, IAM, billing, production dbt changes, autonomous merge,
and authority promotion.

## Definition of done and stop condition

The lane is done only when this is the sole changed path, validation and exact-head
CI pass, Codex review has zero unresolved findings, a `READY_FOR_MERGE` Reviewer
Disposition is posted, and an authorized human merges the reviewed exact head.
Stop at any failed gate or unresolved finding; do not begin implementation.
