import { describe, it, expect } from "vitest";
import { calculateCartWithCampaigns } from "../../src/utils/cart-calculations.js";
import type { CartItem } from "../../src/types/cart.js";
import type { Campaign } from "../../src/types/storeconfig.js";

const CATEGORY_ID = "cat_eligible";

const campaign = (buyQuantity: number, payQuantity: number): Campaign =>
  ({
    id: "campaign_1",
    type: "BUY_X_PAY_Y",
    isActive: true,
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
  it("Buy 3 Pay 2 makes one unit free", () => {
    const result = calculateCartWithCampaigns(tenUnitsAt20(), [campaign(3, 2)]);

    expect(result.originalTotal).toBe(20000);
    expect(result.cartTotal).toBe(18000);
    expect(result.totalSavings).toBe(2000);
    expect(result.calculatedItems[0].freeQuantity).toBe(1);
    expect(result.calculatedItems[0].paidQuantity).toBe(9);
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
