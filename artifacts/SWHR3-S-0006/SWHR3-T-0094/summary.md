---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0006
ticket: SWHR3-T-0094
---

# Summary — SWHR3-T-0094

- `lib/order-confirmation.ts`: `getOrderConfirmation(accountId, orderId)` joins `orders`, `order_contacts` and `line_items`, masks the card with `maskCardNumber`, and throws `NotFoundError` for a missing order, another account's order, or an order with no contact snapshots. Line names and attributes come from the catalogue (default locale) because `line_items` stores ids and prices only; an item the catalogue lacks shows its id.
- `routes/api/orders/[id].get.ts`: `requireSessionUser`, integer-only id (else 404), answers the confirmation; 401 signed out, 404 for another account's order.
- `src/pages/orders/[id].tsx`: the confirmation mockup's main content (heading, order number, date, "Notifications sent to", the keep-this-number note, "What you ordered" with lines and total, Billed to / Shipped to, "<type> ending <last4> · Expires MM/YYYY", Continue shopping). A 401 redirects to `/signin?redirect=/orders/<id>`; 404 or a non-numeric id shows a not-found alert.

Design: read `mockup-order-confirmation.html` (and its manifest) and built its main content from existing tokens and primitives; the language bar, signed-in bar, masthead, category nav, breadcrumb, cart badge and footer are out of scope (SD12). Not reproduced: the mockup's check-mark icon and per-line thumbnail icons. The page was not viewed in a browser.

AC coverage: AC-1 by `[SWHR3-C-0126]` (lib, route and page); `[SWHR3-C-0138]` covers the ten contact fields.

Verification: `bun run verify` exit 0 (660 tests), `bun run build` exit 0.
