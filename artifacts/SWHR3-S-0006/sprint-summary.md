---
artifact: sprint-summary
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0006
idea: SWHR3-I-0005
branch: vortex/sprint/swhr3-s-0006-d6c77f92
upstream:
  [
    artifacts/SWHR3-S-0006/SPRINT-PLAN.md,
    artifacts/SWHR3-S-0006/qa-test-report.md,
    artifacts/SWHR3-S-0006/integration-test-result.md,
    artifacts/SWHR3-S-0006/integration-defects-resolution.md,
  ]
downstream: [artifacts/SWHR3-S-0006/release-notes.md]
---

# Sprint summary — SWHR3-S-0006

Sprint goal: "SWHR3-I-0005: Order Checkout and Payment Processing". **Met.** All 16 implementation TASKs reached DONE. Integration QA returned PASS with 0 integration defects: 22 scenarios pass and 3 are marked not-testable, but the evidence shows two of those three pass (see Verification). One defect found during execution, SWHR3-T-0100, is open in the backlog (see Known Issues).

## Tickets

The plan is change `swhr3-i-0005-order-checkout-and-payment`. Its `design.md` section "Rebuild on this repository (sprint SWHR3-S-0006)" holds the decisions (D1–D13), contracts (C1–C10) and spec discrepancies (SD1–SD15). Per-ticket steps and outcomes are in `artifacts/SWHR3-S-0006/<TICKET-KEY>/`, and the designs are in `artifacts/SWHR3-S-0006/design/`.

| Ticket       | Type  | Title                                                                  | Outcome     |
| ------------ | ----- | ---------------------------------------------------------------------- | ----------- |
| SWHR3-T-0080 | TASK  | Sprint plan — SWHR3-S-0006                                             | DONE        |
| SWHR3-T-0081 | EPIC  | Order Checkout and Payment Processing                                  | DONE        |
| SWHR3-T-0082 | STORY | A signed-in shopper checks out the cart and sees an order confirmation | DONE        |
| SWHR3-T-0092 | TASK  | Credit Card Value Object                                               | DONE (#64)  |
| SWHR3-T-0091 | TASK  | Contact Information Integration                                        | DONE (#65)  |
| SWHR3-T-0093 | TASK  | Form Validation Exceptions                                             | DONE (#66)  |
| SWHR3-T-0089 | TASK  | Shopping Cart Validation                                               | DONE (#67)  |
| SWHR3-T-0090 | TASK  | Purchase Order Entity                                                  | DONE (#68)  |
| SWHR3-T-0084 | TASK  | Web-Tier Address Validation                                            | DONE (#69)  |
| SWHR3-T-0085 | TASK  | Credit Card Collection                                                 | DONE (#70)  |
| SWHR3-T-0086 | TASK  | Order Creation Action                                                  | DONE (#71)  |
| SWHR3-T-0087 | TASK  | EJB Order Processing                                                   | DONE (#72)  |
| SWHR3-T-0088 | TASK  | Order ID Generation                                                    | DONE (#73)  |
| SWHR3-T-0095 | TASK  | Struts Configuration — `POST /api/orders`, protection, client binding  | DONE (#74)  |
| SWHR3-T-0098 | TASK  | Security and Validation                                                | DONE (#75)  |
| SWHR3-T-0094 | TASK  | Order Confirmation                                                     | DONE (#76)  |
| SWHR3-T-0083 | TASK  | Address Collection Forms — the `/checkout` form                        | DONE (#77)  |
| SWHR3-T-0097 | TASK  | Error Handling and Recovery                                            | DONE (#78)  |
| SWHR3-T-0096 | TASK  | Integration Testing — end-to-end checkout                              | DONE (#79)  |
| SWHR3-T-0101 | TASK  | Integration QA report — SWHR3-S-0006                                   | DONE (#80)  |
| SWHR3-T-0102 | TASK  | Sprint close bundle — SWHR3-S-0006                                     | This ticket |

## What shipped

Checkout: a signed-in shopper turns the cart into an order and sees a confirmation. The code change is 53 files and about 5,090 lines added, most of it tests.

- **Data:** migration `drizzle/0005_slow_nick_fury.sql`.
  - `orders` gains nullable `email`, `card_type`, `card_number` and `card_expiry` (`MM/YYYY`).
  - A new `order_contacts` table holds the billing (`BILL_TO`) and shipping (`SHIP_TO`) address snapshots, ten fields each.
  - `line_items` gets its first writer.
- **Parsing:** `lib/checkout-request.ts` reads the flat `_a` (billing) and `_b` (shipping) fields plus the card fields.
  - It trims every value and treats whitespace-only as missing, with its own "Spaces only — …" message. A blank address line 2 becomes `null`.
  - The card type must be Java Card, Duke Express or Meow Card; the number must be 12–19 digits; the expiry must be a valid, non-past month.
  - Every problem is collected into one `MissingFormDataError`: a 422 with `fieldErrors` and an ordered `missingFields`.
- **Placement:** `lib/checkout.ts` `placeOrder` runs one immediate-mode transaction. It reads the cart (an empty cart raises 409 `SHOPPING_CART_EMPTY`, "Shopping cart is empty") and writes the order: account from the session, date now, total from the cart, status `PENDING`. It then writes both contacts and the line items and empties the cart. Any failure rolls everything back. After commit it writes one log line with no card data.
- **API:**
  - `POST /api/orders` answers 201 `{ orderId, orderDate, email }`, and 401 signed out.
  - `GET /api/orders/:id` answers the owner's confirmation, or 404 for anyone else's order.
- **Access:** `/api/orders` and `/checkout` now require sign-in. The cart cookie is read on `/api/orders*` but never minted there.
- **UI:**
  - `/checkout` has three numbered sections. Billing is pre-filled from the profile; a "Same as billing address" checkbox fills shipping; the payment section is never pre-filled. The page also shows an order summary, a missing-fields summary with inline messages, and the empty-cart state.
  - `/orders/:id` shows the order number, date, notification email, lines, total, both addresses, and the card masked as "<type> ending <last4> · Expires MM/YYYY".
- **Tests:** `e2e/checkout.spec.ts` covers 4 journeys. `e2e/cart.spec.ts`'s two `/checkout` tests now sign in first.

**Root docs.** Planning (SWHR3-T-0080) updated `ARCHITECTURE.md` for the new entities and `/api/orders` protection, and `DESIGN.md` for the long-form validation pattern; both match the shipped code. At close, `ARCHITECTURE.md` gets one more line: the error-body shape now includes `missingFields?`. `PRODUCT.md` already lists `order-checkout`.

## Divergence from plan

- **Out-of-ownership edit (T-0097).** `ApiError` in `src/utils/api.ts` dropped `missingFields`, so the page could not list missing fields. T-0097 added one optional field there, an additive change covered by a test. It was outside the ownership map, but the right fix; C10 should have named it.
- **Structural type (T-0090).** `lib/purchase-orders.ts` accepts a structural `OrderEventInput`, because `OrderEvent` did not exist yet when it merged. The later `OrderEvent` fits it, but there are now two names for one shape.
- **Tooling files (T-0095).** The mirror-parity test is `lib/checkout-mirror.test.ts`, and `tsconfig.node.json` now includes `src/types/cart.ts` and `src/types/checkout.ts`, following the customer-profile precedent. T-0095 also added a test for `src/constants/protected-pages.ts`.
- **Mockup details not reproduced (T-0083, T-0085).** The info icons and line thumbnails are omitted, and the payment section drops "One card is stored per account" (SD6). The storefront chrome is out of scope (SD12, SWHR3-T-0099). No implementer viewed the pages in a browser, and QA did not compare them against the mockups.
- **Log placement (T-0087 → T-0098).** T-0087 first logged inside the transaction; T-0098 moved the line after commit, as D11 requires.

## Verification

**PASS** at sprint head 3b4fdbc:

- `bun run verify` passes 704/704 unit tests across 109 files, and the build exits 0.
- Playwright passes 32/32, 4 of them checkout journeys.

QA marked three scenarios not-testable:

- **The `_a`/`_b` suffix scenarios pass, not "not-testable".** QA's reasons say the body nests billing and shipping, but the shipped request is the flat `_a`/`_b` shape (D1). `extractContactInfo(fields, "_a" | "_b")` exists, and it is tested in `lib/checkout-request.test.ts` and `routes/api/orders/index.post.test.ts`.
- **"Order event contains complete checkout data" is also covered.** `OrderEvent` exists as a type, and its shipper, receiver and card are asserted in `lib/checkout-request.test.ts`.

This sprint's QA read the idea's stale "JSON nests billing and shipping" text instead of the change's rebuild section. The verdicts are unaffected: nothing failed.

See `qa-test-report.md`, `integration-test-result.md` and `integration-defects-resolution.md`.

## Known Issues

This ticket carries no "Conditionally approved" notice, but one defect raised during execution is open.

- **SWHR3-T-0100 (DEFECT, P2, backlog):** `POST /api/orders` accepts a form-encoded body. SD10 relies on JSON-only posts as part of its CSRF reasoning. A cross-site form post still gets a 401, because the `SameSite=Lax` session cookie is not sent, so practical exposure is low. The route should still refuse a non-JSON body.

## Follow-ups / out of scope

- **SWHR3-T-0099 (improvement):** the storefront shell every mockup shows (language bar, sign-in bar, category nav, cart badge, footer).
- **SWHR3-T-0076, SWHR3-T-0077 (improvements, from SWHR3-S-0005):** purge abandoned carts, and carry the profile locale into the session.
- **Out of scope:**
  - Auto-approval of orders under $500, fulfilment and customer emails (`order-workflow`, `customer-communications`). Every new order waits in the admin Pending queue.
  - Updating the profile's stored card at checkout (SD6).
- **Environment (not filed):** agent containers still lack the Chromium build the pinned Playwright expects. T-0096's spec was written without being run and passed first time at QA, but no implementer saw the UI in a browser.

## Retrospective

These points are judgment, not measured fact.

- **Went well:**
  - The contracts and ownership maps held across 16 serial merges, and QA was green first time with 0 integration defects.
  - Linking test cases to the ticket that builds the tested surface (the lesson from SWHR3-S-0005) meant no ticket was handed a case it could not run.
  - The design export failed silently, but the recovery (canvas `srcdoc` checked by sha256) gave every UI ticket the exact mockups.
- **Could improve:**
  - QA verified against the idea snapshot rather than the change's rebuild section, so it recorded wrong reasons for three verdicts. The QA prompt should point at the change's `design.md` first, as implementation's does.
  - Ownership maps missed a shared client file (`src/utils/api.ts`), a type home (`OrderEvent`) and a config file (`tsconfig.node.json`). Contracts should list every file a contract touches, not only the new ones.
  - Mandating one TASK per tasks.md group again produced a serial chain of 11 before the first split, plus several tickets that changed no production code (T-0088, T-0098 in part). Grouping by module would have taken roughly six tickets.
  - For the fifth sprint running, nobody but QA could run a browser.

## Compliance / Control Evidence

| Control                          | Evidence                                                   | Location                                                                                        | Status    | Exception                                       |
| -------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | --------- | ----------------------------------------------- |
| Work planned before execution    | OpenSpec change + per-TASK PLAN.md + exported designs      | `openspec/changes/swhr3-i-0005-order-checkout-and-payment/`, `artifacts/SWHR3-S-0006/*/PLAN.md` | Satisfied | —                                               |
| Test cases approved and linked   | 48 approved cases linked to TASKs                          | Change Review; ticket links                                                                     | Satisfied | —                                               |
| Every change merged through a PR | Squash-merge commits #64–#80                               | sprint branch history                                                                           | Satisfied | —                                               |
| Tests executed per ticket        | TDD result markers + colocated tests                       | `artifacts/SWHR3-S-0006/*/tdd-test-result.md`                                                   | Satisfied | E2E ran only in QA                              |
| Change verified before release   | QA report, PASS, 0 fail                                    | `artifacts/SWHR3-S-0006/qa-test-report.md`                                                      | Satisfied | No mockup comparison; 3 verdict reasons misread |
| Defects dispositioned            | 0 at QA; SWHR3-T-0100 open in backlog                      | `integration-defects-resolution.md`, this file                                                  | Partial   | SWHR3-T-0100 unfixed at release                 |
| Release approval                 | Sprint entered SPRINT_CLOSE on `validation.all_acs_passed` | `qa-test-report.md` §Recommendation                                                             | Satisfied | Human approver: Not Provided                    |
