import type { StorefrontClientConfig } from "./types/index.js";
import { createFetcher } from "./utils/fetch.js";
import { createStoreResource, type StoreResource } from "./resources/store.js";
import {
  createProductsResource,
  type ProductsResource,
} from "./resources/products.js";
import {
  createCategoriesResource,
  type CategoriesResource,
} from "./resources/categories.js";
import { createCartResource, type CartResource } from "./resources/cart.js";
import {
  createShippingResource,
  type ShippingResource,
} from "./resources/shipping.js";
import {
  createCustomerResource,
  type CustomerResource,
} from "./resources/customer.js";
import {
  createOrderResource,
  type OrderResource,
} from "./resources/order.js";
import {
  createCheckoutResource,
  type CheckoutResource,
} from "./resources/checkout.js";
import {
  createDiscountCodeResource,
  type DiscountCodeResource,
} from "./resources/discount-code.js";
import {
  createPagesResource,
  type PagesResource,
} from "./resources/pages.js";
import {
  createTicketsResource,
  type TicketsResource,
} from "./resources/tickets.js";
import {
  createWithdrawalResource,
  type WithdrawalResource,
} from "./resources/withdrawal.js";
import {
  createReviewsResource,
  type ReviewsResource,
} from "./resources/reviews.js";

/**
 * The Storefront API client
 */
export interface StorefrontClient {
  /**
   * The base URL for API requests
   */
  readonly baseUrl: string;

  /**
   * Store configuration resource
   */
  readonly store: StoreResource;

  /**
   * Products resource
   */
  readonly products: ProductsResource;

  /**
   * Categories resource
   */
  readonly categories: CategoriesResource;

  /**
   * Cart resource
   */
  readonly cart: CartResource;

  /**
   * Shipping resource
   */
  readonly shipping: ShippingResource;

  /**
   * Customer authentication and account management resource
   */
  readonly customer: CustomerResource;

  /**
   * Order resource for fetching order details
   */
  readonly order: OrderResource;

  /**
   * Checkout resource for payment processing
   */
  readonly checkout: CheckoutResource;

  /**
   * Discount code resource for applying/removing discount codes
   */
  readonly discountCode: DiscountCodeResource;

  /**
   * Pages resource for fetching CMS pages
   */
  readonly pages: PagesResource;

  /**
   * Tickets resource for ticket scanning and validation
   */
  readonly tickets: TicketsResource;

  /**
   * Withdrawal resource for consumer withdrawal notices (KKV peruutustoiminto)
   */
  readonly withdrawal: WithdrawalResource;

  /**
   * Reviews resource for listing and submitting product reviews
   */
  readonly reviews: ReviewsResource;
}

/**
 * Create a new Storefront API client
 */
export function createStorefrontClient(config: StorefrontClientConfig): StorefrontClient {
  if (!config.apiKey) {
    throw new Error("apiKey is required");
  }
  if (!config.baseUrl) {
    throw new Error("baseUrl is required");
  }

  // Ensure baseUrl doesn't have trailing slash
  const baseUrl = config.baseUrl.replace(/\/$/, "");

  // Create the fetcher for making authenticated requests
  const fetcher = createFetcher({
    apiKey: config.apiKey,
    baseUrl,
    timeout: config.timeout,
  });

  return {
    baseUrl,
    store: createStoreResource(fetcher),
    products: createProductsResource(fetcher),
    categories: createCategoriesResource(fetcher),
    cart: createCartResource(fetcher),
    shipping: createShippingResource(fetcher),
    customer: createCustomerResource(fetcher),
    order: createOrderResource(fetcher),
    checkout: createCheckoutResource(fetcher),
    discountCode: createDiscountCodeResource(fetcher),
    pages: createPagesResource(fetcher),
    tickets: createTicketsResource(fetcher),
    withdrawal: createWithdrawalResource(fetcher),
    reviews: createReviewsResource(fetcher),
  };
}
