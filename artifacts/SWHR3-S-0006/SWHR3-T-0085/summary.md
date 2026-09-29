# SWHR3-T-0085 summary

- `lib/checkout-request.ts`: added `extractCreditCard` (C6, D6). Number 12-19 digits after removing spaces, type in `CHECKOUT_CARD_TYPES`, month 01-12, year current to +5; builds the card via `createCreditCard` so expiry is `MM/YYYY`. Empty values are recorded as missing, bad ones as invalid.
- `src/components/checkout/payment-fields.tsx`: the "3 Payment" section built from `FormField`, `Select`, `Input`, following the mockup's section (step badge, two-column fields, "no card is charged" note). Card types are a local client mirror until SWHR3-T-0095. Optional `errors` prop.
- Tests: `lib/checkout-request.test.ts`, `src/components/checkout/payment-fields.test.tsx`.

Deviation: the mockup's "One card is stored per account" hint is omitted; design.md SD6 says the card is stored on the order only.

AC coverage: fields accepted (C-0108/0109/0110), exactly three card types (C-0111/0112), MM/YYYY storage (C-0108).

Verification: `bun run verify` exit 0 (612 tests passed). `a2a_run_tests` refused (no testEvidence), marker used.
