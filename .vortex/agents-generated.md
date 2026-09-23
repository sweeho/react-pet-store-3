# Corrections to AGENTS.md (generated)

AGENTS.md is human-authored and is not edited by agents. Corrections an agent found go here, for a human to fold in.

## Vitest projects: `lib/` and `middleware/` tests also run in the server project

- **AGENTS.md says:** "`routes/**/*.test.ts` runs in the `server` project (`environment: "node"`), everything else in the `client` project (jsdom)."
- **Correct from SWHR3-T-0020 (sprint SWHR3-S-0001) on:** `lib/**/*.test.ts` and `middleware/**/*.test.ts` also run in the `server` project, and `lib/` is type-checked through `tsconfig.node.json`. `lib/` holds server-side shared modules (auth config, session, services, errors). A test there that reaches `db/client.ts` needs the node environment for the same `bun:sqlite` reason.
- **Suggested wording:** "`routes/**`, `middleware/**` and `lib/**` `*.test.ts` run in the `server` project (`environment: "node"`), everything else in the `client` project (jsdom)."
- **Source:** change `swhr3-i-0002-customer-management-and-aut`, design.md D13.
