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
