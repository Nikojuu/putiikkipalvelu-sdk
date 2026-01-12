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

  describe("getWithLocations", () => {
    it("should fetch shipping options with pickup locations for postal code", async () => {
      const mockResponse = {
        homeDeliveryMethods: [
          {
            id: "sm1",
            name: "Home Delivery",
            description: "Deliver to your address",
            min_estimate_delivery_days: 2,
            max_estimate_delivery_days: 5,
            active: true,
            price: 1090,
            shipitMethod: {
              id: "shipit1",
              serviceIds: ["posti.kotipaketti"],
              name: "Posti Kotipaketti",
              carriers: ["Posti"],
              logos: ["https://example.com/posti.png"],
              showPickupPoints: false,
            },
          },
        ],
        pickupLocations: [
          {
            id: "loc1",
            name: "K-Market Kamppi",
            address1: "Urho Kekkosen katu 1",
            zipcode: "00100",
            city: "Helsinki",
            countryCode: "FI",
            serviceId: "posti.po2103",
            carrier: "Posti",
            carrierLogo: "https://example.com/posti.png",
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
            type: "parcel_locker",
            shipmentMethodId: "sm2",
            price: 790,
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
      expect(result.homeDeliveryMethods).toHaveLength(1);
      expect(result.pickupLocations).toHaveLength(1);
      expect(result.pickupLocations[0].shipmentMethodId).toBe("sm2");
      expect(result.pickupLocations[0].price).toBe(790);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/shipment-methods/00100"),
        expect.any(Object)
      );
    });

    it("should encode postal code in URL", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => ({ homeDeliveryMethods: [], pickupLocations: [] }),
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
            homeDeliveryMethods: [{ id: "sm1", name: "Test", price: 500 }],
            pickupLocations: [],
          }),
        })
      );

      const result = await client.shipping.getWithLocations("99999");

      expect(result.pickupLocations).toEqual([]);
      expect(result.homeDeliveryMethods).toHaveLength(1);
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
          json: async () => ({ homeDeliveryMethods: [], pickupLocations: [] }),
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
