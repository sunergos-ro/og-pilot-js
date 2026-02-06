export interface OgPilotConfigOptions {
  apiKey?: string;
  domain?: string;
  baseUrl?: string;
  openTimeoutMs?: number;
  readTimeoutMs?: number;
  fetch?: typeof fetch;
  stripExtensions?: boolean;
}

const DEFAULT_BASE_URL = "https://ogpilot.com";

function readEnv(key: string): string | undefined {
  if (typeof process !== "undefined" && process.env) {
    return process.env[key];
  }

  return undefined;
}

export class Configuration {
  apiKey?: string;
  domain?: string;
  baseUrl: string;
  openTimeoutMs?: number;
  readTimeoutMs?: number;
  fetch?: typeof fetch;
  stripExtensions: boolean;

  constructor(options: OgPilotConfigOptions = {}) {
    this.apiKey = options.apiKey ?? readEnv("OG_PILOT_API_KEY");
    this.domain = options.domain ?? readEnv("OG_PILOT_DOMAIN");
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
    this.openTimeoutMs = options.openTimeoutMs ?? 5000;
    this.readTimeoutMs = options.readTimeoutMs ?? 10000;
    this.fetch = options.fetch;
    this.stripExtensions = options.stripExtensions ?? true;
  }
}
