export const CHECKOUT_CARD_TYPES = ["Java Card", "Duke Express", "Meow Card"] as const;

export type CheckoutCardType = (typeof CHECKOUT_CARD_TYPES)[number];

export interface CreditCard {
  cardNumber: string;
  cardType: CheckoutCardType;
  expiryDate: string;
}

export function formatExpiry(month: number, year: number): string {
  void month;
  void year;
  throw new Error("VortexNotImplemented");
}

export function createCreditCard(
  cardNumber: string,
  cardType: CheckoutCardType,
  month: number,
  year: number,
): CreditCard {
  void cardNumber;
  void cardType;
  void month;
  void year;
  throw new Error("VortexNotImplemented");
}

export function maskCardNumber(cardNumber: string): string {
  void cardNumber;
  throw new Error("VortexNotImplemented");
}
