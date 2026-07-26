/**
 * Configuration for the read-only DataHub HTTP client.
 */
export interface DataHubClientOptions {
  baseUrl: string;
  token?: string;
  timeoutMs?: number;
}

/**
 * Minimal typed client for fetching DataHub metadata over HTTP.
 * The client is intentionally read-only and does not perform governance decisions.
 */
export class DataHubClient {
  private readonly baseUrl: string;
  private readonly token: string | undefined;
  private readonly timeoutMs: number;

  public constructor(options: DataHubClientOptions) {
    if (!options || typeof options !== "object") {
      throw new Error("DataHubClient options are required.");
    }

    const normalizedBaseUrl = this.normalizeBaseUrl(options.baseUrl);
    this.baseUrl = normalizedBaseUrl;
    this.token = this.normalizeOptionalToken(options.token);
    this.timeoutMs = this.normalizeTimeout(options.timeoutMs);
  }

  /**
   * Runs a simple metadata search query.
   */
  public async search(query: string): Promise<unknown> {
    const safeQuery = this.validateNonEmptyInput(query, "query");
    return this.request(`/api/v1/search?query=${encodeURIComponent(safeQuery)}`);
  }

  /**
   * Fetches metadata for a single DataHub URN.
   */
  public async fetchByUrn(urn: string): Promise<unknown> {
    const safeUrn = this.validateNonEmptyInput(urn, "urn");
    return this.request(`/api/v1/entities/${encodeURIComponent(safeUrn)}`);
  }

  private normalizeBaseUrl(baseUrl: string): string {
    if (typeof baseUrl !== "string" || baseUrl.trim().length === 0) {
      throw new Error("A valid DataHub baseUrl is required.");
    }

    let parsed: URL;
    try {
      parsed = new URL(baseUrl);
    } catch {
      throw new Error("DataHub baseUrl must be a valid URL.");
    }

    parsed.pathname = parsed.pathname.replace(/\/+$/, "");
    return parsed.toString().replace(/\/+$/, "");
  }

  private normalizeOptionalToken(token: string | undefined): string | undefined {
    if (typeof token !== "string") {
      return undefined;
    }

    const trimmedToken = token.trim();
    return trimmedToken.length > 0 ? trimmedToken : undefined;
  }

  private normalizeTimeout(timeoutMs: number | undefined): number {
    if (timeoutMs === undefined) {
      return 10_000;
    }

    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
      throw new Error("DataHub timeoutMs must be a positive number.");
    }

    return Math.floor(timeoutMs);
  }

  private validateNonEmptyInput(value: string, fieldName: string): string {
    if (typeof value !== "string") {
      throw new Error(`DataHub ${fieldName} must be a string.`);
    }

    const trimmed = value.trim();
    if (trimmed.length === 0) {
      throw new Error(`DataHub ${fieldName} must not be empty.`);
    }

    return trimmed;
  }

  private async request(path: string): Promise<unknown> {
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => {
      controller.abort();
    }, this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: "GET",
        headers: this.buildHeaders(),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(
          `DataHub request failed with status ${response.status} ${response.statusText}.`
        );
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        return (await response.json()) as unknown;
      }

      return (await response.text()) as unknown;
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`DataHub request timed out after ${this.timeoutMs}ms.`);
      }

      if (error instanceof Error) {
        throw new Error(`DataHub request failed: ${error.message}`);
      }

      throw new Error("DataHub request failed due to an unknown error.");
    } finally {
      clearTimeout(timeoutHandle);
    }
  }

  private buildHeaders(): HeadersInit {
    if (!this.token) {
      return {
        Accept: "application/json"
      };
    }

    return {
      Accept: "application/json",
      Authorization: "Bearer " + this.token
    };
  }
}
