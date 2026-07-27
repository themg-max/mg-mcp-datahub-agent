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

### Retrieval workflow and pre-retrieval manifest

Retrieval follows this order and may not be reordered:

The manifest is the pre-retrieval control point. It must contain the complete
context budget before step 2 and before any DataHub query, and its canonical
`manifest_digest` is computed after omitting `manifest_digest` itself.

1. create the bounded packet and its `pre_retrieval_manifest`;
2. validate manifest budgets, source mode, DataHub connection binding, and
   immutable selected-skill identity;
3. begin retrieval only after manifest validation passes;
4. screen and sanitize retrieved content;
5. obtain the required human approval and execute only the approved packet; and
6. produce proof containing the manifest, connection, skill, and execution
   evidence.

A retrieval attempt before
manifest validation fails closed with `BUDGET_EXCEEDED`,
`CONNECTION_MISMATCH`, or `SKILL_BINDING_FAILED` as applicable.

For `ISOLATED_DATAHUB_READ_ONLY`, the observed server ID, environment ID,
endpoint digest, principal identity, and access mode must equal the approved
values in the manifest. Any mismatch blocks retrieval and proof with
`CONNECTION_MISMATCH`; private or production mode is never an acceptable
fallback.

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
authority_status: authoritative|proposed|unverified|conflict|unknown
execution_status: not_started|blocked|approved|executing|validated|failed
retrieval_status: not_started|retrieving|complete|partial|empty|timeout|failed
failures:
  - code: APPROVAL_REQUIRED|APPROVAL_INVALID|APPROVAL_HEAD_MISMATCH|PACKET_APPROVAL_MISMATCH|BUDGET_EXCEEDED|DIGEST_INVALID|WORKTREE_INVALID|FRESHNESS_EXCEEDED|TOOL_INVENTORY_INVALID|AUTHORITY_CONFLICT|PROOF_INCOMPLETE|PROOF_INVALID|RETRIEVAL_EVIDENCE_INVALID|PACKET_EXPIRED|SCOPE_VIOLATION|FORBIDDEN_OPERATION_ATTEMPTED|UNAUTHORIZED_TOOL|UNAUTHORIZED_COMMAND|SOURCE_MODE_BLOCKED|SCREENING_REQUIRED|SCREENING_FAILED|CONNECTION_MISMATCH|SKILL_BINDING_FAILED
    message: <human-readable-detail>
    blocking: true|false
    source: DataHub|MG MCP|repository|orchestrator|proof
content_digest: sha256:<digest>
supersedes: <record-id-or-null>
related_artifacts:
  - <repository-relative-path-or-proof-id>
source_mode: OFFLINE_FIXTURE|ISOLATED_DATAHUB_READ_ONLY|PRIVATE_OR_PRODUCTION_DATAHUB
source_mode_policy: allowed|blocked
source_record_id: <context-record-id>
source_content_digest: sha256:<64-lowercase-hex>
datahub_connection:
  mode: OFFLINE_FIXTURE|ISOLATED_DATAHUB_READ_ONLY
  fixture:
    record_id: <fixture-record-id>
    content_digest: sha256:<64-lowercase-hex>
  isolated:
    server_id: <approved-server-id>
    environment_id: <approved-environment-id>
    endpoint_digest: sha256:<64-lowercase-hex>
    principal_identity: <approved-principal-identity>
    access_mode: ISOLATED_DATAHUB_READ_ONLY
  validation: pass|fail
retrieval_attempts:
  - attempt_id: retrieval-attempt-<stable-id>
    query: <exact-query>
    source_mode: OFFLINE_FIXTURE|ISOLATED_DATAHUB_READ_ONLY
    started_at: <ISO-8601>
    completed_at: <ISO-8601-or-null>
    outcome: success|partial|empty|timeout|failed
    records_returned: <non-negative-integer>
    content_digest: sha256:<64-lowercase-hex-or-null>
    failure_code: <failure-code-or-null>
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
    source_updated_at: <ISO-8601>
    retrieved_at: <ISO-8601>
    content_digest: sha256:<digest>
warnings: []
unknowns: []
blocked_actions: []
content_handling:
  instruction_trust: data_only
  sanitization_status: pending|pass|failed
  injection_scan_status: pending|pass|failed
  validation: pass|fail
  quarantined_records: []
```

The shared schema spine is required wherever a record, packet, artifact, or
proof object supports the field: `schema_name`, `schema_version`, `record_id`,
`request_id`, `created_at`, `created_by`, `status`, `content_digest`,
`supersedes`, and `related_artifacts`.

`authority_status`, `execution_status`, and `retrieval_status` are separate
dimensions. Retrieval success does not imply authority, authority does not
imply approval to execute, and a validated artifact does not imply merge
completion.

### Canonical digest rule

Every envelope, packet, artifact manifest, and proof object has a canonical
digest generated by serializing the object as RFC 8785 JSON Canonicalization
Scheme (JCS) JSON and hashing the result with SHA-256. For a context or packet,
the digest target is that record with only its `content_digest` field omitted.
For a proof, the digest target is the proof record identified by `record_id`
with both `content_digest` and the entire `digest` evidence object omitted. The
recorded value is lowercase
`sha256:<64-lowercase-hex>`. Implementations must reject non-canonical or
mismatched digests; whitespace, key order, or equivalent JSON formatting must
not change the digest.

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
interpreted as absent, approved, or safe. Freshness is derived as
`checked_at - source_updated_at` for every attributable source record; a
missing `source_updated_at` fails freshness validation when freshness is
required.

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
authority_status: authoritative|proposed|unverified|conflict|unknown
execution_status: not_started|blocked|approved|executing|validated|failed
retrieval_status: not_started|retrieving|complete|partial|empty|timeout|failed
failures:
  - code: APPROVAL_REQUIRED|APPROVAL_INVALID|APPROVAL_HEAD_MISMATCH|PACKET_APPROVAL_MISMATCH|BUDGET_EXCEEDED|DIGEST_INVALID|WORKTREE_INVALID|FRESHNESS_EXCEEDED|TOOL_INVENTORY_INVALID|AUTHORITY_CONFLICT|PROOF_INCOMPLETE|PROOF_INVALID|RETRIEVAL_EVIDENCE_INVALID|PACKET_EXPIRED|SCOPE_VIOLATION|FORBIDDEN_OPERATION_ATTEMPTED|UNAUTHORIZED_TOOL|UNAUTHORIZED_COMMAND|SOURCE_MODE_BLOCKED|SCREENING_REQUIRED|SCREENING_FAILED|CONNECTION_MISMATCH|SKILL_BINDING_FAILED
    message: <human-readable-detail>
    blocking: true|false
    source: DataHub|MG MCP|repository|orchestrator|proof
content_digest: sha256:<digest>
supersedes: <packet-id-or-null>
related_artifacts: []
objective: safe dbt schema migration
source_mode: OFFLINE_FIXTURE|ISOLATED_DATAHUB_READ_ONLY
source_mode_policy: allowed
context_record_id: <context-record-id>
context_content_digest: sha256:<64-lowercase-hex>
pre_retrieval_manifest:
  manifest_digest: sha256:<64-lowercase-hex>
  validation: pass|fail
  context_budget:
    max_entities: <positive-integer>
    max_lineage_depth: <positive-integer>
    max_lineage_edges: <positive-integer>
    max_total_records: <positive-integer>
    max_token_estimate: <positive-integer>
    max_freshness_age: <duration>
    retrieval_timeout: <duration>
  datahub_connection:
    mode: OFFLINE_FIXTURE|ISOLATED_DATAHUB_READ_ONLY
    fixture:
      record_id: <approved-fixture-record-id>
      content_digest: sha256:<64-lowercase-hex>
    isolated:
      approved_server_id: <approved-server-id>
      approved_environment_id: <approved-environment-id>
      approved_endpoint_digest: sha256:<64-lowercase-hex>
      approved_principal_identity: <approved-principal-identity>
      required_access_mode: ISOLATED_DATAHUB_READ_ONLY
  selected_skill:
    skill_id: <immutable-skill-id>
    source: <immutable-source-reference>
    version: <immutable-version>
    license: <license-identifier>
    content_digest: sha256:<64-lowercase-hex>
    validation: pass|fail
repository:
  owner: themg-max
  name: mg-mcp-datahub-agent
  base_commit: <40-hex>
  branch: <non-main-branch>
  worktree:
    identity: <validated-absolute-worktree-path-and-git-common-dir>
    path: <validated-absolute-worktree-path>
    head_sha: <40-hex>
    repository_root: <validated-absolute-repository-root>
    common_dir: <validated-absolute-git-common-directory>
    validation: pass|fail
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
expires_at: <ISO-8601>
screening:
  instruction_trust: data_only
  sanitization_status: pending|pass|failed
  injection_scan_status: pending|pass|failed
  validation: pass|fail
  quarantined_records: []
approval_digest_payload:
  schema_name: governed_packet_approval_payload
  schema_version: "1.0"
  packet_record_id: <packet-stable-id>
  request_id: <request-id>
  objective: safe dbt schema migration
  source_mode: OFFLINE_FIXTURE|ISOLATED_DATAHUB_READ_ONLY
  source_mode_policy: allowed
  context_record_id: <context-record-id>
  context_content_digest: sha256:<64-lowercase-hex>
  pre_retrieval_manifest_digest: sha256:<64-lowercase-hex>
  repository:
    base_commit: <40-hex>
    branch: <non-main-branch>
    worktree:
      identity: <validated-absolute-worktree-path-and-git-common-dir>
      path: <validated-absolute-worktree-path>
      head_sha: <40-hex>
      repository_root: <validated-absolute-repository-root>
      common_dir: <validated-absolute-git-common-directory>
    writable_paths: []
    readable_paths: []
  datahub_facts_relied_on: []
  mg_mcp_records_relied_on: []
  authorized_tools: []
  denied_tools: []
  allowed_commands: []
  required_artifacts: []
  validation: []
  stop_condition: <stop-condition>
  expires_at: <ISO-8601>
  screening:
    instruction_trust: data_only
    sanitization_status: pending|pass|failed
    injection_scan_status: pending|pass|failed
    validation: pass|fail
    quarantined_records: []
approval:
  required: true
  human_approved: false
  reviewer_identity: null
  approved_at: null
  disposition: null
  approved_head_sha: null
  approved_packet_digest: null
  approved_content_digest: null
  validation: pass|fail
```

The packet has one objective, one owner, explicit literal paths, bounded tools,
and a finite proof obligation. A skill cannot expand any of these fields. Before
`execution_status` may become `approved`, `executing`, or `validated`, all of
the following are mandatory: affirmative `human_approved: true`, a non-empty
`reviewer_identity`, an `approved_at` timestamp, an allowed reviewer
`disposition`, and `approved_head_sha` equal to the exact validated local
worktree `head_sha`. A missing, stale, or mismatched approval blocks execution.

`approval_digest_payload` is the immutable pre-approval payload. It is the exact
object shown in the packet schema, with `packet_record_id` equal to the packet
`record_id`, `pre_retrieval_manifest_digest` equal to the manifest digest, and
the payload `screening` equal to the packet `screening`. The payload's
`schema_name` and `schema_version` identify this payload format; the payload
does not contain a digest of itself or any approval fields.
`approved_packet_digest` is the RFC 8785 JCS SHA-256 digest of this payload
object, not a digest of the packet record and not a digest of `content_digest`.
The exact excluded packet fields are
`schema_name`, `schema_version`, `created_at`, `created_by`, `status`,
`authority_status`, `execution_status`, `retrieval_status`, `failures`,
`content_digest`, `supersedes`, `related_artifacts`,
`approval_digest_payload`, and `approval`. No excluded field may be used to
reconstruct the approval payload.

`approved_content_digest` records the packet `content_digest` at approval time.
The packet and proof approval bindings must each carry the same
`approved_packet_digest` payload digest, and each must carry the same
`approved_content_digest` snapshot. If any packet content changes, including a
change to an excluded field, the current `content_digest` no longer equals
`approved_content_digest`; the prior approval is invalidated:
`human_approved` becomes false, approval identity, timestamp, disposition,
approved head, approved packet digest, and approved content digest are cleared,
and execution is blocked with `PACKET_APPROVAL_MISMATCH` until the packet is
re-approved. A mutation to any payload field also changes
`approved_packet_digest` and invalidates the approval.

The packet may authorize only `OFFLINE_FIXTURE` or
`ISOLATED_DATAHUB_READ_ONLY`. `PRIVATE_OR_PRODUCTION_DATAHUB` is always
`source_mode_policy: blocked` and must produce `SOURCE_MODE_BLOCKED` before
`execution_status` can become `approved`, `executing`, or `validated`.
`screening.sanitization_status` and `screening.injection_scan_status` must both
be `pass`, with `screening.validation: pass`, before approval or execution;
pending or failed screening produces `SCREENING_REQUIRED` or
`SCREENING_FAILED` and blocks progression.

Before packet approval, `packet.screening` must equal the context
`content_handling` values for `instruction_trust`, `sanitization_status`,
`injection_scan_status`, `validation`, and `quarantined_records`. This binding
is required even when the selected source mode is `OFFLINE_FIXTURE`.

The `pre_retrieval_manifest` is validated before retrieval begins. Its
`context_budget` must be complete before the first query, its
`manifest_digest` must verify against the manifest with that field omitted, and
its `datahub_connection` must match the selected mode. In
`OFFLINE_FIXTURE`, the fixture record ID and content digest are mandatory and
isolated server evidence is not required. In `ISOLATED_DATAHUB_READ_ONLY`, the
approved server, environment, endpoint digest, principal identity, and
read-only mode are mandatory and fixture evidence is not a substitute.
Its `selected_skill` must contain an immutable skill ID, source, version,
license, and content digest; any missing or changed value fails with
`SKILL_BINDING_FAILED`.

The authorized tool and command sets are literal sets. Every actual tool in
proof `execution_evidence.tools_executed` must occur in packet
`authorized_tools`, and every actual command in
`execution_evidence.commands_executed` must occur in packet
`allowed_commands`. Any unauthorized item is recorded and blocks proof with
`UNAUTHORIZED_TOOL` or `UNAUTHORIZED_COMMAND`.

The context budget is enforceable, not advisory. Retrieval must stop and return
`BUDGET_EXCEEDED` when any limit is reached: entity count, lineage depth,
lineage edge count, total records, estimated tokens, maximum freshness age, or
retrieval timeout. The selected numeric limits and durations must be recorded
in the packet and copied into proof.

Before `execution_status` may become `approved`, `executing`, or `validated`,
the current time must be at or before `expires_at`, which must be a valid
timezone-aware timestamp. A missing, malformed, or elapsed expiry blocks
execution with `PACKET_EXPIRED`.

The worktree identity is validated before packet approval by resolving the Git
repository root, common directory, current branch, exact `HEAD` SHA, and
absolute worktree path. The path must be the intended active worktree, the
branch must not be `main`, and the packet's
`repository.worktree.repository_root`, `repository.worktree.identity`,
`repository.worktree.path`, `repository.worktree.common_dir`,
`repository.branch`, and `repository.worktree.head_sha` must match the
validation result exactly.

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
authority_status: authoritative|proposed|unverified|conflict|unknown
execution_status: not_started|blocked|approved|executing|validated|failed
retrieval_status: not_started|retrieving|complete|partial|empty|timeout|failed
failures:
  - code: APPROVAL_REQUIRED|APPROVAL_INVALID|APPROVAL_HEAD_MISMATCH|PACKET_APPROVAL_MISMATCH|BUDGET_EXCEEDED|DIGEST_INVALID|WORKTREE_INVALID|FRESHNESS_EXCEEDED|TOOL_INVENTORY_INVALID|AUTHORITY_CONFLICT|PROOF_INCOMPLETE|PROOF_INVALID|RETRIEVAL_EVIDENCE_INVALID|PACKET_EXPIRED|SCOPE_VIOLATION|FORBIDDEN_OPERATION_ATTEMPTED|UNAUTHORIZED_TOOL|UNAUTHORIZED_COMMAND|SOURCE_MODE_BLOCKED|SCREENING_REQUIRED|SCREENING_FAILED|CONNECTION_MISMATCH|SKILL_BINDING_FAILED
    message: <human-readable-detail>
    blocking: true|false
    source: DataHub|MG MCP|repository|orchestrator|proof
content_digest: sha256:<digest>
supersedes: <proof-id-or-null>
related_artifacts: []
context_evidence:
  record_id: <context-record-id>
  source_mode: OFFLINE_FIXTURE|ISOLATED_DATAHUB_READ_ONLY|PRIVATE_OR_PRODUCTION_DATAHUB
  source_mode_policy: allowed|blocked
  content_digest: sha256:<64-lowercase-hex>
  retrieval_status: complete|partial|empty|timeout|failed
  digest_binding: pass|fail
  datahub_connection:
    mode: OFFLINE_FIXTURE|ISOLATED_DATAHUB_READ_ONLY
    fixture:
      record_id: <observed-fixture-record-id>
      content_digest: sha256:<64-lowercase-hex>
    isolated:
      server_id: <observed-server-id>
      environment_id: <observed-environment-id>
      endpoint_digest: sha256:<64-lowercase-hex>
      principal_identity: <observed-principal-identity>
      access_mode: ISOLATED_DATAHUB_READ_ONLY
    validation: pass|fail
packet_binding:
  record_id: <packet-id>
  content_digest: sha256:<64-lowercase-hex>
  source_mode: OFFLINE_FIXTURE|ISOLATED_DATAHUB_READ_ONLY
  context_record_id: <context-record-id>
  context_content_digest: sha256:<64-lowercase-hex>
  pre_retrieval_manifest_digest: sha256:<64-lowercase-hex>
  approved_writable_paths: []
  execution_status: approved|executing|validated|blocked|failed
  digest_binding: pass|fail
  expires_at: <ISO-8601>
  expiry_validation:
    checked_at: <ISO-8601>
    transition_timestamps:
      approved_at: <ISO-8601-or-null>
      executing_at: <ISO-8601-or-null>
      validated_at: <ISO-8601-or-null>
    validation: pass|fail
pre_retrieval_evidence:
  manifest_digest: sha256:<64-lowercase-hex>
  manifest_validation: pass|fail
  budget_declared_before_retrieval: true|false
  validation: pass|fail
connection_evidence:
  mode: OFFLINE_FIXTURE|ISOLATED_DATAHUB_READ_ONLY
  fixture:
    record_id: <fixture-record-id>
    content_digest: sha256:<64-lowercase-hex>
  isolated:
    approved_server_id: <approved-server-id>
    observed_server_id: <observed-server-id>
    approved_environment_id: <approved-environment-id>
    observed_environment_id: <observed-environment-id>
    approved_endpoint_digest: sha256:<64-lowercase-hex>
    observed_endpoint_digest: sha256:<64-lowercase-hex>
    approved_principal_identity: <approved-principal-identity>
    observed_principal_identity: <observed-principal-identity>
    required_access_mode: ISOLATED_DATAHUB_READ_ONLY
    observed_access_mode: ISOLATED_DATAHUB_READ_ONLY
  validation: pass|fail
selected_skill:
  skill_id: <immutable-skill-id>
  source: <immutable-source-reference>
  version: <immutable-version>
  license: <license-identifier>
  content_digest: sha256:<64-lowercase-hex>
  binding_validation: pass|fail
source_attribution:
  - source_system: DataHub|MG MCP|repository
    source_identifier: <URN, record ID, path, or commit>
    source_updated_at: <ISO-8601>
    checked_at: <ISO-8601>
    freshness_age: <duration>
    content_digest: sha256:<64-lowercase-hex>
warnings:
  - code: <stable-warning-code>
    message: <human-readable-detail>
    source: DataHub|MG MCP|repository|orchestrator
    related_record_id: <record-id-or-null>
unknowns:
  - field: <unknown-field>
    reason: <human-readable-detail>
    source: DataHub|MG MCP|repository|orchestrator
    blocking: true|false
    next_check: <permitted-validation-step>
screening:
  instruction_trust: data_only
  sanitization_status: pending|pass|failed
  injection_scan_status: pending|pass|failed
  validation: pass|fail
  quarantined_records: []
tool_inventory:
  server_id: <id-or-UNKNOWN>
  server_version: <version-or-UNKNOWN>
  protocol_version: <version-or-UNKNOWN>
  discovered_at: <ISO-8601>
  tools_digest: sha256:<digest>
  allowed_tools: []
  denied_tools: []
execution_evidence:
  tools_executed: []
  commands_executed: []
  unauthorized_tools: []
  unauthorized_commands: []
  authorization_set_validation: pass|fail
validation:
  - command: <existing command>
    result: pass|fail|unknown
    evidence: <output reference>
approval:
  required: true
  human_approved: false
  reviewer_identity: null
  approved_at: null
  disposition: null
  approved_head_sha: null
  approved_packet_digest: null
  approved_content_digest: null
  validation: pass|fail
worktree:
  identity: <validated-absolute-worktree-path-and-git-common-dir>
  path: <validated-absolute-worktree-path>
  head_sha: <40-hex>
  repository_root: <validated-absolute-repository-root>
  common_dir: <validated-absolute-git-common-directory>
  branch: <non-main-branch>
  validation: pass|fail
context_budget:
  limits:
    max_entities: <positive-integer>
    max_lineage_depth: <positive-integer>
    max_lineage_edges: <positive-integer>
    max_total_records: <positive-integer>
    max_token_estimate: <positive-integer>
    max_freshness_age: <duration>
    retrieval_timeout: <duration>
  observed:
    entity_count: <non-negative-integer>
    lineage_depth: <non-negative-integer>
    lineage_edges: <non-negative-integer>
    total_records: <non-negative-integer>
    token_estimate: <non-negative-integer>
    freshness_age: <duration>
    retrieval_duration: <duration>
  validation: pass|fail
retrieval_attempts:
  - attempt_id: retrieval-attempt-<stable-id>
    query: <exact-query>
    source_mode: OFFLINE_FIXTURE|ISOLATED_DATAHUB_READ_ONLY
    started_at: <ISO-8601>
    completed_at: <ISO-8601-or-null>
    outcome: success|partial|empty|timeout|failed
    records_returned: <non-negative-integer>
    content_digest: sha256:<64-lowercase-hex-or-null>
    failure_code: <failure-code-or-null>
digest:
  target: proof_record_excluding_digest_evidence
  target_record_id: <proof-id>
  target_content_digest: sha256:<64-lowercase-hex>
  algorithm: RFC8785_JCS_SHA256
  canonicalization: RFC8785
  excluded_fields:
    - content_digest
    - digest
  expected: sha256:<64-lowercase-hex>
  observed: sha256:<64-lowercase-hex>
  validation: pass|fail
scope_check:
  changed_paths: []
  unauthorized_paths: []
  containment_validation: pass|fail
  forbidden_operations_attempted: []
  fail_closed_checks: []
review:
  reviewer_disposition: pending
  merge_recommendation: pending
```

Proof acceptance requires attributable source evidence, exact path scope,
successful validation, visible tool inventory, and a fail-closed result for at
least one forbidden operation. Proof must also contain the packet's exact
validated worktree identity and head SHA, budget measurements versus limits,
canonical digest verification, and approval fields. A failed or incomplete
proof blocks progression.

The proof is independently checkable: `packet_binding.record_id` and
`packet_binding.content_digest` must equal the packet's exact `record_id` and
`content_digest`; `approved_writable_paths` must equal the packet's literal
`repository.writable_paths`; `packet_binding.source_mode`,
`packet_binding.context_record_id`, and `packet_binding.context_content_digest`
must equal the packet's source and context fields; and `context_evidence.record_id`,
`context_evidence.source_mode`, and `context_evidence.content_digest` must
equal the retrieved context record.
`pre_retrieval_evidence.manifest_digest` must equal the packet's
`pre_retrieval_manifest.manifest_digest`, and
`manifest_validation` and `budget_declared_before_retrieval` must be `true`.
The proof `context_budget.limits` must equal the packet
`pre_retrieval_manifest.context_budget` field-for-field. Every proof
`approval` field must equal the packet's `approval` field, including
`approved_packet_digest` and `approved_content_digest`, and
`approval.approved_head_sha` must equal both the packet's validated worktree
head and the proof's validated worktree head. `approval.approved_packet_digest`
must equal the packet's immutable `approval_digest_payload` JCS digest, and
`approval.approved_content_digest` must equal the packet `content_digest`
captured at approval time; otherwise proof fails with
`PACKET_APPROVAL_MISMATCH`.
Connection evidence is conditional: for `OFFLINE_FIXTURE`, the proof's fixture
record ID and content digest must equal the packet manifest's fixture binding
and the context record's fixture binding, while isolated connection fields are
not required. For `ISOLATED_DATAHUB_READ_ONLY`, the proof's approved and
observed server, environment, endpoint digest, principal identity, and
read-only mode must match the packet manifest and actual retrieval; fixture
fields are not a substitute. Any conditional mismatch fails with
`CONNECTION_MISMATCH`. In either mode, the connection evidence mode must equal
the packet `source_mode` and the context `source_mode`.
The proof `selected_skill` must exactly equal
`packet.pre_retrieval_manifest.selected_skill` across skill ID, source, version,
license, and content digest, with `binding_validation: pass`; any mismatch
fails with `SKILL_BINDING_FAILED`.
`context_evidence.source_mode_policy` must be `allowed`; a private or production
source fails proof acceptance with `SOURCE_MODE_BLOCKED`. The proof's
`screening` must equal packet `screening`, and packet `screening` must equal
the context `content_handling` object field-for-field across
`instruction_trust`, `sanitization_status`, `injection_scan_status`,
`validation`, and `quarantined_records`. All three representations must have
`instruction_trust: data_only`, both scan statuses `pass`, `validation: pass`,
and an empty `quarantined_records`; any pending or failed context screening
blocks proof with `SCREENING_REQUIRED` or `SCREENING_FAILED`.
`scope_check.unauthorized_paths` must be empty and
`scope_check.containment_validation` must be `pass` only when every
`scope_check.changed_paths` entry is a literal member of
`packet_binding.approved_writable_paths`; otherwise proof fails with
`SCOPE_VIOLATION`. `execution_evidence.authorization_set_validation` must be
`pass`, and its actual tools and commands must be literal subsets of the
packet-authorized sets.
`packet_binding.expires_at` must equal the packet `expires_at`;
`expiry_validation.checked_at` must be at or before every non-null execution
transition timestamp; and every non-null `approved_at`, `executing_at`, and
`validated_at` timestamp must be at or before `expires_at`. Missing, malformed,
or late evidence fails proof with `PACKET_EXPIRED`.
`digest.target_record_id` must equal the proof `record_id`, while
`target_content_digest` must equal the proof `content_digest`; the digest
evidence itself is excluded from that target, so verification is not
self-referential. Structured `warnings` and `unknowns` are retained in the
proof without being collapsed into free-form text.
Each proof `source_attribution` entry carries `source_updated_at`; its
freshness evidence is valid only when the observed age equals the difference
between the proof check time and that timestamp and is within the packet
`max_freshness_age`.
`proof.retrieval_attempts` must exactly reproduce the context
`retrieval_attempts` by `attempt_id`, query, source mode, timestamps, outcome,
record count, digest, and failure code. Every `empty` or `timeout` outcome
must reference an existing attempt ID, preserve the exact query issued, and
carry the matching outcome and evidence in both context and proof; missing or
inconsistent attempt evidence fails with `RETRIEVAL_EVIDENCE_INVALID`.

### Closure of the four prior contract findings

1. **Approval:** affirmative human approval, reviewer identity, timestamp,
   disposition, and exact worktree head binding gate `execution_status`.
2. **Budgets:** entity, lineage depth and edges, total records, token estimate,
   freshness, and timeout limits are declared in the packet and measured in
   proof.
3. **Digests:** RFC 8785 JCS plus SHA-256 is defined for context, packet, and
   proof targets, with explicit exclusions and target identifiers.
4. **Worktree:** repository root, Git common directory, absolute path, branch,
   and exact head SHA are validated and carried into proof.

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

The shared typed `failures[].code` enum is identical in the context envelope,
work packet, and proof schema:
`APPROVAL_REQUIRED|APPROVAL_INVALID|APPROVAL_HEAD_MISMATCH|PACKET_APPROVAL_MISMATCH|BUDGET_EXCEEDED|DIGEST_INVALID|WORKTREE_INVALID|FRESHNESS_EXCEEDED|TOOL_INVENTORY_INVALID|AUTHORITY_CONFLICT|PROOF_INCOMPLETE|PROOF_INVALID|RETRIEVAL_EVIDENCE_INVALID|PACKET_EXPIRED|SCOPE_VIOLATION|FORBIDDEN_OPERATION_ATTEMPTED|UNAUTHORIZED_TOOL|UNAUTHORIZED_COMMAND|SOURCE_MODE_BLOCKED|SCREENING_REQUIRED|SCREENING_FAILED|CONNECTION_MISMATCH|SKILL_BINDING_FAILED`.

- **Approval:** use `APPROVAL_REQUIRED`, `APPROVAL_INVALID`, or
  `APPROVAL_HEAD_MISMATCH` when affirmative approval, reviewer identity,
  timestamp, disposition, or exact head binding is absent or invalid.
- **Packet approval:** use `PACKET_APPROVAL_MISMATCH` when the approval digest,
  approval fields, or approved worktree head does not match the current packet
  and validated proof worktree.
- **Budget:** use `BUDGET_EXCEEDED` when any declared entity, lineage depth,
  lineage edge, record, token, freshness, or timeout limit is exceeded.
- **Digest:** use `DIGEST_INVALID` when RFC 8785 canonicalization or SHA-256
  verification fails.
- **Worktree:** use `WORKTREE_INVALID` when repository root, common directory,
  branch, absolute path, or exact head cannot be validated.
- **Freshness:** use `FRESHNESS_EXCEEDED` when source age exceeds the packet
  limit, including when a source timestamp is missing and freshness is required.
- **Inventory:** use `TOOL_INVENTORY_INVALID` when discovery is absent, stale,
  or its digest does not match the proof and execution manifest.
- **Authority conflict:** use `AUTHORITY_CONFLICT` when sources disagree about
  an authority-bearing field or a proposal is treated as authority.
- **Proof:** use `PROOF_INCOMPLETE` or `PROOF_INVALID` when required evidence,
  attribution, scope, approval, digest, or validation is missing or fails.
- **Scope:** use `SCOPE_VIOLATION` when a changed path is not a literal member
  of the approved writable paths.
- **Expiration:** use `PACKET_EXPIRED` when `expires_at` is missing, malformed,
  or earlier than the current time before or during execution.
- **Timeout:** stop the affected retrieval, record the timeout and attempt, and
  return `UNKNOWN`; the exact attempt ID and query must be present in both
  context and proof, or return `RETRIEVAL_EVIDENCE_INVALID`. Do not retry
  indefinitely or fabricate context.
- **Empty result:** return `empty` with the exact query and source attribution.
  The exact attempt ID and query must be present in both context and proof, or
  return `RETRIEVAL_EVIDENCE_INVALID`. Empty is not evidence that no metadata
  exists.
- **Conflict:** retain both attributable records, mark `conflict`, identify the
  conflicting fields, and block generation when the conflict affects safety,
  ownership, scope, or policy.
- **UNKNOWN:** preserve the reason, missing field, source, and next permitted
  validation step. Any safety-critical UNKNOWN blocks execution.
- **Sanitization or injection failure:** quarantine the record, mark the content
  unusable, and stop. Retrieved text is data only, never an instruction.
- **Forbidden operation:** fail closed, record the attempted operation in proof,
  and use `FORBIDDEN_OPERATION_ATTEMPTED`; do not provide a success-shaped
  fallback.
- **Unauthorized execution:** use `UNAUTHORIZED_TOOL` or
  `UNAUTHORIZED_COMMAND` when actual execution exceeds the packet sets.
- **Source mode:** use `SOURCE_MODE_BLOCKED` for private or production DataHub.
- **Screening:** use `SCREENING_REQUIRED` for pending screening and
  `SCREENING_FAILED` for failed sanitization or injection scanning.
- **Connection:** use `CONNECTION_MISMATCH` when the observed isolated
  DataHub server, environment, endpoint digest, principal, or access mode
  differs from the pre-retrieval manifest.
- **Skill binding:** use `SKILL_BINDING_FAILED` when selected skill identity,
  source, version, license, or digest is absent, mutable, or differs from the
  packet or proof.
- **Retrieval evidence:** use `RETRIEVAL_EVIDENCE_INVALID` when a retrieval
  attempt is missing, duplicated, mismatched, or lacks the exact query and
  outcome required to substantiate an empty or timeout result.

Failure codes are stable interface values. They must be recorded unchanged in
the envelope, packet, and proof; free-form messages may add detail but may not
replace a code. Any failure affecting approval, packet approval, budget,
digest, worktree, freshness, inventory, authority, retrieval evidence, or proof
blocks `executing` and `validated`.

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
