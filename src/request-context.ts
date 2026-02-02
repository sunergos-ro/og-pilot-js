/**
 * Request context for automatic path resolution.
 *
 * In Node.js environments, this uses AsyncLocalStorage to store the current
 * request URL per async execution context. In edge runtimes or browsers,
 * it falls back to a simple variable (not request-scoped).
 */

type RequestInfo = {
  url?: string;
  path?: string;
};

interface AsyncStorage {
  getStore: () => RequestInfo | undefined;
  run: <T>(store: RequestInfo, callback: () => T) => T;
}

// Try to use AsyncLocalStorage if available (Node.js 12.17+)
let asyncLocalStorage: AsyncStorage | null = null;

// Fallback for environments without AsyncLocalStorage
let fallbackRequest: RequestInfo | undefined;

// Create a fallback implementation
function createFallbackStorage(): AsyncStorage {
  return {
    getStore: () => fallbackRequest,
    run: <T>(_store: RequestInfo, callback: () => T): T => {
      const prev = fallbackRequest;
      fallbackRequest = _store;
      try {
        return callback();
      } finally {
        fallbackRequest = prev;
      }
    },
  };
}

// Lazy initialization to avoid issues in environments where async_hooks isn't available
function getAsyncLocalStorage(): AsyncStorage {
  if (asyncLocalStorage === null) {
    try {
      // Dynamic import to avoid bundler issues
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { AsyncLocalStorage } = require("async_hooks");
      const storage = new AsyncLocalStorage();
      asyncLocalStorage = {
        getStore: () => storage.getStore() as RequestInfo | undefined,
        run: <T>(store: RequestInfo, callback: () => T): T =>
          storage.run(store, callback),
      };
    } catch {
      // AsyncLocalStorage not available, use fallback
      asyncLocalStorage = createFallbackStorage();
    }
  }
  return asyncLocalStorage!;
}

/**
 * Sets the current request context for automatic path resolution.
 * Call this in your middleware/handler before using OG Pilot.
 *
 * @example Express middleware
 * ```ts
 * app.use((req, res, next) => {
 *   setCurrentRequest({ url: req.originalUrl });
 *   next();
 * });
 * ```
 *
 * @example Next.js middleware
 * ```ts
 * export function middleware(request: NextRequest) {
 *   setCurrentRequest({ url: request.nextUrl.pathname + request.nextUrl.search });
 *   return NextResponse.next();
 * }
 * ```
 */
export function setCurrentRequest(request: RequestInfo): void {
  fallbackRequest = request;
}

/**
 * Clears the current request context.
 * Call this after the request is complete if using setCurrentRequest directly.
 */
export function clearCurrentRequest(): void {
  fallbackRequest = undefined;
}

/**
 * Runs a callback with the given request context.
 * The context is automatically cleared after the callback completes.
 * This is the preferred method for setting request context.
 *
 * @example Express middleware
 * ```ts
 * import { withRequestContext } from "og-pilot-js";
 *
 * app.use((req, res, next) => {
 *   withRequestContext({ url: req.originalUrl }, () => {
 *     next();
 *   });
 * });
 * ```
 */
export function withRequestContext<T>(
  request: RequestInfo,
  callback: () => T
): T {
  return getAsyncLocalStorage().run(request, callback);
}

/**
 * Gets the current request info from context.
 * @internal
 */
export function getCurrentRequest(): RequestInfo | undefined {
  // Try AsyncLocalStorage first, then fallback
  const store = getAsyncLocalStorage().getStore();
  return store ?? fallbackRequest;
}

/**
 * Gets the current request path from context or environment.
 * @internal
 */
export function getCurrentPath(): string | undefined {
  const request = getCurrentRequest();

  if (request?.path) {
    return request.path;
  }

  if (request?.url) {
    return extractPathFromUrl(request.url);
  }

  // Fallback to environment variables (similar to Ruby's env_fullpath)
  return getPathFromEnv();
}

// ============================================================================
// Framework-specific helpers
// ============================================================================

export type NextParamValue = string | string[] | undefined;
export type NextParams = Record<string, NextParamValue>;
export type NextSearchParams = Record<string, NextParamValue>;
export type NextMetadataProps = {
  params: NextParams | Promise<NextParams>;
  searchParams?: NextSearchParams | Promise<NextSearchParams>;
};

/**
 * Builds a URL path for Next.js App Router routes.
 *
 * Pass your route pattern (e.g. "/products/[id]") and Next.js params/searchParams.
 * This avoids middleware and fits naturally inside generateMetadata().
 *
 * @example app/products/[id]/page.tsx
 * ```ts
 * import { buildPathFromNextProps } from "og-pilot-js";
 *
 * export async function generateMetadata(props) {
 *   const path = await buildPathFromNextProps("/products/[id]", props);
 *   // => "/products/123?ref=twitter"
 * }
 * ```
 */
export async function buildPathFromNextProps(
  routePattern: string,
  props: NextMetadataProps
): Promise<string> {
  const params = await props.params;
  const searchParams = props.searchParams
    ? await props.searchParams
    : undefined;
  return buildPathFromNextParams(routePattern, params, searchParams);
}

/**
 * Builds a URL path for Next.js App Router routes from params/searchParams.
 *
 * @example
 * ```ts
 * const path = buildPathFromNextParams(
 *   "/blog/[...slug]",
 *   { slug: ["2024", "launch"] },
 *   { ref: "twitter" }
 * );
 * // => "/blog/2024/launch?ref=twitter"
 * ```
 */
export function buildPathFromNextParams(
  routePattern: string,
  params: NextParams,
  searchParams?: NextSearchParams
): string {
  const segments = routePattern
    .split("/")
    .filter((segment) => segment.length > 0);
  const builtSegments: string[] = [];

  for (const segment of segments) {
    const catchAllMatch = segment.match(/^\[\.\.\.(.+)\]$/);
    const optionalCatchAllMatch = segment.match(/^\[\[\.\.\.(.+)\]\]$/);
    const paramMatch = segment.match(/^\[(.+)\]$/);

    if (optionalCatchAllMatch) {
      const key = optionalCatchAllMatch[1];
      const value = params[key];
      if (value === undefined) {
        continue;
      }
      if (Array.isArray(value)) {
        builtSegments.push(...value);
      } else {
        builtSegments.push(value);
      }
      continue;
    }

    if (catchAllMatch) {
      const key = catchAllMatch[1];
      const value = params[key];
      if (value === undefined) {
        continue;
      }
      if (Array.isArray(value)) {
        builtSegments.push(...value);
      } else {
        builtSegments.push(value);
      }
      continue;
    }

    if (paramMatch) {
      const key = paramMatch[1];
      const value = params[key];
      if (value === undefined) {
        continue;
      }
      if (Array.isArray(value)) {
        builtSegments.push(value.join("/"));
      } else {
        builtSegments.push(value);
      }
      continue;
    }

    builtSegments.push(segment);
  }

  const path = `/${builtSegments.join("/")}`;
  const query = serializeSearchParams(searchParams);
  return query.length > 0 ? `${path}?${query}` : path;
}

/**
 * Creates an Express/Connect middleware that automatically sets request context.
 *
 * @example Express
 * ```ts
 * import express from "express";
 * import { createExpressMiddleware } from "og-pilot-js";
 *
 * const app = express();
 * app.use(createExpressMiddleware());
 * ```
 */
export function createExpressMiddleware(): ExpressMiddleware {
  return (req, _res, next) => {
    setCurrentRequest({
      url: req.originalUrl || req.url,
      path: req.originalUrl || req.url,
    });
    next();
  };
}

/**
 * Helper to extract path from an Express/Node.js request object.
 */
export function getPathFromExpressRequest(req: ExpressRequest): string {
  return req.originalUrl || req.url || "/";
}

// Type definitions for framework compatibility
// These are minimal to avoid requiring framework dependencies

interface ExpressRequest {
  originalUrl?: string;
  url?: string;
}

type ExpressMiddleware = (
  req: ExpressRequest,
  res: unknown,
  next: () => void
) => void;

function extractPathFromUrl(url: string): string {
  // Handle full URLs
  if (url.startsWith("http://") || url.startsWith("https://")) {
    try {
      const parsed = new URL(url);
      return parsed.pathname + parsed.search;
    } catch {
      return url;
    }
  }

  return url;
}

function serializeSearchParams(
  searchParams?: NextSearchParams | URLSearchParams
): string {
  if (!searchParams) {
    return "";
  }

  if (searchParams instanceof URLSearchParams) {
    return searchParams.toString();
  }

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value === undefined) {
      continue;
    }
    if (Array.isArray(value)) {
      for (const entry of value) {
        params.append(key, entry);
      }
    } else {
      params.append(key, value);
    }
  }

  return params.toString();
}

function getPathFromEnv(): string | undefined {
  if (typeof process === "undefined" || !process.env) {
    return undefined;
  }

  const env = process.env;

  // Check various environment variables (similar to Ruby implementation)
  const requestUri = env.REQUEST_URI;
  if (requestUri && requestUri.length > 0) {
    return requestUri;
  }

  const originalFullpath = env.ORIGINAL_FULLPATH;
  if (originalFullpath && originalFullpath.length > 0) {
    return originalFullpath;
  }

  const pathInfo = env.PATH_INFO;
  if (pathInfo && pathInfo.length > 0) {
    const queryString = env.QUERY_STRING ?? "";
    return queryString.length > 0 ? `${pathInfo}?${queryString}` : pathInfo;
  }

  const requestPath = env.REQUEST_PATH;
  if (requestPath && requestPath.length > 0) {
    return requestPath;
  }

  return undefined;
}
