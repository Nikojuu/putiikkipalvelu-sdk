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

describe("shipping resource", () => {
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

  describe("getMethods", () => {
    it("should fetch all shipment methods", async () => {
      const mockResponse = {
        shipmentMethods: [
          {
            id: "sm1",
            name: "Standard Shipping",
            description: "5-7 business days",
            min_estimate_delivery_days: 5,
            max_estimate_delivery_days: 7,
            active: true,
            price: 599,
            shipitMethod: null,
          },
          {
            id: "sm2",
            name: "Express Shipping",
            description: "1-2 business days",
            min_estimate_delivery_days: 1,
            max_estimate_delivery_days: 2,
            active: true,
            price: 1299,
            shipitMethod: {
              id: "shipit1",
              serviceId: "posti_express",
              name: "Posti Express",
              carrier: "Posti",
              logo: "https://example.com/posti.png",
              pickUpIncluded: false,
              homeDelivery: true,
              worldwideDelivery: false,
              fragile: false,
              domesticDeliveries: true,
              information: null,
              description: "Fast delivery",
              height: 50,
              length: 50,
              width: 50,
              weight: 20,
              type: "parcel",
              price: 1199,
              pickupPoint: false,
              onlyParchelLocker: false,
              shipmentMethodId: "sm2",
              createdAt: "2024-01-01T00:00:00.000Z",
              updatedAt: "2024-01-01T00:00:00.000Z",
            },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => mockResponse,
        })
      );

      const result = await client.shipping.getMethods();

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/shipment-methods"),
        expect.any(Object)
      );
    });

    it("should return empty array when no methods exist", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => ({ shipmentMethods: [] }),
        })
      );

      const result = await client.shipping.getMethods();

      expect(result.shipmentMethods).toEqual([]);
    });

    it("should pass fetch options through", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => ({ shipmentMethods: [] }),
        })
      );

      await client.shipping.getMethods({
        next: { revalidate: 3600, tags: ["shipping"] },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          next: { revalidate: 3600, tags: ["shipping"] },
        })
      );
    });
  });

  describe("getWithLocations", () => {
    it("should fetch shipment methods with pickup locations for postal code", async () => {
      const mockResponse = {
        shipmentMethods: [
          {
            id: "sm1",
            name: "Pickup Point",
            description: "Collect from pickup point",
            min_estimate_delivery_days: 2,
            max_estimate_delivery_days: 4,
            active: true,
            price: 499,
            shipitMethod: {
              id: "shipit1",
              serviceId: "matkahuolto_locker",
              name: "Matkahuolto Locker",
              carrier: "Matkahuolto",
              logo: "https://example.com/matkahuolto.png",
              pickUpIncluded: true,
              homeDelivery: false,
              worldwideDelivery: false,
              fragile: false,
              domesticDeliveries: true,
              information: null,
              description: "Parcel locker",
              height: 35,
              length: 60,
              width: 40,
              weight: 15,
              type: "parcel_locker",
              price: 399,
              pickupPoint: true,
              onlyParchelLocker: true,
              shipmentMethodId: "sm1",
              createdAt: "2024-01-01T00:00:00.000Z",
              updatedAt: "2024-01-01T00:00:00.000Z",
            },
          },
        ],
        pricedLocations: [
          {
            id: "loc1",
            name: "K-Market Kamppi",
            address1: "Urho Kekkosen katu 1",
            zipcode: "00100",
            city: "Helsinki",
            countryCode: "FI",
            serviceId: "matkahuolto_locker",
            carrier: "Matkahuolto",
            price: 399,
            merchantPrice: 499,
            carrierLogo: "https://example.com/matkahuolto.png",
            openingHours: {
              monday: ["07:00-22:00"],
              tuesday: ["07:00-22:00"],
              wednesday: ["07:00-22:00"],
              thursday: ["07:00-22:00"],
              friday: ["07:00-22:00"],
              saturday: ["09:00-20:00"],
              sunday: ["10:00-18:00"],
              exceptions: [],
            },
            openingHoursRaw: null,
            latitude: 60.1699,
            longitude: 24.9384,
            distanceInMeters: 500,
            distanceInKilometers: 0.5,
            metadata: null,
          },
          {
            id: "loc2",
            name: "R-Kioski Forum",
            address1: "Mannerheimintie 20",
            zipcode: "00100",
            city: "Helsinki",
            countryCode: "FI",
            serviceId: "matkahuolto_locker",
            carrier: "Matkahuolto",
            price: 399,
            merchantPrice: 499,
            carrierLogo: "https://example.com/matkahuolto.png",
            openingHours: null,
            openingHoursRaw: "Ma-Pe 08:00-21:00, La 10:00-18:00",
            latitude: 60.1689,
            longitude: 24.9354,
            distanceInMeters: 800,
            distanceInKilometers: 0.8,
            metadata: null,
          },
        ],
      };

      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => mockResponse,
        })
      );

      const result = await client.shipping.getWithLocations("00100");

      expect(result).toEqual(mockResponse);
      expect(result.shipmentMethods).toHaveLength(1);
      expect(result.pricedLocations).toHaveLength(2);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/shipment-methods/00100"),
        expect.any(Object)
      );
    });

    it("should encode postal code in URL", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => ({ shipmentMethods: [], pricedLocations: [] }),
        })
      );

      await client.shipping.getWithLocations("00100");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/shipment-methods/00100"),
        expect.any(Object)
      );
    });

    it("should return empty locations when no pickup points found", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => ({
            shipmentMethods: [{ id: "sm1", name: "Test", price: 500 }],
            pricedLocations: [],
          }),
        })
      );

      const result = await client.shipping.getWithLocations("99999");

      expect(result.pricedLocations).toEqual([]);
    });

    it("should throw NotFoundError when Shipit integration not found", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          ok: false,
          status: 404,
          statusText: "Not Found",
          json: async () => ({ error: "Shipit integration not found" }),
        })
      );

      await expect(
        client.shipping.getWithLocations("00100")
      ).rejects.toThrow(NotFoundError);
    });

    it("should pass fetch options through", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => ({ shipmentMethods: [], pricedLocations: [] }),
        })
      );

      await client.shipping.getWithLocations("00100", {
        next: { revalidate: 300, tags: ["shipping", "locations"] },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          next: { revalidate: 300, tags: ["shipping", "locations"] },
        })
      );
    });
  });
});
