---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0006
ticket: SWHR3-T-0084
branch: vortex/sprint/swhr3-s-0006-d6c77f92
upstream: [openspec/changes/swhr3-i-0005-order-checkout-and-payment/design.md]
downstream: [artifacts/SWHR3-S-0006/SWHR3-T-0084/tdd-test-result.md]
---

# Plan — SWHR3-T-0084: Web-Tier Address Validation — extractContactInfo with suffix, trimming and optional line 2

Change: `swhr3-i-0005-order-checkout-and-payment`, tasks.md group 2. Requirement(s): "Billing address collection", "Address field validation and error handling". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0006)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. Depends on SWHR3-T-0090.

## Objective

`extractContactInfo(fields, suffix, errors)` reads one address from the flat request (C4) and records every missing or invalid field without throwing.

## Steps

1. Create `lib/checkout-request.ts` with the `FieldErrorCollector` (it records `fieldErrors` by request param and `missingFields` in order) and `extractContactInfo` per C6.
2. It walks `CONTACT_INFO_FIELDS` (C2) and trims every value (D2). An empty required value records "Enter a <label lower-case>."; a whitespace-only one records "Spaces only — enter a <noun>.". A blank `address_2` becomes `null`. The email must match the same pattern as `lib/validation.ts` (SD14). It returns `null` when anything was recorded.
3. Test in `lib/checkout-request.test.ts` (table-driven, `_a` and `_b`): a full address returns trimmed values; a missing `address_2` is null; `"   "` in city is recorded as missing with the spaces-only message; several blanks are all recorded in field order.

## File/module ownership

- `lib/checkout-request.ts, lib/checkout-request.test.ts` (create)

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

None. This ticket changes nothing a user sees. The designs for the sprint are under `artifacts/SWHR3-S-0006/design/` (see `MANIFEST.md`).

## Definition of Done

- AC-1
- AC-2 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 2 checkboxes tagged with this key are stamped when it merges.
