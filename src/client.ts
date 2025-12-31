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

/**
 * The Storefront API client
 */
export interface StorefrontClient {
  /**
   * The configured API key (masked for security)
   */
  readonly apiKey: string;

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

  // Mask API key for security (show first 8 chars only)
  const maskedApiKey =
    config.apiKey.length > 8
      ? `${config.apiKey.slice(0, 8)}...`
      : config.apiKey;

  // Create the fetcher for making authenticated requests
  const fetcher = createFetcher({
    apiKey: config.apiKey,
    baseUrl,
    timeout: config.timeout,
  });

  return {
    apiKey: maskedApiKey,
    baseUrl,
    store: createStoreResource(fetcher),
    products: createProductsResource(fetcher),
    categories: createCategoriesResource(fetcher),
    cart: createCartResource(fetcher),
    shipping: createShippingResource(fetcher),
    customer: createCustomerResource(fetcher),
    order: createOrderResource(fetcher),
    checkout: createCheckoutResource(fetcher),
  };
}
