import type { NormalizedContextRecord, SourceReference, WorkPacket } from "./datahub/context-adapter.js";

/**
 * Inputs for constructing a deterministic proposal packet.
 */
export interface WorkPacketBuilderInput {
  objective: string;
  currentContext: NormalizedContextRecord[];
  allowedScope: string[];
  blockedScope?: string[];
  requiredValidation?: string[];
  unknowns?: string[];
}

/**
 * Builds a bounded work packet while preserving source context.
 */
export function buildWorkPacket(input: WorkPacketBuilderInput): WorkPacket {
  const currentContext = canonicalizeContextRecords(input.currentContext);

  const sourceReferences = collectSourceReferences(currentContext);

  const blockedScope = normalizeStringArray([...(input.blockedScope ?? []), ...deriveBlockedScope(currentContext)]);
  const requiredValidation = normalizeStringArray([...(input.requiredValidation ?? []), ...deriveRequiredValidation(currentContext)]);
  const unknowns = normalizeStringArray([...(input.unknowns ?? []), ...deriveUnknowns(currentContext)]);
  const allowedScope = normalizeStringArray(input.allowedScope ?? []);

  return {
    objective: input.objective,
    currentContext,
    allowedScope,
    blockedScope,
    requiredValidation,
    unknowns,
    sourceReferences,
    humanApprovalRequired: true
  };
}

function canonicalizeContextRecords(records: NormalizedContextRecord[]): NormalizedContextRecord[] {
  const seenIds = new Set<string>();
  const normalized = records.map((record) => {
    if (seenIds.has(record.id)) {
      throw new Error(`Duplicate NormalizedContextRecord id: ${record.id}`);
    }

    seenIds.add(record.id);
    return { ...record, provenance: canonicalizeProvenance(record.provenance) };
  });

  normalized.sort((a, b) => a.id.localeCompare(b.id));
  return normalized;
}

function canonicalizeProvenance(provenance: SourceReference[] = []): SourceReference[] {
  const map = new Map<string, SourceReference>();
  for (const reference of provenance) {
    const key = referenceKey(reference);
    if (!map.has(key)) {
      map.set(key, reference);
    }
  }

  const values = Array.from(map.values());
  values.sort((a, b) => referenceKey(a).localeCompare(referenceKey(b)));
  return values;
}

function collectSourceReferences(records: NormalizedContextRecord[]): SourceReference[] {
  const map = new Map<string, SourceReference>();
  for (const record of records) {
    for (const reference of record.provenance) {
      const key = referenceKey(reference);
      if (!map.has(key)) {
        map.set(key, reference);
      }
    }
  }

  const refs = Array.from(map.values());
  refs.sort((a, b) => {
    return referenceKey(a).localeCompare(referenceKey(b));
  });

  return refs;
}

function referenceKey(reference: SourceReference): string {
  return `${reference.sourceType}|${reference.id}|${reference.canonicalUrl ?? ""}|${reference.retrievedAt}`;
}

function normalizeStringArray(values: string[] = []): string[] {
  const normalized = new Set<string>();
  for (const value of values) {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      normalized.add(trimmed);
    }
  }

  return Array.from(normalized).sort((a, b) => a.localeCompare(b));
}

function deriveBlockedScope(records: NormalizedContextRecord[]): string[] {
  const blockedScope: string[] = [];

  for (const record of records) {
    if (record.authority === "planning_only") {
      blockedScope.push(`Planning-only evidence for ${record.id} cannot authorize implementation.`);
    }

    if (record.authority === "quarantined") {
      blockedScope.push(`Quarantined evidence for ${record.id} must be excluded from authority.`);
    }

    if (record.authority === "unknown") {
      blockedScope.push(`Unknown evidence for ${record.id} blocks dependent work until reviewed.`);
    }
  }

  return blockedScope;
}

function deriveRequiredValidation(records: NormalizedContextRecord[]): string[] {
  const requiredValidation: string[] = ["Human review before any code, pull request, merge, deployment, or authority change."];

  if (records.some((record) => record.authority === "approved")) {
    requiredValidation.push("Validate approved context against the proposed file set.");
  }

  if (records.some((record) => record.authority === "unknown")) {
    requiredValidation.push("Resolve or explicitly defer unknown dependencies before implementation.");
  }

  return requiredValidation;
}

function deriveUnknowns(records: NormalizedContextRecord[]): string[] {
  const unknowns: string[] = [];

  for (const record of records) {
    if (record.authority === "unknown") {
      unknowns.push(`Unknown dependency: ${record.title}`);
    }
  }

  return unknowns;
}
