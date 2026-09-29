---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0009
ticket: SWHR3-T-0135
---

# Summary — SWHR3-T-0135

Added `routes/api/supplier/inventory.get.ts`: `GET /api/supplier/inventory` answers `{ items: getInventory() }` (every catalogue item with its quantity, 0 when unstocked, in item order), with errors through `toHttpError`. Access is not checked in the handler: the supplier-only rule is the `/api/supplier/` prefix in `middleware/auth.ts` (D1, already in place), which reads the role from the db on every request.

Files: `routes/api/supplier/inventory.get.ts`, `routes/api/supplier/inventory.get.test.ts`.

Design: none applies (no UI; PLAN.md says so). The supplier sign-in mockup named in the prompt belongs to a later ticket.

AC coverage: AC-1 by `[SWHR3-C-0227]`; `[SWHR3-C-0224]` and `[SWHR3-C-0225]` prove the role enforcement (401, 403 for customer and admin, revoked role on the next request, supplier 403 on the admin API).

Verification: `bun run verify` exit 0 (886 tests), `bun run build` exit 0.
