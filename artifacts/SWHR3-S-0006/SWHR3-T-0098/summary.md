# Summary — SWHR3-T-0098

- `lib/checkout.ts`: the D11 log line now runs after the transaction returns instead of inside it, so a rolled-back standalone order never logs. No card data in it.
- `lib/checkout.test.ts`: log asserted once per order, after commit, and not on failure.
- `routes/api/orders/security.test.ts`: proves the order belongs to the session's account (C-0122), a body account id is ignored (C-0123), signed-out and expired-session posts get 401 and write nothing (C-0124). AC-1 covered.

Gaps: the "account B reads A's order, 404" case needs `GET /api/orders/:id`, which is not on this branch. A form-encoded post creates an order (SD10 says JSON only); raised as defect SWHR3-T-0100 rather than fixing a route outside this ticket's ownership. No UI change, so no design consulted.

Verification: `bun run verify` exit 0, 649 tests passed. `a2a_run_tests` not used: the project has no testEvidence block.
