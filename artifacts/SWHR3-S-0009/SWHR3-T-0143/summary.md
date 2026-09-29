# SWHR3-T-0143 summary

- `lib/supplier-fulfilment.ts`: each attempt on a PENDING PO inserts a `supplier_fulfilment_attempts` row (`FULFILLED`, or `UNABLE` with `detail` = short items JSON) inside the caller's transaction, and logs `supplier: PO <id> <result>` (UNABLE adds the short items). SKIPPED writes nothing.
- `lib/inventory-update.ts`: log format is now `supplier: inventory <item> <before> -> <after>` per update plus one summary line; an unexpected failure is logged with context via `console.error` and rethrown. Logic unchanged.
- Tests: `lib/supplier-fulfilment.test.ts`, `lib/inventory-update.test.ts`.

Deviation: `lib/order-approval.test.ts` (outside the listed ownership) gained one line in its `afterEach` deleting `supplier_fulfilment_attempts` before POs. Allocation now writes attempt rows, and its existing cleanup hit the foreign key. `lib/inventory-update.test.ts` got the same cleanup. Test-only, no behaviour change.

AC coverage: "not deduct inventory and mark item as unable to fulfill" -> SWHR3-C-0207.

Verification: `bun run verify` exit 0 (963 tests passed).
