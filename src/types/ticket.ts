/**
 * Ticket Types
 *
 * Types for the ticket scanning system.
 * Used by event staff to validate and use tickets at venues.
 */

// =============================================================================
// Ticket Status
// =============================================================================

/**
 * Status of a purchased ticket
 */
export type TicketStatus = "VALID" | "USED" | "EXPIRED" | "CANCELLED";

// =============================================================================
// Ticket Event
// =============================================================================

/**
 * A scannable ticket event returned by GET /tickets/events
 */
export interface TicketEvent {
  /** Unique event ID */
  id: string;
  /** Event name */
  name: string;
  /** Event location */
  location: string;
  /** Event start date (null = ongoing) */
  startDate: string | null;
  /** Event end date */
  endDate: string | null;
}

// =============================================================================
// Purchased Ticket
// =============================================================================

/**
 * A purchased ticket returned by the API
 */
export interface PurchasedTicket {
  /** Unique ticket ID */
  id: string;
  /** Unique ticket code (QR code value) */
  code: string;
  /** Current ticket status */
  status: TicketStatus;
  /** Event ID this ticket belongs to */
  ticketEventId: string | null;
  /** Ticket holder first name (null if requiresHolder was false) */
  firstName: string | null;
  /** Ticket holder last name (null if requiresHolder was false) */
  lastName: string | null;
  /** Customer email */
  customerEmail: string;
  /** Product name (snapshot at purchase) */
  productName: string | null;
  /** Event name (snapshot at purchase) */
  eventName: string | null;
  /** Event date (snapshot at purchase) */
  eventDate: string | null;
  /** Price paid in cents */
  price: number | null;
  /** Number of times the ticket has been used */
  usedCount: number;
  /** Maximum number of uses (0 = unlimited) */
  maxUses: number;
  /** Ticket validity start date */
  validFrom: string;
  /** Ticket validity end date (null = no expiry) */
  validUntil: string | null;
  /** Last time the ticket was used */
  lastUsedAt: string | null;
  /** Ticket creation date */
  createdAt: string;
}

// =============================================================================
// API Responses
// =============================================================================

/**
 * Response from GET /tickets/events
 */
export interface TicketEventsResponse {
  events: TicketEvent[];
}

/**
 * Response from POST /tickets/validate-pin
 */
export interface TicketValidatePinResponse {
  success: boolean;
  event: TicketEvent;
}

/**
 * Response from GET /tickets/{code}
 */
export interface TicketGetResponse {
  success: boolean;
  ticket: PurchasedTicket;
}

/**
 * Response from POST /tickets/use
 */
export interface TicketUseResponse {
  success: boolean;
  message: string;
  ticket: PurchasedTicket;
}
