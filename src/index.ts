import { Client } from "./client";
import { Configuration, OgPilotConfigOptions } from "./config";
import { ConfigurationError, OgPilotError, RequestError } from "./errors";

let defaultConfig = new Configuration();

export const configure = (updater: (config: Configuration) => void): Configuration => {
  updater(defaultConfig);
  return defaultConfig;
};

export const resetConfig = (): void => {
  defaultConfig = new Configuration();
};

export const getConfig = (): Configuration => defaultConfig;

export const client = (): Client => new Client(defaultConfig);

export const createImage = (
  params: Record<string, unknown> = {},
  options: Parameters<Client["createImage"]>[1] = {}
): ReturnType<Client["createImage"]> => client().createImage(params, options);

export const createClient = (options: OgPilotConfigOptions = {}): Client => new Client(options);

const OgPilot = {
  configure,
  resetConfig,
  getConfig,
  client,
  createClient,
  createImage,
  Configuration,
  ConfigurationError,
  OgPilotError,
  RequestError
};

export default OgPilot;
export { Client, Configuration, OgPilotConfigOptions, ConfigurationError, OgPilotError, RequestError };
export type { CreateImageOptions } from "./client";
