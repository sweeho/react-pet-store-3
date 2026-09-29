# Summary — SWHR3-T-0114

Added `lib/notifications.ts`: `ORDER_CONFIRMATION` and `queueOrderConfirmation(tx, orderId)` (C5, D4). It sets the stage to CONFIRMED first (so a non-PAID order throws before anything is written), reads the order with `getOrderRecord`, and inserts one QUEUED outbox row addressed to the order email. The JSON payload is `{ orderId, email, lines: [{ itemId, name, quantity, lineTotalCents }], totalCents, shipTo }`; `name` comes from the en_US catalogue and is omitted when the item is gone. Returns the outbox id.

Files: `lib/notifications.ts`, `lib/notifications.test.ts` (AC-1 via C-0171, plus the not-PAID refusal). No UI change.

Deviation: the test drives `queueOrderConfirmation` directly rather than `processOrder`, which does not exist yet.

Verification: red run 2 failed against the stub; `bun run verify` exit 0, 794 tests passed. `a2a_run_tests` not used: the project has no testEvidence block.
