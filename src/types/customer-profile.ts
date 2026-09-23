/**
 * Client-safe mirror of lib/customer-profile.ts (design.md D13, interface
 * contract C14): the two types and three constants the client needs. The
 * client cannot import from lib/ (the tsconfig split); lib/customer-profile
 * .test.ts pins parity between this file and the server module.
 */
export const CARD_TYPES = ["Visa", "MasterCard", "American Express"] as const;
export const LOCALES = ["en_US", "ja_JP", "zh_CN"] as const;
export const FAVORITE_CATEGORIES = ["BIRDS", "CATS", "DOGS", "FISH", "REPTILES"] as const;

export type CardType = (typeof CARD_TYPES)[number];
export type Locale = (typeof LOCALES)[number];
export type FavoriteCategory = (typeof FAVORITE_CATEGORIES)[number];

interface CustomerAddress {
  street1: string;
  street2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface CustomerPreferences {
  locale: Locale;
  favoriteCategory: FavoriteCategory | null;
  myListEnabled: boolean;
  petTipsEnabled: boolean;
}

export interface CustomerProfile {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  telephone: string;
  address: CustomerAddress;
  card: {
    cardType: CardType;
    cardNumberLast4: string;
    expiryMonth: number;
    expiryYear: number;
  };
  preferences: CustomerPreferences;
}

export interface CustomerProfileInput {
  firstName: string;
  lastName: string;
  email: string;
  telephone: string;
  address: CustomerAddress;
  card: {
    cardType: CardType;
    cardNumber: string;
    expiryMonth: number;
    expiryYear: number;
  };
  preferences: CustomerPreferences;
}
