import { describe, expect, it } from "vitest";

import {
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
  validateRequired,
  validateUsername,
} from "./validation";
import {
  EMAIL_CASES,
  PASSWORD_CASES,
  PASSWORD_CONFIRMATION_CASES,
  REQUIRED_CASES,
  USERNAME_CASES,
} from "./validation.cases";

/**
 * UNIT TEST (server project)
 *
 * Runs the shared case table (lib/validation.cases.ts, no imports so both
 * tsconfigs can type-check it) against the server-side validators. The same
 * table drives src/utils/form-validation.test.ts, pinning that both sides
 * return the same verdict for every case (design.md C3).
 */
describe("validateUsername", () => {
  it.each(USERNAME_CASES)("$value -> valid=$valid", ({ value, valid }) => {
    expect(validateUsername(value) === undefined).toBe(valid);
  });
});

describe("validatePassword", () => {
  it.each(PASSWORD_CASES)("$value -> valid=$valid", ({ value, valid }) => {
    expect(validatePassword(value) === undefined).toBe(valid);
  });
});

describe("validatePasswordConfirmation", () => {
  it.each(PASSWORD_CONFIRMATION_CASES)(
    "($password, $confirmation) -> valid=$valid",
    ({ password, confirmation, valid }) => {
      expect(validatePasswordConfirmation(password, confirmation) === undefined).toBe(valid);
    },
  );
});

describe("validateEmail", () => {
  it.each(EMAIL_CASES)("$value -> valid=$valid", ({ value, valid }) => {
    expect(validateEmail(value) === undefined).toBe(valid);
  });
});

describe("validateRequired", () => {
  it.each(REQUIRED_CASES)(
    "($value, $label, $maxLength) -> valid=$valid",
    ({ value, label, maxLength, valid }) => {
      expect(validateRequired(value, label, maxLength) === undefined).toBe(valid);
    },
  );
});
