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

1. the request and source mode are validated;
2. schema, bounded lineage, ownership, domain, tags, glossary, quality, and
   standards evidence are normalized;
3. approved, planning-only, quarantined, and unknown authority states remain
   visible;
4. the packet binds the source, budgets, allowed paths, commands, blocked
   operations, approval requirement, and stop condition;
5. verified metadata constrains the proposed SQL/YAML shape; and
6. proof records the inputs, decisions, validation, scope, and final
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
2. validate the pre-retrieval manifest and content digest;
3. resolve exactly one target dataset;
4. resolve the target schema;
5. resolve at most one downstream lineage path at depth one;
6. resolve ownership;
7. resolve domain, tags, glossary, quality, and approved standards;
8. screen all retrieved text as data only;
9. build canonical context and packet values; and
10. render the proposal or blocked result.

The offline fixture must be byte-stable, network-free, public-safe, and
deterministically ordered. Local fixture keys are not DataHub entity IDs.
Budgets remain bounded at the contract values: eight entities, lineage depth
one, two lineage edges, sixteen total records, 4,000 estimated tokens, and a
30-second retrieval timeout. A fixture expectation is not a live DataHub fact.

The intended safe change is a proposal mapping a verified customer-email source
field into one verified downstream dbt model. The proposal may contain only
values attributable to the fixture or an approved isolated read-only source;
symbolic placeholders are not executable identifiers.

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

When every safety-critical value is attributable, sanitized, within budget, and
consistent, emit one stable JSON result containing:

- `status: "proposal_ready"`;
- the exact request and `OFFLINE_FIXTURE` source mode;
- canonical context records with provenance and authority state;
- a bounded work packet with `humanApprovalRequired: true`;
- the selected field, downstream relation/model, glossary meaning, and quality
  assertion;
- the proposal shape:

  ```sql
  select
    <verified_customer_email_field> as customer_email
  from <verified_downstream_relation>
  ```

  and the matching dbt schema-test YAML shape; and
- proof fields for fixture digest, packet/context bindings, commands, tests,
  changed paths, warnings, and `executed_writes: []`.

The JSON key order, record order, array order, and serialization formatting must
be stable for identical request and fixture bytes. A successful result remains a
proposal and requires human review.

### 5.2 Deterministic fail-closed output

If a source mode is blocked, a budget is exceeded, screening fails, a required
record conflicts, a tool or command is unauthorized, or any safety-critical
field is `UNKNOWN`, emit a stable blocked result rather than guessed SQL/YAML:

- `status: "blocked"`;
- a stable failure code such as `SOURCE_MODE_BLOCKED`,
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
   policy, budget checks, authority handling, and failure codes.
2. `src/showcase-ecommerce/context.ts` — fixture/read-only context loading,
   required metadata dimensions, attribution, sanitization, and UNKNOWN
   records.
3. `src/showcase-ecommerce/proposal.ts` — deterministic SQL/YAML or blocked
   rendering with no executable substitution from unknown values.
4. `src/showcase-ecommerce/proof.ts` — canonical proof and digest bindings,
   including the symbolic forbidden-operation check.
5. `src/cli.ts` — an explicitly selected showcase-ecommerce command path that
   reuses the existing adapter and packet builder without changing generic demo
   behavior.
6. `fixtures/showcase-ecommerce/context.json` and
   `fixtures/showcase-ecommerce/expected-output.json` — only after fixture
   provenance, license, sanitization, and a new implementation-lane allowlist
   are approved.
7. `tests/showcase-ecommerce/*.test.ts` — deterministic success, each blocking
   authority state, UNKNOWN propagation, conflict, budget, invalid source mode,
   and forbidden-operation cases.
8. `examples/showcase-ecommerce/` — judge-facing output and proof only after
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
- the fixture-first scenario, authority-state rules, success contract, and
  fail-closed contract reviewed;
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
- exact source, context, packet, and proof digests;
- `humanApprovalRequired: true`;
- no DataHub or MG MCP write tools;
- no production dbt migration or deployment;
- deterministic success and blocked outputs;
- an independent reviewer for code, fixture provenance, privacy, and proof; and
- a stop at proof return or any safety-critical UNKNOWN or conflict.

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
2. the objective, judge value, reuse map, canonical scenario, authority rules,
   output contracts, implementation paths, validation, proof, blocked scope,
   implementation-lane proposal, and stop condition are explicit;
3. all unverified datapack, live DataHub, skill, tool, and executable entity
   values remain `UNKNOWN` rather than invented;
4. the plan preserves the existing read-only, fixture-first, human-approval,
   and no-write boundaries;
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