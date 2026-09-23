---
artifact: release-notes
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0001
idea: SWHR3-I-0002
branch: vortex/sprint/swhr3-s-0001-a5f84996
upstream: [artifacts/SWHR3-S-0001/qa-test-report.md]
---

# Release notes — SWHR3-S-0001

## Added

- Returning customers can sign in at `/signin` with a user name and password. (SWHR3-T-0007)
- "Remember my user name" pre-fills the user name on the sign-in page on later visits for up to a year. (SWHR3-T-0007)
- New customers can create an account from the New customer panel on `/signin`. A user name that is already taken is reported without losing what was typed. (SWHR3-T-0008)
- A failed sign-in shows a clear error banner. The password is cleared and the user name is kept. (SWHR3-T-0009)
- After creating an account, customers complete their contact details, address, one payment card and preferences on `/users/create`. The preferences are language, favourite category, MyList and pet-tips banners. (SWHR3-T-0014)
- Customers can review and update their profile at `/users/profile`. The user name is shown read-only, and the stored card is shown only as its last four digits. (SWHR3-T-0015)
- Customers can sign out from the profile page. (SWHR3-T-0010)
- A session ends after 30 minutes without activity. The next protected request reports "Session timed out". (SWHR3-T-0010)
- Visiting a protected page while signed out goes to the sign-in page, which then returns the customer to the page they asked for. (SWHR3-T-0011)
- An unexpected failure while loading a page shows an error screen instead of a blank page. (SWHR3-T-0019)

## Changed

- `/users/profile` now shows the signed-in customer's real profile instead of the static "Current User" placeholder. (SWHR3-T-0015)
- The server no longer treats every request as a fixed demo user. Requests are anonymous unless they carry a valid session. (SWHR3-T-0011)

## Upgrade notes

- **New environment variable:** `SESSION_SECRET` must be set in production. It needs at least 32 characters, and the server refuses to seal sessions without it. Dev, tests and CI use a built-in development secret. See `.env.example` and `doc/DEPLOYMENT.md`. (SWHR3-T-0020)
- **HTTPS required in production:** the session cookie is marked `Secure` when `NODE_ENV=production`. (SWHR3-T-0010)
- **Database migrations:** `drizzle/0001_dizzy_violations.sql` adds `accounts`, and `drizzle/0002_breezy_ultimo.sql` adds `customers` and `credit_cards`. Both apply automatically on startup, and SQLite foreign-key enforcement is now on. (SWHR3-T-0017, SWHR3-T-0012)
- **New cookies:** `petstore_session` (httpOnly session) and `bp_signon` (remembered user name). (SWHR3-T-0010, SWHR3-T-0007)

## Not included

- The storefront top bar, category navigation and footer shown in the mockups belong to the storefront shell (`swhr3-i-0009`). Screens this sprint ship the page body only.
- The preferred language is stored but not yet applied to the interface.
- Card details are stored and masked but never charged or validated against a payment network; payment hardening belongs to `swhr3-i-0010`.
- There is no screen to change a password, and no self-service password reset (a PRD non-goal).
- Administrator and supplier sign-on are not included; they belong to `swhr3-i-0008` and `swhr3-i-0007`.

## Verification

Verified at integration QA: PASS, 33/33 scenarios, no defects. See `artifacts/SWHR3-S-0001/qa-test-report.md`.

## Compliance / Control Evidence

| Control                                | Evidence            | Location                                                   | Status    | Exception |
| -------------------------------------- | ------------------- | ---------------------------------------------------------- | --------- | --------- |
| Release contents recorded              | this file           | `artifacts/SWHR3-S-0001/release-notes.md`                  | Satisfied | —         |
| Release verified before land           | QA PASS verdict     | `artifacts/SWHR3-S-0001/qa-test-report.md`                 | Satisfied | —         |
| Config and migration changes disclosed | Upgrade notes above | `drizzle/0001_*.sql`, `drizzle/0002_*.sql`, `.env.example` | Satisfied | —         |
