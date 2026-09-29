---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0006
ticket: SWHR3-T-0094
branch: vortex/sprint/swhr3-s-0006-d6c77f92
upstream: [openspec/changes/swhr3-i-0005-order-checkout-and-payment/design.md]
downstream: [artifacts/SWHR3-S-0006/SWHR3-T-0094/tdd-test-result.md]
---

# Plan — SWHR3-T-0094: Order Confirmation — GET /api/orders/:id and the /orders/:id page

Change: `swhr3-i-0005-order-checkout-and-payment`, tasks.md group 12. Requirement(s): "Order email assignment". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0006)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. Depends on SWHR3-T-0095.

## Objective

A shopper who placed an order can read it back at `/orders/:id`. The page shows the confirmation mockup, including the billing email the order was captured with.

## Steps

1. Create `lib/order-confirmation.ts` (+ test) with `getOrderConfirmation(accountId, orderId): OrderConfirmation` per C9. It joins `orders`, `order_contacts` and `line_items` and masks the card with `maskCardNumber`. It throws `NotFoundError` when the order is missing or belongs to another account.
2. Create `routes/api/orders/[id].get.ts` (+ test): it calls `requireSessionUser`, parses the id (non-integer → 404) and returns the confirmation. It answers 401 signed out and 404 for another account's order.
3. Create `src/pages/orders/[id].tsx` (+ test) per the design reference. It loads with `getOrder` (C10), sends a 401 to `/signin?redirect=/orders/<id>`, and shows a not-found alert for a 404.
4. Tests: `email` equals the billing email when shipping has another; the page renders the order number, date, "Notifications sent to <email>", both addresses, lines, total and "Java Card ending 4412 · Expires 03/2029".

## File/module ownership

- `lib/order-confirmation.ts, lib/order-confirmation.test.ts`
- `routes/api/orders/[id].get.ts, routes/api/orders/[id].get.test.ts`
- `src/pages/orders/[id].tsx, src/pages/orders/[id].test.tsx`

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

Build the main content of `artifacts/SWHR3-S-0006/design/mockup-order-confirmation.html` (structure in `artifacts/SWHR3-S-0006/design/wireframe-order-confirmation.html`): the heading "Thank you — your order has been received"; the order number, order date and notification email; "What you ordered" with lines and total; "Billed to" and "Shipped to"; "<type> ending <last4> · Expires MM/YYYY"; and "Continue shopping". Storefront chrome is out of scope (SD12).

## Definition of Done

- AC-1 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 12 checkboxes tagged with this key are stamped when it merges.
