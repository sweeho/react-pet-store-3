---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0005
ticket: SWHR3-T-0075
---

# Summary — SWHR3-T-0075

Added `routes/api/cart/errors.test.ts`: 11 integration tests through `middleware/cart-session.ts` and the real handlers. They cover bad quantities removing only that item (`"abc"`, `"2.5"`, `""`), missing itemId (422 with `fieldErrors.itemId`, POST and blank DELETE), unknown item on POST (404 `CATALOG_ITEM_NOT_FOUND`), a deleted catalogue item omitted from GET, no cookie and malformed cookie reading empty with no `Set-Cookie`, and 20 concurrent adds leaving one row.

No production code changed: no defect surfaced, so `lib/cart-request.ts` and `lib/cart.ts` are untouched.

AC coverage: AC-1 by `[SWHR3-C-0096]`; `[SWHR3-C-0071]` covers the catalogue-gap path. No red run was possible because the behaviour already existed (see tdd-test-result.md).

Verification: `bun run verify` exit 0, 534 tests passed.
