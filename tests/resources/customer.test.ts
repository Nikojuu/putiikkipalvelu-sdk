import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createStorefrontClient } from "../../src/client.js";
import { AuthError, ValidationError, NotFoundError } from "../../src/utils/errors.js";

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

// Mock customer data
const mockCustomer = {
  id: "cust_123",
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
};

// Customer returned from register (no longer includes verification token - sent server-side)
const mockCustomerFromRegister = {
  ...mockCustomer,
  createdAt: "2024-01-15T10:00:00.000Z",
};

// @deprecated - kept for backwards compatibility with old tests
const mockCustomerWithVerification = {
  ...mockCustomer,
  createdAt: "2024-01-15T10:00:00.000Z",
};

const mockCustomerWithEmailStatus = {
  ...mockCustomer,
  emailVerified: "2024-01-15T12:00:00.000Z",
  createdAt: "2024-01-15T10:00:00.000Z",
};

describe("customer resource", () => {
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

  describe("register", () => {
    it("should register a new customer", async () => {
      // API now sends verification email server-side - no token in response
      const mockResponse = {
        success: true,
        customer: mockCustomerFromRegister,
        message: "Account created. Please check your email to verify.",
      };
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => mockResponse,
        })
      );

      const result = await client.customer.register({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        password: "securePassword123",
      });

      expect(result.success).toBe(true);
      expect(result.customer.email).toBe("john@example.com");
      expect(result.customer.createdAt).toBe("2024-01-15T10:00:00.000Z");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/customer/(auth)/register"),
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("john@example.com"),
        })
      );
    });

    it("should throw ValidationError when email already registered", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          ok: false,
          status: 400,
          json: async () => ({ error: "Email already registered in this store" }),
        })
      );

      await expect(
        client.customer.register({
          firstName: "John",
          lastName: "Doe",
          email: "existing@example.com",
          password: "password123",
        })
      ).rejects.toThrow(ValidationError);
    });

    it("should include all registration fields in request body", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => ({
            success: true,
            customer: mockCustomerFromRegister,
            message: "Account created.",
          }),
        })
      );

      await client.customer.register({
        firstName: "Jane",
        lastName: "Smith",
        email: "jane@example.com",
        password: "password456",
      });

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody).toEqual({
        firstName: "Jane",
        lastName: "Smith",
        email: "jane@example.com",
        password: "password456",
      });
    });
  });

  describe("login", () => {
    it("should login and return session ID", async () => {
      const mockResponse = {
        success: true,
        customer: mockCustomerWithEmailStatus,
        message: "Login successful",
        sessionId: "session_xyz789",
        expiresAt: "2024-01-22T10:00:00.000Z",
      };
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => mockResponse,
        })
      );

      const result = await client.customer.login(
        "john@example.com",
        "securePassword123"
      );

      expect(result.success).toBe(true);
      expect(result.sessionId).toBe("session_xyz789");
      expect(result.customer.email).toBe("john@example.com");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/customer/(auth)/login"),
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("john@example.com"),
        })
      );
    });

    it("should pass cartId header for cart merging", async () => {
      const mockResponse = {
        success: true,
        customer: mockCustomerWithEmailStatus,
        message: "Login successful",
        sessionId: "session_xyz789",
        expiresAt: "2024-01-22T10:00:00.000Z",
      };
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => mockResponse,
        })
      );

      await client.customer.login(
        "john@example.com",
        "password123",
        { cartId: "guest_cart_abc" }
      );

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            "x-cart-id": "guest_cart_abc",
          }),
        })
      );
    });

    it("should throw AuthError for invalid credentials", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          ok: false,
          status: 401,
          json: async () => ({ error: "Invalid email or password" }),
        })
      );

      await expect(
        client.customer.login("john@example.com", "wrongpassword")
      ).rejects.toThrow(AuthError);
    });

    it("should handle unverified email response", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          ok: false,
          status: 400,
          json: async () => ({
            error: "Email not verified",
            requiresVerification: true,
            customerId: "cust_123",
          }),
        })
      );

      await expect(
        client.customer.login("john@example.com", "password123")
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("logout", () => {
    it("should logout and return cart ID if applicable", async () => {
      const mockResponse = {
        success: true,
        message: "Logout successful",
        cartId: "new_guest_cart_def",
      };
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => mockResponse,
        })
      );

      const result = await client.customer.logout("session_xyz789");

      expect(result.success).toBe(true);
      expect(result.cartId).toBe("new_guest_cart_def");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/customer/(auth)/logout"),
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "x-session-id": "session_xyz789",
          }),
        })
      );
    });

    it("should logout without cart ID if no cart items", async () => {
      const mockResponse = {
        success: true,
        message: "Logout successful",
      };
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => mockResponse,
        })
      );

      const result = await client.customer.logout("session_xyz789");

      expect(result.success).toBe(true);
      expect(result.cartId).toBeUndefined();
    });

    it("should throw AuthError for invalid session", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          ok: false,
          status: 401,
          json: async () => ({ error: "No active session found" }),
        })
      );

      await expect(
        client.customer.logout("invalid_session")
      ).rejects.toThrow(AuthError);
    });
  });

  describe("getUser", () => {
    it("should return current user data", async () => {
      const mockResponse = {
        success: true,
        customer: mockCustomer,
      };
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => mockResponse,
        })
      );

      const result = await client.customer.getUser("session_xyz789");

      expect(result.success).toBe(true);
      expect(result.customer).toEqual(mockCustomer);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/customer/(auth)/get-user"),
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            "x-session-id": "session_xyz789",
          }),
        })
      );
    });

    it("should throw AuthError for expired session", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          ok: false,
          status: 401,
          json: async () => ({ error: "Unauthorized: Invalid or expired session" }),
        })
      );

      await expect(
        client.customer.getUser("expired_session")
      ).rejects.toThrow(AuthError);
    });

    it("should throw AuthError for missing session", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          ok: false,
          status: 401,
          json: async () => ({ error: "Unauthorized: Missing session ID" }),
        })
      );

      await expect(
        client.customer.getUser("")
      ).rejects.toThrow(AuthError);
    });
  });

  describe("verifyEmail", () => {
    it("should verify email with valid token", async () => {
      const mockResponse = {
        success: true,
        message: "Email verified successfully. You can now log in.",
      };
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => mockResponse,
        })
      );

      const result = await client.customer.verifyEmail("valid_token_abc123");

      expect(result.success).toBe(true);
      expect(result.message).toContain("verified successfully");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/customer/(auth)/verify-email"),
        expect.objectContaining({
          method: "GET",
        })
      );
      // Check token is in query params
      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain("token=valid_token_abc123");
    });

    it("should throw ValidationError for invalid token", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          ok: false,
          status: 400,
          json: async () => ({ error: "Invalid or expired verification token" }),
        })
      );

      await expect(
        client.customer.verifyEmail("invalid_token")
      ).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError for expired token", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          ok: false,
          status: 400,
          json: async () => ({ error: "Invalid or expired verification token" }),
        })
      );

      await expect(
        client.customer.verifyEmail("expired_token")
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("resendVerification", () => {
    it("should resend verification email", async () => {
      // API now sends email server-side and only returns success message
      const mockResponse = {
        success: true,
        message: "Verification email sent.",
      };
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => mockResponse,
        })
      );

      const result = await client.customer.resendVerification("cust_123");

      expect(result.success).toBe(true);
      expect(result.message).toBe("Verification email sent.");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/customer/(auth)/resend-verification"),
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("cust_123"),
        })
      );
    });

    it("should throw ValidationError for already verified customer", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          ok: false,
          status: 400,
          json: async () => ({ error: "Customer not found or already verified" }),
        })
      );

      await expect(
        client.customer.resendVerification("cust_already_verified")
      ).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError for non-existent customer", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          ok: false,
          status: 400,
          json: async () => ({ error: "Customer not found or already verified" }),
        })
      );

      await expect(
        client.customer.resendVerification("nonexistent_customer")
      ).rejects.toThrow(ValidationError);
    });

    it("should include customerId in request body", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => ({
            success: true,
            message: "Verification email sent.",
          }),
        })
      );

      await client.customer.resendVerification("cust_456");

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody).toEqual({ customerId: "cust_456" });
    });
  });

  // ===========================================================================
  // Password Reset Tests
  // ===========================================================================

  describe("forgotPassword", () => {
    it("should request password reset and return generic success message", async () => {
      // API always returns same response regardless of whether email exists
      // This prevents email enumeration attacks
      const mockResponse = {
        success: true,
        message:
          "If an account exists with that email, password reset instructions have been sent.",
      };
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => mockResponse,
        })
      );

      const result = await client.customer.forgotPassword("john@example.com");

      expect(result.success).toBe(true);
      expect(result.message).toBe(
        "If an account exists with that email, password reset instructions have been sent."
      );
      // Token is never exposed in response - email is sent server-side
      expect("passwordResetToken" in result).toBe(false);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/customer/(auth)/forgot-password"),
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("john@example.com"),
        })
      );
    });

    it("should return same success response for non-existent email (prevents enumeration)", async () => {
      // Same response for non-existent emails to prevent enumeration
      const mockResponse = {
        success: true,
        message:
          "If an account exists with that email, password reset instructions have been sent.",
      };
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => mockResponse,
        })
      );

      const result = await client.customer.forgotPassword(
        "nonexistent@example.com"
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe(
        "If an account exists with that email, password reset instructions have been sent."
      );
    });

    it("should throw ValidationError for invalid email format", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          ok: false,
          status: 400,
          json: async () => ({
            error: "Validation error",
            details: { email: { _errors: ["Invalid email format"] } },
          }),
        })
      );

      await expect(
        client.customer.forgotPassword("invalid-email")
      ).rejects.toThrow(ValidationError);
    });

    it("should include email in request body", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => ({
            success: true,
            message: "Password reset instructions sent to email",
          }),
        })
      );

      await client.customer.forgotPassword("test@example.com");

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody).toEqual({ email: "test@example.com" });
    });
  });

  describe("resetPassword", () => {
    it("should reset password with valid token", async () => {
      const mockResponse = {
        success: true,
        message: "Password reset successful. You can now log in with your new password.",
      };
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => mockResponse,
        })
      );

      const result = await client.customer.resetPassword(
        "valid_reset_token_123",
        "newSecurePassword123"
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain("Password reset successful");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/customer/(auth)/reset-password"),
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("valid_reset_token_123"),
        })
      );
    });

    it("should throw ValidationError for invalid or expired token", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          ok: false,
          status: 400,
          json: async () => ({ error: "Invalid or expired reset token" }),
        })
      );

      await expect(
        client.customer.resetPassword("expired_token", "newPassword123")
      ).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError for short password", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          ok: false,
          status: 400,
          json: async () => ({
            error: "Validation error",
            details: { password: { _errors: ["Password must be at least 8 characters"] } },
          }),
        })
      );

      await expect(
        client.customer.resetPassword("valid_token", "short")
      ).rejects.toThrow(ValidationError);
    });

    it("should include token and password in request body", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => ({
            success: true,
            message: "Password reset successful.",
          }),
        })
      );

      await client.customer.resetPassword("token_xyz", "newPassword123");

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody).toEqual({
        token: "token_xyz",
        password: "newPassword123",
      });
    });
  });

  // ===========================================================================
  // Profile Management Tests
  // ===========================================================================

  describe("updateProfile", () => {
    it("should update customer profile", async () => {
      const mockResponse = {
        message: "Customer updated successfully",
        customer: {
          ...mockCustomer,
          firstName: "Jane",
          createdAt: "2024-01-15T10:00:00.000Z",
        },
      };
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => mockResponse,
        })
      );

      const result = await client.customer.updateProfile("session_xyz", {
        firstName: "Jane",
        lastName: "Doe",
        email: "john@example.com",
      });

      expect(result.message).toBe("Customer updated successfully");
      expect(result.customer.firstName).toBe("Jane");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/customer/edit-user"),
        expect.objectContaining({
          method: "PATCH",
          headers: expect.objectContaining({
            "x-session-id": "session_xyz",
          }),
          body: expect.stringContaining("Jane"),
        })
      );
    });

    it("should throw ValidationError when email is taken", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          ok: false,
          status: 400,
          json: async () => ({ error: "Email is already taken by another customer" }),
        })
      );

      await expect(
        client.customer.updateProfile("session_xyz", {
          email: "taken@example.com",
        })
      ).rejects.toThrow(ValidationError);
    });

    it("should throw AuthError for invalid session", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          ok: false,
          status: 401,
          json: async () => ({ error: "Invalid session" }),
        })
      );

      await expect(
        client.customer.updateProfile("invalid_session", {
          firstName: "Test",
        })
      ).rejects.toThrow(AuthError);
    });
  });

  describe("deleteAccount", () => {
    it("should delete customer account", async () => {
      const mockResponse = {
        message: "Customer deleted successfully",
      };
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => mockResponse,
        })
      );

      const result = await client.customer.deleteAccount("session_xyz");

      expect(result.message).toBe("Customer deleted successfully");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/customer/delete-user"),
        expect.objectContaining({
          method: "DELETE",
          headers: expect.objectContaining({
            "x-session-id": "session_xyz",
          }),
        })
      );
    });

    it("should throw AuthError for invalid session", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          ok: false,
          status: 401,
          json: async () => ({ error: "No session token provided" }),
        })
      );

      await expect(
        client.customer.deleteAccount("invalid_session")
      ).rejects.toThrow(AuthError);
    });
  });

  describe("getOrders", () => {
    const mockOrder = {
      id: "order_123",
      orderNumber: "ORD-2024-001",
      totalAmount: 5999,
      status: "DELIVERED",
      createdAt: "2024-01-15T10:00:00.000Z",
      OrderLineItems: [
        {
          id: "line_1",
          itemType: "PRODUCT",
          quantity: 2,
          price: 1999,
          totalAmount: 3998,
          productCode: "prod_123",
          name: "Test Product",
          vatRate: 24,
          product: {
            id: "prod_123",
            name: "Test Product",
            images: ["https://example.com/image.jpg"],
            slug: "test-product",
          },
        },
      ],
      orderShipmentMethod: {
        name: "Standard Shipping",
        price: 599,
        vatRate: 24,
        logo: null,
      },
    };

    it("should get customer orders", async () => {
      const mockResponse = {
        success: true,
        orders: [mockOrder],
      };
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => mockResponse,
        })
      );

      const result = await client.customer.getOrders("session_xyz", "cust_123");

      expect(result.success).toBe(true);
      expect(result.orders).toHaveLength(1);
      expect(result.orders[0].orderNumber).toBe("ORD-2024-001");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/customer/get-orders/cust_123"),
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            "x-session-id": "session_xyz",
          }),
        })
      );
    });

    it("should return empty orders array for new customer", async () => {
      const mockResponse = {
        success: true,
        orders: [],
      };
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => mockResponse,
        })
      );

      const result = await client.customer.getOrders("session_xyz", "new_cust");

      expect(result.success).toBe(true);
      expect(result.orders).toHaveLength(0);
    });

    it("should include order line items with product info", async () => {
      const mockResponse = {
        success: true,
        orders: [mockOrder],
      };
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => mockResponse,
        })
      );

      const result = await client.customer.getOrders("session_xyz", "cust_123");

      const lineItem = result.orders[0].OrderLineItems[0];
      expect(lineItem.itemType).toBe("PRODUCT");
      expect(lineItem.product.name).toBe("Test Product");
      expect(lineItem.product.slug).toBe("test-product");
    });

    it("should include shipment method details", async () => {
      const mockResponse = {
        success: true,
        orders: [mockOrder],
      };
      mockFetch.mockResolvedValueOnce(
        createMockResponse({
          json: async () => mockResponse,
        })
      );

      const result = await client.customer.getOrders("session_xyz", "cust_123");

      const shipment = result.orders[0].orderShipmentMethod;
      expect(shipment?.name).toBe("Standard Shipping");
      expect(shipment?.price).toBe(599);
    });
  });

  // ===========================================================================
  // Wishlist Tests
  // ===========================================================================

  describe("wishlist", () => {
    const mockWishlistItem = {
      id: "wish_123",
      customerId: "cust_123",
      productId: "prod_123",
      variationId: null,
      createdAt: "2024-01-15T10:00:00.000Z",
      product: {
        id: "prod_123",
        name: "Test Product",
        slug: "test-product",
        description: "A test product",
        images: ["https://example.com/image.jpg"],
        price: 1999,
        salePrice: null,
        salePercent: null,
        saleStartDate: null,
        saleEndDate: null,
        quantity: 10,
        sku: "TEST-001",
        status: "ACTIVE",
      },
      variation: null,
    };

    const mockWishlistItemWithVariation = {
      ...mockWishlistItem,
      id: "wish_456",
      variationId: "var_123",
      variation: {
        id: "var_123",
        sku: "TEST-001-L",
        price: 2499,
        salePrice: null,
        quantity: 5,
        images: [],
        options: [
          {
            id: "opt_1",
            value: "Large",
            optionType: {
              id: "type_1",
              name: "Size",
            },
          },
        ],
      },
    };

    describe("get", () => {
      it("should get wishlist items", async () => {
        const mockResponse = {
          items: [mockWishlistItem, mockWishlistItemWithVariation],
        };
        mockFetch.mockResolvedValueOnce(
          createMockResponse({
            json: async () => mockResponse,
          })
        );

        const result = await client.customer.wishlist.get("session_xyz");

        expect(result.items).toHaveLength(2);
        expect(result.items[0].product.name).toBe("Test Product");
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("/customer/wishlist"),
          expect.objectContaining({
            method: "GET",
            headers: expect.objectContaining({
              "x-session-id": "session_xyz",
            }),
          })
        );
      });

      it("should return empty wishlist for new customer", async () => {
        const mockResponse = { items: [] };
        mockFetch.mockResolvedValueOnce(
          createMockResponse({
            json: async () => mockResponse,
          })
        );

        const result = await client.customer.wishlist.get("session_xyz");

        expect(result.items).toHaveLength(0);
      });

      it("should include variation details when present", async () => {
        const mockResponse = {
          items: [mockWishlistItemWithVariation],
        };
        mockFetch.mockResolvedValueOnce(
          createMockResponse({
            json: async () => mockResponse,
          })
        );

        const result = await client.customer.wishlist.get("session_xyz");

        const item = result.items[0];
        expect(item.variation).not.toBeNull();
        expect(item.variation?.options[0].value).toBe("Large");
        expect(item.variation?.options[0].optionType.name).toBe("Size");
      });

      it("should throw AuthError for invalid session", async () => {
        mockFetch.mockResolvedValueOnce(
          createMockResponse({
            ok: false,
            status: 401,
            json: async () => ({ error: "Invalid session" }),
          })
        );

        await expect(
          client.customer.wishlist.get("invalid_session")
        ).rejects.toThrow(AuthError);
      });
    });

    describe("add", () => {
      it("should add product to wishlist", async () => {
        const mockResponse = { message: "Product added to wishlist" };
        mockFetch.mockResolvedValueOnce(
          createMockResponse({
            json: async () => mockResponse,
          })
        );

        const result = await client.customer.wishlist.add("session_xyz", "prod_123");

        expect(result.message).toBe("Product added to wishlist");
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("/customer/wishlist"),
          expect.objectContaining({
            method: "POST",
            headers: expect.objectContaining({
              "x-session-id": "session_xyz",
            }),
            body: expect.stringContaining("prod_123"),
          })
        );
      });

      it("should add product with variation to wishlist", async () => {
        const mockResponse = { message: "Product added to wishlist" };
        mockFetch.mockResolvedValueOnce(
          createMockResponse({
            json: async () => mockResponse,
          })
        );

        await client.customer.wishlist.add("session_xyz", "prod_123", "var_456");

        const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(callBody).toEqual({
          productId: "prod_123",
          variationId: "var_456",
        });
      });

      it("should throw ValidationError when product already in wishlist", async () => {
        mockFetch.mockResolvedValueOnce(
          createMockResponse({
            ok: false,
            status: 400,
            json: async () => ({ error: "Product already in wishlist" }),
          })
        );

        await expect(
          client.customer.wishlist.add("session_xyz", "prod_123")
        ).rejects.toThrow(ValidationError);
      });

      it("should throw AuthError for invalid session", async () => {
        mockFetch.mockResolvedValueOnce(
          createMockResponse({
            ok: false,
            status: 401,
            json: async () => ({ error: "No session token provided" }),
          })
        );

        await expect(
          client.customer.wishlist.add("invalid_session", "prod_123")
        ).rejects.toThrow(AuthError);
      });
    });

    describe("remove", () => {
      it("should remove product from wishlist", async () => {
        const mockResponse = { message: "Item removed from wishlist" };
        mockFetch.mockResolvedValueOnce(
          createMockResponse({
            json: async () => mockResponse,
          })
        );

        const result = await client.customer.wishlist.remove("session_xyz", "prod_123");

        expect(result.message).toBe("Item removed from wishlist");
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining("/customer/wishlist"),
          expect.objectContaining({
            method: "DELETE",
            headers: expect.objectContaining({
              "x-session-id": "session_xyz",
            }),
            body: expect.stringContaining("prod_123"),
          })
        );
      });

      it("should remove product with variation from wishlist", async () => {
        const mockResponse = { message: "Item removed from wishlist" };
        mockFetch.mockResolvedValueOnce(
          createMockResponse({
            json: async () => mockResponse,
          })
        );

        await client.customer.wishlist.remove("session_xyz", "prod_123", "var_456");

        const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(callBody).toEqual({
          productId: "prod_123",
          variationId: "var_456",
        });
      });

      it("should throw NotFoundError when item not in wishlist", async () => {
        mockFetch.mockResolvedValueOnce(
          createMockResponse({
            ok: false,
            status: 404,
            json: async () => ({ error: "Item not found in wishlist" }),
          })
        );

        await expect(
          client.customer.wishlist.remove("session_xyz", "nonexistent_prod")
        ).rejects.toThrow(NotFoundError);
      });

      it("should throw AuthError for invalid session", async () => {
        mockFetch.mockResolvedValueOnce(
          createMockResponse({
            ok: false,
            status: 401,
            json: async () => ({ error: "Invalid session" }),
          })
        );

        await expect(
          client.customer.wishlist.remove("invalid_session", "prod_123")
        ).rejects.toThrow(AuthError);
      });
    });
  });

  describe("fetch options passthrough", () => {
    it("should pass cache options to register", async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({
          json: async () => ({
            success: true,
            customer: mockCustomerFromRegister,
            message: "Account created.",
          }),
        })
      );

      await client.customer.register(
        {
          firstName: "Test",
          lastName: "User",
          email: "test@example.com",
          password: "password123",
        },
        { cache: "no-store" }
      );

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          cache: "no-store",
        })
      );
    });

    it("should pass Next.js specific options to getUser", async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({
          json: async () => ({
            success: true,
            customer: mockCustomer,
          }),
        })
      );

      await client.customer.getUser("session_xyz", {
        next: { revalidate: 0, tags: ["user"] },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          next: { revalidate: 0, tags: ["user"] },
        })
      );
    });

    it("should pass additional headers to login", async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({
          json: async () => ({
            success: true,
            customer: mockCustomerWithEmailStatus,
            message: "Login successful",
            sessionId: "session_123",
            expiresAt: "2024-01-22T10:00:00.000Z",
          }),
        })
      );

      await client.customer.login(
        "test@example.com",
        "password",
        undefined,
        { headers: { "X-Custom-Header": "custom-value" } }
      );

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            "X-Custom-Header": "custom-value",
          }),
        })
      );
    });
  });
});
