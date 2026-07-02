import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createStorefrontClient } from "../../src/client.js";
import { NotFoundError } from "../../src/utils/errors.js";
import type { Order } from "../../src/types/index.js";

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

// Mock order data matching API response
const mockOrder: Order = {
  id: "order-123",
  storeId: "store-456",
  createdAt: "2024-01-15T10:30:00.000Z",
  totalAmount: 4999,
  status: "PAID",
  orderNumber: 1001,
  OrderLineItems: [
    {
      id: "item-1",
      orderId: "order-123",
      itemType: "PRODUCT",
      quantity: 2,
      price: 1999,
      totalAmount: 3998,
      productCode: "prod-abc",
      name: "Test Product",
      vatRate: 25.5,
      images: ["https://example.com/image1.jpg"],
    },
    {
      id: "item-2",
      orderId: "order-123",
      itemType: "SHIPPING",
      quantity: 1,
      price: 1001,
      totalAmount: 1001,
      productCode: "shipping-001",
      name: "Posti - Kotipaketti",
      vatRate: 25.5,
      images: [],
    },
  ],
  orderCustomerData: {
    id: "cust-data-1",
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    phone: "+358401234567",
    address: "Testikatu 1",
    city: "Helsinki",
    postalCode: "00100",
  },
  orderShipmentMethod: {
    id: "shipment-1",
    serviceId: "posti-123",
    name: "Posti - Kotipaketti",
    description: "Toimitus kotiovelle",
    logo: "https://example.com/posti-logo.png",
    price: 1001,
    orderId: "order-123",
    vatRate: 25.5,
    trackingNumber: "JJFI1234567890",
    trackingUrls: ["https://tracking.posti.fi/JJFI1234567890"],
    shipmentNumber: "SHP-001",
    freightDoc: [],
  },
};

describe("order resource", () => {
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
    it("should fetch order by ID", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => mockOrder,
        })
      );

      const result = await client.order.get("order-123");

      expect(result).toEqual(mockOrder);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/order/order-123"),
        expect.any(Object)
      );
    });

    it("should encode order ID with special characters", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => mockOrder,
        })
      );

      await client.order.get("order/with/slashes");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/order/order%2Fwith%2Fslashes"),
        expect.any(Object)
      );
    });

    it("should pass fetch options through", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => mockOrder,
        })
      );

      await client.order.get("order-123", {
        next: { revalidate: 60, tags: ["order", "order-123"] },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          next: { revalidate: 60, tags: ["order", "order-123"] },
        })
      );
    });

    it("should throw NotFoundError when order not found", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          ok: false,
          status: 404,
          statusText: "Not Found",
          json: async () => ({ error: "Order not found" }),
        })
      );

      await expect(client.order.get("nonexistent")).rejects.toThrow(
        NotFoundError
      );
    });

    it("should return order with null shipment method", async () => {
      const orderWithoutShipment: Order = {
        ...mockOrder,
        orderShipmentMethod: null,
      };

      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => orderWithoutShipment,
        })
      );

      const result = await client.order.get("order-456");

      expect(result.orderShipmentMethod).toBeNull();
    });

    it("should return order with null customer data", async () => {
      const orderWithoutCustomer: Order = {
        ...mockOrder,
        orderCustomerData: null,
      };

      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => orderWithoutCustomer,
        })
      );

      const result = await client.order.get("order-789");

      expect(result.orderCustomerData).toBeNull();
    });

    it("should handle PENDING order status", async () => {
      const pendingOrder: Order = {
        ...mockOrder,
        status: "PENDING",
      };

      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => pendingOrder,
        })
      );

      const result = await client.order.get("order-pending");

      expect(result.status).toBe("PENDING");
    });

    it("should handle shipment with tracking info", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => mockOrder,
        })
      );

      const result = await client.order.get("order-123");

      expect(result.orderShipmentMethod?.trackingNumber).toBe("JJFI1234567890");
      expect(result.orderShipmentMethod?.trackingUrls).toHaveLength(1);
      expect(result.orderShipmentMethod?.trackingUrls[0]).toContain(
        "tracking.posti.fi"
      );
    });

    it("should support cache: no-store option", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => mockOrder,
        })
      );

      await client.order.get("order-123", { cache: "no-store" });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          cache: "no-store",
        })
      );
    });
  });

  describe("releasePending", () => {
    it("should release a pending order via POST", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => ({ released: true, status: "CANCELLED" }),
        })
      );

      const result = await client.order.releasePending("order-123");

      expect(result).toEqual({ released: true, status: "CANCELLED" });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/order/order-123/release"),
        expect.objectContaining({ method: "POST" })
      );
    });

    it("should report the current status when the payment won the race", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => ({ released: false, status: "PAID" }),
        })
      );

      const result = await client.order.releasePending("order-123");

      expect(result).toEqual({ released: false, status: "PAID" });
    });

    it("should encode the order ID", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => ({ released: true, status: "CANCELLED" }),
        })
      );

      await client.order.releasePending("order/with/slashes");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/order/order%2Fwith%2Fslashes/release"),
        expect.objectContaining({ method: "POST" })
      );
    });

    it("should throw when the order is not a Paytrail order", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          ok: false,
          status: 400,
          statusText: "Bad Request",
          json: async () => ({ error: "Not a Paytrail order" }),
        })
      );

      await expect(client.order.releasePending("order-123")).rejects.toThrow(
        "Not a Paytrail order"
      );
    });
  });
});
