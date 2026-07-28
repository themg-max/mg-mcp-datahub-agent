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

### Issue #17 amendment provenance

- Lane: `datahub-governed-proof-artifact-lineage-schema`
- Branch: `schema/issue-17-governed-proof-evidence`
- Owner: `themg-max`
- Registry authorization base: `5a72661440ef5959193636a67d7b20d976f14fa1`
- Execution starting head: `19ad0c0a51f43b89a05c6acd7c119ca1479478c5`
- Registry merge commit: `19ad0c0a51f43b89a05c6acd7c119ca1479478c5`
- Scope: documentation-only update to
  `docs/datahub-mg-mcp-skill-bridge-architecture.md`
- Purpose: define immutable artifact evidence and complete packet revision
  lineage for `governed_development_proof` without authorizing runtime,
  fixture, dependency, deployment, DataHub, or MG MCP changes.

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

Embedded evidence carriers do not inherit the complete top-level
governed-record spine. The exact common embedded-carrier fields are
`schema_name`, `schema_version`, `record_type`, `record_id`, `request_id`,
and `canonical_record_digest`. `artifact_evidence` records add their exact
payload fields; `packet_revision_lineage` adds revision and edge fields; and
`proof_evidence_graph` adds node and directed-edge fields. Top-level-only
fields such as `created_at`, `created_by`, `status`, `content_digest`,
`supersedes`, and `related_artifacts` are not implied for an embedded carrier
unless that carrier explicitly declares them.

`authority_status`, `execution_status`, and `retrieval_status` are separate
dimensions. Retrieval success does not imply authority, authority does not
imply approval to execute, and a validated artifact does not imply merge
completion.

### Canonical digest rule

Every envelope, packet, artifact-evidence record, packet-revision-lineage
carrier, proof-evidence-graph carrier, and proof object has a
canonical record digest generated by serializing the declared record as RFC
8785 JSON Canonicalization Scheme (JCS) JSON and hashing the result with
SHA-256. For a context or packet, the digest target is that record with only
its `content_digest` field omitted. For an artifact-evidence record, the digest
target is that record with only its `canonical_record_digest` field omitted;
its `payload_digest` and `byte_length` remain in the target so the record
metadata is bound to the exact payload. For a proof, the digest target is the
proof record identified by `record_id` with both `content_digest` and the
entire `digest` evidence object omitted. The recorded value is lowercase
`sha256:<64-lowercase-hex>`.

The packet approval payload is a separate RFC 8785 JCS SHA-256 domain named
`approval_payload`; `approved_packet_digest` is its digest and is never a
substitute for the packet's `content_digest` or a proof's canonical record
digest. The packet-revision-lineage and proof-evidence-graph carriers use the
same canonical-record domain as an artifact-evidence record, omitting only
their own `canonical_record_digest`.

An exact payload-byte digest is a separate domain. `payload_digest` is the
SHA-256 hash of the exact bytes read from the declared artifact path, and
`byte_length` is the non-negative count of those bytes. It is not a JCS hash
and it must not be computed after decoding, newline conversion, whitespace
normalization, transcoding, parsing, or re-serialization. A payload digest
does not substitute for a canonical record digest, and a canonical record
digest does not substitute for a payload digest. Implementations must reject
non-canonical or mismatched digests; whitespace, key order, or equivalent JSON
formatting must not change a canonical record digest.

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

`approved_content_digest` records the approved revision's `content_digest` at
approval time. The packet and proof approval bindings must each carry the same
`approved_packet_digest` approval-payload digest and the same
`approved_content_digest` approved-revision snapshot. A mutation to the
approved revision or its approval payload invalidates approval:
`human_approved` becomes false, approval identity, timestamp, disposition,
approved head, approved packet digest, and approved content digest are cleared,
and execution is blocked with `PACKET_APPROVAL_MISMATCH` until the packet is
re-approved. A conforming executing or validated successor revision does not
mutate the approved revision and does not invalidate approval.

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
schema_version: "1.1"
record_id: proof-<stable-id>
request_id: <request-id>
created_at: <ISO-8601>
created_by: orchestrator
status: pass|blocked|unknown
authority_status: authoritative|proposed|unverified|conflict|unknown
execution_status: not_started|blocked|approved|executing|validated|failed
retrieval_status: not_started|retrieving|complete|partial|empty|timeout|failed
failures:
  - code: APPROVAL_REQUIRED|APPROVAL_INVALID|APPROVAL_HEAD_MISMATCH|PACKET_APPROVAL_MISMATCH|BUDGET_EXCEEDED|DIGEST_INVALID|WORKTREE_INVALID|FRESHNESS_EXCEEDED|TOOL_INVENTORY_INVALID|AUTHORITY_CONFLICT|PROOF_INCOMPLETE|PROOF_INVALID|RETRIEVAL_EVIDENCE_INVALID|PACKET_EXPIRED|SCOPE_VIOLATION|FORBIDDEN_OPERATION_ATTEMPTED|UNAUTHORIZED_TOOL|UNAUTHORIZED_COMMAND|SOURCE_MODE_BLOCKED|SCREENING_REQUIRED|SCREENING_FAILED|CONNECTION_MISMATCH|SKILL_BINDING_FAILED|SCHEMA_UNSUPPORTED
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
artifact_evidence:
  - schema_name: governed_artifact_evidence
    schema_version: "1.0"
    record_type: governed_artifact_evidence
    record_id: artifact-evidence-<stable-id>
    request_id: <request-id>
    packet_required_artifact: <exact-packet-required-artifact-entry>
    artifact_path: <literal-repository-relative-path>
    artifact_role: generated|modified|validation_output
    media_type: <lowercase-IANA-type-subtype-without-parameters>
    presence: present
    immutable: true
    byte_length: <non-negative-integer>
    payload_digest: sha256:<64-lowercase-hex>
    canonical_record_digest: sha256:<64-lowercase-hex>
    validation: pass|fail
packet_revision_lineage:
  schema_name: governed_packet_revision_lineage
  schema_version: "1.0"
  record_type: governed_packet_revision_lineage
  record_id: packet-revision-lineage-<stable-id>
  request_id: <request-id>
  canonical_record_digest: sha256:<64-lowercase-hex>
  lineage_profile: datahub_bridge_packet_lifecycle_v1
  root_packet_record_id: <packet-proposed-initial-id>
  terminal_packet_record_id: <packet-validated-id>
  revisions:
    - sequence: 0
      revision_label: proposed_initial
      record_type: governed_development_work_packet
      record_id: <packet-proposed-initial-id>
      record_binding:
        mode: embedded
        embedded_record: <complete-packet-record>
        resolution_validation: pass|fail
      content_digest: sha256:<64-lowercase-hex>
      status: proposed
      supersedes: null
      authorization_binding: null
    - sequence: 1
      revision_label: proposed_refined
      record_type: governed_development_work_packet
      record_id: <packet-proposed-refined-id>
      record_binding:
        mode: embedded
        embedded_record: <complete-packet-record>
        resolution_validation: pass|fail
      content_digest: sha256:<64-lowercase-hex>
      status: proposed
      supersedes: <packet-proposed-initial-id>
      authorization_binding: null
    - sequence: 2
      revision_label: approved
      record_type: governed_development_work_packet
      record_id: <packet-approved-id>
      record_binding:
        mode: embedded
        embedded_record: <complete-packet-record>
        resolution_validation: pass|fail
      content_digest: sha256:<64-lowercase-hex>
      status: approved
      supersedes: <packet-proposed-refined-id>
      authorization_binding: self
    - sequence: 3
      revision_label: executing
      record_type: governed_development_work_packet
      record_id: <packet-executing-id>
      record_binding:
        mode: embedded
        embedded_record: <complete-packet-record>
        resolution_validation: pass|fail
      content_digest: sha256:<64-lowercase-hex>
      status: executing
      supersedes: <packet-approved-id>
      authorization_binding:
        approved_packet_record_id: <packet-approved-id>
        approved_packet_digest: sha256:<64-lowercase-hex>
        approved_content_digest: sha256:<64-lowercase-hex>
    - sequence: 4
      revision_label: validated
      record_type: governed_development_work_packet
      record_id: <packet-validated-id>
      record_binding:
        mode: embedded
        embedded_record: <complete-packet-record>
        resolution_validation: pass|fail
      content_digest: sha256:<64-lowercase-hex>
      status: validated
      supersedes: <packet-executing-id>
      authorization_binding:
        approved_packet_record_id: <packet-approved-id>
        approved_packet_digest: sha256:<64-lowercase-hex>
        approved_content_digest: sha256:<64-lowercase-hex>
  edges:
    - predecessor_record_id: <packet-proposed-initial-id>
      predecessor_content_digest: sha256:<64-lowercase-hex>
      predecessor_status: proposed
      successor_record_id: <packet-proposed-refined-id>
      successor_content_digest: sha256:<64-lowercase-hex>
      successor_status: proposed
      successor_supersedes: <packet-proposed-initial-id>
      expected_transition: refine
      predecessor_binding_validation: pass|fail
      successor_binding_validation: pass|fail
      digest_validation: pass|fail
      status_transition_validation: pass|fail
      supersedes_validation: pass|fail
      validation: pass|fail
    - predecessor_record_id: <packet-proposed-refined-id>
      predecessor_content_digest: sha256:<64-lowercase-hex>
      predecessor_status: proposed
      successor_record_id: <packet-approved-id>
      successor_content_digest: sha256:<64-lowercase-hex>
      successor_status: approved
      successor_supersedes: <packet-proposed-refined-id>
      expected_transition: approve
      predecessor_binding_validation: pass|fail
      successor_binding_validation: pass|fail
      digest_validation: pass|fail
      status_transition_validation: pass|fail
      supersedes_validation: pass|fail
      validation: pass|fail
    - predecessor_record_id: <packet-approved-id>
      predecessor_content_digest: sha256:<64-lowercase-hex>
      predecessor_status: approved
      successor_record_id: <packet-executing-id>
      successor_content_digest: sha256:<64-lowercase-hex>
      successor_status: executing
      successor_supersedes: <packet-approved-id>
      expected_transition: execute
      predecessor_binding_validation: pass|fail
      successor_binding_validation: pass|fail
      digest_validation: pass|fail
      status_transition_validation: pass|fail
      supersedes_validation: pass|fail
      authorization_carry_forward_validation: pass|fail
      validation: pass|fail
    - predecessor_record_id: <packet-executing-id>
      predecessor_content_digest: sha256:<64-lowercase-hex>
      predecessor_status: executing
      successor_record_id: <packet-validated-id>
      successor_content_digest: sha256:<64-lowercase-hex>
      successor_status: validated
      successor_supersedes: <packet-executing-id>
      expected_transition: validate
      predecessor_binding_validation: pass|fail
      successor_binding_validation: pass|fail
      digest_validation: pass|fail
      status_transition_validation: pass|fail
      supersedes_validation: pass|fail
      authorization_carry_forward_validation: pass|fail
      validation: pass|fail
  aggregate_validation: pass|fail
proof_evidence_graph:
  schema_name: governed_proof_evidence_graph
  schema_version: "1.0"
  record_type: governed_proof_evidence_graph
  record_id: proof-evidence-graph-<stable-id>
  request_id: <request-id>
  canonical_record_digest: sha256:<64-lowercase-hex>
  nodes:
    - node_identity: approval:<packet-approved-id>
      record_type: governed_packet_approval_payload
      record_identity:
        field: packet_record_id
        value: <packet-approved-id>
      digest_field: null
      digest_domain: approval_payload
      digest_target: payload_is_digest_target
      expected_digest_source: proof.approval.approved_packet_digest
      digest_binding_validation: pass|fail
      digest: sha256:<64-lowercase-hex>
    - node_identity: artifact:<artifact-evidence-record-id>
      record_type: governed_artifact_evidence
      record_identity:
        field: record_id
        value: <artifact-evidence-record-id>
      digest_field: canonical_record_digest
      digest_domain: canonical_record
      digest: sha256:<64-lowercase-hex>
    - node_identity: context:<context-record-id>
      record_type: governed_datahub_context
      record_identity:
        field: record_id
        value: <context-record-id>
      digest_field: content_digest
      digest_domain: canonical_record
      digest: sha256:<64-lowercase-hex>
    - node_identity: packet-revision-lineage:<packet-revision-lineage-id>
      record_type: governed_packet_revision_lineage
      record_identity:
        field: record_id
        value: <packet-revision-lineage-id>
      digest_field: canonical_record_digest
      digest_domain: canonical_record
      digest: sha256:<64-lowercase-hex>
    - node_identity: packet:<packet-validated-id>
      record_type: governed_development_work_packet
      record_identity:
        field: record_id
        value: <packet-validated-id>
      digest_field: content_digest
      digest_domain: canonical_record
      digest: sha256:<64-lowercase-hex>
    - node_identity: proof:<proof-id>
      record_type: governed_development_proof
      record_identity:
        field: record_id
        value: <proof-id>
      digest_field: content_digest
      digest_domain: canonical_record
      digest: null
      workflow_terminal: true
      graph_root: true
  edges:
    - from_node_identity: proof:<proof-id>
      to_node_identity: approval:<packet-approved-id>
      relationship: binds_approval_payload
      binding_validation: pass|fail
    - from_node_identity: proof:<proof-id>
      to_node_identity: artifact:<artifact-evidence-record-id>
      relationship: contains_artifact_evidence
      binding_validation: pass|fail
    - from_node_identity: proof:<proof-id>
      to_node_identity: context:<context-record-id>
      relationship: binds_context
      binding_validation: pass|fail
    - from_node_identity: proof:<proof-id>
      to_node_identity: packet-revision-lineage:<packet-revision-lineage-id>
      relationship: binds_packet_revision_lineage
      binding_validation: pass|fail
    - from_node_identity: proof:<proof-id>
      to_node_identity: packet:<packet-validated-id>
      relationship: binds_packet
      binding_validation: pass|fail
  allowed_relationships:
    - binds_approval_payload
    - binds_context
    - binds_packet
    - binds_packet_revision_lineage
    - contains_artifact_evidence
  edge_uniqueness_validation: pass|fail
  acyclic_validation: pass|fail
  reachability_validation: pass|fail
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
  approved_packet_record_id: null
  terminal_packet_record_id: null
  lineage_authorization_validation: pass|fail
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

### Proof schema 1.1 extension and compatibility

`governed_development_proof` `1.1` is a minor, field-definition-compatible
extension, not a major schema version. It preserves the meaning and
serialization rules of all existing `1.0` fields, but it is not
consumer-substitutable with `1.0`: the new evidence is required for a complete
`1.1` proof. Before accepting or interpreting a proof record, a consumer that
does not support its proof schema version must reject it with
`SCHEMA_UNSUPPORTED`; it must not ignore the new carriers or silently downgrade
the record. A consumer that supports `1.1` must require
`artifact_evidence`, `packet_revision_lineage`, and `proof_evidence_graph`, and
apply the rules below.

`artifact_evidence` is the declared artifact-evidence carrier. It is a list
with exactly one immutable evidence record for every entry in the packet's
`required_artifacts`. Each record has a `record_type`, a declared IANA
`media_type`, and a globally unique `record_id` within the proof.
`packet_required_artifact` and `artifact_path` form a unique binding within the
proof: neither may occur in more than one artifact record. `media_type` must
be a non-empty lowercase IANA `type/subtype` value with no parameters, and it
is part of the canonical record digest. Repeated artifact record types and
media types are allowed when record IDs and required-artifact/path bindings are
different. Each `packet_required_artifact` must equal its packet entry, each
`artifact_path` must be the same literal approved repository path, and
`presence` must be `present`. The artifact is read as bytes at validation time;
the record captures that exact `byte_length` and `payload_digest`, then binds
both values into `canonical_record_digest`.

`artifact_evidence` is required for every `1.1` proof. It may be `[]` only
when `packet.required_artifacts` is `[]`; an artifact claim without its
matching artifact evidence fails with `PROOF_INCOMPLETE`. Its entries are
ordered first by the packet's `required_artifacts` order, then by ascending
literal `artifact_path` for entries tied to the same required-artifact
position. Any other ordering is noncanonical and fails with `PROOF_INCOMPLETE`.

Artifact evidence is non-cyclic by containment: the artifact record is
contained by this proof and is referenced from `proof_evidence_graph`, but it
does not carry the proof's `content_digest` or a digest of the graph. The
proof's top-level `content_digest` covers the complete artifact carrier and
graph, while each artifact record's canonical digest covers only its own
record. This containment plus one-way proof digest binding prevents an
artifact-to-proof hash cycle. A missing, duplicated, or substituted artifact
record, path, media type, or required-artifact identity is structural evidence
failure; a malformed or mismatched artifact digest or byte length is a digest
failure.

`packet_revision_lineage` is reserved for packet revisions only.
`lineage_profile` declares the exact revision lifecycle. The first defined
profile is `datahub_bridge_packet_lifecycle_v1`; it requires exactly the five
revisions `proposed_initial`, `proposed_refined`, `approved`, `executing`, and
`validated` with the four transitions `refine`, `approve`, `execute`, and
`validate`. Future proof profiles may use a different sequence; this schema
does not require every proof to use that exact five-revision shape.

`root_packet_record_id` must identify the initial proposed revision and
`terminal_packet_record_id` must identify the validated revision;
`packet_binding.record_id` must equal `terminal_packet_record_id`. Every
revision has a unique `record_id`, its exact `content_digest`, its `status`,
and `supersedes`; the initial revision has `supersedes: null`, and every later
revision names exactly its immediate predecessor. Revision labels
(`proposed_initial`, `proposed_refined`, `approved`, `executing`, `validated`)
describe revision state; edge-transition labels (`refine`, `approve`,
`execute`, `validate`) describe only the four links between successive
revisions. `initial` is not an edge transition. Each edge verifies predecessor
and successor record IDs, both content digests, both statuses, the successor's
`supersedes`, and the expected transition through
`predecessor_binding_validation`, `successor_binding_validation`,
`digest_validation`, `status_transition_validation`,
`supersedes_validation`, and, only for the post-approval `approve`-to-`execute`
and `execute`-to-`validate` edges, `authorization_carry_forward_validation`;
all required edge results must pass before `aggregate_validation` can pass. The
revision sequence
is independent of proof dependencies and is never inferred from node type or
status alone.

Every revision has a discriminated-union `record_binding`. When `mode` is
`embedded`, `embedded_record` is required and `external_exact` is absent; it
carries or identifies the complete packet record within the proof so its digest
can be verified in-place. When `mode` is `external_exact`, `external_exact` is
required and `embedded_record` is absent. The external branch declares
`source_class` (e.g. `git_commit|proof_artifact|packet_store`), `source_id`, an
`immutable_locator`, the `expected_record_id`, and the
`expected_content_digest`; resolution must produce the exact record matching
those expected values. Both branches present or both absent is
`PROOF_INCOMPLETE`. `resolution_validation` records whether the selected branch
resolved successfully. A missing or unresolved binding is
`PROOF_INCOMPLETE`; a resolved record whose digest does not match the expected
content digest is `DIGEST_INVALID`.
Revisions are sorted by ascending `sequence`; edges are sorted by ascending
successor sequence. Any noncanonical ordering is `PROOF_INCOMPLETE`.

Approval binds the immutable `approved` revision (sequence 2). Its approval
payload's `packet_record_id` must equal that approved revision's `record_id`,
not the validated revision. The `executing` and `validated` revisions supersede
the approved revision without mutating it; they carry an
`authorization_binding` that identifies the approved packet record ID, its
`approved_content_digest`, and its `approved_packet_digest`. The `approve`-to-`execute` and
`execute`-to-`validate` edges verify this authorization carry-forward through
`authorization_carry_forward_validation`. Only mutation of the approved revision
itself or its approval payload invalidates approval; conforming successor
creation does not. `proof.approval.approved_packet_record_id`,
`approved_packet_digest`, `approved_content_digest`, and
`terminal_packet_record_id` capture this binding.
`lineage_authorization_validation` is `pass` only when the terminal revision's
`authorization_binding` digests match the proof's approval fields.

Normative approval validation resolves
`proof.approval.approved_packet_record_id` to exactly one
`packet_revision_lineage.revisions` entry. That entry must have `sequence: 2`,
`revision_label: approved`, and `status: approved`. The verifier resolves that
entry's `record_binding`, reads the resolved approved revision's nested `approval_digest_payload`,
computes the RFC 8785 JCS SHA-256 digest over that payload only, and compares it
with `proof.approval.approved_packet_digest`.
The verifier must not hash the complete approved revision record, the terminal
packet's payload, or the record identified by `packet_binding.record_id`.
Separately, the verifier resolves
`packet_binding`, requires its `record_id` to equal
`terminal_packet_record_id`, and validates the terminal revision through its
`record_binding`, `terminal_packet_record_id`, and
`authorization_binding`.

Approval-validation failure precedence is deterministic: a missing or
unresolved required binding or digest returns `PROOF_INCOMPLETE`; a present
malformed or non-verifying digest, including changed payload bytes without a
recomputed digest, returns `DIGEST_INVALID`; only well-formed,
cryptographically verified evidence bound to the wrong approved record,
approved content digest, or approved head returns
`PACKET_APPROVAL_MISMATCH`.

Missing, skipped, duplicated, cyclic, reordered, substituted, or
digest-mismatched revisions fail closed. Duplicate revision identity is
checked by `record_id` (not by `record_type` or status), and a revision
appearing more than once in the sequence is invalid even when its status is
different. A missing revision digest is `PROOF_INCOMPLETE`; a present revision
digest that is malformed or mismatched is `DIGEST_INVALID`. A packet approval
binding mismatch is
`PACKET_APPROVAL_MISMATCH`.

`aggregate_validation` is the sole summary result for
`packet_revision_lineage`; no separate overall `validation` field is allowed.
It is `pass` only when all revision bindings and all edge validations pass.
Contradictory summary results are structurally invalid and fail with
`PROOF_INCOMPLETE`.

`proof_evidence_graph` is the separate dependency carrier for the bound
validated packet, context, packet revision lineage, approval payload,
artifact-evidence records, and proof record. Its `node_identity` values must
be unique. Every graph node declares `record_identity.field` and
`record_identity.value`; the field is `record_id` for records that have that
field and `packet_record_id` for `governed_packet_approval_payload`. The
approval node's identity uses the approved revision's `packet_record_id`
(`<packet-approved-id>`), not the validated revision's; `packet_binding` uses
`terminal_packet_record_id` (`<packet-validated-id>`). Validation must resolve
the declared identity field and value exactly on the bound record; it must not
assume every bound object has `record_id`. Repeated artifact `record_type`
values are valid when their node identities and resolved record identities are
distinct.

The approval node does not carry `approved_packet_digest` as an intrinsic
field; the approval payload itself is the RFC 8785 JCS digest target and
`proof.approval.approved_packet_digest` is the expected digest source. The
graph node therefore declares `digest_field: null` with
`digest_target: payload_is_digest_target` and
`expected_digest_source: proof.approval.approved_packet_digest`;
`digest_binding_validation` records whether the externally declared digest
matches the RFC 8785 JCS hash of the resolved payload record.

`allowed_relationships` is a normative enum with values sorted
lexicographically: `binds_approval_payload`, `binds_context`, `binds_packet`,
`binds_packet_revision_lineage`, and `contains_artifact_evidence`. Instance
proof graphs must use only these values and list them in the same order.

The graph is a containment graph, not packet revision history. It has exactly
one proof node with both `workflow_terminal: true` and `graph_root: true`, and
that node is the only null-digest node. The graph-root proof node has one
directed edge to each bound non-proof evidence node: packet, context, packet
revision lineage, approval payload, and every artifact record. Each edge is
unique by `(from_node_identity, to_node_identity, relationship)`, carries
`binding_validation`, and its relationship must be one of `binds_packet`,
`binds_context`, `binds_packet_revision_lineage`,
`binds_approval_payload`, or `contains_artifact_evidence`. Nodes sort
lexicographically by `node_identity`; edges sort lexicographically by
`from_node_identity`, `to_node_identity`, then `relationship`. Noncanonical
ordering fails with `PROOF_INCOMPLETE`.

All edge bindings, edge uniqueness, acyclic, and reachability checks must pass
before graph `validation` can pass; every non-proof node must be reachable from
the graph root. The proof-root node is the sole digest-value exception: it must
retain its correct proof identity and binding, and must declare the required
`digest_field`, but its `digest` must be exactly `null` to avoid self-reference;
that null is not compared with the proof record's non-null `content_digest`.
Every non-root graph node's type, declared identity, digest field, digest
domain, and digest must match its bound record. A missing required graph digest
field is `PROOF_INCOMPLETE`; for every non-root node, a present malformed or
mismatched digest is `DIGEST_INVALID`. Missing, structurally invalid, cyclic,
reordered, or substituted graph evidence is `PROOF_INCOMPLETE`.

The deterministic validation cases for this extension are:

1. Ordered artifacts with distinct record IDs and required-artifact/path
  bindings, including repeated `record_type`, pass when each exact byte length
  and payload digest binds to its canonical record and proof digest.
2. Removing, duplicating, or substituting an artifact record or graph node,
  or duplicating a graph `node_identity`, returns `PROOF_INCOMPLETE`.
3. A complete five-revision sequence passes only when every embedded or
  external-exact binding resolves, every edge matches both endpoint records,
  digests, statuses, `supersedes`, and transition, and `aggregate_validation`
  passes.
4. Removing, skipping, duplicating, reordering, cycling, or substituting a
  packet revision returns `PROOF_INCOMPLETE`.
5. Changing one payload byte, byte length, media-bound canonical field, JCS
  serialization, digest case, or digest value returns `DIGEST_INVALID`.
6. A missing required approval binding or `approved_packet_digest` returns
  `PROOF_INCOMPLETE`.
7. Changing approval-payload bytes without recomputing the declared digest,
  supplying a malformed `approved_packet_digest`, or supplying an
  `approved_packet_digest` that does not verify returns `DIGEST_INVALID`.
8. Only after the approval digest verifies, binding it to the wrong approved
  record, approved content digest, or approved worktree head returns
  `PACKET_APPROVAL_MISMATCH`.
9. Presenting a `1.1` proof to a consumer that supports only `1.0` returns
  `SCHEMA_UNSUPPORTED`; no silent field dropping or downgrade is permitted.
10. Empty `artifact_evidence` passes only with an empty
  `packet.required_artifacts`; a claimed artifact without evidence, a
  noncanonical collection order, an unresolved declared graph identity, or a
  graph node unreachable from the root returns `PROOF_INCOMPLETE`.

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
`pre_retrieval_manifest.context_budget` field-for-field. The shared proof
`approval` fields must equal the packet's `approval` fields, including
`approved_packet_digest` and `approved_content_digest`, and
`approval.approved_head_sha` must equal both the packet's validated worktree
head and the proof's validated worktree head. `approval.approved_packet_digest`
must equal the RFC 8785 JCS SHA-256 digest computed over the resolved approved revision's nested `approval_digest_payload`
only, where the revision is resolved from `proof.approval.approved_packet_record_id`. The verifier must not
hash the complete approved revision record, the terminal packet's payload, or
the record identified by `packet_binding.record_id`. Separately,
`approval.approved_content_digest` must equal the approved revision's
`content_digest` captured at approval time. A missing or unresolved required
binding or digest fails with `PROOF_INCOMPLETE`; a present malformed or
non-verifying digest, including changed payload bytes without recomputation,
fails with `DIGEST_INVALID`; only verified evidence bound to the wrong approved
record, approved content digest, or approved head fails with
`PACKET_APPROVAL_MISMATCH`. The proof-only fields
`approved_packet_record_id`, `terminal_packet_record_id`, and
`lineage_authorization_validation` derive from `packet_revision_lineage`; they
must not be required in `packet.approval`.
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
`packet_revision_lineage` must contain the five revisions and verify every
successive edge against the packet revision transition rules. Every revision
`record_id` must be unique, and no revision may be omitted, repeated, or
reused as a different status. `proof_evidence_graph` must contain unique node
identities; its graph-root proof node must be the only null-digest node.
`digest.target_record_id` must equal the proof `record_id`, while
`target_content_digest` must equal the proof `content_digest`; the digest
evidence itself is excluded from that target, so verification is not
self-referential. Each artifact evidence `canonical_record_digest` and the
packet revision lineage and proof evidence graph `canonical_record_digest`
must be verified over their declared carrier with only that carrier digest
field omitted. Each artifact
`payload_digest` must be verified independently over the exact bytes and its
`byte_length` must equal the byte count. Structured `warnings` and `unknowns`
are retained in the proof without being collapsed into free-form text.
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
3. **Digests:** RFC 8785 JCS plus SHA-256 is defined for context, packet,
  artifact, packet revision lineage, proof evidence graph, and proof targets,
  with explicit exclusions and target identifiers; exact payload-byte hashing
  remains a separate domain.
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

Each schema owns its own typed `failures[].code` enum. Unchanged cross-record
failure-code propagation is permitted only when every participating schema
admits that code. Context schema `1.0` and work-packet schema `1.0` do not
declare `SCHEMA_UNSUPPORTED`. Proof schema `1.1` declares it only for a proof
consumer that rejects an unsupported proof version before accepting or
interpreting the proof; when that rejection occurs, it is local to the
proof-verification result and is not propagated into the `1.0` context or work
packet. No new context or work-packet schema version is introduced by this
rule.

After proof-version support is established, the proof evidence failure matrix
is deterministic and uses the first matching condition in this order:

| Condition | Failure code |
| --- | --- |
| A required approval binding or digest is missing or unresolved | `PROOF_INCOMPLETE` |
| A supplied approval digest is malformed or does not verify, including changed payload bytes without recomputation | `DIGEST_INVALID` |
| Well-formed and cryptographically verified approval evidence is bound to the wrong approved record, approved content digest, or approved head | `PACKET_APPROVAL_MISMATCH` |
| A required canonical-record or payload-byte digest field is missing | `PROOF_INCOMPLETE` |
| A supplied canonical-record or payload-byte digest, or byte length, is malformed or does not verify | `DIGEST_INVALID` |
| Required artifact, artifact identity, media type, proof graph node, packet revision, edge, status, or `supersedes` evidence is missing or structurally invalid | `PROOF_INCOMPLETE` |
| Packet revision or proof graph contains a duplicate identity, skipped or reordered entry, substitution, backward reference, or cycle | `PROOF_INCOMPLETE` |

- **Approval:** use `APPROVAL_REQUIRED`, `APPROVAL_INVALID`, or
  `APPROVAL_HEAD_MISMATCH` when affirmative approval, reviewer identity,
  timestamp, disposition, or exact head binding is absent or invalid.
- **Packet approval:** use `PACKET_APPROVAL_MISMATCH` only when well-formed,
  cryptographically verified approval evidence is bound to the wrong approved
  record, approved content digest, or approved head. A malformed or
  non-verifying approval digest, including changed payload bytes without
  recomputation, is `DIGEST_INVALID`; a missing or unresolved required approval
  binding or digest is `PROOF_INCOMPLETE`.
- **Budget:** use `BUDGET_EXCEEDED` when any declared entity, lineage depth,
  lineage edge, record, token, freshness, or timeout limit is exceeded.
- **Digest:** a missing required digest field is `PROOF_INCOMPLETE`; use
  `DIGEST_INVALID` only when a supplied digest or byte length is malformed or
  fails RFC 8785 canonicalization or SHA-256 verification.
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
- **Artifact and lineage evidence:** apply the deterministic proof evidence
  failure matrix above. Repeated artifact `record_type` is valid when record
  and node identity are unique; repeated identity is not.
- **Schema compatibility:** a proof consumer uses `SCHEMA_UNSUPPORTED` before
  accepting or interpreting an unsupported proof schema version; never drop
  unknown evidence fields or silently downgrade a `1.1` proof to `1.0`.
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

Failure codes are stable interface values. When a failure is recorded across
the envelope, packet, and proof, its unchanged code may be carried only where
every participating schema admits it; free-form messages may add detail but may
not replace an admitted code. A code that is not admitted by another
participating schema remains local to the result whose schema admits it, as
with proof-only `SCHEMA_UNSUPPORTED`. Any failure affecting approval, packet
approval, budget, digest, worktree, freshness, inventory, authority, retrieval
evidence, or proof blocks `executing` and `validated`.

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
