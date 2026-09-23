/**
 * The single JSON shape the profile API returns/accepts (design.md D10,
 * interface contract C14): the enumerations, toCustomerProfile (db rows ->
 * response, masking the stored card number to its last four digits per D9)
 * and parseCustomerProfileInput (an untrusted body -> CustomerProfileInput,
 * or one ValidationError collecting every field problem, keyed by dotted
 * path). src/types/customer-profile.ts mirrors the types/constants for the
 * client (D13); lib/customer-profile.test.ts pins parity between the two.
 */
import type { InferSelectModel } from "drizzle-orm";

import type { Account } from "./accounts";
import { ValidationError } from "./errors";
import { validateEmail, validateRequired } from "./validation";
import type { creditCards, customers } from "../db/schema";

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

export function toCustomerProfile(
  account: Pick<Account, "username">,
  customer: InferSelectModel<typeof customers>,
  card: InferSelectModel<typeof creditCards>,
): CustomerProfile {
  return {
    username: account.username,
    firstName: customer.firstName,
    lastName: customer.lastName,
    email: customer.email,
    telephone: customer.telephone,
    address: {
      street1: customer.street1,
      street2: customer.street2,
      city: customer.city,
      state: customer.state,
      postalCode: customer.postalCode,
      country: customer.country,
    },
    card: {
      // Written only by parseCustomerProfileInput, which already checked
      // cardType against CARD_TYPES (D9: the raw number never leaves here).
      cardType: card.cardType as CardType,
      cardNumberLast4: card.cardNumber.slice(-4),
      expiryMonth: card.expiryMonth,
      expiryYear: card.expiryYear,
    },
    preferences: {
      // Written only by parseCustomerProfileInput, which already checked
      // locale/favoriteCategory against LOCALES/FAVORITE_CATEGORIES.
      locale: customer.locale as Locale,
      favoriteCategory: customer.favoriteCategory as FavoriteCategory | null,
      myListEnabled: customer.myListEnabled,
      petTipsEnabled: customer.petTipsEnabled,
    },
  };
}

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  return typeof value === "object" && value !== null ? (value as UnknownRecord) : {};
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function requireString(
  fieldErrors: Record<string, string>,
  path: string,
  label: string,
  value: unknown,
): string {
  const trimmed = asString(value).trim();
  const error = validateRequired(trimmed, label);
  if (error) {
    fieldErrors[path] = error;
  }
  return trimmed;
}

function parseOptionalString(value: unknown): string | null {
  const trimmed = asString(value).trim();
  return trimmed ? trimmed : null;
}

function requireStringEnum<T extends string>(
  fieldErrors: Record<string, string>,
  path: string,
  label: string,
  value: unknown,
  allowed: readonly T[],
): T | undefined {
  const trimmed = asString(value).trim();
  if (!trimmed) {
    fieldErrors[path] = `${label} is required`;
    return undefined;
  }
  if (!allowed.includes(trimmed as T)) {
    fieldErrors[path] = `${label} must be one of ${allowed.join(", ")}`;
    return undefined;
  }
  return trimmed as T;
}

function parseFavoriteCategory(
  fieldErrors: Record<string, string>,
  value: unknown,
): FavoriteCategory | null {
  const trimmed = asString(value).trim();
  if (!trimmed) {
    return null;
  }
  if (!FAVORITE_CATEGORIES.includes(trimmed as FavoriteCategory)) {
    fieldErrors["preferences.favoriteCategory"] =
      `Favorite category must be one of ${FAVORITE_CATEGORIES.join(", ")}`;
    return null;
  }
  return trimmed as FavoriteCategory;
}

function requireInt(
  fieldErrors: Record<string, string>,
  path: string,
  label: string,
  value: unknown,
  min: number,
  max: number,
): number {
  let raw: number;
  if (typeof value === "number") {
    raw = value;
  } else if (typeof value === "string" && value.trim() !== "") {
    raw = Number(value.trim());
  } else {
    fieldErrors[path] = `${label} is required`;
    return 0;
  }
  if (!Number.isInteger(raw) || raw < min || raw > max) {
    fieldErrors[path] = `${label} must be between ${min} and ${max}`;
    return 0;
  }
  return raw;
}

const CARD_NUMBER_PATTERN = /^\d{12,19}$/;

function parseCardNumber(
  fieldErrors: Record<string, string>,
  value: unknown,
  mode: "create" | "update",
): string {
  const stripped = asString(value).replace(/\s+/g, "");
  if (!stripped) {
    // D9: an empty card number in update mode keeps the card on file.
    if (mode === "update") {
      return "";
    }
    fieldErrors["card.cardNumber"] = "Card number is required";
    return "";
  }
  if (!CARD_NUMBER_PATTERN.test(stripped)) {
    fieldErrors["card.cardNumber"] = "Card number must be 12-19 digits";
    return "";
  }
  return stripped;
}

function asBoolean(value: unknown): boolean {
  return value === true;
}

export function parseCustomerProfileInput(
  body: unknown,
  mode: "create" | "update",
): CustomerProfileInput {
  const fieldErrors: Record<string, string> = {};
  const root = asRecord(body);
  const address = asRecord(root.address);
  const card = asRecord(root.card);
  const preferences = asRecord(root.preferences);

  const firstName = requireString(fieldErrors, "firstName", "First name", root.firstName);
  const lastName = requireString(fieldErrors, "lastName", "Last name", root.lastName);
  const telephone = requireString(fieldErrors, "telephone", "Telephone", root.telephone);

  const emailRaw = asString(root.email).trim();
  const emailError = validateEmail(emailRaw);
  if (emailError) {
    fieldErrors.email = emailError;
  }

  const street1 = requireString(fieldErrors, "address.street1", "Street address", address.street1);
  const street2 = parseOptionalString(address.street2);
  const city = requireString(fieldErrors, "address.city", "City", address.city);
  const state = requireString(fieldErrors, "address.state", "State", address.state);
  const postalCode = requireString(
    fieldErrors,
    "address.postalCode",
    "Postal code",
    address.postalCode,
  );
  const country = requireString(fieldErrors, "address.country", "Country", address.country);

  const cardType =
    requireStringEnum(fieldErrors, "card.cardType", "Card type", card.cardType, CARD_TYPES) ??
    CARD_TYPES[0];
  const cardNumber = parseCardNumber(fieldErrors, card.cardNumber, mode);
  const currentYear = new Date().getFullYear();
  const expiryMonth = requireInt(
    fieldErrors,
    "card.expiryMonth",
    "Expiry month",
    card.expiryMonth,
    1,
    12,
  );
  const expiryYear = requireInt(
    fieldErrors,
    "card.expiryYear",
    "Expiry year",
    card.expiryYear,
    currentYear,
    currentYear + 15,
  );

  const locale =
    requireStringEnum(fieldErrors, "preferences.locale", "Locale", preferences.locale, LOCALES) ??
    LOCALES[0];
  const favoriteCategory = parseFavoriteCategory(fieldErrors, preferences.favoriteCategory);
  const myListEnabled = asBoolean(preferences.myListEnabled);
  const petTipsEnabled = asBoolean(preferences.petTipsEnabled);

  if (Object.keys(fieldErrors).length > 0) {
    throw new ValidationError(fieldErrors);
  }

  return {
    firstName,
    lastName,
    email: emailRaw,
    telephone,
    address: { street1, street2, city, state, postalCode, country },
    card: { cardType, cardNumber, expiryMonth, expiryYear },
    preferences: { locale, favoriteCategory, myListEnabled, petTipsEnabled },
  };
}
