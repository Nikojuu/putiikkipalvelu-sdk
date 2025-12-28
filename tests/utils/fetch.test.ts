import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createFetcher } from "../../src/utils/fetch.js";
import { AuthError, RateLimitError, NotFoundError, StorefrontError } from "../../src/utils/errors.js";

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Helper to create mock response
function createMockResponse(options: {
  ok?: boolean;
  status?: number;
  statusText?: string;
  json?: () => Promise<unknown>;
  headers?: Record<string, string>;
}) {
  return {
    ok: options.ok ?? true,
    status: options.status ?? 200,
    statusText: options.statusText ?? "OK",
    json: options.json ?? (async () => ({})),
    headers: {
      get: (name: string) => options.headers?.[name] ?? null,
    },
  };
}

describe("createFetcher", () => {
  const config = {
    apiKey: "test-api-key-12345",
    baseUrl: "https://api.example.com/v1",
  };

  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("request", () => {
    it("should send correct headers", async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        json: async () => ({ data: "test" }),
      }));

      const fetcher = createFetcher(config);
      await fetcher.request("/products");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/v1/products",
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            "x-api-key": "test-api-key-12345",
            "x-sdk-version": expect.any(String),
          }),
        })
      );
    });

    it("should return JSON response as-is", async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        json: async () => ({
          productName: "Test Product",
          createdAt: "2024-01-01",
        }),
      }));

      const fetcher = createFetcher(config);
      const result = await fetcher.request<{ productName: string; createdAt: string }>("/products");

      expect(result).toEqual({
        productName: "Test Product",
        createdAt: "2024-01-01",
      });
    });

    it("should append query parameters", async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({}));

      const fetcher = createFetcher(config);
      await fetcher.request("/products", {
        params: { page: 1, limit: 10, active: true },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/v1/products?page=1&limit=10&active=true",
        expect.any(Object)
      );
    });

    it("should skip undefined params", async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({}));

      const fetcher = createFetcher(config);
      await fetcher.request("/products", {
        params: { page: 1, category: undefined },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/v1/products?page=1",
        expect.any(Object)
      );
    });

    it("should send POST request with body", async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        json: async () => ({ id: 1 }),
      }));

      const fetcher = createFetcher(config);
      await fetcher.request("/orders", {
        method: "POST",
        body: { product_id: 1, quantity: 2 },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.example.com/v1/orders",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ product_id: 1, quantity: 2 }),
        })
      );
    });
  });

  describe("error handling", () => {
    it("should throw AuthError on 401", async () => {
      mockFetch.mockResolvedValue(createMockResponse({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        json: async () => ({ error: "Invalid API key" }),
      }));

      const fetcher = createFetcher(config);

      await expect(fetcher.request("/products")).rejects.toThrow(AuthError);

      const error = await fetcher.request("/products").catch((e: AuthError) => e) as AuthError;
      expect(error.status).toBe(401);
      expect(error.message).toBe("Invalid API key");
    });

    it("should throw NotFoundError on 404", async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: async () => ({ error: "Product not found" }),
      }));

      const fetcher = createFetcher(config);

      await expect(fetcher.request("/products/123")).rejects.toThrow(NotFoundError);
    });

    it("should throw RateLimitError on 429 with retryAfter", async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
        json: async () => ({ error: "Rate limit exceeded" }),
        headers: { "Retry-After": "60" },
      }));

      const fetcher = createFetcher(config);

      try {
        await fetcher.request("/products");
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(RateLimitError);
        expect((error as RateLimitError).retryAfter).toBe(60);
      }
    });

    it("should throw StorefrontError on other errors", async () => {
      mockFetch.mockResolvedValue(createMockResponse({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: async () => ({ error: "Server error" }),
      }));

      const fetcher = createFetcher(config);

      await expect(fetcher.request("/products")).rejects.toThrow(StorefrontError);

      const error = await fetcher.request("/products").catch((e: StorefrontError) => e) as StorefrontError;
      expect(error.status).toBe(500);
      expect(error.code).toBe("API_ERROR");
    });

    it("should handle non-JSON error responses", async () => {
      mockFetch.mockResolvedValue(createMockResponse({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: async () => {
          throw new Error("Invalid JSON");
        },
      }));

      const fetcher = createFetcher(config);

      await expect(fetcher.request("/products")).rejects.toThrow(StorefrontError);

      const error = await fetcher.request("/products").catch((e: StorefrontError) => e) as StorefrontError;
      expect(error.message).toBe("Internal Server Error");
    });

    it("should handle network errors", async () => {
      mockFetch.mockRejectedValue(new Error("Network failure"));

      const fetcher = createFetcher(config);

      await expect(fetcher.request("/products")).rejects.toThrow(StorefrontError);

      const error = await fetcher.request("/products").catch((e: StorefrontError) => e) as StorefrontError;
      expect(error.code).toBe("NETWORK_ERROR");
    });
  });

  describe("custom options", () => {
    it("should merge custom headers", async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({}));

      const fetcher = createFetcher(config);
      await fetcher.request("/products", {
        headers: { "X-Custom-Header": "custom-value" },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            "X-Custom-Header": "custom-value",
            "x-api-key": "test-api-key-12345",
          }),
        })
      );
    });

    it("should passthrough framework-specific options (e.g., Next.js)", async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({}));

      const fetcher = createFetcher(config);
      await fetcher.request("/products", {
        next: { revalidate: 60, tags: ["products"] },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          next: { revalidate: 60, tags: ["products"] },
        })
      );
    });

    it("should passthrough any unknown options to fetch", async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse({}));

      const fetcher = createFetcher(config);
      await fetcher.request("/products", {
        customFrameworkOption: { foo: "bar" },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          customFrameworkOption: { foo: "bar" },
        })
      );
    });
  });
});
