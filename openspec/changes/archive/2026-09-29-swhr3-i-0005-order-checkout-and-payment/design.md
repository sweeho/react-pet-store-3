# Order Checkout Design

## User interface

The order-checkout capability provides checkout forms for customers to enter billing and shipping addresses, select payment method, and review their order. Forms are implemented as JSP pages accessed through the enter_order_information screen.

## Architecture Overview

Order checkout is implemented as a web-tier form collection layer with EJB-tier order processing:

1. **Web Tier**: Struts actions (OrderHTMLAction, CustomerHTMLAction) validate form data and route to EJB tier
2. **EJB Tier**: OrderEJBAction processes validated data, creates purchase order, integrates with shopping cart
3. **Integration Tier**: ContactInfo and Address components handle address persistence and validation
4. **Business Objects**: Order, PurchaseOrder, ContactInfo, CreditCard value objects manage checkout data

### Checkout Workflow

1. Customer views cart and initiates checkout via "Place Order" action
2. Web tier displays enter_order_information screen with billing address form
3. Customer enters billing address (family name, given name, address 1, address 2 optional, city, state, postal code, country, telephone, email)
4. Customer enters shipping address with same fields (can be same as billing)
5. Customer enters credit card payment information (card number, type, expiry month/year)
6. OrderHTMLAction.perform() validates all required fields
7. OrderEvent created with shipper (billing), receiver (shipping), and credit card
8. OrderEJBAction processes event:
   - Retrieves shopping cart from customer session
   - Validates cart is not empty
   - Generates unique order ID via UniqueIdGenerator
   - Sets order date to current system date
   - Creates PurchaseOrder with customer ID, email, addresses, and payment method
   - Persists order via EJB entity bean
9. System displays order confirmation screen with order details

### Form Field Requirements

**Address Fields (Billing and Shipping)**:

- Family Name (required)
- Given Name (required)
- Street Address Line 1 (required)
- Street Address Line 2 (optional)
- City (required)
- State/Province (required)
- Postal Code (required)
- Country (required)
- Telephone Number (required)
- Email Address (required)

**Credit Card Fields**:

- Card Number (required)
- Card Type (required) - options: Java Card, Duke Express, Meow Card
- Expiry Month (required) - dropdown 01-12
- Expiry Year (required) - dropdown of valid future years

### Data Model

**PurchaseOrder Entity**:

- OrderId (unique identifier, generated)
- OrderDate (set to current system date)
- UserId (from authenticated customer session)
- EmailId (from billing address email field)
- BillTo (ContactInfo for billing address)
- ShipTo (ContactInfo for shipping address)
- CreditCard (payment method)
- OrderLineItems (from shopping cart)
- OrderStatus (PENDING initially)

**ContactInfo Value Object**:

- FamilyName, GivenName, Address1, Address2, City, StateOrProvince, PostalCode, Country, TelephoneNumber, Email
- Used for both billing and shipping addresses
- Validated independently with identical rules

**CreditCard Value Object**:

- CardNumber (string)
- CardType (enumerated: Java Card, Duke Express, Meow Card)
- ExpiryDate (MM/YYYY format, derived from separate month/year fields)

### Struts Actions

**OrderHTMLAction**:

- perform(HttpServletRequest) called on form submission
- extractContactInfo(request, suffix) validates address fields
- Handles suffixes: "\_a" for billing, "\_b" for shipping
- Throws MissingFormDataException if required fields missing
- Creates OrderEvent with billing, shipping, and credit card data

**CustomerHTMLAction**:

- extractCreditCard(request) validates payment information
- Parses card number, type, expiry month/year from request parameters
- Creates CreditCard value object
- Combines month and year into MM/YYYY expiry format

**OrderEJBAction**:

- Receives OrderEvent from web tier
- Retrieves shopping cart from customer session via ShoppingClientFacade
- Validates cart contains items (throws ShoppingCartEmptyOrderException if empty)
- Generates unique order ID via UniqueIdGenerator.getUniqueId("1001")
- Creates PurchaseOrder with order ID, current date, customer ID, email
- Persists order via EJB entity bean
- Returns order confirmation

### Error Handling

**MissingFormDataException**:

- Thrown when required address fields are empty after trimming
- Collects list of missing field names and displays validation errors
- User returns to form to correct data

**ShoppingCartEmptyOrderException**:

- Thrown if cart contains no items when order is submitted
- Prevents creation of empty orders
- Directs user back to shopping cart

**Form Validation**:

- All address fields except "address_2" are required
- Email field is optional in address extraction but required via form
- Credit card fields are all required
- Expiry date components parsed and validated as integers
- Address suffix pattern allows reuse of validation logic for billing/shipping

### Session and State Management

- Shopping cart maintained in customer session via ShoppingClientFacade
- Customer ID available from authenticated session principal
- Email address persisted in order for confirmation notifications
- Order creation is transactional at EJB level (CMT with Required semantics)

## Legacy Implementation Notes

### Form Processing

- Form submission to order action endpoint (Struts mapping)
- Request parameters parsed with suffixes for billing/shipping distinction
- Missing field validation performed before creating order object
- Addresses extracted as ContactInfo objects with field copying

### Credit Card Handling

- Card information passed as hardcoded values in some code paths (legacy placeholder)
- Expiry month and year provided as separate dropdowns in JSP forms
- Concatenated to MM/YYYY format before storing
- Card type is enumerated selection from combo box (Java Card, Duke Express, Meow Card)

### Order ID Generation

- UniqueIdGenerator pattern used to create unique order identifiers
- Generator seeded with base ID "1001"
- Ensures no order ID collisions in database

### Address Component Integration

- ContactInfo retrieved from address component API
- Address persistence handled by separate address management subsystem
- Address components provide shared validation and storage

## Constraints and Assumptions

1. **Required Fields**: All address fields except address line 2 are mandatory
2. **Address Suffixes**: Billing address uses "\_a" suffix, shipping uses "\_b" suffix for form parameters
3. **Email Requirement**: Email in checkout form is required and used for order confirmation
4. **Credit Card Format**: Expiry date stored as MM/YYYY string (e.g., "03/2025")
5. **Card Types**: Only three card types supported (Java Card, Duke Express, Meow Card)
6. **Order ID Uniqueness**: UniqueIdGenerator guarantees unique IDs without database collision
7. **Cart Requirement**: Empty cart validation prevents order creation with no line items
8. **Session Scope**: Checkout assumes customer is authenticated with valid session
9. **Transaction Semantics**: Order creation is atomic (all or nothing at EJB level)
10. **Field Trimming**: All string fields trimmed to remove whitespace before validation

## Key Files

- **Web Actions**: OrderHTMLAction.java, CustomerHTMLAction.java
- **EJB Actions**: OrderEJBAction.java
- **Business Objects**: Order.java, PurchaseOrder.java, ContactInfo.java, CreditCard.java
- **JSP Forms**: enter_order_information.jsp, order_confirmation.jsp
- **Configuration**: struts-config.xml (action mappings)
- **Screen Definitions**: screendefinitions_en_US.xml (enter_order_information screen)

## Performance Considerations

- Form field validation at action level (web tier) reduces EJB processing
- ContactInfo objects created during form extraction (no lazy loading)
- Address component lookups may require database queries for existing addresses
- Order ID generation may contend on UniqueIdGenerator in high-concurrency scenarios
- Transaction scope limited to order creation (does not include cart item copying)

---

## Rebuild on this repository (sprint SWHR3-S-0006)

Everything above this heading was extracted from the legacy system and describes what it did. Everything below records how this repository delivers it. Implementation tickets read this section first. It cites decisions as `D`, fixed interface contracts as `C` and spec discrepancies as `SD`. The mockups and wireframes are exported under `artifacts/SWHR3-S-0006/design/` (index `MANIFEST.md`).

### Codebase findings

- **The idea snapshot is stale.** It says the repo has one `users` table and no commerce surface. Three capabilities have shipped since:
  - `customer-management`: accounts, sessions, `customers` profile with an address, and `credit_cards`.
  - `order-approval`: the `orders` table and admin queue.
  - `shopping-cart`: `cart_items`, the catalogue, `line_items`, `/cart`, and a `/checkout` guard placeholder.
- **Established patterns.**
  - Server logic shared by more than one caller lives in `lib/`. Services throw typed errors from `lib/errors.ts`, and routes convert them with `toHttpError`.
  - Request parsing lives in a `lib/*-request.ts` module (`lib/cart-request.ts`, `lib/order-approval-request.ts`).
  - Multi-row writes use `withTransaction(fn, outer, { behavior: "immediate" })`, which joins an outer transaction or starts its own.
  - The client calls through `apiFetch`, with one binding module per API (`src/utils/cart-api.ts`).
  - Money is integer cents.
- **Existing orders data.** `orders` has `id` (autoincrement), `account_id`, `customer_name`, `order_date`, `total_cents`, `status` (default `PENDING`) and `updated_at`. `line_items` exists, keyed on (`order_id`, `line_number`), with no writer. Its seven columns map directly from a `CartItem`. ARCHITECTURE.md already says checkout adds address snapshots alongside `orders`.
- **Cart access.** `lib/cart.ts` `getItems(token, locale, tx)` and `empty(token, tx)` take an outer transaction. `middleware/cart-session.ts` resolves `event.context.cartSession` only for `/api/cart*` paths. `lib/cart-locale.ts` `resolveCartLocale(event)` gives the catalogue locale.
- **Authentication.** `lib/protected-resources.ts` holds an exact-match `PROTECTED_API_PATHS` list, which the middleware answers with 401. `requireSessionUser(event)` exists for handlers. Client page protection is the exact-match `src/constants/protected-pages.ts`.
- **Profile.** `GET /api/customers/me` returns the profile with the address (`street1`, `street2`, `city`, `state`, `postalCode`, `country`), `telephone`, `email`, `firstName` and `lastName`. The stored card is masked, and its types are Visa, MasterCard and American Express (`lib/customer-profile.ts` `CARD_TYPES`).
- **UI primitives.** `Input`, `Label`, `Select`, `Checkbox`, `FormField`, `Alert` and `Table` exist in `src/components/ui/`. The idea's "no form primitives exist" is stale. Domain widgets live in `src/components/<area>/`.
- **Tests.** Route tests build a real `H3Event`. `lib/`, `middleware/` and `routes/` tests run in the Vitest server project. E2E seeds by spawning Bun scripts (`db/seed-catalog.ts`) and signs in through the UI (`e2e/customer-auth.spec.ts`).
- **CI.** `.github/workflows/ci.yml` runs doc links, typecheck, lint, unit, build and Playwright on every push and pull request to `vortex/**`. No workflow change is needed.

### Decisions

- **D1 — One request shape, the legacy flat field names.** `POST /api/orders` takes a flat JSON object: the page serialises its form's `FormData` as-is. Billing fields carry the suffix `_a` and shipping fields `_b` (C4). This keeps the spec's suffix extraction literally testable, just as the cart kept `itemQuantity_<itemId>`.
- **D2 — Validation collects every problem before failing.** Parsing a checkout request collects missing and invalid fields across billing, shipping and payment in one pass. It throws one `MissingFormDataError` listing all of them.
  - Values are trimmed first. A whitespace-only value is missing, with its own message ("Spaces only — enter …", per the missing-fields mockup).
  - `address_2_*` is optional, and blank becomes `null`.
- **D3 — The order stores snapshots, not references.** Billing and shipping become two rows in a new `order_contacts` table, keyed on (`order_id`, `role`) with role `BILL_TO` or `SHIP_TO`, each carrying the ten ContactInfo fields.
  - The card and email become new nullable columns on `orders`: `email`, `card_type`, `card_number`, `card_expiry`. They are nullable because rows seeded before this change have none.
  - `customer_name` is "given family" from billing.
  - Later profile edits never touch an order (PRD).
- **D4 — Placing an order is one immediate-mode transaction**, in `lib/checkout.ts` `placeOrder` (C8):
  1. Read the cart lines, or throw `ShoppingCartEmptyError`.
  2. Insert the `orders` row: account from the session, date now, total = cart subtotal, status `PENDING`.
  3. Insert both `order_contacts` rows.
  4. Insert one `line_items` row per cart line, numbered from 1.
  5. Empty the cart.

  Any failure rolls all of it back.

- **D5 — The order id is `orders.id`.** SQLite `AUTOINCREMENT` never reuses an id, so the order number shown to the shopper is that integer. No generator component is added.
- **D6 — Checkout card types are their own list: Java Card, Duke Express, Meow Card** (`lib/credit-card.ts` `CHECKOUT_CARD_TYPES`), per the spec and mockup. The profile's stored card uses a different list, so the payment section is never pre-filled from it. The order stores the card as entered, and the confirmation shows it masked to the last four digits.
  - The expiry is stored as `MM/YYYY`.
  - The expiry year choices run from the current year to five years ahead.
  - The number must be 12–19 digits once spaces are removed.
- **D7 — Checkout requires a signed-in customer.**
  - `/api/orders` joins `PROTECTED_API_PATHS`, and `/checkout` joins `PROTECTED_PAGE_PATHS`, so a signed-out visitor goes to `/signin?redirect=/checkout`.
  - The cart survives sign-in, because its cookie is independent of the session.
  - `GET /api/orders/:id` calls `requireSessionUser` and answers 404 for another account's order.
  - The order's account always comes from the session, never from the request body.
- **D8 — The cart cookie reaches `/api/orders`.** `middleware/cart-session.ts` resolves `event.context.cartSession` for `/api/orders*` as well as `/api/cart*`. It still mints a cookie only for `/api/cart*` writes, so placing an order never creates a cart.
- **D9 — Error mapping.**
  - `MissingFormDataError` extends `ValidationError`: 422 `VALIDATION_FAILED`, with `fieldErrors` keyed by C4 field name and `missingFields` in field order.
  - `ShoppingCartEmptyError` is 409 `SHOPPING_CART_EMPTY` with the message "Shopping cart is empty".
  - Both go out through `toHttpError`.
- **D10 — Pre-fill billing from the profile.** `/checkout` loads `GET /api/customers/me` and fills the billing section. A 404 (no profile yet) leaves it blank.
  - Shipping starts blank. A "Same as billing address" checkbox (tasks 1.5) copies billing into shipping and disables the shipping inputs while checked. The payment section is never pre-filled (D6).
- **D11 — Every order creation writes one log line:** `checkout: order <id> placed by account <accountId>, <n> lines, <totalCents> cents` (tasks 16.7). It carries no card data.
- **D12 — Success navigates to `/orders/:id`.** The page reads `GET /api/orders/:id` and renders the confirmation mockup: order number, date, notification email, lines, total, billed-to, shipped-to, and the masked card with its expiry.

- **D13 — The checkout form reports missing fields from the server, not the browser.** The `<form>` sets `noValidate`, so one submission returns every missing or whitespace-only field together (D2), which the summary alert lists. The browser's `required` would stop at the first empty field and let spaces through. Inputs still carry `required` / `aria-required` for assistive technology. This extends the DESIGN.md Forms rule for long, multi-section forms.

### Fixed interface contracts

Peers code against these. A ticket that needs to change one stops and asks planning.

- **C1 — Schema** (`db/schema.ts`, migration `drizzle/0005_*`), with new tables registered in `db/client.ts`:
  - `orders` gains nullable `email`, `cardType` (`card_type`), `cardNumber` (`card_number`) and `cardExpiry` (`card_expiry`, `MM/YYYY`).
  - The new table `orderContacts` = `order_contacts` has `orderId` integer not null → `orders.id` and `role` text not null (`BILL_TO` | `SHIP_TO`). It also has the text columns `familyName`, `givenName`, `address1`, `address2` (nullable), `city`, `stateOrProvince`, `postalCode`, `country`, `telephoneNumber` and `email`, all not null except `address2`. The primary key is (`order_id`, `role`).
- **C2 — `lib/contact-info.ts`:**
  - `interface ContactInfo { familyName; givenName; address1: string; address2: string | null; city; stateOrProvince; postalCode; country; telephoneNumber; email: string }`
  - `CONTACT_INFO_FIELDS`: an ordered list of `{ key: keyof ContactInfo; param: string; label: string; required: boolean }`. The params are `family_name`, `given_name`, `address_1`, `address_2`, `city`, `state_or_province`, `postal_code`, `country`, `telephone_number`, `email`. The labels are the mockup's ("Family name", "Given name", "Address line 1", "Address line 2", "City", "State or province", "Postal code", "Country", "Telephone", "Email").
- **C3 — `lib/credit-card.ts`:**
  - `CHECKOUT_CARD_TYPES = ["Java Card", "Duke Express", "Meow Card"] as const`, with `type CheckoutCardType`
  - `interface CreditCard { cardNumber: string; cardType: CheckoutCardType; expiryDate: string }`
  - `formatExpiry(month: number, year: number): string` gives `"03/2025"`
  - `createCreditCard(cardNumber, cardType, month, year): CreditCard`
  - `maskCardNumber(n): string` gives the last four digits
- **C4 — Request field names**, flat, with `_a` for billing and `_b` for shipping:
  - Address fields: `<param>_a` and `<param>_b` for every C2 param.
  - Card fields: `credit_card_number`, `credit_card_type`, `expiration_month` (`"01"`–`"12"`) and `expiration_year` (four digits).
- **C5 — `lib/errors.ts`** gains:
  - `MissingFormDataError(fieldErrors, missingFields: string[])`, which extends `ValidationError` and carries `missingFields` in `data`.
  - `ShoppingCartEmptyError()`, 409 `SHOPPING_CART_EMPTY`, "Shopping cart is empty".
- **C6 — `lib/checkout-request.ts`:**
  - `extractContactInfo(fields: Record<string, unknown>, suffix: "_a" | "_b", errors: FieldErrorCollector): ContactInfo | null`
  - `extractCreditCard(fields, errors): CreditCard | null`
  - `interface OrderEvent { shipper: ContactInfo /* billTo */; receiver: ContactInfo /* shipTo */; creditCard: CreditCard }`
  - `parseCheckoutRequest(body: unknown): OrderEvent`, which throws one `MissingFormDataError` for every problem found (D2).
  - `FieldErrorCollector` is exported from the same module.
- **C7 — `lib/checkout-cart.ts`:** `getCheckoutLines(cartToken: string | undefined, locale: string, tx: DbOrTx): CartItem[]` throws `ShoppingCartEmptyError` when the cart has no enrichable lines.
- **C8 — `lib/purchase-orders.ts` and `lib/checkout.ts`:**
  - `interface PurchaseOrder { accountId: number; orderDate: Date; emailId: string; billTo: ContactInfo; shipTo: ContactInfo; creditCard: CreditCard; lines: CartItem[]; totalCents: number }`
  - `toPurchaseOrder(accountId, event, lines, now = new Date()): PurchaseOrder` takes `emailId` from `billTo.email`.
  - `insertPurchaseOrder(tx, po): number` returns the new order id.
  - `placeOrder({ accountId, cartToken, locale, event }, outer?): { orderId: number; orderDate: string; email: string }` (D4, D11).
- **C9 — HTTP:**
  - `POST /api/orders` (C4 body) answers `201 { orderId, orderDate, email }`, 401 when signed out, 422 `VALIDATION_FAILED` with `fieldErrors` and `missingFields`, or 409 `SHOPPING_CART_EMPTY`.
  - `GET /api/orders/:id` answers `200 OrderConfirmation`, or 404 for an unknown order or another account's order. `OrderConfirmation` is `{ orderId, orderDate, email, billTo: ContactInfo, shipTo: ContactInfo, card: { cardType, last4, expiryDate }, lines: CartLine[], totalCents }`.
- **C10 — Client:**
  - `src/types/checkout.ts` mirrors `ContactInfo`, `OrderConfirmation`, `CHECKOUT_CARD_TYPES`, `CONTACT_INFO_FIELDS` and the C4 names. A parity test holds it equal to `lib/`.
  - `src/utils/orders-api.ts` exposes `placeOrder(fields: Record<string, string>)` and `getOrder(id)`, both via `apiFetch`.
  - `ORDER_CONFIRMATION_PATH(id) = "/orders/" + id` is in `src/constants/checkout.ts`.

### Phases

1. **Value objects and errors:** CreditCard, ContactInfo, the two errors, cart-line guard, schema and migration.
2. **Request parsing:** addresses, card and the whole order event.
3. **Order placement:** the transactional `placeOrder`, and order-id and date guarantees.
4. **HTTP and security:** `POST /api/orders`, protection lists, cart cookie on `/api/orders`, client binding, and the security suite.
5. **UI:** confirmation page, checkout form, error display and empty-cart state.
6. **Test harness:**
   - Unit tests beside every `lib/` module, run against the in-memory database.
   - Route tests with a real `H3Event`.
   - Testing Library tests for `/checkout`, `/orders/[id]` and the checkout components.
   - `e2e/checkout.spec.ts` signs in, seeds the catalogue with `db/seed-catalog.ts`, fills the cart through `POST /api/cart`, places an order and reads the confirmation.
   - `e2e/cart.spec.ts`'s two `/checkout` tests are updated to sign in first, because `/checkout` becomes protected (D7).
7. **CI:** no workflow change. `.github/workflows/ci.yml` already runs every tier on `vortex/**` pushes and pull requests.

### Spec discrepancies

Recorded here and on the planning ticket. The delta spec is left as extracted.

- **SD1** — Struts actions, `OrderEvent`, `OrderEJBAction` and `struts-config.xml` become the parser (C6), the transactional service (C8) and file-based routes and pages. `OrderEvent` survives as a plain type so the workflow scenarios stay traceable.
- **SD2** — "CMT Required" becomes `withTransaction(fn, outer, { behavior: "immediate" })` (D4).
- **SD3** — `UniqueIdGenerator.getUniqueId("1001")` becomes the `orders.id` autoincrement (D5). No `1001` prefix is applied; the mockup's `1001482` is illustrative.
- **SD4** — Entity bean, Home and Local interfaces become Drizzle tables. There is one `orders` table plus `order_contacts` (D3), not a separate PurchaseOrder store.
- **SD5** — `MissingFormDataException` / `ShoppingCartEmptyOrderException` become the typed errors of C5 and D9. The idea proposed a 400; this repo's convention is 422 for field errors and 409 for state.
- **SD6** — The card types conflict across capabilities. `customer-management` stores Visa, MasterCard or American Express on the profile, while checkout uses Java Card, Duke Express or Meow Card (D6). The mockup's "One card is stored per account" is contradicted by the spec, so the card is stored on the order only and the profile card is untouched.
- **SD7** — The empty-cart message has three texts. The spec says "Shopping cart is empty" (API message, D9). The shopping-cart spec of record requires "The Shopping Cart is Empty and the order could not be placed." on `/checkout`, and that stays. The mockup heading is "Your shopping cart is empty". The page shows the mockup's heading and body plus the spec-of-record alert text, so neither requirement regresses.
- **SD8** — "Use Billing Address for Shipping" (tasks 1.5) is absent from the mockup. It is built as a checkbox at the top of the shipping section (D10).
- **SD9** — New orders start `PENDING` and appear in the admin queue. The PRD's auto-approval under $500 belongs to `order-workflow`, which is out of scope.
- **SD10** — "CSRF protection" (16.4): the session cookie is `SameSite=Lax`, and `POST /api/orders` accepts only JSON (the `apiFetch` content type), so a cross-site form post cannot reach it. No token is added. "SSL/TLS" (16.6) is deployment: the session cookie is already `Secure` in production.
- **SD11** — "Address component integration" (9.5): there is no separate address subsystem. `ContactInfo` rows are snapshots (D3), and pre-fill reads the profile (D10).
- **SD12** — The storefront chrome in the mockups is out of scope: the language switcher, signed-in bar, category nav, cart badge and footer. The checkout, empty-cart and confirmation pages render their main content only.
- **SD13** — "Session rollback on failure" (15.7): the transaction rollback (D4) leaves the cart untouched on any failure. There is no other session state.
- **SD15** — The confirmation shows the card as "<type> ending <last4>" (mockup), where DESIGN.md's stored-card pattern is `•••• 1234`. The mockup wins on this screen; the stored-card pattern is unchanged.
- **SD14** — "Email optional in extraction but required via form" (legacy note): here email is required on both billing and shipping, and validated for shape with the same pattern as `lib/validation.ts`.

### Ticket map and sequencing

There is one TASK per tasks.md group, each with its plan at `artifacts/SWHR3-S-0006/<KEY>/PLAN.md`. `lib/checkout-request.ts`, `lib/checkout.ts` and `src/pages/checkout.tsx` are each shared by several groups, so the chain is mostly serial:

`0092 (G10) → 0091 (G9) → 0093 (G11) → 0089 (G7) → 0090 (G8) → 0084 (G2) → 0085 (G3) → 0086 (G4) → 0087 (G5) → 0088 (G6) → 0095 (G13)`

From 0095 it splits into two branches: `0094 (G12) → 0083 (G1) → 0097 (G15) → 0096 (G14)`, and `0098 (G16)` in parallel. All keys are `SWHR3-T-`.
