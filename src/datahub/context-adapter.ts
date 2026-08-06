/**
 * Authority classifications for context evidence.
 */
export type AuthorityState = "approved" | "planning_only" | "quarantined" | "unknown";

/**
 * Provenance details that keep evidence traceable and reviewable.
 */
export interface SourceReference {
  id: string;
  title: string;
  canonicalUrl?: string;
  sourceType: string;
  retrievedAt: string;
}

/**
 * Source-neutral context item used by downstream governance logic.
 */
export interface NormalizedContextRecord {
  id: string;
  title: string;
  summary: string;
  authority: AuthorityState;
  provenance: SourceReference[];
  tags: string[];
  constraints: string[];
  blockedUses: string[];
}

/**
 * Bounded implementation proposal that always requires human approval.
 */
export interface WorkPacket {
  objective: string;
  currentContext: NormalizedContextRecord[];
  allowedScope: string[];
  blockedScope: string[];
  requiredValidation: string[];
  unknowns: string[];
  sourceReferences: SourceReference[];
  humanApprovalRequired: true;
}

/**
 * Converts source-specific metadata into source-neutral context records.
 */
export interface ContextAdapter<TSource> {
  normalize(source: TSource): NormalizedContextRecord[];
}

interface SyntheticDataHubEntity {
  urn?: unknown;
  title?: unknown;
  description?: unknown;
  authority?: unknown;
  tags?: unknown;
  constraints?: unknown;
  blockedUses?: unknown;
  sourceType?: unknown;
  canonicalUrl?: unknown;
  retrievedAt?: unknown;
}

interface SyntheticDataHubResponse {
  entities?: unknown;
}

/**
 * Defensive adapter for a small synthetic DataHub response shape.
 * Expected shape: { entities: Array<{ urn, title, description, ... }> }
 */
export class DataHubContextAdapter implements ContextAdapter<unknown> {
  public normalize(source: unknown): NormalizedContextRecord[] {
    if (!this.isRecord(source)) {
      return [];
    }

    const entities = this.extractEntities(source as SyntheticDataHubResponse);
    const normalized: NormalizedContextRecord[] = [];

    for (const entity of entities) {
      const record = this.normalizeEntity(entity);
      if (record) {
        normalized.push(record);
      }
    }

    return normalized;
  }

  private extractEntities(source: SyntheticDataHubResponse): unknown[] {
    if (!Array.isArray(source.entities)) {
      return [];
    }

    return source.entities;
  }

  private normalizeEntity(entity: unknown): NormalizedContextRecord | undefined {
    if (!this.isRecord(entity)) {
      // Skip malformed entity because it cannot be read safely.
      return undefined;
    }

    const typedEntity = entity as SyntheticDataHubEntity;
    const id = this.asNonEmptyString(typedEntity.urn);
    if (!id) {
      // Skip entities that do not provide a stable identifier / URN.
      return undefined;
    }

    const title = this.asNonEmptyString(typedEntity.title) ?? `Untitled record ${id}`;
    const summary = this.asNonEmptyString(typedEntity.description) ?? "No summary available.";
    const sourceType = this.asNonEmptyString(typedEntity.sourceType) ?? "datahub";
    const canonicalUrl = this.asNonEmptyString(typedEntity.canonicalUrl);
    const retrievedAt = this.asIsoTimestamp(typedEntity.retrievedAt);

    if (!retrievedAt) {
      // Skip when retrieval metadata is absent; provenance is required.
      return undefined;
    }

    const provenance: SourceReference[] = [
      {
        id,
        title,
        sourceType,
        retrievedAt,
        ...(canonicalUrl ? { canonicalUrl } : {})
      }
    ];

    const authority = this.normalizeAuthority(typedEntity.authority);
    const constraints = this.asStringArray(typedEntity.constraints);
    const blockedUsesFromSource = this.asStringArray(typedEntity.blockedUses);
    const blockedUses = this.mergeBlockedUses(authority, blockedUsesFromSource);

    return {
      id,
      title,
      summary,
      authority,
      provenance,
      tags: this.asStringArray(typedEntity.tags),
      constraints,
      blockedUses
    };
  }

  private normalizeAuthority(rawAuthority: unknown): AuthorityState {
    if (rawAuthority === "approved") {
      return "approved";
    }

    if (rawAuthority === "planning_only") {
      return "planning_only";
    }

    if (rawAuthority === "quarantined") {
      return "quarantined";
    }

    return "unknown";
  }

  private mergeBlockedUses(
    authority: AuthorityState,
    blockedUsesFromSource: string[]
  ): string[] {
    const blockedUses = new Set(blockedUsesFromSource);

    if (authority === "unknown") {
      blockedUses.add("Do not use as implementation authority.");
      blockedUses.add("Do not use for deployment approval.");
    } else if (authority === "planning_only") {
      blockedUses.add("Do not use to approve implementation without approved evidence.");
      blockedUses.add("Do not use for deployment approval.");
    } else if (authority === "quarantined") {
      blockedUses.add("Do not use in planning or implementation decisions.");
      blockedUses.add("Do not use for deployment approval.");
    }

    return [...blockedUses];
  }

  private asStringArray(input: unknown): string[] {
    if (!Array.isArray(input)) {
      return [];
    }

    const result: string[] = [];
    for (const value of input) {
      const normalized = this.asNonEmptyString(value);
      if (normalized) {
        result.push(normalized);
      }
    }

    return result;
  }

  private asIsoTimestamp(input: unknown): string | undefined {
    const value = this.asNonEmptyString(input);
    if (!value) {
      return undefined;
    }

    const parsed = Date.parse(value);
    if (Number.isNaN(parsed)) {
      return undefined;
    }

    return new Date(parsed).toISOString();
  }

  private asNonEmptyString(input: unknown): string | undefined {
    if (typeof input !== "string") {
      return undefined;
    }

    const trimmed = input.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  private isRecord(input: unknown): input is Record<string, unknown> {
    return typeof input === "object" && input !== null;
  }
}


// ---------------------------------------------------------------------------
// Official-MCP recorded-response contract harness (read-only)
// Additive surface for Issue #23. Does not replace the fixture demo adapter.
// ---------------------------------------------------------------------------
import {
  type DataHubDatasetContent,
  type FreshnessStatus,
  type McpAttribution,
  METADATA_FRESHNESS_POLICY,
  type McpProvenance,
  type McpSourceIdentity,
  type McpToolIdentity,
  type RetrievalMode,
  type RetrievalResult,
  retrieveReadonly,
  sha256Hex,
  stableJsonStringify,
  type RetrieveReadonlyOptions,
} from "./mcp-client.js";

export const NORMALIZED_RECORD_SCHEMA_VERSION = 'normalized-context-record/v1';
export const WORK_PACKET_SCHEMA_VERSION = 'datahub-mcp-readonly-work-packet/v1';
export const DERIVATION_POLICY_VERSION = 'datahub-mcp-readonly-derivation/v1';

export interface AuthorityClassification {
  record_status: 'FIXTURE' | 'MCP_READONLY_RECORDED';
  source_binding_status: 'LOCALLY_MATERIALIZED' | 'MCP_READONLY_RECORDED_LOCAL';
  consumer_eligibility: 'PROPOSED';
  runtime_retrieval_status: 'UNKNOWN';
}

export interface McpReadonlyNormalizedContextRecord {
  schema_version: typeof NORMALIZED_RECORD_SCHEMA_VERSION;
  derivation_policy_version: typeof DERIVATION_POLICY_VERSION;
  retrieval_mode: RetrievalMode;
  authority: AuthorityClassification;
  source: McpSourceIdentity;
  tool: McpToolIdentity;
  attribution: McpAttribution;
  provenance: McpProvenance;
  /** Data-only payload copied from retrieval content. */
  data: DataHubDatasetContent;
  digests: {
    content_digest: string;
    envelope_digest: string;
    normalized_record_digest: string;
  };
  identities: {
    fixture_or_source_packet_id: string;
    proposed_mg_packet_id: string;
    runtime_packet_id: null;
  };
}

export interface McpReadonlyWorkPacket {
  packet_type: 'datahub_mcp_readonly_work_packet';
  schema_version: typeof WORK_PACKET_SCHEMA_VERSION;
  derivation_policy_version: typeof DERIVATION_POLICY_VERSION;
  objective: string;
  human_approval_required: true;
  retrieval: {
    mode: RetrievalMode;
    source_identity: string;
    tool_identity: string;
    attribution: McpAttribution;
    provenance: McpProvenance;
    content_digest: string;
    response_path: string;
  };
  authority: AuthorityClassification;
  normalized_context: {
    dataset_urn: string;
    platform: string;
    name: string;
    description: string;
    ownership: DataHubDatasetContent['ownership'];
    schema_field_names: string[];
    required_field_names: string[];
    upstream_dataset_urns: string[];
    sensitivity: string;
    quality_assertion_types: string[];
  };
  digests: {
    content_digest: string;
    normalized_record_digest: string;
    /**
     * SHA-256 of the canonical WorkPacket body *before* this digest field is
     * embedded (pre-final packet content). Distinct from artifact_sha256.
     */
    packet_content_digest: string;
  };
  allowed_actions: string[];
  blocked_actions: string[];
  validation_commands: string[];
  stop_condition: string;
  unknowns: string[];
}

export interface McpReadonlyWorkPacketArtifact {
  packet: McpReadonlyWorkPacket;
  text: string;
  /**
   * SHA-256 of the complete serialized WorkPacket file bytes (`text`).
   * This is the artifact integrity hash, not the pre-final packet_content_digest.
   */
  artifact_sha256: string;
}

export interface McpReadonlyNormalizedRecordArtifact {
  record: McpReadonlyNormalizedContextRecord;
  text: string;
  sha256: string;
}

function normalizePlatform(platform: string): string {
  return platform
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildSourcePacketId(mode: RetrievalMode, platform: string, contentDigest: string): string {
  const normalized = normalizePlatform(platform);
  const prefix = mode === 'mcp' ? 'mcp-readonly-recorded' : 'fixture';
  return `${prefix}:datahub:${normalized}:${contentDigest}`;
}

function classifyAuthority(mode: RetrievalMode): AuthorityClassification {
  if (mode === 'mcp') {
    return {
      record_status: 'MCP_READONLY_RECORDED',
      source_binding_status: 'MCP_READONLY_RECORDED_LOCAL',
      consumer_eligibility: 'PROPOSED',
      runtime_retrieval_status: 'UNKNOWN',
    };
  }
  return {
    record_status: 'FIXTURE',
    source_binding_status: 'LOCALLY_MATERIALIZED',
    consumer_eligibility: 'PROPOSED',
    runtime_retrieval_status: 'UNKNOWN',
  };
}

/**
 * Consume a retrieval result into an authority-aware NormalizedContextRecord.
 * Content remains data-only; attribution/provenance are preserved beside it.
 */
export function normalizeRetrieval(result: RetrievalResult): McpReadonlyNormalizedRecordArtifact {
  const authority = classifyAuthority(result.mode);
  const withoutDigest: Omit<McpReadonlyNormalizedContextRecord, 'digests'> & {
    digests: Omit<McpReadonlyNormalizedContextRecord['digests'], 'normalized_record_digest'> & {
      normalized_record_digest?: string;
    };
  } = {
    schema_version: NORMALIZED_RECORD_SCHEMA_VERSION,
    derivation_policy_version: DERIVATION_POLICY_VERSION,
    retrieval_mode: result.mode,
    authority,
    source: result.source,
    tool: result.tool,
    attribution: result.attribution,
    provenance: result.provenance,
    data: {
      dataset_urn: result.content.dataset_urn,
      platform: result.content.platform,
      name: result.content.name,
      description: result.content.description,
      ownership: { ...result.content.ownership },
      schema: {
        fields: result.content.schema.fields.map((field) => ({ ...field })),
      },
      upstream_lineage: result.content.upstream_lineage.map((edge) => ({ ...edge })),
      governance_labels: { ...result.content.governance_labels },
      quality_assertions: result.content.quality_assertions.map((assertion) => ({ ...assertion })),
    },
    digests: {
      content_digest: result.content_digest,
      envelope_digest: result.envelope_digest,
    },
    identities: {
      fixture_or_source_packet_id: buildSourcePacketId(
        result.mode,
        result.content.platform,
        result.content_digest,
      ),
      proposed_mg_packet_id: 'PROPOSED:packet:mg-mcp:datahub-mcp-readonly:20260806:0001',
      runtime_packet_id: null,
    },
  };

  const draftText = stableJsonStringify(withoutDigest);
  const normalized_record_digest = sha256Hex(draftText);
  const record: McpReadonlyNormalizedContextRecord = {
    ...withoutDigest,
    digests: {
      content_digest: result.content_digest,
      envelope_digest: result.envelope_digest,
      normalized_record_digest,
    },
  };
  const text = stableJsonStringify(record);
  return {
    record,
    text,
    sha256: sha256Hex(text),
  };
}

export function buildMcpReadonlyWorkPacket(record: McpReadonlyNormalizedContextRecord): McpReadonlyWorkPacketArtifact {
  const requiredFieldNames = record.data.schema.fields
    .filter((field) => field.required)
    .map((field) => field.name);

  const packetWithoutDigest: Omit<McpReadonlyWorkPacket, 'digests'> & {
    digests: Omit<McpReadonlyWorkPacket['digests'], 'packet_content_digest'> & {
      packet_content_digest?: string;
    };
  } = {
    packet_type: 'datahub_mcp_readonly_work_packet',
    schema_version: WORK_PACKET_SCHEMA_VERSION,
    derivation_policy_version: DERIVATION_POLICY_VERSION,
    objective:
      'Exercise the official-MCP recorded-response contract harness: normalize one recorded DataHub MCP read-only response into a governed NormalizedContextRecord and deterministic WorkPacket while preserving attribution, provenance, authority state, and fail-closed behavior. No live MCP connection or official tool invocation has yet occurred.',
    human_approval_required: true,
    retrieval: {
      mode: record.retrieval_mode,
      source_identity: record.source.identity,
      tool_identity: record.tool.identity,
      attribution: { ...record.attribution },
      provenance: { ...record.provenance },
      content_digest: record.digests.content_digest,
      response_path: record.provenance.response_path ?? 'UNKNOWN',
    },
    authority: { ...record.authority },
    normalized_context: {
      dataset_urn: record.data.dataset_urn,
      platform: record.data.platform,
      name: record.data.name,
      description: record.data.description,
      ownership: { ...record.data.ownership },
      schema_field_names: record.data.schema.fields.map((field) => field.name),
      required_field_names: requiredFieldNames,
      upstream_dataset_urns: record.data.upstream_lineage.map((edge) => edge.dataset_urn),
      sensitivity: record.data.governance_labels.sensitivity,
      quality_assertion_types: record.data.quality_assertions.map((assertion) => assertion.type),
    },
    digests: {
      content_digest: record.digests.content_digest,
      normalized_record_digest: record.digests.normalized_record_digest,
    },
    allowed_actions: [
      'inspect_recorded_mcp_readonly_response',
      'normalize_context_record',
      'generate_work_packet',
      'emit_local_proof_summary',
    ],
    blocked_actions: [
      'datahub_write',
      'mg_mcp_write',
      'live_network_mcp_without_authorization',
      'production_credentials',
      'deployment',
      'iam_mutation',
      'oauth_bootstrap',
      'secret_materialization',
      'autonomous_github_mutation',
      'resolver_changes',
    ],
    validation_commands: [
      'npm ci',
      'npm run typecheck',
      'npm test',
      'npm run build',
      'npm run demo:json',
      'node --test dist/tests/datahub-mcp-readonly.test.js',
      'git diff --check',
    ],
    stop_condition:
      'Stop after the official-MCP recorded-response contract harness proof is ready for independent review. Do not connect live DataHub MCP, invoke official tools, store credentials, deploy, mutate IAM/OAuth, or expand beyond the lane allowed scope.',
    unknowns: [
      'pending live pass: actual tools/list from a live official DataHub MCP server',
      'pending live pass: actual server/connection identity',
      'pending live pass: actual read-tool identity (recorded tool_identity is a fixture contract label, not discovered inventory)',
      'pending live pass: one isolated read-only call over a live MCP connection',
      'recorded harness enforces ATTRIBUTION_CONFLICT for owner_team/data_governance_owner mismatches; live-server conflict policy remains pending',
      'metadata freshness policy remains UNKNOWN until an explicit window is approved (no freshness threshold invented)',
      'pending live pass: public-repository implementation and CI',
      'whether a future authorized live MCP endpoint will emit byte-identical envelopes',
      'whether MG MCP search will surface a runtime packet identity for this recorded response',
      'approved consumers beyond PROPOSED eligibility',
      'downstream consumers not present in recorded content',
    ],
  };

  // packet_content_digest = hash of pre-final packet body (without this field embedded).
  const draftText = stableJsonStringify(packetWithoutDigest);
  const packet_content_digest = sha256Hex(draftText);
  const packet: McpReadonlyWorkPacket = {
    ...packetWithoutDigest,
    human_approval_required: true,
    digests: {
      content_digest: record.digests.content_digest,
      normalized_record_digest: record.digests.normalized_record_digest,
      packet_content_digest,
    },
  };
  // artifact_sha256 = hash of the complete serialized file bytes.
  const text = stableJsonStringify(packet);
  return {
    packet,
    text,
    artifact_sha256: sha256Hex(text),
  };
}

export interface PipelineResult {
  retrieval: RetrievalResult;
  normalized: McpReadonlyNormalizedRecordArtifact;
  workPacket: McpReadonlyWorkPacketArtifact;
}

export function runReadonlyContextPipeline(
  options: RetrieveReadonlyOptions = {},
): PipelineResult {
  const retrieval = retrieveReadonly(options);
  const normalized = normalizeRetrieval(retrieval);
  const workPacket = buildMcpReadonlyWorkPacket(normalized.record);
  return { retrieval, normalized, workPacket };
}

export interface ProofSummary {
  status: 'PASS' | 'FAIL';
  harness_class: 'official-mcp-recorded-response-contract-harness';
  retrieval_mode: RetrievalMode;
  source_identity: string;
  tool_identity: string;
  attribution: McpAttribution;
  content_digest: string;
  normalized_record_digest: string;
  /** Pre-final WorkPacket body digest (matches packet.digests.packet_content_digest). */
  packet_content_digest: string;
  /** Complete serialized WorkPacket file hash (matches workPacket.artifact_sha256). */
  artifact_sha256: string;
  freshness_status: FreshnessStatus;
  freshness_policy: typeof METADATA_FRESHNESS_POLICY;
  validation_result: {
    ok: boolean;
    human_approval_required: boolean;
    authority_consumer_eligibility: string;
    runtime_retrieval_status: string;
    freshness_status: FreshnessStatus;
    errors: string[];
  };
  response_path: string;
  notes: string[];
}

export function buildProofSummary(result: PipelineResult): ProofSummary {
  const errors: string[] = [];
  if (result.workPacket.packet.human_approval_required !== true) {
    errors.push('human_approval_required must be true');
  }
  if (result.normalized.record.authority.consumer_eligibility !== 'PROPOSED') {
    errors.push('consumer_eligibility must remain PROPOSED');
  }
  if (result.normalized.record.authority.runtime_retrieval_status !== 'UNKNOWN') {
    errors.push('runtime_retrieval_status must remain UNKNOWN in this slice');
  }
  if (!result.retrieval.attribution.owner_team) {
    errors.push('attribution.owner_team missing');
  }
  if (
    result.workPacket.artifact_sha256 ===
    result.workPacket.packet.digests.packet_content_digest
  ) {
    errors.push(
      'artifact_sha256 must differ from packet_content_digest (final file vs pre-final body)',
    );
  }
  if (!result.workPacket.packet.digests.packet_content_digest) {
    errors.push('packet_content_digest missing');
  }
  if (!result.workPacket.artifact_sha256) {
    errors.push('artifact_sha256 missing');
  }

  if (result.retrieval.freshness_status !== 'UNKNOWN') {
    errors.push('freshness_status must remain UNKNOWN until a freshness policy is approved');
  }

  const ok = errors.length === 0;
  return {
    status: ok ? 'PASS' : 'FAIL',
    harness_class: 'official-mcp-recorded-response-contract-harness',
    retrieval_mode: result.retrieval.mode,
    source_identity: result.retrieval.source.identity,
    tool_identity: result.retrieval.tool.identity,
    attribution: { ...result.retrieval.attribution },
    content_digest: result.retrieval.content_digest,
    normalized_record_digest: result.normalized.record.digests.normalized_record_digest,
    packet_content_digest: result.workPacket.packet.digests.packet_content_digest,
    artifact_sha256: result.workPacket.artifact_sha256,
    freshness_status: result.retrieval.freshness_status,
    freshness_policy: result.retrieval.freshness_policy,
    validation_result: {
      ok,
      human_approval_required: result.workPacket.packet.human_approval_required,
      authority_consumer_eligibility: result.normalized.record.authority.consumer_eligibility,
      runtime_retrieval_status: result.normalized.record.authority.runtime_retrieval_status,
      freshness_status: result.retrieval.freshness_status,
      errors,
    },
    response_path: result.retrieval.response_path,
    notes: [
      'This path is an official-MCP recorded-response contract harness.',
      'No live MCP connection or official tool invocation has yet occurred.',
      'Recorded source_identity and tool_identity are fixture contract labels, not discovered server inventory.',
      'Retrieved content is data only; attribution and provenance are captured beside content.',
      'Fixture mode is the safe default; MCP mode is explicit and still uses a local recorded response in this slice.',
      'packet_content_digest hashes the pre-final WorkPacket body; artifact_sha256 hashes the complete serialized file.',
      'Metadata freshness_status is UNKNOWN; no freshness window is invented without approved policy.',
      'No credentials, tokens, private endpoints, or production identifiers are included.',
      'Human approval remains required before any downstream execution.',
    ],
  };
}
