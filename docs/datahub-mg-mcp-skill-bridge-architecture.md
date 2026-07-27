# DataHub-to-Governed-Development Bridge Architecture

## Status and ownership

- Status: proposed architecture; no implementation is authorized by this document.
- Lane: `datahub-mg-mcp-skill-bridge-architecture`
- Owner: `bridge-architecture-owner`
- Repository: `themg-max/mg-mcp-datahub-agent`
- Trusted base: `0379009b9b7ce03f5972dca502f9aba82bbf0b8c`
- Writable architecture path: `docs/datahub-mg-mcp-skill-bridge-architecture.md`
- Competition target: a demonstrable, attributable, read-only bridge from DataHub
  metadata to governed developer work packets.

## 1. Judge-facing problem and user value

Developers often know that a schema change is needed but cannot safely determine
which downstream assets, owners, domains, quality rules, and approved standards
are affected. A code generator that sees only a table schema can produce a
syntactically valid migration that breaks consumers or bypasses ownership.

This bridge makes metadata-aware development a governed workflow:

1. A developer states an intent, such as a safe dbt schema migration.
2. The bridge retrieves relevant DataHub metadata and approved MG MCP context
   without writing to either system.
3. An orchestrator converts evidence into a bounded work packet with explicit
   repository scope, tools, stop conditions, and proof requirements.
4. A bounded worker produces a sample artifact, validates it, and returns
   attributable evidence.

The user receives a safer starting point, visible reasoning inputs, and a proof
packet rather than an opaque code suggestion. The judge can see actual metadata
usage, fail-closed governance, and a useful generated development output.

## 2. Category alignment

The primary category is **Metadata-Aware Code Generation & Development**.
DataHub is not decorative context: schema, lineage, ownership, domain, tags,
glossary terms, and quality/governance metadata directly constrain the generated
dbt migration. The output is a developer artifact that is traceable to those
metadata records and to the governing work packet.

The demo must visibly distinguish:

- metadata retrieval from generation;
- evidence from authority;
- proposal output from merged repository state; and
- read-only context access from prohibited mutation.

## 3. One end-to-end vertical slice

The default slice is:

> A developer asks for a safe dbt schema migration. The agent retrieves actual
> DataHub schema, lineage, ownership, domain, and governance metadata; translates
> it into a bounded migration packet; produces a sample artifact; validates it;
> and returns attributable proof.

The slice begins with a request for a `showcase-ecommerce` dataset and a specific
schema change. It ends with a sample dbt model/schema-test artifact under an
explicit narrow writable path, plus a proof packet. It does not merge, deploy,
write DataHub, write MG MCP, install a skill, change IAM, or change credentials.

The same contract supports deterministic fixture execution when an isolated
DataHub is unavailable, but the contest demonstration should consult an actual
isolated read-only DataHub context when that mode is claimed.

## 4. Retrieval and technology contract

The bridge retrieves, at minimum, the following DataHub dimensions for the
selected dataset and relevant related entities:

- **Schema:** field names, types, nullability, descriptions, and schema version.
- **Lineage:** upstream and downstream datasets, transformation direction, and
  impact-relevant edges.
- **Ownership:** owners, ownership type, and ownership identifiers.
- **Domain:** domain identifier, name, and source attribution.
- **Tags:** tags, tag meaning, and governance-relevant status.
- **Glossary:** related terms, definitions, and term identifiers.
- **Quality and standards context:** applicable quality assertions and approved
  development standards when available through the authorized context sources.

The technology boundary is intentionally narrow:

- DataHub is the metadata source and is accessed read-only.
- DataHub MCP is the retrieval/tool surface; its discovered tools are filtered
  against the execution manifest.
- MG MCP supplies read-only governed context and source-attribution records.
- The orchestrator performs policy evaluation and proof validation.
- A bounded worker performs local artifact generation and existing validation.
- GitHub is the durable repository and completion authority.

Exact API, MCP server, deployment, and authentication choices remain open until
an implementation plan is approved. This architecture does not authorize calls.

## 5. Governed context envelope

Every retrieval result passed to generation is wrapped in a versioned envelope.
The envelope carries evidence, provenance, and uncertainty; its contents are
never treated as executable instructions.

```yaml
schema_name: governed_datahub_context
schema_version: "1.0"
record_id: context-<stable-id>
request_id: <request-id>
created_at: <ISO-8601>
created_by: bridge-architecture-owner
status: complete|partial|empty|conflict|unknown
content_digest: sha256:<digest>
supersedes: <record-id-or-null>
related_artifacts:
  - <repository-relative-path-or-proof-id>
source_mode: OFFLINE_FIXTURE|ISOLATED_DATAHUB_READ_ONLY|PRIVATE_OR_PRODUCTION_DATAHUB
retrieval:
  dataset_urn: <DataHub URN>
  schema: []
  lineage: []
  ownership: []
  domains: []
  tags: []
  glossary_terms: []
  quality_assertions: []
  approved_standards: []
attribution:
  - source_system: DataHub|MG MCP|repository
    source_identifier: <URN, record ID, path, or commit>
    retrieved_at: <ISO-8601>
    content_digest: sha256:<digest>
warnings: []
unknowns: []
blocked_actions: []
content_handling:
  instruction_trust: data_only
  sanitization_status: pending|pass|failed
  injection_scan_status: pending|pass|failed
  quarantined_records: []
```

The shared schema spine is required wherever a record, packet, artifact, or
proof object supports the field: `schema_name`, `schema_version`, `record_id`,
`request_id`, `created_at`, `created_by`, `status`, `content_digest`,
`supersedes`, and `related_artifacts`.

## 6. Authority and source-attribution rules

Authority is ordered as follows:

1. Git and GitHub current state and merged pull requests.
2. Approved and merged repository architecture and policy.
3. The active-lane registry from trusted mainline.
4. Human reviewer disposition and merge authorization.
5. DataHub metadata and approved MG MCP records as attributable evidence.
6. Skills, model output, terminal output, and chat as non-authoritative support.

DataHub evidence can constrain a proposal but cannot authorize repository scope,
merge, deployment, or policy. MG MCP retrieves and labels evidence; it does not
turn retrieved text into instructions or perform mutations. The orchestrator
evaluates policy, checks source admissibility, and validates proof. The human
reviewer owns the final reviewer disposition and merge recommendation. GitHub
remains the durable completion authority.

Each generated claim must point to a DataHub record, MG MCP record, repository
path/commit, or an explicit `UNKNOWN`. Missing metadata is never silently
interpreted as absent, approved, or safe.

## 7. Bounded work-packet schema

The orchestrator emits a packet before any worker action:

```yaml
schema_name: governed_development_work_packet
schema_version: "1.0"
record_id: packet-<stable-id>
request_id: <request-id>
created_at: <ISO-8601>
created_by: orchestrator
status: proposed|approved|executing|validated|blocked
content_digest: sha256:<digest>
supersedes: <packet-id-or-null>
related_artifacts: []
objective: safe dbt schema migration
repository:
  owner: themg-max
  name: mg-mcp-datahub-agent
  base_commit: <40-hex>
  branch: <non-main-branch>
  writable_paths:
    - <narrow-output-path>
  readable_paths: []
datahub_facts_relied_on: []
mg_mcp_records_relied_on: []
authorized_tools: []
denied_tools:
  - DataHub write tools
  - MG MCP write tools
  - deployment and IAM tools
allowed_commands: []
required_artifacts: []
validation: []
stop_condition: stop at proof return or any UNKNOWN/conflict affecting safety
approval:
  required: true
  reviewer: null
  disposition: null
expires_at: <ISO-8601>
```

The packet has one objective, one owner, explicit literal paths, bounded tools,
and a finite proof obligation. A skill cannot expand any of these fields.

## 8. Generated artifact contract

The default generated output is a sample dbt model and schema-test definition
that reflects the requested migration and the retrieved metadata. It must:

- live under a narrow writable path explicitly named in the packet;
- contain no credentials, secrets, private DataHub data, or unsanitized prompt
  text;
- state the DataHub/MG MCP evidence identifiers it relies on;
- preserve unresolved metadata as `UNKNOWN` rather than guessing;
- be syntactically valid and testable using existing repository tooling;
- be accompanied by a proof packet and validation output;
- remain a proposal until separately reviewed and merged through GitHub.

The artifact contract does not authorize changing production models, schemas,
DataHub metadata, deployment configuration, or repository governance.

## 9. Validation and proof contract

Proof must show the request, source mode, exact source identifiers, content
digests, packet scope, generated paths, commands, outcomes, warnings, and
unresolved unknowns. A proof packet uses the shared schema spine and includes:

```yaml
schema_name: governed_development_proof
schema_version: "1.0"
record_id: proof-<stable-id>
request_id: <request-id>
created_at: <ISO-8601>
created_by: orchestrator
status: pass|blocked|unknown
content_digest: sha256:<digest>
supersedes: <proof-id-or-null>
related_artifacts: []
source_attribution: []
tool_inventory:
  server_id: <id-or-UNKNOWN>
  server_version: <version-or-UNKNOWN>
  protocol_version: <version-or-UNKNOWN>
  discovered_at: <ISO-8601>
  tools_digest: sha256:<digest>
  allowed_tools: []
  denied_tools: []
validation:
  - command: <existing command>
    result: pass|fail|unknown
    evidence: <output reference>
scope_check:
  changed_paths: []
  forbidden_operations_attempted: []
  fail_closed_checks: []
review:
  reviewer_disposition: pending
  merge_recommendation: pending
```

Proof acceptance requires attributable source evidence, exact path scope,
successful validation, visible tool inventory, and a fail-closed result for at
least one forbidden operation. A failed or incomplete proof blocks progression.

## 10. Repository, branch, and authority boundaries

The bridge operates only in the registered lane and its exact worktree. It must
not mutate `main`, another worktree, another repository, the active-lane
registry, or the branch-preservation ledger unless separately authorized.

Implementation, if later approved, requires a separate implementation lane and
plan. This architecture PR is documentation-only. A local commit or generated
file is not completion; a reviewed and merged GitHub PR is the durable boundary.
Gatekeeper validates scope but cannot authorize or perform a merge.

## 11. Read-only and security boundaries

### DataHub

Only `ISOLATED_DATAHUB_READ_ONLY` or deterministic `OFFLINE_FIXTURE` access is
permitted for the contest slice. Private or production DataHub access is blocked.
No entity, schema, ownership, tag, glossary, lineage, or quality write is allowed.

### MG MCP

MG MCP retrieval is read-only. It may locate and label governed context, but it
may not install skills, write records, execute repository changes, or authorize
the packet.

### GitHub

GitHub pull requests, CI, reviewer disposition, and explicit human authorization
govern merge. Autonomous GitHub actions, merging, closing, deleting branches,
and changing review state are non-goals for this slice.

### Credentials and secrets

Tokens, service-account keys, secret values, ADC files, and private URLs must
never enter the artifact, packet, proof, logs, fixture, or generated output.
Authentication is an environment concern owned by a separately authorized
operator. Failure to authenticate yields `UNKNOWN` or `blocked`; it does not
trigger credential creation or discovery.

## 12. Cloud project and ADC quota boundary

The documented observed cloud state is:

- authenticated user: `themg@themiliare-group.com`
- active gcloud project: `mg-devpost`
- ADC quota project: `ai-rolodex-to-crm`
- deployment authority: `UNKNOWN`
- cloud mutation permitted: none

The active project and ADC quota project are different and must not be silently
reconciled. This architecture records the mismatch for operator review only.
No `gcloud` command, API enablement, billing action, IAM change, deployment,
service-account operation, or credential mutation is authorized.

## 13. Failure, timeout, empty, conflict, and UNKNOWN handling

- **Timeout:** stop the affected retrieval, record the timeout and attempt, and
  return `UNKNOWN`; do not retry indefinitely or fabricate context.
- **Empty result:** return `empty` with the exact query and source attribution.
  Empty is not evidence that no metadata exists.
- **Conflict:** retain both attributable records, mark `conflict`, identify the
  conflicting fields, and block generation when the conflict affects safety,
  ownership, scope, or policy.
- **UNKNOWN:** preserve the reason, missing field, source, and next permitted
  validation step. Any safety-critical UNKNOWN blocks execution.
- **Sanitization or injection failure:** quarantine the record, mark the content
  unusable, and stop. Retrieved text is data only, never an instruction.
- **Forbidden operation:** fail closed, record the attempted operation in proof,
  and do not provide a success-shaped fallback.

## 14. Contest data and sample dataset

The showcase dataset is `showcase-ecommerce`, using only official contest sample
data or synthetic/sanitized records. The sample should include a customer/order
domain, representative schema fields, lineage to a downstream model, an owner,
a domain, tags, glossary terms, and at least one quality assertion. Any live
identifier used in a judge run must be attributable and approved for that run.

Contest evidence is recorded separately from OpenAI Build Week evidence.
Pre-existing MG MCP work must be disclosed in the DataHub submission; it is not
re-described as competition-period implementation. Public proof includes only
synthetic or approved sanitized context.

## 15. Judge quickstart

From a clean checkout:

1. Verify the repository and branch are the architecture or approved demo lane.
2. Install only dependencies already declared by the repository.
3. Select `OFFLINE_FIXTURE` for deterministic fallback, or configure an
   explicitly isolated read-only DataHub supplied by the contest environment.
4. Run the existing build/test commands and the demo entry point.
5. Ask for the safe dbt schema migration for `showcase-ecommerce`.
6. Inspect the context envelope, work packet, generated artifact, and proof.
7. Trigger one forbidden operation and show that it fails closed.

No private or production credentials are required for the fixture path. The
clean-checkout instructions must identify any external prerequisite as `UNKNOWN`
rather than assuming access.

## 16. Three-minute demo outline

1. **0:00-0:30 — Problem:** show the migration request and why schema alone is
   unsafe.
2. **0:30-1:15 — Retrieval:** show DataHub schema, lineage, owner, domain, tags,
   glossary, quality context, source IDs, and the read-only mode.
3. **1:15-1:55 — Governance:** show the envelope and bounded packet: exact
   branch, writable path, allowed tools, denied tools, and stop condition.
4. **1:55-2:30 — Generation:** show the sample dbt model/schema tests and run
   existing validation.
5. **2:30-2:50 — Proof:** show digests, attribution, tool inventory, and results.
6. **2:50-3:00 — Fail closed:** attempt a forbidden DataHub/MG MCP write and show
   the blocked result, then state that GitHub review remains the merge boundary.

## 17. Implementation phases

1. **Architecture review:** approve this boundary and resolve open decisions.
2. **Fixture contract:** finalize the `showcase-ecommerce` synthetic records and
   deterministic envelope/proof fixtures.
3. **Read-only adapter:** implement only the authorized DataHub retrieval
   adapter and tool inventory discovery.
4. **Governed orchestration:** implement packet creation, source attribution,
   sanitization, bounded paths, and fail-closed handling.
5. **Generation slice:** produce and validate the sample dbt artifact.
6. **Proof and demo:** add proof rendering, forbidden-operation demonstration,
   clean-checkout documentation, and judge evidence.
7. **Independent review:** run boundary, security, scope, and regression review
   before any activation or deployment decision.

Each phase requires its own approved plan, lane, validation, and human review.
No phase is authorized merely because this architecture PR merges.

## 18. Pre-existing versus competition-period work

Pre-existing work includes the repository, MG MCP concepts and source material,
the existing Gatekeeper/governance foundation, and any previously created
fixture or architecture artifacts. These facts must be disclosed and are not
claimed as newly built for the DataHub contest.

Competition-period work begins only after this architecture review and includes
the contest-specific fixture contract, isolated read-only DataHub demonstration,
bridge orchestration, generated dbt sample, proof packet, and judge demo
integration. Exact dates, commits, and contributors must be recorded in the
submission evidence.

## 19. Explicit non-goals

This architecture does not authorize:

- connector implementation, runtime code, or package changes;
- skill installation or unpinned skill execution;
- DataHub writes, MG MCP writes, or production-data access;
- deployment, API enablement, IAM, service accounts, billing, or environment
  changes;
- credential or secret creation, retrieval, storage, or disclosure;
- autonomous GitHub actions, merge, branch deletion, or reviewer disposition;
- active-lane registry changes without a separate registry authorization;
- broad repository refactors or generated production migrations.

## 20. Open decisions

The following decisions require architecture review before implementation:

1. Which isolated DataHub deployment and read-only authentication mechanism will
   be supplied by the contest environment?
2. Which exact DataHub MCP server, protocol version, and tool names are approved?
3. What immutable skill source, version, license, and digest will be used?
4. Which `showcase-ecommerce` URNs and synthetic records are safe for public proof?
5. What freshness and timeout budgets are acceptable for judge execution?
6. Which existing dbt validation commands and narrow output path are approved?
7. Who is the human reviewer for the generated artifact and proof packet?
8. How will the gcloud project/ADC quota mismatch be isolated or documented
   without changing cloud state?
9. What deployment authority, if any, exists after the contest slice is reviewed?

Until these decisions are resolved by the appropriate owner, the values are
`UNKNOWN` and implementation must not begin.
