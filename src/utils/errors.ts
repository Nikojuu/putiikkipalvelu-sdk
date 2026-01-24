/**
 * Base error class for all Storefront API errors
 */
export class StorefrontError extends Error {
  public readonly status: number;
  public readonly code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = "StorefrontError";
    this.status = status;
    this.code = code;

    // Maintains proper stack trace in V8 environments
    const ErrorWithCapture = Error as typeof Error & {
      captureStackTrace?: (target: object, constructor: Function) => void;
    };
    if (ErrorWithCapture.captureStackTrace) {
      ErrorWithCapture.captureStackTrace(this, StorefrontError);
    }
  }
}

/**
 * Error thrown when API returns 401 Unauthorized
 */
export class AuthError extends StorefrontError {
  constructor(message: string = "Invalid or missing API key") {
    super(message, 401, "UNAUTHORIZED");
    this.name = "AuthError";
  }
}

/**
 * Error thrown when API returns 429 Too Many Requests
 */
export class RateLimitError extends StorefrontError {
  public readonly retryAfter: number | null;

  constructor(message: string = "Rate limit exceeded", retryAfter: number | null = null) {
    super(message, 429, "RATE_LIMIT_EXCEEDED");
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

/**
 * Error thrown when a requested resource is not found (404)
 */
export class NotFoundError extends StorefrontError {
  constructor(message: string = "Resource not found") {
    super(message, 404, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

/**
 * Error thrown when request validation fails (400)
 */
export class ValidationError extends StorefrontError {
  constructor(message: string = "Validation failed") {
    super(message, 400, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

/**
 * Error thrown when login fails due to unverified email
 * Contains customerId for resending verification email
 */
export class VerificationRequiredError extends StorefrontError {
  public readonly requiresVerification: true = true;
  public readonly customerId: string;

  constructor(message: string, customerId: string) {
    super(message, 403, "VERIFICATION_REQUIRED");
    this.name = "VerificationRequiredError";
    this.customerId = customerId;
  }
}

