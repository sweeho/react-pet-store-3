/**
 * Checkout request parsing (design.md C4, C6, D2). Every problem found is
 * recorded on a FieldErrorCollector, keyed by request param, rather than
 * thrown, so the whole form can be reported at once.
 */
import type { CreditCard } from "./credit-card";
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

export function extractCreditCard(): CreditCard | null {
  throw new Error("VortexNotImplemented");
}
