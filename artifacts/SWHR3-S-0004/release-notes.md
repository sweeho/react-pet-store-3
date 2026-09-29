---
artifact: release-notes
spec: 1
status: complete
author_role: planning
sprint: SWHR3-S-0004
idea: Not Provided
branch: vortex/sprint/swhr3-s-0004-d0e44038
upstream: [artifacts/SWHR3-S-0004/qa-test-report.md]
---

# Release notes — SWHR3-S-0004

The server no longer answers 500 "database is locked" when another process is writing to the database.

## Fixed

- **Concurrent writes no longer cause server errors.** Previously, a request that met a database lock held by another process failed at once with 500 "database is locked". The other process could be the `admin:grant` or order-seeding script, or a second server instance. Now every database connection waits up to 5 seconds for the lock and then proceeds. A lock held longer than 5 seconds still fails, after about 5 seconds. (SWHR3-T-0048)

## Upgrade notes

- **WAL mode.** On first start, the file-backed `sqlite.db` switches to write-ahead logging, so reads no longer wait on writes. SQLite then keeps two extra files beside it, `sqlite.db-wal` and `sqlite.db-shm`. Both are gitignored.
  - Keep the database on a local filesystem, not a network share.
  - When backing up, copy all three files, or checkpoint the database first.
- No schema migration and no configuration change.

## Known limitations

- None introduced. The approval audit trail is still absent by design (PRD non-goal).

## Verification

Integration QA passed. 446/446 unit tests and 22/22 E2E tests passed, including a new lock-contention E2E spec. All 4 scenarios of the new "Database lock contention tolerance" requirement passed, and no defects were found. See `artifacts/SWHR3-S-0004/qa-test-report.md`.

## Compliance / Control Evidence

| Control                                | Evidence        | Location                                   | Status    | Exception |
| -------------------------------------- | --------------- | ------------------------------------------ | --------- | --------- |
| Release contents recorded              | this file       | `artifacts/SWHR3-S-0004/release-notes.md`  | Satisfied | —         |
| Release verified before land           | QA PASS verdict | `artifacts/SWHR3-S-0004/qa-test-report.md` | Satisfied | —         |
| Config and migration changes disclosed | Upgrade notes   | this file                                  | Satisfied | —         |
