---
artifact: ticket-summary
spec: 1
status: complete
author_role: implementation
sprint: SWHR3-S-0009
ticket: SWHR3-T-0141
---

# Summary — SWHR3-T-0141

Added `lib/supplier-request.ts` (C6, D7): `QTY_FIELD_PREFIX = "qty_"`, `ITEM_FIELD_PREFIX = "item_"` and `parseInventoryForm(body)`. It walks the body's `item_<id>` fields, keeps a row only when the checkbox is ticked (`true`, `"on"` or `"true"`) and `qty_<id>` is a whole number of 0 or more (ASCII digits, trimmed), and skips everything else silently. Results follow the order of the ticked rows; a non-object body gives `[]`.

Files: `lib/supplier-request.ts`, `lib/supplier-request.test.ts`.

Small choices beyond the plan: a JSON whole number is accepted as a quantity as well as a string (the body is JSON, so a client may send either); a value that is not a safe integer is skipped; an empty item id is ignored.

Design: none applies (no UI; PLAN.md says so). The sign-in mockup named in the prompt belongs to a later ticket.

AC coverage: AC-1 by `[SWHR3-C-0195]` (invalid and empty quantities skipped silently), AC-2 by the negative-quantity cases in the invalid table (`-3` is skipped without modification); `[SWHR3-C-0209]` keeps a ticked 0.

Verification: `bun run verify` exit 0 (950 tests), `bun run build` exit 0.
