import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createStorefrontClient } from "../../src/client.js";
import { NotFoundError } from "../../src/utils/errors.js";

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

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

describe("products resource", () => {
  const client = createStorefrontClient({
    apiKey: "test-api-key-12345",
    baseUrl: "https://api.example.com/v1",
  });

  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("latest", () => {
    it("should fetch latest products with take parameter", async () => {
      const mockProducts = [
        { id: "1", name: "Product 1", slug: "product-1", price: 1999 },
        { id: "2", name: "Product 2", slug: "product-2", price: 2999 },
      ];
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => mockProducts,
        })
      );

      const result = await client.products.latest(6);

      expect(result).toEqual(mockProducts);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/latest-products"),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("take=6"),
        expect.any(Object)
      );
    });

    it("should pass fetch options through", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => [],
        })
      );

      await client.products.latest(6, {
        next: { revalidate: 3600, tags: ["products"] },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          next: { revalidate: 3600, tags: ["products"] },
        })
      );
    });
  });

  describe("getBySlug", () => {
    it("should fetch product by slug", async () => {
      const mockProduct = {
        id: "1",
        name: "Test Product",
        slug: "test-product",
        price: 1999,
        categories: [{ id: "cat1", name: "Category", slug: "category" }],
        variations: [],
      };
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => mockProduct,
        })
      );

      const result = await client.products.getBySlug("test-product");

      expect(result).toEqual(mockProduct);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/product/test-product"),
        expect.any(Object)
      );
    });

    it("should encode slug with special characters", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => ({ id: "1" }),
        })
      );

      await client.products.getBySlug("product with spaces");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/product/product%20with%20spaces"),
        expect.any(Object)
      );
    });

    it("should throw NotFoundError when product not found", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          ok: false,
          status: 404,
          statusText: "Not Found",
          json: async () => ({ error: "Product not found" }),
        })
      );

      await expect(client.products.getBySlug("nonexistent")).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe("count", () => {
    it("should fetch product count without filters", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => ({ count: 42 }),
        })
      );

      const result = await client.products.count();

      expect(result).toEqual({ count: 42 });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/products-count"),
        expect.any(Object)
      );
    });

    it("should fetch product count with category filter", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => ({ count: 10 }),
        })
      );

      const result = await client.products.count(["shoes", "clothing"]);

      expect(result).toEqual({ count: 10 });
      // Check that slugs are appended correctly
      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("slugs=shoes");
      expect(calledUrl).toContain("slugs=clothing");
    });
  });

  describe("sorted", () => {
    it("should fetch sorted products with default params", async () => {
      const mockResponse = {
        name: "All Products",
        products: [{ id: "1", name: "Product 1" }],
        totalCount: 1,
      };
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => mockResponse,
        })
      );

      const result = await client.products.sorted();

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/sorted-products"),
        expect.any(Object)
      );
    });

    it("should fetch sorted products with all params", async () => {
      const mockResponse = {
        name: "Shoes",
        products: [],
        totalCount: 0,
      };
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => mockResponse,
        })
      );

      await client.products.sorted({
        slugs: ["shoes"],
        page: 2,
        pageSize: 24,
        sort: "price_asc",
      });

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("page=2");
      expect(calledUrl).toContain("pageSize=24");
      expect(calledUrl).toContain("sort=price_asc");
      expect(calledUrl).toContain("slugs=shoes");
    });

    it("should support cache: no-store option", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => ({ products: [], totalCount: 0, name: "All" }),
        })
      );

      await client.products.sorted({}, { cache: "no-store" });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          cache: "no-store",
        })
      );
    });
  });

  describe("filtered", () => {
    it("should fetch filtered products", async () => {
      const mockResponse = {
        name: "All Products",
        products: [{ id: "1", name: "Product 1" }],
      };
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => mockResponse,
        })
      );

      const result = await client.products.filtered({
        slugs: ["all-products"],
        page: 1,
        pageSize: 1000,
      });

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/filtered-products"),
        expect.any(Object)
      );

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("page=1");
      expect(calledUrl).toContain("pageSize=1000");
      expect(calledUrl).toContain("slugs=all-products");
    });
  });
});
