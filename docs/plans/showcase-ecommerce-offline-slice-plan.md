# Showcase-ecommerce offline vertical slice plan

## Status, ownership, and authority

- Status: approved planning artifact; this document does not authorize implementation,
  deployment, or any external write.
- Lane: `datahub-showcase-ecommerce-offline-slice-plan`
- Owner: `datahub-offline-slice-planning-owner`
- Repository: `themg-max/mg-mcp-datahub-agent`
- Branch: `plan/datahub-showcase-ecommerce-offline-slice`
- Planning base: `8ada6b3844c3f76f96069a27b8cc4691c5cb91ac`
- Allowed path in this lane: `docs/plans/showcase-ecommerce-offline-slice-plan.md`
- Trusted authority: PR #12 merge commit `8ada6b3844c3f76f96069a27b8cc4691c5cb91ac`

The planning lane is authorized only to define the next deterministic offline
slice. It must not implement the runtime, add fixtures, change tests, change
dependencies, access DataHub, write DataHub or MG MCP, deploy, change IAM, or
merge autonomously.

## 1. Objective and judge value

Demonstrate one narrow, reproducible metadata-aware development flow:

> Given the exact logical dataset `showcase-ecommerce` and scenario
> `safe-customer-email-migration`, load attributable synthetic metadata from a
> committed fixture, build governed context, produce a bounded work packet, and
> emit either a deterministic safe customer-email proposal or a deterministic
> fail-closed result.

The judge-visible value is the causal chain from metadata to a reviewable
proposal:

1. the request, source mode, immutable selected-skill identity, and context
   budget are validated before retrieval;
2. schema, bounded lineage, ownership, domain, tags, glossary, quality, and
   standards evidence are normalized;
3. approved, planning-only, quarantined, and unknown authority states remain
   visible;
4. the packet binds the source, budgets, allowed paths, commands, blocked
   operations, approval requirement, and stop condition;
5. affirmative packet approval is validated before any SQL/YAML rendering;
6. verified metadata constrains the proposed SQL/YAML shape; and
7. proof records the inputs, decisions, validation, scope, and final
   disposition.

The output is a proposal for human review. It is never approval, a production
dbt migration, a DataHub mutation, an MG MCP mutation, a deployment, or merge
authority.

## 2. Current-state reuse

The implementation lane should reuse the existing public reference surfaces
instead of introducing a second governance model:

- `src/cli.ts` already loads a fixture, normalizes records, builds a packet, and
  emits JSON with explicit stderr failure behavior.
- `src/datahub/context-adapter.ts` already normalizes source-neutral records and
  preserves `approved`, `planning_only`, `quarantined`, and `unknown`.
- `src/work-packet.ts` already canonicalizes records, deduplicates provenance,
  derives blocked scope and unknowns, sorts arrays, and requires human approval.
- `fixtures/datahub-context.json` and `fixtures/invalid-datahub-context.json`
  establish the existing fixture-first success and invalid-input conventions.
- `docs/datahub-skill-execution-architecture.md` supplies the four-plane,
  read-only, proof, failure-code, and maturity-boundary model.
- `docs/datahub-mg-mcp-skill-bridge-architecture.md` supplies the non-reorderable
  pre-retrieval manifest, immutable skill-binding, freshness, packet-approval,
  and shared failure-code contracts.
- The five existing `docs/fixtures/showcase-ecommerce/*` artifacts from the
  fixture-contract lane define the scenario vocabulary, metadata dimensions,
  budgets, public-safety rules, and expected blocked behavior. They remain
  planning contracts, not runtime authority.

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

Selection is exact-match and ordered:

1. validate the source mode;
2. create the bounded packet and its embedded `pre_retrieval_manifest`, including
   every context-budget value, fixture/source binding, immutable selected-skill
   fields, and the canonical manifest digest;
3. before reading any fixture record, validate manifest budgets, source binding,
   content digest, deterministic freshness inputs, and immutable selected-skill
   identity;
4. fail with `SKILL_BINDING_FAILED` before retrieval when the selected skill ID,
   source, version, license, or content digest is missing, `UNKNOWN`, changed, or
   does not match the approved registry record;
5. resolve exactly one target dataset;
6. resolve the target schema;
7. resolve at most one downstream lineage path at depth one;
8. resolve ownership;
9. resolve domain, tags, glossary, quality, and approved standards;
10. screen all retrieved text as data only;
11. build canonical context values and bind them back to the validated packet;
12. validate screening bindings and affirmative packet approval, including the
    reviewer identity, approval timestamp, disposition, approval digest, exact
    approved worktree head, and current packet digest; and
13. render the proposal only when approval validation passes, otherwise emit the
    deterministic blocked result.

The offline fixture must be byte-stable, network-free, public-safe, and
deterministically ordered. Local fixture keys are not DataHub entity IDs.
Budgets remain bounded at the contract values: eight entities, lineage depth
one, two lineage edges, sixteen total records, 4,000 estimated tokens, and a
30-second retrieval timeout.

The fixture contract currently records `max_freshness_age: UNKNOWN`; an
implementation must not copy that value into the packet or convert it to an
apparent zero-age success. For `OFFLINE_FIXTURE`, the deterministic freshness
rule is:

- the implementation fixture manifest must provide a concrete ISO 8601
  `max_freshness_age` duration and a committed deterministic `checked_at` value;
- every attributable safety-critical source record must provide
  `source_updated_at`; `retrievedAt` remains retrieval evidence and is not a
  substitute for source-update time;
- observed freshness age is computed exactly as
  `checked_at - source_updated_at` and recorded in context and proof;
- the observed age must be non-negative and less than or equal to the packet's
  `max_freshness_age`; and
- a missing, `UNKNOWN`, malformed, future-dated, or over-age source timestamp, or
  a missing/invalid freshness duration, fails closed with
  `FRESHNESS_EXCEEDED` before proposal rendering.

Pinning `checked_at` in the committed fixture makes the test reproducible while
still measuring freshness from the attributable source-update time. It does not
assert a live DataHub freshness fact. Any future wall-clock freshness budget
belongs to a separately approved isolated read-only lane.

The packet's `selected_skill` binding must contain an immutable skill ID,
canonical source, exact version, license, and content digest. The current
planning artifacts do not verify an executable skill identity; therefore the
future implementation success path remains blocked with `SKILL_BINDING_FAILED`
until a separately reviewed registry record supplies and validates every field.
No local label or model-selected skill name may satisfy this gate.

The intended safe change is a proposal mapping a verified customer-email source
field into one verified downstream dbt model. The proposal may contain only
values attributable to the fixture or an approved isolated read-only source;
symbolic placeholders are not executable identifiers.

Rendering the SQL/YAML proposal is packet execution by the bounded worker, not a
pre-approval preview. Before rendering, the worker must validate affirmative
human approval tied to the exact packet digest and approved worktree head. An
absent approval returns `APPROVAL_REQUIRED`; invalid reviewer, timestamp, or
disposition evidence returns `APPROVAL_INVALID`; an approved-head mismatch
returns `APPROVAL_HEAD_MISMATCH`; and approval/packet digest divergence returns
`PACKET_APPROVAL_MISMATCH`. In every blocked case, `proposal` remains `null` and
`executed_writes` remains empty.

## 4. Authority-state behavior

Authority is evidence metadata, not a model judgment:

| State | Permitted use | Required behavior |
| --- | --- | --- |
| `approved` | Constrain the proposal when provenance and freshness validate | Preserve source reference and validate it against the packet scope |
| `planning_only` | Describe intended scope and contracts | Never authorize implementation, deployment, DataHub writes, or merge |
| `quarantined` | No decision use | Exclude from authority decisions and retain the quarantine reason in proof |
| `unknown` | Preserve as unresolved evidence | Never infer a value; block when safety-critical and record the next permitted read-only check |

The repository-approved authority for this planning lane is the trusted
PR #12 merge commit and the lane registry's `APPROVED` entry. The fixture
contract and this document are planning-only. Proposed or draft architecture,
skill, datapack, live connection, and tool identities cannot authorize runtime.
Missing retrieval is `UNKNOWN`, not proof of absence. Conflicting attributable
records block the affected proposal.

## 5. Deterministic output contracts

### 5.1 Success output

Only after immutable skill binding, manifest validation, freshness validation,
screening, context binding, and affirmative packet approval all pass, emit one
stable JSON result containing:

- `status: "proposal_ready"`;
- the exact request and `OFFLINE_FIXTURE` source mode;
- the immutable selected-skill identity and verified digest;
- canonical context records with provenance, `source_updated_at`, observed age,
  and authority state;
- a bounded work packet with `humanApprovalRequired: true` and approval
  validation bound to the exact packet digest and approved worktree head;
- the selected field, downstream relation/model, glossary meaning, and quality
  assertion;
- the proposal shape:

  ```sql
  select
    <verified_customer_email_field> as customer_email
  from <verified_downstream_relation>
  ```

  and the matching dbt schema-test YAML shape; and
- proof fields for fixture digest, skill binding, packet/context/approval
  bindings, freshness calculation, commands, tests, changed paths, warnings,
  and `executed_writes: []`.

The JSON key order, record order, array order, and serialization formatting must
be stable for identical request, approval, and fixture bytes. A successful
result remains a proposal and does not authorize merge, deployment, or a
production dbt migration. Final review and merge authorization remain separate
human decisions.

### 5.2 Deterministic fail-closed output

If a source mode is blocked, immutable skill binding fails, a budget is
exceeded, freshness evidence is missing or over age, screening fails, packet
approval is absent or invalid, a required record conflicts, a tool or command is
unauthorized, or any safety-critical field is `UNKNOWN`, emit a stable blocked
result rather than guessed SQL/YAML:

- `status: "blocked"`;
- the exact applicable stable failure code, including
  `SKILL_BINDING_FAILED`, `FRESHNESS_EXCEEDED`, `APPROVAL_REQUIRED`,
  `APPROVAL_INVALID`, `APPROVAL_HEAD_MISMATCH`,
  `PACKET_APPROVAL_MISMATCH`, `SOURCE_MODE_BLOCKED`,
  `AUTHORITY_CONFLICT`, `RETRIEVAL_EVIDENCE_INVALID`,
  `FORBIDDEN_OPERATION_ATTEMPTED`, `SCOPE_VIOLATION`, or
  `PROOF_INCOMPLETE`;
- the exact request, source mode, context/packet identifiers, and attributable
  evidence available;
- ordered blocking unknowns or conflicts, with each field, reason, source,
  blocking state, and next permitted read-only check;
- `proposal: null` (no guessed SQL or YAML);
- `executed_writes: []`; and
- the stop condition and required owner/reviewer.

An invalid fixture or runtime error must retain the existing CLI convention:
nonzero exit status and a plain error on stderr, with no success-shaped
fallback and no leaked response body or secret.

## 6. Proposed future implementation paths

These are proposals for a separately registered and approved implementation
lane; they are not writable in this planning lane:

1. `src/showcase-ecommerce/scenario.ts` — exact scenario selection, source-mode
   policy, immutable selected-skill validation, budget/freshness checks,
   authority handling, and failure codes.
2. `src/showcase-ecommerce/context.ts` — fixture/read-only context loading,
   required metadata dimensions, attribution, `source_updated_at`, sanitization,
   and UNKNOWN records.
3. `src/showcase-ecommerce/approval.ts` — screening-to-packet binding and
   affirmative approval validation against reviewer identity, disposition,
   approval digest, packet digest, and exact approved worktree head.
4. `src/showcase-ecommerce/proposal.ts` — deterministic SQL/YAML rendering only
   after approval validation, or a blocked result with no executable
   substitution from unknown values.
5. `src/showcase-ecommerce/proof.ts` — canonical skill, freshness, approval,
   packet, context, and digest bindings, including the symbolic
   forbidden-operation check.
6. `src/cli.ts` — an explicitly selected showcase-ecommerce command path that
   reuses the existing adapter and packet builder without changing generic demo
   behavior.
7. `fixtures/showcase-ecommerce/context.json` and
   `fixtures/showcase-ecommerce/expected-output.json` — only after fixture
   provenance, license, concrete freshness inputs, immutable skill record,
   sanitization, and a new implementation-lane allowlist are approved.
8. `tests/showcase-ecommerce/*.test.ts` — deterministic success; missing or
   changed skill fields; missing, malformed, future, and over-age
   `source_updated_at`; missing/invalid approval and head/digest mismatch; each
   blocking authority state; UNKNOWN propagation; conflict; budget; invalid
   source mode; and forbidden-operation cases.
9. `examples/showcase-ecommerce/` — judge-facing output and proof only after
   the implementation and test lane is approved.

The implementation lane must not add a live DataHub dependency. An optional
`ISOLATED_DATAHUB_READ_ONLY` path can be considered only after connection,
identity, tool inventory, endpoint digest, freshness, and read-only behavior
are separately approved and captured. No write tool is part of this slice.

## 7. Exact validation and proof evidence

The planning PR must run these commands from the repository root:

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

The exact one-file proof must include:

- repository, branch, worktree, owner, lane status, allowed path, base SHA,
  head SHA, and trusted authority SHA;
- the exact changed-path output and `git diff --check` result;
- the Gatekeeper mutation result;
- the four required package command results and their exit codes;
- the planning artifact path and non-empty byte count;
- the fixture-first scenario, immutable skill-binding gate, source-update-based
  freshness rule, approval-before-render rule, authority-state rules, success
  contract, and fail-closed contract reviewed;
- confirmation that no hooks, runtime source, fixtures, tests, examples,
  dependencies, workflows, deployment, IAM, credentials, DataHub, or MG MCP
  writes changed; and
- PR URL/number, exact-head CI result, Codex review request, reviewer
  disposition, and unresolved items.

Proof is evidence of validation, not merge authority. The implementation lane
must add its own deterministic demo output and blocked-path proof artifacts
under its separately approved paths.

## 8. Implementation-lane proposal

After this planning PR is independently reviewed and merged, open one
implementation lane with owner, worktree, base commit, and an explicit allowlist
covering only the proposed `src/showcase-ecommerce/`, selected existing
integration files, showcase fixture/output files, showcase tests, and judge
example files. The packet must require:

- `OFFLINE_FIXTURE` as the default and first executable mode;
- no network, credentials, private or production metadata;
- an immutable selected skill ID, canonical source, exact version, license, and
  content digest validated before fixture retrieval;
- a concrete fixture `max_freshness_age`, deterministic `checked_at`, and
  attributable `source_updated_at` values with age calculated as
  `checked_at - source_updated_at`;
- exact source, context, packet, approval, and proof digests;
- `humanApprovalRequired: true`, with affirmative approval validated before
  proposal rendering against reviewer identity, disposition, packet digest,
  and exact approved worktree head;
- no DataHub or MG MCP write tools;
- no production dbt migration or deployment;
- deterministic success and blocked outputs;
- an independent reviewer for code, fixture provenance, skill supply chain,
  privacy, approval evidence, and proof; and
- a stop at proof return or any safety-critical UNKNOWN, conflict, freshness,
  skill-binding, or approval failure.

The optional isolated read-only mode is a later, separately approved increment,
not a reason to delay or weaken the offline proof.

## 9. Blocked scope

This planning lane explicitly blocks:

- `src/**`, `tests/**`, `fixtures/**`, and `examples/**`;
- `.githooks/**`, Gatekeeper skill files, and Gatekeeper script changes;
- package, lockfile, dependency, and workflow changes;
- live DataHub access, credentials, private endpoints, and production metadata;
- DataHub writes, MG MCP writes, deployment, IAM, billing, or environment
  changes;
- production dbt changes, autonomous PR merge, and authority promotion.

The missing `.githooks/pre-commit` and `.githooks/post-checkout` files are
outside this lane and are not created or normalized here. Hook-policy
normalization is deferred to a separate governance lane.

## 10. Definition of done

This planning lane is done when:

1. this artifact is non-empty, reviewable, and changed as the only path;
2. the objective, judge value, reuse map, canonical scenario, immutable
   skill-binding gate, source-update-based freshness rule,
   approval-before-render rule, authority rules, output contracts,
   implementation paths, validation, proof, blocked scope,
   implementation-lane proposal, and stop condition are explicit;
3. all unverified datapack, live DataHub, skill, tool, and executable entity
   values remain `UNKNOWN` rather than invented, and any safety-critical UNKNOWN
   blocks the affected path;
4. the plan preserves the existing read-only, fixture-first, pre-retrieval
   supply-chain validation, human-approval, and no-write boundaries;
5. `check_lane_state.sh mutation`, non-empty, containment, diff, typecheck,
   test, and demo validation pass;
6. the commit is pushed and a one-file planning PR is opened;
7. exact-head CI passes and Codex review is requested; and
8. the proof return is captured without merging or beginning implementation.

## 11. Stop condition

Stop after the planning PR is opened, exact-head CI passes, Codex review is
requested, and the proof return is captured. Do not merge, begin runtime
implementation, add fixtures or tests in this lane, access live or private
DataHub, write DataHub or MG MCP, change dependencies or workflows, deploy,
change IAM or credentials, or normalize hooks here.
