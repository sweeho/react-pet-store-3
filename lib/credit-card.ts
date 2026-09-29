/**
 * The checkout CreditCard value object (design.md C3, D6). It carries what
 * the checkout form submitted; it does not validate (lib/checkout-request.ts
 * does, C6).
 */
export const CHECKOUT_CARD_TYPES = ["Java Card", "Duke Express", "Meow Card"] as const;

export type CheckoutCardType = (typeof CHECKOUT_CARD_TYPES)[number];

export interface CreditCard {
  cardNumber: string;
  cardType: CheckoutCardType;
  expiryDate: string;
}

/** `formatExpiry(3, 2025)` gives `"03/2025"`. */
export function formatExpiry(month: number, year: number): string {
  return `${String(month).padStart(2, "0")}/${year}`;
}

/** Stores the number with spaces removed and the expiry as MM/YYYY. */
export function createCreditCard(
  cardNumber: string,
  cardType: CheckoutCardType,
  month: number,
  year: number,
): CreditCard {
  return {
    cardNumber: cardNumber.replace(/\s+/g, ""),
    cardType,
    expiryDate: formatExpiry(month, year),
  };
}

/** The last four digits, for display in place of the full number. */
export function maskCardNumber(cardNumber: string): string {
  return cardNumber.replace(/\s+/g, "").slice(-4);
}
