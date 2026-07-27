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
   expected worktree identity, approval requirement, expiry, and stop condition;
5. validate the current checkout against the immutable packet worktree binding;
6. separately validate affirmative approval against packet, worktree, and head
   bindings before SQL/YAML rendering;
7. use only verified metadata to constrain the proposal; and
8. return reviewable proof with no external writes.

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
  worktree identity, packet approval, expiry, and shared failure-code contracts.
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
2. create the bounded packet and embedded `pre_retrieval_manifest`, including
   all context budgets, fixture/source binding, immutable selected-skill fields,
   expected worktree identity, approval requirement, expiry, and canonical
   manifest digest;
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
    path and identity, branch, and exact head from the checkout;
14. compare every resolved checkout value only with the immutable packet
    worktree binding, reject `main`, a detached or missing branch, another
    repository clone, another worktree, a wrong branch, or a head mismatch, and
    return `WORKTREE_INVALID` before approval evaluation;
15. separately validate screening bindings and affirmative packet approval,
    including `human_approved: true`, reviewer identity, approval timestamp,
    disposition, approval digest, approved worktree identity and head, and
    current packet digest;
16. validate that packet `expires_at` is present, timezone-aware, bound to the
    packet and approval, and not elapsed at the deterministic execution check
    time; and
17. render the proposal only when all prior gates pass; otherwise emit the
    deterministic blocked result.

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

### 3.3 Full worktree identity binding

Before approval is evaluated, the worker must resolve and canonicalize:

- repository root;
- Git common directory;
- absolute worktree path and registered worktree identity;
- branch name; and
- exact head SHA.

At this gate, those observed values are compared only with the immutable packet
worktree binding. The worker must reject `main`, a detached or missing branch,
another clone of the same repository, another registered worktree, a wrong
absolute path, a wrong branch, or an exact-head mismatch. Any missing,
ambiguous, or mismatched checkout-to-packet value returns `WORKTREE_INVALID`;
`proposal` remains `null` and `executed_writes` remains empty. Matching only the
head SHA is insufficient.

Approval evidence is not used to classify a checkout as valid or invalid.
Approval-to-packet and approval-to-worktree mismatches are evaluated only in the
subsequent approval gate with approval-specific failure codes.

### 3.4 Approval and expiry binding

SQL/YAML rendering is packet execution by a bounded worker, not a pre-approval
preview. After checkout-to-packet worktree validation passes, the worker must
separately validate affirmative human approval tied to the exact packet digest,
approved worktree identity, and approved head. Failure semantics are:

- no approval object, missing `human_approved`, or `human_approved: false`:
  `APPROVAL_REQUIRED`;
- malformed reviewer, timestamp, disposition, or approval identity syntax:
  `APPROVAL_INVALID`;
- an approval object whose exact-head evidence is missing, invalid, or cannot be
  validated as exact-head approval evidence: `APPROVAL_HEAD_MISMATCH`;
- syntactically valid affirmative approval whose approved worktree identity,
  head, approval digest, or approved packet digest diverges from the current
  packet and proof bindings: `PACKET_APPROVAL_MISMATCH`; and
- missing, malformed, incorrectly bound, or elapsed expiry: `PACKET_EXPIRED`.

Every blocked result has `proposal: null` and `executed_writes: []`.

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
post-retrieval per-record freshness, screening, context, checkout-to-packet
worktree identity, affirmative `human_approved: true` approval, and packet-expiry
validation all pass, emit one stable JSON result containing:

- `status: "proposal_ready"`;
- the exact request and `OFFLINE_FIXTURE` source mode;
- canonical manifest payload and verified `manifest_digest`;
- immutable selected-skill identity and verified digest;
- canonical context records with provenance, `source_updated_at`, observed age,
  and authority state;
- a bounded packet with `humanApprovalRequired: true`;
- resolved repository root, Git common directory, absolute worktree identity,
  non-`main` branch, and exact head, bound first to the immutable packet and then
  separately verified against approval evidence;
- `human_approved: true`, reviewer identity, disposition, approval digest,
  expiry, and deterministic execution check time;
- the verified selected field, downstream relation or model, glossary meaning,
  and quality assertion;
- deterministic SQL and matching dbt schema-test YAML proposal shapes; and
- proof for manifest digest, budgets, fixture, skill, freshness stage, worktree
  packet binding, approval binding, expiry, packet, context, commands, tests,
  changed paths, warnings, and `executed_writes: []`.

Stable inputs must produce stable key, record, array, and serialization order.
A successful result remains a proposal and does not authorize implementation,
deployment, production migration, or merge.

### 5.2 Fail-closed output

Emit a stable blocked result instead of guessed SQL/YAML when any source mode,
manifest digest, budget, manifest field, immutable skill, post-retrieval
freshness, screening, checkout-to-packet worktree identity, affirmative approval,
expiry, authority, command, or safety-critical `UNKNOWN` gate fails. The exact
applicable failure code includes:

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
   worktree identity, non-`main` branch, and exact-head validation; separate
   affirmative approval-to-packet/worktree/head validation; and packet expiry.
4. `src/showcase-ecommerce/proposal.ts` — deterministic SQL/YAML rendering only
   after all gates pass, otherwise a blocked result.
5. `src/showcase-ecommerce/proof.ts` — canonical manifest-digest, budget, fixture,
   skill, freshness-stage, worktree packet binding, approval binding, expiry,
   packet, context, and digest evidence.
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
   and over-age post-retrieval source timestamps; wrong repository root; wrong
   Git common directory; wrong worktree path or identity; `main`; detached or
   wrong branch; checkout-to-packet head mismatch; absent approval, missing
   `human_approved`, and `human_approved: false` returning `APPROVAL_REQUIRED`;
   malformed approval; missing or invalid exact-head approval evidence returning
   `APPROVAL_HEAD_MISMATCH`; valid affirmative approval worktree/head or digest
   drift returning `PACKET_APPROVAL_MISMATCH`; missing, malformed, incorrectly
   bound, and elapsed expiry; authority conflict; UNKNOWN; invalid source mode;
   and forbidden operations.
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
  owner, lane status, allowed path, base SHA, head SHA, and trusted authority;
- exact changed-path output, Gatekeeper result, and `git diff --check`;
- package command results and exit codes;
- non-empty artifact byte count;
- canonical manifest verification and `DIGEST_INVALID`; deterministic budget
  validation and `BUDGET_EXCEEDED`; manifest ordering; immutable-skill gate;
  manifest-level pre-retrieval freshness inputs; post-retrieval per-record
  freshness validation; checkout-to-packet worktree validation; separate
  affirmative approval binding; approval-before-render; packet expiry; authority
  behavior; and output contracts reviewed;
- deterministic blocked evidence for missing, malformed, and mismatched manifest
  digest; every budget class; wrong repository root, common directory, worktree,
  `main`, wrong or detached branch, and checkout-to-packet head mismatch;
- separate deterministic blocked evidence for absent approval, missing or false
  `human_approved`, malformed approval, missing or invalid exact-head approval
  evidence, valid affirmative approval worktree/head drift, and
  approval/packet digest divergence using the corresponding approval-specific
  codes;
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
- exact source, context, packet, approval, expiry, and proof digests;
- canonical repository root, Git common directory, absolute registered worktree
  identity, a non-`main` approved branch, and exact head validated against the
  immutable packet before approval;
- affirmative `human_approved: true` approval separately bound to reviewer,
  disposition, packet digest, approved worktree identity, and approved head,
  with shared approval-specific failure-code semantics;
- timezone-aware unelapsed packet expiry;
- no DataHub or MG MCP writes, production migration, or deployment;
- deterministic success and blocked outputs;
- independent review of code, fixture provenance, skill supply chain, privacy,
  manifest integrity, budgets, freshness stage, worktree packet binding,
  approval binding, expiry, and proof; and
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
   post-retrieval freshness stages, checkout-to-packet worktree identity,
   separate affirmative approval binding, approval-before-render, expiry,
   authority, outputs, future paths, validation, proof, blocked scope,
   implementation proposal, and stop condition are explicit;
3. unverified datapack, live DataHub, skill, tool, and executable values remain
   `UNKNOWN` and block safety-critical paths;
4. read-only, fixture-first, manifest-integrity, bounded retrieval,
   pre-retrieval supply-chain, post-retrieval freshness, non-`main` worktree,
   affirmative human approval, expiry, and no-write boundaries are preserved;
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
