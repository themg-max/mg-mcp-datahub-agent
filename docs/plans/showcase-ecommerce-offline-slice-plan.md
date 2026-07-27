# Showcase-ecommerce offline vertical slice plan

## Status, ownership, and authority

- Status: approved planning artifact; this document does not authorize implementation,
  deployment, merge, or any external write.
- Lane: `datahub-showcase-ecommerce-offline-slice-plan`
- Owner: `datahub-offline-slice-planning-owner`
- Repository: `themg-max/mg-mcp-datahub-agent`
- Branch: `plan/datahub-showcase-ecommerce-offline-slice`
- Planning base: `8ada6b3844c3f76f96069a27b8cc4691c5cb91ac`
- Allowed path in this lane: `docs/plans/showcase-ecommerce-offline-slice-plan.md`
- Trusted authority: PR #12 merge commit `8ada6b3844c3f76f96069a27b8cc4691c5cb91ac`

The planning lane is authorized only to define the next deterministic offline
slice. It must not implement runtime code, add fixtures or tests, change
packages or workflows, access live DataHub, write DataHub or MG MCP, deploy,
change IAM or credentials, or merge autonomously.

## 1. Objective and judge value

Demonstrate one narrow, reproducible metadata-aware development flow:

> Given the exact logical dataset `showcase-ecommerce` and scenario
> `safe-customer-email-migration`, load attributable synthetic metadata from a
> committed fixture, build governed context, produce a bounded work packet, and
> emit either a deterministic safe customer-email proposal or a deterministic
> fail-closed result.

The judge-visible causal chain is:

1. validate the request, source mode, context budgets, canonical manifest
   digest, immutable selected-skill binding, and manifest-level source evidence
   before retrieval;
2. retrieve and normalize schema, bounded lineage, ownership, domain, tags,
   glossary, quality, standards, provenance, and authority state;
3. validate per-record source freshness after retrieval and before approval;
4. bind the packet to its source, manifest, allowed scope, blocked operations,
   expected clean worktree identity, approval requirement, expiry, and stop
   condition;
5. validate the current checkout identity and clean-state digest before approval
   and again immediately before rendering;
6. separate immutable packet content from mutable approval and execution state,
   then bind approval to both the approval-payload digest and a
   non-self-referential `approved_content_digest` over the immutable
   pre-approval content record;
7. use trusted current time while accepting affirmative approval so status
   cannot become `approved` after packet expiry;
8. keep packet expiry valid through rendering, final validation, and proof
   completion using trusted current-time transition checks;
9. use only verified metadata to constrain the proposal; and
10. return reviewable proof with no external writes.

The result is a proposal for human review. It is never approval, a production
dbt migration, a DataHub or MG MCP mutation, a deployment, or merge authority.

## 2. Current-state reuse

The future implementation lane should reuse the existing public reference
surfaces instead of creating a second governance model:

- `src/cli.ts` already loads a fixture, normalizes records, builds a packet, and
  emits JSON with explicit stderr failure behavior.
- `src/datahub/context-adapter.ts` preserves `approved`, `planning_only`,
  `quarantined`, and `unknown` authority states.
- `src/work-packet.ts` canonicalizes records, deduplicates provenance, derives
  blocked scope and unknowns, sorts arrays, and requires human approval.
- `fixtures/datahub-context.json` and `fixtures/invalid-datahub-context.json`
  establish fixture-first success and invalid-input conventions.
- `docs/datahub-skill-execution-architecture.md` supplies the four-plane,
  read-only, proof, failure-code, and maturity-boundary model.
- `docs/datahub-mg-mcp-skill-bridge-architecture.md` supplies the
  non-reorderable manifest, canonical digest, immutable skill, freshness,
  worktree identity, packet/content approval bindings, approval-transition
  expiry, execution-transition expiry, and shared failure-code contracts.
- The existing `docs/fixtures/showcase-ecommerce/*` artifacts define planning
  vocabulary, metadata dimensions, budgets, public-safety rules, and expected
  blocked behavior. They are planning contracts, not runtime authority.

The existing generic fixture is not the official contest datapack and must not
be silently reclassified as `showcase-ecommerce`. Official datapack identity,
release, license, DataHub URNs, exact fields, owners, lineage, and live tool
names remain `UNKNOWN` until independently verified.

## 3. Canonical deterministic fixture-first scenario

The canonical request is fixed to:

```text
logical_dataset = showcase-ecommerce
scenario_key    = safe-customer-email-migration
objective       = safe dbt schema migration
source_mode     = OFFLINE_FIXTURE
```

The workflow is non-reorderable:

1. validate `OFFLINE_FIXTURE` as the permitted source mode;
2. create the bounded packet as two linked canonical records: immutable
   `packet_content`, containing every execution-authorizing field and its own
   `content_digest`, and mutable `packet_state`, containing approval, status,
   transition, failure, and proof-binding fields plus the exact
   `packet_content_record_id` and `packet_content_digest`; embed the
   `pre_retrieval_manifest`, context budgets, fixture/source binding, immutable
   selected-skill fields, expected worktree identity and clean-state policy,
   approval requirement, expiry, and canonical manifest digest in
   `packet_content`;
3. before reading any fixture record, validate manifest budgets, source binding,
   content digest, manifest-level deterministic freshness inputs
   (`max_freshness_age` and `checked_at`), immutable selected-skill identity,
   and the canonical `manifest_digest`;
4. return `DIGEST_INVALID` before retrieval when canonicalization fails or the
   `manifest_digest` is missing, malformed, or mismatched;
5. return `BUDGET_EXCEEDED` before retrieval when any entity, lineage, edge,
   record, token, freshness-age, or timeout budget is invalid or exceeded;
6. fail with `SKILL_BINDING_FAILED` before retrieval when the selected skill ID,
   canonical source, exact version, license, or content digest is missing,
   `UNKNOWN`, changed, or does not match the approved registry record;
7. resolve exactly one target dataset and its schema;
8. resolve at most one downstream lineage path at depth one;
9. resolve ownership, domain, tags, glossary, quality, and approved standards;
10. after all required records are retrieved, require attributable
    `source_updated_at` for every safety-critical record, calculate
    `checked_at - source_updated_at`, and return `FRESHNESS_EXCEEDED` for missing,
    malformed, future-dated, or over-age evidence;
11. screen all retrieved text as untrusted data only;
12. build canonical context and bind it back to the validated packet;
13. resolve the current repository root, Git common directory, absolute worktree
    path and identity, branch, exact head, and canonical output of
    `git status --porcelain=v1 -z --untracked-files=all`;
14. compare the resolved checkout identity only with the immutable packet
    worktree binding, require `untracked_policy: deny_all`, require zero staged,
    unstaged, or untracked entries, record the canonical empty
    `worktree_status_digest`, reject `main`, a detached or missing branch,
    another clone or worktree, a wrong branch or head, or any dirty-state entry,
    and return `WORKTREE_INVALID` before approval evaluation;
15. validate screening bindings and affirmative approval fields in
    `packet_state`, including `human_approved: true`, reviewer identity,
    disposition, `approved_packet_digest`, `approved_content_digest`, exact
    `packet_content_record_id`, approved worktree identity, approved clean-state
    digest, and approved head;
16. require `approved_content_digest` to equal immutable
    `packet_content.content_digest` and the proof approval binding; require
    `packet_state.packet_content_record_id` and
    `packet_state.packet_content_digest` to match the immutable content record;
    and require `approved_packet_digest` to equal the current approval-payload
    digest. Approval, status, transition, failure, and proof mutations may change
    only `packet_state` and must not change `packet_content.content_digest`.
    Any immutable-content mutation or cross-record binding drift returns
    `PACKET_APPROVAL_MISMATCH` and invalidates approval;
17. before changing status to `approved`, obtain trusted current time, validate
    that packet `expires_at` is present, timezone-aware, correctly bound, and not
    elapsed, record `approval_expiry_checked_at`, and record `approved_at` only
    when both timestamps are at or before `expires_at`; otherwise return
    `PACKET_EXPIRED` without accepting approval;
18. immediately before rendering, re-resolve checkout identity and
    `git status --porcelain=v1 -z --untracked-files=all`, require the same clean
    identity and empty status digest approved in the packet, obtain trusted
    current time, revalidate expiry, and record `executing_at` only when every
    gate passes and it is at or before `expires_at`;
19. render the bounded proposal, obtain trusted current time at rendering
    completion, and record `validated_at` only when it is at or before
    `expires_at`; and
20. immediately before emitting `proposal_ready` and final proof, revalidate the
    approval-payload digest, immutable packet-content record identity and digest,
    worktree identity, pre-execution clean status digest,
    `approval_expiry_checked_at`, `approved_at`, every later
    expiry-check time, `executing_at`, and `validated_at`; otherwise return the
    exact failure code, discard the proposal, and emit the deterministic blocked
    result.

### 3.1 Manifest integrity, bounded retrieval, and deterministic freshness

The `pre_retrieval_manifest` is canonicalized using the shared contract before
retrieval. Its recorded `manifest_digest` must be present, syntactically valid,
and equal the digest of the canonical manifest payload. Missing, malformed, or
mismatched digest evidence, or failed canonicalization, stops retrieval with
`DIGEST_INVALID`.

The offline fixture must be byte-stable, network-free, public-safe, and
canonically ordered. Local fixture keys are not DataHub entity IDs. Contract
budgets remain bounded to eight entities, lineage depth one, two lineage edges,
sixteen total records, 4,000 estimated tokens, and a 30-second retrieval
timeout. Missing, malformed, negative, or exceeded entity, lineage, edge,
record, token, freshness-age, or timeout budgets stop retrieval with
`BUDGET_EXCEEDED`.

The fixture contract currently records `max_freshness_age: UNKNOWN`; an
implementation must not copy that value into an executable packet or manufacture
an apparent zero-age success. Before retrieval, the manifest must provide and
validate only:

- a concrete ISO 8601 `max_freshness_age` duration;
- a committed deterministic `checked_at` value;
- the fixture/source and content-digest bindings; and
- the canonical `manifest_digest`.

After the required records are retrieved, every safety-critical record must
provide attributable `source_updated_at`. `retrievedAt` is retrieval evidence
and is not a substitute for source update time. Observed age is exactly
`checked_at - source_updated_at`, must be non-negative, and must not exceed
`max_freshness_age`. Missing, `UNKNOWN`, malformed, future-dated, or over-age
record evidence returns `FRESHNESS_EXCEEDED` after retrieval but before context
approval or rendering.

### 3.2 Immutable selected-skill binding

The packet's `selected_skill` binding must contain an immutable skill ID,
canonical source, exact version, license, and content digest. The current
planning artifacts do not verify an executable skill identity, so the future
implementation success path remains blocked with `SKILL_BINDING_FAILED` until a
separately reviewed registry record supplies and validates every field. A local
label or model-selected name cannot satisfy this gate.

### 3.3 Full worktree identity and clean-state binding

Before approval is evaluated, and again immediately before rendering, the worker
must resolve and canonicalize:

- repository root;
- Git common directory;
- absolute worktree path and registered worktree identity;
- branch name;
- exact head SHA; and
- `git status --porcelain=v1 -z --untracked-files=all`.

The packet's explicit untracked-file policy is `deny_all`. Before approval and
before rendering, the canonical status output must contain zero staged,
unstaged, and untracked entries. The empty output is hashed as
`worktree_status_digest`; packet, approval, and proof must carry the same digest.
The worker must reject `main`, a detached or missing branch, another repository
clone, another registered worktree, a wrong path, wrong branch, wrong head, any
tracked modification, any staged change, or any untracked file. Any missing,
ambiguous, dirty, or mismatched checkout-to-packet value returns
`WORKTREE_INVALID`; `proposal` remains `null` and `executed_writes` remains
empty. Matching only the head SHA is insufficient, and Gatekeeper validation
does not replace these worker-local checks.

Approval evidence is not used to classify a checkout as valid or invalid.
Approval-to-packet, approval-to-content, and approval-to-worktree mismatches are
evaluated only in the subsequent approval gate with approval-specific failure
codes.

### 3.4 Non-self-referential approval content binding and transition expiry

SQL/YAML rendering is packet execution by a bounded worker, not a pre-approval
preview. After checkout-to-packet worktree validation passes, the worker must
validate affirmative human approval tied to the canonical approval payload, the
immutable packet-content record, clean worktree identity, and approved head.
Approval failure semantics are:

- no approval object, missing `human_approved`, or `human_approved: false`:
  `APPROVAL_REQUIRED`;
- malformed reviewer, timestamp, disposition, content-record identity, or
  approval identity syntax: `APPROVAL_INVALID`;
- an approval object whose exact-head evidence is missing, invalid, or cannot be
  validated as exact-head approval evidence: `APPROVAL_HEAD_MISMATCH`; and
- syntactically valid affirmative approval whose `approved_packet_digest`,
  `approved_content_digest`, `packet_content_record_id`, approved clean-state
  digest, worktree identity, or head diverges from the immutable content record,
  mutable state reference, checkout, or proof bindings:
  `PACKET_APPROVAL_MISMATCH`.

The packet is represented by two independently canonicalized and linked records:

- immutable `packet_content` contains every execution-authorizing value,
  including objective, owner, source and manifest bindings, budgets, selected
  skill, screening and context digests, repository and clean-worktree binding,
  literal paths, allowed tools and commands, expiry, proof obligation, and stop
  condition. Its `content_digest` is the RFC 8785 JCS SHA-256 digest of
  `packet_content` with only its own `content_digest` field omitted.
  `packet_content` contains no approval, mutable status, transition timestamp,
  failure, or proof-evidence fields.
- mutable `packet_state` contains approval, authority/execution/retrieval status,
  transition timestamps, failures, and proof bindings. It references the exact
  immutable `packet_content_record_id` and `packet_content_digest`.

`approved_content_digest` snapshots immutable
`packet_content.content_digest` at approval time and is distinct from
`approved_packet_digest`, which snapshots the canonical approval payload.
`packet_state`, approval evidence, and proof must carry the same immutable
content-record ID and digest. Writing or clearing approval fields, changing
status, recording transitions, or appending failure/proof evidence changes only
`packet_state` and cannot change `approved_content_digest`.

Any mutation to an execution-authorizing field requires a new immutable
`packet_content` record or digest and immediately invalidates the prior
approval. A mismatched content record, content digest, state reference, or proof
binding clears affirmative approval and blocks execution with
`PACKET_APPROVAL_MISMATCH` until the new immutable content is reviewed and
approved.

Before status may become `approved`, the worker must obtain trusted current time
and prove the packet is still unexpired. `approval_expiry_checked_at` and the
resulting `approved_at` must be timezone-aware, attributable to the trusted time
source, and at or before packet `expires_at`. Missing, malformed, incorrectly
bound, or late approval-transition time evidence returns `PACKET_EXPIRED`; the
approval is not accepted and execution does not begin. Merely observing an
approval-provided timestamp that is earlier than expiry is insufficient.

Expiry remains a continuing execution invariant after approval. The worker must
use the trusted current-time source immediately before rendering, when
`executing_at` is recorded, when rendering completes, when `validated_at` is
recorded, and immediately before final proof and `proposal_ready` emission. The
proof's `packet_binding.expires_at` must equal packet `expires_at`, every expiry
check must cover every non-null execution-transition timestamp, and
`approval_expiry_checked_at`, `approved_at`, `executing_at`, and `validated_at`
must each be at or before `expires_at`. Missing, malformed, incorrectly bound,
elapsed, or late transition evidence returns `PACKET_EXPIRED`, including when
approval is accepted after expiry or rendering starts before expiry but finishes
after it.

Every blocked result has `proposal: null` and `executed_writes: []`; a proposal
rendered before a late integrity or expiry determination is discarded and cannot
be emitted as `proposal_ready`.

## 4. Authority-state behavior

Authority is evidence metadata, not a model judgment:

| State | Permitted use | Required behavior |
| --- | --- | --- |
| `approved` | Constrain a proposal when provenance, freshness, and bindings validate | Preserve source reference and validate it against packet scope |
| `planning_only` | Describe intended scope and contracts | Never authorize implementation, deployment, writes, or merge |
| `quarantined` | No decision use | Exclude from authority decisions and retain the quarantine reason in proof |
| `unknown` | Preserve as unresolved evidence | Never infer a value; block when safety-critical and record the next permitted read-only check |

The repository-approved authority for this planning lane is PR #12's trusted
merge commit and the lane registry's `APPROVED` entry. The fixture contract and
this document remain planning-only. Missing retrieval is `UNKNOWN`, not proof
of absence. Conflicting attributable records block the affected proposal.

## 5. Deterministic output contracts

### 5.1 Success output

Only after manifest digest, budgets, manifest fields, immutable-skill,
post-retrieval per-record freshness, screening, context, clean
checkout-to-packet worktree identity, linked immutable `packet_content` and
mutable `packet_state` validation, `approved_packet_digest`,
non-self-referential `approved_content_digest`, affirmative
`human_approved: true` approval, approval-transition trusted-time expiry
validation, and continuous later execution-transition expiry validation all
pass, emit one stable JSON result containing:

- `status: "proposal_ready"`;
- the exact request and `OFFLINE_FIXTURE` source mode;
- canonical manifest payload and verified `manifest_digest`;
- immutable selected-skill identity and verified digest;
- canonical context records with provenance, `source_updated_at`, observed age,
  and authority state;
- a bounded packet represented by immutable `packet_content` and mutable
  `packet_state`, with exact cross-record ID and digest bindings and
  `humanApprovalRequired: true`;
- resolved repository root, Git common directory, absolute worktree identity,
  non-`main` branch, exact head, `untracked_policy: deny_all`, canonical empty
  worktree status, and `worktree_status_digest`, verified before approval and
  before rendering;
- `human_approved: true`, reviewer identity, disposition,
  `approved_packet_digest`, immutable `packet_content_record_id`,
  non-self-referential `approved_content_digest`, approved clean-state digest,
  and packet-bound `expires_at`;
- trusted-time `approval_expiry_checked_at`, `approved_at`, `executing_at`,
  `validated_at`, pre-render, render-completion, and final-emission expiry checks,
  all at or before `expires_at`;
- the verified selected field, downstream relation or model, glossary meaning,
  and quality assertion;
- deterministic SQL and matching dbt schema-test YAML proposal shapes; and
- proof for manifest digest, budgets, fixture, skill, freshness stage, worktree
  identity and clean-state binding, approval-payload and immutable-content-record
  bindings, approval-transition and later execution-transition expiry, packet,
  context,
  commands, tests, changed paths, warnings, and `executed_writes: []`.

Stable inputs must produce stable key, record, array, and serialization order.
A successful result remains a proposal and does not authorize implementation,
deployment, production migration, or merge.

### 5.2 Fail-closed output

Emit a stable blocked result instead of guessed SQL/YAML when any source mode,
manifest digest, budget, manifest field, immutable skill, post-retrieval
freshness, screening, checkout identity, worktree clean state, linked
packet-content/state binding, approval-payload or immutable-content snapshot,
affirmative approval, approval-transition expiry, later
execution-transition expiry, authority, command, or safety-critical `UNKNOWN`
gate fails. The exact applicable failure code includes:

- `DIGEST_INVALID`;
- `BUDGET_EXCEEDED`;
- `SKILL_BINDING_FAILED`;
- `FRESHNESS_EXCEEDED`;
- `WORKTREE_INVALID`;
- `APPROVAL_REQUIRED`;
- `APPROVAL_INVALID`;
- `APPROVAL_HEAD_MISMATCH`;
- `PACKET_APPROVAL_MISMATCH`;
- `PACKET_EXPIRED`;
- `SOURCE_MODE_BLOCKED`;
- `AUTHORITY_CONFLICT`;
- `RETRIEVAL_EVIDENCE_INVALID`;
- `FORBIDDEN_OPERATION_ATTEMPTED`;
- `SCOPE_VIOLATION`; or
- `PROOF_INCOMPLETE`.

The blocked result contains the exact request, source mode, packet and context
identifiers, attributable evidence, ordered unknowns or conflicts, next
permitted read-only check, `proposal: null`, `executed_writes: []`, stop
condition, and required owner or reviewer. Invalid fixtures or runtime errors
retain nonzero exit status and plain stderr without a success-shaped fallback,
response-body leakage, or secrets.

## 6. Proposed future implementation paths

These paths require a separately registered and approved implementation lane:

1. `src/showcase-ecommerce/scenario.ts` — exact scenario selection, source-mode
   policy, canonical manifest-digest verification, deterministic budget
   validation, manifest-level freshness inputs, immutable-skill validation,
   authority, and failure codes.
2. `src/showcase-ecommerce/context.ts` — fixture/read-only loading, attribution,
   post-retrieval per-record `source_updated_at` validation, sanitization,
   provenance, and UNKNOWN records.
3. `src/showcase-ecommerce/approval.ts` — screening-to-packet binding;
   checkout-to-immutable-packet repository root, Git common directory, absolute
   worktree identity, non-`main` branch, exact-head and clean-status validation;
   construction and validation of linked immutable `packet_content` and mutable
   `packet_state`; `approved_packet_digest`, immutable
   `packet_content_record_id`, and non-self-referential
   `approved_content_digest`; trusted-time approval-transition expiry; and
   approval acceptance only while unexpired.
4. `src/showcase-ecommerce/proposal.ts` — pre-render identity/clean-state recheck,
   trusted-time pre-render and render-completion expiry checks, deterministic
   SQL/YAML rendering only while unexpired, final validation before emission, or
   a blocked result that discards any late or integrity-invalid proposal.
5. `src/showcase-ecommerce/proof.ts` — canonical manifest-digest, budget, fixture,
   skill, freshness-stage, worktree identity and clean-state digest,
   approval-payload digest, immutable packet-content record ID and digest,
   mutable packet-state binding, packet-bound expiry, approval and execution
   transition timestamps and checks, packet, context, and digest evidence.
6. `src/cli.ts` — an explicitly selected showcase command path that preserves
   existing generic behavior.
7. `fixtures/showcase-ecommerce/context.json` and
   `fixtures/showcase-ecommerce/expected-output.json` — only after provenance,
   license, freshness inputs, immutable skill record, sanitization, and an
   implementation-lane allowlist are approved.
8. `tests/showcase-ecommerce/*.test.ts` — deterministic success and blocked cases
   for missing, malformed, and mismatched canonical manifest digest returning
   `DIGEST_INVALID`; every entity, lineage, edge, record, token, freshness-age,
   and timeout budget excess returning `BUDGET_EXCEEDED`; missing or changed
   skill fields; missing manifest freshness inputs; missing, malformed, future,
   and over-age post-retrieval source timestamps; wrong repository root, common
   directory, worktree path or identity, `main`, detached or wrong branch, and
   head mismatch; staged, unstaged, or untracked changes before approval or
   rendering; non-`deny_all` untracked policy; clean-state digest drift;
   absent approval, missing `human_approved`, and `human_approved: false`
   returning `APPROVAL_REQUIRED`; malformed approval; missing or invalid
   exact-head approval evidence returning `APPROVAL_HEAD_MISMATCH`; missing or
   mismatched immutable `packet_content_record_id` or
   `approved_content_digest`; approval, status, transition, failure, or proof
   mutation leaving the approved immutable snapshot unchanged; mutation of any
   immutable execution-authorizing content producing a new digest and
   `PACKET_APPROVAL_MISMATCH`; packet-state content-reference drift; valid
   approval payload/content/worktree/head drift returning
   `PACKET_APPROVAL_MISMATCH`; approval accepted without a trusted-time expiry
   check; approval attempted or `approved_at` recorded after expiry; missing,
   malformed, incorrectly bound, or already elapsed expiry; `executing_at` or
   `validated_at` after expiry; rendering that starts before expiry and finishes
   after expiry; missing trusted-time transition checks; authority conflict;
   UNKNOWN; invalid source mode; and forbidden operations.
9. `examples/showcase-ecommerce/` — judge-facing output and proof only after the
   implementation and test lane is approved.

The implementation lane must not add a live DataHub dependency. An optional
`ISOLATED_DATAHUB_READ_ONLY` path is a later, separately approved increment
requiring verified connection, identity, tool inventory, endpoint digest,
freshness, and read-only behavior. No write tool is part of this slice.

## 7. Exact validation and proof evidence

The planning PR must run from the repository root:

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

The one-file proof must include:

- repository, branch, absolute worktree path and identity, Git common directory,
  exact head, owner, lane status, allowed path, base SHA, and trusted authority;
- exact changed-path output, Gatekeeper result, and `git diff --check`;
- package command results and exit codes;
- non-empty artifact byte count;
- canonical manifest verification and `DIGEST_INVALID`; deterministic budget
  validation and `BUDGET_EXCEEDED`; manifest ordering; immutable-skill gate;
  manifest-level pre-retrieval freshness inputs; post-retrieval per-record
  freshness validation; checkout identity and clean-state validation before
  approval and rendering; linked immutable packet-content and mutable
  packet-state records; separate approval-payload and immutable-content
  snapshots; trusted-time approval-transition expiry; continuous later
  execution-transition
  expiry; authority behavior; and output contracts reviewed;
- deterministic blocked evidence for missing, malformed, and mismatched manifest
  digest; every budget class; wrong repository root, common directory, worktree,
  `main`, wrong or detached branch, head mismatch, staged/unstaged/untracked
  entries, and clean-state digest mismatch;
- separate deterministic evidence for absent approval, missing or false
  `human_approved`, malformed approval, missing or invalid exact-head approval
  evidence, missing or mismatched immutable content-record ID/digest,
  approval/state-only mutation preserving the immutable snapshot, immutable
  execution-content mutation invalidating approval, packet-state reference
  drift, and valid approval snapshot drift using the corresponding codes;
- expiry proof binding packet `expires_at` to trusted-time
  `approval_expiry_checked_at` before status becomes `approved`, `approved_at`,
  every later expiry check, `executing_at`, and `validated_at`, plus blocked cases
  for approval acceptance after expiry and rendering that crosses expiry;
- confirmation that runtime, fixtures, tests, examples, dependencies, workflows,
  hooks, deployment, IAM, credentials, DataHub writes, and MG MCP writes did not
  change; and
- PR number, exact-head CI, Codex review, reviewer disposition, and unresolved
  items.

Proof is validation evidence, not merge authority.

## 8. Implementation-lane proposal

After this planning PR is independently reviewed and merged, open one bounded
implementation lane with a named owner, worktree, base commit, and explicit
allowlist. Its packet must require:

- `OFFLINE_FIXTURE` as the first executable mode;
- no network, credentials, private, or production metadata;
- canonical manifest-digest verification with `DIGEST_INVALID` for missing,
  malformed, or mismatched evidence;
- deterministic bounded retrieval with `BUDGET_EXCEEDED` for any exceeded
  entity, lineage, edge, record, token, freshness-age, or timeout budget;
- immutable skill ID, source, version, license, and digest before retrieval;
- concrete manifest `max_freshness_age` and deterministic `checked_at` before
  retrieval, followed by attributable per-record `source_updated_at` and
  `checked_at - source_updated_at` validation after retrieval;
- exact source and context digests; linked immutable `packet_content` and
  mutable `packet_state` records; and approval, expiry, and proof digests;
- canonical repository root, Git common directory, absolute registered worktree
  identity, a non-`main` approved branch, exact head, `untracked_policy:
  deny_all`, and zero staged, unstaged, or untracked entries validated before
  approval and rendering;
- affirmative `human_approved: true` approval separately bound to reviewer,
  disposition, `approved_packet_digest`, immutable
  `packet_content_record_id`, non-self-referential
  `approved_content_digest`, approved clean-state digest, worktree identity,
  and approved head;
- trusted current-time validation before status becomes `approved`, at
  `approved_at`, before rendering, at `executing_at`, at render completion, at
  `validated_at`, and immediately before final proof/emission, with every
  transition at or before packet `expires_at`;
- no DataHub or MG MCP writes, production migration, or deployment;
- deterministic success and blocked outputs;
- independent review of code, fixture provenance, skill supply chain, privacy,
  manifest integrity, budgets, freshness stage, worktree identity/clean state,
  immutable packet-content/mutable packet-state separation, approval-payload and
  content-record binding, approval and execution-transition expiry, and proof;
  and
- a stop at proof return or any safety-critical UNKNOWN, digest, budget, conflict,
  freshness, skill, worktree, approval, or expiry failure.

## 9. Blocked scope

This planning lane explicitly blocks:

- `src/**`, `tests/**`, `fixtures/**`, and `examples/**`;
- `.githooks/**`, Gatekeeper skill files, and Gatekeeper script changes;
- package, lockfile, dependency, and workflow changes;
- live DataHub access, credentials, private endpoints, and production metadata;
- DataHub writes, MG MCP writes, deployment, IAM, billing, and environment
  changes; and
- production dbt changes, autonomous merge, and authority promotion.

Missing hook files remain outside this lane and are deferred to a separate
governance lane.

## 10. Definition of done

This planning lane is done when:

1. this artifact is non-empty, reviewable, and the only changed path;
2. objective, judge value, reuse, canonical workflow, manifest integrity,
   deterministic budgets, manifest ordering, immutable skill, manifest-level and
   post-retrieval freshness stages, checkout identity and clean-state binding,
   immutable packet-content/mutable packet-state separation,
   non-self-referential approval snapshots, trusted-time approval-transition
   expiry, approval-before-render, continuous later execution-transition expiry,
   authority, outputs, future paths, validation, proof, blocked scope,
   implementation proposal, and stop condition are explicit;
3. unverified datapack, live DataHub, skill, tool, and executable values remain
   `UNKNOWN` and block safety-critical paths;
4. read-only, fixture-first, manifest-integrity, bounded retrieval,
   pre-retrieval supply-chain, post-retrieval freshness, non-`main` clean
   worktree, non-self-referential immutable-content human approval,
   approval-time and continuous later expiry, and no-write boundaries are
   preserved;
5. Gatekeeper, non-empty, containment, diff, typecheck, test, and demo validation
   pass;
6. the commit is pushed to the approved branch;
7. exact-head CI passes and Codex review completes with no unresolved findings;
8. a final Reviewer Disposition is posted; and
9. merge occurs only after explicit human authorization and GitHub reports the
   exact head mergeable.

## 11. Stop condition

Stop at any failed gate or unresolved review finding. Do not begin runtime
implementation, add fixtures or tests in this lane, access live or private
DataHub, write DataHub or MG MCP, change dependencies or workflows, deploy,
change IAM or credentials, normalize hooks, promote authority, or merge before
exact-head CI, independent review, final Reviewer Disposition, and explicit
human authorization are complete.
