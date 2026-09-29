---
artifact: sprint-summary
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0005
idea: SWHR3-I-0004
branch: vortex/sprint/swhr3-s-0005-f1ca395a
upstream:
  [
    artifacts/SWHR3-S-0005/SPRINT-PLAN.md,
    artifacts/SWHR3-S-0005/qa-test-report.md,
    artifacts/SWHR3-S-0005/integration-test-result.md,
    artifacts/SWHR3-S-0005/integration-defects-resolution.md,
  ]
downstream: [artifacts/SWHR3-S-0005/release-notes.md]
---

# Sprint summary — SWHR3-S-0005

Sprint goal: "SWHR3-I-0004: Shopping Cart and Item Management". **Met.** All 18 implementation TASKs reached DONE, and integration QA returned PASS: 33 scenarios pass, 6 are not-testable by design, 0 fail, and no integration defects were found.

## Tickets

The plan is change `swhr3-i-0004-shopping-cart-and-item-mana`. Its `design.md` section "Rebuild on this repository (sprint SWHR3-S-0005)" holds the decisions (D1–D11), contracts (C1–C10) and spec discrepancies (SD1–SD14). Per-ticket steps and outcomes are in `artifacts/SWHR3-S-0005/<TICKET-KEY>/` (`PLAN.md`, `summary.md`, `tdd-test-result.md`).

| Ticket       | Type  | Title                                                                              | Outcome     |
| ------------ | ----- | ---------------------------------------------------------------------------------- | ----------- |
| SWHR3-T-0055 | TASK  | Sprint plan — SWHR3-S-0005                                                         | DONE        |
| SWHR3-T-0056 | EPIC  | Shopping Cart and Item Management                                                  | DONE        |
| SWHR3-T-0057 | STORY | A shopper can add, review, change and remove cart items and proceed to checkout    | DONE        |
| SWHR3-T-0058 | TASK  | Shopping Cart Session Bean — schema, cart cookie and cart state                    | DONE (#44)  |
| SWHR3-T-0067 | TASK  | CartItem Value Object — CartItem type, totals, client CartView mirror              | DONE (#45)  |
| SWHR3-T-0071 | TASK  | Catalog Integration — `getItem(itemId, locale)` and catalogue seed                 | DONE (#46)  |
| SWHR3-T-0059 | TASK  | Item Addition Operations — addItem                                                 | DONE (#47)  |
| SWHR3-T-0060 | TASK  | Item Removal Operations — deleteItem                                               | DONE (#48)  |
| SWHR3-T-0061 | TASK  | Quantity Update Operations — updateItemQuantity                                    | DONE (#49)  |
| SWHR3-T-0062 | TASK  | Cart Retrieval and Enrichment — getItems                                           | DONE (#50)  |
| SWHR3-T-0063 | TASK  | Cart Calculations — subtotal                                                       | DONE (#51)  |
| SWHR3-T-0064 | TASK  | Item and Cart Counts — getCount                                                    | DONE (#52)  |
| SWHR3-T-0065 | TASK  | Locale Support — `resolveCartLocale`                                               | DONE (#53)  |
| SWHR3-T-0066 | TASK  | Cart Clearing — empty                                                              | DONE (#54)  |
| SWHR3-T-0070 | TASK  | EJB Tier Action Handler — `applyCartAction` in one transaction                     | DONE (#55)  |
| SWHR3-T-0069 | TASK  | Web Tier Action Handler — request parsing and the `/api/cart` routes               | DONE (#56)  |
| SWHR3-T-0075 | TASK  | Error Handling — invalid input, catalogue failure, missing cookie, concurrent adds | DONE (#57)  |
| SWHR3-T-0068 | TASK  | Security Configuration — anonymous access                                          | DONE (#58)  |
| SWHR3-T-0073 | TASK  | Struts Configuration — cart client API, constants and `/checkout` guard            | DONE (#59)  |
| SWHR3-T-0072 | TASK  | Cart Display View — the `/cart` page                                               | DONE (#60)  |
| SWHR3-T-0074 | TASK  | Integration Testing — end-to-end cart workflow                                     | DONE (#61)  |
| SWHR3-T-0078 | TASK  | Integration QA report — SWHR3-S-0005                                               | DONE (#62)  |
| SWHR3-T-0079 | TASK  | Sprint close bundle — SWHR3-S-0005                                                 | This ticket |

## What shipped

An anonymous, session-scoped shopping cart. The code change is 48 files and about 3,550 lines added, most of it tests.

- **Data:** migration `drizzle/0004_perpetual_katie_power.sql` adds four tables:
  - `cart_items`: quantity only, unique on (cart token, item).
  - `catalog_items` / `catalog_item_details`: a minimal catalogue with per-locale name and attribute.
  - `line_items`: seven fields, no writer yet; checkout will write it.
- **Service:** `lib/cart.ts` runs every operation inside `withTransaction`: add (default quantity 1), remove, update (0 or less removes), items enriched from the catalogue, subtotal in integer cents, distinct-item count, and empty.
  - `lib/cart-actions.ts` applies each action in one immediate-mode transaction, so an update batch commits or rolls back whole.
  - `lib/catalog.ts` looks items up by locale and falls back to `en_US`. A cart item missing from the catalogue is logged and skipped.
- **Identity:** `middleware/cart-session.ts` gives each browser its own httpOnly `petstore_cart` cookie, minted on the first write. It is independent of sign-in, and `/api/cart*` has no role check.
- **API:** `GET`, `POST`, `PUT`, `DELETE /api/cart` and `DELETE /api/cart/:itemId`. Every endpoint answers with the whole cart: items, subtotal in cents, count and locale. A non-numeric quantity counts as 0 and removes the item. An unknown item answers 404 `CATALOG_ITEM_NOT_FOUND`.
- **UI:** `/cart` shows an empty message, or a table with name and attribute, an `itemQuantity_<itemId>` input, Remove, unit price, line total, subtotal, Update Cart and Check Out. `/checkout` is a guard: an empty cart shows "The Shopping Cart is Empty and the order could not be placed."; a populated cart shows an "Enter Order Information" placeholder.
- **Test support:** `db/seed-catalog.ts` seeds EST-1…EST-4 in `en_US` and `ja_JP`. `e2e/cart.spec.ts` covers 6 journeys.

**Root docs are unchanged at close.** Planning (SWHR3-T-0055) already updated `ARCHITECTURE.md` with the cart, catalogue and line-item entities, the anonymous cart cookie and two Key Decisions, and the shipped code matches it. `PRODUCT.md` already lists the `shopping-cart` capability. The UI is built from existing primitives and tokens, so no `DESIGN.md` trigger fired.

## Divergence from plan

All divergences are minor and recorded in each ticket's `summary.md`.

- **Helper placement (T-0069).** `buildCartView` and `applyRequestAction` live in `lib/cart-request.ts` rather than a new file. A non-test helper under `routes/` would have been registered as a route.
- **Type placement (T-0071).** `CatalogItem` stays declared in `lib/cart-item.ts` and is re-exported by `lib/catalog.ts`, instead of being moved. `lib/cart.ts` and `lib/catalog.ts` import each other; this is safe because both imports are used only at call time.
- **Route-level cases, first half of the chain.** Cases written against `/api/cart` (C-0053, C-0056, C-0058, C-0062, C-0075) were linked to lib tickets that ran before any route existed. Those tickets covered them at lib/middleware level, and T-0069 covered them at route level.
- **Test placement (T-0065, T-0070).** T-0065 put its locale tests in `lib/cart-locale.test.ts`. T-0070 forced its rollback case with a non-integer quantity instead of a spy.
- **Additions beyond the plan (T-0072, T-0073).** Both pages show an alert when loading the cart fails. `/checkout` also shows an empty busy `main` while loading.

## Verification

**PASS** at sprint head 5efaedf:

- `bun run verify` passes 561/561 unit tests across 91 files, and `bun run build` exits 0.
- Playwright passes 28/28, 6 of them cart journeys.
- 33 of 39 scenarios pass. The other 6 describe EJB/Struts/CMP internals (HashMap, CartEvent, CMP) and are marked not-testable, with the behaviour covered by equivalent tests per SD1, SD4 and SD8.

See `qa-test-report.md`, `integration-test-result.md` and `integration-defects-resolution.md`.

## Follow-ups / out of scope

- **SWHR3-T-0076 (improvement, backlog):** orphaned anonymous `cart_items` rows are never purged (SD11).
- **SWHR3-T-0077 (improvement, backlog):** sessions always carry `en_US`, so non-English catalogue names reach no shopper yet (SD6).
- **Out of scope:**
  - The catalogue UI (`catalog-browsing`). Items reach a cart only through `POST /api/cart`.
  - Real checkout (`order-checkout`), which replaces the `/checkout` placeholder and writes `line_items`.
  - Merging a cart into an account at sign-in.
- **Environment (not filed):** containers ship Chromium 1223 but the repo pins Playwright 1.50 (Chromium 1155). T-0074 could not execute its own spec, and QA ran E2E through a symlinked browser path outside the repo.

## Retrospective

These points are judgment, not measured fact.

- **Went well:** the fixed contracts (C1–C10) and the spec-discrepancy table held. 18 TASKs merged in sequence with no integration defects, and QA was green on its first run.
- **Went well:** the SD table settled up front how each EJB/Struts scenario would be judged. QA recorded a verdict for all 39 without re-litigating any.
- **Could improve:** 18 TASKs for one module was far too many.
  - The one-TASK-per-group rule forced it. Seven tickets each added one function to `lib/cart.ts`, which made the chain almost entirely serial.
  - T-0075 and T-0068 changed no production code.
  - Four or five tickets would likely have delivered the same scope with less coordination.
- **Could improve:** test cases linked by scenario rather than by where the code lands sent route-level cases to lib tickets that could not run them yet. Case linking should follow the ticket that builds the tested surface.
- **Could improve:** the platform's root-doc filter strips any ticket-description line mentioning the change's `design.md`, because it reads that as `DESIGN.md`.
- **Could improve:** Chromium is still mismatched in every container, for the fourth sprint running, and `a2a_run_tests` is still unavailable because there is no `testEvidence` block.

## Compliance / Control Evidence

| Control                          | Evidence                                                   | Location                                                                                         | Status    | Exception                                       |
| -------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | --------- | ----------------------------------------------- |
| Work planned before execution    | OpenSpec change + per-TASK PLAN.md                         | `openspec/changes/swhr3-i-0004-shopping-cart-and-item-mana/`, `artifacts/SWHR3-S-0005/*/PLAN.md` | Satisfied | —                                               |
| Test cases approved and linked   | 55 approved cases linked to TASKs                          | Change Review; ticket links                                                                      | Satisfied | —                                               |
| Every change merged through a PR | Squash-merge commits #44–#62                               | sprint branch history                                                                            | Satisfied | —                                               |
| Tests executed per ticket        | TDD result markers + colocated tests                       | `artifacts/SWHR3-S-0005/*/tdd-test-result.md`                                                    | Satisfied | `a2a_run_tests` unavailable; E2E ran only in QA |
| Change verified before release   | QA report, PASS, 33 pass / 6 not-testable / 0 fail         | `artifacts/SWHR3-S-0005/qa-test-report.md`                                                       | Satisfied | No design mockups existed to compare            |
| Defects dispositioned            | 0 at QA                                                    | `integration-defects-resolution.md`                                                              | Satisfied | —                                               |
| Release approval                 | Sprint entered SPRINT_CLOSE on `validation.all_acs_passed` | `qa-test-report.md` §Recommendation                                                              | Satisfied | Human approver: Not Provided                    |
