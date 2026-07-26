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
  const currentContext = [...input.currentContext];
  const sourceReferences = collectSourceReferences(currentContext);
  const blockedScope = [...new Set([...(input.blockedScope ?? []), ...deriveBlockedScope(currentContext)])];
  const requiredValidation = [...new Set([...(input.requiredValidation ?? []), ...deriveRequiredValidation(currentContext)])];
  const unknowns = [...new Set([...(input.unknowns ?? []), ...deriveUnknowns(currentContext)])];

  return {
    objective: input.objective,
    currentContext,
    allowedScope: [...input.allowedScope],
    blockedScope,
    requiredValidation,
    unknowns,
    sourceReferences,
    humanApprovalRequired: true
  };
}

function collectSourceReferences(records: NormalizedContextRecord[]): SourceReference[] {
  const references: SourceReference[] = [];
  for (const record of records) {
    for (const reference of record.provenance) {
      references.push(reference);
    }
  }
  return references;
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
