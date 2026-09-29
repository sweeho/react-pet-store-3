/**
 * Client-safe mirror of the checkout values in lib/ (design.md C10, D13):
 * ContactInfo, OrderConfirmation, the card types, the address field list and
 * the C4 request field names. The client cannot import from lib/;
 * lib/checkout-mirror.test.ts pins parity with the server modules.
 */
import type { CartLine } from "./cart";

export const CHECKOUT_CARD_TYPES = ["Java Card", "Duke Express", "Meow Card"] as const;

export type CheckoutCardType = (typeof CHECKOUT_CARD_TYPES)[number];

export interface ContactInfo {
  familyName: string;
  givenName: string;
  address1: string;
  address2: string | null;
  city: string;
  stateOrProvince: string;
  postalCode: string;
  country: string;
  telephoneNumber: string;
  email: string;
}

export interface ContactInfoField {
  key: keyof ContactInfo;
  param: string;
  label: string;
  required: boolean;
}

/** Ordered as the checkout form shows them. */
export const CONTACT_INFO_FIELDS: readonly ContactInfoField[] = [
  { key: "familyName", param: "family_name", label: "Family name", required: true },
  { key: "givenName", param: "given_name", label: "Given name", required: true },
  { key: "address1", param: "address_1", label: "Address line 1", required: true },
  { key: "address2", param: "address_2", label: "Address line 2", required: false },
  { key: "city", param: "city", label: "City", required: true },
  {
    key: "stateOrProvince",
    param: "state_or_province",
    label: "State or province",
    required: true,
  },
  { key: "postalCode", param: "postal_code", label: "Postal code", required: true },
  { key: "country", param: "country", label: "Country", required: true },
  { key: "telephoneNumber", param: "telephone_number", label: "Telephone", required: true },
  { key: "email", param: "email", label: "Email", required: true },
];

/** Suffixes of the flat request: billing `_a`, shipping `_b` (C4). */
export const BILLING_SUFFIX = "_a";
export const SHIPPING_SUFFIX = "_b";

/** Card request field names (C4). */
export const CARD_FIELDS = {
  number: "credit_card_number",
  type: "credit_card_type",
  month: "expiration_month",
  year: "expiration_year",
} as const;

export interface PlacedOrder {
  orderId: number;
  orderDate: string;
  email: string;
}

export interface OrderConfirmation extends PlacedOrder {
  billTo: ContactInfo;
  shipTo: ContactInfo;
  card: { cardType: string; last4: string; expiryDate: string };
  lines: CartLine[];
  totalCents: number;
}
