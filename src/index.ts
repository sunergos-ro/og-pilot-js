import {
  Client,
  type CreateImageJsonOptions,
  type CreateImageJsonResult,
  type CreateImageOptions,
  type CreateImageResult,
  type CreateImageUrlOptions,
  type CreateImageUrlResult,
} from "./client";
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

export function createImage(
  params: Record<string, unknown>,
  options: CreateImageJsonOptions,
): Promise<CreateImageJsonResult>;
export function createImage(
  params?: Record<string, unknown>,
  options?: CreateImageUrlOptions,
): Promise<CreateImageUrlResult>;
export function createImage(
  params?: Record<string, unknown>,
  options?: CreateImageOptions,
): Promise<CreateImageResult>;
export function createImage(
  params: Record<string, unknown> = {},
  options: CreateImageOptions = {},
): Promise<CreateImageResult> {
  return client().createImage(params, options);
}

const createTemplateImage = (
  template: string,
  params: Record<string, unknown> = {},
  options: CreateImageOptions = {},
): Promise<CreateImageResult> =>
  createImage(
    {
      ...params,
      template,
    },
    options
  );

export const createBlogPostImage = (
  params: Record<string, unknown> = {},
  options: CreateImageOptions = {},
): Promise<CreateImageResult> =>
  createTemplateImage("blog_post", params, options);

export const createPodcastImage = (
  params: Record<string, unknown> = {},
  options: CreateImageOptions = {},
): Promise<CreateImageResult> =>
  createTemplateImage("podcast", params, options);

export const createProductImage = (
  params: Record<string, unknown> = {},
  options: CreateImageOptions = {},
): Promise<CreateImageResult> =>
  createTemplateImage("product", params, options);

export const createEventImage = (
  params: Record<string, unknown> = {},
  options: CreateImageOptions = {},
): Promise<CreateImageResult> =>
  createTemplateImage("event", params, options);

export const createBookImage = (
  params: Record<string, unknown> = {},
  options: CreateImageOptions = {},
): Promise<CreateImageResult> =>
  createTemplateImage("book", params, options);

export const createCompanyImage = (
  params: Record<string, unknown> = {},
  options: CreateImageOptions = {},
): Promise<CreateImageResult> =>
  createTemplateImage("company", params, options);

export const createPortfolioImage = (
  params: Record<string, unknown> = {},
  options: CreateImageOptions = {},
): Promise<CreateImageResult> =>
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
export type {
  CreateImageJsonOptions,
  CreateImageJsonResult,
  CreateImageOptions,
  CreateImageResult,
  CreateImageUrlOptions,
  CreateImageUrlResult,
} from "./client";
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
