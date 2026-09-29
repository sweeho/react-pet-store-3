## 1. Enforce JSON-only order submission

- [x] 1.1 Add `UnsupportedMediaTypeError` to `lib/errors.ts` with its `toHttpError` mapping test (SWHR3-T-0100)
- [x] 1.2 Add `lib/json-body.ts` `readJsonBody` with a table-driven media-type test (SWHR3-T-0100)
- [x] 1.3 Switch `routes/api/orders/index.post.ts` to `readJsonBody`, after authentication (SWHR3-T-0100)
- [x] 1.4 Extend `routes/api/orders/index.post.test.ts` with the refused and accepted content-type cases, asserting no order, no cart change and no log line (SWHR3-T-0100)
