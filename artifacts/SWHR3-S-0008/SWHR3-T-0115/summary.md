# Summary — SWHR3-T-0115

- `lib/inventory.ts`: `reserveInventory(tx, orderId, lines)` checks every item's stock (missing row = 0, repeated lines summed) and, only if all are covered, decrements each item and inserts one `inventory_reservations` row per item; otherwise it writes nothing and returns false. `setInventory(itemId, quantity, tx?)` upserts.
- `db/seed-inventory.ts`: `--item <id> --quantity <n>` or `--all <n>` for every catalogue item; JSON `{ itemIds, quantity }` on the last line; exits 1 on bad arguments or an unknown item.
- `lib/inventory.test.ts`: covers SWHR3-C-0173 (AC-1) and the covered, short, missing-row, summed-lines and upsert cases.

Decision: lines for the same item are aggregated, since the reservation table is keyed by (order, item). No UI change.

Verification: red run 6 failed against stubs; `bun run verify` exit 0, 739 tests passed; seed script exercised by hand. `a2a_run_tests` not used: the project has no testEvidence block.
