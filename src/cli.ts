import { readFile } from "node:fs/promises";
import fs from "node:fs";
import path, { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  buildProofSummary,
  DataHubContextAdapter,
  runReadonlyContextPipeline,
} from "./datahub/context-adapter.js";
import {
  DEFAULT_MCP_READONLY_FIXTURE_REL_PATH,
  type RetrievalMode,
  stableJsonStringify,
} from "./datahub/mcp-client.js";
import {
  LOCAL_OSS_PROOF_REL_PATH,
  localOssExitCode,
  runLocalOssReadonlyValidation,
  writeLocalOssProof,
  type LocalOssProofSummary,
} from "./datahub/local-oss-validation.js";
import { buildWorkPacket } from "./work-packet.js";

interface DemoFixture {
  objective?: unknown;
  allowedScope?: unknown;
  blockedScope?: unknown;
  requiredValidation?: unknown;
  source?: unknown;
}

const DEFAULT_FIXTURE_PATH = new URL("../../fixtures/datahub-context.json", import.meta.url);

export type CliMode = RetrievalMode | "local-oss";

export interface CliOptions {
  mode?: CliMode;
  responsePath?: string;
  writeExamples: boolean;
  writeLocalOssProof: boolean;
  help: boolean;
  repoRoot: string;
  legacyInput?: string;
}

const HELP_TEXT = `DataHub agent CLI

Modes:
  (default)           Legacy fixture demo (NormalizedContextRecord + WorkPacket JSON)
  --mode=fixture      Recorded MCP read-only contract harness (Mode A)
  --mode=mcp          Same recorded harness with explicit mcp mode label (Mode A)
  --mode=local-oss    Optional live local DataHub OSS official MCP read-only path (Mode B)

Mode A flags:
  --write-examples    Write Mode A proof + work packet under examples/

Mode B flags:
  --write-local-oss-proof   Write sanitized Mode B proof under examples/official-mcp-proof/

Mode B environment (never pass secrets on argv; placeholders only):
  DATAHUB_LOCAL_MCP_ALLOW=true          Required exact allow gate (case-insensitive true)
  DATAHUB_GMS_URL=http://localhost:8080 Local GMS base URL (spawn path)
  DATAHUB_GMS_TOKEN=<local-token>       Local GMS token via env only (never logged)
  DATAHUB_LOCAL_MCP_URL=http://127.0.0.1:<port>/mcp
                                        Optional HTTP MCP endpoint (localhost only)
  DATAHUB_MCP_READONLY_TOOL=search      Optional tool override (must be readOnlyHint=true)
  DATAHUB_MCP_READONLY_ARGS_JSON={}     Optional tool args JSON

Safety:
  - Exactly one metadata tools/call on the live path
  - No DataHub writes, no cloud/OAuth bootstrap, no production activation
  - consumer_eligibility remains PROPOSED; human_approval_required remains true
`;

export function parseArgs(argv: string[], repoRoot = process.cwd()): CliOptions {
  const opts: CliOptions = {
    writeExamples: false,
    writeLocalOssProof: false,
    help: false,
    repoRoot,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === undefined) {
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      opts.help = true;
      continue;
    }
    if (arg === "--write-examples") {
      opts.writeExamples = true;
      continue;
    }
    if (arg === "--write-local-oss-proof") {
      opts.writeLocalOssProof = true;
      continue;
    }
    if (arg === "--mode=fixture" || arg === "--mode=mcp" || arg === "--mode=local-oss") {
      opts.mode =
        arg === "--mode=fixture" ? "fixture" : arg === "--mode=mcp" ? "mcp" : "local-oss";
      continue;
    }
    if (arg.startsWith("--mode=")) {
      throw new Error(`Unsupported --mode value: ${arg.slice("--mode=".length)}`);
    }
    if (arg === "--response" || arg === "--response-path") {
      const value = argv[i + 1];
      if (!value) {
        throw new Error(`${arg} requires a path`);
      }
      opts.responsePath = value;
      i += 1;
      continue;
    }
    if (arg.startsWith("--response=")) {
      opts.responsePath = arg.slice("--response=".length);
      continue;
    }
    if (arg === "--input") {
      const value = argv[i + 1];
      if (!value) {
        throw new Error("--input requires a fixture path.");
      }
      opts.legacyInput = value;
      i += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return opts;
}

function sanitizeLocalOssSummary(proof: LocalOssProofSummary): Record<string, unknown> {
  return {
    status: proof.status,
    harness_class: proof.harness_class,
    human_approval_required: true as const,
    consumer_eligibility: proof.authority.consumer_eligibility,
    runtime_retrieval_status: proof.authority.runtime_retrieval_status,
    record_status: proof.authority.record_status,
    source_binding_status: proof.authority.source_binding_status,
    metadata_call_count: proof.metadata_call_count,
    production_activation: proof.production_activation,
    managed_cloud_oauth: proof.managed_cloud_oauth,
    datahub_writes: proof.datahub_writes,
    selected_tool: proof.tool_inventory.selected_tool,
    selected_tool_readonly: proof.tool_inventory.selected_tool_readonly,
    entity_identity: proof.retrieval.entity_identity,
    validation_result: proof.validation_result,
    digests: proof.digests,
    notes: proof.notes,
    proof_path: LOCAL_OSS_PROOF_REL_PATH,
  };
}

export function runCli(
  argv: string[],
  repoRoot = process.cwd(),
): { exitCode: number; stdout: string; stderr: string } {
  try {
    const opts = parseArgs(argv, repoRoot);
    if (opts.help) {
      return {
        exitCode: 0,
        stdout: HELP_TEXT,
        stderr: "",
      };
    }

    if (opts.mode === "local-oss") {
      return {
        exitCode: 1,
        stdout: "",
        stderr:
          "ERROR: --mode=local-oss is async; use runCliAsync() or the CLI entrypoint.\n",
      };
    }

    const mode: RetrievalMode = opts.mode ?? "fixture";
    const pipelineOptions: {
      mode: RetrievalMode;
      repoRoot: string;
      responsePath?: string;
    } = {
      mode,
      repoRoot: opts.repoRoot,
    };
    if (opts.responsePath !== undefined) {
      pipelineOptions.responsePath = opts.responsePath;
    }
    const result = runReadonlyContextPipeline(pipelineOptions);
    const proof = buildProofSummary(result);

    if (opts.writeExamples) {
      const workPacketAbs = resolve(
        opts.repoRoot,
        "examples/generated-work-packet/datahub-mcp-readonly-work-packet.json",
      );
      const proofAbs = resolve(
        opts.repoRoot,
        "examples/official-mcp-proof/read-only-retrieval-summary.json",
      );
      fs.mkdirSync(dirname(workPacketAbs), { recursive: true });
      fs.mkdirSync(dirname(proofAbs), { recursive: true });
      fs.writeFileSync(workPacketAbs, result.workPacket.text, "utf8");
      fs.writeFileSync(proofAbs, stableJsonStringify(proof), "utf8");
    }

    const payload = {
      status: proof.status,
      harness_class: proof.harness_class,
      retrieval_mode: proof.retrieval_mode,
      human_approval_required: true as const,
      source_identity: proof.source_identity,
      tool_identity: proof.tool_identity,
      digests: {
        content_digest: proof.content_digest,
        normalized_record_digest: proof.normalized_record_digest,
        packet_content_digest: proof.packet_content_digest,
        artifact_sha256: proof.artifact_sha256,
      },
      freshness_status: proof.freshness_status,
      validation_result: proof.validation_result,
      claim_scope: {
        live_mcp_connection: false,
        official_tool_invocation: false,
        recorded_response_contract_harness: true,
      },
      response_path: proof.response_path || DEFAULT_MCP_READONLY_FIXTURE_REL_PATH,
      notes: proof.notes,
    };

    return { exitCode: 0, stdout: stableJsonStringify(payload), stderr: "" };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code: unknown }).code)
        : "ERROR";
    return { exitCode: 1, stdout: "", stderr: `${code}: ${message}\n` };
  }
}

export async function runCliAsync(
  argv: string[],
  repoRoot = process.cwd(),
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  try {
    const opts = parseArgs(argv, repoRoot);
    if (opts.help) {
      return { exitCode: 0, stdout: HELP_TEXT, stderr: "" };
    }

    if (opts.mode === "local-oss") {
      const proof = await runLocalOssReadonlyValidation({
        repoRoot: opts.repoRoot,
        env: process.env as Record<string, string | undefined>,
      });
      let proofWritten: string | null = null;
      if (opts.writeLocalOssProof) {
        // Only persist PASS proofs to the canonical public path so a local
        // BLOCKED run cannot overwrite the committed VERIFIED_LOCAL_ONLY summary.
        const written = writeLocalOssProof(opts.repoRoot, proof);
        proofWritten = written.written
          ? path
              .relative(opts.repoRoot, written.path)
              .split(path.sep)
              .join("/")
          : null;
      }
      const summary = {
        ...sanitizeLocalOssSummary(proof),
        proof_written: proofWritten,
      };
      return {
        exitCode: localOssExitCode(proof),
        stdout: stableJsonStringify(summary),
        stderr: "",
      };
    }

    return runCli(argv, repoRoot);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code: unknown }).code)
        : "ERROR";
    return { exitCode: 1, stdout: "", stderr: `${code}: ${message}\n` };
  }
}

async function runLegacyFixtureDemo(inputPath?: string): Promise<void> {
  const fixturePath = inputPath
    ? pathToFileURL(resolve(process.cwd(), inputPath))
    : DEFAULT_FIXTURE_PATH;
  const raw = await readFile(fixturePath, "utf8");
  const fixture = JSON.parse(raw) as DemoFixture;
  const objective = asString(fixture.objective);
  const allowedScope = asStringArray(fixture.allowedScope);
  const blockedScope = asStringArray(fixture.blockedScope);
  const requiredValidation = asStringArray(fixture.requiredValidation);
  const normalizedRecords = new DataHubContextAdapter().normalize(fixture.source);

  if (!objective) {
    throw new Error("Fixture objective is missing or invalid.");
  }
  if (allowedScope.length === 0) {
    throw new Error("Fixture allowedScope must contain at least one file path.");
  }
  if (normalizedRecords.length === 0) {
    throw new Error("No normalized context records were produced from the fixture.");
  }

  const workPacket = buildWorkPacket({
    objective,
    currentContext: normalizedRecords,
    allowedScope,
    blockedScope,
    requiredValidation,
  });

  process.stdout.write(JSON.stringify({ normalizedRecords, workPacket }, null, 2));
  process.stdout.write("\n");
}

function asString(input: unknown): string | undefined {
  return typeof input === "string" && input.trim().length > 0 ? input.trim() : undefined;
}

function asStringArray(input: unknown): string[] {
  if (!Array.isArray(input)) {
    return [];
  }
  const result: string[] = [];
  for (const entry of input) {
    const value = asString(entry);
    if (value) {
      result.push(value);
    }
  }
  return result;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const opts = parseArgs(argv, process.cwd());
  if (opts.help) {
    process.stdout.write(HELP_TEXT);
    return;
  }

  // Preserve existing npm run demo / demo:json behavior.
  if (opts.mode === undefined && !opts.writeExamples && !opts.writeLocalOssProof) {
    await runLegacyFixtureDemo(opts.legacyInput);
    return;
  }

  const result = await runCliAsync(argv, process.cwd());
  if (result.stdout) {
    process.stdout.write(result.stdout);
  }
  if (result.stderr) {
    process.stderr.write(result.stderr);
  }
  process.exitCode = result.exitCode;
}

const entry = process.argv[1] ? resolve(process.argv[1]) : "";
const thisFile = fileURLToPath(import.meta.url);
if (entry === thisFile) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Unknown demo failure.";
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  });
}
