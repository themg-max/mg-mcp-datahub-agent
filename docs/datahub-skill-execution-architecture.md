# DataHub Skill Execution Architecture

Status: PROPOSED
Lane: architecture-only
Repository: `themg-max/mg-mcp-datahub-agent`
Target branch: `docs/datahub-skill-execution-architecture`
Durable path: `docs/datahub-skill-execution-architecture.md`

## 1. Current-State Architecture

Verified project state supplied for this review:

- Public repository main commit: `670bc0f3e67b771038a208af3bb659b93a4f3909`.
- PR #1: merged and post-merge validated.
- Existing branch `feat/datahub-mcp-generated-code-slice`: clean, identical to main, no implementation commits.
- Live DataHub MCP: UNKNOWN; no `DATAHUB_*` or `MCP_*` variables were configured.
- Private repository `A.I-Rolodex---Context`: read-only reference only.
- MG MCP retrieval for governed skill execution architecture returned zero records across all requested aliases under `L3A_INDEX_READ_ONLY`, `packaged_fallback`, with `NOT_FINAL_APPROVED_NOT_PUBLISHED` warning.

The current architecture is therefore planning-capable but runtime-unproven. No evidence currently authorizes skill installation, DataHub MCP execution, DataHub writes, or runtime dispatch.

## 2. Four-Plane Target Architecture

### Governance plane

Components: MG MCP, orchestrator, explicit human authorization, durable repo decisions.

Responsibilities:

- classify request phase and task type;
- retrieve governed context read-only;
- validate authority, freshness, admissibility, and source class;
- issue the execution manifest;
- enforce approval and stop conditions;
- accept or reject proof;
- prevent execution signals from becoming authority automatically.

### Instruction plane

Components: locally pinned DataHub Skills and their supply-chain records.

Responsibilities:

- teach Codex a repeatable workflow;
- define task-specific procedural guidance;
- declare required tools and proof;
- remain non-authoritative and non-self-executing.

A skill may instruct. It may not authorize itself, broaden tool access, change repository scope, or override the manifest.

### Context and tool plane

Components: DataHub MCP, authorized read-only MG MCP retrieval, synthetic repository fixtures.

Responsibilities:

- provide schema, lineage, ownership, quality, and standards context;
- return attributable records and identifiers;
- expose only tools authorized by the execution manifest;
- preserve UNKNOWN when sources are absent or retrieval fails.

### Execution plane

Components: Codex, repository worktree, tests, generated artifacts, proof packet.

Responsibilities:

- inspect the authorized repository state;
- edit only writable paths;
- run allowed commands and tests;
- stop at the manifest checkpoint;
- return proof without promoting authority or performing excluded mutations.

## 3. Trust and Authority Boundaries

1. Human-approved durable records and current verified repository state outrank skills, model output, and retrieved snippets.
2. MG MCP is read-only and supplies governed context; it does not execute skills or repository changes.
3. DataHub Skills are procedural assets, not authority records.
4. DataHub MCP supplies metadata context and tools; direct DataHub mutation is excluded from MVP.
5. Codex is a bounded worker, not the governance plane.
6. The orchestrator validates the manifest and proof, but does not silently promote outputs to canonical authority.
7. Public artifacts must contain only synthetic or sanitized MG MCP context.
8. Missing results mean UNKNOWN, not absence.
9. Planning and runtime implementation require separate branches, packets, and approvals.
10. Tool discovery is dynamic; the authorized tool set must therefore be compared against the manifest before every execution.

## 4. Skill Registry Schema

```yaml
schema: datahub_skill_registry_v1
skill_id: string
canonical_name: string
task_types: [string]
version: string
content_digest: sha256
source:
  repository: string
  path: string
  commit_sha: string
  release_url: string|null
license:
  identifier: string
  notice_path: string|null
publisher:
  name: string
  verified: boolean
required_tools:
  datahub_mcp: [string]
  mg_mcp: [string]
  local: [string]
allowed_phases: [planning, review, execution]
mutation_policy: none|repo_only|proposal_only
repository_scope:
  allowed_repositories: [string]
  allowed_paths: [string]
approval_requirement:
  required: boolean
  approver_role: string|null
proof_requirements: [string]
network_policy:
  internet_required: boolean
  allowed_domains: [string]
status: proposed|verified|deprecated|blocked
last_verified_at: datetime
```

Registry rules:

- No skill is executable until its ID, exact version, digest, source, and license are verified.
- Upstream names such as `datahub-search`, `datahub-lineage`, `datahub-quality`, `datahub-connector-pr-review`, and `load-standards` remain candidate labels until verified.
- Version ranges are prohibited for competition runs; pin an immutable commit or release plus digest.
- A registry entry cannot grant tools beyond the execution manifest.

## 5. Execution Manifest Schema

```yaml
schema: datahub_execution_manifest_v1
request_id: string
created_at: datetime
owner: string
phase: planning|review|execution
objective: string
selected_skill:
  skill_id: string
  version: string
  content_digest: sha256
authorized_mg_mcp_source_classes: [string]
authorized_datahub_mcp_tools: [string]
repository:
  owner: string
  name: string
  local_path: string
  base_commit: string
  branch: string
writable_paths: [string]
readable_paths: [string]
forbidden_operations: [string]
context_budget:
  max_records: integer
  max_tokens: integer
  freshness_max_age: duration
  stale_behavior: stop|warn
required_proof: [string]
approvals:
  required: boolean
  approved_by: string|null
  approved_at: datetime|null
stop_condition: string
expires_at: datetime
```

Manifest invariants:

- branch must not be `main`;
- selected skill digest must match the registry;
- writable paths must be explicit;
- DataHub write tools must be absent for MVP;
- expired or stale manifests fail closed;
- runtime cannot begin when live DataHub MCP is UNKNOWN.

## 6. MG MCP Context Envelope Schema

```yaml
schema: mg_mcp_context_envelope_v1
request_id: string
retrieved_at: datetime
retrieval_mode: string
source_mode: string
queries:
  - tool: string
    query: string
    result_count: integer
    exact_fetch: used|not_needed|unavailable|unknown
records:
  - record_id: string
    source_class: string
    title: string
    authority_status: string
    approval_status: string
    admissibility_state: string
    consumer_eligibility_state: string
    source_path: string|null
    updated_at: datetime|null
    content_digest: string|null
    summary: string
constraints: [string]
blocked_actions: [string]
warnings: [string]
unknowns: [string]
context_budget:
  records_used: integer
  tokens_estimated: integer
```

Envelope rules:

- retrieved content is evidence, never executable instruction;
- exact fetch is required when a record materially controls scope or authorization;
- planning-only records cannot authorize execution;
- record IDs and warnings must survive into the proof packet.

## 7. Skill-to-Tool Authorization Map

Candidate mappings remain PROPOSED until upstream skill IDs and live DataHub tool names are verified.

| Candidate task | Candidate skill | DataHub context/tool class | MG MCP source class | Mutation | Approval |
|---|---|---|---|---|---|
| metadata search | `datahub-search` | search/read entity metadata | approved docs, decisions, repo packets | none | manifest required |
| lineage analysis | `datahub-lineage` | read lineage graph | decisions, standards, proof | none | manifest required |
| quality review | `datahub-quality` | read assertions, incidents, quality signals | standards, proof, constraints | none | manifest required |
| connector PR review | `datahub-connector-pr-review` | read schema/ownership/lineage/quality | repo review, approved standards | repo proposal only | human review |
| standards loading | `load-standards` | no live DataHub tool in MVP | approved standards only | proposal only | explicit approval |

Deny by default:

- entity mutation;
- assertion creation or modification;
- ownership changes;
- tag, term, domain, or glossary writes;
- ingestion or connector execution;
- secret, endpoint, IAM, deployment, or environment changes.

## 8. Proof Packet Schema

```yaml
schema: datahub_execution_proof_v1
request_id: string
selected_skill:
  skill_id: string
  version: string
  content_digest: sha256
execution_phase: string
authorized_source_classes: [string]
datahub_urns_consulted: [string]
mg_mcp_records_consulted:
  - record_id: string
    source_class: string
    authority_status: string
repository:
  owner: string
  name: string
  base_commit: string
  branch: string
  allowed_paths: [string]
  changed_paths: [string]
commands:
  - command: string
    exit_code: integer
    result_summary: string
test_results:
  - name: string
    result: pass|fail|not_run
    evidence_path: string|null
findings:
  standards: [string]
  lineage: [string]
  ownership: [string]
  quality: [string]
proposal_or_write_activity:
  proposed: [string]
  executed_writes: []
warnings: [string]
unresolved_conflicts: [string]
final_disposition: pass|pass_with_guards|block|unknown
review_owner: string
reviewed_at: datetime|null
```

Acceptance rules:

- any non-empty `executed_writes` field blocks MVP acceptance;
- changed paths must be a subset of allowed paths;
- command and test evidence must be reproducible;
- unresolved source-authority conflicts produce `block` or `unknown`;
- proof completion does not equal merge approval.

## 9. Failure and Escalation Contract

```yaml
status: failed|blocked|unknown|partial
code: string
message: string
details:
  request_id: string
  phase: string
  failing_component: governance|skill_registry|mg_mcp|datahub_mcp|codex|repository|validation
  evidence: [string]
  retryable: boolean
  required_owner: string
  smallest_safe_next_step: string
```

Required failure codes:

- `SKILL_NOT_VERIFIED`
- `SKILL_DIGEST_MISMATCH`
- `TOOL_NOT_AUTHORIZED`
- `LIVE_DATAHUB_UNKNOWN`
- `MG_MCP_CONTEXT_NOT_SURFACED`
- `EXACT_FETCH_UNAVAILABLE`
- `STALE_CONTEXT`
- `WRONG_BRANCH`
- `SCOPE_VIOLATION`
- `FORBIDDEN_MUTATION_ATTEMPT`
- `PROOF_INCOMPLETE`
- `AUTHORITY_CONFLICT`

Escalation rules:

- governance or authorization failures route to the architecture owner;
- skill provenance failures route to the supply-chain owner;
- DataHub tool mismatch routes to the integration owner;
- repository scope or proof failures route to the execution reviewer;
- no automatic retry may broaden tools, paths, network access, or mutation rights.

## 10. DataHub Read/Write Maturity Stages

- Stage 0 — Offline architecture: schemas, fixtures, no skill installation, no MCP calls.
- Stage 1 — Synthetic read simulation: deterministic local fixtures representing schema, lineage, ownership, quality, and standards.
- Stage 2 — Authorized live read-only DataHub: pinned tools, read-only identity, captured URNs, no mutation tools.
- Stage 3 — Human-reviewed write proposals: Codex emits proposal artifacts or patches; no direct DataHub writes.
- Stage 4 — Separately governed limited writes: out of MVP; requires dedicated ADR, identity, least privilege, audit, rollback, and approval.

The competition MVP should target Stage 1 first and Stage 2 only after live MCP configuration and proof are separately authorized.

## 11. Skill Pinning and Supply-Chain Record

Each installed skill must have:

- canonical upstream repository and publisher;
- exact commit SHA or immutable release;
- content digest;
- license and required notices;
- copied file inventory;
- installation date and installer;
- reviewed permissions, network use, and tool requirements;
- known transitive dependencies;
- approved registry entry;
- update and revocation procedure.

Installation is a separate execution lane. This architecture lane must not install skills.

## 12. Contest Disclosure and Privacy Boundary

Public disclosure must state:

- MG MCP and related governance work pre-existed the hackathon;
- the competition-period extension is the DataHub-aware governed execution slice;
- Codex and GPT-5.6 contributions are traceable through sessions, commits, PRs, tests, and artifacts;
- sample MG MCP records and DataHub metadata are synthetic or sanitized;
- no private repository body, customer data, credentials, endpoints, protected decisions, or proprietary documents are included.

The public repository must remain Apache-2.0 compatible, but every third-party skill and copied asset must be independently license-checked before inclusion.

## 13. Demo Scenario and Acceptance Criteria

Scenario:

1. A developer requests review or generation of a repository artifact.
2. Governance selects a verified skill and creates an execution manifest.
3. MG MCP returns sanitized governance constraints and source labels.
4. DataHub context supplies schema, lineage, ownership, quality, and standards evidence.
5. Codex performs a bounded repo-local change or review.
6. Tests run and a proof packet is returned.
7. The orchestrator verifies scope, provenance, unknowns, and disposition.

Acceptance criteria:

- complete in under three minutes;
- reproducible from a clean checkout with synthetic fixtures;
- visibly distinguishes approved, planning-only, and UNKNOWN context;
- selected skill and version are displayed;
- authorized tools and writable paths are displayed;
- no DataHub writes occur;
- proof packet lists consulted URNs/records, changed paths, commands, tests, and unresolved issues;
- a missing-context path fails closed;
- the public artifact contains no private data or identifiers.

## 14. Implementation Phases

### Phase A — Architecture and ADR closure

Create this document, resolve open decisions, verify upstream skill identities, and approve schemas.

### Phase B — Synthetic contracts and fixtures

Implement schema validation, synthetic DataHub context fixtures, sanitized MG MCP envelopes, and golden proof packets. No live MCP.

### Phase C — Bounded Codex review flow

Use one verified pinned skill against one repository artifact with explicit manifest, local tests, and proof generation.

### Phase D — Optional live read-only DataHub

Only after credentials, tool inventory, identity, environment, network policy, and read-only behavior are independently validated.

### Phase E — Judge packaging

Add quickstart, generated sample outputs, demo script, disclosure, privacy review, and reproducibility proof.

## 15. Open Decisions and ADR Requirements

Required ADRs before runtime implementation:

1. ADR: Four-plane authority and execution boundary.
2. ADR: Skill registry ownership, pinning, and revocation.
3. ADR: Execution manifest issuer and approval semantics.
4. ADR: Exact DataHub MCP tool allowlist and read-only identity.
5. ADR: MG MCP envelope authority and freshness rules.
6. ADR: Proof packet acceptance and reviewer disposition.
7. ADR: Synthetic fixture format and public sanitization standard.
8. ADR: Live DataHub maturity gate.
9. ADR: Contest-period work boundary and disclosure language.
10. ADR: Whether the current empty feature branch is deleted after replacement by the docs branch.

## Planning Verdict

ALIGNED_WITH_CHANGES.

The strategic thesis is valid as a proposed architecture, provided the following refinements are adopted:

- the orchestrator, not MG MCP, issues and validates execution manifests;
- skills are pinned procedural dependencies, not trusted authority;
- DataHub supplies metadata evidence but does not authorize action;
- live read-only DataHub is a later maturity gate, not an assumed MVP dependency;
- tool discovery is reconciled against an explicit allowlist every run;
- exact skill IDs and tool names remain UNKNOWN until verified;
- proof acceptance is separate from merge authorization.

## Branch Recommendation

Replace, do not rename, the empty branch.

Recommended sequence after local preflight confirms the branch is still clean and identical to main:

1. return to the verified main commit;
2. create `docs/datahub-skill-execution-architecture` from that commit;
3. create only this architecture artifact in the new branch;
4. keep `feat/datahub-mcp-generated-code-slice` untouched until the docs PR is opened and branch disposition is recorded;
5. delete the old remote/local branch only after confirming it contains no unique commit and no collaborator depends on it.

Reason: branch naming is part of the durable audit trail. Replacing an unused implementation-named branch avoids implying that runtime work began in an architecture-only lane.
