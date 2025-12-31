import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createStorefrontClient } from "../../src/client.js";
import { NotFoundError, ValidationError } from "../../src/utils/errors.js";

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

// Mock cart item for tests
const mockCartItem = {
  product: {
    id: "prod_123",
    name: "Test Product",
    slug: "test-product",
    price: 1999,
    description: "A test product",
    images: ["https://example.com/image.jpg"],
    quantity: 10,
    salePrice: null,
    salePercent: null,
    saleStartDate: null,
    saleEndDate: null,
    sku: "TEST-001",
    metaTitle: null,
    metaDescription: null,
    categories: [],
    variations: [],
  },
  cartQuantity: 2,
  variation: undefined,
};

describe("cart resource", () => {
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

  describe("get", () => {
    it("should fetch cart for guest user with cartId", async () => {
      const mockResponse = {
        items: [mockCartItem],
        cartId: "cart_abc123",
      };
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => mockResponse,
        })
      );

      const result = await client.cart.get({ cartId: "cart_abc123" });

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/cart"),
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            "x-cart-id": "cart_abc123",
          }),
        })
      );
    });

    it("should fetch cart for logged-in user with sessionId", async () => {
      const mockResponse = {
        items: [mockCartItem],
      };
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => mockResponse,
        })
      );

      const result = await client.cart.get({ sessionId: "session_xyz" });

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/cart"),
        expect.objectContaining({
          headers: expect.objectContaining({
            "x-session-id": "session_xyz",
          }),
        })
      );
    });

    it("should return empty cart when no cartId or sessionId", async () => {
      const mockResponse = { items: [], cartId: null };
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => mockResponse,
        })
      );

      const result = await client.cart.get();

      expect(result.items).toEqual([]);
    });
  });

  describe("addItem", () => {
    it("should add item to cart", async () => {
      const mockResponse = {
        items: [mockCartItem],
        cartId: "cart_new123",
      };
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => mockResponse,
        })
      );

      const result = await client.cart.addItem({
        productId: "prod_123",
        quantity: 2,
      });

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/cart"),
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("prod_123"),
        })
      );
    });

    it("should add item with variation", async () => {
      const mockResponse = {
        items: [{ ...mockCartItem, variation: { id: "var_456" } }],
        cartId: "cart_abc123",
      };
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => mockResponse,
        })
      );

      await client.cart.addItem({
        cartId: "cart_abc123",
        productId: "prod_123",
        variationId: "var_456",
        quantity: 1,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining("var_456"),
        })
      );
    });

    it("should throw ValidationError when exceeding stock", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          ok: false,
          status: 400,
          json: async () => ({ error: "Only 5 items available in stock" }),
        })
      );

      await expect(
        client.cart.addItem({
          productId: "prod_123",
          quantity: 100,
        })
      ).rejects.toThrow(ValidationError);
    });

    it("should pass cartId in headers and body", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => ({ items: [], cartId: "cart_abc" }),
        })
      );

      await client.cart.addItem({
        cartId: "cart_abc",
        productId: "prod_123",
        quantity: 1,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining("cart_abc"),
        })
      );
    });
  });

  describe("updateQuantity", () => {
    it("should increment quantity with positive delta", async () => {
      const mockResponse = {
        items: [{ ...mockCartItem, cartQuantity: 3 }],
        cartId: "cart_abc123",
      };
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => mockResponse,
        })
      );

      const result = await client.cart.updateQuantity({
        cartId: "cart_abc123",
        productId: "prod_123",
        delta: 1,
      });

      expect(result.items[0].cartQuantity).toBe(3);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/cart"),
        expect.objectContaining({
          method: "PATCH",
          body: expect.stringContaining('"delta":1'),
        })
      );
    });

    it("should decrement quantity with negative delta", async () => {
      const mockResponse = {
        items: [{ ...mockCartItem, cartQuantity: 1 }],
        cartId: "cart_abc123",
      };
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => mockResponse,
        })
      );

      await client.cart.updateQuantity({
        cartId: "cart_abc123",
        productId: "prod_123",
        delta: -1,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"delta":-1'),
        })
      );
    });

    it("should throw NotFoundError when item not in cart", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          ok: false,
          status: 404,
          json: async () => ({ error: "Item not found in cart" }),
        })
      );

      await expect(
        client.cart.updateQuantity({
          cartId: "cart_abc123",
          productId: "nonexistent",
          delta: 1,
        })
      ).rejects.toThrow(NotFoundError);
    });

    it("should update variation quantity", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => ({ items: [], cartId: "cart_abc" }),
        })
      );

      await client.cart.updateQuantity({
        cartId: "cart_abc",
        productId: "prod_123",
        variationId: "var_456",
        delta: -1,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining("var_456"),
        })
      );
    });
  });

  describe("removeItem", () => {
    it("should remove item from cart", async () => {
      const mockResponse = {
        items: [],
        cartId: "cart_abc123",
      };
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => mockResponse,
        })
      );

      const result = await client.cart.removeItem({
        cartId: "cart_abc123",
        productId: "prod_123",
      });

      expect(result.items).toEqual([]);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/cart"),
        expect.objectContaining({
          method: "DELETE",
          body: expect.stringContaining("prod_123"),
        })
      );
    });

    it("should remove variation from cart", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => ({ items: [], cartId: "cart_abc" }),
        })
      );

      await client.cart.removeItem({
        cartId: "cart_abc",
        productId: "prod_123",
        variationId: "var_456",
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining("var_456"),
        })
      );
    });
  });

  describe("validate", () => {
    it("should validate cart with no changes", async () => {
      const mockResponse = {
        items: [mockCartItem],
        hasChanges: false,
        changes: {
          removedItems: 0,
          quantityAdjusted: 0,
          priceChanged: 0,
        },
      };
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => mockResponse,
        })
      );

      const result = await client.cart.validate({ cartId: "cart_abc123" });

      expect(result.hasChanges).toBe(false);
      expect(result.items).toEqual([mockCartItem]);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/cart/validate"),
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            "x-cart-id": "cart_abc123",
          }),
        })
      );
    });

    it("should detect removed items", async () => {
      const mockResponse = {
        items: [],
        hasChanges: true,
        changes: {
          removedItems: 1,
          quantityAdjusted: 0,
          priceChanged: 0,
        },
      };
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => mockResponse,
        })
      );

      const result = await client.cart.validate({ cartId: "cart_abc123" });

      expect(result.hasChanges).toBe(true);
      expect(result.changes.removedItems).toBe(1);
    });

    it("should detect quantity adjustments", async () => {
      const mockResponse = {
        items: [{ ...mockCartItem, cartQuantity: 5 }],
        hasChanges: true,
        changes: {
          removedItems: 0,
          quantityAdjusted: 1,
          priceChanged: 0,
        },
      };
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => mockResponse,
        })
      );

      const result = await client.cart.validate({ sessionId: "session_xyz" });

      expect(result.hasChanges).toBe(true);
      expect(result.changes.quantityAdjusted).toBe(1);
    });

    it("should detect price changes", async () => {
      const mockResponse = {
        items: [{ ...mockCartItem, product: { ...mockCartItem.product, price: 2999 } }],
        hasChanges: true,
        changes: {
          removedItems: 0,
          quantityAdjusted: 0,
          priceChanged: 1,
        },
      };
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => mockResponse,
        })
      );

      const result = await client.cart.validate({ cartId: "cart_abc123" });

      expect(result.hasChanges).toBe(true);
      expect(result.changes.priceChanged).toBe(1);
    });
  });

  describe("fetch options passthrough", () => {
    it("should pass cache options to all methods", async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({
          json: async () => ({ items: [], cartId: "test" }),
        })
      );

      await client.cart.get({ cartId: "test" }, { cache: "no-store" });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          cache: "no-store",
        })
      );
    });

    it("should pass Next.js specific options", async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({
          json: async () => ({ items: [], hasChanges: false, changes: { removedItems: 0, quantityAdjusted: 0, priceChanged: 0 } }),
        })
      );

      await client.cart.validate({ cartId: "test" }, {
        next: { revalidate: 0, tags: ["cart"] },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          next: { revalidate: 0, tags: ["cart"] },
        })
      );
    });
  });
});
