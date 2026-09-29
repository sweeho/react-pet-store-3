# Summary — SWHR3-T-0122

- `lib/order-processing.concurrency.test.ts`: C-0184 (AC-1). Ten concurrent placements keep their own account and billing email, each with one payment and one outbox row. Passed.
- `e2e/order-workflow.spec.ts`: C-0157 browser order and confirmation; C-0168 declined card places no order and leaves the cart full; C-0181 approve, seed inventory, ship the PO, see the order under the Completed tab. Seeds and ships through the Bun operator scripts; finds the order's PO id with a `bun -e` call to `getOrderRecord`.

**The E2E spec has not been run.** Playwright's Chromium is not installed in this container, so `bun run test:e2e` stops at its preflight. Selectors and dialog wording were copied from `e2e/checkout.spec.ts` and `e2e/order-approval.spec.ts` (including the "Commit 1 decision" button text, inferred from their plural form). QA/CI must confirm it.

No production file changed, so there was no red run. No UI change.

Verification: `bun run verify` exit 0, 855 tests passed. `a2a_run_tests` not used: the project has no testEvidence block.
