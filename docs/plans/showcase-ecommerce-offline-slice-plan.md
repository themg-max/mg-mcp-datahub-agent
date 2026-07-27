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

This plan uses only the controlling `governed_development_work_packet` schema
version `1.0`. It does not define `split-v1`, `two-stage-v1`, a separate mutable
`packet_state`, an approval-state snapshot, or a descendant-state protocol.

## Objective

For `logical_dataset=showcase-ecommerce`,
`scenario_key=safe-customer-email-migration`, and
`source_mode=OFFLINE_FIXTURE`, load attributable synthetic metadata, build
governed context, produce a bounded packet, and return either an in-memory SQL
and dbt-YAML proposal or a deterministic fail-closed result. The result is never
implementation, deployment, DataHub-write, MG-MCP-write, or merge authority.

## Controlling packet lifecycle

1. Before any worker read, create an initial canonical packet revision with
   `status: proposed`, `execution_status: not_started`, the complete
   pre-retrieval manifest, declared budgets, fixture binding, immutable skill,
   visible tool inventory, repository/worktree binding, literal paths, literal
   tool and command allowlists, approval requirement, expiry, proof obligation,
   and stop condition.
2. Packet revisions are immutable evidence records. When retrieval, context,
   screening, status, failure, validation, or approval data must change, create a
   new canonical packet revision with a new `record_id`, set `supersedes` to the
   immediately prior packet record, and recompute the RFC 8785 JCS SHA-256
   `content_digest` under the controlling digest rule.
3. A prior approval never survives a packet revision or any packet-field change.
   The prior approval is invalidated exactly as required by the controlling
   contract: `human_approved` becomes false, approval identity, timestamp,
   disposition, approved head, approved packet digest, and approved content
   digest are cleared, and progression is blocked with
   `PACKET_APPROVAL_MISMATCH` until the exact new packet revision is approved.
4. `approved_packet_digest` is the digest of the controlling
   `approval_digest_payload`; `approved_content_digest` is the exact current
   packet `content_digest` captured at approval time. No alternate digest target
   or stable approval across later packet mutations is introduced here.
5. The final proof binds to the exact validated packet revision by record ID and
   content digest. Earlier revisions remain attributable through the ordered
   `supersedes` chain; they do not substitute for the final packet binding.
6. Missing, broken, reordered, or digest-inconsistent packet revision evidence is
   `PROOF_INCOMPLETE` or `DIGEST_INVALID`. Approval or proof bound to any other
   packet revision is `PACKET_APPROVAL_MISMATCH`.

## Explicit packet transition graph

Only these forward transitions are permitted:

| From | To | Required gate |
|---|---|---|
| `proposed` / `not_started` | `approved` / `approved` | All retrieval, context, screening, inventory, worktree, scope, digest, and expiry gates pass; create the exact approved packet revision and obtain fresh human approval for it. |
| `approved` / `approved` | `executing` / `executing` | Create a superseding executing revision, invalidate the prior approval, revalidate every approval-bearing field, and obtain fresh human approval for the exact executing revision before rendering. |
| `executing` / `executing` | `validated` / `validated` | Complete side-effect-free rendering and validation, create a superseding validated revision, invalidate the executing approval, and obtain fresh human approval for the exact validated revision before final emission. |
| Any nonterminal state | `blocked` / `blocked` or `blocked` / `failed` | Record the exact failure and stop. |

All other edges are forbidden. In particular:

- no direct `proposed` to `executing` or `validated` transition;
- no direct `approved` to `validated` transition;
- no backward or same-state transition;
- no `blocked` or `failed` transition back to an active state;
- no skipped reapproval after a packet status, execution status, failure,
  validation, or approval-bearing field changes.

A forbidden edge is `APPROVAL_INVALID`; an edge whose packet or approval binding
does not match the exact current revision is `PACKET_APPROVAL_MISMATCH`.

## Non-reorderable workflow

1. Validate `OFFLINE_FIXTURE`; blocked modes return `SOURCE_MODE_BLOCKED`.
2. Create the initial proposed packet revision before any worker read.
3. Validate manifest canonicalization and digest; failure is `DIGEST_INVALID`.
4. Validate declared fixture ID/digest syntax, declared budgets, immutable skill
   ID/source/version/license/digest, and a visible fresh tool inventory.
5. Missing or changed skill evidence is `SKILL_BINDING_FAILED`; missing, stale,
   malformed, or digest-mismatched inventory is `TOOL_INVENTORY_INVALID`.
6. Resolve repository root, Git common directory, absolute registered worktree,
   non-`main` branch, exact head, and canonical Git status. Require
   `untracked_policy: deny_all` and a clean checkout.
7. Create a retrieval-attempt record before the first read.
8. Retrieve through a cancellable iterator or equivalent bounded stream. Do not
   load the complete fixture before enforcing limits.
9. As each entity, lineage node, lineage edge, record, or token estimate arrives,
   update entity count, maximum observed lineage depth, edge count, record count,
   and token count. Compare every updated value with its declared limit and check
   a monotonic deadline while the read is running. Abort on the first breach.
10. A runtime entity, lineage-depth, lineage-edge, record, token, or elapsed-time
    limit breach is `BUDGET_EXCEEDED`; cancel the reader, retain exact attempt
    evidence, and discard the partial canonical result.
11. Record each attempt's stable ID, exact query, source mode, start/completion
    timestamps, outcome, record count, content digest, and failure code.
12. A complete `empty`, `partial`, `timeout`, or `failed` attempt remains its exact
    observed source outcome. The outcome itself is not
    `RETRIEVAL_EVIDENCE_INVALID`. Required safety-critical context remains
    `UNKNOWN` and blocks progression. A timeout caused by the enforced retrieval
    deadline may carry `BUDGET_EXCEEDED` as its attempt failure code.
13. `RETRIEVAL_EVIDENCE_INVALID` is reserved for missing, malformed, or
    field-inconsistent attempt evidence between context and proof.
14. Compare the observed fixture record ID and content digest with the manifest
    binding before using returned data. Missing or mismatched observed evidence
    is `CONNECTION_MISMATCH`.
15. Validate every safety-critical record's attributable `source_updated_at`.
    Compute `checked_at - source_updated_at`. Missing, malformed, future-dated,
    or over-age evidence is `FRESHNESS_EXCEEDED`, never `BUDGET_EXCEEDED`.
16. Screen retrieved text as data only. Missing or pending evidence is
    `SCREENING_REQUIRED`; rejected sanitization or injection screening is
    `SCREENING_FAILED`.
17. Build immutable canonical context and create a new proposed packet revision
    that supersedes the initial packet and carries the exact context record ID and
    digest, observed connection, retrieval attempts, observed budgets, freshness,
    screening, provenance, inventory, and worktree bindings.
18. Revalidate source, manifest, skill, inventory, connection, attempts, budgets,
    freshness, screening, context, worktree, scope, digest, and trusted expiry.
19. Create the `approved` packet revision, clear any earlier approval, and obtain
    fresh affirmative approval tied to this exact packet record, content digest,
    approval payload digest, exact head, reviewer, disposition, and expiry.
20. Create the `executing` packet revision, invalidate the approved revision's
    approval, repeat the full gate, and obtain fresh affirmative approval for the
    exact executing packet before rendering.
21. Render only through a pure in-memory function that returns strings or bytes
    and has no filesystem, subprocess, Git, network, DataHub-write, or
    MG-MCP-write capability.
22. Immediately after rendering, run fresh Git identity/status, scope, inventory,
    expiry, tool/command, and digest checks. Any changed path outside the packet
    allowlist is `SCOPE_VIOLATION`; other worktree drift is `WORKTREE_INVALID`.
23. Create the `validated` packet revision with exact validation and in-memory
    proposal evidence, invalidate the executing approval, repeat the full gate,
    and obtain fresh affirmative approval for the exact validated packet.
24. Build proof using the pairwise bindings below. Emit only when the final proof
    and validated packet revision agree exactly and all approval, expiry, scope,
    inventory, tool, command, and no-write checks pass.
25. On any failure, discard the in-memory proposal, preserve attributable attempt
    and failure evidence, return the exact blocked code, and stop.

## Retrieval budgets and freshness

Declared limits are: 8 entities, lineage depth 1, 2 lineage edges, 16 records,
4,000 estimated tokens, and 30 seconds. These limits are enforced incrementally
while retrieval is running; maximum observed lineage depth is updated as each
lineage node or edge is accepted. Post-completion measurement is only a
consistency check. `max_freshness_age` is a separate ISO-8601 source-freshness
limit. Observed per-record source age routes only to `FRESHNESS_EXCEEDED`.

## Offline connection and retrieval-attempt proof

The manifest, observed context, current packet revision, and proof fixture record
ID/content digest must match exactly. Conditional fixture mismatch is
`CONNECTION_MISMATCH`; canonical manifest or record digest failure remains
`DIGEST_INVALID`.

Context and proof reproduce identical `retrieval_attempts` entries by attempt ID,
query, source mode, timestamps, outcome, record count, digest, and failure code.
An `empty`, `partial`, `timeout`, or `failed` outcome is preserved exactly. It is
not an evidence-integrity failure merely because no complete context resulted.
Only missing or inconsistent attempt fields return
`RETRIEVAL_EVIDENCE_INVALID`. Safety-critical missing context remains `UNKNOWN`
and blocks approval and rendering.

## Tool inventory and authorization

Even offline mode requires visible inventory evidence: runtime ID/version,
protocol version, `discovered_at`, maximum age, canonical tools digest, allowed
and denied tools, and validation. Bind the same inventory to the packet, context,
and proof; revalidate it before retrieval, before each approval, before rendering,
and before emission.

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
2. Otherwise, repository identity mismatch or dirty staged, unstaged, or
   untracked state returns `WORKTREE_INVALID`.

Blocked proof records `observed_changed_paths` and must not claim no mutation
when evidence shows one.

## Pairwise proof-binding contract

Proof acceptance compares only records that can actually carry each field.
Literal three-way equality is not required for approval or later transitions.

### Packet to proof

The final proof must equal the exact validated packet revision for:

- `packet_binding.record_id` and `packet_binding.content_digest`;
- source mode, context record ID/digest, manifest digest, repository and worktree;
- literal writable paths, readable paths, tools, denied tools, and commands;
- packet status, execution status, expiry, validation, and failure fields;
- every approval field, including reviewer, disposition, approved head,
  `approved_packet_digest`, and `approved_content_digest`.

The proof records the ordered packet revision chain as record ID, content digest,
status, execution status, `supersedes`, and approval result. Each link must point
to the exact immediately prior revision. Earlier approvals do not authorize the
final revision.

### Context to packet and proof

The immutable context record equals both the current packet and proof for the
context record ID/digest, source mode, observed fixture binding, retrieval
attempts, observed budgets, freshness evidence, screening, provenance, and tool
inventory fields that the context schema supports. Context does not carry packet
approval fields, later packet statuses, packet-revision approval history, or the
final proof digest.

### Manifest to packet and proof

The packet's embedded pre-retrieval manifest and the proof's pre-retrieval
evidence match for manifest digest, declared budgets, fixture connection,
selected skill, inventory declaration, and source mode. The context carries the
observed values, not a replacement approval or packet-status record.

### Proof-only evidence

Only proof carries the complete ordered packet-revision chain, validation command
results, reviewer disposition evidence, emitted in-memory proposal strings,
`executed_writes`, and the non-self-referential proof digest. Absence of a field
from an earlier immutable record is not a mismatch when that record's schema
cannot carry it.

Any mismatch within an applicable pair is routed to its controlling exact code:
`CONNECTION_MISMATCH`, `RETRIEVAL_EVIDENCE_INVALID`, `TOOL_INVENTORY_INVALID`,
`DIGEST_INVALID`, `WORKTREE_INVALID`, `SCOPE_VIOLATION`,
`PACKET_APPROVAL_MISMATCH`, or `PROOF_INCOMPLETE`.

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

A success result includes exact request and mode, manifest and observed fixture
bindings, immutable skill, fresh tool inventory, retrieval attempts, declared and
observed budgets, canonical context/provenance/freshness, the complete packet
revision chain, exact final validated packet binding, fresh final approval,
worktree and transition evidence, authorized tool/command evidence, in-memory SQL
and dbt-YAML strings, `executed_writes: []`, and a non-self-referential RFC 8785
JCS SHA-256 proof digest.

## Proposed implementation paths

A separate `APPROVED` implementation lane may later authorize:

1. `src/showcase-ecommerce/scenario.ts` - mode, manifest, connection, skill,
   inventory, declared budgets, exact failure routing, and initial packet issue.
2. `src/showcase-ecommerce/context.ts` - cancellable incremental reader,
   counters including maximum lineage depth, retrieval attempts, observed
   connection binding, freshness, screening, provenance, and canonical context.
3. `src/showcase-ecommerce/approval.ts` - canonical packet revisions,
   `supersedes` chain, approval invalidation, fresh approval at every permitted
   transition, exact-head/worktree binding, and expiry.
4. `src/showcase-ecommerce/proposal.ts` - pure in-memory renderer.
5. `src/showcase-ecommerce/proof.ts` - pairwise packet/context/manifest/proof
   bindings, packet revision chain, worktree, scope, transition, and digest
   evidence.
6. `src/cli.ts`, bounded fixtures, tests, and judge examples only as explicitly
   allowlisted by that future lane.

The first executable slice remains network-free and does not add live DataHub.

## Required deterministic tests

Tests must cover manifest digest, observed connection mismatch, immutable skill,
tool inventory, unauthorized tool/command, incremental cancellation for entity,
lineage depth, lineage edge, record, token, and elapsed-time limits; complete
attempt evidence for empty/partial/timeout/failure; an empty result with complete
evidence not being `RETRIEVAL_EVIDENCE_INVALID`; missing or mismatched attempt
evidence being `RETRIEVAL_EVIDENCE_INVALID`; source freshness; screening; clean
worktree and scope precedence; side-effect-free rendering; expiry before every
approval and transition; packet-revision digest and `supersedes` continuity;
approval invalidation after every packet-field or status change; fresh approval
for `approved`, `executing`, and `validated`; rejection of every forbidden or
regressive transition edge; exact final packet-to-proof approval binding;
context-to-packet/proof pairwise equality; manifest-to-packet/proof pairwise
equality; rejection of unsupported literal three-way approval equality; and
incomplete proof.

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
