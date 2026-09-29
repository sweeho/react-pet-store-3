---
artifact: ticket-plan
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0007
ticket: SWHR3-T-0100
branch: vortex/sprint/swhr3-s-0007-45e84ed1
upstream: [openspec/changes/swhr3-s-0007-bugfix-swhr3-t-0100-post-ap/design.md]
downstream: [artifacts/SWHR3-S-0007/SWHR3-T-0100/tdd-test-result.md]
---

# Plan — SWHR3-T-0100: POST /api/orders accepts non-JSON bodies

Change: `swhr3-s-0007-bugfix-swhr3-t-0100-post-ap`. Requirement: "Order submission accepts only JSON" (`order-checkout`). Read the change's `design.md` first: its Reproduction, Root cause, D1–D4 and C1–C3.

## Objective

`POST /api/orders` refuses every non-JSON content type with 415 before anything is written, and JSON requests behave exactly as before.

## Steps

1. Write the failing tests first (design.md "Test plan"). Add the refused and accepted content-type cases to `routes/api/orders/index.post.test.ts`, asserting the order count, the cart and the absence of a `checkout:` log line. Add `lib/json-body.test.ts` and the new `lib/errors.test.ts` case. Confirm the route cases fail today: urlencoded, `text/plain` and no-header all answer 201.
2. Add `UnsupportedMediaTypeError` to `lib/errors.ts` per D2 / C1.
3. Create `lib/json-body.ts` `readJsonBody` per D1 / D4 / C2.
4. In `routes/api/orders/index.post.ts`, replace `readBody(event)` with `readJsonBody(event)`, keeping `requireSessionUser` first (D3). Change nothing else in the handler.

## File/module ownership

- `lib/errors.ts`, `lib/errors.test.ts` (the new error only)
- `lib/json-body.ts`, `lib/json-body.test.ts`
- `routes/api/orders/index.post.ts`, `routes/api/orders/index.post.test.ts`

The other JSON routes are out of scope (design.md "Follow-ups / out of scope"). Anything outside this list belongs to another change: stop and ask planning.

## Design reference

None. This fix changes no screen.

## Definition of Done

- AC-1 to AC-6 — the ticket's acceptance criteria, each proven by a test named for it. The tasks.md boxes tagged SWHR3-T-0100 are stamped when this ticket merges.
