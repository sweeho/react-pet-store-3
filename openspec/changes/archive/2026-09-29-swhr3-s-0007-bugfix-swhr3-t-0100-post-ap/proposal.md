# Bugfix — SWHR3-T-0100: POST /api/orders accepts non-JSON bodies

## Why

Checkout's cross-site request protection (change `swhr3-i-0005-order-checkout-and-payment`, SD10) rests on two assumptions:

- the session cookie is `SameSite=Lax`;
- `POST /api/orders` accepts only JSON.

The second was never enforced. The route reads its body with h3's `readBody`, which parses whatever arrives. Reproduced on this branch with a route-level harness: a signed-in customer with a filled cart can place an order with a body sent as `application/x-www-form-urlencoded`, as `text/plain` carrying JSON, or with no content type at all. Each of these answers 201, writes the order and empties the cart. `text/plain` and form-encoded are content types a plain HTML form can send cross-origin without a CORS preflight, so the one guarantee the design relied on is absent. `multipart/form-data` happens to be refused, but only with a 400 "Invalid JSON body" from the parser, not by design.

## What Changes

- `POST /api/orders` refuses any request whose content type is not `application/json`. Media-type parameters such as `; charset=utf-8` are allowed, and the match is case-insensitive. The refusal is `415 UNSUPPORTED_MEDIA_TYPE`, returned before the body is parsed, so no order, cart change or order log line is written.
- A JSON request is unaffected and still answers 201.
- A new typed error and a small body-reading helper in `lib/` carry this, so other JSON routes can adopt the same check later.

## Impact

- **Capability:** `order-checkout`. It gains one requirement, "Order submission accepts only JSON".
- **Code:** `routes/api/orders/index.post.ts`, `lib/errors.ts`, a new `lib/json-body.ts`, and tests.
- **Clients:** the storefront (`apiFetch` always sends `Content-Type: application/json` with a body), and the Playwright specs, whose `request.post({ data })` sends JSON, are unaffected.
- **Not changed:** the other JSON routes (cart, customers, auth, admin order status). They have the same gap but are outside this defect. See `design.md` "Follow-ups / out of scope".
