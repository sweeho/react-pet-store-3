# Customer Management Design

## User interface

The customer-management capability provides six user-facing screens:

1. **Sign-on screen** (signon.jsp): Username and password input fields, sign-in button, remember username checkbox for existing customers
2. **User registration screen** (signon.jsp): New account creation with username, password, and password confirmation fields
3. **Sign-on error screen** (signon_failed.jsp): Error messaging for failed authentication attempts
4. **Create customer screen** (create_customer.jsp): Comprehensive form collecting contact information, credit card details, and profile preferences
5. **Sign-on form** (signon.screen): Parameter-based form collecting j_username, j_password, and optional j_remember_username
6. **Error screen**: Exception display screen for request processing failures

## Architecture Overview

Customer management is implemented as a three-tier system:

1. **Web Tier**: SignOnFilter intercepts requests; JSP forms render screens; servlet handles POST submissions
2. **EJB Tier**: CustomerEJB (stateless session bean) orchestrates customer operations; SignOnEJB manages user identities
3. **Persistence Tier**: Entity beans store customer profiles, contact info, preferences; CMP provides automatic persistence

### Request Flow

1. User accesses protected resource → SignOnFilter checks authentication
2. If unauthenticated → redirect to sign-on page (signon.screen)
3. User submits credentials to j_signon_check endpoint
4. SignOnFilter validates against SignOn EJB
5. On success → session established, HttpSession getAttribute(WebKeys.USER_ID) returns userid
6. On failure → forward to signon_error.screen with error message

### Protected Resources Configuration

Protected resources are defined in signon-config.xml with URL patterns and specify:

- signon-form-page: page to redirect for sign-on (typically signon.screen)
- signon-form-error-page: page for failed authentication (typically signon_error.screen)

### Session Management

- Default timeout: 30 minutes (configured in web.xml session-config)
- Locale initialization: Default en_US, stored in session attribute WebKeys.LOCALE
- Session ID: Available via request.getSession().getId()
- Session invalidation: Explicit call on logout via request.getSession().invalidate()

### EJB Components

**CustomerEJB** (stateless session bean):

- Methods: createCustomer(), getCustomer(), updateCustomer(), deleteCustomer()
- Transaction semantics: Container-Managed Transactions (CMT) with Required attribute
- Local interface: CustomerLocal extends EJBLocalObject

**SignOnEJB** (stateless session bean):

- Methods: createUser(), validateUser(), changePassword()
- Uses ServiceLocator pattern for lookup
- Transaction semantics: CMT with Required attribute
- Handles duplicate account detection via CreateException

### Data Model

**Customer Entity** (CMP 2.x):

- Fields: userId (key), firstName, lastName, email, telephone, locale, favoriteCategory
- Lifecycle: ejbCreate(), ejbPostCreate(), ejbRemove()
- Local home: CustomerLocalHome

**CustomerProfile Value Object**:

- Mirrors entity fields for data transfer
- Serializable for remote invocation
- Contains: contact info, preferences, cookie persistence flags

## Legacy Implementation Notes

### Form Processing

- Form submission to createuser.do or j_signon_check endpoints
- Form validation via waf:input with validation attribute
- Remember username persisted in browser cookie (bp_signon)

### Error Handling

- Authentication failure: getParameter() call on invalid credentials
- Session timeout: req.getSession(false) returns null; XML error response returned
- Duplicate account: CreateException caught and wrapped in DuplicateAccountException

### Exception Mapping

- MainServlet.doProcess() catches Throwable and sets javax.servlet.jsp.jspException attribute
- ScreenFlowManager.getExceptionScreen() determines error screen based on exception type
- ERROR screen template combines banner.jsp, errorpage.jsp, footer.jsp

## Constraints and Assumptions

1. **Form-based Authentication**: Uses standard J2EE form-based login, not programmatic
2. **Protected Resource List**: URL patterns must match exactly (no wildcard matching observed)
3. **Session Timeout**: Single global timeout applies to all sessions; no per-user override
4. **Password Redaction**: Password fields contain redacted sensitive data; exact handling unclear
5. **Locale Inheritance**: If not set in session, defaults to en_US; no locale parameter passing observed in sign-on form
6. **Cookie Usage**: Remember username persists across sessions via browser cookie
7. **Transaction Semantics**: All EJB methods use Required semantics; they must complete within transaction boundaries
8. **ServiceLocator Pattern**: Runtime JNDI lookup; no caching of home references between requests

## Key Files

- **Web tier**: signon.jsp (forms), signon_failed.jsp (error), create_customer.jsp (registration)
- **Filters**: SignOnFilter.java (authentication interception)
- **EJB**: CustomerEJB.java, SignOnEJB.java (business logic)
- **Configuration**: signon-config.xml (protected resources), web.xml (session timeout)
- **Screens**: screendefinitions.xml (template definitions)

## Performance Considerations

- Session lookup on every request via SignOnFilter.doFilter()
- EJB local interface used for same-container calls (no network overhead)
- Service locator performs JNDI lookup for each EJB method call (potential bottleneck)
- Protected resource list stored in memory after initialization

---

# Rebuild on this repository (sprint SWHR3-S-0001)

Everything above this line is the extracted description of the legacy system and is kept as evidence. Everything below is how this change is built on this repository, and it is what the implementation tickets follow. Where the two disagree, this part wins; each disagreement is listed under **Spec discrepancies** with the interpretation used.

## Codebase findings

- **Identity is a stub.** `middleware/auth.ts` sets `event.context.user = { name: "Yeasin" }` on every request; `routes/api/hello.ts` and `routes/api/hello.test.ts` depend on that value.
- **One demo table.** `db/schema.ts` has only `users` (`id`, `name`, `email`), seeded with two rows by `db/client.ts`, which also registers the schema map `{ users }` and runs `drizzle/` migrations at import. Only `drizzle/0000_petite_glorian.sql` exists. `routes/api/users/*` and `src/pages/users/{index,[id]}.tsx` are starter demos and stay untouched.
- **No layout, guard or error element.** `src/main.tsx` renders `useRoutes(routes)` in a bare `<Suspense>`. `src/pages/RootErrorBoundary.tsx` exists but is not mounted anywhere.
- **One UI primitive.** `src/components/ui/` holds only `button.tsx` + `button-variants.ts` (cva, `cn()` last, Radix `Slot`). Every form control is new.
- **Static profile.** `src/pages/users/profile.tsx` renders "Current User / user@example.com".
- **Session support is already installed.** `nitro/h3` re-exports `h3`, so `useSession`/`getSession`/`updateSession`/`clearSession` and `getCookie`/`setCookie`/`deleteCookie` are importable with no new dependency. `SessionConfig` takes `password` (at least 32 characters), `maxAge` in seconds, `name` and `cookie` options.
- **Bun everywhere.** `Bun.password` (argon2id) is available in dev, test and production, because `db/client.ts` already forces the Bun runtime.
- **Type-check and test split.** `tsconfig.node.json` includes `routes`, `middleware`, `db`, `e2e` and config files. `tsconfig.json` includes only `src`, so the server and the client cannot import each other's files. Vitest runs `routes/**/*.test.ts` in the node "server" project and everything else in jsdom.
- **CI is ready.** `.github/workflows/ci.yml` already runs on pushes and PRs to `vortex/**`: doc-links, typecheck, lint, unit and integration, build, Playwright.

## Decisions

- **D1 — Two-step registration, as in the mockups.** The New customer panel on `/signin` creates the account (user name + password) and signs the customer in. The browser then goes to `/users/create` for contact, card and preferences. A duplicate user name is reported in that panel (mockup `registration-error`).
- **D2 — Sealed-cookie session, no session table.** `lib/session.ts` wraps h3 `useSession`. Cookie `petstore_session`: httpOnly, `sameSite: "lax"`, `path: "/"`, `secure` only in production. Session data is `{ accountId, username, locale, lastSeen }`. The idle timeout is 30 minutes and slides: `readSession` re-seals an active session with a fresh `lastSeen`, and a session whose `lastSeen` is older than 1800 s reads as `expired`. A cookie that is present but cannot be unsealed also reads as `expired`; no cookie reads as `none`.
- **D3 — Session secret.** `SESSION_SECRET` is required in production. Outside production a fixed development secret is used, so dev, Vitest and CI need no setup.
- **D4 — Passwords.** Hashed with `Bun.password.hash` (argon2id) and checked with `Bun.password.verify`. Plain passwords are never stored or logged. No new dependency.
- **D5 — Credential rules** (`lib/auth-config.ts`, mirrored in `src/constants/auth.ts`). User name: 3–25 characters, `[A-Za-z0-9]` only, case-sensitive and unique. Password: 8–64 characters. The legacy `MAX_PASSWD_LENGTH` value is not recoverable from the extraction.
- **D6 — Remember my user name.** Cookie `bp_signon` stores the user name for one year. It is set when `j_remember_username` is true and deleted when it is false. It is not httpOnly: it holds no secret, and the sign-in page reads it with `document.cookie`.
- **D7 — Protection has two sides.**
  - Server: `middleware/auth.ts` resolves the session into `event.context.user = { id, username }` and answers 401 on any path in `PROTECTED_API_PATHS`, matched exactly: `"Session timed out"` when the session is `expired`, `"Authentication required"` otherwise.
  - Client: `src/main.tsx` wraps the routes in a guard. For any path in `PROTECTED_PAGE_PATHS` it redirects signed-out visitors to `/signin?redirect=<path>`. The sign-in page returns there on success.
  - `redirect` is honoured only when it starts with a single `/`; otherwise the destination is `/users/profile`.
- **D8 — Data model:** three tables, linked by foreign keys, in `db/schema.ts`.
  - `accounts`: `id`, `username` unique, `passwordHash`, `createdAt`.
  - `customers`: 1:1 with `accounts` through a unique `accountId`. Holds `firstName`, `lastName`, unique `email`, `telephone`, the address (`street1`, optional `street2`, `city`, `state`, `postalCode`, `country`) and the preferences (`locale` default `en_US`, optional `favoriteCategory`, `myListEnabled`, `petTipsEnabled`), plus `createdAt`/`updatedAt`.
  - `creditCards`: 1:1 with `customers` through a unique `customerId`, `ON DELETE CASCADE`. Holds `cardType`, `cardNumber`, `expiryMonth`, `expiryYear`.
  - Preferences are columns rather than a table because they are 1:1 and always read with the profile. The starter `users` table is left alone.
- **D9 — Card data.** The number is stored as entered and sent back only as its last four digits. Payment and card-storage hardening belong to `swhr3-i-0010`. On update, an empty card number keeps the card on file.
- **D10 — Enumerations** (`lib/customer-profile.ts`, mirrored in `src/types/customer-profile.ts`).
  - `CARD_TYPES`: `Visa`, `MasterCard`, `American Express`.
  - `LOCALES`: `en_US`, `ja_JP`, `zh_CN`.
  - `FAVORITE_CATEGORIES`: `BIRDS`, `CATS`, `DOGS`, `FISH`, `REPTILES`, the storefront categories in the mockups.
  - The locale is stored, not applied (canvas Out of Scope).
- **D11 — Errors.** Services throw typed errors from `lib/errors.ts`. Routes convert every error with `toHttpError`. The client reads `message`, `data.code` and `data.fieldErrors` through `src/utils/api.ts`.
- **D12 — Transactions.** Multi-row writes (a customer plus its card, an update touching both) run in `withTransaction` from `lib/transaction.ts`. Drizzle's bun-sqlite transactions are synchronous. When an outer transaction is passed in, the work joins it rather than committing on its own.
- **D13 — Server modules live in a new `lib/` directory.** `lib/` has no Nitro meaning, so nothing in it becomes a route or a middleware. It is added to `tsconfig.node.json`, and `lib/**/*.test.ts` joins the Vitest "server" project. The client cannot import from `lib/` (the tsconfig split), so the few values both sides need are mirrored in `src/constants/auth.ts`, `src/types/customer-profile.ts` and `src/utils/form-validation.ts`. Parity is pinned by a shared test table. Routes still import `db` and the tables directly for simple reads, as in `routes/api/users/`; `lib/` holds only logic that more than one caller shares.
- **D14 — Pages and paths.**
  - `/signin` (`src/pages/signin.tsx`): both panels.
  - `/users/create` (`src/pages/users/create.tsx`): the create-customer form.
  - `/users/profile` (`src/pages/users/profile.tsx`): replaced with the real profile.
  - API routes: `/api/auth/signin`, `/api/auth/register`, `/api/auth/signout`, `/api/session`, `/api/customers`, `/api/customers/me`.
- **D15 — Barrel files.** Only `src/components/ui/index.ts` gains exports, owned by SWHR3-T-0021. Every other new module is imported by its own path, so parallel tickets never edit the same barrel.
- **D16 — Ownership key for later capabilities.** Data that later capabilities attach to a customer (cart, orders, notifications) references `accounts.id`, the identity every signed-in session carries (`event.context.user.id`). `customers` holds the profile, and a just-registered account may not have one yet. Read the profile through `getCustomerProfile(accountId)` when contact or address data is needed, and snapshot it onto the order (PRD: orders keep the address used at purchase time).

## Interface contracts

These are fixed. A ticket that needs one changed escalates to planning; it does not change the contract in place.

| #   | Module                                                                                 | Exports                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Owner        |
| --- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| C1  | `lib/auth-config.ts`                                                                   | `AUTH_CONFIG` (`authMethod: "FORM"`, `signInPage: "/signin"`, `signInErrorPage: "/signin"`, `sessionCookieName: "petstore_session"`, `sessionTimeoutSeconds: 1800`, `rememberCookieName: "bp_signon"`, `rememberCookieMaxAgeSeconds`, `defaultLocale: "en_US"`, `username: { minLength: 3, maxLength: 25, pattern }`, `password: { minLength: 8, maxLength: 64 }`), `getSessionSecret()`                                                                                                                                                                                                                                           | SWHR3-T-0020 |
| C2  | `lib/errors.ts`                                                                        | `ServiceError(code, message, status)`; `DuplicateAccountError` 409 `DUPLICATE_ACCOUNT`, `DuplicateEmailError` 409 `DUPLICATE_EMAIL`, `ProfileExistsError` 409 `PROFILE_EXISTS`, `NotFoundError` 404 `NOT_FOUND`, `ValidationError` 422 `VALIDATION_FAILED` (`fieldErrors: Record<string, string>`), `ServiceUnavailableError` 503 `SERVICE_UNAVAILABLE`; `toHttpError(error)` → an h3 error whose body carries `message`, `data.code` and `data.fieldErrors?`; unknown errors become a logged, generic 500                                                                                                                         | SWHR3-T-0016 |
| C3  | `lib/validation.ts`, `src/utils/form-validation.ts`                                    | `validateUsername`, `validatePassword`, `validatePasswordConfirmation(password, confirmation)`, `validateEmail`, `validateRequired(value, label, maxLength?)` → `string \| undefined`                                                                                                                                                                                                                                                                                                                                                                                                                                              | SWHR3-T-0021 |
| C4  | `src/utils/api.ts`                                                                     | `apiFetch<T>(path, init?) : Promise<T>` (JSON in and out, `credentials: "same-origin"`), `ApiError { status, code?, message, fieldErrors? }`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | SWHR3-T-0021 |
| C5  | `src/components/ui/`                                                                   | `Input`, `Label`, `Checkbox`, `Select`, `Alert`, `FormField`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | SWHR3-T-0021 |
| C6  | `db/schema.ts` `accounts`; `lib/password.ts`; `lib/accounts.ts`                        | `hashPassword`, `verifyPassword`; `createAccount({ username, password }) : Promise<Account>`, `verifyCredentials(username, password) : Promise<Account \| null>`, `changePassword(accountId, current, next)`; `type Account = { id: number; username: string }`                                                                                                                                                                                                                                                                                                                                                                    | SWHR3-T-0017 |
| C7  | `lib/transaction.ts`                                                                   | `type DbOrTx`, `withTransaction<T>(fn: (tx: DbOrTx) => T, outer?: DbOrTx): T`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | SWHR3-T-0018 |
| C8  | `lib/session.ts`                                                                       | `type SessionUser = { id: number; username: string }`, `startSession(event, user)`, `readSession(event)` → `{ status: "active", user, locale } \| { status: "expired" } \| { status: "none" }`, `endSession(event)`, `requireSessionUser(event)` (throws a 401 with the D7 messages)                                                                                                                                                                                                                                                                                                                                               | SWHR3-T-0010 |
| C9  | HTTP, session                                                                          | `GET /api/session` → `{ user: SessionUser \| null, locale, expired }`; `POST /api/auth/signout` → 204                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | SWHR3-T-0010 |
| C10 | `lib/protected-resources.ts`, `src/constants/protected-pages.ts`, `middleware/auth.ts` | `PROTECTED_API_PATHS` (`/api/customers`, `/api/customers/me`), `isProtectedApiPath(pathname)`; `PROTECTED_PAGE_PATHS` (`/users/profile`, `/users/create`); `event.context.user?: SessionUser`                                                                                                                                                                                                                                                                                                                                                                                                                                      | SWHR3-T-0011 |
| C11 | HTTP, sign-in                                                                          | `POST /api/auth/signin` `{ j_username, j_password, j_remember_username? }` → 200 `{ user }` \| 401 \| 422                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | SWHR3-T-0007 |
| C12 | HTTP, register                                                                         | `POST /api/auth/register` `{ j_username, j_password, j_password_confirm }` → 201 `{ user }` (signed in) \| 409 `DUPLICATE_ACCOUNT` \| 422                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | SWHR3-T-0008 |
| C13 | `db/schema.ts` `customers`, `creditCards`                                              | columns per D8                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | SWHR3-T-0012 |
| C14 | `lib/customer-profile.ts`, `src/types/customer-profile.ts`                             | `CustomerProfile` (`username`, `firstName`, `lastName`, `email`, `telephone`, `address { street1, street2 \| null, city, state, postalCode, country }`, `card { cardType, cardNumberLast4, expiryMonth, expiryYear }`, `preferences { locale, favoriteCategory \| null, myListEnabled, petTipsEnabled }`); `CustomerProfileInput` (the same shape without `username`, with `card.cardNumber` in place of `cardNumberLast4`); `CARD_TYPES`, `LOCALES`, `FAVORITE_CATEGORIES`; `toCustomerProfile(account, customer, card)`, `parseCustomerProfileInput(body, "create" \| "update")` (throws `ValidationError` keyed by dotted path) | SWHR3-T-0013 |
| C15 | `lib/customers.ts`; HTTP                                                               | `createCustomer(accountId, input)`, `getCustomerProfile(accountId)`, `updateCustomer(accountId, input)`, `deleteCustomer(accountId)`; `POST /api/customers` → 201 `{ customer }`, `GET /api/customers/me` → 200 `{ customer }` \| 404, `PUT /api/customers/me` → 200 `{ customer }`                                                                                                                                                                                                                                                                                                                                                | SWHR3-T-0015 |
| C16 | `src/utils/error-screen.ts`, `src/components/error-boundary.tsx`                       | `getErrorScreen(error)` → `{ screen: "signin" \| "error"; message }`, `AppErrorBoundary`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | SWHR3-T-0019 |

## Phases

1. **Foundation.** SWHR3-T-0020 → SWHR3-T-0016 → SWHR3-T-0021 → SWHR3-T-0017. Covers auth config, the `lib/` harness, service errors, form primitives and validators, then accounts and credentials.
2. **Session and storage, in parallel.** SWHR3-T-0010 (session) ∥ SWHR3-T-0018 → SWHR3-T-0012 (transactions, then customer tables).
3. **Screens and protection.**
   - SWHR3-T-0007 → SWHR3-T-0008 → SWHR3-T-0009: the sign-in page, one ticket at a time, because they share `src/pages/signin.tsx`.
   - In parallel, SWHR3-T-0011 → SWHR3-T-0019: protection, then the error screen. They share `src/main.tsx`.
   - In parallel, SWHR3-T-0013 → SWHR3-T-0014 ∥ SWHR3-T-0015: profile shape, then the create page and the profile service and page.
4. **Test harness.** Owned by SWHR3-T-0020: `lib/**/*.test.ts` runs in the Vitest node project and `lib/` is type-checked through `tsconfig.node.json`. Each ticket ships its own tests beside its code, following the file layout in AGENTS.md: route tests under `routes/**`, service tests under `lib/**`, page and component tests as `*.test.tsx` beside the file, journeys in `e2e/`. The existing `e2e/smoke.spec.ts` must stay green: `/api/hello` keeps answering without a session (SWHR3-T-0011).
5. **CI.** No workflow change is needed. `.github/workflows/ci.yml` already triggers on `vortex/**` pushes and PRs and runs doc-links, typecheck, lint, unit and integration, build and Playwright. CI needs no secret because of D3. SWHR3-T-0020 documents `SESSION_SECRET` for production deploys.
6. **Integration.** SWHR3-T-0022 adds the cross-ticket e2e journeys and the concurrency and timeout integration tests once every screen has merged.

## Spec discrepancies

The delta spec was extracted from the legacy J2EE application. Its scenarios name legacy artefacts that this repository does not have and, per the idea's Out of Scope, does not port ("EJB/CMP, JNDI lookups, `signon-config.xml`, JSP screen flow"). The delta spec is left unedited. Each row gives the interpretation the ticket builds and QA verifies against.

| #    | Spec says                                                                                                                                                                                                                                     | This repository does                                                                                                                                                                                                | Why                                                                                                                                          |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| SD1  | Forms post to `j_signon_check` / `j_security_check`, `createuser.do`, `createcustomer.do` with `action=create`; screens are `signon.screen`, `signon_error.screen`                                                                            | `POST /api/auth/signin`, `POST /api/auth/register`, `POST /api/customers` (create is the POST itself); pages `/signin`, `/users/create`                                                                             | SPA + Nitro handlers; no Struts or `.do` dispatch exists or is ported                                                                        |
| SD2  | Form parameters `j_username`, `j_password`, `j_remember_username`                                                                                                                                                                             | Kept literally, as the input `name`s and the JSON body keys                                                                                                                                                         | Cheap to keep, and it keeps the scenario directly checkable                                                                                  |
| SD3  | SignOnEJB / CustomerEJB via ServiceLocator + JNDI; CMP entities; `CustomerLocalHome`                                                                                                                                                          | Plain ES-module services in `lib/` (`accounts.ts`, `customers.ts`) imported statically; Drizzle tables                                                                                                              | Out of Scope; a static import cannot fail at runtime the way a JNDI lookup can                                                               |
| SD4  | "EJB home is located … return CustomerLocalHome" (ServiceLocator scenario 1)                                                                                                                                                                  | Met by construction: every route imports its service module directly (SWHR3-T-0016 records this in `lib/errors.ts`'s module doc). QA checks that routes resolve their services with no runtime lookup               | No lookup step exists to test                                                                                                                |
| SD5  | "Service lookup failure … wrap as DuplicateAccountException or appropriate error"                                                                                                                                                             | Any non-`ServiceError` thrown inside a service surfaces through `toHttpError` as a logged, generic 500 (`ServiceUnavailableError` 503 when a service signals it); duplicates surface as `DuplicateAccountError` 409 | The "appropriate error" clause, applied to the failure modes this stack has                                                                  |
| SD6  | `CreateException` wrapped as `DuplicateAccountException`                                                                                                                                                                                      | The unique-constraint violation on `accounts.username` becomes `DuplicateAccountError` (409, `DUPLICATE_ACCOUNT`)                                                                                                   | Same behaviour, modern types                                                                                                                 |
| SD7  | `HttpSession` attributes `WebKeys.USER_ID`, `WebKeys.LOCALE`                                                                                                                                                                                  | Sealed-cookie session fields `accountId` (+ `username`) and `locale` (D2)                                                                                                                                           | No servlet container; the idea's Solution specifies h3 sessions                                                                              |
| SD8  | Original URL stored in session attribute `ORIGINAL_URL`                                                                                                                                                                                       | Stored in the `redirect` query parameter of `/signin` (D7)                                                                                                                                                          | Page navigation in an SPA never reaches the server, so the server session cannot see the requested page                                      |
| SD9  | Session timeout detection returns an XML error "Session Timed Out; Please exit and login as admin from the login page"                                                                                                                        | JSON 401 with message "Session timed out" on protected API paths; `GET /api/session` reports `expired: true`; the guard sends the browser to `/signin`                                                              | That message comes from the OPC **admin** client's `ApplRequestProcessor`. Admin sign-on belongs to `swhr3-i-0008`, and this API speaks JSON |
| SD10 | `signon-config.xml` loaded at filter init and cached                                                                                                                                                                                          | `lib/protected-resources.ts` constants, evaluated once at module load (in memory for the process lifetime)                                                                                                          | Configuration as code; no XML config is ported                                                                                               |
| SD11 | `web.xml` `login-config` (auth-method FORM, form-login-page, form-error-page) and `session-timeout = 30`                                                                                                                                      | `AUTH_CONFIG` in `lib/auth-config.ts`                                                                                                                                                                               | Same facts, one module                                                                                                                       |
| SD12 | `MainServlet` sets `javax.servlet.jsp.jspException` and forwards to the ERROR screen template; `ScreenFlowManager.getExceptionScreen()`                                                                                                       | `AppErrorBoundary` catches render errors and passes the error to the error screen; `getErrorScreen(error)` maps an error to a screen                                                                                | React equivalent of both mechanisms                                                                                                          |
| SD13 | `CustomerProfile` value object with `toDOM`/`fromDOM` XML                                                                                                                                                                                     | `CustomerProfile` JSON type + `toCustomerProfile` / `parseCustomerProfileInput`                                                                                                                                     | Plain JSON responses (idea Solution)                                                                                                         |
| SD14 | Container-managed transactions, `Required` attribute                                                                                                                                                                                          | `withTransaction` (D12); joining an outer transaction is the `Required` equivalent                                                                                                                                  | No EJB container                                                                                                                             |
| SD15 | Customer entity fields `userId, firstName, lastName, email, telephone, locale, favoriteCategory` (design.md above); `architecture/schema.sql` `Customer` has `familyName/givenName`, no card and no preferences, and no link to `ContactInfo` | D8 tables carry everything the **Customer creation screen** requirement lists (address, card, preferences)                                                                                                          | The delta spec's screen requirement is the most complete statement, and `schema.sql` declares itself evidence, not a target                  |
| SD16 | design.md lists "Sign-on screen", "User registration screen" and "Sign-on form (signon.screen)" as three of six screens                                                                                                                       | One `/signin` page carrying both panels (PRD screen list, mockups)                                                                                                                                                  | They were one JSP                                                                                                                            |
| SD17 | Registration captures only user name, password and confirmation; the idea's AC says registration captures "name, email, and password"                                                                                                         | Two steps (D1): the credentials first, then name and email on `/users/create`                                                                                                                                       | Matches the mockups and both statements                                                                                                      |
| SD18 | Session timeout is enforced by the container                                                                                                                                                                                                  | h3 `maxAge` is absolute from seal time, so the idle window is implemented by re-sealing on each request (D2)                                                                                                        | The spec asks for 30 minutes of **inactivity**                                                                                               |
| SD19 | tasks.md 12.x declares `trans-attribute` per EJB method; 10.5/10.7 and 11.7 ask for JNDI names and `ejb-jar.xml` entries                                                                                                                      | No descriptor exists; those checkboxes are met by D12/D13 and close with their ticket                                                                                                                               | Out of Scope runtime                                                                                                                         |
| SD20 | tasks.md 14.7 "Configure authorization roles (if required)"                                                                                                                                                                                   | Not required: one role, customer. Admin and supplier sign-on belong to `swhr3-i-0008` / `swhr3-i-0007`                                                                                                              | Canvas Out of Scope                                                                                                                          |
| SD21 | `build/manifest.yaml` names this capability's change `openspec/changes/sx-customer-management`                                                                                                                                                | The change is `swhr3-i-0002-customer-management-and-aut`                                                                                                                                                            | The manifest predates the change id; the manifest is not edited by this sprint                                                               |
| SD22 | tasks.md 16.8 "transaction rollback on concurrent duplicate registrations"                                                                                                                                                                    | Two simultaneous `POST /api/auth/register` calls for one user name: one 201, one 409, one row                                                                                                                       | SQLite serialises writers; the unique index decides the race                                                                                 |

## Ticket map

| tasks.md group                          | Ticket       | Depends on                               |
| --------------------------------------- | ------------ | ---------------------------------------- |
| 1. Authentication & Sign-On Forms       | SWHR3-T-0007 | SWHR3-T-0010                             |
| 2. User Registration                    | SWHR3-T-0008 | SWHR3-T-0007                             |
| 3. Sign-On Error Handling               | SWHR3-T-0009 | SWHR3-T-0008                             |
| 4. Session Management                   | SWHR3-T-0010 | SWHR3-T-0017                             |
| 5. Protected Resources & Access Control | SWHR3-T-0011 | SWHR3-T-0010                             |
| 6. Customer Profile Storage             | SWHR3-T-0012 | SWHR3-T-0018                             |
| 7. Customer Profile Value Object        | SWHR3-T-0013 | SWHR3-T-0012                             |
| 8. Customer Creation Form               | SWHR3-T-0014 | SWHR3-T-0013                             |
| 9. Customer Profile Operations          | SWHR3-T-0015 | SWHR3-T-0013, SWHR3-T-0010               |
| 10. EJB Service Layer                   | SWHR3-T-0016 | SWHR3-T-0020                             |
| 11. SignOn Component Integration        | SWHR3-T-0017 | SWHR3-T-0021                             |
| 12. Transaction Management              | SWHR3-T-0018 | SWHR3-T-0017                             |
| 13. Error Handling & Exception Mapping  | SWHR3-T-0019 | SWHR3-T-0011                             |
| 14. Security Configuration              | SWHR3-T-0020 | —                                        |
| 15. Form Validation & Constraints       | SWHR3-T-0021 | SWHR3-T-0016                             |
| 16. Testing & Integration               | SWHR3-T-0022 | SWHR3-T-0009, -0011, -0014, -0015, -0019 |

Design references for every screen: `artifacts/SWHR3-S-0001/design/` (see its `MANIFEST.md`).
