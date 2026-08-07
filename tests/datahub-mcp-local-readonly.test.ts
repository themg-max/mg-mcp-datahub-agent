import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { parseArgs } from '../src/cli.js';
import {
  buildLocalOssWorkPacket,
  LOCAL_OSS_AUTHORITY,
  normalizeLocalOssRetrieval,
  runReadonlyContextPipeline,
} from '../src/datahub/context-adapter.js';
import {
  assertNoSecretsInProofText,
  classifyTool,
  connectLocalOssMcp,
  isLocalOssAllowed,
  LocalOssMcpError,
  selectReadOnlyTool,
  type McpToolDescriptor,
} from '../src/datahub/local-oss-mcp-client.js';
import {
  LOCAL_OSS_HARNESS_CLASS,
  LOCAL_OSS_PROOF_REL_PATH,
  localOssExitCode,
  mapLiveMetadataToContent,
  parseLocalOssProof,
  runLocalOssReadonlyValidation,
  writeLocalOssProof,
} from '../src/datahub/local-oss-validation.js';
import {
  METADATA_FRESHNESS_POLICY,
  sha256Hex,
  stableJsonStringify,
  type RetrievalResult,
} from '../src/datahub/mcp-client.js';

const repoRoot = process.cwd();

function makeTool(
  name: string,
  annotations?: McpToolDescriptor['annotations'],
): McpToolDescriptor {
  const tool: McpToolDescriptor = {
    name,
    description: `${name} tool`,
    inputSchema: {
      type: 'object',
      properties: { query: { type: 'string' }, num_results: { type: 'integer' } },
    },
  };
  if (annotations !== undefined) {
    tool.annotations = annotations;
  }
  return tool;
}

interface MockServer {
  endpoint: string;
  close(): Promise<void>;
  callCount: { toolsCall: number };
}

async function startMockLocalMcp(options: {
  mode: 'readonly' | 'write-only' | 'no-entity';
}): Promise<MockServer> {
  const readonlyTools: McpToolDescriptor[] = [
    makeTool('search', { readOnlyHint: true }),
    makeTool('get_entities', { readOnlyHint: true }),
    makeTool('get_dataset_queries', { readOnlyHint: true }),
    makeTool('create_tag', { readOnlyHint: false, destructiveHint: true }),
  ];
  const writeOnlyTools: McpToolDescriptor[] = [
    makeTool('create_tag', { readOnlyHint: false, destructiveHint: true }),
    makeTool('delete_entity', { readOnlyHint: false }),
  ];
  const callCount = { toolsCall: 0 };

  const server = http.createServer((req, res) => {
    const url = new URL(req.url || '/', 'http://127.0.0.1');
    const sendJson = (status: number, body: unknown, asSse = false) => {
      if (asSse) {
        const payload = `event: message\ndata: ${JSON.stringify(body)}\n\n`;
        res.writeHead(status, { 'content-type': 'text/event-stream' });
        res.end(payload);
        return;
      }
      const text = JSON.stringify(body);
      res.writeHead(status, {
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(text),
      });
      res.end(text);
    };

    if (req.method === 'POST' && url.pathname === '/mcp') {
      let raw = '';
      req.on('data', (chunk) => {
        raw += chunk;
      });
      req.on('end', () => {
        let body: Record<string, unknown> = {};
        try {
          body = JSON.parse(raw || '{}') as Record<string, unknown>;
        } catch {
          body = {};
        }
        const method = typeof body.method === 'string' ? body.method : '';
        const id = body.id ?? 1;

        if (method === 'notifications/initialized') {
          res.writeHead(202).end();
          return;
        }
        if (method === 'initialize') {
          sendJson(
            200,
            {
              jsonrpc: '2.0',
              id,
              result: {
                protocolVersion: '2024-11-05',
                capabilities: { tools: {} },
                serverInfo: { name: 'datahub', version: '3.4.6-test' },
              },
            },
            true,
          );
          return;
        }
        if (method === 'tools/list') {
          sendJson(
            200,
            {
              jsonrpc: '2.0',
              id,
              result: {
                tools: options.mode === 'write-only' ? writeOnlyTools : readonlyTools,
              },
            },
            true,
          );
          return;
        }
        if (method === 'tools/call') {
          callCount.toolsCall += 1;
          const params = (body.params || {}) as Record<string, unknown>;
          const name = typeof params.name === 'string' ? params.name : '';
          if (name !== 'search' && name !== 'get_entities') {
            sendJson(200, {
              jsonrpc: '2.0',
              id,
              result: { isError: true, content: [{ type: 'text', text: 'blocked' }] },
            });
            return;
          }
          if (options.mode === 'no-entity') {
            sendJson(
              200,
              {
                jsonrpc: '2.0',
                id,
                result: {
                  content: [{ type: 'text', text: JSON.stringify({ searchResults: [] }) }],
                },
              },
              true,
            );
            return;
          }
          const urn = 'urn:li:dataset:(urn:li:dataPlatform:hive,SampleHiveDataset,PROD)';
          sendJson(
            200,
            {
              jsonrpc: '2.0',
              id,
              result: {
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify({
                      start: 0,
                      count: 1,
                      total: 1,
                      searchResults: [
                        {
                          entity: {
                            urn,
                            properties: { name: 'SampleHiveDataset' },
                          },
                        },
                      ],
                    }),
                  },
                ],
              },
            },
            true,
          );
          return;
        }
        sendJson(400, { error: 'unknown method' });
      });
      return;
    }
    res.writeHead(404).end();
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const addr = server.address();
  if (!addr || typeof addr === 'string') throw new Error('no address');
  return {
    endpoint: `http://127.0.0.1:${addr.port}/mcp`,
    callCount,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      }),
  };
}

test('isLocalOssAllowed requires exact true (case-insensitive)', () => {
  assert.equal(isLocalOssAllowed({}), false);
  assert.equal(isLocalOssAllowed({ DATAHUB_LOCAL_MCP_ALLOW: 'yes' }), false);
  assert.equal(isLocalOssAllowed({ DATAHUB_LOCAL_MCP_ALLOW: 'TRUE' }), true);
  assert.equal(isLocalOssAllowed({ DATAHUB_LOCAL_MCP_ALLOW: 'true' }), true);
});

test('missing allow → LOCAL_NOT_ALLOWED blocked proof exit 3', async () => {
  const proof = await runLocalOssReadonlyValidation({
    repoRoot,
    env: {
      DATAHUB_LOCAL_MCP_ALLOW: 'false',
      DATAHUB_LOCAL_MCP_URL: 'http://127.0.0.1:9/mcp',
    },
  });
  assert.equal(proof.status, 'BLOCKED');
  assert.equal(proof.validation_result.fail_closed_code, 'LOCAL_NOT_ALLOWED');
  assert.equal(proof.retrieval.executed, false);
  assert.equal(proof.metadata_call_count, 0);
  assert.equal(localOssExitCode(proof), 3);
});

test('spawn path missing GMS URL blocked before call', async () => {
  const proof = await runLocalOssReadonlyValidation({
    repoRoot,
    env: {
      DATAHUB_LOCAL_MCP_ALLOW: 'true',
      // no DATAHUB_LOCAL_MCP_URL → spawn path
      // no DATAHUB_GMS_URL
      DATAHUB_GMS_TOKEN: 'placeholder-not-used',
    },
  });
  assert.equal(proof.status, 'BLOCKED');
  assert.equal(proof.validation_result.fail_closed_code, 'BLOCKED_LOCAL_GMS_UNAVAILABLE');
  assert.equal(proof.retrieval.executed, false);
  assert.equal(proof.metadata_call_count, 0);
});

test('spawn path missing GMS token blocked before call', async () => {
  const proof = await runLocalOssReadonlyValidation({
    repoRoot,
    env: {
      DATAHUB_LOCAL_MCP_ALLOW: 'true',
      DATAHUB_GMS_URL: 'http://localhost:8080',
      // no token
    },
  });
  assert.equal(proof.status, 'BLOCKED');
  assert.equal(proof.validation_result.fail_closed_code, 'BLOCKED_LOCAL_GMS_AUTH');
  assert.equal(proof.retrieval.executed, false);
});

test('connectLocalOssMcp throws LOCAL_NOT_ALLOWED without allow', async () => {
  await assert.rejects(
    () => connectLocalOssMcp({ DATAHUB_LOCAL_MCP_ALLOW: 'no' }),
    (error: unknown) =>
      error instanceof LocalOssMcpError && error.code === 'LOCAL_NOT_ALLOWED',
  );
});

test('local DataHub live proof parser requires server identity and inventory', () => {
  assert.throws(() => parseLocalOssProof({ harness_class: LOCAL_OSS_HARNESS_CLASS }), /server identity/);
  assert.throws(
    () =>
      parseLocalOssProof({
        harness_class: LOCAL_OSS_HARNESS_CLASS,
        mcp_server: { server_name: 'datahub' },
      }),
    /inventory/,
  );
});

test('write/ambiguous tools rejected; readOnlyHint preferred', () => {
  assert.equal(classifyTool(makeTool('create_tag', { readOnlyHint: false })), 'write');
  assert.equal(classifyTool(makeTool('delete_entity')), 'write');
  assert.equal(
    classifyTool(makeTool('get_dataset_queries', { readOnlyHint: true })),
    'read',
  );
  assert.equal(classifyTool(makeTool('mystery_tool')), 'unknown');

  const selected = selectReadOnlyTool([
    makeTool('create_tag', { readOnlyHint: false }),
    makeTool('search', { readOnlyHint: true }),
    makeTool('get_entities', { readOnlyHint: true }),
  ]);
  assert.equal(selected.name, 'search');
  assert.equal(selected.classified_as, 'read');

  assert.throws(
    () => selectReadOnlyTool([makeTool('create_tag', { readOnlyHint: false })]),
    (error: unknown) =>
      error instanceof LocalOssMcpError && error.code === 'NO_VERIFIED_READONLY_TOOL',
  );
});

test('mock local server: initialize + tools/list + exactly one read → PASS', async () => {
  const mock = await startMockLocalMcp({ mode: 'readonly' });
  try {
    const proof = await runLocalOssReadonlyValidation({
      repoRoot,
      env: {
        DATAHUB_LOCAL_MCP_ALLOW: 'true',
        DATAHUB_LOCAL_MCP_URL: mock.endpoint,
      },
      environmentMeta: {
        gms_health: 'healthy',
        frontend_health: 'unhealthy_without_compose_mutation',
        mcp_package_version: '0.6.0',
      },
      localAuthMeta: {
        local_token_present: true,
        local_token_provenance: 'test',
        human_use_authorization: 'APPROVED',
        persistence: 'NONE',
      },
    });
    assert.equal(proof.status, 'PASS');
    assert.equal(proof.harness_class, LOCAL_OSS_HARNESS_CLASS);
    assert.equal(proof.mcp_server.server_name, 'datahub');
    assert.ok(proof.tool_inventory.count >= 1);
    assert.ok(proof.tool_inventory.digest);
    assert.equal(proof.tool_inventory.selected_tool, 'search');
    assert.equal(proof.tool_inventory.selected_tool_readonly, true);
    assert.equal(proof.retrieval.executed, true);
    assert.match(proof.retrieval.entity_identity || '', /^urn:li:dataset:/);
    assert.equal(proof.authority.runtime_retrieval_status, 'VERIFIED_LOCAL_ONLY');
    assert.equal(proof.authority.human_approval_required, true);
    assert.equal(proof.authority.consumer_eligibility, 'PROPOSED');
    assert.equal(proof.metadata_call_count, 1);
    assert.equal(mock.callCount.toolsCall, 1);
    assert.equal(proof.production_activation, false);
    assert.equal(proof.managed_cloud_oauth, false);
    assert.equal(proof.datahub_writes, false);
    assert.ok(proof.digests.content_digest);
    assert.ok(proof.digests.normalized_record_digest);
    assert.ok(proof.digests.packet_content_digest);
    assert.ok(proof.digests.artifact_sha256);
    assert.notEqual(proof.digests.packet_content_digest, proof.digests.artifact_sha256);
    parseLocalOssProof(proof);
    assert.equal(localOssExitCode(proof), 0);
  } finally {
    await mock.close();
  }
});

test('tools/list write-only inventory → BLOCKED NO_VERIFIED_READONLY_TOOL', async () => {
  const mock = await startMockLocalMcp({ mode: 'write-only' });
  try {
    const proof = await runLocalOssReadonlyValidation({
      repoRoot,
      env: {
        DATAHUB_LOCAL_MCP_ALLOW: 'true',
        DATAHUB_LOCAL_MCP_URL: mock.endpoint,
      },
    });
    assert.equal(proof.status, 'BLOCKED');
    assert.equal(proof.validation_result.fail_closed_code, 'NO_VERIFIED_READONLY_TOOL');
    assert.equal(proof.retrieval.executed, false);
    assert.equal(mock.callCount.toolsCall, 0);
  } finally {
    await mock.close();
  }
});

test('missing entity attribution fails closed as empty catalog', async () => {
  const mock = await startMockLocalMcp({ mode: 'no-entity' });
  try {
    const proof = await runLocalOssReadonlyValidation({
      repoRoot,
      env: {
        DATAHUB_LOCAL_MCP_ALLOW: 'true',
        DATAHUB_LOCAL_MCP_URL: mock.endpoint,
      },
    });
    assert.equal(proof.status, 'BLOCKED');
    assert.ok(
      proof.validation_result.fail_closed_code === 'BLOCKED_EMPTY_LOCAL_CATALOG' ||
        proof.validation_result.fail_closed_code === 'ATTRIBUTION_UNPROVEN',
    );
    assert.equal(proof.metadata_call_count, 1);
  } finally {
    await mock.close();
  }
});

test('secrets excluded from proof text and args guard', () => {
  assert.throws(
    () => assertNoSecretsInProofText(JSON.stringify({ authorization: 'Bearer abc.def.ghi' })),
    (error: unknown) => error instanceof LocalOssMcpError,
  );
  assert.throws(
    () => assertNoSecretsInProofText('{"' + 'access_token' + '":"x"}'),
    (error: unknown) => error instanceof LocalOssMcpError,
  );
  assert.throws(
    () =>
      assertNoSecretsInProofText(
        '"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature"',
      ),
    (error: unknown) => error instanceof LocalOssMcpError,
  );
});

test('deterministic local OSS digests for normalized record + work packet', () => {
  const content = mapLiveMetadataToContent({
    entity_identity: 'urn:li:dataset:(urn:li:dataPlatform:hive,SampleHiveDataset,PROD)',
    text_content: JSON.stringify({
      searchResults: [
        {
          entity: {
            urn: 'urn:li:dataset:(urn:li:dataPlatform:hive,SampleHiveDataset,PROD)',
            properties: { name: 'SampleHiveDataset' },
          },
        },
      ],
    }),
  });
  const retrieval: RetrievalResult = {
    mode: 'mcp',
    response_path: LOCAL_OSS_PROOF_REL_PATH,
    source: {
      identity: 'local-oss-mcp:datahub@test',
      system: 'DataHub',
      environment: 'local_datahub_oss',
    },
    tool: {
      identity: 'local-oss-mcp.tool.search',
      name: 'search',
      version: 'test',
      operation: 'read',
    },
    attribution: {
      owner_team: 'UNKNOWN',
      data_governance_owner: 'UNKNOWN',
      retrieved_by: 'test',
      license_or_use_constraint: 'test',
    },
    provenance: {
      retrieved_at: '2026-08-06T00:00:00.000Z',
      request_id: '1',
      content_encoding: 'application/json',
      transport: 'http-jsonrpc-stateless',
      response_path: LOCAL_OSS_PROOF_REL_PATH,
    },
    content,
    raw_response: {
      contract_class: 'official-datahub-mcp-readonly-recorded-response',
      retrieval_mode: 'mcp',
      source: {
        identity: 'local-oss-mcp:datahub@test',
        system: 'DataHub',
        environment: 'local_datahub_oss',
      },
      tool: {
        identity: 'local-oss-mcp.tool.search',
        name: 'search',
        version: 'test',
        operation: 'read',
      },
      attribution: {
        owner_team: 'UNKNOWN',
        data_governance_owner: 'UNKNOWN',
        retrieved_by: 'test',
        license_or_use_constraint: 'test',
      },
      provenance: {
        retrieved_at: '2026-08-06T00:00:00.000Z',
        request_id: '1',
        content_encoding: 'application/json',
        transport: 'http-jsonrpc-stateless',
      },
      content,
    },
    content_digest: sha256Hex('content'),
    envelope_digest: sha256Hex('envelope'),
    freshness_status: 'UNKNOWN',
    freshness_policy: METADATA_FRESHNESS_POLICY,
  };

  const a = normalizeLocalOssRetrieval(retrieval);
  const b = normalizeLocalOssRetrieval(retrieval);
  assert.equal(a.text, b.text);
  assert.equal(a.record.authority.record_status, LOCAL_OSS_AUTHORITY.record_status);
  assert.equal(a.record.authority.runtime_retrieval_status, 'VERIFIED_LOCAL_ONLY');
  const wa = buildLocalOssWorkPacket(a.record);
  const wb = buildLocalOssWorkPacket(b.record);
  assert.equal(wa.text, wb.text);
  assert.equal(wa.artifact_sha256, wb.artifact_sha256);
  assert.notEqual(wa.artifact_sha256, wa.packet.digests.packet_content_digest);
  assert.equal(wa.packet.human_approval_required, true);
  assert.ok(wa.packet.blocked_actions.includes('datahub_write'));
  assert.ok(wa.packet.blocked_actions.includes('mg_mcp_write'));
  assert.ok(wa.packet.blocked_actions.includes('production_activation'));
  assert.ok(wa.packet.blocked_actions.includes('autonomous_github_merge'));
  assert.ok(wa.packet.blocked_actions.includes('oauth_bootstrap'));
  assert.ok(wa.packet.validation_commands.includes('npm run typecheck'));
});

test('prior recorded harness remains unchanged (Mode A)', () => {
  const fixture = runReadonlyContextPipeline({ mode: 'fixture', repoRoot });
  const mcp = runReadonlyContextPipeline({ mode: 'mcp', repoRoot });
  assert.equal(fixture.normalized.record.authority.record_status, 'FIXTURE');
  assert.equal(fixture.normalized.record.authority.runtime_retrieval_status, 'UNKNOWN');
  assert.equal(mcp.normalized.record.authority.record_status, 'MCP_READONLY_RECORDED');
  assert.equal(mcp.normalized.record.authority.runtime_retrieval_status, 'UNKNOWN');
  assert.equal(fixture.workPacket.packet.human_approval_required, true);
  // CLI default without mode remains undefined (legacy demo path), fixture mode explicit
  assert.equal(parseArgs([], repoRoot).mode, undefined);
  assert.equal(parseArgs(['--mode=fixture'], repoRoot).mode, 'fixture');
  assert.equal(parseArgs(['--mode=local-oss'], repoRoot).mode, 'local-oss');
});

test('writeLocalOssProof refuses secret-bearing payloads and writes clean proof', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'local-oss-proof-'));
  const proof: import('../src/datahub/local-oss-validation.js').LocalOssProofSummary = {
    status: 'PASS',
    harness_class: LOCAL_OSS_HARNESS_CLASS,
    captured_at: '2026-08-06T00:00:00.000Z',
    environment: {
      mode: 'local_datahub_oss' as const,
      gms_url: 'http://localhost:8080',
      compose_project: 'datahub',
      deployment_modified: true,
      modification_scope: 'start existing quickstart services only',
      gms_health: 'healthy',
      frontend_health: 'unknown',
      mcp_package: 'mcp-server-datahub',
      mcp_package_version: '0.6.0',
    },
    mcp_server: {
      implementation: 'mcp-server-datahub',
      version: '0.6.0',
      transport: 'http-jsonrpc-stateless',
      server_name: 'datahub',
      protocol_version: '2024-11-05',
    },
    tool_inventory: {
      count: 1,
      digest: 'abc',
      selected_tool: 'search',
      selected_tool_readonly: true,
      readonly_evidence: 'readOnlyHint=true',
      items: [],
    },
    retrieval: {
      executed: true,
      entity_identity: 'urn:li:dataset:(urn:li:dataPlatform:hive,SampleHiveDataset,PROD)',
      timestamp: '2026-08-06T00:00:00.000Z',
      attribution_status: 'ENTITY_URN_ATTRIBUTED',
      sanitized_arguments: { query: 'x' },
      request_id: 1,
      content_digest: 'x',
    },
    digests: {
      content_digest: 'x',
      normalized_record_digest: 'y',
      packet_content_digest: 'z',
      artifact_sha256: 'w',
    },
    authority: {
      ...LOCAL_OSS_AUTHORITY,
      human_approval_required: true as const,
    },
    local_auth: {
      local_token_present: true,
      local_token_provenance: 'test',
      human_use_authorization: 'APPROVED' as const,
      persistence: 'NONE' as const,
    },
    metadata_call_count: 1,
    production_activation: false as const,
    managed_cloud_oauth: false as const,
    datahub_writes: false as const,
    unknowns: [],
    validation_result: {
      ok: true,
      outcome: 'PASS' as const,
      errors: [],
      fail_closed_code: null,
    },
    notes: ['clean'],
  };
  const written = writeLocalOssProof(dir, proof, { allowNonPass: true });
  assert.equal(written.written, true);
  assert.ok(fs.existsSync(written.path));
  assertNoSecretsInProofText(written.text);
  assert.equal(
    LOCAL_OSS_PROOF_REL_PATH,
    'examples/official-mcp-proof/local-oss-live-readonly-validation-summary.json',
  );
  assert.equal(stableJsonStringify({ a: 1, b: 2 }), stableJsonStringify({ b: 2, a: 1 }));
});
