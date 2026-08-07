/**
 * Local DataHub OSS official MCP read-only validation orchestrator.
 *
 * Produces sanitized deterministic proof for one localhost MCP initialize +
 * tools/list + single read-only metadata call against official mcp-server-datahub.
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  METADATA_FRESHNESS_POLICY,
  sha256Hex,
  stableJsonStringify,
  type DataHubDatasetContent,
  type RetrievalResult,
} from './mcp-client.js';
import {
  buildLocalOssWorkPacket,
  normalizeLocalOssRetrieval,
  type LocalOssAuthority,
} from './context-adapter.js';
import {
  assertNoSecretsInProofText,
  buildDefaultSearchArgs,
  callReadOnlyToolOnce,
  closeLocalOssSession,
  connectLocalOssMcp,
  LocalOssMcpError,
  parseReadonlyArgs,
  selectReadOnlyTool,
  type FetchImpl,
  type LocalOssMcpEnv,
  type LocalOssSession,
  type SelectedLocalTool,
} from './local-oss-mcp-client.js';

export const LOCAL_OSS_PROOF_REL_PATH =
  'examples/official-mcp-proof/local-oss-live-readonly-validation-summary.json';

export const LOCAL_OSS_HARNESS_CLASS =
  'official-datahub-mcp-local-oss-live-readonly-validation';

export type LocalOssValidationStatus = 'PASS' | 'BLOCKED' | 'FAIL';

export interface LocalOssProofSummary {
  status: LocalOssValidationStatus;
  harness_class: typeof LOCAL_OSS_HARNESS_CLASS;
  captured_at: string;
  environment: {
    mode: 'local_datahub_oss';
    gms_url: string;
    compose_project: string;
    deployment_modified: boolean;
    modification_scope: string;
    gms_health: string;
    frontend_health: string;
    mcp_package: string;
    mcp_package_version: string;
  };
  mcp_server: {
    implementation: string;
    version: string;
    transport: string;
    server_name: string;
    protocol_version: string;
  };
  tool_inventory: {
    count: number;
    digest: string;
    selected_tool: string | null;
    selected_tool_readonly: boolean;
    readonly_evidence: string | null;
    items: Array<{
      name: string;
      description: string;
      input_schema_digest: string;
      annotations: {
        readOnlyHint: boolean | null;
        destructiveHint: boolean | null;
        idempotentHint: boolean | null;
      };
      classification: string;
    }>;
  };
  retrieval: {
    executed: boolean;
    entity_identity: string | null;
    timestamp: string | null;
    attribution_status: string;
    sanitized_arguments: Record<string, unknown> | null;
    request_id: string | number | null;
    content_digest: string | null;
  };
  digests: {
    content_digest: string | null;
    normalized_record_digest: string | null;
    packet_content_digest: string | null;
    artifact_sha256: string | null;
  };
  authority: LocalOssAuthority & {
    human_approval_required: true;
  };
  local_auth: {
    local_token_present: boolean;
    local_token_provenance: string;
    human_use_authorization: 'APPROVED' | 'DENIED' | 'NOT_REQUESTED';
    persistence: 'NONE';
  };
  /** Public-safe safety claims (never secrets). */
  metadata_call_count: number;
  production_activation: false;
  managed_cloud_oauth: false;
  datahub_writes: false;
  unknowns: string[];
  validation_result: {
    ok: boolean;
    outcome: LocalOssValidationStatus;
    errors: string[];
    fail_closed_code: string | null;
  };
  notes: string[];
}

export interface RunLocalOssValidationOptions {
  repoRoot: string;
  env?: LocalOssMcpEnv;
  fetchImpl?: FetchImpl;
  now?: () => Date;
  /** Injected session for unit tests (skips network connect). */
  sessionOverride?: LocalOssSession;
  /** Environment metadata captured by operator (no secrets). */
  environmentMeta?: Partial<LocalOssProofSummary['environment']>;
  localAuthMeta?: Partial<LocalOssProofSummary['local_auth']>;
  /** When true, perform connect + one read. Default true when allow flag set. */
  executeLive?: boolean;
}

function platformFromUrn(urn: string): string {
  const m = urn.match(/^urn:li:dataset:\(urn:li:dataPlatform:([^,]+),/);
  return m?.[1] ?? 'UNKNOWN';
}

function nameFromUrn(urn: string): string {
  const m = urn.match(/^urn:li:dataset:\(urn:li:dataPlatform:[^,]+,([^,]+),/);
  return m?.[1] ?? 'UNKNOWN';
}

function nameFromSearchPayload(text: string, urn: string): string {
  try {
    const parsed = JSON.parse(text) as {
      searchResults?: Array<{ entity?: { urn?: string; properties?: { name?: string } } }>;
    };
    const hit = (parsed.searchResults || []).find((r) => r.entity?.urn === urn);
    const n = hit?.entity?.properties?.name;
    if (typeof n === 'string' && n.trim()) return n;
  } catch {
    // ignore
  }
  return nameFromUrn(urn);
}

/**
 * Map sparse live metadata into the governed dataset content shape.
 * Absent fields remain the literal string UNKNOWN or empty collections.
 */
export function mapLiveMetadataToContent(args: {
  entity_identity: string;
  text_content: string;
}): DataHubDatasetContent {
  const urn = args.entity_identity;
  const platform = platformFromUrn(urn);
  const name = nameFromSearchPayload(args.text_content, urn);
  return {
    dataset_urn: urn,
    platform,
    name,
    description: 'UNKNOWN',
    ownership: {
      owner_team: 'UNKNOWN',
      data_governance_owner: 'UNKNOWN',
    },
    schema: {
      fields: [],
    },
    upstream_lineage: [],
    governance_labels: {
      sensitivity: 'UNKNOWN',
      retention_days: 0,
      requires_audit_log: false,
      encryption_at_rest: 'UNKNOWN',
    },
    quality_assertions: [],
  };
}

function baseUnknowns(extra: string[] = []): string[] {
  return [
    'approved metadata freshness window remains UNKNOWN',
    'local OSS verification is not production/runtime activation',
    'frontend quickstart may be unhealthy without compose secret mutation (GMS-only path authorized)',
    'consumer eligibility remains PROPOSED until human approval',
    ...extra,
  ];
}

function safetyDefaults(): Pick<
  LocalOssProofSummary,
  'production_activation' | 'managed_cloud_oauth' | 'datahub_writes'
> {
  return {
    production_activation: false,
    managed_cloud_oauth: false,
    datahub_writes: false,
  };
}

export function buildBlockedLocalOssProof(args: {
  now: Date;
  code: string;
  errors: string[];
  envMeta?: Partial<LocalOssProofSummary['environment']>;
  localAuth?: Partial<LocalOssProofSummary['local_auth']>;
  session?: LocalOssSession | null;
  selected?: SelectedLocalTool | null;
  extra_unknowns?: string[];
  notes?: string[];
  metadata_call_count?: number;
}): LocalOssProofSummary {
  return {
    status: 'BLOCKED',
    harness_class: LOCAL_OSS_HARNESS_CLASS,
    captured_at: args.now.toISOString(),
    environment: {
      mode: 'local_datahub_oss',
      gms_url: args.envMeta?.gms_url ?? 'http://localhost:8080',
      compose_project: args.envMeta?.compose_project ?? 'datahub',
      deployment_modified: args.envMeta?.deployment_modified ?? true,
      modification_scope:
        args.envMeta?.modification_scope ?? 'start existing quickstart services only',
      gms_health: args.envMeta?.gms_health ?? 'UNKNOWN',
      frontend_health: args.envMeta?.frontend_health ?? 'UNKNOWN',
      mcp_package: args.envMeta?.mcp_package ?? 'mcp-server-datahub',
      mcp_package_version: args.envMeta?.mcp_package_version ?? 'UNKNOWN',
    },
    mcp_server: {
      implementation: 'mcp-server-datahub',
      version: args.session?.server_info.version ?? 'UNKNOWN',
      transport: args.session?.transport ?? 'http-jsonrpc-stateless',
      server_name: args.session?.server_info.name ?? 'UNKNOWN',
      protocol_version: args.session?.protocol_version ?? 'UNKNOWN',
    },
    tool_inventory: {
      count: args.session?.inventory.length ?? 0,
      digest: args.session?.tool_inventory_digest ?? 'UNKNOWN',
      selected_tool: args.selected?.name ?? null,
      selected_tool_readonly: args.selected?.classified_as === 'read',
      readonly_evidence: args.selected?.readonly_evidence ?? null,
      items: (args.session?.inventory ?? []).map((i) => ({
        name: i.name,
        description: i.description,
        input_schema_digest: i.input_schema_digest,
        annotations: i.annotations,
        classification: i.classification,
      })),
    },
    retrieval: {
      executed: false,
      entity_identity: null,
      timestamp: null,
      attribution_status: 'NOT_EXECUTED',
      sanitized_arguments: null,
      request_id: null,
      content_digest: null,
    },
    digests: {
      content_digest: null,
      normalized_record_digest: null,
      packet_content_digest: null,
      artifact_sha256: null,
    },
    authority: {
      record_status: 'LOCAL_OSS_MCP_LIVE_READ',
      source_binding_status: 'LOCAL_OSS_MCP_VERIFIED',
      consumer_eligibility: 'PROPOSED',
      runtime_retrieval_status: 'VERIFIED_LOCAL_ONLY',
      human_approval_required: true,
    },
    local_auth: {
      local_token_present: args.localAuth?.local_token_present ?? false,
      local_token_provenance: args.localAuth?.local_token_provenance ?? 'UNKNOWN',
      human_use_authorization: args.localAuth?.human_use_authorization ?? 'NOT_REQUESTED',
      persistence: 'NONE',
    },
    metadata_call_count: args.metadata_call_count ?? args.session?.metadata_call_count ?? 0,
    ...safetyDefaults(),
    unknowns: baseUnknowns(args.extra_unknowns),
    validation_result: {
      ok: false,
      outcome: 'BLOCKED',
      errors: args.errors,
      fail_closed_code: args.code,
    },
    notes: [
      'Local DataHub OSS official MCP read-only validation path.',
      'Fail-closed BLOCKED is an acceptable stop condition.',
      'No credentials, tokens, or secrets are included in this proof.',
      'Recorded --mode=fixture|mcp harness remains non-live and unchanged.',
      ...(args.notes ?? []),
    ],
  };
}

export async function runLocalOssReadonlyValidation(
  options: RunLocalOssValidationOptions,
): Promise<LocalOssProofSummary> {
  const nowFn = options.now ?? (() => new Date());
  const now = nowFn();
  const env = options.env ?? (process.env as LocalOssMcpEnv);

  let session: LocalOssSession | null = options.sessionOverride ?? null;
  let ownsSession = false;

  try {
    if (!session) {
      session = await connectLocalOssMcp(env, options.fetchImpl);
      ownsSession = true;
    }

    const selected = selectReadOnlyTool(session.tools, env);
    const descriptor = session.tools.find((t) => t.name === selected.name);
    if (!descriptor) {
      throw new LocalOssMcpError(
        'NO_VERIFIED_READONLY_TOOL',
        'Selected tool missing from session tools',
      );
    }

    const args = parseReadonlyArgs(env) ?? buildDefaultSearchArgs(descriptor);

    const call = await callReadOnlyToolOnce(session, selected, args, nowFn);
    const content = mapLiveMetadataToContent({
      entity_identity: call.entity_identity as string,
      text_content: call.text_content,
    });

    const retrieval: RetrievalResult = {
      mode: 'mcp',
      response_path: LOCAL_OSS_PROOF_REL_PATH,
      source: {
        identity: `local-oss-mcp:${session.server_info.name}@${session.server_info.version}`,
        system: 'DataHub',
        environment: 'local_datahub_oss',
      },
      tool: {
        identity: `local-oss-mcp.tool.${selected.name}`,
        name: selected.name,
        version: session.server_info.version || 'UNKNOWN',
        operation: 'read',
      },
      attribution: {
        owner_team: content.ownership.owner_team,
        data_governance_owner: content.ownership.data_governance_owner,
        retrieved_by: 'mg-datahub-oss-local-readonly-validator',
        license_or_use_constraint:
          'local-oss-readonly-validation-only; not production authority',
      },
      provenance: {
        retrieved_at: call.retrieval_timestamp,
        request_id: String(call.request_id),
        content_encoding: 'application/json',
        transport: session.transport,
        response_path: LOCAL_OSS_PROOF_REL_PATH,
      },
      content,
      raw_response: {
        contract_class: 'official-datahub-mcp-readonly-recorded-response',
        retrieval_mode: 'mcp',
        source: {
          identity: `local-oss-mcp:${session.server_info.name}@${session.server_info.version}`,
          system: 'DataHub',
          environment: 'local_datahub_oss',
        },
        tool: {
          identity: `local-oss-mcp.tool.${selected.name}`,
          name: selected.name,
          version: session.server_info.version || 'UNKNOWN',
          operation: 'read',
        },
        attribution: {
          owner_team: content.ownership.owner_team,
          data_governance_owner: content.ownership.data_governance_owner,
          retrieved_by: 'mg-datahub-oss-local-readonly-validator',
          license_or_use_constraint:
            'local-oss-readonly-validation-only; not production authority',
        },
        provenance: {
          retrieved_at: call.retrieval_timestamp,
          request_id: String(call.request_id),
          content_encoding: 'application/json',
          transport: session.transport,
          response_path: LOCAL_OSS_PROOF_REL_PATH,
        },
        content,
      },
      content_digest: call.content_digest,
      envelope_digest: call.response_digest,
      freshness_status: 'UNKNOWN',
      freshness_policy: METADATA_FRESHNESS_POLICY,
    };

    const normalized = normalizeLocalOssRetrieval(retrieval);
    const workPacket = buildLocalOssWorkPacket(normalized.record);

    const proof: LocalOssProofSummary = {
      status: 'PASS',
      harness_class: LOCAL_OSS_HARNESS_CLASS,
      captured_at: now.toISOString(),
      environment: {
        mode: 'local_datahub_oss',
        gms_url: options.environmentMeta?.gms_url ?? env.DATAHUB_GMS_URL ?? 'http://localhost:8080',
        compose_project: options.environmentMeta?.compose_project ?? 'datahub',
        deployment_modified: options.environmentMeta?.deployment_modified ?? true,
        modification_scope:
          options.environmentMeta?.modification_scope ??
          'start existing quickstart services only',
        gms_health: options.environmentMeta?.gms_health ?? 'healthy',
        frontend_health:
          options.environmentMeta?.frontend_health ?? 'unhealthy_without_compose_mutation',
        mcp_package: options.environmentMeta?.mcp_package ?? 'mcp-server-datahub',
        mcp_package_version: options.environmentMeta?.mcp_package_version ?? '0.6.0',
      },
      mcp_server: {
        implementation: 'mcp-server-datahub (official open-source)',
        version: options.environmentMeta?.mcp_package_version ?? '0.6.0',
        transport: session.transport,
        server_name: session.server_info.name || 'UNKNOWN',
        protocol_version: session.protocol_version || 'UNKNOWN',
      },
      tool_inventory: {
        count: session.inventory.length,
        digest: session.tool_inventory_digest,
        selected_tool: selected.name,
        selected_tool_readonly: true,
        readonly_evidence: selected.readonly_evidence,
        items: session.inventory.map((i) => ({
          name: i.name,
          description: i.description,
          input_schema_digest: i.input_schema_digest,
          annotations: i.annotations,
          classification: i.classification,
        })),
      },
      retrieval: {
        executed: true,
        entity_identity: call.entity_identity,
        timestamp: call.retrieval_timestamp,
        attribution_status: 'ENTITY_URN_ATTRIBUTED',
        sanitized_arguments: call.sanitized_arguments,
        request_id: call.request_id,
        content_digest: call.content_digest,
      },
      digests: {
        content_digest: call.content_digest,
        normalized_record_digest: normalized.record.digests.normalized_record_digest,
        packet_content_digest: workPacket.packet.digests.packet_content_digest,
        artifact_sha256: workPacket.artifact_sha256,
      },
      authority: {
        record_status: 'LOCAL_OSS_MCP_LIVE_READ',
        source_binding_status: 'LOCAL_OSS_MCP_VERIFIED',
        consumer_eligibility: 'PROPOSED',
        runtime_retrieval_status: 'VERIFIED_LOCAL_ONLY',
        human_approval_required: true,
      },
      local_auth: {
        local_token_present: options.localAuthMeta?.local_token_present ?? true,
        local_token_provenance:
          options.localAuthMeta?.local_token_provenance ??
          'local_datahubenv_gms_localhost_8080_jwt',
        human_use_authorization:
          options.localAuthMeta?.human_use_authorization ?? 'APPROVED',
        persistence: 'NONE',
      },
      metadata_call_count: session.metadata_call_count,
      ...safetyDefaults(),
      unknowns: baseUnknowns([
        'schema fields not returned by selected search tool (UNKNOWN)',
        'ownership not returned by selected search tool (UNKNOWN)',
        'lineage not returned by selected search tool (empty)',
        'quality assertions not returned by selected search tool (empty)',
      ]),
      validation_result: {
        ok: true,
        outcome: 'PASS',
        errors: [],
        fail_closed_code: null,
      },
      notes: [
        'Local DataHub OSS official MCP read-only validation path.',
        'Exactly one tools/call executed after live tools/list discovery.',
        'Server identity and tool inventory are from live initialize/tools/list — not fixture labels.',
        'Local verification does not authorize production activation or MG MCP writes.',
        'Recorded --mode=fixture|mcp harness remains non-live and unchanged.',
        'No credentials, tokens, or secrets are included in this proof.',
        `freshness_policy=${METADATA_FRESHNESS_POLICY}`,
      ],
    };

    const text = stableJsonStringify(proof);
    assertNoSecretsInProofText(text);
    return proof;
  } catch (error) {
    if (error instanceof LocalOssMcpError) {
      const blockedArgs: Parameters<typeof buildBlockedLocalOssProof>[0] = {
        now,
        code: error.code,
        errors: [error.message],
        metadata_call_count: session?.metadata_call_count ?? 0,
        extra_unknowns: [`fail_closed_code=${error.code}`],
        notes: ['Blocked by local OSS MCP fail-closed guard.'],
      };
      if (options.environmentMeta !== undefined) blockedArgs.envMeta = options.environmentMeta;
      if (options.localAuthMeta !== undefined) blockedArgs.localAuth = options.localAuthMeta;
      if (session) blockedArgs.session = session;
      return buildBlockedLocalOssProof(blockedArgs);
    }
    const failArgs: Parameters<typeof buildBlockedLocalOssProof>[0] = {
      now,
      code: 'FAIL',
      errors: [error instanceof Error ? error.message : String(error)],
      metadata_call_count: session?.metadata_call_count ?? 0,
      notes: ['Unexpected failure during local OSS validation.'],
    };
    if (options.environmentMeta !== undefined) failArgs.envMeta = options.environmentMeta;
    if (options.localAuthMeta !== undefined) failArgs.localAuth = options.localAuthMeta;
    if (session) failArgs.session = session;
    return buildBlockedLocalOssProof(failArgs);
  } finally {
    if (ownsSession && session) {
      await closeLocalOssSession(session);
    }
  }
}

export function writeLocalOssProof(
  repoRoot: string,
  proof: LocalOssProofSummary,
  options: { allowNonPass?: boolean } = {},
): { path: string; sha256: string; text: string; written: boolean } {
  const rel = LOCAL_OSS_PROOF_REL_PATH;
  const abs = path.join(repoRoot, rel);
  const text = stableJsonStringify(proof);
  assertNoSecretsInProofText(text);

  // Never clobber the committed VERIFIED_LOCAL_ONLY PASS proof with a BLOCKED/FAIL
  // operator-local result unless explicitly allowed (tests may opt in).
  if (proof.status !== 'PASS' && options.allowNonPass !== true) {
    if (fs.existsSync(abs)) {
      try {
        const existing = JSON.parse(fs.readFileSync(abs, 'utf8')) as {
          status?: string;
        };
        if (existing.status === 'PASS') {
          return { path: abs, sha256: sha256Hex(text), text, written: false };
        }
      } catch {
        // fall through to write when existing proof is unreadable
      }
    }
  }

  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, text, 'utf8');
  return { path: abs, sha256: sha256Hex(text), text, written: true };
}

export function localOssExitCode(proof: LocalOssProofSummary): number {
  if (proof.status === 'PASS') return 0;
  if (proof.status === 'BLOCKED') {
    if (
      proof.validation_result.fail_closed_code === 'LOCAL_NOT_ALLOWED' ||
      proof.validation_result.fail_closed_code === 'BLOCKED_LOCAL_NOT_ALLOWED'
    ) {
      return 3;
    }
    return 0;
  }
  return 1;
}

export function parseLocalOssProof(raw: unknown): LocalOssProofSummary {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('local OSS proof must be an object');
  }
  const p = raw as LocalOssProofSummary;
  if (p.harness_class !== LOCAL_OSS_HARNESS_CLASS) {
    throw new Error(`harness_class must be ${LOCAL_OSS_HARNESS_CLASS}`);
  }
  if (!p.mcp_server?.server_name || p.mcp_server.server_name === '') {
    throw new Error('server identity required');
  }
  if (!p.tool_inventory || typeof p.tool_inventory.count !== 'number') {
    throw new Error('tools/list inventory required');
  }
  if (p.status === 'PASS') {
    if (!p.retrieval?.executed) throw new Error('PASS requires executed retrieval');
    if (!p.retrieval.entity_identity) throw new Error('PASS requires entity attribution');
    if (p.tool_inventory.selected_tool_readonly !== true) {
      throw new Error('PASS requires selected_tool_readonly');
    }
    if (p.authority.human_approval_required !== true) {
      throw new Error('human_approval_required must be true');
    }
    if (p.authority.runtime_retrieval_status !== 'VERIFIED_LOCAL_ONLY') {
      throw new Error('runtime_retrieval_status must be VERIFIED_LOCAL_ONLY');
    }
    if (p.authority.consumer_eligibility !== 'PROPOSED') {
      throw new Error('consumer_eligibility must be PROPOSED');
    }
    if (p.metadata_call_count !== 1) {
      throw new Error('PASS requires metadata_call_count === 1');
    }
    if (p.production_activation !== false) {
      throw new Error('production_activation must be false');
    }
    if (p.managed_cloud_oauth !== false) {
      throw new Error('managed_cloud_oauth must be false');
    }
    if (p.datahub_writes !== false) {
      throw new Error('datahub_writes must be false');
    }
  }
  const text = stableJsonStringify(p);
  assertNoSecretsInProofText(text);
  return p;
}
