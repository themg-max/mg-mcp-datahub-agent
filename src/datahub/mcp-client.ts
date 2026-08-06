import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export type RetrievalMode = 'fixture' | 'mcp';

export interface McpSourceIdentity {
  identity: string;
  system: string;
  environment: string;
}

export interface McpToolIdentity {
  identity: string;
  name: string;
  version: string;
  operation: 'read';
}

export interface McpAttribution {
  owner_team: string;
  data_governance_owner: string;
  retrieved_by: string;
  license_or_use_constraint: string;
  sla_contact?: string;
}

export interface McpProvenance {
  retrieved_at: string;
  request_id: string;
  content_encoding: string;
  transport: string;
  response_path?: string;
}

/**
 * Metadata freshness policy for retrieved envelopes.
 *
 * No approved freshness window exists for this recorded-response harness.
 * Until a separate authority approves an explicit policy, freshness remains
 * UNKNOWN and is never inferred from wall-clock age.
 */
export type FreshnessStatus = 'UNKNOWN';

export const METADATA_FRESHNESS_POLICY =
  'UNKNOWN until approved — no freshness window is authorized for this harness';

export const REQUIRED_RECORDED_CONTRACT_CLASS =
  'official-datahub-mcp-readonly-recorded-response';

export interface DataHubDatasetContent {
  dataset_urn: string;
  platform: string;
  name: string;
  description: string;
  ownership: {
    owner_team: string;
    data_governance_owner: string;
    sla_contact?: string;
  };
  schema: {
    fields: Array<{
      name: string;
      type: string;
      required: boolean;
      nullable: boolean;
      description: string;
    }>;
  };
  upstream_lineage: Array<{
    dataset_urn: string;
    transformation: string;
  }>;
  governance_labels: {
    sensitivity: string;
    retention_days: number;
    requires_audit_log: boolean;
    encryption_at_rest: string;
  };
  quality_assertions: Array<Record<string, unknown> & { type: string }>;
}

export interface OfficialMcpReadonlyResponse {
  contract_class: string;
  retrieval_mode: string;
  source: McpSourceIdentity;
  tool: McpToolIdentity;
  attribution: McpAttribution;
  provenance: McpProvenance;
  content: DataHubDatasetContent;
}

export interface RetrievalResult {
  mode: RetrievalMode;
  response_path: string;
  source: McpSourceIdentity;
  tool: McpToolIdentity;
  attribution: McpAttribution;
  provenance: McpProvenance;
  content: DataHubDatasetContent;
  raw_response: OfficialMcpReadonlyResponse;
  content_digest: string;
  envelope_digest: string;
  /**
   * Freshness evaluation for retrieved metadata.
   * Always UNKNOWN until an explicit freshness window is approved.
   */
  freshness_status: FreshnessStatus;
  freshness_policy: typeof METADATA_FRESHNESS_POLICY;
}

export class McpReadonlyError extends Error {
  code: string;
  details: Record<string, unknown>;

  constructor(code: string, message: string, details: Record<string, unknown> = {}) {
    super(message);
    this.name = 'McpReadonlyError';
    this.code = code;
    this.details = details;
  }
}

export const DEFAULT_MCP_READONLY_FIXTURE_REL_PATH =
  'fixtures/datahub-mcp-readonly-response.json';

export function sha256Hex(input: string | Buffer): string {
  return createHash('sha256').update(input).digest('hex');
}

export function stableJsonStringify(value: unknown): string {
  return `${JSON.stringify(sortKeysDeep(value), null, 2)}\n`;
}

/**
 * Deep-canonicalize plain objects for deterministic JSON.
 *
 * Own keys named `__proto__`, `constructor`, and `prototype` are preserved as
 * ordinary enumerable data keys (not as special prototype mutations). Repeated
 * serialization of the same logical value must remain byte-identical.
 */
function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeysDeep);
  }
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    // null-prototype + defineProperty avoids `__proto__` assignment side effects.
    const out = Object.create(null) as Record<string, unknown>;
    const keys = Reflect.ownKeys(value as object)
      .filter((key): key is string => typeof key === 'string')
      .sort();
    for (const key of keys) {
      Object.defineProperty(out, key, {
        value: sortKeysDeep((value as Record<string | symbol, unknown>)[key]),
        enumerable: true,
        writable: true,
        configurable: true,
      });
    }
    return out;
  }
  return value;
}

function assertPlainObject(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new McpReadonlyError('INVALID_TYPE', `${label} must be an object`, { label });
  }
}

function assertNonEmptyString(value: unknown, label: string): asserts value is string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new McpReadonlyError(
      'MISSING_REQUIRED_FIELD',
      `${label} is required and must be a non-empty string`,
      { label },
    );
  }
}

function assertBoolean(value: unknown, label: string): asserts value is boolean {
  if (typeof value !== 'boolean') {
    throw new McpReadonlyError('INVALID_TYPE', `${label} must be a boolean`, { label });
  }
}

function assertAttribution(raw: unknown): McpAttribution {
  assertPlainObject(raw, 'attribution');
  assertNonEmptyString(raw.owner_team, 'attribution.owner_team');
  assertNonEmptyString(raw.data_governance_owner, 'attribution.data_governance_owner');
  assertNonEmptyString(raw.retrieved_by, 'attribution.retrieved_by');
  assertNonEmptyString(raw.license_or_use_constraint, 'attribution.license_or_use_constraint');

  const attribution: McpAttribution = {
    owner_team: raw.owner_team,
    data_governance_owner: raw.data_governance_owner,
    retrieved_by: raw.retrieved_by,
    license_or_use_constraint: raw.license_or_use_constraint,
  };
  if (raw.sla_contact !== undefined) {
    assertNonEmptyString(raw.sla_contact, 'attribution.sla_contact');
    attribution.sla_contact = raw.sla_contact;
  }
  return attribution;
}

function assertSource(raw: unknown): McpSourceIdentity {
  assertPlainObject(raw, 'source');
  assertNonEmptyString(raw.identity, 'source.identity');
  assertNonEmptyString(raw.system, 'source.system');
  assertNonEmptyString(raw.environment, 'source.environment');
  return {
    identity: raw.identity,
    system: raw.system,
    environment: raw.environment,
  };
}

function assertTool(raw: unknown): McpToolIdentity {
  assertPlainObject(raw, 'tool');
  assertNonEmptyString(raw.identity, 'tool.identity');
  assertNonEmptyString(raw.name, 'tool.name');
  assertNonEmptyString(raw.version, 'tool.version');
  if (raw.operation !== 'read') {
    throw new McpReadonlyError(
      'NON_READONLY_OPERATION',
      'tool.operation must be exactly "read" for this slice',
      { operation: raw.operation },
    );
  }
  return {
    identity: raw.identity,
    name: raw.name,
    version: raw.version,
    operation: 'read',
  };
}

function assertIso8601Timestamp(value: string, label: string): void {
  // Require RFC3339 / ISO-8601 date-time with timezone. Reject free-form
  // strings such as "invalid" even when non-empty.
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,9})?)?(Z|[+-]\d{2}:\d{2})$/.test(value) ||
    Number.isNaN(Date.parse(value))
  ) {
    throw new McpReadonlyError(
      'INVALID_PROVENANCE',
      `${label} must be a valid ISO-8601 timestamp`,
      { label, value },
    );
  }
}

function assertProvenance(raw: unknown): McpProvenance {
  assertPlainObject(raw, 'provenance');
  assertNonEmptyString(raw.retrieved_at, 'provenance.retrieved_at');
  assertIso8601Timestamp(raw.retrieved_at, 'provenance.retrieved_at');
  assertNonEmptyString(raw.request_id, 'provenance.request_id');
  assertNonEmptyString(raw.content_encoding, 'provenance.content_encoding');
  assertNonEmptyString(raw.transport, 'provenance.transport');
  const provenance: McpProvenance = {
    retrieved_at: raw.retrieved_at,
    request_id: raw.request_id,
    content_encoding: raw.content_encoding,
    transport: raw.transport,
  };
  if (raw.response_path !== undefined) {
    assertNonEmptyString(raw.response_path, 'provenance.response_path');
    provenance.response_path = raw.response_path;
  }
  return provenance;
}

function assertAttributionContentConsistency(
  attribution: McpAttribution,
  content: DataHubDatasetContent,
): void {
  const conflicts: Array<{ field: string; attribution: string; content: string }> = [];
  if (attribution.owner_team !== content.ownership.owner_team) {
    conflicts.push({
      field: 'owner_team',
      attribution: attribution.owner_team,
      content: content.ownership.owner_team,
    });
  }
  if (attribution.data_governance_owner !== content.ownership.data_governance_owner) {
    conflicts.push({
      field: 'data_governance_owner',
      attribution: attribution.data_governance_owner,
      content: content.ownership.data_governance_owner,
    });
  }
  if (
    attribution.sla_contact !== undefined &&
    content.ownership.sla_contact !== undefined &&
    attribution.sla_contact !== content.ownership.sla_contact
  ) {
    conflicts.push({
      field: 'sla_contact',
      attribution: attribution.sla_contact,
      content: content.ownership.sla_contact,
    });
  }
  if (conflicts.length > 0) {
    throw new McpReadonlyError(
      'ATTRIBUTION_CONFLICT',
      'attribution fields conflict with content.ownership; refusing to normalize',
      { conflicts },
    );
  }
}

function assertContent(raw: unknown): DataHubDatasetContent {
  assertPlainObject(raw, 'content');
  assertNonEmptyString(raw.dataset_urn, 'content.dataset_urn');
  assertNonEmptyString(raw.platform, 'content.platform');
  assertNonEmptyString(raw.name, 'content.name');
  assertNonEmptyString(raw.description, 'content.description');

  assertPlainObject(raw.ownership, 'content.ownership');
  assertNonEmptyString(raw.ownership.owner_team, 'content.ownership.owner_team');
  assertNonEmptyString(
    raw.ownership.data_governance_owner,
    'content.ownership.data_governance_owner',
  );

  assertPlainObject(raw.schema, 'content.schema');
  if (!Array.isArray(raw.schema.fields) || raw.schema.fields.length === 0) {
    throw new McpReadonlyError(
      'MISSING_REQUIRED_FIELD',
      'content.schema.fields must be a non-empty array',
      { label: 'content.schema.fields' },
    );
  }

  const fields = raw.schema.fields.map((field, index) => {
    assertPlainObject(field, `content.schema.fields[${index}]`);
    assertNonEmptyString(field.name, `content.schema.fields[${index}].name`);
    assertNonEmptyString(field.type, `content.schema.fields[${index}].type`);
    assertBoolean(field.required, `content.schema.fields[${index}].required`);
    assertBoolean(field.nullable, `content.schema.fields[${index}].nullable`);
    assertNonEmptyString(field.description, `content.schema.fields[${index}].description`);
    return {
      name: field.name,
      type: field.type,
      required: field.required,
      nullable: field.nullable,
      description: field.description,
    };
  });

  if (!Array.isArray(raw.upstream_lineage)) {
    throw new McpReadonlyError('INVALID_TYPE', 'content.upstream_lineage must be an array', {
      label: 'content.upstream_lineage',
    });
  }
  const upstream = raw.upstream_lineage.map((edge, index) => {
    assertPlainObject(edge, `content.upstream_lineage[${index}]`);
    assertNonEmptyString(edge.dataset_urn, `content.upstream_lineage[${index}].dataset_urn`);
    assertNonEmptyString(
      edge.transformation,
      `content.upstream_lineage[${index}].transformation`,
    );
    return {
      dataset_urn: edge.dataset_urn,
      transformation: edge.transformation,
    };
  });

  assertPlainObject(raw.governance_labels, 'content.governance_labels');
  assertNonEmptyString(raw.governance_labels.sensitivity, 'content.governance_labels.sensitivity');
  if (
    typeof raw.governance_labels.retention_days !== 'number' ||
    !Number.isInteger(raw.governance_labels.retention_days) ||
    raw.governance_labels.retention_days < 0
  ) {
    throw new McpReadonlyError(
      'INVALID_TYPE',
      'content.governance_labels.retention_days must be a non-negative integer',
      { label: 'content.governance_labels.retention_days' },
    );
  }
  assertBoolean(
    raw.governance_labels.requires_audit_log,
    'content.governance_labels.requires_audit_log',
  );
  assertNonEmptyString(
    raw.governance_labels.encryption_at_rest,
    'content.governance_labels.encryption_at_rest',
  );

  if (!Array.isArray(raw.quality_assertions) || raw.quality_assertions.length === 0) {
    throw new McpReadonlyError(
      'MISSING_REQUIRED_FIELD',
      'content.quality_assertions must be a non-empty array',
      { label: 'content.quality_assertions' },
    );
  }
  const quality = raw.quality_assertions.map((assertion, index) => {
    assertPlainObject(assertion, `content.quality_assertions[${index}]`);
    assertNonEmptyString(assertion.type, `content.quality_assertions[${index}].type`);
    return { ...assertion, type: assertion.type } as DataHubDatasetContent['quality_assertions'][number];
  });

  const ownership: DataHubDatasetContent['ownership'] = {
    owner_team: raw.ownership.owner_team,
    data_governance_owner: raw.ownership.data_governance_owner,
  };
  if (raw.ownership.sla_contact !== undefined) {
    assertNonEmptyString(raw.ownership.sla_contact, 'content.ownership.sla_contact');
    ownership.sla_contact = raw.ownership.sla_contact;
  }

  return {
    dataset_urn: raw.dataset_urn,
    platform: raw.platform,
    name: raw.name,
    description: raw.description,
    ownership,
    schema: { fields },
    upstream_lineage: upstream,
    governance_labels: {
      sensitivity: raw.governance_labels.sensitivity,
      retention_days: raw.governance_labels.retention_days,
      requires_audit_log: raw.governance_labels.requires_audit_log,
      encryption_at_rest: raw.governance_labels.encryption_at_rest,
    },
    quality_assertions: quality,
  };
}

export function parseOfficialMcpReadonlyResponse(raw: unknown): OfficialMcpReadonlyResponse {
  assertPlainObject(raw, 'mcp readonly response root');
  assertNonEmptyString(raw.contract_class, 'contract_class');
  assertNonEmptyString(raw.retrieval_mode, 'retrieval_mode');

  if (raw.contract_class !== REQUIRED_RECORDED_CONTRACT_CLASS) {
    throw new McpReadonlyError(
      'CONTRACT_MISMATCH',
      `contract_class must be exactly "${REQUIRED_RECORDED_CONTRACT_CLASS}"`,
      {
        expected: REQUIRED_RECORDED_CONTRACT_CLASS,
        actual: raw.contract_class,
      },
    );
  }

  // Fail closed: attribution must be present and complete before content is trusted.
  if (!Object.prototype.hasOwnProperty.call(raw, 'attribution') || raw.attribution == null) {
    throw new McpReadonlyError(
      'MISSING_ATTRIBUTION',
      'MCP read-only response missing attribution; refusing to normalize content',
      { field: 'attribution' },
    );
  }

  const source = assertSource(raw.source);
  const tool = assertTool(raw.tool);
  const attribution = assertAttribution(raw.attribution);
  const provenance = assertProvenance(raw.provenance);
  const content = assertContent(raw.content);
  assertAttributionContentConsistency(attribution, content);

  if (tool.operation !== 'read') {
    throw new McpReadonlyError('NON_READONLY_OPERATION', 'Only read operations are permitted');
  }

  return {
    contract_class: raw.contract_class,
    retrieval_mode: raw.retrieval_mode,
    source,
    tool,
    attribution,
    provenance,
    content,
  };
}

export function loadOfficialMcpReadonlyResponse(absPath: string): OfficialMcpReadonlyResponse {
  let text: string;
  try {
    text = fs.readFileSync(absPath, 'utf8');
  } catch (error) {
    throw new McpReadonlyError(
      'RESPONSE_READ_FAILED',
      `Failed to read MCP readonly response at ${absPath}`,
      { path: absPath, cause: error instanceof Error ? error.message : String(error) },
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new McpReadonlyError('RESPONSE_JSON_PARSE_ERROR', 'MCP readonly response is not valid JSON', {
      path: absPath,
      cause: error instanceof Error ? error.message : String(error),
    });
  }

  return parseOfficialMcpReadonlyResponse(parsed);
}

export interface RetrieveReadonlyOptions {
  mode?: RetrievalMode;
  /**
   * Absolute or repo-relative path to a recorded official MCP read-only response.
   * Live network retrieval is intentionally out of scope for this slice.
   */
  responsePath?: string;
  repoRoot?: string;
}

/**
 * Official-MCP recorded-response contract harness (read-only).
 *
 * - mode defaults to `fixture` (safe default).
 * - mode `mcp` must be explicit and still consumes a local recorded response in this slice
 *   (no credentials, no live network, no official tool invocation yet).
 * - Source/tool identity fields are fixture contract labels, not discovered server inventory.
 * - Content is returned as data only; provenance and attribution ride beside it.
 */
export function retrieveReadonly(options: RetrieveReadonlyOptions = {}): RetrievalResult {
  const mode: RetrievalMode = options.mode ?? 'fixture';
  if (mode !== 'fixture' && mode !== 'mcp') {
    throw new McpReadonlyError('INVALID_MODE', `Unsupported retrieval mode: ${String(mode)}`, {
      mode,
    });
  }

  const repoRoot = options.repoRoot ?? process.cwd();
  const responsePath =
    options.responsePath ?? path.join(repoRoot, DEFAULT_MCP_READONLY_FIXTURE_REL_PATH);
  const absPath = path.isAbsolute(responsePath) ? responsePath : path.join(repoRoot, responsePath);

  const response = loadOfficialMcpReadonlyResponse(absPath);

  if (mode === 'mcp') {
    // Explicit MCP mode requires the envelope to identify itself as the official readonly path.
    if (response.retrieval_mode !== 'official_datahub_mcp_readonly') {
      throw new McpReadonlyError(
        'MCP_MODE_CONTRACT_MISMATCH',
        'Explicit MCP mode requires retrieval_mode=official_datahub_mcp_readonly',
        { retrieval_mode: response.retrieval_mode },
      );
    }
    if (response.source.system !== 'DataHub') {
      throw new McpReadonlyError(
        'MCP_MODE_SOURCE_MISMATCH',
        'Explicit MCP mode requires source.system=DataHub',
        { system: response.source.system },
      );
    }
  }

  const contentCanonical = stableJsonStringify(response.content);
  const envelopeCanonical = stableJsonStringify(response);

  return {
    mode,
    response_path: path.relative(repoRoot, absPath).split(path.sep).join('/') || absPath,
    source: response.source,
    tool: response.tool,
    attribution: response.attribution,
    provenance: {
      ...response.provenance,
      response_path: path.relative(repoRoot, absPath).split(path.sep).join('/') || absPath,
    },
    content: response.content,
    raw_response: response,
    content_digest: sha256Hex(contentCanonical),
    envelope_digest: sha256Hex(envelopeCanonical),
    // No approved freshness window exists; do not invent staleness thresholds.
    freshness_status: 'UNKNOWN',
    freshness_policy: METADATA_FRESHNESS_POLICY,
  };
}
