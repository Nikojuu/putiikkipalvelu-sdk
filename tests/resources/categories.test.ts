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

describe("categories resource", () => {
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

  describe("list", () => {
    it("should fetch all categories with nested children", async () => {
      const mockCategories = [
        {
          id: "1",
          name: "Clothing",
          slug: "clothing",
          storeId: "store1",
          parentId: null,
          createdAt: "2024-01-01T00:00:00.000Z",
          children: [
            {
              id: "2",
              name: "Shirts",
              slug: "shirts",
              storeId: "store1",
              parentId: "1",
              createdAt: "2024-01-01T00:00:00.000Z",
              children: [],
            },
          ],
        },
        {
          id: "3",
          name: "Shoes",
          slug: "shoes",
          storeId: "store1",
          parentId: null,
          createdAt: "2024-01-01T00:00:00.000Z",
          children: [],
        },
      ];
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => mockCategories,
        })
      );

      const result = await client.categories.list();

      expect(result).toEqual(mockCategories);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/categories"),
        expect.any(Object)
      );
    });

    it("should pass fetch options through", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => [],
        })
      );

      await client.categories.list({
        next: { revalidate: 3600, tags: ["categories"] },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          next: { revalidate: 3600, tags: ["categories"] },
        })
      );
    });

    it("should return empty array when no categories exist", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => [],
        })
      );

      const result = await client.categories.list();

      expect(result).toEqual([]);
    });
  });

  describe("getBySlug", () => {
    it("should fetch category by slug", async () => {
      const mockCategory = {
        id: "1",
        name: "Clothing",
        slug: "clothing",
        storeId: "store1",
        parentId: null,
        createdAt: "2024-01-01T00:00:00.000Z",
        children: [],
      };
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => ({ category: mockCategory }),
        })
      );

      const result = await client.categories.getBySlug("clothing");

      expect(result).toEqual({ category: mockCategory });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/categories/clothing"),
        expect.any(Object)
      );
    });

    it("should encode slug with special characters", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => ({ category: { id: "1" } }),
        })
      );

      await client.categories.getBySlug("käsintehdyt-korut");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/categories/k%C3%A4sintehdyt-korut"),
        expect.any(Object)
      );
    });

    it("should throw NotFoundError when category not found", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          ok: false,
          status: 404,
          statusText: "Not Found",
          json: async () => ({ error: "Category not found" }),
        })
      );

      await expect(client.categories.getBySlug("nonexistent")).rejects.toThrow(
        NotFoundError
      );
    });

    it("should pass fetch options through", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => ({ category: { id: "1" } }),
        })
      );

      await client.categories.getBySlug("clothing", {
        next: { revalidate: 86400, tags: ["category", "clothing"] },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          next: { revalidate: 86400, tags: ["category", "clothing"] },
        })
      );
    });
  });
});
