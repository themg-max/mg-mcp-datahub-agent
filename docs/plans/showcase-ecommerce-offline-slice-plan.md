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
2. create immutable `pre_retrieval_packet_content` with
   `packet_representation_version: "split-v1"` and
   `packet_lifecycle_version: "two-stage-v1"`. This record authorizes retrieval
   only and carries its own `record_id` and `content_digest`; embed the exact
   request, `pre_retrieval_manifest`, context budgets, fixture/source binding,
   immutable selected-skill fields, expected worktree identity and clean-state
   policy, literal allowed paths, tools and commands, approval requirement,
   expiry, proof obligation, and stop condition. Also create mutable
   `packet_state` with exact `pre_retrieval_record_id` and
   `pre_retrieval_content_digest` references but no final packet binding yet;
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
10. after all required records are retrieved and before freshness, screening, or
    context construction, compute and record the observed entity count, maximum
    lineage depth, lineage-edge count, total record count, estimated token count,
    and elapsed retrieval time from the canonical retrieved set; compare every
    observation with the validated manifest budget and return `BUDGET_EXCEEDED`
    for missing, malformed, or over-budget evidence; then require attributable
    `source_updated_at` for every safety-critical record, calculate
    `checked_at - source_updated_at`, and return `FRESHNESS_EXCEEDED` for missing,
    malformed, future-dated, or over-age evidence;
11. screen all retrieved text as untrusted data only and require attributable
    completed screening evidence; return `SCREENING_REQUIRED` when required
    sanitization or injection screening is absent or pending, return
    `SCREENING_FAILED` when screening rejects retrieved content, and do not
    build canonical context, accept approval, or render a proposal in either
    case;
12. build canonical context, then create a new immutable final
    `packet_content` execution record rather than mutating
    `pre_retrieval_packet_content`. The final record must carry
    `supersedes_record_id`, `pre_retrieval_record_id`, and
    `pre_retrieval_content_digest`; copy every pre-retrieval authorization field
    byte-for-byte; add only the validated retrieval measurements, screening
    digest, canonical context digest, and final execution bindings; compute a
    new final `record_id` and `content_digest`; revalidate the complete
    supersession chain; and update `packet_state` with the final
    `packet_content_record_id` and `packet_content_digest`. Any missing link,
    mutation of a carried-forward field, or digest mismatch returns
    `DIGEST_INVALID` before approval;
13. resolve the current repository root, Git common directory, absolute worktree
    path and identity, branch, exact head, and canonical output of
    `git status --porcelain=v1 -z --untracked-files=all`;
14. compare the resolved checkout identity only with the immutable packet
    worktree binding, require `untracked_policy: deny_all`, require zero staged,
    unstaged, or untracked entries, record the canonical empty
    `worktree_status_digest`, reject `main`, a detached or missing branch,
    another clone or worktree, a wrong branch or head, or any dirty-state entry,
    and return `WORKTREE_INVALID` before approval evaluation;
15. validate the immutable pre-retrieval-to-final supersession chain,
    successful screening bindings, and affirmative approval fields in
    `packet_state`, including `human_approved: true`, reviewer identity,
    disposition, `approved_packet_digest`, `approved_content_digest`,
    `pre_retrieval_record_id`, `pre_retrieval_content_digest`, final
    `packet_content_record_id`, approved worktree identity, approved clean-state
    digest, and approved head;
16. require `packet_representation_version: "split-v1"` and
    `packet_lifecycle_version: "two-stage-v1"`. Map the shared contract's
    singular governed packet exclusively to the final
    `packet_content.record_id` and `packet_content.content_digest` in the
    approval payload, `approved_content_digest`, and proof `packet_binding`.
    Proof must separately include `retrieval_authorization_binding` for
    `pre_retrieval_packet_content.record_id` and its digest, plus the exact
    supersession fields carried by the final packet. Require `packet_state` to
    reference both records and digests. A missing lifecycle mapping or proof
    chain returns `PROOF_INCOMPLETE`; carried-forward authorization drift returns
    `DIGEST_INVALID`; approval or proof bound to the pre-retrieval record,
    mutable state record, or wrong final record returns
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
    `expires_at`;
20. immediately after rendering and before proof or emission, re-resolve the
    repository root, Git common directory, absolute worktree path and identity,
    branch, exact head, and current
    `git status --porcelain=v1 -z --untracked-files=all`; require the same
    approved identity and zero staged, unstaged, or untracked entries; record
    `post_render_worktree_status_digest` and require it to equal the approved and
    pre-execution empty-status digest. Any identity or clean-state drift returns
    `WORKTREE_INVALID`; a changed path outside packet scope returns
    `SCOPE_VIOLATION`; in either case discard the proposal; and
21. immediately before emitting `proposal_ready` and final proof, revalidate the
    approval-payload digest, immutable packet-content record identity and digest,
    current post-render worktree identity and clean-status digest,
    `approval_expiry_checked_at`, `approved_at`, every later expiry-check time,
    `executing_at`, and `validated_at`; otherwise return the exact failure code,
    discard the proposal, and emit the deterministic blocked result.

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
timeout.

Budget declarations are validated before retrieval. The worker must also
measure the observed entity count, maximum lineage depth, lineage-edge count,
total record count, estimated token count, and elapsed retrieval time
incrementally or immediately after retrieval. Missing, malformed, negative, or
over-limit declared or observed evidence returns `BUDGET_EXCEEDED` before
freshness validation, screening, context construction, approval, or rendering.
Retrieved records from an over-budget result are discarded.

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

Before approval is evaluated, immediately before rendering, and immediately
after rendering before proof emission, the worker must resolve and canonicalize:

- repository root;
- Git common directory;
- absolute worktree path and registered worktree identity;
- branch name;
- exact head SHA; and
- `git status --porcelain=v1 -z --untracked-files=all`.

The packet's explicit untracked-file policy is `deny_all`. At all three
checkpoints, the canonical status output must contain zero staged, unstaged, and
untracked entries. The empty output is hashed as `worktree_status_digest`; the
post-render observation is separately recorded as
`post_render_worktree_status_digest`. Packet, approval, and proof must bind the
approved, pre-render, and post-render observations to the same empty status.

The post-render checkpoint must execute a fresh Git identity and status query;
it must not reuse the pre-execution observation. The worker must reject `main`,
a detached or missing branch, another repository clone, another registered
worktree, a wrong path, wrong branch, wrong head, any tracked modification, any
staged change, or any untracked file. Any missing, ambiguous, dirty, or
mismatched checkout-to-packet value returns `WORKTREE_INVALID`; a changed path
outside packet scope returns `SCOPE_VIOLATION`; `proposal` remains `null` and
`executed_writes` remains empty. Matching only the head SHA is insufficient, and
Gatekeeper validation does not replace these worker-local checks.

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

The packet uses `packet_representation_version: "split-v1"` and
`packet_lifecycle_version: "two-stage-v1"`:

- immutable `pre_retrieval_packet_content` is the retrieval-authorization
  record. It contains only values available and validated before retrieval and
  carries its own `record_id` and RFC 8785 JCS SHA-256 `content_digest`;
- after retrieval, observed-budget validation, freshness, screening, and context
  construction, the worker creates a new immutable final `packet_content`
  execution record. It must copy every pre-retrieval authorization field
  unchanged and include `supersedes_record_id`, `pre_retrieval_record_id`, and
  `pre_retrieval_content_digest`, then add only validated retrieval,
  screening, context, and final execution bindings;
- final `packet_content` is the singular governed packet referenced by the
  shared approval and proof contract. Its `record_id` and `content_digest` map
  to the shared packet identity, `approved_content_digest`, approval payload,
  and proof `packet_binding`;
- mutable `packet_state` carries approval, status, transitions, failures, and
  proof-state fields, its own `state_record_id` and `state_digest`, and exact
  references to both the pre-retrieval and final immutable records; and
- proof contains both `retrieval_authorization_binding` for the immutable
  pre-retrieval record and `packet_binding` for the immutable final execution
  record. The latter is the only record that may receive human approval.

The original pre-retrieval record is never mutated. Before approval, the worker
must revalidate that all carried-forward authorization fields are byte-identical
and that both record IDs, digests, and supersession references form one chain.
Missing or malformed lifecycle evidence returns `PROOF_INCOMPLETE`; modified
carried-forward fields or invalid supersession digests return `DIGEST_INVALID`;
approval or proof bound to the pre-retrieval record, mutable state record, or an
unrelated final record returns `PACKET_APPROVAL_MISMATCH`.

`approved_content_digest` snapshots final immutable
`packet_content.content_digest` at approval time and is distinct from
`approved_packet_digest`, which snapshots the canonical approval payload.
Writing or clearing approval fields, changing status, recording transitions, or
appending failure/proof evidence changes only `packet_state`.

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
- a bounded `split-v1` packet represented by immutable `packet_content` and
  mutable `packet_state`, with `packet_content` as the singular governed packet,
  exact cross-record ID and digest bindings, and
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
- `SCREENING_REQUIRED`;
- `SCREENING_FAILED`;
- `UNAUTHORIZED_TOOL`;
- `UNAUTHORIZED_COMMAND`;
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
   post-retrieval per-record `source_updated_at` validation, sanitization and
   injection screening with `SCREENING_REQUIRED` and `SCREENING_FAILED`,
   provenance, and UNKNOWN records.
3. `src/showcase-ecommerce/approval.ts` — screening-to-packet binding;
   checkout-to-packet repository root, Git common directory, absolute worktree
   identity, non-`main` branch, exact-head and clean-status validation;
   construction and validation of immutable pre-retrieval and final packet
   records plus mutable `packet_state`; supersession-chain revalidation;
   `approved_packet_digest`, final `packet_content_record_id`, and
   non-self-referential `approved_content_digest`; trusted-time
   approval-transition expiry; and approval acceptance only while unexpired.
4. `src/showcase-ecommerce/proposal.ts` — pre-render and post-render
   identity/clean-state rechecks, trusted-time pre-render and render-completion
   expiry checks, deterministic SQL/YAML rendering only while unexpired, final
   validation before emission, or a blocked result that discards any late,
   dirty-worktree, out-of-scope, or integrity-invalid proposal.
5. `src/showcase-ecommerce/proof.ts` — canonical manifest-digest, budget, fixture,
   skill, screening, freshness-stage, worktree identity and clean-state digest;
   `retrieval_authorization_binding` for immutable
   `pre_retrieval_packet_content`; final `packet_binding` for immutable
   `packet_content`; supersession-chain evidence; supplemental mutable
   `packet_state` identity and digest evidence; authorized tool and command
   evidence; packet-bound expiry; approval and execution transition timestamps
   and checks; packet, context, and digest evidence.
6. `src/cli.ts` — an explicitly selected showcase command path that preserves
   existing generic behavior.
7. `fixtures/showcase-ecommerce/context.json` and
   `fixtures/showcase-ecommerce/expected-output.json` — only after provenance,
   license, freshness inputs, immutable skill record, sanitization, and an
   implementation-lane allowlist are approved.
8. `tests/showcase-ecommerce/*.test.ts` — deterministic success and blocked cases
   for missing, malformed, and mismatched canonical manifest digest returning
   `DIGEST_INVALID`; every declared or observed entity, lineage, edge, record,
   token, freshness-age, and timeout budget excess returning
   `BUDGET_EXCEEDED`, including post-retrieval count, token, and elapsed-time
   overages; missing or changed
   skill fields; missing manifest freshness inputs; missing, malformed, future,
   and over-age post-retrieval source timestamps; absent or pending screening
   evidence returning `SCREENING_REQUIRED`; sanitization or injection rejection
   returning `SCREENING_FAILED`; a tool outside the packet allowlist returning
   `UNAUTHORIZED_TOOL`; a command outside the packet allowlist returning
   `UNAUTHORIZED_COMMAND`; wrong repository root, common directory,
   worktree path or identity, `main`, detached or wrong branch, and
   head mismatch; staged, unstaged, or untracked changes before approval,
   before rendering, or after rendering before proof emission; renderer-created
   files; post-render clean-state digest drift; non-`deny_all` untracked policy;
   absent approval, missing `human_approved`, and `human_approved: false`
   returning `APPROVAL_REQUIRED`; malformed approval; missing or invalid
   exact-head approval evidence returning `APPROVAL_HEAD_MISMATCH`; missing or
   unsupported representation or lifecycle version; mutation of the immutable
   pre-retrieval record; missing or mismatched `supersedes_record_id`,
   `pre_retrieval_record_id`, or `pre_retrieval_content_digest`; carried-forward
   authorization drift returning `DIGEST_INVALID`; missing
   `retrieval_authorization_binding` returning `PROOF_INCOMPLETE`; approval or
   proof bound to the pre-retrieval or mutable state record instead of final
   `packet_content` returning `PACKET_APPROVAL_MISMATCH`; cross-wired
   content/state references; missing or mismatched final
   `packet_content_record_id` or `approved_content_digest`; approval, status,
   transition, failure, or proof
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
- canonical manifest verification and `DIGEST_INVALID`; deterministic
  pre-retrieval budget-declaration validation and post-retrieval observed-budget
  measurement with `BUDGET_EXCEEDED`; manifest ordering; immutable-skill gate;
  manifest-level pre-retrieval freshness inputs; post-retrieval per-record
  freshness validation; deterministic `SCREENING_REQUIRED` and
  `SCREENING_FAILED` behavior; checkout identity and clean-state validation
  before approval, before rendering, and after rendering before proof emission;
  the `split-v1` / `two-stage-v1` immutable pre-retrieval-to-final supersession
  chain; `retrieval_authorization_binding` to the pre-retrieval record; singular
  governed `packet_binding` to final immutable `packet_content`; supplemental
  mutable `packet_state` identity and digest evidence; deterministic
  `UNAUTHORIZED_TOOL` and `UNAUTHORIZED_COMMAND` behavior; separate
  approval-payload and
  immutable-content snapshots; trusted-time approval-transition expiry;
  continuous later execution-transition expiry; authority behavior; and output
  contracts reviewed;
- deterministic blocked evidence for missing, malformed, and mismatched manifest
  digest; every declared and observed budget class, including post-retrieval
  counts, tokens, and elapsed time; wrong repository root, common directory,
  worktree, `main`, wrong or detached branch, head mismatch,
  staged/unstaged/untracked entries at every checkpoint, renderer-created files,
  and pre-render or post-render clean-state digest mismatch;
- separate deterministic evidence for missing or pending screening returning
  `SCREENING_REQUIRED`, failed sanitization or injection screening returning
  `SCREENING_FAILED`, unsupported representation version, proof bound to the
  state record, and content/state cross-binding drift;
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
- deterministic bounded retrieval with `BUDGET_EXCEEDED` for any invalid or
  exceeded declared budget and for any post-retrieval observed entity, lineage,
  edge, record, token, freshness-age, or elapsed-time budget;
- immutable skill ID, source, version, license, and digest before retrieval;
- concrete manifest `max_freshness_age` and deterministic `checked_at` before
  retrieval, followed by attributable per-record `source_updated_at` and
  `checked_at - source_updated_at` validation after retrieval;
- exact source and context digests; `packet_representation_version: "split-v1"`;
  `packet_lifecycle_version: "two-stage-v1"`; immutable
  `pre_retrieval_packet_content`; immutable final `packet_content` as the
  singular governed packet; exact supersession and retrieval-authorization
  bindings; supplemental mutable `packet_state`; and approval, screening,
  expiry, and proof digests;
- canonical repository root, Git common directory, absolute registered worktree
  identity, a non-`main` approved branch, exact head, `untracked_policy:
  deny_all`, and zero staged, unstaged, or untracked entries validated before
  approval, before rendering, and immediately after rendering before proof
  emission, with fresh pre-render and post-render status digests;
- affirmative `human_approved: true` approval separately bound to reviewer,
  disposition, `approved_packet_digest`, immutable
  `packet_content_record_id`, non-self-referential
  `approved_content_digest`, approved clean-state digest, worktree identity,
  and approved head;
- trusted current-time validation before status becomes `approved`, at
  `approved_at`, before rendering, at `executing_at`, at render completion, at
  `validated_at`, and immediately before final proof/emission, with every
  transition at or before packet `expires_at`;
- literal packet allowlists for tools and commands, returning
  `UNAUTHORIZED_TOOL` or `UNAUTHORIZED_COMMAND` before execution for any
  non-member;
- no DataHub or MG MCP writes, production migration, or deployment;
- deterministic success and blocked outputs;
- independent review of code, fixture provenance, skill supply chain, privacy,
  manifest integrity, budgets, freshness stage, worktree identity/clean state,
  immutable packet-content/mutable packet-state separation, approval-payload and
  content-record binding, approval and execution-transition expiry, and proof;
  and
- a stop at proof return or any safety-critical UNKNOWN, digest, budget, conflict,
  freshness, screening, skill, worktree, approval, or expiry failure.

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
   versioned singular-packet/proof compatibility, immutable pre-retrieval to
   final-packet supersession, immutable packet-content/mutable packet-state
   separation, deterministic screening and authorization failure codes,
   non-self-referential approval snapshots, trusted-time
   approval-transition
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
