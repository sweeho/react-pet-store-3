# Design — Bugfix SWHR3-T-0100

## Reproduction

A route harness built on `routes/api/orders/index.post.test.ts` (signed-in session cookie, cart cookie, a full checkout body) called the real handler through `middleware/auth.ts` and `middleware/cart-session.ts`. It ran at sprint-branch head a06114a:

| Content type                        | Body                | Result                                   |
| ----------------------------------- | ------------------- | ---------------------------------------- |
| `application/json`                  | JSON                | 201, order written, cart emptied         |
| `application/x-www-form-urlencoded` | form-encoded fields | **201, order written, cart emptied**     |
| `text/plain`                        | JSON text           | **201, order written, cart emptied**     |
| none                                | JSON text           | **201, order written, cart emptied**     |
| `multipart/form-data`               | form data           | 400 "Invalid JSON body", nothing written |

The ticket expected urlencoded and multipart to be accepted. In fact urlencoded is accepted, multipart is refused only by accident, and `text/plain` and a missing content type are also accepted. The ticket had not reproduced it; this table corrects it.

## Root cause

`routes/api/orders/index.post.ts` passes `await readBody(event)` straight to `parseCheckoutRequest`. h3's `readBody` picks a parser from the body, not from an allow-list: urlencoded becomes an object, and JSON text is parsed whatever the declared type. Nothing in `middleware/`, `lib/` or the route checks `content-type`. SD10 assumed JSON-only from the client side (`apiFetch` sets `Content-Type: application/json`), and no server check ever enforced it.

## Decisions

- **D1 — Check the declared media type, not the body.** Take the media type from the `content-type` header, before any `;` parameter, trimmed and lower-cased, and require it to be exactly `application/json`. Anything else, including a missing header, is refused. The header decides, because the header is what a cross-site form can and cannot set.
- **D2 — Refuse with 415, before the body is read.** Add `UnsupportedMediaTypeError` to `lib/errors.ts`: status 415, code `UNSUPPORTED_MEDIA_TYPE`, message "Request body must be JSON". It goes out through `toHttpError` in the standard error body.
- **D3 — Authenticate first.** The route keeps `requireSessionUser` as its first step, so a signed-out non-JSON request still answers 401. The media-type check follows, then body parsing. Neither refusal reaches `placeOrder`, so nothing is written or logged (D11 of `swhr3-i-0005-order-checkout-and-payment`).
- **D4 — One reusable helper.** `lib/json-body.ts` exports `readJsonBody(event: H3Event): Promise<unknown>`. It applies D1 and throws `UnsupportedMediaTypeError`, then returns `readBody(event)`. This defect switches only `POST /api/orders` to it.

## Fixed interface contracts

- **C1** — `lib/errors.ts` `UnsupportedMediaTypeError()`: 415, `UNSUPPORTED_MEDIA_TYPE`, "Request body must be JSON".
- **C2** — `lib/json-body.ts` `readJsonBody(event: H3Event): Promise<unknown>`.
- **C3** — `POST /api/orders` returns the same 201 / 401 / 409 / 422 as before, plus 415 for a non-JSON content type.

## Test plan

- `lib/json-body.test.ts` (real `H3Event`, table-driven):
  - Accepted: `application/json`, `application/json; charset=utf-8`, `Application/JSON`.
  - Refused with the error: `application/x-www-form-urlencoded`, `multipart/form-data`, `text/plain`, a missing header, and `application/jsonp`.
- `lib/errors.test.ts`: `toHttpError` maps the new error to 415 with its code.
- `routes/api/orders/index.post.test.ts`:
  - Signed in with a filled cart, each refused content type answers 415. The order count is unchanged, the cart still holds its lines, and no `checkout:` log line is written (spy on `console.info`).
  - `application/json; charset=utf-8` answers 201.
  - Signed out with `text/plain` answers 401.
- No E2E change is needed. Every browser path already sends JSON, and the existing checkout E2E proves that path is unaffected.

## Follow-ups / out of scope

- **The same gap exists on every other JSON route.** These all read bodies with plain `readBody` and no media-type check (confirmed by code reading):
  - `POST /api/cart`, `PUT /api/cart`
  - `POST /api/customers`, `PUT /api/customers/me`
  - `POST /api/auth/register`, `POST /api/auth/signin`
  - `POST /api/admin/orders/status`

  `SameSite=Lax` blocks the session cookie on a cross-site POST, so the signed-in routes are not exploitable cross-site today. `POST /api/cart` uses the cart cookie, which is also `SameSite=Lax`. Sign-in and register need no session. Moving these routes to `readJsonBody` is a distinct change for a later sprint, and planning has no defect-filing authority. This entry is the record.
