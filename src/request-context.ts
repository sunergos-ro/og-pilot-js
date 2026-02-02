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
