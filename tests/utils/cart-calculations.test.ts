import { describe, it, expect } from "vitest";
import {
  calculateCartWithCampaigns,
  isCampaignActive,
} from "../../src/utils/cart-calculations.js";
import type { CartItem } from "../../src/types/cart.js";
import type { Campaign } from "../../src/types/storeconfig.js";

const CATEGORY_ID = "cat_eligible";

const campaign = (
  buyQuantity: number,
  payQuantity: number,
  dates: { startDate?: string; endDate?: string | null } = {}
): Campaign =>
  ({
    id: "campaign_1",
    type: "BUY_X_PAY_Y",
    isActive: true,
    startDate: dates.startDate ?? "2020-01-01T00:00:00.000Z",
    endDate: dates.endDate ?? null,
    BuyXPayYCampaign: {
      id: "bxpy_1",
      campaignId: "campaign_1",
      buyQuantity,
      payQuantity,
      applicableCategories: [{ id: CATEGORY_ID }],
    },
  }) as unknown as Campaign;

// One eligible product, 10 units at 20.00 EUR
const tenUnitsAt20 = (): CartItem[] => [
  {
    product: {
      id: "prod_1",
      name: "Product",
      price: 2000,
      salePrice: null,
      saleStartDate: null,
      saleEndDate: null,
      categories: [{ id: CATEGORY_ID }],
    },
    cartQuantity: 10,
  } as unknown as CartItem,
];

describe("calculateCartWithCampaigns - Buy X Pay Y quantities", () => {
  it("Buy 3 Pay 2 on 10 units frees one unit per complete set (3 sets -> 3 free)", () => {
    const result = calculateCartWithCampaigns(tenUnitsAt20(), [campaign(3, 2)]);

    expect(result.originalTotal).toBe(20000);
    expect(result.cartTotal).toBe(14000);
    expect(result.totalSavings).toBe(6000);
    expect(result.calculatedItems[0].freeQuantity).toBe(3);
    expect(result.calculatedItems[0].paidQuantity).toBe(7);
  });

  describe("repeats for every complete set", () => {
    // "Osta 3, maksa 2" is a per-set price: 6 units -> 2 free, 5 -> 1, 2 -> 0.
    const unitsAt = (cartQuantity: number, price: number, id = "prod_1") =>
      ({
        product: {
          id,
          name: id,
          price,
          salePrice: null,
          saleStartDate: null,
          saleEndDate: null,
          categories: [{ id: CATEGORY_ID }],
        },
        cartQuantity,
      }) as unknown as CartItem;

    const freeFor = (cartQuantity: number) =>
      calculateCartWithCampaigns([unitsAt(cartQuantity, 2000)], [campaign(3, 2)])
        .calculatedItems[0].freeQuantity;

    it("2 units -> 0 free", () => expect(freeFor(2)).toBe(0));
    it("3 units -> 1 free", () => expect(freeFor(3)).toBe(1));
    it("5 units -> 1 free (incomplete second set)", () => expect(freeFor(5)).toBe(1));
    it("6 units -> 2 free", () => expect(freeFor(6)).toBe(2));
    it("9 units -> 3 free", () => expect(freeFor(9)).toBe(3));

    it("Buy 5 Pay 3 on 10 units -> 4 free", () => {
      const result = calculateCartWithCampaigns([unitsAt(10, 2000)], [campaign(5, 3)]);
      expect(result.calculatedItems[0].freeQuantity).toBe(4);
      expect(result.cartTotal).toBe(12000);
    });

    it("free units are the cheapest across the whole pool, not per set", () => {
      // 3 x 10.00 + 3 x 5.00 = 2 sets -> 2 free, both taken from the 5.00 product
      const result = calculateCartWithCampaigns(
        [unitsAt(3, 1000, "expensive"), unitsAt(3, 500, "cheap")],
        [campaign(3, 2)]
      );
      const byId = Object.fromEntries(
        result.calculatedItems.map((c) => [c.item.product.id, c])
      );
      expect(byId.cheap.freeQuantity).toBe(2);
      expect(byId.cheap.paidQuantity).toBe(1);
      expect(byId.expensive.freeQuantity).toBe(0);
      expect(result.totalSavings).toBe(1000);
      expect(result.cartTotal).toBe(3500);
    });
  });

  describe("inverted or equal quantities (merchant typo guard)", () => {
    // Must mirror the backend: a typo such as "Osta 2, maksa 3" must never
    // show a discount, otherwise the storefront total and the charged total
    // agree on a wrong number and nobody notices.
    const expectFullPrice = (buy: number, pay: number) => {
      const result = calculateCartWithCampaigns(tenUnitsAt20(), [
        campaign(buy, pay),
      ]);

      expect(result.cartTotal).toBe(20000);
      expect(result.totalSavings).toBe(0);
      expect(result.calculatedItems[0].freeQuantity).toBe(0);
      expect(result.calculatedItems[0].paidQuantity).toBe(10);
    };

    it("Buy 2 Pay 3 charges full price", () => expectFullPrice(2, 3));
    it("Buy 1 Pay 5 charges full price", () => expectFullPrice(1, 5));
    it("Buy 2 Pay 2 charges full price", () => expectFullPrice(2, 2));
  });
});

describe("campaign date window", () => {
  const iso = (offsetDays: number, endOfDay = false) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    if (endOfDay) d.setHours(23, 59, 59, 999);
    else d.setHours(0, 0, 0, 0);
    return d.toISOString();
  };
  // 10 eligible units = 3 complete sets of 3 -> 3 free units = 60.00 saved
  const savings = (c: Campaign) =>
    calculateCartWithCampaigns(tenUnitsAt20(), [c]).totalSavings;

  it("applies inside the window", () => {
    expect(savings(campaign(3, 2, { startDate: iso(-1), endDate: iso(1, true) }))).toBe(6000);
  });

  it("applies with no end date once started", () => {
    expect(savings(campaign(3, 2, { startDate: iso(-1), endDate: null }))).toBe(6000);
  });

  it("does NOT apply before the start date (scheduled campaign)", () => {
    expect(savings(campaign(3, 2, { startDate: iso(1) }))).toBe(0);
  });

  it("does NOT apply after the end date (ended campaign left toggled on)", () => {
    expect(savings(campaign(3, 2, { startDate: iso(-10), endDate: iso(-1, true) }))).toBe(0);
  });

  it("applies through the whole last day (end-of-day boundary)", () => {
    // endDate = today 23:59:59.999 → still live right now
    expect(savings(campaign(3, 2, { startDate: iso(-1), endDate: iso(0, true) }))).toBe(6000);
  });

  it("isCampaignActive respects the toggle", () => {
    const c = { ...campaign(3, 2, { startDate: iso(-1) }), isActive: false };
    expect(isCampaignActive(c)).toBe(false);
  });

  it("isCampaignActive accepts an explicit `now`", () => {
    const c = campaign(3, 2, {
      startDate: "2026-06-01T00:00:00.000Z",
      endDate: "2026-06-30T23:59:59.999Z",
    });
    expect(isCampaignActive(c, new Date("2026-06-15T12:00:00Z"))).toBe(true);
    expect(isCampaignActive(c, new Date("2026-05-31T23:59:59Z"))).toBe(false);
    expect(isCampaignActive(c, new Date("2026-07-01T00:00:00Z"))).toBe(false);
  });
});
