# Summary — SWHR3-T-0142

Proof-only ticket: `lib/supplier-workflow.atomicity.test.ts` shows PO creation and an inventory update with its reprocessing are each all-or-nothing. No production file changed.

- C-0221 (AC-1): a failure in `insertSupplierAddress` during approval rolls back the PO, contact, address, reservation and stage change; a retry then succeeds.
- C-0222 (AC-2): a `processPendingSupplierOrders` failure rolls back every quantity written by `applyInventoryUpdate`.
- C-0223 (AC-2): `applyInventoryUpdate` joins an outer transaction (`db.transaction` called once).

No red run was possible without touching production code; the tests passed on first run, as the plan expects. No UI change.

Verification: `bun run verify` exit 0, 974 tests passed. `a2a_run_tests` not used: the project has no testEvidence block.
