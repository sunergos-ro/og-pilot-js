import { Configuration, OgPilotConfigOptions } from "./config";
import { ConfigurationError, RequestError } from "./errors";
import { signJwt } from "./jwt";

export interface CreateImageOptions {
  json?: boolean;
  iat?: number | Date;
  headers?: Record<string, string>;
}

const ENDPOINT_PATH = "/api/v1/images";

export class Client {
  private config: Configuration;

  constructor(config: Configuration | OgPilotConfigOptions = {}) {
    this.config = config instanceof Configuration ? config : new Configuration(config);
  }

  async createImage(
    params: Record<string, unknown> = {},
    options: CreateImageOptions = {}
  ): Promise<unknown> {
    const { json = false, iat, headers = {} } = options;
    const url = await this.buildUrl(params ?? {}, iat);
    const response = await this.request(url, json, headers);

    if (json) {
      const body = await response.text();
      return JSON.parse(body);
    }

    return response.headers.get("location") ?? response.url ?? url.toString();
  }

  private async request(url: URL, json: boolean, headers: Record<string, string>): Promise<Response> {
    const fetchImpl = this.config.fetch ?? (typeof fetch !== "undefined" ? fetch : undefined);

    if (!fetchImpl) {
      throw new ConfigurationError(
        "Fetch API is not available; provide a fetch implementation in the configuration."
      );
    }

    const requestHeaders = new Headers();
    if (json) {
      requestHeaders.set("Accept", "application/json");
    }

    Object.entries(headers).forEach(([key, value]) => {
      requestHeaders.set(key, value);
    });

    const timeoutMs = this.totalTimeoutMs();
    const controller = new AbortController();
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    if (timeoutMs && timeoutMs > 0) {
      timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    }

    try {
      const response = await fetchImpl(url.toString(), {
        method: "GET",
        headers: requestHeaders,
        redirect: "manual",
        signal: controller.signal
      });

      if (response.status >= 400) {
        const body = await response.text().catch(() => "");
        throw new RequestError(
          `OG Pilot request failed with status ${response.status}: ${body}`,
          response.status
        );
      }

      return response;
    } catch (error) {
      if (error instanceof RequestError) {
        throw error;
      }

      if (error instanceof Error && error.name === "AbortError") {
        throw new RequestError(`OG Pilot request timed out: ${error.message}`);
      }

      if (error instanceof Error) {
        throw new RequestError(`OG Pilot request failed: ${error.message}`);
      }

      throw new RequestError("OG Pilot request failed.");
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }

  private async buildUrl(params: Record<string, unknown>, iat?: number | Date): Promise<URL> {
    const payload = this.buildPayload(params, iat);
    const token = await signJwt(payload, this.apiKey());
    const url = new URL(ENDPOINT_PATH, this.config.baseUrl);
    url.searchParams.set("token", token);
    return url;
  }

  private buildPayload(params: Record<string, unknown>, iat?: number | Date): Record<string, unknown> {
    const payload: Record<string, unknown> = { ...params };

    if (iat !== undefined && iat !== null) {
      payload.iat = normalizeIat(iat);
    }

    if (payload.iss === undefined || payload.iss === null) {
      payload.iss = this.domain();
    }

    if (payload.sub === undefined || payload.sub === null) {
      payload.sub = this.apiKeyPrefix();
    }

    this.validatePayload(payload);
    return payload;
  }

  private validatePayload(payload: Record<string, unknown>): void {
    if (payload.iss === undefined || payload.iss === null || String(payload.iss).length === 0) {
      throw new ConfigurationError("OG Pilot domain is missing");
    }

    if (payload.sub === undefined || payload.sub === null || String(payload.sub).length === 0) {
      throw new ConfigurationError("OG Pilot API key prefix is missing");
    }

    if (payload.title === undefined || payload.title === null || String(payload.title).length === 0) {
      throw new Error("OG Pilot title is required");
    }
  }

  private apiKey(): string {
    if (this.config.apiKey !== undefined && this.config.apiKey !== null) {
      return this.config.apiKey;
    }

    throw new ConfigurationError("OG Pilot API key is missing");
  }

  private domain(): string {
    if (this.config.domain !== undefined && this.config.domain !== null) {
      return this.config.domain;
    }

    throw new ConfigurationError("OG Pilot domain is missing");
  }

  private apiKeyPrefix(): string {
    return this.apiKey().slice(0, 8);
  }

  private totalTimeoutMs(): number | undefined {
    const openTimeoutMs = this.config.openTimeoutMs;
    const readTimeoutMs = this.config.readTimeoutMs;

    if (openTimeoutMs === undefined && readTimeoutMs === undefined) {
      return undefined;
    }

    const open = typeof openTimeoutMs === "number" ? openTimeoutMs : 0;
    const read = typeof readTimeoutMs === "number" ? readTimeoutMs : 0;
    return open + read;
  }
}

function normalizeIat(iat: number | Date): number {
  if (iat instanceof Date) {
    return Math.floor(iat.getTime() / 1000);
  }

  if (iat > 100000000000) {
    return Math.floor(iat / 1000);
  }

  return Math.floor(iat);
}
