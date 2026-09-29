# Summary — SWHR3-T-0139

- `lib/supplier-pos.ts`: `createSupplierPOs(tx, orderId, lines, now, options?)` now creates each PO with `options.status` (default PENDING) and `createdAt = now`, and copies the order's SHIP_TO row from `order_contacts` into the PO's contact and address (`telephoneNumber` to `telephone`, address fields as they are). Grouping and delivery dates are unchanged.
- `lib/process-manager.ts`: the one `allocateOrder` call passes `{ status: "PROCESSING" }` (C12), so allocation behaves as before until its rewrite.
- `lib/supplier-pos.test.ts`: covers SWHR3-C-0197, C-0202, C-0203 (AC-1), a two-supplier case, and the updated default-status expectation.

Decision: an order with no SHIP_TO row (orders inserted directly by other tests, not through checkout) gets POs without a contact or address rather than an error. Throwing broke five existing process-manager and workflow tests that this ticket does not own. Orders placed through checkout always have a SHIP_TO row. No UI change.

Verification: red run 5 failed against unchanged code; `bun run verify` exit 0, 902 tests passed. `a2a_run_tests` not used: the project has no testEvidence block.
