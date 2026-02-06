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

const createTemplateImage = (
  template: string,
  params: Record<string, unknown> = {},
  options: Parameters<Client["createImage"]>[1] = {}
): ReturnType<Client["createImage"]> =>
  createImage(
    {
      ...params,
      template,
    },
    options
  );

export const createBlogPostImage = (
  params: Record<string, unknown> = {},
  options: Parameters<Client["createImage"]>[1] = {}
): ReturnType<Client["createImage"]> =>
  createTemplateImage("blog_post", params, options);

export const createPodcastImage = (
  params: Record<string, unknown> = {},
  options: Parameters<Client["createImage"]>[1] = {}
): ReturnType<Client["createImage"]> =>
  createTemplateImage("podcast", params, options);

export const createProductImage = (
  params: Record<string, unknown> = {},
  options: Parameters<Client["createImage"]>[1] = {}
): ReturnType<Client["createImage"]> =>
  createTemplateImage("product", params, options);

export const createEventImage = (
  params: Record<string, unknown> = {},
  options: Parameters<Client["createImage"]>[1] = {}
): ReturnType<Client["createImage"]> =>
  createTemplateImage("event", params, options);

export const createBookImage = (
  params: Record<string, unknown> = {},
  options: Parameters<Client["createImage"]>[1] = {}
): ReturnType<Client["createImage"]> =>
  createTemplateImage("book", params, options);

export const createCompanyImage = (
  params: Record<string, unknown> = {},
  options: Parameters<Client["createImage"]>[1] = {}
): ReturnType<Client["createImage"]> =>
  createTemplateImage("company", params, options);

export const createPortfolioImage = (
  params: Record<string, unknown> = {},
  options: Parameters<Client["createImage"]>[1] = {}
): ReturnType<Client["createImage"]> =>
  createTemplateImage("portfolio", params, options);

export const createClient = (options: OgPilotConfigOptions = {}): Client =>
  new Client(options);

const OgPilot = {
  configure,
  resetConfig,
  getConfig,
  client,
  createClient,
  createImage,
  createBlogPostImage,
  createPodcastImage,
  createProductImage,
  createEventImage,
  createBookImage,
  createCompanyImage,
  createPortfolioImage,
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
