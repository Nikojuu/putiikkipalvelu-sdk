/**
 * Customer Resource
 *
 * Methods for customer authentication and account management.
 * Supports session-based authentication with the x-session-id header.
 */

import type {
  FetchOptions,
  RegisterData,
  RegisterResponse,
  LoginOptions,
  LoginResponse,
  LogoutResponse,
  GetUserResponse,
  VerifyEmailResponse,
  ResendVerificationResponse,
  UpdateProfileData,
  UpdateProfileResponse,
  DeleteAccountResponse,
  GetOrdersResponse,
  WishlistResponse,
  AddToWishlistResponse,
  RemoveFromWishlistResponse,
  ForgotPasswordResponse,
  ResetPasswordResponse,
} from "../types/index.js";
import type { Fetcher } from "../utils/fetch.js";

/**
 * Build headers for authenticated customer requests
 */
function buildSessionHeaders(sessionId: string): Record<string, string> {
  return { "x-session-id": sessionId };
}

/**
 * Customer resource for authentication and account management
 */
export function createCustomerResource(fetcher: Fetcher) {
  return {
    /**
     * Register a new customer account.
     * A verification email is sent automatically by the server.
     * The customer must verify their email before logging in.
     *
     * @param data - Registration data (firstName, lastName, email, password)
     * @param fetchOptions - Fetch options
     * @returns Created customer data and success message
     *
     * @example
     * ```typescript
     * const { customer, message } = await client.customer.register({
     *   firstName: 'John',
     *   lastName: 'Doe',
     *   email: 'john@example.com',
     *   password: 'securePassword123'
     * });
     *
     * // Verification email is sent automatically by the server
     * console.log('Account created:', message);
     * ```
     */
    async register(
      data: RegisterData,
      fetchOptions?: FetchOptions
    ): Promise<RegisterResponse> {
      return fetcher.request<RegisterResponse>(
        "/api/storefront/v1/customer/(auth)/register",
        {
          method: "POST",
          body: data,
          ...fetchOptions,
        }
      );
    },

    /**
     * Log in an existing customer.
     * Returns a session ID that must be stored and passed to authenticated endpoints.
     *
     * @param email - Customer's email address
     * @param password - Customer's password
     * @param options - Login options (optional cartId for cart merging)
     * @param fetchOptions - Fetch options
     * @returns Session ID and customer data
     * @throws ValidationError if email is not verified (check error for requiresVerification)
     *
     * @example
     * ```typescript
     * try {
     *   const { sessionId, customer, expiresAt } = await client.customer.login(
     *     'john@example.com',
     *     'securePassword123',
     *     { cartId: guestCartId } // Optional: merge guest cart
     *   );
     *
     *   // Store sessionId in a cookie
     *   cookies().set('session-id', sessionId, {
     *     httpOnly: true,
     *     expires: new Date(expiresAt)
     *   });
     * } catch (error) {
     *   if (error.requiresVerification) {
     *     // Prompt user to verify email
     *     await client.customer.resendVerification(error.customerId);
     *   }
     * }
     * ```
     */
    async login(
      email: string,
      password: string,
      options?: LoginOptions,
      fetchOptions?: FetchOptions
    ): Promise<LoginResponse> {
      const headers: Record<string, string> = {};
      if (options?.cartId) {
        headers["x-cart-id"] = options.cartId;
      }

      return fetcher.request<LoginResponse>(
        "/api/storefront/v1/customer/(auth)/login",
        {
          method: "POST",
          body: { email, password },
          headers,
          ...fetchOptions,
        }
      );
    },

    /**
     * Log out the current customer and invalidate their session.
     * If the customer had items in their cart, they are migrated to a new guest cart.
     *
     * @param sessionId - The customer's session ID
     * @param fetchOptions - Fetch options
     * @returns Logout confirmation with optional new guest cart ID
     *
     * @example
     * ```typescript
     * const { cartId } = await client.customer.logout(sessionId);
     *
     * // Clear session cookie
     * cookies().delete('session-id');
     *
     * // If cart was migrated, store the new guest cart ID
     * if (cartId) {
     *   cookies().set('cart-id', cartId);
     * }
     * ```
     */
    async logout(
      sessionId: string,
      fetchOptions?: FetchOptions
    ): Promise<LogoutResponse> {
      return fetcher.request<LogoutResponse>(
        "/api/storefront/v1/customer/(auth)/logout",
        {
          method: "POST",
          headers: buildSessionHeaders(sessionId),
          ...fetchOptions,
        }
      );
    },

    /**
     * Get the currently authenticated customer's profile.
     *
     * @param sessionId - The customer's session ID
     * @param fetchOptions - Fetch options
     * @returns Current customer data
     * @throws AuthError if session is invalid or expired
     *
     * @example
     * ```typescript
     * const sessionId = cookies().get('session-id')?.value;
     * if (sessionId) {
     *   const { customer } = await client.customer.getUser(sessionId);
     *   console.log(`Welcome back, ${customer.firstName}!`);
     * }
     * ```
     */
    async getUser(
      sessionId: string,
      fetchOptions?: FetchOptions
    ): Promise<GetUserResponse> {
      return fetcher.request<GetUserResponse>(
        "/api/storefront/v1/customer/(auth)/get-user",
        {
          method: "GET",
          headers: buildSessionHeaders(sessionId),
          ...fetchOptions,
        }
      );
    },

    /**
     * Verify a customer's email address using the token sent during registration.
     *
     * @param token - Email verification token
     * @param fetchOptions - Fetch options
     * @returns Verification confirmation
     * @throws ValidationError if token is invalid or expired
     *
     * @example
     * ```typescript
     * // Token comes from the verification email link
     * const token = searchParams.get('token');
     *
     * const { message } = await client.customer.verifyEmail(token);
     * console.log(message); // "Email verified successfully. You can now log in."
     * ```
     */
    async verifyEmail(
      token: string,
      fetchOptions?: FetchOptions
    ): Promise<VerifyEmailResponse> {
      return fetcher.request<VerifyEmailResponse>(
        "/api/storefront/v1/customer/(auth)/verify-email",
        {
          method: "GET",
          params: { token },
          ...fetchOptions,
        }
      );
    },

    /**
     * Resend the verification email for an unverified customer.
     * A new verification email is sent automatically by the server.
     *
     * @param customerId - The customer's ID (from failed login response)
     * @param fetchOptions - Fetch options
     * @returns Success message
     * @throws ValidationError if customer is already verified or not found
     *
     * @example
     * ```typescript
     * // After login fails with requiresVerification
     * const { message } = await client.customer.resendVerification(customerId);
     *
     * // Verification email is sent automatically by the server
     * console.log(message); // "Verification email sent."
     * ```
     */
    async resendVerification(
      customerId: string,
      fetchOptions?: FetchOptions
    ): Promise<ResendVerificationResponse> {
      return fetcher.request<ResendVerificationResponse>(
        "/api/storefront/v1/customer/(auth)/resend-verification",
        {
          method: "POST",
          body: { customerId },
          ...fetchOptions,
        }
      );
    },

    /**
     * Request a password reset for a customer account.
     * The server sends a password reset email directly to the customer.
     * Returns success even if email doesn't exist (to prevent email enumeration).
     *
     * Note: The reset token is never exposed to the client for security.
     * The email is sent server-side with the reset link.
     *
     * @param email - Customer's email address
     * @param fetchOptions - Fetch options
     * @returns Generic success message (same whether email exists or not)
     *
     * @example
     * ```typescript
     * const response = await client.customer.forgotPassword('john@example.com');
     *
     * // Always show same message to user (email sent server-side)
     * console.log(response.message);
     * // "If an account exists with that email, password reset instructions have been sent."
     * ```
     */
    async forgotPassword(
      email: string,
      fetchOptions?: FetchOptions
    ): Promise<ForgotPasswordResponse> {
      return fetcher.request<ForgotPasswordResponse>(
        "/api/storefront/v1/customer/(auth)/forgot-password",
        {
          method: "POST",
          body: { email },
          ...fetchOptions,
        }
      );
    },

    /**
     * Reset a customer's password using a valid reset token.
     * The token is sent via email by the forgotPassword endpoint.
     * After successful reset, all existing sessions are invalidated.
     *
     * @param token - Password reset token (from email link)
     * @param password - New password (minimum 8 characters)
     * @param fetchOptions - Fetch options
     * @returns Success confirmation
     * @throws ValidationError if token is invalid or expired
     *
     * @example
     * ```typescript
     * // Token comes from the reset email link
     * const token = searchParams.get('token');
     *
     * try {
     *   const { message } = await client.customer.resetPassword(token, newPassword);
     *   console.log(message); // "Password reset successful..."
     *
     *   // Redirect to login page
     *   redirect('/login?reset=success');
     * } catch (error) {
     *   if (error instanceof ValidationError) {
     *     // Token invalid or expired
     *     console.error('Please request a new password reset');
     *   }
     * }
     * ```
     */
    async resetPassword(
      token: string,
      password: string,
      fetchOptions?: FetchOptions
    ): Promise<ResetPasswordResponse> {
      return fetcher.request<ResetPasswordResponse>(
        "/api/storefront/v1/customer/(auth)/reset-password",
        {
          method: "POST",
          body: { token, password },
          ...fetchOptions,
        }
      );
    },

    // =========================================================================
    // Profile Management Methods
    // =========================================================================

    /**
     * Update the authenticated customer's profile.
     *
     * @param sessionId - The customer's session ID
     * @param data - Profile data to update (firstName, lastName, email)
     * @param fetchOptions - Fetch options
     * @returns Updated customer data
     * @throws AuthError if session is invalid
     * @throws ValidationError if email is already taken by another customer
     *
     * @example
     * ```typescript
     * const { customer } = await client.customer.updateProfile(sessionId, {
     *   firstName: 'Jane',
     *   lastName: 'Smith',
     *   email: 'jane.smith@example.com'
     * });
     *
     * console.log('Profile updated:', customer.email);
     * ```
     */
    async updateProfile(
      sessionId: string,
      data: UpdateProfileData,
      fetchOptions?: FetchOptions
    ): Promise<UpdateProfileResponse> {
      return fetcher.request<UpdateProfileResponse>(
        "/api/storefront/v1/customer/edit-user",
        {
          method: "PATCH",
          headers: buildSessionHeaders(sessionId),
          body: data,
          ...fetchOptions,
        }
      );
    },

    /**
     * Delete the authenticated customer's account.
     * This action is permanent and cannot be undone.
     * All associated data (sessions, wishlist, etc.) will be deleted.
     *
     * @param sessionId - The customer's session ID
     * @param fetchOptions - Fetch options
     * @returns Deletion confirmation
     * @throws AuthError if session is invalid
     *
     * @example
     * ```typescript
     * // Confirm with user before calling
     * if (confirm('Are you sure you want to delete your account?')) {
     *   await client.customer.deleteAccount(sessionId);
     *
     *   // Clear session cookie
     *   cookies().delete('session-id');
     *
     *   // Redirect to home page
     *   redirect('/');
     * }
     * ```
     */
    async deleteAccount(
      sessionId: string,
      fetchOptions?: FetchOptions
    ): Promise<DeleteAccountResponse> {
      return fetcher.request<DeleteAccountResponse>(
        "/api/storefront/v1/customer/delete-user",
        {
          method: "DELETE",
          headers: buildSessionHeaders(sessionId),
          ...fetchOptions,
        }
      );
    },

    /**
     * Get the customer's order history.
     * Returns all orders with line items and product details.
     *
     * @param sessionId - The customer's session ID
     * @param customerId - The customer's ID
     * @param fetchOptions - Fetch options
     * @returns List of customer orders
     *
     * @example
     * ```typescript
     * const { orders } = await client.customer.getOrders(sessionId, customerId);
     *
     * orders.forEach(order => {
     *   console.log(`Order #${order.orderNumber}: ${order.status}`);
     *   order.OrderLineItems.forEach(item => {
     *     console.log(`  - ${item.name} x${item.quantity}`);
     *   });
     * });
     * ```
     */
    async getOrders(
      sessionId: string,
      customerId: string,
      fetchOptions?: FetchOptions
    ): Promise<GetOrdersResponse> {
      return fetcher.request<GetOrdersResponse>(
        `/api/storefront/v1/customer/get-orders/${customerId}`,
        {
          method: "GET",
          headers: buildSessionHeaders(sessionId),
          ...fetchOptions,
        }
      );
    },

    // =========================================================================
    // Wishlist (Nested Resource)
    // =========================================================================

    /**
     * Wishlist management methods.
     * Access via `client.customer.wishlist.get()`, `.add()`, `.remove()`.
     */
    wishlist: {
      /**
       * Get the customer's wishlist.
       * Returns all wishlist items with product and variation details.
       *
       * @param sessionId - The customer's session ID
       * @param fetchOptions - Fetch options
       * @returns Wishlist items with product details
       * @throws AuthError if session is invalid
       *
       * @example
       * ```typescript
       * const { items } = await client.customer.wishlist.get(sessionId);
       *
       * items.forEach(item => {
       *   console.log(`${item.product.name} - $${item.product.price / 100}`);
       *   if (item.variation) {
       *     const options = item.variation.options
       *       .map(o => `${o.optionType.name}: ${o.value}`)
       *       .join(', ');
       *     console.log(`  Variant: ${options}`);
       *   }
       * });
       * ```
       */
      async get(
        sessionId: string,
        fetchOptions?: FetchOptions
      ): Promise<WishlistResponse> {
        return fetcher.request<WishlistResponse>(
          "/api/storefront/v1/customer/wishlist",
          {
            method: "GET",
            headers: buildSessionHeaders(sessionId),
            ...fetchOptions,
          }
        );
      },

      /**
       * Add a product to the customer's wishlist.
       *
       * @param sessionId - The customer's session ID
       * @param productId - The product ID to add
       * @param variationId - Optional variation ID (for products with variations)
       * @param fetchOptions - Fetch options
       * @returns Success message
       * @throws AuthError if session is invalid
       * @throws ValidationError if product already in wishlist
       *
       * @example
       * ```typescript
       * // Add a simple product
       * await client.customer.wishlist.add(sessionId, 'prod_123');
       *
       * // Add a product with a specific variation
       * await client.customer.wishlist.add(sessionId, 'prod_123', 'var_456');
       * ```
       */
      async add(
        sessionId: string,
        productId: string,
        variationId?: string,
        fetchOptions?: FetchOptions
      ): Promise<AddToWishlistResponse> {
        return fetcher.request<AddToWishlistResponse>(
          "/api/storefront/v1/customer/wishlist",
          {
            method: "POST",
            headers: buildSessionHeaders(sessionId),
            body: { productId, variationId },
            ...fetchOptions,
          }
        );
      },

      /**
       * Remove a product from the customer's wishlist.
       *
       * @param sessionId - The customer's session ID
       * @param productId - The product ID to remove
       * @param variationId - Optional variation ID (must match if item was added with variation)
       * @param fetchOptions - Fetch options
       * @returns Success message
       * @throws AuthError if session is invalid
       * @throws NotFoundError if item not in wishlist
       *
       * @example
       * ```typescript
       * // Remove a simple product
       * await client.customer.wishlist.remove(sessionId, 'prod_123');
       *
       * // Remove a specific variation
       * await client.customer.wishlist.remove(sessionId, 'prod_123', 'var_456');
       * ```
       */
      async remove(
        sessionId: string,
        productId: string,
        variationId?: string,
        fetchOptions?: FetchOptions
      ): Promise<RemoveFromWishlistResponse> {
        return fetcher.request<RemoveFromWishlistResponse>(
          "/api/storefront/v1/customer/wishlist",
          {
            method: "DELETE",
            headers: buildSessionHeaders(sessionId),
            body: { productId, variationId },
            ...fetchOptions,
          }
        );
      },
    },
  };
}

/**
 * Type for the customer resource
 */
export type CustomerResource = ReturnType<typeof createCustomerResource>;
