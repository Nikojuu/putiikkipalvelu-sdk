import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createStorefrontClient } from "../../src/client.js";
import { ValidationError } from "../../src/utils/errors.js";
import type {
  StripeCheckoutResponse,
  PaytrailCheckoutResponse,
  CheckoutParams,
} from "../../src/types/index.js";

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

// Mock checkout params
const mockCheckoutParams: CheckoutParams = {
  customerData: {
    first_name: "Matti",
    last_name: "Meikäläinen",
    email: "matti@example.fi",
    address: "Mannerheimintie 1",
    postal_code: "00100",
    city: "Helsinki",
    phone: "+358401234567",
  },
  shipmentMethod: {
    shipmentMethodId: "ship-123",
    pickupId: null,
  },
  orderId: "order-abc123",
  successUrl: "https://mystore.com/success/order-abc123",
  cancelUrl: "https://mystore.com/cancel/order-abc123",
};

// Mock Stripe response
const mockStripeResponse: StripeCheckoutResponse = {
  url: "https://checkout.stripe.com/c/pay/cs_test_123abc",
};

// Mock Paytrail response
const mockPaytrailResponse: PaytrailCheckoutResponse = {
  transactionId: "pt-txn-123",
  href: "https://pay.paytrail.com/pay/pt-txn-123",
  reference: "store-456",
  terms: "https://www.paytrail.com/terms",
  groups: [
    {
      id: "bank",
      name: "Pankkimaksut",
      icon: "https://resources.paytrail.com/images/bank.png",
      svg: "<svg>...</svg>",
    },
    {
      id: "mobile",
      name: "Mobiilimaksut",
      icon: "https://resources.paytrail.com/images/mobile.png",
      svg: "<svg>...</svg>",
    },
  ],
  providers: [
    {
      id: "nordea",
      name: "Nordea",
      group: "bank",
      icon: "https://resources.paytrail.com/images/nordea.png",
      svg: "<svg>...</svg>",
      url: "https://payment.nordea.fi/...",
      parameters: [
        { name: "MERCHANT_ID", value: "123456" },
        { name: "AMOUNT", value: "4999" },
      ],
    },
    {
      id: "mobilepay",
      name: "MobilePay",
      group: "mobile",
      icon: "https://resources.paytrail.com/images/mobilepay.png",
      svg: "<svg>...</svg>",
      url: "https://mobilepay.paytrail.com/...",
      parameters: [
        { name: "MERCHANT_ID", value: "123456" },
        { name: "AMOUNT", value: "4999" },
      ],
    },
  ],
  customProviders: {},
};

describe("checkout resource", () => {
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

  describe("stripe", () => {
    it("should create a Stripe checkout session", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => mockStripeResponse,
        })
      );

      const result = await client.checkout.stripe(mockCheckoutParams);

      expect(result).toEqual(mockStripeResponse);
      expect(result.url).toContain("checkout.stripe.com");
    });

    it("should call the correct endpoint with POST", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => mockStripeResponse,
        })
      );

      await client.checkout.stripe(mockCheckoutParams);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/payments/stripe/checkout"),
        expect.objectContaining({
          method: "POST",
        })
      );
    });

    it("should send correct request body", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => mockStripeResponse,
        })
      );

      await client.checkout.stripe(mockCheckoutParams);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            orderId: mockCheckoutParams.orderId,
            chosenShipmentMethod: mockCheckoutParams.shipmentMethod,
            customerData: mockCheckoutParams.customerData,
            successUrl: mockCheckoutParams.successUrl,
            cancelUrl: mockCheckoutParams.cancelUrl,
          }),
        })
      );
    });

    it("should pass cartId header for guest checkout", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => mockStripeResponse,
        })
      );

      await client.checkout.stripe(mockCheckoutParams, {
        cartId: "cart-xyz-123",
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            "x-cart-id": "cart-xyz-123",
          }),
        })
      );
    });

    it("should pass sessionId header for authenticated checkout", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => mockStripeResponse,
        })
      );

      await client.checkout.stripe(mockCheckoutParams, {
        sessionId: "sess-abc-456",
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            "x-session-id": "sess-abc-456",
          }),
        })
      );
    });

    it("should pass both cartId and sessionId headers", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => mockStripeResponse,
        })
      );

      await client.checkout.stripe(mockCheckoutParams, {
        cartId: "cart-xyz-123",
        sessionId: "sess-abc-456",
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            "x-cart-id": "cart-xyz-123",
            "x-session-id": "sess-abc-456",
          }),
        })
      );
    });

    it("should handle null shipmentMethod", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => mockStripeResponse,
        })
      );

      const paramsWithoutShipping = {
        ...mockCheckoutParams,
        shipmentMethod: null,
      };

      await client.checkout.stripe(paramsWithoutShipping);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"chosenShipmentMethod":null'),
        })
      );
    });

    it("should throw ValidationError for empty cart", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          ok: false,
          status: 400,
          json: async () => ({ error: "Cart is empty", code: "EMPTY_CART" }),
        })
      );

      await expect(client.checkout.stripe(mockCheckoutParams)).rejects.toThrow(
        ValidationError
      );
    });

    it("should throw ValidationError for insufficient inventory", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          ok: false,
          status: 400,
          json: async () => ({
            error: "Product out of stock",
            code: "INSUFFICIENT_INVENTORY",
            details: {
              productId: "prod-123",
              availableQuantity: 2,
              requestedQuantity: 5,
            },
          }),
        })
      );

      await expect(client.checkout.stripe(mockCheckoutParams)).rejects.toThrow(
        ValidationError
      );
    });
  });

  describe("paytrail", () => {
    it("should create a Paytrail checkout session", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => mockPaytrailResponse,
        })
      );

      const result = await client.checkout.paytrail(mockCheckoutParams);

      expect(result).toEqual(mockPaytrailResponse);
      expect(result.transactionId).toBe("pt-txn-123");
      expect(result.providers).toHaveLength(2);
    });

    it("should call the correct endpoint with POST", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => mockPaytrailResponse,
        })
      );

      await client.checkout.paytrail(mockCheckoutParams);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/payments/paytrail/checkout"),
        expect.objectContaining({
          method: "POST",
        })
      );
    });

    it("should send correct request body", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => mockPaytrailResponse,
        })
      );

      await client.checkout.paytrail(mockCheckoutParams);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            orderId: mockCheckoutParams.orderId,
            chosenShipmentMethod: mockCheckoutParams.shipmentMethod,
            customerData: mockCheckoutParams.customerData,
            successUrl: mockCheckoutParams.successUrl,
            cancelUrl: mockCheckoutParams.cancelUrl,
          }),
        })
      );
    });

    it("should pass cartId header for guest checkout", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => mockPaytrailResponse,
        })
      );

      await client.checkout.paytrail(mockCheckoutParams, {
        cartId: "cart-xyz-123",
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            "x-cart-id": "cart-xyz-123",
          }),
        })
      );
    });

    it("should pass sessionId header for authenticated checkout", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => mockPaytrailResponse,
        })
      );

      await client.checkout.paytrail(mockCheckoutParams, {
        sessionId: "sess-abc-456",
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            "x-session-id": "sess-abc-456",
          }),
        })
      );
    });

    it("should return providers grouped by type", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => mockPaytrailResponse,
        })
      );

      const result = await client.checkout.paytrail(mockCheckoutParams);

      const banks = result.providers.filter((p) => p.group === "bank");
      const mobile = result.providers.filter((p) => p.group === "mobile");

      expect(banks).toHaveLength(1);
      expect(banks[0].name).toBe("Nordea");
      expect(mobile).toHaveLength(1);
      expect(mobile[0].name).toBe("MobilePay");
    });

    it("should return provider with form parameters", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => mockPaytrailResponse,
        })
      );

      const result = await client.checkout.paytrail(mockCheckoutParams);

      const nordea = result.providers.find((p) => p.id === "nordea");
      expect(nordea?.url).toBeTruthy();
      expect(nordea?.parameters).toHaveLength(2);
      expect(nordea?.parameters[0]).toEqual({
        name: "MERCHANT_ID",
        value: "123456",
      });
    });

    it("should return payment groups", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => mockPaytrailResponse,
        })
      );

      const result = await client.checkout.paytrail(mockCheckoutParams);

      expect(result.groups).toHaveLength(2);
      expect(result.groups[0].id).toBe("bank");
      expect(result.groups[1].id).toBe("mobile");
    });

    it("should handle shipment with pickupId", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => mockPaytrailResponse,
        })
      );

      const paramsWithPickup = {
        ...mockCheckoutParams,
        shipmentMethod: {
          shipmentMethodId: "ship-posti",
          pickupId: "pickup-123",
        },
      };

      await client.checkout.paytrail(paramsWithPickup);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"pickupId":"pickup-123"'),
        })
      );
    });

    it("should throw ValidationError for empty cart", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          ok: false,
          status: 400,
          json: async () => ({ error: "Cart is empty", code: "EMPTY_CART" }),
        })
      );

      await expect(client.checkout.paytrail(mockCheckoutParams)).rejects.toThrow(
        ValidationError
      );
    });

    it("should throw ValidationError for product not found", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          ok: false,
          status: 400,
          json: async () => ({
            error: "Product not found",
            code: "PRODUCT_NOT_FOUND",
            details: { productId: "prod-123" },
          }),
        })
      );

      await expect(client.checkout.paytrail(mockCheckoutParams)).rejects.toThrow(
        ValidationError
      );
    });
  });
});
