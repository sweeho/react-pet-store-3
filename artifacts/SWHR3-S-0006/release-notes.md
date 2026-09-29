---
artifact: release-notes
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0006
idea: SWHR3-I-0005
branch: vortex/sprint/swhr3-s-0006-d6c77f92
upstream: [artifacts/SWHR3-S-0006/qa-test-report.md]
---

# Release notes — SWHR3-S-0006

Shoppers can now check out: they enter addresses and a card, place an order, and see a confirmation with the order number.

## Added

- **Checkout at `/checkout`** (sign-in required; the cart is kept through sign-in).
  - There are three sections: Billing address (pre-filled from the account), Shipping address, and Payment.
  - Every field is required except address line 2. "Same as billing address" copies billing into shipping.
  - The card type is Java Card, Duke Express or Meow Card, with an expiry month and year.
  - An order summary with "Edit cart" sits beside the form.

  (SWHR3-T-0083, SWHR3-T-0085, SWHR3-T-0095)

- **Clear refusals.**
  - If fields are missing, including fields holding only spaces, nothing is placed. The page shows "Your order was not placed — N required fields are missing", lists each field, and marks it inline. Everything typed is kept.
  - If the cart is empty, or empties before the order is placed, the page explains that no order was created and links back to the cart.

  (SWHR3-T-0084, SWHR3-T-0086, SWHR3-T-0097, SWHR3-T-0089)

- **Order confirmation at `/orders/:id`.** It shows the order number, order date, the email notifications go to (the billing email), the lines and total, both addresses, and the card as "<type> ending <last4> · Expires MM/YYYY". Only the account that placed the order can open it. (SWHR3-T-0094)
- **All-or-nothing orders.** Placing an order records the addresses, card and lines as they were at purchase and empties the cart, in one step. If anything fails, nothing is saved and the cart is untouched. New orders appear in the administrator's Pending queue. (SWHR3-T-0087, SWHR3-T-0090, SWHR3-T-0088)
- **API:**
  - `POST /api/orders` answers 201 `{ orderId, orderDate, email }`, 422 `VALIDATION_FAILED` with `fieldErrors` and `missingFields`, 409 `SHOPPING_CART_EMPTY`, or 401.
  - `GET /api/orders/:id` answers the order, or 404 unless it is the caller's own order.

  (SWHR3-T-0095, SWHR3-T-0094, SWHR3-T-0098)

## Changed

- **`/checkout` now requires sign-in.** Signed-out visitors are sent to `/signin?redirect=/checkout`. (SWHR3-T-0095)
- **Error responses may include `missingFields`**: an ordered list of the fields a 422 is about. (SWHR3-T-0093, SWHR3-T-0097)

## Upgrade notes

- **Database migration** `drizzle/0005_slow_nick_fury.sql` adds four nullable columns to `orders` (`email`, `card_type`, `card_number`, `card_expiry`) and creates `order_contacts`. The app applies it on start. Existing orders keep NULL in the new columns.
- **Operations:** each placed order writes one server log line, `checkout: order <id> placed by account <id>, <n> lines, <cents> cents`. It contains no card data.

## Known limitations

- No payment is taken; the card is stored with the order only (PRD non-goal).
- Orders are not auto-approved under $500 yet; every order waits for an administrator.
- `POST /api/orders` still accepts form-encoded bodies (SWHR3-T-0100).
- The storefront header, navigation and footer shown in the designs are not built yet (SWHR3-T-0099).
