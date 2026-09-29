/**
 * Checkout request parsing (design.md C4, C6, D2). Every problem found is
 * recorded on a FieldErrorCollector, keyed by request param, rather than
 * thrown, so the whole form can be reported at once.
 */
import { CHECKOUT_CARD_TYPES, createCreditCard, type CreditCard } from "./credit-card";
import { CONTACT_INFO_FIELDS, type ContactInfo } from "./contact-info";
import { validateEmail } from "./validation";

export class FieldErrorCollector {
  readonly fieldErrors: Record<string, string> = {};
  readonly missingFields: string[] = [];

  missing(param: string, message: string): void {
    this.fieldErrors[param] = message;
    this.missingFields.push(param);
  }

  invalid(param: string, message: string): void {
    this.fieldErrors[param] = message;
  }
}

/**
 * Reads one address from the flat request. Values are trimmed; an empty or
 * whitespace-only required value is missing; a blank address line 2 is null.
 * Returns null when anything was recorded.
 */
export function extractContactInfo(
  fields: Record<string, unknown>,
  suffix: "_a" | "_b",
  errors: FieldErrorCollector,
): ContactInfo | null {
  const values: Record<string, string | null> = {};
  let ok = true;

  for (const field of CONTACT_INFO_FIELDS) {
    const param = `${field.param}${suffix}`;
    const raw = fields[param];
    const text = typeof raw === "string" ? raw : "";
    const trimmed = text.trim();

    if (trimmed === "") {
      if (!field.required) {
        values[field.key] = null;
        continue;
      }
      const noun = field.label.toLowerCase();
      errors.missing(param, text === "" ? `Enter a ${noun}.` : `Spaces only — enter a ${noun}.`);
      ok = false;
      continue;
    }

    if (field.key === "email" && validateEmail(trimmed) !== undefined) {
      errors.invalid(param, "Enter a valid email address.");
      ok = false;
      continue;
    }
    values[field.key] = trimmed;
  }

  // ok is true only when every required field passed, so each string key is set.
  return ok ? (values as unknown as ContactInfo) : null;
}

const CARD_NUMBER_PATTERN = /^\d{12,19}$/;
const MONTH_PATTERN = /^\d{1,2}$/;
const YEAR_PATTERN = /^\d{4}$/;
const CARD_YEARS_AHEAD = 5;

function textOf(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Reads the card from the flat request (design.md C4, C6, D6). The number is
 * 12-19 digits once spaces are removed, the type one of CHECKOUT_CARD_TYPES,
 * the month 01-12 and the year from this year to five ahead. Returns null
 * when anything was recorded.
 */
export function extractCreditCard(
  fields: Record<string, unknown>,
  errors: FieldErrorCollector,
): CreditCard | null {
  let ok = true;

  const rawNumber = textOf(fields.credit_card_number);
  const number = rawNumber.replace(/\s+/g, "");
  if (rawNumber === "") {
    errors.missing("credit_card_number", "Enter a card number.");
    ok = false;
  } else if (!CARD_NUMBER_PATTERN.test(number)) {
    errors.invalid("credit_card_number", "Enter a card number of 12 to 19 digits.");
    ok = false;
  }

  const type = textOf(fields.credit_card_type);
  const cardType = CHECKOUT_CARD_TYPES.find((t) => t === type);
  if (type === "") {
    errors.missing("credit_card_type", "Choose a card type.");
    ok = false;
  } else if (cardType === undefined) {
    errors.invalid("credit_card_type", "Choose Java Card, Duke Express or Meow Card.");
    ok = false;
  }

  const rawMonth = textOf(fields.expiration_month);
  const month = Number(rawMonth);
  if (rawMonth === "") {
    errors.missing("expiration_month", "Choose an expiry month.");
    ok = false;
  } else if (!MONTH_PATTERN.test(rawMonth) || month < 1 || month > 12) {
    errors.invalid("expiration_month", "Choose a month from 01 to 12.");
    ok = false;
  }

  const rawYear = textOf(fields.expiration_year);
  const year = Number(rawYear);
  const thisYear = new Date().getFullYear();
  if (rawYear === "") {
    errors.missing("expiration_year", "Choose an expiry year.");
    ok = false;
  } else if (!YEAR_PATTERN.test(rawYear) || year < thisYear || year > thisYear + CARD_YEARS_AHEAD) {
    errors.invalid(
      "expiration_year",
      `Choose a year from ${thisYear} to ${thisYear + CARD_YEARS_AHEAD}.`,
    );
    ok = false;
  }

  return ok && cardType !== undefined ? createCreditCard(number, cardType, month, year) : null;
}
