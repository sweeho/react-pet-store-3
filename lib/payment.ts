/**
 * Payment as a seam that never charges (design.md D2, C4, order-processing-
 * and-fulfilment). A PaymentAuthorizer decides; the default, noChargeAuthorizer,
 * moves no money and contacts nothing (PRD non-goal). authorizePayment records
 * the approval and advances the order to PAID, or throws PaymentDeclinedError
 * without writing anything.
 */
import { randomUUID } from "node:crypto";

import { paymentAuthorizations } from "../db/schema";
import type { CreditCard } from "./credit-card";
import { PaymentDeclinedError } from "./errors";
import type { DbOrTx } from "./transaction";
import { setWorkflowStage } from "./workflow-stage";

export type PaymentResult =
  | { approved: true; transactionId: string; authorizationCode: string }
  | { approved: false; reason: string };

export interface PaymentAuthorizer {
  authorize(card: CreditCard, amountCents: number): PaymentResult;
}

/** The one documented card number the default authorizer always declines. */
export const DECLINE_TEST_CARD = "4000000000000002";

const NO_CHARGE_PROCESSOR = "no-charge";

export const noChargeAuthorizer: PaymentAuthorizer = {
  authorize(card) {
    if (card.cardNumber.replace(/\s+/g, "") === DECLINE_TEST_CARD) {
      return { approved: false, reason: "Test card declined" };
    }
    return {
      approved: true,
      transactionId: `NOCHARGE-${randomUUID()}`,
      authorizationCode: randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase(),
    };
  },
};

export function authorizePayment(
  tx: DbOrTx,
  orderId: number,
  card: CreditCard,
  amountCents: number,
  authorizer: PaymentAuthorizer = noChargeAuthorizer,
): void {
  const result = authorizer.authorize(card, amountCents);
  if (!result.approved) {
    throw new PaymentDeclinedError();
  }
  tx.insert(paymentAuthorizations)
    .values({
      orderId,
      processor: NO_CHARGE_PROCESSOR,
      transactionId: result.transactionId,
      authorizationCode: result.authorizationCode,
      amountCents,
      authorizedAt: new Date(),
    })
    .run();
  setWorkflowStage(tx, orderId, "PAID");
}
