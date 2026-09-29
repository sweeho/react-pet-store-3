---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0006
ticket: SWHR3-T-0090
---

# Summary — SWHR3-T-0090

Extended `orders` with nullable `email`, `card_type`, `card_number`, `card_expiry`, added the `order_contacts` table (PK `order_id` + `role`), registered it in `db/client.ts` and generated `drizzle/0005_slow_nick_fury.sql` with its meta snapshot. Added `lib/purchase-orders.ts`: `PurchaseOrder`, `toPurchaseOrder` (email from billing, name "given family", total in cents) and `insertPurchaseOrder(tx, po)`, which writes the PENDING order, two contact rows and one line item per line through the caller's transaction and returns the id.

Files: `db/schema.ts`, `db/client.ts`, `drizzle/0005_*`, `drizzle/meta/*`, `lib/purchase-orders.ts`, `lib/purchase-orders.test.ts`. Existing `orders` rows and `lib/orders.ts` are untouched.

Deviation (minor): `lib/checkout-request.ts` (`OrderEvent`, C6) does not exist yet, so `toPurchaseOrder` takes a structural `OrderEventInput` (`shipper`, `receiver`, `creditCard`); the later `OrderEvent` fits it as is.

Design: none applies (no UI; PLAN.md says so).

AC coverage: AC-1 by `[SWHR3-C-0106]`; `[SWHR3-C-0125]` covers the email rule.

Verification: `bun run verify` exit 0, 579 tests passed.
