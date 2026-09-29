---
artifact: release-notes
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0008
idea: SWHR3-I-0006
branch: vortex/sprint/swhr3-s-0008-e095f154
upstream: [artifacts/SWHR3-S-0008/qa-test-report.md]
---

# Release notes — SWHR3-S-0008

Orders now move through a fulfilment workflow. Placing an order records a payment authorisation and queues a confirmation. Approving it reserves stock and raises a supplier order. Shipping that supplier order completes it.

## Added

- **Payment step at checkout.**
  - Every order records a payment authorisation. No card is charged and no payment processor is contacted (payment remains out of scope).
  - The test card `4000 0000 0000 0002` is always declined. `/checkout` then shows "Your card was declined. No order was placed.", keeps what was typed, and leaves the cart untouched.
  - The API answers `402 PAYMENT_DECLINED`.

  (SWHR3-T-0112, SWHR3-T-0117, SWHR3-T-0121)

- **Order confirmation queued.** Each placed order stores one confirmation message with its items, total and shipping address, ready for the upcoming customer-email capability. No email is sent yet. (SWHR3-T-0114)
- **Stock and supplier orders on approval.** When an administrator approves an order:
  - If stock is available, it is reserved and a supplier purchase order is created with an expected delivery date seven days out.
  - If stock is short, the order waits and is picked up again when allocation is retried. The approval itself always succeeds.

  (SWHR3-T-0115, SWHR3-T-0116, SWHR3-T-0118)

- **Completion on shipment.** When every supplier order for an order has shipped, with the supplier's tracking number recorded, the order moves to **Completed** and appears in the administrator's Completed tab. (SWHR3-T-0118)
- **Fulfilment progress per order.** Each order tracks its fulfilment stage (Pending, Paid, Confirmed, Allocated, Shipped) with a timestamp for every change. The approval status shown to administrators (Pending, Approved, Denied, Completed) is unchanged. (SWHR3-T-0113, SWHR3-T-0120)

## Upgrade notes

- **Database migration** `drizzle/0006_wild_captain_cross.sql` adds `orders.workflow_stage` (existing orders read `PENDING`), `line_items.supplier_po_id`, and seven tables: `order_stage_history`, `payment_authorizations`, `notification_outbox`, `inventory`, `inventory_reservations`, `supplier_purchase_orders`. The app applies it on start.
- **New operator scripts:**
  - `bun db/seed-inventory.ts --all <n>` (or `--item <id> --quantity <n>`) sets stock. Until stock is seeded, approved orders wait.
  - `bun db/allocate-waiting.ts` re-runs allocation for approved orders that are waiting for stock.
  - `bun db/ship-supplier-po.ts --po <id> --tracking <number>` records a supplier shipment.

## Known limitations

- No real payment is taken (PRD non-goal).
- Orders are not auto-approved under $500; every order still waits for an administrator.
- There is no supplier screen yet. Stock and shipments are recorded with the operator scripts above until the supplier portal ships.
- No confirmation email is sent yet, and there is no customer-facing shipment tracking.
