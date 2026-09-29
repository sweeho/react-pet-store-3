# Architecture

See [PRODUCT.md](./PRODUCT.md) for what this is, [DESIGN.md](./DESIGN.md) for the visual system.

## Stack

- **Framework**: Vite 8 running a React 19 SPA + a Nitro 3 server together
- **Language**: TypeScript 5 (strict)
- **Frontend routing**: `vite-plugin-pages` (file-based) + `react-router` 8
- **Backend routing**: Nitro 3 / H3 2 (file-based)
- **Database**: SQLite via Bun's built-in `bun:sqlite` + Drizzle ORM — schema/client in `db/`, migrations in `drizzle/`. Requires the Bun runtime (dev, test, and production — see Deployment below)
- **Sessions**: h3 sealed-cookie sessions (`useSession` from `nitro/h3`) — no session table, no extra dependency
- **Password hashing**: `Bun.password` (argon2id)
- **Styling**: Tailwind CSS v4 (CSS-first, no `tailwind.config.ts`) + `tw-animate-css`
- **UI primitives**: shadcn/ui-style — Radix Slot, `class-variance-authority`, `cn()`
- **Icons**: `lucide-react`, `@heroicons/react`
- **Auto-imports**: `unplugin-auto-import` — `react` + `react-router` need no import
- **Fonts**: `unplugin-fonts` (config in `configs/fonts.config.ts`)
- **Tests**: Vitest + Testing Library (unit/integration/UI), Playwright (E2E/smoke)
- **Lint/format**: ESLint 9 + typescript-eslint, Prettier, Husky + lint-staged

## Directory structure

```
.
├── src/
│   ├── components/ui/   # shadcn/ui-style primitives (+ *.test.tsx)
│   ├── components/auth/ # route guard, sign-out control
│   ├── components/admin/ # admin shell, administrator gate, admin-only widgets
│   ├── pages/            # Frontend routes, file-based (+ *.test.tsx)
│   ├── hooks/, utils/, types/, constants/, data/, store/
│   ├── test/              # Vitest setup
│   ├── index.css           # Tailwind v4 + design tokens
│   └── main.tsx            # router + error boundary + route guard
├── routes/api/            # Backend routes, file-based (+ *.test.ts)
├── middleware/             # Runs before every route handler (auth.ts resolves the session)
├── lib/                     # Server-side shared modules: config, services, errors (+ *.test.ts)
├── db/                      # Drizzle schema.ts + client.ts (sqlite connection, migrate, seed) + operator scripts
├── drizzle/                  # Generated SQL migrations (drizzle-kit generate), committed
├── openspec/                 # Specs of record (specs/) and in-flight changes (changes/)
├── e2e/                     # Playwright specs + global-setup.ts
├── configs/, scripts/
├── server.ts                # Nitro server entry
├── vite.config.ts, vitest.config.ts, playwright.config.ts, drizzle.config.ts
├── tsconfig.json             # src
├── tsconfig.node.json          # server/config/test files, including lib/
└── package.json
```

`lib/` has no Nitro meaning, so nothing in it becomes a route or a middleware. `src/` and the server are type-checked as separate projects and cannot import each other's files. The few values both sides need are mirrored in `src/constants/`, `src/types/` and `src/utils/`, and tests hold each mirror equal to its server original.

## Routing

**Frontend**: `src/pages/**/*.tsx` → routes (`about.tsx` → `/about`, `[id].tsx` → `/:id`, `[...all].tsx` → catch-all). `*.test.tsx` excluded via `Pages({ exclude })` in `vite.config.ts`. Administrator screens live under `src/pages/admin/` (`/admin/**`) and render inside `AdminShell`, which gates them (see Authentication and sessions).

**Backend**: `routes/api/*.ts` → `/api/*`, and a method suffix (`index.post.ts`, `me.get.ts`) restricts a handler to one method. `middleware/*.ts` runs first and can set `event.context`. Requires `nitro({ serverDir: "./" })` in `vite.config.ts`; the default is `false` (no scanning). `*.test.ts` excluded via `nitro({ ignore })`.

## Authentication and sessions

Cross-cutting: every capability that needs to know who is calling uses this, and none builds its own.

- **Session**: `lib/session.ts` wraps h3 `useSession` in one sealed, httpOnly cookie (`petstore_session`). The cookie holds the account id, user name, locale and last-seen time. The 30-minute timeout is **idle** time: each request re-seals the cookie, and a stale or unreadable cookie reads as _expired_, which is distinct from _never signed in_. `SESSION_SECRET` seals it (see Deployment).
- **Who is calling**: `middleware/auth.ts` resolves the session into `event.context.user = { id, username }` or leaves it unset. Handlers read `event.context.user`, or call `requireSessionUser(event)` from `lib/session.ts`.
- **Protected API paths**: an exact-match list in `lib/protected-resources.ts`. The middleware answers 401 for a listed path without an active session: "Session timed out" or "Authentication required".
- **Roles**: every account has a `role` (`customer` by default, or `admin`). The role is not in the session cookie. `lib/roles.ts` reads it from the database when it is needed, so a changed role applies on the next request.
- **Administrator API**: every path under `/api/admin/` is admin-only by prefix. The middleware answers 401 without a session and 403 `FORBIDDEN` ("Administrator credentials required") for a session whose account is not `admin`. A handler under `routes/api/admin/` never re-checks the role. Administrators are provisioned by an operator with the `admin:grant` package script (`db/grant-admin.ts`); there is no admin-management UI.
- **Protected pages**: a client guard in `src/main.tsx` checks `GET /api/session` and sends signed-out visitors to `/signin?redirect=<path>`. The sign-in page returns them there. Admin pages are gated by `RequireAdmin` inside `AdminShell`, which sends anyone without the admin role to `/admin/signin`. `GET /api/session` reports the role for this. Page protection is a UX convenience; the API check is the security boundary.
- **Settings**: `lib/auth-config.ts` holds the session timeout, cookie names, sign-in page, and user-name and password rules.

## Errors

Services in `lib/` throw typed errors from `lib/errors.ts`, each with an HTTP status and a stable `code`. Route handlers convert anything thrown with `toHttpError`, so a response body always has the shape `{ message, data: { code, fieldErrors? } }`. An unexpected error becomes a logged, generic 500 that never carries the original message or stack. The client reads that shape through `apiFetch` in `src/utils/api.ts`. Render errors land in `AppErrorBoundary`, mounted in `src/main.tsx`.

## Data flow example

`GET /api/customers/me`:

1. `middleware/auth.ts` resolves the session cookie into `event.context.user`, or answers 401, because the path is protected.
2. `routes/api/customers/me.get.ts` calls `getCustomerProfile` in `lib/customers.ts`.
3. `lib/customers.ts` reads the joined rows through `db/client.ts`'s Drizzle instance and shapes them with `toCustomerProfile`.
4. A missing profile becomes `NotFoundError`, which `toHttpError` turns into a 404.

The simplest shape, a route importing `db` and a table directly with no service in between, is still `routes/api/users/[id].ts`.

## Database

`db/schema.ts` defines Drizzle tables. `db/client.ts` opens the SQLite connection, runs pending migrations from `drizzle/`, and seeds two demo `users` if that table is empty. Routes import `db` and the table objects directly for simple reads (see `routes/api/users/`). Logic that more than one caller shares lives in a `lib/` service, and multi-row writes go through `withTransaction` in `lib/transaction.ts`.

Entity model:

- **accounts**: identity. Unique user name and an argon2id password hash. Every signed-in session points at one.
- **customers**: the profile, 1:1 with an account. Holds name, unique email, telephone, the address, and the preferences (locale, favourite category, MyList, pet-tips banners). An account can briefly exist without one, between registration and profile creation.
- **creditCards**: the one stored card, 1:1 with a customer and deleted with it. It is shown back masked and never charged.
- **orders**: one row per order, owned by the account that placed it (`accountId`). It holds a snapshot of the customer's name, the order date, the total in integer cents, and a `status` of `PENDING`, `APPROVED`, `DENIED` or `COMPLETED`. Only an administrator's commit moves an order out of `PENDING`, and only to `APPROVED` or `DENIED`. The vocabulary and that rule live in `lib/order-status.ts`, and every status write goes through `lib/orders.ts`. Checkout adds line items and address snapshots alongside these columns. Behaviour: `openspec/specs/order-approval/`.
- **users**: the starter's demo table. It backs `/api/users` and nothing else.

Commands and file locations:

- `bun run db:generate`: after editing `db/schema.ts`, generates a new migration into `drizzle/` (via `drizzle-kit`, config in `drizzle.config.ts`).
- `bun run db:studio`: browse the db in Drizzle Studio.
- The db file itself is `sqlite.db` at the project root (gitignored, created on first run). `drizzle/` migrations are committed.
- Every connection is opened through `db/client.ts`, which waits up to 5 s on a lock held by another process (busy timeout) and runs the file-backed db in WAL mode. Operator scripts and the server share `sqlite.db` concurrently; WAL adds `sqlite.db-wal` / `sqlite.db-shm` sidecars and requires the db on a local filesystem, and a backup must include the sidecars or checkpoint first.
- Under Vitest (`VITEST=true`), `db/client.ts` swaps in an in-memory db instead, so tests never touch the dev database.

## Testing

Four tiers, one worked example each. Commands and how to extend: [README.md](./README.md#testing), [AGENTS.md](./AGENTS.md). Server-side tests under `routes/`, `middleware/` and `lib/` run in Vitest's node "server" project. Everything else runs in jsdom.

## Deployment

- `ecosystem.config.js` (PM2) runs the real build: `.output/server/index.mjs`, under Bun (`interpreter: "bun"`) — required by `db/client.ts`'s `bun:sqlite` import. `nitro.service` (systemd) is the non-PM2 equivalent, same requirement.
- `SESSION_SECRET` (at least 32 characters) must be set in production. The server refuses to seal sessions without it. Outside production a fixed development secret is used, so dev, tests and CI need no setup. See `.env.example` and [doc/DEPLOYMENT.md](./doc/DEPLOYMENT.md).
- The session cookie is marked `Secure` in production, so production must be served over HTTPS.
- `Dockerfile`/`docker-compose.yml` build a static `dist/` served by nginx — don't rely on them for the Nitro/DB-backed API without fixing first (they never run `.output/server/index.mjs`)

## Key Decisions

- **Sessions are sealed cookies with a sliding 30-minute idle timeout; there is no session table.** Needs no dependency and no storage, and an expired session is distinguishable from none. Authored in change `swhr3-i-0002-customer-management-and-aut`, design.md D2.
- **`middleware/auth.ts` is the only place a request is authenticated.** API protection is an exact-match path list in `lib/protected-resources.ts`; pages are guarded client-side with a `redirect` query parameter. One enforcement point means a capability cannot forget to check. Authored in change `swhr3-i-0002-customer-management-and-aut`, design.md D7.
- **Passwords are hashed with `Bun.password` (argon2id).** The runtime is already Bun everywhere, so nothing needs adding. Authored in change `swhr3-i-0002-customer-management-and-aut`, design.md D4.
- **Roles live on `accounts.role` and are read from the database per request, never from the session cookie.** A revoked role applies on the next request, and adding a role invalidates no existing session. Authored in change `swhr3-i-0003-order-approval-and-status-m`, design.md D3.
- **`/api/admin/**`is administrator-only by path prefix, enforced in`middleware/auth.ts`(401 signed out, 403`FORBIDDEN`otherwise).** A new admin route cannot be added unprotected; customer paths keep the exact-match list. Authored in change`swhr3-i-0003-order-approval-and-status-m`, design.md D4.
- **Order status changes go only through `lib/orders.ts` under the transition rule in `lib/order-status.ts`, and a multi-order change is one immediate-mode `withTransaction`.** Approval, fulfilment and any later status writer share one vocabulary and one rule, and overlapping batches cannot lost-update each other. Money is stored in integer cents. Authored in change `swhr3-i-0003-order-approval-and-status-m`, design.md D1, D2 and D6.
- **Every `bun:sqlite` connection is opened through `db/client.ts` with a 5 s busy timeout, and the file-backed db runs in WAL.** Bun defaults to failing a contended lock instantly, so a connection opened any other way reintroduces 500 "database is locked" under concurrent operator scripts. Authored in change `swhr3-s-0004-bugfix-swhr3-t-0048-server`, design.md D1-D3.
- **Customer-owned data in later capabilities references `accounts.id`.** Every session carries it, and a profile may not exist yet. Contact and address data is read from the profile and snapshotted onto orders. Authored in change `swhr3-i-0002-customer-management-and-aut`, design.md D16.
- **Server-shared logic lives in `lib/`; services throw `lib/errors.ts` types; routes convert with `toHttpError`; the client calls through `apiFetch`.** One error body shape across every API. Authored in change `swhr3-i-0002-customer-management-and-aut`, design.md D11 and D13.
