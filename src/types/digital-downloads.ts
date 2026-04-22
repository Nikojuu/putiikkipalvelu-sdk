/**
 * Digital Downloads Types
 *
 * Types for digital product downloads (instructions + downloadable files).
 */

// =============================================================================
// Download items
// =============================================================================

/**
 * A single downloadable file within an order line item.
 * Snapshotted at purchase time — persists even if the merchant deletes the
 * original product or file.
 */
export interface OrderDownload {
  /** Unique download record ID (pass this to getDownloadUrl) */
  id: string;
  /** Merchant-editable file name shown to the customer */
  displayName: string;
  /** File size in bytes */
  sizeBytes: number;
  /** MIME type, e.g. "application/pdf" */
  mimeType: string;
  /** How many times this file has been downloaded on this order */
  downloadCount: number;
  /** Max downloads allowed on this order (null = unlimited) */
  maxDownloads: number | null;
  /** Downloads remaining (null = unlimited) */
  remaining: number | null;
}

/**
 * A line item in an order with digital content and/or downloadable files.
 * Only line items that either have instructions or files are returned by
 * the downloads list endpoint.
 */
export interface OrderDownloadLineItem {
  /** Order line item ID */
  id: string;
  /** Product/variation display name */
  name: string;
  /** Quantity ordered */
  quantity: number;
  /** Sanitized HTML instructions (from merchant's TipTap field). May be null. */
  digitalContent: string | null;
  /** Downloadable files attached to this line item. May be empty. */
  downloads: OrderDownload[];
}

/**
 * Response from GET /order/:id/downloads
 */
export interface OrderDownloadsResponse {
  /** Order ID the downloads belong to */
  orderId: string;
  /** Line items with digital content and/or downloads */
  items: OrderDownloadLineItem[];
}

/**
 * Response from POST /order/:id/downloads/:downloadId
 * Short-lived presigned URL for downloading the file directly from R2.
 */
export interface DownloadUrlResponse {
  /** Presigned download URL (typically valid ~5 minutes) */
  url: string;
  /** How long the URL stays valid, in seconds */
  expiresIn: number;
}

/**
 * Options for calling the downloads endpoints.
 * Authentication is granted via EITHER a token (from order confirmation email)
 * OR a valid customer session (logged-in customer who owns the order).
 */
export interface DownloadsAuthOptions {
  /** Download token from the confirmation email URL. Use this for guest access. */
  token?: string;
  /** Customer session token. Use this for logged-in customer access. */
  sessionId?: string;
}
