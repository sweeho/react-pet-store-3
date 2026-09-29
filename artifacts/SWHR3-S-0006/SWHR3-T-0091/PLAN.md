---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0006
ticket: SWHR3-T-0091
branch: vortex/sprint/swhr3-s-0006-d6c77f92
upstream: [openspec/changes/swhr3-i-0005-order-checkout-and-payment/design.md]
downstream: [artifacts/SWHR3-S-0006/SWHR3-T-0091/tdd-test-result.md]
---

# Plan — SWHR3-T-0091: Contact Information Integration — ContactInfo value object and field table

Change: `swhr3-i-0005-order-checkout-and-payment`, tasks.md group 9. Requirement(s): "Contact information persistence". Read the change's `design.md` first, from the heading "Rebuild on this repository (sprint SWHR3-S-0006)" down. The decisions (D), contracts (C) and spec discrepancies (SD) cited below live there. Depends on SWHR3-T-0092.

## Objective

`ContactInfo` and the ordered `CONTACT_INFO_FIELDS` table exist per C2. The parser, the entity writer and the form all read field names and labels from it.

## Steps

1. Create `lib/contact-info.ts` per C2: the `ContactInfo` interface and `CONTACT_INFO_FIELDS` (key, request param, mockup label, required flag; only `address2` is optional).
2. Test in `lib/contact-info.test.ts`: the table lists the ten keys of `ContactInfo` in order; exactly `address_2` is optional; the params match C4.

## File/module ownership

- `lib/contact-info.ts, lib/contact-info.test.ts`

Anything outside this list belongs to another ticket. If you need to change it, stop and ask planning.

## Design reference

None. This ticket changes nothing a user sees. The designs for the sprint are under `artifacts/SWHR3-S-0006/design/` (see `MANIFEST.md`).

## Definition of Done

- AC-1 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md group 9 checkboxes tagged with this key are stamped when it merges.
