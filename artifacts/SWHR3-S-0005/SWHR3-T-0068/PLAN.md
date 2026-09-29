---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0005
ticket: SWHR3-T-0068
branch: vortex/sprint/swhr3-s-0005-f1ca395a
upstream: [openspec/changes/swhr3-i-0004-shopping-cart-and-item-mana/design.md]
downstream: [artifacts/SWHR3-S-0005/SWHR3-T-0068/tdd-test-result.md]
---

# Plan — SWHR3-T-0068: Security Configuration — anonymous access to every cart operation

Change: `swhr3-i-0004-shopping-cart-and-item-mana` — tasks.md group 11. Requirement(s): "Cart access control". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0005)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. Depends on SWHR3-T-0069.

## Objective

Every `/api/cart` operation is proven open to anonymous callers and to signed-in customers and administrators alike, with no role check.

## Steps

1. Create `routes/api/cart/access.test.ts`. For each of the five C9 endpoints, drive the route handler with a real `H3Event` and run both `middleware/auth.ts` and `middleware/cart-session.ts` first. Each is called with no session, a customer session and an admin session, and each answers 200 (SD3).
2. Assert `isProtectedApiPath` and `isAdminApiPath` from `lib/protected-resources.ts` are false for `/api/cart` and `/api/cart/EST-1`.
3. Change no production file. If a case fails, stop and raise it to planning rather than altering the access lists.

## File/module ownership

- `routes/api/cart/access.test.ts`

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

None — this ticket changes nothing a user sees. The idea carries no design blocks.

## Definition of Done

- AC-1 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 11 checkboxes tagged with this key are stamped when it merges.
