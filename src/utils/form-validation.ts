/**
 * Client-side field validators (design.md C3), mirroring lib/validation.ts
 * rule-for-rule since the client cannot import from lib/ (D13). Reads the
 * same rules from src/constants/auth.ts. lib/validation.cases.ts is the
 * shared case table both sides run against.
 */
import { PASSWORD_RULES, USERNAME_RULES } from "@/constants/auth";

const USERNAME_PATTERN = new RegExp(USERNAME_RULES.pattern);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateUsername(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return "User name is required";
  }
  if (trimmed.length < USERNAME_RULES.minLength || trimmed.length > USERNAME_RULES.maxLength) {
    return `User name must be ${USERNAME_RULES.minLength}-${USERNAME_RULES.maxLength} characters`;
  }
  if (!USERNAME_PATTERN.test(trimmed)) {
    return "User name may only contain letters and numbers";
  }
  return undefined;
}

export function validatePassword(value: string): string | undefined {
  if (!value) {
    return "Password is required";
  }
  if (value.length < PASSWORD_RULES.minLength || value.length > PASSWORD_RULES.maxLength) {
    return `Password must be ${PASSWORD_RULES.minLength}-${PASSWORD_RULES.maxLength} characters`;
  }
  return undefined;
}

export function validatePasswordConfirmation(
  password: string,
  confirmation: string,
): string | undefined {
  if (!confirmation) {
    return "Please confirm your password";
  }
  if (confirmation !== password) {
    return "Passwords do not match";
  }
  return undefined;
}

export function validateEmail(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return "Email is required";
  }
  if (!EMAIL_PATTERN.test(trimmed)) {
    return "Enter a valid email address";
  }
  return undefined;
}

export function validateRequired(
  value: string,
  label: string,
  maxLength?: number,
): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return `${label} is required`;
  }
  if (maxLength !== undefined && trimmed.length > maxLength) {
    return `${label} must be at most ${maxLength} characters`;
  }
  return undefined;
}
