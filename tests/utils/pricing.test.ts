import { describe, it, expect } from "vitest";
import { getPriceInfo, isSaleActive } from "../../src/utils/pricing.js";
import type {
  ProductDetail,
  ProductVariation,
} from "../../src/types/products.js";

const DAY = 24 * 60 * 60 * 1000;
const iso = (offsetDays: number) =>
  new Date(Date.now() + offsetDays * DAY).toISOString();

const product = (overrides: Partial<ProductDetail> = {}): ProductDetail =>
  ({
    id: "p1",
    name: "Tuote",
    slug: "tuote",
    description: "",
    price: 10000,
    images: [],
    quantity: null,
    salePrice: null,
    salePercent: null,
    saleStartDate: null,
    saleEndDate: null,
    weight: 0,
    sku: null,
    metaTitle: null,
    metaDescription: null,
    categories: [],
    variations: [],
    ticketInfo: null,
    averageRating: null,
    reviewCount: 0,
    ...overrides,
  }) as ProductDetail;

const variation = (
  overrides: Partial<ProductVariation> = {}
): ProductVariation =>
  ({
    id: "v1",
    price: 12000,
    salePrice: null,
    salePercent: null,
    saleStartDate: null,
    saleEndDate: null,
    weight: null,
    quantity: null,
    sku: null,
    images: [],
    description: null,
    showOnStore: true,
    options: [],
    ...overrides,
  }) as ProductVariation;

describe("isSaleActive", () => {
  it("is active without dates, within a window, and inactive outside it", () => {
    expect(isSaleActive(null, null)).toBe(true);
    expect(isSaleActive(iso(-1), iso(1))).toBe(true);
    expect(isSaleActive(iso(1), null)).toBe(false);
    expect(isSaleActive(null, iso(-1))).toBe(false);
  });
});

describe("getPriceInfo", () => {
  it("returns the regular price with no reference when not on sale", () => {
    expect(getPriceInfo(product())).toEqual({
      effectivePrice: 10000,
      originalPrice: 10000,
      isOnSale: false,
      salePercent: null,
      lowestPriceBeforeSale: null,
    });
  });

  it("returns the sale price, percent and the 30-day reference while on sale", () => {
    const info = getPriceInfo(
      product({ salePrice: 8000, salePercent: "0.8", lowestPriceBeforeSale: 9000 })
    );
    expect(info).toEqual({
      effectivePrice: 8000,
      originalPrice: 10000,
      isOnSale: true,
      salePercent: "0.8",
      lowestPriceBeforeSale: 9000,
    });
  });

  it("drops the reference once the sale window has ended", () => {
    const info = getPriceInfo(
      product({
        salePrice: 8000,
        saleStartDate: iso(-10),
        saleEndDate: iso(-1),
        lowestPriceBeforeSale: 9000,
      })
    );
    expect(info.isOnSale).toBe(false);
    expect(info.effectivePrice).toBe(10000);
    expect(info.lowestPriceBeforeSale).toBeNull();
  });

  it("keeps the reference null when the API has none (new product, display off, old API)", () => {
    expect(
      getPriceInfo(product({ salePrice: 8000, lowestPriceBeforeSale: null }))
        .lowestPriceBeforeSale
    ).toBeNull();
    // field absent entirely — older API versions
    const legacy = product({ salePrice: 8000 });
    delete (legacy as Partial<ProductDetail>).lowestPriceBeforeSale;
    expect(getPriceInfo(legacy).lowestPriceBeforeSale).toBeNull();
  });

  it("uses the variation's own prices and reference, not the product's", () => {
    const info = getPriceInfo(
      product({ salePrice: 8000, lowestPriceBeforeSale: 9000 }),
      variation({ salePrice: 10000, lowestPriceBeforeSale: 11000 })
    );
    expect(info).toEqual({
      effectivePrice: 10000,
      originalPrice: 12000,
      isOnSale: true,
      salePercent: null,
      lowestPriceBeforeSale: 11000,
    });
  });

  it("falls back to the product price for a variation without its own price", () => {
    const info = getPriceInfo(
      product(),
      variation({ price: null as unknown as number })
    );
    expect(info.originalPrice).toBe(10000);
    expect(info.effectivePrice).toBe(10000);
    expect(info.isOnSale).toBe(false);
  });
});
