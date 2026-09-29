---
artifact: release-notes
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0007
branch: vortex/sprint/swhr3-s-0007-45e84ed1
upstream: [artifacts/SWHR3-S-0007/qa-test-report.md]
---

# Release notes — SWHR3-S-0007

Placing an order now requires a JSON request, which closes a gap in checkout's cross-site request protection.

## Fixed

- **`POST /api/orders` refuses non-JSON requests.** Before this fix, a signed-in customer's order could be placed with a form-encoded body, a `text/plain` body, or no content type. The endpoint now answers **415 `UNSUPPORTED_MEDIA_TYPE`** ("Request body must be JSON") for any content type other than `application/json`. Parameters such as `; charset=utf-8` are allowed, and letter case is ignored. A refused request places no order, leaves the cart as it was, and writes no order log line. A signed-out request still gets 401. (SWHR3-T-0100)

## Unchanged

- The storefront checkout already sends JSON, so shoppers see no difference.
- Other API endpoints behave as before.

## Upgrade notes

- **API clients:** any integration that posts orders must send `Content-Type: application/json`. There is no migration and no configuration change.
