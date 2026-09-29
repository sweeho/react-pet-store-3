---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0005
ticket: SWHR3-T-0065
branch: vortex/sprint/swhr3-s-0005-f1ca395a
upstream: [openspec/changes/swhr3-i-0004-shopping-cart-and-item-mana/design.md]
downstream: [artifacts/SWHR3-S-0005/SWHR3-T-0065/tdd-test-result.md]
---

# Plan — SWHR3-T-0065: Locale Support — default and per-request locale for catalogue lookups

Change: `swhr3-i-0004-shopping-cart-and-item-mana` — tasks.md group 8. Requirement(s): "Locale-specific product information". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0005)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. Depends on SWHR3-T-0064.

## Objective

Catalogue lookups default to `en_US`, and a route can resolve the caller's locale from the request.

## Steps

1. Create `lib/cart-locale.ts` with `resolveCartLocale(event)` per C7 and D7: `event.context.locale ?? DEFAULT_CART_LOCALE`.
2. Confirm `getItems` and `getSubTotalCents` default their `locale` parameter to `DEFAULT_CART_LOCALE` in `lib/cart.ts`.
3. Test in `lib/cart-locale.test.ts` with a real `H3Event`: no context locale gives `en_US`; `ja_JP` in context gives `ja_JP`. Extend `lib/cart.test.ts`: with `en_US` and `ja_JP` detail rows, `getItems(t)` returns the English name and `getItems(t, "ja_JP")` the Japanese one (SD6).

## File/module ownership

- `lib/cart-locale.ts, lib/cart-locale.test.ts`
- `lib/cart.ts` (locale defaults only)
- `lib/cart.test.ts`

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

None — this ticket changes nothing a user sees. The idea carries no design blocks.

## Definition of Done

- AC-1 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 8 checkboxes tagged with this key are stamped when it merges.
