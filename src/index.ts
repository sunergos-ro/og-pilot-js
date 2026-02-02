import { Client } from "./client";
import { Configuration, OgPilotConfigOptions } from "./config";
import { ConfigurationError, OgPilotError, RequestError } from "./errors";
import {
  buildPathFromNextParams,
  buildPathFromNextProps,
  clearCurrentRequest,
  createExpressMiddleware,
  getPathFromExpressRequest,
  setCurrentRequest,
  withRequestContext,
} from "./request-context";

let defaultConfig = new Configuration();

export const configure = (
  updater: (config: Configuration) => void
): Configuration => {
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

export const createClient = (options: OgPilotConfigOptions = {}): Client =>
  new Client(options);

const OgPilot = {
  configure,
  resetConfig,
  getConfig,
  client,
  createClient,
  createImage,
  setCurrentRequest,
  clearCurrentRequest,
  withRequestContext,
  createExpressMiddleware,
  getPathFromExpressRequest,
  buildPathFromNextProps,
  buildPathFromNextParams,
  Configuration,
  ConfigurationError,
  OgPilotError,
  RequestError,
};

export default OgPilot;
export type { CreateImageOptions } from "./client";
export type {
  NextMetadataProps,
  NextParams,
  NextSearchParams,
} from "./request-context";
export {
  buildPathFromNextParams,
  buildPathFromNextProps,
  clearCurrentRequest,
  Client,
  Configuration,
  ConfigurationError,
  createExpressMiddleware,
  getPathFromExpressRequest,
  OgPilotConfigOptions,
  OgPilotError,
  RequestError,
  setCurrentRequest,
  withRequestContext,
};
