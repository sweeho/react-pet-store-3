---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0006
ticket: SWHR3-T-0086
branch: vortex/sprint/swhr3-s-0006-d6c77f92
upstream: [openspec/changes/swhr3-i-0005-order-checkout-and-payment/design.md]
downstream: [artifacts/SWHR3-S-0006/SWHR3-T-0086/tdd-test-result.md]
---

# Plan — SWHR3-T-0086: Order Creation Action — parseCheckoutRequest builds the OrderEvent from \_a/\_b fields

Change: `swhr3-i-0005-order-checkout-and-payment`, tasks.md group 4. Requirement(s): "Order processing workflow", "Form field extraction with suffix parameter". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0006)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. Depends on SWHR3-T-0085.

## Objective

`parseCheckoutRequest(body)` turns the whole flat request into an `OrderEvent`, or throws one `MissingFormDataError` for every problem.

## Steps

1. Add the `OrderEvent` type and `parseCheckoutRequest` to `lib/checkout-request.ts` per C6. It rejects a non-object body with an empty field list. It extracts billing with `_a`, shipping with `_b` and the card, all into one collector. If anything was recorded it throws `MissingFormDataError` (C5); otherwise it returns `{ shipper: billTo, receiver: shipTo, creditCard }`.
2. Test: a full body gives an event whose shipper holds the `_a` values and receiver the `_b` values; `_a`-only fields never leak into the receiver; one blank billing city, one blank shipping telephone and one blank card number give a single error listing all three in order.

## File/module ownership

- `lib/checkout-request.ts, lib/checkout-request.test.ts`

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

None. This ticket changes nothing a user sees. The designs for the sprint are under `artifacts/SWHR3-S-0006/design/` (see `MANIFEST.md`).

## Definition of Done

- AC-1
- AC-2
- AC-3 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 4 checkboxes tagged with this key are stamped when it merges.
