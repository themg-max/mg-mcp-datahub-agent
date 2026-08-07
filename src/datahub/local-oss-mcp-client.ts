/**
 * Local DataHub OSS official MCP client (read-only validation path).
 *
 * Supports:
 *  A) HTTP JSON-RPC when DATAHUB_LOCAL_MCP_URL is set or fetchImpl is injected
 *  B) Subprocess stdio spawn of official mcp-server-datahub==0.6.0 when allow=true
 *
 * - Never logs tokens or Authorization headers.
 * - Never puts tokens on argv.
 * - Never selects or invokes mutation tools.
 * - Exactly one tools/call is performed by the validation orchestrator.
 */

import { execFileSync, spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { createHash } from 'node:crypto';
import { sha256Hex, stableJsonStringify } from './mcp-client.js';

export const DEFAULT_LOCAL_MCP_URL = 'http://127.0.0.1:8000/mcp';
export const DEFAULT_LOCAL_GMS_URL = 'http://localhost:8080';
export const PINNED_MCP_SERVER_DATAHUB = 'mcp-server-datahub==0.6.0';

/** Prefer metadata lookup tools discovered live — never fixture labels. */
export const LOCAL_READONLY_TOOL_PREFERENCE = [
  'search',
  'get_entities',
  'list_schema_fields',
  'get_lineage',
  'get_lineage_paths_between',
] as const;

export type LocalOssMcpErrorCode =
  | 'LOCAL_NOT_ALLOWED'
  | 'BLOCKED_LOCAL_NOT_ALLOWED'
  | 'BLOCKED_LOCAL_GMS_UNAVAILABLE'
  | 'BLOCKED_LOCAL_GMS_AUTH'
  | 'BLOCKED_MCP_STARTUP'
  | 'BLOCKED_EMPTY_LOCAL_CATALOG'
  | 'LOCAL_MCP_INITIALIZE_FAILED'
  | 'TOOLS_LIST_FAILED'
  | 'NO_VERIFIED_READONLY_TOOL'
  | 'TOOL_CALL_FAILED'
  | 'ATTRIBUTION_UNPROVEN'
  | 'NETWORK_ERROR'
  | 'PROTOCOL_ERROR'
  | 'INVALID_ENDPOINT'
  | 'SECRET_LEAK_GUARD';

export class LocalOssMcpError extends Error {
  code: LocalOssMcpErrorCode;
  details: Record<string, unknown>;

  constructor(
    code: LocalOssMcpErrorCode,
    message: string,
    details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = 'LocalOssMcpError';
    this.code = code;
    this.details = redactSecrets(details);
  }
}

export type FetchImpl = (
  input: string | URL,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  },
) => Promise<{
  status: number;
  ok: boolean;
  headers: { get(name: string): string | null };
  text(): Promise<string>;
  json(): Promise<unknown>;
}>;

export interface LocalOssMcpEnv {
  DATAHUB_LOCAL_MCP_URL?: string;
  DATAHUB_LOCAL_MCP_ALLOW?: string;
  DATAHUB_GMS_URL?: string;
  DATAHUB_GMS_TOKEN?: string;
  DATAHUB_MCP_READONLY_TOOL?: string;
  DATAHUB_MCP_READONLY_ARGS_JSON?: string;
  [key: string]: string | undefined;
}

export interface McpToolDescriptor {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
  annotations?: {
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    idempotentHint?: boolean;
    openWorldHint?: boolean;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface SanitizedToolInventoryItem {
  name: string;
  description: string;
  input_schema_digest: string;
  annotations: {
    readOnlyHint: boolean | null;
    destructiveHint: boolean | null;
    idempotentHint: boolean | null;
  };
  classification: 'read' | 'write' | 'unknown';
}

export type LocalOssTransport = 'http-jsonrpc-stateless' | 'stdio-subprocess';

export interface LocalOssSession {
  endpoint: string;
  protocol_version: string | null;
  server_info: { name: string | null; version: string | null };
  capabilities: Record<string, unknown> | null;
  tools: McpToolDescriptor[];
  inventory: SanitizedToolInventoryItem[];
  tool_inventory_digest: string;
  transport: LocalOssTransport;
  /** Incremented only on tools/call. */
  metadata_call_count: number;
  _fetchImpl?: FetchImpl;
  _nextId: number;
  _child?: ChildProcessWithoutNullStreams | null;
  _stdioPending?: Map<
    string | number,
    {
      resolve: (value: Record<string, unknown>) => void;
      reject: (error: Error) => void;
    }
  >;
  _stdioBuffer?: Buffer;
  _closed?: boolean;
}

export interface SelectedLocalTool {
  name: string;
  selection_reason: 'readOnlyHint' | 'preference' | 'env_override';
  annotations: McpToolDescriptor['annotations'] | null;
  classified_as: 'read';
  readonly_evidence: string;
}

export interface LocalToolCallResult {
  tool_name: string;
  request_id: string | number;
  retrieval_timestamp: string;
  sanitized_arguments: Record<string, unknown>;
  result: unknown;
  text_content: string;
  content_digest: string;
  response_digest: string;
  is_error: boolean;
  entity_identity: string | null;
}

const SENSITIVE_KEY_RE =
  /(authorization|bearer|token|password|secret|api[_-]?key|credential)/i;

/** Mutation / write name patterns — word-boundary aware to avoid `get_dataset_queries` false positives. */
const WRITE_NAME_RE =
  /(^|_)(create|add|update|delete|ingest|set|propose|accept|reject|write|mutate|remove|upsert|patch|emit|publish|run|execute)(_|$)/i;

function redactSecrets(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  const out: Record<string, unknown> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEY_RE.test(key)) {
      out[key] = '[REDACTED]';
      continue;
    }
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      out[key] = redactSecrets(raw);
    } else if (typeof raw === 'string' && /^(Bearer\s+).+/i.test(raw)) {
      out[key] = '[REDACTED]';
    } else {
      out[key] = raw;
    }
  }
  return out;
}

export function digestJson(value: unknown): string {
  return sha256Hex(stableJsonStringify(value).trimEnd());
}

export function isLocalOssAllowed(env: LocalOssMcpEnv = {}): boolean {
  // Strict literal match: only the exact string 'true' is allowed.
  return env.DATAHUB_LOCAL_MCP_ALLOW === 'true';
}

export function resolveLocalMcpEndpoint(env: LocalOssMcpEnv = {}): string {
  const raw = (env.DATAHUB_LOCAL_MCP_URL || DEFAULT_LOCAL_MCP_URL).trim();
  if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?(\/|$)/i.test(raw)) {
    throw new LocalOssMcpError(
      'INVALID_ENDPOINT',
      'Local OSS MCP endpoint must be localhost/127.0.0.1 only',
      { endpoint_host_class: 'non-local-rejected' },
    );
  }
  return raw;
}

function defaultFetch(): FetchImpl {
  return globalThis.fetch.bind(globalThis) as FetchImpl;
}

function usesHttpTransport(env: LocalOssMcpEnv, fetchImpl: FetchImpl | undefined): boolean {
  if (env.DATAHUB_LOCAL_MCP_URL && env.DATAHUB_LOCAL_MCP_URL.trim() !== '') return true;
  if (fetchImpl !== undefined) return true;
  return false;
}

/**
 * Live spawn path requires GMS URL + token unless HTTP mock/external URL or
 * injected fetch is used (unit tests without secrets).
 */
export function assertLiveGmsEnv(
  env: LocalOssMcpEnv,
  options: { httpPath: boolean; hasSessionOverride: boolean; hasFetchImpl: boolean },
): void {
  if (options.httpPath || options.hasSessionOverride || options.hasFetchImpl) {
    return;
  }
  const gmsUrl = (env.DATAHUB_GMS_URL || '').trim();
  if (!gmsUrl) {
    throw new LocalOssMcpError(
      'BLOCKED_LOCAL_GMS_UNAVAILABLE',
      'missing URL: DATAHUB_GMS_URL is required for local OSS MCP spawn path',
    );
  }
  const token = (env.DATAHUB_GMS_TOKEN || '').trim();
  if (!token) {
    throw new LocalOssMcpError(
      'BLOCKED_LOCAL_GMS_AUTH',
      'missing token: DATAHUB_GMS_TOKEN is required for local OSS MCP spawn path',
    );
  }
}

async function safeJson(res: {
  text(): Promise<string>;
  json(): Promise<unknown>;
}): Promise<{ text: string; json: unknown | null }> {
  const text = await res.text();
  if (!text) return { text: '', json: null };
  if (text.includes('data:')) {
    const line = text
      .split('\n')
      .map((l) => l.trim())
      .find((l) => l.startsWith('data:'));
    if (line) {
      try {
        return { text, json: JSON.parse(line.slice('data:'.length).trim()) };
      } catch {
        return { text, json: null };
      }
    }
  }
  try {
    return { text, json: JSON.parse(text) };
  } catch {
    return { text, json: null };
  }
}

async function jsonRpcHttpCall(
  endpoint: string,
  fetchImpl: FetchImpl,
  id: number | string,
  method: string,
  params?: unknown,
): Promise<{ http_status: number; rpc: Record<string, unknown> | null; raw_text: string }> {
  const body: Record<string, unknown> = {
    jsonrpc: '2.0',
    id,
    method,
  };
  if (params !== undefined) body.params = params;

  let res;
  try {
    res = await fetchImpl(endpoint, {
      method: 'POST',
      headers: {
        accept: 'application/json, text/event-stream',
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    throw new LocalOssMcpError('NETWORK_ERROR', `Network error calling ${method}`, {
      method,
      cause: error instanceof Error ? error.message : String(error),
    });
  }

  const { text, json } = await safeJson(res);
  if (res.status < 200 || res.status >= 300) {
    throw new LocalOssMcpError('PROTOCOL_ERROR', `HTTP ${res.status} for ${method}`, {
      method,
      http_status: res.status,
      body_digest: sha256Hex(text),
    });
  }

  let rpc: Record<string, unknown> | null = null;
  if (json && typeof json === 'object' && !Array.isArray(json)) {
    rpc = json as Record<string, unknown>;
  }
  if (rpc && rpc.error) {
    throw new LocalOssMcpError('PROTOCOL_ERROR', `JSON-RPC error on ${method}`, {
      method,
      error_digest: digestJson(rpc.error),
    });
  }
  return { http_status: res.status, rpc, raw_text: text };
}

function encodeStdioMessage(message: Record<string, unknown>): Buffer {
  const json = JSON.stringify(message);
  const header = `Content-Length: ${Buffer.byteLength(json, 'utf8')}\r\n\r\n`;
  return Buffer.concat([Buffer.from(header, 'utf8'), Buffer.from(json, 'utf8')]);
}

function attachStdioReader(session: LocalOssSession): void {
  const child = session._child;
  if (!child) return;
  session._stdioBuffer = Buffer.alloc(0);
  session._stdioPending = new Map();

  const onData = (chunk: Buffer) => {
    let buf: Buffer = Buffer.concat([session._stdioBuffer ?? Buffer.alloc(0), chunk]);
    session._stdioBuffer = buf;
    for (;;) {
      buf = session._stdioBuffer ?? Buffer.alloc(0);
      const headerEnd = buf.indexOf('\r\n\r\n');
      if (headerEnd < 0) break;
      const header = buf.subarray(0, headerEnd).toString('utf8');
      const match = /Content-Length:\s*(\d+)/i.exec(header);
      if (!match) {
        session._stdioBuffer = buf.subarray(headerEnd + 4);
        continue;
      }
      const length = Number(match[1]);
      const bodyStart = headerEnd + 4;
      if (buf.length < bodyStart + length) break;
      const body = buf.subarray(bodyStart, bodyStart + length).toString('utf8');
      session._stdioBuffer = buf.subarray(bodyStart + length);
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(body) as Record<string, unknown>;
      } catch {
        continue;
      }
      const id = parsed.id as string | number | undefined;
      if (id === undefined || id === null) continue;
      const pending = session._stdioPending?.get(id);
      if (pending) {
        session._stdioPending?.delete(id);
        if (parsed.error) {
          pending.reject(
            new LocalOssMcpError('PROTOCOL_ERROR', 'JSON-RPC error on stdio', {
              error_digest: digestJson(parsed.error),
            }),
          );
        } else {
          pending.resolve(parsed);
        }
      }
    }
  };

  child.stdout.on('data', onData);
  child.stderr.on('data', () => {
    /* discard — never log (may contain env noise) */
  });
}

async function jsonRpcStdioCall(
  session: LocalOssSession,
  id: number | string,
  method: string,
  params?: unknown,
): Promise<{ rpc: Record<string, unknown> | null; raw_text: string }> {
  const child = session._child;
  if (!child || !child.stdin.writable || session._closed) {
    throw new LocalOssMcpError('BLOCKED_MCP_STARTUP', 'MCP child process is not available');
  }
  const message: Record<string, unknown> = {
    jsonrpc: '2.0',
    id,
    method,
  };
  if (params !== undefined) message.params = params;

  const rpc = await new Promise<Record<string, unknown>>((resolve, reject) => {
    const timer = setTimeout(() => {
      session._stdioPending?.delete(id);
      reject(new LocalOssMcpError('NETWORK_ERROR', `stdio timeout waiting for ${method}`, { method }));
    }, 60_000);
    session._stdioPending?.set(id, {
      resolve: (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      reject: (error) => {
        clearTimeout(timer);
        reject(error);
      },
    });
    try {
      child.stdin.write(encodeStdioMessage(message));
    } catch (error) {
      clearTimeout(timer);
      session._stdioPending?.delete(id);
      reject(
        new LocalOssMcpError('BLOCKED_MCP_STARTUP', `Failed writing stdio for ${method}`, {
          cause: error instanceof Error ? error.message : String(error),
        }),
      );
    }
  });

  return { rpc, raw_text: JSON.stringify(rpc) };
}

async function jsonRpcCall(
  session: LocalOssSession,
  id: number | string,
  method: string,
  params?: unknown,
): Promise<{ http_status: number; rpc: Record<string, unknown> | null; raw_text: string }> {
  if (session.transport === 'stdio-subprocess') {
    const result = await jsonRpcStdioCall(session, id, method, params);
    return { http_status: 200, rpc: result.rpc, raw_text: result.raw_text };
  }
  if (!session._fetchImpl) {
    throw new LocalOssMcpError('PROTOCOL_ERROR', 'HTTP transport missing fetchImpl');
  }
  return jsonRpcHttpCall(session.endpoint, session._fetchImpl, id, method, params);
}

function whichSync(bin: string): boolean {
  try {
    execFileSync(process.platform === 'win32' ? 'where' : 'which', [bin], {
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

export function resolveMcpSpawnCommand(): { command: string; args: string[] } {
  if (whichSync('uvx')) {
    return {
      command: 'uvx',
      args: ['--from', PINNED_MCP_SERVER_DATAHUB, 'mcp-server-datahub'],
    };
  }
  if (whichSync('python3')) {
    return { command: 'python3', args: ['-m', 'mcp_server_datahub'] };
  }
  if (whichSync('mcp-server-datahub')) {
    return { command: 'mcp-server-datahub', args: [] };
  }
  throw new LocalOssMcpError(
    'BLOCKED_MCP_STARTUP',
    'Unable to locate uvx, python3 -m mcp_server_datahub, or mcp-server-datahub on PATH',
  );
}

function spawnOfficialMcp(env: LocalOssMcpEnv): ChildProcessWithoutNullStreams {
  const { command, args } = resolveMcpSpawnCommand();
  const childEnv: NodeJS.ProcessEnv = { ...process.env };
  // Pass GMS credentials via environment only — never argv.
  if (env.DATAHUB_GMS_URL) childEnv.DATAHUB_GMS_URL = env.DATAHUB_GMS_URL;
  if (env.DATAHUB_GMS_TOKEN) childEnv.DATAHUB_GMS_TOKEN = env.DATAHUB_GMS_TOKEN;

  let child: ChildProcessWithoutNullStreams;
  try {
    child = spawn(command, args, {
      env: childEnv,
      stdio: ['pipe', 'pipe', 'pipe'],
    }) as ChildProcessWithoutNullStreams;
  } catch (error) {
    throw new LocalOssMcpError('BLOCKED_MCP_STARTUP', 'Failed to spawn official mcp-server-datahub', {
      cause: error instanceof Error ? error.message : String(error),
      command,
    });
  }
  if (!child.pid) {
    throw new LocalOssMcpError('BLOCKED_MCP_STARTUP', 'Spawned MCP process has no pid');
  }
  return child;
}

export function isWriteToolName(name: string): boolean {
  return WRITE_NAME_RE.test(name);
}

export function classifyTool(tool: McpToolDescriptor): 'read' | 'write' | 'unknown' {
  const hint = tool.annotations?.readOnlyHint;
  const destructive = tool.annotations?.destructiveHint;
  if (destructive === true) return 'write';
  if (hint === false) return 'write';
  if (isWriteToolName(tool.name)) return 'write';
  if (hint === true) return 'read';
  return 'unknown';
}

export function sanitizeToolInventory(tools: McpToolDescriptor[]): SanitizedToolInventoryItem[] {
  return tools.map((tool) => {
    const schema = (tool.inputSchema ?? {}) as Record<string, unknown>;
    const ann = tool.annotations ?? {};
    return {
      name: tool.name,
      description: typeof tool.description === 'string' ? tool.description.slice(0, 500) : '',
      input_schema_digest: digestJson(schema),
      annotations: {
        readOnlyHint: typeof ann.readOnlyHint === 'boolean' ? ann.readOnlyHint : null,
        destructiveHint: typeof ann.destructiveHint === 'boolean' ? ann.destructiveHint : null,
        idempotentHint: typeof ann.idempotentHint === 'boolean' ? ann.idempotentHint : null,
      },
      classification: classifyTool(tool),
    };
  });
}

export function toolInventoryDigest(inventory: SanitizedToolInventoryItem[]): string {
  const canonical = inventory.map((item) => ({
    name: item.name,
    input_schema_digest: item.input_schema_digest,
    annotations: item.annotations,
    classification: item.classification,
  }));
  return digestJson(canonical);
}

/**
 * Select exactly one unambiguously read-only tool from live inventory.
 * Requires readOnlyHint=true (fail closed otherwise).
 */
export function selectReadOnlyTool(
  tools: McpToolDescriptor[],
  env: LocalOssMcpEnv = {},
): SelectedLocalTool {
  const inventory = sanitizeToolInventory(tools);
  const override = env.DATAHUB_MCP_READONLY_TOOL?.trim();
  if (override) {
    const found = tools.find((t) => t.name === override);
    if (!found || classifyTool(found) !== 'read' || found.annotations?.readOnlyHint !== true) {
      throw new LocalOssMcpError(
        'NO_VERIFIED_READONLY_TOOL',
        'Override tool is missing or not proven read-only',
        { override },
      );
    }
    return {
      name: found.name,
      selection_reason: 'env_override',
      annotations: found.annotations ?? null,
      classified_as: 'read',
      readonly_evidence: `env_override+readOnlyHint=${String(found.annotations?.readOnlyHint)}`,
    };
  }

  const reads = tools.filter((t) => classifyTool(t) === 'read');
  if (reads.length === 0) {
    throw new LocalOssMcpError(
      'NO_VERIFIED_READONLY_TOOL',
      'No unambiguously read-only metadata tool in live tools/list inventory',
      {
        tool_names: inventory.map((i) => i.name),
        classifications: inventory.map((i) => ({
          name: i.name,
          class: i.classification,
        })),
      },
    );
  }

  for (const preferred of LOCAL_READONLY_TOOL_PREFERENCE) {
    const hit = reads.find((t) => t.name === preferred);
    if (hit && hit.annotations?.readOnlyHint === true) {
      return {
        name: hit.name,
        selection_reason: 'preference',
        annotations: hit.annotations ?? null,
        classified_as: 'read',
        readonly_evidence: 'readOnlyHint=true + preference order',
      };
    }
  }

  const hinted = reads.find((t) => t.annotations?.readOnlyHint === true);
  if (!hinted) {
    throw new LocalOssMcpError(
      'NO_VERIFIED_READONLY_TOOL',
      'Read candidates lack readOnlyHint=true; refusing ambiguous tools',
      { candidates: reads.map((t) => t.name) },
    );
  }
  return {
    name: hinted.name,
    selection_reason: 'readOnlyHint',
    annotations: hinted.annotations ?? null,
    classified_as: 'read',
    readonly_evidence: 'readOnlyHint=true',
  };
}

export function parseReadonlyArgs(env: LocalOssMcpEnv = {}): Record<string, unknown> | null {
  const raw = env.DATAHUB_MCP_READONLY_ARGS_JSON;
  if (!raw || raw.trim() === '') return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('args must be object');
    }
    return redactSecrets(parsed);
  } catch (error) {
    throw new LocalOssMcpError('PROTOCOL_ERROR', 'DATAHUB_MCP_READONLY_ARGS_JSON invalid', {
      cause: error instanceof Error ? error.message : String(error),
    });
  }
}

export function buildDefaultSearchArgs(tool: McpToolDescriptor): Record<string, unknown> {
  const schema = (tool.inputSchema ?? {}) as Record<string, unknown>;
  const props = (schema.properties ?? {}) as Record<string, unknown>;
  const args: Record<string, unknown> = {};
  if ('query' in props) args.query = 'dataset';
  if ('num_results' in props) args.num_results = 5;
  else if ('limit' in props) args.limit = 5;
  if (Object.keys(args).length === 0) {
    args.query = 'dataset';
    args.num_results = 5;
  }
  return args;
}

export async function closeLocalOssSession(
  session: LocalOssSession | null | undefined,
): Promise<void> {
  if (!session || session._closed) return;
  session._closed = true;
  const child = session._child;
  session._child = null;
  if (!child) return;
  try {
    child.stdin.end();
  } catch {
    // ignore
  }
  const forceKill = setTimeout(() => {
    try {
      child.kill('SIGKILL');
    } catch {
      // ignore
    }
  }, 2000);
  try {
    child.kill('SIGTERM');
  } catch {
    // ignore
  }
  await new Promise<void>((resolve) => {
    child.once('exit', () => {
      clearTimeout(forceKill);
      resolve();
    });
    child.once('error', () => {
      clearTimeout(forceKill);
      resolve();
    });
  });
}

async function initializeSession(session: LocalOssSession): Promise<void> {
  let nextId = session._nextId;

  const init = await jsonRpcCall(session, nextId++, 'initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: {
      name: 'mg-datahub-oss-local-readonly-validator',
      version: '1.0.0',
    },
  });
  if (!init.rpc || !('result' in init.rpc)) {
    throw new LocalOssMcpError('LOCAL_MCP_INITIALIZE_FAILED', 'initialize returned no result', {
      http_status: init.http_status,
    });
  }

  const initResult = init.rpc.result as Record<string, unknown>;
  const protocol_version =
    typeof initResult.protocolVersion === 'string' ? initResult.protocolVersion : null;
  const serverInfoRaw =
    initResult.serverInfo && typeof initResult.serverInfo === 'object'
      ? (initResult.serverInfo as Record<string, unknown>)
      : null;
  const server_info = {
    name: serverInfoRaw && typeof serverInfoRaw.name === 'string' ? serverInfoRaw.name : null,
    version:
      serverInfoRaw && typeof serverInfoRaw.version === 'string' ? serverInfoRaw.version : null,
  };
  if (!server_info.name || !server_info.version || !protocol_version) {
    throw new LocalOssMcpError(
      'LOCAL_MCP_INITIALIZE_FAILED',
      'initialize missing serverInfo/protocolVersion',
      { server_info, protocol_version },
    );
  }
  const capabilities =
    initResult.capabilities && typeof initResult.capabilities === 'object'
      ? (initResult.capabilities as Record<string, unknown>)
      : null;

  try {
    if (session.transport === 'http-jsonrpc-stateless' && session._fetchImpl) {
      await session._fetchImpl(session.endpoint, {
        method: 'POST',
        headers: {
          accept: 'application/json, text/event-stream',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'notifications/initialized',
          params: {},
        }),
      });
    } else if (session.transport === 'stdio-subprocess' && session._child?.stdin.writable) {
      session._child.stdin.write(
        encodeStdioMessage({
          jsonrpc: '2.0',
          method: 'notifications/initialized',
          params: {},
        }),
      );
    }
  } catch {
    // ignore
  }

  const listed = await jsonRpcCall(session, nextId++, 'tools/list', {});
  if (!listed.rpc || !('result' in listed.rpc)) {
    throw new LocalOssMcpError('TOOLS_LIST_FAILED', 'tools/list returned no result');
  }
  const listResult = listed.rpc.result as Record<string, unknown>;
  if (!Array.isArray(listResult.tools)) {
    throw new LocalOssMcpError('TOOLS_LIST_FAILED', 'tools/list result.tools is not an array');
  }
  const tools = listResult.tools.filter(
    (t): t is McpToolDescriptor =>
      !!t && typeof t === 'object' && typeof (t as McpToolDescriptor).name === 'string',
  );
  const inventory = sanitizeToolInventory(tools);

  session.protocol_version = protocol_version;
  session.server_info = server_info;
  session.capabilities = capabilities;
  session.tools = tools;
  session.inventory = inventory;
  session.tool_inventory_digest = toolInventoryDigest(inventory);
  session._nextId = nextId;
}

export async function connectLocalOssMcp(
  env: LocalOssMcpEnv = {},
  fetchImpl?: FetchImpl,
): Promise<LocalOssSession> {
  if (!isLocalOssAllowed(env)) {
    throw new LocalOssMcpError(
      'LOCAL_NOT_ALLOWED',
      'Local OSS MCP requires DATAHUB_LOCAL_MCP_ALLOW=true',
    );
  }

  const httpPath = usesHttpTransport(env, fetchImpl);
  assertLiveGmsEnv(env, {
    httpPath,
    hasSessionOverride: false,
    hasFetchImpl: fetchImpl !== undefined,
  });

  if (httpPath) {
    const endpoint = resolveLocalMcpEndpoint(env);
    const session: LocalOssSession = {
      endpoint,
      protocol_version: null,
      server_info: { name: null, version: null },
      capabilities: null,
      tools: [],
      inventory: [],
      tool_inventory_digest: '',
      transport: 'http-jsonrpc-stateless',
      metadata_call_count: 0,
      _fetchImpl: fetchImpl ?? defaultFetch(),
      _nextId: 1,
      _child: null,
      _closed: false,
    };
    try {
      await initializeSession(session);
      return session;
    } catch (error) {
      await closeLocalOssSession(session);
      throw error;
    }
  }

  let child: ChildProcessWithoutNullStreams;
  try {
    child = spawnOfficialMcp(env);
  } catch (error) {
    if (error instanceof LocalOssMcpError) throw error;
    throw new LocalOssMcpError('BLOCKED_MCP_STARTUP', 'Failed to start official MCP server', {
      cause: error instanceof Error ? error.message : String(error),
    });
  }

  const session: LocalOssSession = {
    endpoint: 'stdio:mcp-server-datahub',
    protocol_version: null,
    server_info: { name: null, version: null },
    capabilities: null,
    tools: [],
    inventory: [],
    tool_inventory_digest: '',
    transport: 'stdio-subprocess',
    metadata_call_count: 0,
    _nextId: 1,
    _child: child,
    _closed: false,
  };
  attachStdioReader(session);

  child.once('exit', () => {
    session._child = null;
  });

  try {
    await initializeSession(session);
    return session;
  } catch (error) {
    await closeLocalOssSession(session);
    if (error instanceof LocalOssMcpError) throw error;
    throw new LocalOssMcpError('BLOCKED_MCP_STARTUP', 'MCP initialize/list failed after spawn', {
      cause: error instanceof Error ? error.message : String(error),
    });
  }
}

export function extractEntityIdentity(text: string): string | null {
  const urnMatch = text.match(/urn:li:dataset:\([^)]+\)/);
  if (urnMatch) return urnMatch[0];
  const anyUrn = text.match(/urn:li:[a-zA-Z0-9_():,\-./]+/);
  return anyUrn ? anyUrn[0] : null;
}

export function extractPlatformFromDatasetUrn(urn: string): string {
  const m = urn.match(/^urn:li:dataset:\(urn:li:dataPlatform:([^,]+),/);
  return m?.[1] ?? 'UNKNOWN';
}

export function extractNameFromDatasetUrn(urn: string): string {
  const m = urn.match(/^urn:li:dataset:\(urn:li:dataPlatform:[^,]+,([^,]+),/);
  return m?.[1] ?? 'UNKNOWN';
}

export async function callReadOnlyToolOnce(
  session: LocalOssSession,
  tool: SelectedLocalTool,
  args: Record<string, unknown>,
  now: () => Date = () => new Date(),
): Promise<LocalToolCallResult> {
  const descriptor = session.tools.find((t) => t.name === tool.name);
  if (!descriptor || classifyTool(descriptor) !== 'read') {
    throw new LocalOssMcpError(
      'NO_VERIFIED_READONLY_TOOL',
      'Refusing tools/call for non-read tool',
      { tool: tool.name },
    );
  }
  const argsText = JSON.stringify(args);
  if (SENSITIVE_KEY_RE.test(argsText) || /Bearer\s+\S+/i.test(argsText)) {
    throw new LocalOssMcpError(
      'SECRET_LEAK_GUARD',
      'Refusing tool arguments that appear to contain secrets',
    );
  }

  const requestId = session._nextId++;
  session.metadata_call_count += 1;
  const call = await jsonRpcCall(session, requestId, 'tools/call', {
    name: tool.name,
    arguments: args,
  });
  if (!call.rpc || !('result' in call.rpc)) {
    throw new LocalOssMcpError('TOOL_CALL_FAILED', 'tools/call returned no result', {
      tool: tool.name,
    });
  }
  const result = call.rpc.result;
  const is_error =
    !!result &&
    typeof result === 'object' &&
    !Array.isArray(result) &&
    (result as { isError?: boolean }).isError === true;

  const textParts: string[] = [];
  if (result && typeof result === 'object' && !Array.isArray(result)) {
    const content = (result as { content?: unknown }).content;
    if (Array.isArray(content)) {
      for (const part of content) {
        if (
          part &&
          typeof part === 'object' &&
          (part as { type?: string }).type === 'text' &&
          typeof (part as { text?: string }).text === 'string'
        ) {
          textParts.push((part as { text: string }).text);
        }
      }
    }
    const structured = (result as { structuredContent?: unknown }).structuredContent;
    if (structured !== undefined) {
      textParts.push(JSON.stringify(structured));
    }
  }
  const text_content = textParts.join('\n');
  if (is_error) {
    throw new LocalOssMcpError('TOOL_CALL_FAILED', 'tools/call returned isError=true', {
      tool: tool.name,
      content_digest: sha256Hex(text_content),
    });
  }
  const entity_identity = extractEntityIdentity(text_content);
  if (!entity_identity) {
    throw new LocalOssMcpError(
      'BLOCKED_EMPTY_LOCAL_CATALOG',
      'Read succeeded but no attributable entity/dataset URN was found (empty local catalog)',
      { tool: tool.name, content_digest: sha256Hex(text_content), alias: 'ATTRIBUTION_UNPROVEN' },
    );
  }

  return {
    tool_name: tool.name,
    request_id: requestId,
    retrieval_timestamp: now().toISOString(),
    sanitized_arguments: { ...args },
    result,
    text_content,
    content_digest: sha256Hex(text_content),
    response_digest: digestJson(call.rpc),
    is_error: false,
    entity_identity,
  };
}

export function assertNoSecretsInProofText(text: string): void {
  if (/Bearer\s+[A-Za-z0-9\-._~+/]+=*/i.test(text)) {
    throw new LocalOssMcpError('SECRET_LEAK_GUARD', 'Proof text contains bearer credential material');
  }
  if (/"access_token"\s*:/i.test(text) || /"refresh_token"\s*:/i.test(text)) {
    throw new LocalOssMcpError('SECRET_LEAK_GUARD', 'Proof text contains token fields');
  }
  if (/"client_secret"\s*:/i.test(text)) {
    throw new LocalOssMcpError('SECRET_LEAK_GUARD', 'Proof text contains client_secret');
  }
  if (/"eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+"/i.test(text)) {
    throw new LocalOssMcpError('SECRET_LEAK_GUARD', 'Proof text contains JWT-shaped value');
  }
}

export function hashBuffer(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}
