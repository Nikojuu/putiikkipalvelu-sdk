/**
 * Withdrawal Resource
 *
 * Submits consumer withdrawal notices (KKV peruutustoiminto / EU CRD Art. 11a).
 */

import type {
  WithdrawalNoticeParams,
  WithdrawalSubmitResponse,
  WithdrawalResolveTokenResponse,
} from "../types/index.js";
import type { Fetcher } from "../utils/fetch.js";

/**
 * Creates the withdrawal resource.
 */
export function createWithdrawalResource(fetcher: Fetcher) {
  return {
    /**
     * Submit a withdrawal notice (peruutusilmoitus).
     *
     * The notice is a legal record of intent. The server records it regardless
     * of whether the order number can be resolved, and the consumer receives a
     * confirmation email containing what was withdrawn plus exact submission
     * date/time.
     *
     * Refunds are handled separately by the merchant via the dashboard — this
     * endpoint never issues a refund.
     *
     * @param params - Notice payload (name, email, optional orderNumber + items + message)
     * @returns Notice number and creation timestamp
     *
     * @example
     * ```typescript
     * const { noticeNumber } = await client.withdrawal.submit({
     *   name: "Matti Meikäläinen",
     *   email: "matti@example.com",
     *   orderNumber: "1024",
     *   items: [{ productName: "Tuote A", quantity: 1 }],
     *   message: "Haluan peruuttaa.",
     *   confirmRead: true,
     * });
     * ```
     */
    async submit(
      params: WithdrawalNoticeParams
    ): Promise<WithdrawalSubmitResponse> {
      return fetcher.request<WithdrawalSubmitResponse>(
        "/api/storefront/v1/withdrawal",
        {
          method: "POST",
          body: params,
        }
      );
    },

    /**
     * Resolve a withdrawal token (from the order confirmation email link)
     * to the matching order's details. Used to pre-fill the withdrawal form.
     *
     * Throws `StorefrontError` with code `EXPIRED` / `INVALID` / `STORE_MISMATCH`
     * / `ORDER_NOT_FOUND` as appropriate.
     *
     * @param token - The signed token from the `?token=…` query param
     */
    async resolveToken(token: string): Promise<WithdrawalResolveTokenResponse> {
      return fetcher.request<WithdrawalResolveTokenResponse>(
        "/api/storefront/v1/withdrawal/resolve-token",
        {
          method: "GET",
          params: { token },
        }
      );
    },
  };
}

/**
 * Type for the withdrawal resource.
 */
export type WithdrawalResource = ReturnType<typeof createWithdrawalResource>;
