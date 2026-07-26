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
  // Create canonicalized copy of currentContext: deduplicate/sort provenance and sort records by id.
  const canonicalizeProvenance = (provenance: SourceReference[] = []): SourceReference[] => {
    const map = new Map<string, SourceReference>();
    for (const p of provenance) {
      const key = p.canonicalUrl ?? `${p.sourceType}|${p.id}|${p.retrievedAt}`;
      if (!map.has(key)) {
        map.set(key, p);
      }
    }

    const values = Array.from(map.values());
    values.sort((a, b) => {
      const ak = a.canonicalUrl ?? `${a.sourceType}|${a.id}|${a.retrievedAt}`;
      const bk = b.canonicalUrl ?? `${b.sourceType}|${b.id}|${b.retrievedAt}`;
      return ak.localeCompare(bk);
    });

    return values;
  };

  const currentContext = input.currentContext
    .map((r) => ({ ...r, provenance: canonicalizeProvenance(r.provenance) }))
    .sort((a, b) => a.id.localeCompare(b.id));

  const sourceReferences = collectSourceReferences(currentContext);

  const normalizeStringArray = (arr: string[] = []) => Array.from(new Set(arr.map((s) => s))).sort();

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

function collectSourceReferences(records: NormalizedContextRecord[]): SourceReference[] {
  const map = new Map<string, SourceReference>();
  for (const record of records) {
    for (const reference of record.provenance) {
      const key = reference.canonicalUrl ?? `${reference.sourceType}|${reference.id}|${reference.retrievedAt}`;
      if (!map.has(key)) {
        map.set(key, reference);
      }
    }
  }

  const refs = Array.from(map.values());
  refs.sort((a, b) => {
    const ak = a.canonicalUrl ?? `${a.sourceType}|${a.id}|${a.retrievedAt}`;
    const bk = b.canonicalUrl ?? `${b.sourceType}|${b.id}|${b.retrievedAt}`;
    return ak.localeCompare(bk);
  });

  return refs;
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
