import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { DataHubContextAdapter } from "./datahub/context-adapter.js";
import { buildWorkPacket } from "./work-packet.js";

interface DemoFixture {
  objective?: unknown;
  allowedScope?: unknown;
  blockedScope?: unknown;
  requiredValidation?: unknown;
  source?: unknown;
}

const DEFAULT_FIXTURE_PATH = new URL("../../fixtures/datahub-context.json", import.meta.url);

async function main(): Promise<void> {
  const fixturePath = resolveFixturePath(process.argv.slice(2));
  const fixture = await loadFixture(fixturePath);
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
    requiredValidation
  });

  process.stdout.write(JSON.stringify({ normalizedRecords, workPacket }, null, 2));
  process.stdout.write("\n");
}

async function loadFixture(path: URL): Promise<DemoFixture> {
  const raw = await readFile(path, "utf8");
  return JSON.parse(raw) as DemoFixture;
}

function resolveFixturePath(args: string[]): URL {
  const inputIndex = args.indexOf("--input");
  if (inputIndex !== -1) {
    const value = args[inputIndex + 1];
    if (!value) {
      throw new Error("--input requires a fixture path.");
    }

    return pathToFileURL(resolve(process.cwd(), value));
  }

  return DEFAULT_FIXTURE_PATH;
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

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown demo failure.";
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
