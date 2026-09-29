---
artifact: sprint-summary
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0007
branch: vortex/sprint/swhr3-s-0007-45e84ed1
upstream:
  [
    artifacts/SWHR3-S-0007/SPRINT-PLAN.md,
    artifacts/SWHR3-S-0007/qa-test-report.md,
    artifacts/SWHR3-S-0007/integration-test-result.md,
    artifacts/SWHR3-S-0007/integration-defects-resolution.md,
  ]
downstream: [artifacts/SWHR3-S-0007/release-notes.md]
---

# Sprint summary — SWHR3-S-0007

Sprint goal: "Bugfix — SWHR3-T-0100: POST /api/orders accepts form-encoded bodies, contradicting SD10 (JSON only)". **Met.** The one DEFECT is fixed and integration QA returned PASS: all 6 scenarios of the new requirement pass, and no defects were found.

## Tickets

The plan is change `swhr3-s-0007-bugfix-swhr3-t-0100-post-ap`. Its `design.md` holds the reproduction, root cause, decisions D1–D4 and contracts C1–C3. The fix detail is in `artifacts/SWHR3-S-0007/SWHR3-T-0100/` (`PLAN.md`, `fix-note.md`, `tdd-test-result.md`).

| Ticket       | Type   | Title                                                                        | Outcome     |
| ------------ | ------ | ---------------------------------------------------------------------------- | ----------- |
| SWHR3-T-0103 | TASK   | Bugfix plan — SWHR3-S-0007                                                   | DONE        |
| SWHR3-T-0100 | DEFECT | POST /api/orders accepts form-encoded bodies, contradicting SD10 (JSON only) | DONE (#82)  |
| SWHR3-T-0104 | TASK   | Integration QA report — SWHR3-S-0007                                         | DONE (#83)  |
| SWHR3-T-0105 | TASK   | Sprint close bundle — SWHR3-S-0007                                           | This ticket |

## What shipped

`POST /api/orders` now accepts only JSON. Six files changed, about 240 lines added, most of them tests.

- **`lib/json-body.ts` `readJsonBody(event)`.** It takes the media type from the `content-type` header (before any `;`, trimmed, lower-cased) and requires exactly `application/json`. Anything else, including a missing header, throws the new `UnsupportedMediaTypeError`, before the body is read.
- **`lib/errors.ts` `UnsupportedMediaTypeError`**: 415, `UNSUPPORTED_MEDIA_TYPE`, "Request body must be JSON", returned through `toHttpError` in the standard error body.
- **`routes/api/orders/index.post.ts`** calls `readJsonBody` after `requireSessionUser`, in place of `readBody`. A signed-out request still gets 401. A refused request never reaches `placeOrder`, so it writes no order, leaves the cart unchanged, and writes no `checkout:` log line.
- **Spec:** the `order-checkout` capability gains the requirement "Order submission accepts only JSON" with 6 scenarios. Checkout's cross-site request protection (SD10 of change `swhr3-i-0005-order-checkout-and-payment`) is now enforced, not just assumed.

**Root docs unchanged.** The only observable change is a 415 on one API route, which is not a system-level fact. `readJsonBody` is not yet a cross-cutting rule, so it is not promoted to ARCHITECTURE.md Key Decisions until the other JSON routes adopt it.

## Divergence from plan

None. The fix, its file set and its tests match the plan, with every change inside the ownership map.

Planning's reproduction corrected the ticket. The ticket expected form-encoded and multipart bodies to be accepted. The measured behaviour was that form-encoded, `text/plain` carrying JSON, and a missing content type were all accepted, while multipart was refused, but only by a parser error. The fix and its tests cover all four.

## Verification

**PASS** at sprint head 8b48398:

- Build, lint and typecheck are clean. `bun run verify` passes 720/720 unit tests across 110 files.
- Playwright passes 32/32, including the 4 checkout journeys, so the JSON browser checkout still works.
- Each of the 6 scenarios has a named passing test in `routes/api/orders/index.post.test.ts` or `lib/json-body.test.ts`: C-0146, C-0148, C-0149, C-0150, C-0152, C-0154 and C-0155.
- The refusals are verified at route level with a real `H3Event`. No live non-JSON request was sent to a running server.

C-0153 (browser checkout) is satisfied by the existing `e2e/checkout.spec.ts`, which passed at QA. The fixing ticket could not run it locally, because no Chromium was available.

See `qa-test-report.md`, `integration-test-result.md` and `integration-defects-resolution.md`.

## Follow-ups / out of scope

- **The same missing content-type check on seven other JSON routes**, recorded at planning in the change's design.md, not filed:
  - `POST` and `PUT /api/cart`
  - `POST /api/customers` and `PUT /api/customers/me`
  - `POST /api/auth/register` and `POST /api/auth/signin`
  - `POST /api/admin/orders/status`

  None can be exploited from another site today, because the session and cart cookies are `SameSite=Lax`. Switching them to `readJsonBody` is a small, separate change.

- **Open improvements:** SWHR3-T-0076, SWHR3-T-0077 and SWHR3-T-0099.

## Retrospective

These points are judgment, not measured fact.

- **Went well:**
  - Reproducing at planning, before writing the plan, turned up two unreported accepting content types (`text/plain`, no header). `text/plain` is the one an ordinary cross-site form can send, so the fix closes the real hole, not just the reported one.
  - One defect became one ticket, one change and six scenario-derived criteria. The implementation needed no clarification, and QA passed first time.
  - Writing the tests before the fix proved every scenario failed on the unfixed route.
- **Could improve:**
  - The defect was filed from code reading without a reproduction, and it predicted the wrong set of accepted content types. A defect report should carry a runnable reproduction, even a route-level one.
  - This is the sixth sprint where an implementer could not run Playwright (Chromium does not match the pinned Playwright version).
  - The bug existed because a design decision (SD10) relied on something no test enforced. Security assumptions in a `design.md` should become requirements with scenarios when they are written, not later.

## Compliance / Control Evidence

| Control                        | Evidence                                                   | Location                                                                                                    | Status    | Exception                     |
| ------------------------------ | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------- | ----------------------------- |
| Defect reproduced before fix   | Reproduction table and failing-first tests                 | change `design.md` §Reproduction, `artifacts/SWHR3-S-0007/SWHR3-T-0100/tdd-test-result.md`                  | Satisfied | —                             |
| Work planned before execution  | OpenSpec change + PLAN.md                                  | `openspec/changes/swhr3-s-0007-bugfix-swhr3-t-0100-post-ap/`, `artifacts/SWHR3-S-0007/SWHR3-T-0100/PLAN.md` | Satisfied | —                             |
| Test cases approved and linked | 10 approved cases linked to SWHR3-T-0100                   | Change Review; ticket links                                                                                 | Satisfied | —                             |
| Change merged through a PR     | Squash-merge commits #82, #83                              | sprint branch history                                                                                       | Satisfied | —                             |
| Change verified before release | QA report, PASS, 6/6 scenarios                             | `artifacts/SWHR3-S-0007/qa-test-report.md`                                                                  | Satisfied | No live-server non-JSON probe |
| Defects dispositioned          | 0 at QA                                                    | `integration-defects-resolution.md`                                                                         | Satisfied | —                             |
| Release approval               | Sprint entered SPRINT_CLOSE on `validation.all_acs_passed` | `qa-test-report.md` §Recommendation                                                                         | Satisfied | Human approver: Not Provided  |
