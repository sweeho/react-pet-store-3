---
artifact: fix-note
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0007
ticket: SWHR3-T-0100
---

# Fix note — SWHR3-T-0100

**Root cause.** `routes/api/orders/index.post.ts` passed `await readBody(event)` to `parseCheckoutRequest`. h3's `readBody` picks a parser from the body, not from an allow-list, and nothing checked `content-type`, so SD10 (JSON only) was never enforced. Reproduced against the unfixed route with the new tests: form-urlencoded, `text/plain` carrying JSON and a missing header each resolved with an order; multipart was refused only by accident (400 "Invalid JSON body").

**Fix.** A new `UnsupportedMediaTypeError` (415, `UNSUPPORTED_MEDIA_TYPE`, "Request body must be JSON") and a reusable `readJsonBody(event)` that takes the media type from the header (before `;`, trimmed, lower-cased), requires `application/json`, throws the error otherwise, and only then calls `readBody`. The route uses it, after `requireSessionUser`, so a signed-out request still answers 401 and no refusal reaches `placeOrder` (nothing written, no log line). Other JSON routes are unchanged (out of scope per the change's design).

**Files.** `lib/errors.ts`, `lib/errors.test.ts`, `lib/json-body.ts`, `lib/json-body.test.ts`, `routes/api/orders/index.post.ts`, `routes/api/orders/index.post.test.ts`. The regression tests live beside the code (`lib/`, `routes/`), where this project's Vitest server project runs them, not under `src/**`.
