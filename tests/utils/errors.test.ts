import { describe, it, expect } from "vitest";
import {
  StorefrontError,
  AuthError,
  RateLimitError,
  NotFoundError,
  ValidationError,
} from "../../src/utils/errors.js";

describe("StorefrontError", () => {
  it("should have correct properties", () => {
    const error = new StorefrontError("Something went wrong", 500, "SERVER_ERROR");

    expect(error.message).toBe("Something went wrong");
    expect(error.status).toBe(500);
    expect(error.code).toBe("SERVER_ERROR");
    expect(error.name).toBe("StorefrontError");
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(StorefrontError);
  });

  it("should have a stack trace", () => {
    const error = new StorefrontError("Test error", 500, "TEST");
    expect(error.stack).toBeDefined();
  });
});

describe("AuthError", () => {
  it("should default to 401 status", () => {
    const error = new AuthError();

    expect(error.status).toBe(401);
    expect(error.code).toBe("UNAUTHORIZED");
    expect(error.name).toBe("AuthError");
    expect(error.message).toBe("Invalid or missing API key");
  });

  it("should accept custom message", () => {
    const error = new AuthError("Custom auth error");

    expect(error.message).toBe("Custom auth error");
    expect(error.status).toBe(401);
  });

  it("should be instance of StorefrontError", () => {
    const error = new AuthError();
    expect(error).toBeInstanceOf(StorefrontError);
  });
});

describe("RateLimitError", () => {
  it("should default to 429 status", () => {
    const error = new RateLimitError();

    expect(error.status).toBe(429);
    expect(error.code).toBe("RATE_LIMIT_EXCEEDED");
    expect(error.name).toBe("RateLimitError");
    expect(error.retryAfter).toBeNull();
  });

  it("should include retryAfter when provided", () => {
    const error = new RateLimitError("Too many requests", 60);

    expect(error.message).toBe("Too many requests");
    expect(error.retryAfter).toBe(60);
  });

  it("should be instance of StorefrontError", () => {
    const error = new RateLimitError();
    expect(error).toBeInstanceOf(StorefrontError);
  });
});

describe("NotFoundError", () => {
  it("should default to 404 status", () => {
    const error = new NotFoundError();

    expect(error.status).toBe(404);
    expect(error.code).toBe("NOT_FOUND");
    expect(error.name).toBe("NotFoundError");
    expect(error.message).toBe("Resource not found");
  });

  it("should accept custom message", () => {
    const error = new NotFoundError("Product not found");
    expect(error.message).toBe("Product not found");
  });
});

describe("ValidationError", () => {
  it("should default to 400 status", () => {
    const error = new ValidationError();

    expect(error.status).toBe(400);
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.name).toBe("ValidationError");
    expect(error.message).toBe("Validation failed");
  });

  it("should accept custom message", () => {
    const error = new ValidationError("Email is invalid");
    expect(error.message).toBe("Email is invalid");
  });
});
