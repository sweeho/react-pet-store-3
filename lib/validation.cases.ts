export interface StringCase {
  value: string;
  valid: boolean;
}

export const USERNAME_CASES: StringCase[] = [
  { value: "abc", valid: true },
  { value: "User123", valid: true },
  { value: "a".repeat(25), valid: true },
  { value: "", valid: false },
  { value: "ab", valid: false },
  { value: "a".repeat(26), valid: false },
  { value: "user_name", valid: false },
  { value: "user name", valid: false },
];

export const PASSWORD_CASES: StringCase[] = [
  { value: "password1", valid: true },
  { value: "a".repeat(64), valid: true },
  { value: "", valid: false },
  { value: "short1", valid: false },
  { value: "a".repeat(65), valid: false },
];

export interface PasswordConfirmationCase {
  password: string;
  confirmation: string;
  valid: boolean;
}

export const PASSWORD_CONFIRMATION_CASES: PasswordConfirmationCase[] = [
  { password: "password1", confirmation: "password1", valid: true },
  { password: "password1", confirmation: "", valid: false },
  { password: "password1", confirmation: "password2", valid: false },
];

export const EMAIL_CASES: StringCase[] = [
  { value: "user@example.com", valid: true },
  { value: "first.last@sub.example.co", valid: true },
  { value: "", valid: false },
  { value: "userexample.com", valid: false },
  { value: "user@examplecom", valid: false },
  { value: "@example.com", valid: false },
  { value: "user@", valid: false },
];

export interface RequiredCase {
  value: string;
  label: string;
  maxLength?: number;
  valid: boolean;
}

export const REQUIRED_CASES: RequiredCase[] = [
  { value: "John", label: "Name", valid: true },
  { value: "", label: "Name", valid: false },
  { value: "x".repeat(50), label: "Name", maxLength: 50, valid: true },
  { value: "x".repeat(51), label: "Name", maxLength: 50, valid: false },
];
