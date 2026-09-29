---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0005
ticket: SWHR3-T-0071
---

# Summary — SWHR3-T-0071

Added `getItem(itemId, locale, outer?)` in `lib/catalog.ts` (locale details, en_US fallback, `CatalogItemNotFoundError` when the item or all details are missing), the new error in `lib/errors.ts` (404 `CATALOG_ITEM_NOT_FOUND`), and the idempotent seed `db/seed-catalog.ts` (EST-1..EST-4, en_US + ja_JP).

Files: `lib/catalog.ts`, `lib/catalog.test.ts`, `lib/errors.ts`, `lib/errors.test.ts`, `db/seed-catalog.ts`. `CatalogItem` stays declared in `lib/cart-item.ts` (from T-0067) and is re-exported by `lib/catalog.ts`, so no re-pointing was needed.

AC-1 (locale used in lookup): covered by the two `[SWHR3-C-0077]` tests.

Verification: `bun run verify` exit 0, 464 tests passed; seed run twice, output stable.
