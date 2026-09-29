# Shopping Cart Design

## User Interface

Two screen records were extracted for this capability. Their visible contracts are specified in specs/shopping-cart/spec.md as requirements.

## Architecture Overview

The shopping cart is implemented as a stateful session bean component managing a HashMap of cart items during the user's session:

1. **Web Tier**: CartHTMLAction parses HTTP requests and creates CartEvent objects
2. **Business Tier**: CartEJBAction dispatches events to ShoppingCartLocalEJB methods
3. **Session Tier**: ShoppingCartLocalEJB maintains stateful HashMap of itemId → quantity
4. **Data Enrichment**: CatalogHelper looks up product details for display
5. **Presentation Tier**: cart.jsp renders items with editable quantities and action links

### Cart Workflow

1. **Add Item**: User selects "purchase" action, item added with quantity 1 or specified quantity
2. **View Cart**: Cart screen displays all items with quantities, unit prices, and line totals
3. **Update Quantities**: User modifies quantity inputs and submits "update" form
4. **Remove Items**: User clicks remove link for individual item or quantity set to 0
5. **Checkout**: User clicks "Check Out" link to proceed to order entry when cart non-empty
6. **Empty Cart**: Entire cart cleared with single operation

### Key Components

**ShoppingCartLocalEJB** (Stateful Session Bean):

- Maintains HashMap of itemId → quantity pairs
- Provides addItem(itemId), addItem(itemId, qty), deleteItem(itemId), updateItemQuantity(itemId, qty)
- Methods: getItems() (enriched with catalog details), getSubTotal(), getCount(), empty()
- Supports locale for product information retrieval via setLocale()

**CartHTMLAction** (Web Action):

- Parses request parameters for actions: "purchase", "remove", "update"
- Extracts itemId, quantity, and parameters matching pattern "itemQuantity\_"
- Creates CartEvent objects for routing to EJB tier
- Handles NumberFormatException from quantity parsing (defaults to 0)

**CartEJBAction** (EJB Action):

- Receives CartEvent from HTML tier
- Dispatches to appropriate ShoppingCartLocalEJB methods based on action type
- Handles ADD_ITEM, DELETE_ITEM, UPDATE_ITEMS, EMPTY event types

**CartItem** (Value Object):

- Contains itemId, productId, category, name, attribute, quantity, unitCost
- Calculated property: totalCost = quantity × unitCost
- Used for display in cart.jsp

**CatalogHelper** (Integration):

- Called by getItems() to look up Item details by itemId
- Passed locale to support multi-language product names
- Catches CatalogException and continues (skips item silently if lookup fails)

**LineItemEJB** (CMP 2.x Entity Bean):

- Container-Managed Persistence entity storing order line items
- Fields: categoryId, productId, itemId, lineNumber, quantity, unitPrice, quantityShipped
- Used in order processing, related to shopping cart through product references

### Data Model

**Shopping Cart State** (In-Memory):

- HashMap<itemId, quantity> stored in ShoppingCartLocalEJB
- Per-session; cleared on session timeout
- No persistent storage within cart component

**CartItem** (Display Model):

- itemId, productId, category, name, attribute, quantity, unitCost
- Transient value object constructed from cart state + catalog lookup

**LineItem** (Persistent):

- CMP entity with seven fields capturing order line details
- Created when order is placed from cart items

### Transactions

All cart-modifying operations execute within container-managed transactions with Required attribute:

- addItem (both overloads)
- deleteItem
- updateItemQuantity
- empty
- setLocale

Read-only operations also transactional: getItems, getSubTotal, getCount

### Security

All shopping cart operations declared as unchecked in ejb-jar.xml, meaning no role-based access control. Any authenticated or anonymous user may perform cart operations.

### Notable Implementation Details

- Quantity field maxlength="10" in JSP allows values up to 9,999,999,999 with no validation
- NumberFormatException in quantity parsing defaults to quantity 0, triggering removal
- CatalogException during getItems() is caught and logged to System.out, item skipped silently
- Stateful session bean timeout and replication policy not visible in component source
- addItem(itemId, qty) overload defined in implementation but not in ShoppingCartLocal interface
- Empty cart condition checked only in presentation; enforcement may also be in order-entry tier

## Key Files

- **Session Bean**: ShoppingCartLocalEJB.java, ShoppingCartLocal.java, ShoppingCartLocalHome.java
- **Web Action**: CartHTMLAction.java
- **EJB Action**: CartEJBAction.java
- **Value Object**: CartItem.java
- **Entity Bean**: LineItemEJB.java
- **View**: cart.jsp
- **Configuration**: ejb-jar.xml, struts-config.xml

---

## Rebuild on this repository (sprint SWHR3-S-0005)

Everything above this heading was extracted from the legacy system and describes what it did. Everything below records how this repository delivers it. Implementation tickets read this section first. It cites decisions as `D`, fixed interface contracts as `C` and spec discrepancies as `SD`.

### Codebase findings

- **Stack patterns already in place.** Server logic shared by more than one caller lives in `lib/` and throws typed errors from `lib/errors.ts`; route handlers catch and convert with `toHttpError` (see `routes/api/admin/orders/status.post.ts`). The idea snapshot's "no repository layer, `middleware/auth.ts` is a stub" is stale: follow the `lib/` service pattern.
- **Transactions.** `lib/transaction.ts` `withTransaction(fn, outer?, options?)` already gives `Required` semantics: it joins an outer transaction or starts its own. It was built for exactly this legacy CMT model.
- **Sessions and locale.** `lib/session.ts` seals `{ accountId, username, locale, lastSeen }` into `petstore_session`; `middleware/auth.ts` sets `event.context.user` and `event.context.locale` for an active session only. `AUTH_CONFIG.defaultLocale` is `"en_US"`. `startSession` always seals the default locale today, so `customers.locale` never reaches the session.
- **Access control.** `lib/protected-resources.ts` protects an exact-match list (`/api/customers`, `/api/customers/me`) plus the `/api/admin/` prefix. `/api/cart` is in neither, so it is anonymous with no change.
- **Data.** `db/schema.ts` has `users`, `accounts`, `customers`, `credit_cards`, `orders`. Migrations `drizzle/0000`–`0003` exist; the next is `0004`. `db/client.ts` registers tables in its Drizzle `schema` object and runs migrations on import; under Vitest it is in-memory. Money is integer cents (`orders.total_cents`, ARCHITECTURE.md Key Decisions).
- **No catalogue exists.** There is no products or items table, and no page to add from. `catalog-browsing` is a later capability.
- **Client.** Every call goes through `apiFetch` in `src/utils/api.ts`. Domain widgets live under `src/components/<area>/` (see `src/components/admin/orders-table.tsx`), and primitives come from `src/components/ui/` (`Table`, `Input`, `Button`, `Alert`). Client mirrors of server values live in `src/types/` and `src/constants/`.
- **Tests.** Route tests build a real `H3Event` (`routes/api/users/index.get.test.ts`); `routes/`, `middleware/` and `lib/` tests run in the Vitest server project. E2E seeds data by spawning Bun operator scripts (`e2e/order-approval.spec.ts` → `db/seed-orders.ts`).
- **CI.** `.github/workflows/ci.yml` already triggers on push and pull request to `vortex/**`, `dev` and `main`, and runs doc links, typecheck, lint, unit, build and Playwright E2E. New specs are picked up with no workflow change.

### Decisions

- **D1 — Cart state is rows, keyed by an anonymous cart cookie.** `cart_items(session_token, item_id, quantity)`, unique on `(session_token, item_id)`. The token is a random UUID in its own httpOnly cookie `petstore_cart` (sameSite lax, path `/`, `Secure` in production, no `maxAge`: it lives for the browser session). It is separate from `petstore_session`, so signing in or out neither loses nor transfers the cart. `middleware/cart-session.ts` resolves it for `/api/cart*` paths and mints one only on a write (not GET/HEAD). A missing cart is an empty cart; there is no parent `carts` table.
- **D2 — Every cart operation runs in `withTransaction`.** Each `lib/cart.ts` function takes an optional `outer?: DbOrTx` and runs its statements through `withTransaction(fn, outer)`. `applyCartAction` (C5) opens one immediate-mode transaction for the whole action, so an `UPDATE_ITEMS` batch commits or rolls back as a unit.
- **D3 — A minimal catalogue, owned by `lib/catalog.ts`.** `catalog_items(item_id PK, product_id, category, unit_cost_cents)` and `catalog_item_details(item_id, locale, name, attribute)`, keyed on `(item_id, locale)`. This mirrors the legacy item / item_details split. `getItem(itemId, locale)` falls back to `en_US` details when the requested locale has none. It throws `CatalogItemNotFoundError` when neither the item nor any detail row exists. `catalog-browsing` later extends these tables and this module; it does not replace them. `db/seed-catalog.ts` is the operator/E2E seed.
- **D4 — `cart_items.item_id` is not a foreign key.** A cart row whose item has left the catalogue is the spec's "catalog lookup failure": `getItems` logs it with `console.warn` and skips it. `POST /api/cart` does refuse an item the catalogue does not have (404), so a shopper cannot add one.
- **D5 — Re-adding an item sets its quantity; it does not increment.** This follows legacy `HashMap.put`. Updating to a positive quantity upserts. Zero or negative deletes.
- **D6 — Money is integer cents end to end.** `unitCostCents` and `totalCostCents` are integers; dollars are derived as `cents / 100` only where the spec asks for a dollar value (C3). The page formats with `Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })`.
- **D7 — Locale is resolved per request, not stored on the cart.** `resolveCartLocale(event)` returns `event.context.locale ?? DEFAULT_CART_LOCALE` (`"en_US"`). It is passed to every `getItem` lookup.
- **D8 — The legacy event dispatch becomes a typed union.** `CartHTMLAction` becomes `lib/cart-request.ts`, which turns an HTTP request into a `CartAction`. `CartEJBAction` becomes `applyCartAction` in `lib/cart-actions.ts`. Every mutating route is `parse → applyCartAction → CartView`.
- **D9 — Every cart route answers with the whole `CartView`.** The page re-renders from the response, and the server is the source of truth. There is no client store.
- **D10 — `/checkout` is a guard placeholder.** `order-checkout` does not exist yet. `/checkout` reads the cart: empty shows the empty-cart checkout error; populated shows an "Enter Order Information" heading. `order-checkout` replaces the populated branch.
- **D11 — `line_items` is defined now and written by nobody.** The table keys on `(order_id → orders.id, line_number)` and holds the seven spec fields (`unit_price_cents` for `unitPrice`, `quantity_shipped` default 0). `order-checkout` becomes its writer.

### Fixed interface contracts

Peers code against these. A ticket that needs to change one stops and asks planning.

- **C1 — Schema (`db/schema.ts`, migration `drizzle/0004_*`)**, each table registered in `db/client.ts`'s `schema` object:
  - `cartItems` = `cart_items`: `id` integer PK autoincrement; `sessionToken` text not null; `itemId` text not null; `quantity` integer not null; unique index on (`session_token`, `item_id`).
  - `catalogItems` = `catalog_items`: `itemId` text PK; `productId`, `category` text not null; `unitCostCents` integer not null.
  - `catalogItemDetails` = `catalog_item_details`: `itemId` text not null → `catalog_items.item_id`; `locale`, `name`, `attribute` text not null; PK (`item_id`, `locale`).
  - `lineItems` = `line_items`: `orderId` integer not null → `orders.id`; `lineNumber` integer not null; `categoryId`, `productId`, `itemId` text not null; `quantity` integer not null; `unitPriceCents` integer not null; `quantityShipped` integer not null default 0; PK (`order_id`, `line_number`).
- **C2 — `lib/cart.ts`** (every function takes a trailing optional `outer?: DbOrTx`; a `sessionToken` of `undefined` reads as an empty cart and writes nothing):
  - `CART_COOKIE_NAME = "petstore_cart"`, `DEFAULT_CART_LOCALE = "en_US"`
  - `type CartDetails = Record<string, number>` (itemId → quantity)
  - `getDetails(sessionToken): CartDetails` returns a fresh object (a copy), `{}` when empty
  - `addItem(sessionToken, itemId, quantity = 1): void` rejects a quantity that is not a positive integer with `ValidationError({ quantity })`
  - `deleteItem(sessionToken, itemId): void` is a no-op when absent
  - `updateItemQuantity(sessionToken, itemId, quantity): void` deletes when `quantity <= 0`, otherwise upserts
  - `getItems(sessionToken, locale = DEFAULT_CART_LOCALE): CartItem[]` returns items in insertion order and skips (with `console.warn`) any item `getItem` throws for
  - `getSubTotalCents(sessionToken, locale?): number` is the sum of `cartItemTotalCostCents`, `0` when empty
  - `getCount(sessionToken): number` counts distinct itemIds
  - `empty(sessionToken): void` is one `DELETE ... WHERE session_token = ?`
- **C3 — `lib/cart-item.ts`:** `interface CartItem { itemId; productId; category; name; attribute: string; quantity: number; unitCostCents: number }`; `createCartItem(item: CatalogItem, quantity: number): CartItem`; `cartItemTotalCostCents(i) = i.quantity * i.unitCostCents`; `cartItemUnitCost(i) = i.unitCostCents / 100`; `cartItemTotalCost(i) = cartItemTotalCostCents(i) / 100` (5 × 1999 → `99.95`).
- **C4 — `lib/catalog.ts`:** `interface CatalogItem { itemId; productId; category; name; attribute: string; unitCostCents: number }`; `getItem(itemId: string, locale: string, outer?: DbOrTx): CatalogItem`. `lib/errors.ts` gains `CatalogItemNotFoundError` (code `CATALOG_ITEM_NOT_FOUND`, status 404).
- **C5 — `lib/cart-actions.ts`:** `type CartAction = { type: "ADD_ITEM"; itemId: string; quantity?: number } | { type: "DELETE_ITEM"; itemId: string } | { type: "UPDATE_ITEMS"; items: Record<string, number> } | { type: "EMPTY" }`; `applyCartAction(sessionToken: string, action: CartAction, outer?: DbOrTx): void`.
- **C6 — `lib/cart-request.ts`:** `ITEM_QUANTITY_FIELD_PREFIX = "itemQuantity_"`
  - `parseQuantity(value: unknown): number` returns an integer, or `0` for anything that is not a whole-number string or integer (legacy `NumberFormatException` → 0)
  - `parseAddRequest(body): CartAction` (`ADD_ITEM`)
  - `parseRemoveRequest(itemId: string | undefined): CartAction` (`DELETE_ITEM`)
  - `parseUpdateRequest(body): CartAction` (`UPDATE_ITEMS` from every `itemQuantity_<itemId>` key)
  - A missing or blank itemId throws `ValidationError({ itemId })`
- **C7 — `lib/cart-locale.ts`:** `resolveCartLocale(event: H3Event): string`.
- **C8 — `middleware/cart-session.ts`:** sets `event.context.cartSession?: string` (module augmentation) for pathnames starting `/api/cart`. A cookie value that is not a UUID reads as absent.
- **C9 — HTTP API.** Every endpoint answers `200 CartView` or a `toHttpError` body. `CartView = { items: CartLine[]; subtotalCents: number; count: number; locale: string }` and `CartLine = CartItem & { totalCostCents: number }`.
  - `GET /api/cart`
  - `POST /api/cart` with body `{ itemId, quantity? }` (404 `CATALOG_ITEM_NOT_FOUND`, 422 `VALIDATION_FAILED`)
  - `PUT /api/cart` with body `{ "itemQuantity_<itemId>": value, ... }`
  - `DELETE /api/cart/:itemId`
  - `DELETE /api/cart`
- **C10 — Client.**
  - `src/types/cart.ts` mirrors `CartView` / `CartLine`.
  - `src/constants/cart.ts`: `CART_PATH = "/cart"`, `CHECKOUT_PATH = "/checkout"`, `EMPTY_CART_MESSAGE = "Your Shopping Cart is Empty"`, `EMPTY_CART_CHECKOUT_MESSAGE = "The Shopping Cart is Empty and the order could not be placed."`
  - `src/utils/cart-api.ts`: `getCart()`, `addToCart(itemId, quantity?)`, `updateCart(fields: Record<string, string>)`, `removeFromCart(itemId)`, `emptyCart()`, each `Promise<CartView>` via `apiFetch`.

### Phases

1. **Data and identity:** schema, migration, cart cookie, cart state reader, value object, catalogue module and seed.
2. **Cart service:** add, remove, update, enrich, subtotal, count, locale, empty in `lib/cart.ts`, each transactional.
3. **Dispatch and HTTP:** `applyCartAction`, request parsing, the five routes, then the anonymous-access and error-handling suites against them.
4. **UI:** client API, constants, `/checkout` guard, then the `/cart` page.
5. **Test harness:**
   - Unit tests beside every `lib/` module, against the in-memory db.
   - Route tests with a real `H3Event` beside every handler.
   - A Testing Library test for `/cart`, `/checkout` and the cart table.
   - `e2e/cart.spec.ts`, which seeds the catalogue by spawning `db/seed-catalog.ts` under Bun, the same way `e2e/order-approval.spec.ts` seeds orders.
6. **CI:** no workflow change. `.github/workflows/ci.yml` already runs every tier on `vortex/**` pushes and pull requests, and picks up the new unit, route and E2E specs automatically. A ticket is done when that run is green.

### Spec discrepancies

Recorded here and on the planning ticket. The delta spec is left as extracted.

- **SD1** — "Stateful session bean / empty HashMap" (tasks 1.x): there are no EJBs. State is `cart_items` rows keyed by the cart cookie (D1). "Initialized empty" means no rows, and `getDetails` returns `{}`. `ejb-jar.xml`, `ShoppingCartLocal` and `ShoppingCartLocalHome` have no counterpart; `lib/cart.ts`'s exports are the interface.
- **SD2** — "trans-attribute=Required": there is no container. `withTransaction(fn, outer)` provides the same join-or-start semantics (D2).
- **SD3** — "method-permission unchecked": there is no descriptor. `/api/cart` is simply outside `lib/protected-resources.ts` and `/api/admin/`, so no middleware change is needed.
- **SD4** — `CartEvent` / `CartHTMLAction` / `CartEJBAction` / Struts: replaced by C5, C6 and file-based routes (D8).
  - The single `cart.do` endpoint with `action=purchase|remove|update` becomes REST methods on `/api/cart`.
  - The scenario "submit the form with action="cart.do" and action="update"" is met by `PUT /api/cart` carrying the form's `itemQuantity_<itemId>` fields.
  - `struts-config.xml` forwards become the `/cart` and `/checkout` pages; its exception handlers become `toHttpError`.
- **SD5** — `CatalogHelper` / `CatalogException`: there is no catalogue. A minimal one owned by `lib/catalog.ts` stands in (D3). `CatalogException` becomes `CatalogItemNotFoundError`; "logged to System.out" becomes `console.warn`.
- **SD6** — `Locale.US` / `setLocale`: locales are strings (`"en_US"`), resolved per request from the session (D7); nothing stores a locale on a cart.
  - Today every session carries `en_US`, because `startSession` seals the default and not `customers.locale`. So a non-default locale is exercised at the `lib/` level (`getItems(token, "ja_JP")`), not end to end. Wiring the profile locale into the session belongs to a later i18n change.
- **SD7** — `unitCost (double)` and `getTotalCost() = 99.95`: money is integer cents (D6). The dollar value is derived: `cartItemTotalCost` returns `99.95` for 5 × 1999 cents without floating-point drift.
- **SD8** — "LineItem CMP 2.x entity with abstract getters": this is a Drizzle table (D11). The seven fields are its columns, and `unitPrice` is stored as `unit_price_cents`. Nothing writes it this sprint.
- **SD9** — "enter_order_information.screen": `/checkout` does not exist yet, so a guard placeholder stands in (D10).
- **SD10** — Re-adding an item already in the cart is unspecified. Legacy `HashMap.put` replaced the quantity, and D5 keeps that.
- **SD11** — "Session timeout" (18.4): a cart cookie is a browser-session cookie, independent of the 30-minute sign-in idle timeout. Orphaned `cart_items` rows are never purged; that is raised as an improvement, not built.
- **SD12** — "Concurrent access in a clustered environment" (18.5): there is one SQLite database. The unique index plus upsert keeps concurrent adds of one item to one row, and that is what is tested.
- **SD13** — "addItem(itemId, qty) missing from the local interface": not applicable, since both call shapes are exported.
- **SD14** — Updating a quantity for an item not yet in the cart adds it. This is legacy remove-then-put behaviour, reachable only through a hand-built `PUT`, and kept.

### Ticket map and sequencing

There is one TASK per tasks.md group. Each has its plan at `artifacts/SWHR3-S-0005/<KEY>/PLAN.md`. Seven tickets extend `lib/cart.ts` and `lib/cart.test.ts`, so most tickets run in sequence. Only tickets with disjoint file sets branch off the chain.

`0058 (G1) → 0067 (G10) → 0071 (G14) → 0059 (G2) → 0060 (G3) → 0061 (G4) → 0062 (G5) → 0063 (G6) → 0064 (G7) → 0065 (G8) → 0066 (G9) → 0070 (G13) → 0069 (G12)`, then from 0069 three branches run in parallel: `0068 (G11)`, `0075 (G18)` and `0073 (G16) → 0072 (G15) → 0074 (G17)`. All keys are `SWHR3-T-`.
