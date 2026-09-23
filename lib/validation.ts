/**
 * Server-side field validators (design.md C3), sharing their rules with
 * AUTH_CONFIG (lib/auth-config.ts). src/utils/form-validation.ts mirrors
 * this module for the client, reading the same rules from
 * src/constants/auth.ts since the client cannot import from lib/ (D13).
 * lib/validation.cases.ts is the shared case table both sides run against.
 */
import { AUTH_CONFIG } from "./auth-config";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateUsername(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return "User name is required";
  }
  if (
    trimmed.length < AUTH_CONFIG.username.minLength ||
    trimmed.length > AUTH_CONFIG.username.maxLength
  ) {
    return `User name must be ${AUTH_CONFIG.username.minLength}-${AUTH_CONFIG.username.maxLength} characters`;
  }
  if (!AUTH_CONFIG.username.pattern.test(trimmed)) {
    return "User name may only contain letters and numbers";
  }
  return undefined;
}

export function validatePassword(value: string): string | undefined {
  if (!value) {
    return "Password is required";
  }
  if (
    value.length < AUTH_CONFIG.password.minLength ||
    value.length > AUTH_CONFIG.password.maxLength
  ) {
    return `Password must be ${AUTH_CONFIG.password.minLength}-${AUTH_CONFIG.password.maxLength} characters`;
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
