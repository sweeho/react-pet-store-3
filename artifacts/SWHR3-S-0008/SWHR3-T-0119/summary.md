---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0008
ticket: SWHR3-T-0119
---

# Summary — SWHR3-T-0119

`lib/order-workflow.atomicity.test.ts` proves that placement and allocation are each all-or-nothing (D3, D5, SD3). A declined card, and a failure in `queueOrderConfirmation` after payment was written, each leave no order, contact, line, payment, outbox or stage-history row and the cart intact; `processOrder` given an outer transaction joins it (one `db.transaction` call); a failure in `createSupplierPOs` inside `allocateOrder` leaves inventory, reservations and the stage (CONFIRMED) unchanged, and the order still allocates afterwards.

Files: `lib/order-workflow.atomicity.test.ts` only. No production code changed and no case failed.

Branch note: this branch already carried a partial commit from an earlier attempt (the three placement cases, allocation "pending SWHR3-T-0118"). T-0118 has since merged to the sprint branch, so I merged the sprint branch in and added the allocation cases; the earlier commit's tests are kept as written.

Design: none applies (no UI; PLAN.md says so).

AC coverage: AC-1 by `[SWHR3-C-0166]`, `[SWHR3-C-0175]`, `[SWHR3-C-0176]` and `[SWHR3-C-0177]`. No red run was possible because the behaviour already existed (see tdd-test-result.md).

Verification: `bun run verify` exit 0, 854 tests passed.
