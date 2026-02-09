import type {
  FetchOptions,
  TicketEventsResponse,
  TicketValidatePinResponse,
  TicketGetResponse,
  TicketUseResponse,
} from "../types/index.js";
import type { Fetcher } from "../utils/fetch.js";

/**
 * Tickets resource for ticket scanning and validation
 */
export function createTicketsResource(fetcher: Fetcher) {
  return {
    /**
     * List scannable events for this store.
     * Returns events that have a scanner PIN configured.
     *
     * @param options - Fetch options
     * @returns List of events
     *
     * @example
     * ```typescript
     * const { events } = await client.tickets.events();
     * events.forEach(e => console.log(e.name, e.location));
     * ```
     */
    async events(options?: FetchOptions): Promise<TicketEventsResponse> {
      return fetcher.request<TicketEventsResponse>(
        "/api/storefront/v1/tickets/events",
        { ...options },
      );
    },

    /**
     * Validate a scanner PIN code for a specific event.
     * Used by event staff to authenticate before scanning tickets.
     *
     * @param eventId - The event to authenticate for
     * @param pin - The scanner PIN code
     * @param options - Fetch options
     * @returns Success response with event info if PIN is valid
     *
     * @example
     * ```typescript
     * const { success, event } = await client.tickets.validatePin('event_123', '1234');
     * if (success) {
     *   console.log(`Authenticated for: ${event.name}`);
     * }
     * ```
     */
    async validatePin(
      eventId: string,
      pin: string,
      options?: FetchOptions,
    ): Promise<TicketValidatePinResponse> {
      return fetcher.request<TicketValidatePinResponse>(
        "/api/storefront/v1/tickets/validate-pin",
        {
          method: "POST",
          body: { eventId, pin },
          ...options,
        },
      );
    },

    /**
     * Get ticket details by code.
     * Read-only lookup — does not modify the ticket.
     *
     * @param code - The unique ticket code
     * @param options - Fetch options
     * @returns Ticket details
     *
     * @example
     * ```typescript
     * const { ticket } = await client.tickets.get('ABC123');
     * console.log(ticket.status, ticket.customerName);
     * ```
     */
    async get(
      code: string,
      options?: FetchOptions,
    ): Promise<TicketGetResponse> {
      return fetcher.request<TicketGetResponse>(
        `/api/storefront/v1/tickets/${encodeURIComponent(code)}`,
        { ...options },
      );
    },

    /**
     * Use (consume) a ticket for a specific event.
     * Increments the usage count and may change status to USED.
     *
     * @param code - The unique ticket code
     * @param eventId - The event ID to scope the usage to
     * @param options - Fetch options
     * @returns Result with success status, message, and updated ticket data
     *
     * @example
     * ```typescript
     * const result = await client.tickets.use('ABC123', 'event_123');
     * if (result.success) {
     *   console.log('Ticket used successfully');
     * } else {
     *   console.log(result.message); // e.g. "Lippu kuuluu toiseen tapahtumaan"
     * }
     * ```
     */
    async use(
      code: string,
      eventId: string,
      options?: FetchOptions,
    ): Promise<TicketUseResponse> {
      return fetcher.request<TicketUseResponse>(
        "/api/storefront/v1/tickets/use",
        {
          method: "POST",
          body: { code, eventId },
          ...options,
        },
      );
    },
  };
}

/**
 * Type for the tickets resource
 */
export type TicketsResource = ReturnType<typeof createTicketsResource>;
