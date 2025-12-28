import type { FetchOptions } from "../types/index.js";
import { StorefrontError, AuthError, RateLimitError, NotFoundError, ValidationError } from "./errors.js";

// SDK version - will be replaced during build or read from package.json
const SDK_VERSION = "0.1.0";

export interface FetcherConfig {
  apiKey: string;
  baseUrl: string;
  timeout?: number;
}

export interface RequestOptions extends FetchOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
}

/**
 * Fetcher instance type returned by createFetcher
 */
export type Fetcher = ReturnType<typeof createFetcher>;

/**
 * Create a configured fetcher instance for making API requests
 */
export function createFetcher(config: FetcherConfig) {
  const { apiKey, baseUrl, timeout = 30000 } = config;

  /**
   * Make an authenticated request to the Storefront API
   */
  async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = "GET", body, params, signal, headers = {}, cache, ...frameworkOptions } = options;

    // Build URL with query parameters
    // Ensure baseUrl ends with / for proper URL resolution
    const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
    // Remove leading slash from endpoint to avoid URL resolution issues
    const normalizedEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
    const url = new URL(normalizedEndpoint, normalizedBase);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Combine signals if provided
    const combinedSignal = signal
      ? AbortSignal.any([signal, controller.signal])
      : controller.signal;

    try {
      const fetchOptions: RequestInit & Record<string, unknown> = {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "x-sdk-version": SDK_VERSION,
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: combinedSignal,
        cache,
        // Spread framework-specific options (e.g., Next.js `next`, or any other)
        ...frameworkOptions,
      };

      const response = await fetch(url.toString(), fetchOptions);

      clearTimeout(timeoutId);

      // Handle error responses
      if (!response.ok) {
        await handleErrorResponse(response);
      }

      // Parse response
      const data = await response.json();
      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);

      // Re-throw SDK errors
      if (error instanceof StorefrontError) {
        throw error;
      }

      // Handle abort/timeout
      if (error instanceof Error && error.name === "AbortError") {
        throw new StorefrontError("Request timed out", 408, "TIMEOUT");
      }

      // Handle network errors
      throw new StorefrontError(
        error instanceof Error ? error.message : "Network error",
        0,
        "NETWORK_ERROR"
      );
    }
  }

  return { request };
}

/**
 * Handle non-2xx responses and throw appropriate errors
 */
async function handleErrorResponse(response: Response): Promise<never> {
  let errorMessage: string | null = null;

  try {
    const json: unknown = await response.json();
    // Extract error message if present
    if (json && typeof json === "object" && "error" in json) {
      errorMessage = (json as { error: string }).error;
    }
  } catch {
    // Response body is not JSON
  }

  const message = errorMessage || response.statusText || "Request failed";

  switch (response.status) {
    case 401:
      throw new AuthError(message);

    case 404:
      throw new NotFoundError(message);

    case 429: {
      const retryAfter = response.headers.get("Retry-After");
      throw new RateLimitError(message, retryAfter ? parseInt(retryAfter, 10) : null);
    }

    case 400:
      throw new ValidationError(message);

    default:
      throw new StorefrontError(message, response.status, "API_ERROR");
  }
}
