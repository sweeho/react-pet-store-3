import type { CreditCard } from "./credit-card";
import type { DbOrTx } from "./transaction";

export type PaymentResult =
  | { approved: true; transactionId: string; authorizationCode: string }
  | { approved: false; reason: string };

export interface PaymentAuthorizer {
  authorize(card: CreditCard, amountCents: number): PaymentResult;
}

export const DECLINE_TEST_CARD = "4000000000000002";

export const noChargeAuthorizer: PaymentAuthorizer = {
  authorize(card, amountCents) {
    void card;
    void amountCents;
    throw new Error("VortexNotImplemented");
  },
};

export function authorizePayment(
  tx: DbOrTx,
  orderId: number,
  card: CreditCard,
  amountCents: number,
  authorizer: PaymentAuthorizer = noChargeAuthorizer,
): void {
  void tx;
  void orderId;
  void card;
  void amountCents;
  void authorizer;
  throw new Error("VortexNotImplemented");
}
