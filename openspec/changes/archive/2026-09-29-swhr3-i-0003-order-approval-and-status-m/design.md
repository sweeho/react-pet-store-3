# Order Approval Design

## User interface

No screen records were extracted for this capability; its user interface is unspecified. The order approval functionality is implemented in the rich client Java Swing application, accessed through the admin interface after authentication and JNLP deployment.

## Architecture Overview

Order approval is implemented as a distributed system connecting a rich client to a backend J2EE server:

1. **Client Tier**: Java Swing application (PetStoreAdminClient) with OrdersApprovePanel
2. **Communication Tier**: HTTP/XML messaging via ApplRequestProcessor servlet
3. **Business Tier**: AdminRequestBD business delegate and EJB session beans
4. **Persistence Tier**: Order entity beans and status tracking

### Order Status Lifecycle

The system supports four order statuses:

- **PENDING**: Initial state for newly created orders, awaiting approval
- **APPROVED**: Administrator has approved the order for processing
- **DENIED**: Administrator has rejected the order
- **COMPLETED**: Order has been fulfilled and closed

### Order Approval Workflow

1. Administrator accesses admin interface via form-based authentication
2. Selects "Launch Rich Client" button, receives JNLP file with session ID
3. Java WebStart executes client with embedded session ID and server details
4. Client connects to ApplRequestProcessor to retrieve orders by status
5. OrdersApprovePanel displays orders in tabbed view with read-only and approval tabs
6. Administrator selects rows and clicks approve or deny buttons
7. Client updates table model locally (status column, row 4)
8. Administrator clicks commit button to send changes
9. TableModel.commit() packages modified orders into OrderApproval XML
10. XML sent to ApplRequestProcessor with request type UPDATESTATUS
11. ApplRequestProcessor.updateOrders() parses XML and delegates to AdminRequestBD
12. AdminRequestBD.updateOrders() persists changes via order EJB operations

### Client Components

**OrdersApprovePanel**:

- JTable displaying orders with columns: OrderId, CustomerName, OrderDate, OrderTotal, OrderStatus
- OrderStatus column (index 4) editable via JComboBox with options: PENDING, APPROVED, DENIED
- Approve button: sets all selected row statuses to APPROVED
- Deny button: sets all selected row statuses to DENIED
- Commit button: saves changes to server
- Refresh button: reloads orders from server

**TableSorter (proxy pattern)**:

- Wraps order table model to allow sorting
- Intercepts setValueAt() calls to update status column
- Triggers table repaint to reflect UI changes

**DataSource**:

- getOrders() queries server for all order status types (PENDING, APPROVED, DENIED, COMPLETED)
- RefreshAction checks for uncommitted changes (any status != PENDING)
- Warns user with JOptionPane confirmation dialog if changes exist
- Only proceeds with refresh if user confirms

### Server Components

**ApplRequestProcessor Servlet**:

- Receives POST requests with XML-encoded orders
- Extracts request type (UPDATESTATUS) from XML root element
- Calls updateOrders() for status change requests
- Returns XML response: status=SUCCESS or error message

**AdminRequestBD (Business Delegate)**:

- updateOrders() accepts OrderApproval value object
- Iterates through ChangedOrder items
- Updates each order via EJB session bean method
- Throws AdminBDException on failure (caught by servlet and returned as error response)

### XML Message Format

**Request (OrderApproval)**:

```xml
<Request>
  <RequestType>UPDATESTATUS</RequestType>
  <Order>
    <OrderId>1001</OrderId>
    <OrderStatus>APPROVED</OrderStatus>
  </Order>
  <Order>
    <OrderId>1002</OrderId>
    <OrderStatus>DENIED</OrderStatus>
  </Order>
</Request>
```

**Response**:

```xml
<Response>
  <Type>UPDATEORDERS</Type>
  <Status>SUCCESS</Status>
</Response>
```

### Data Model

**Order Entity**:

- Fields: OrderId (key), CustomerId, OrderDate, OrderTotal, OrderStatus
- OrderStatus: one of PENDING, APPROVED, DENIED, COMPLETED
- Accessed through EJB local interface for status updates

**OrderApproval Value Object**:

- Represents batch of order status changes
- Contains: List<ChangedOrder>
- Serializable for XML marshalling

**ChangedOrder Value Object**:

- Fields: orderId, orderStatus
- Extracted from XML during request parsing

### Transaction Semantics

- AdminRequestBD.updateOrders() operates within container-managed transaction
- Multiple order updates grouped in single transaction for atomicity
- Rollback on any individual order update failure
- Response indicates SUCCESS or returns exception details

## Legacy Implementation Notes

### Client-Server Communication

- HTTP POST to /admin/ApplRequestProcessor
- Request body: XML-serialized OrderApproval
- Response content-type: text/xml
- Session ID embedded in JNLP file passed as cookie in requests

### Uncomitted Changes Detection

- RefreshAction iterates through OrdersApproveTableModel rows
- Checks column 4 (status) value against PENDING
- Any non-PENDING value indicates uncommitted change
- Dialog title and message retrieved from resource bundle

### Order Status UI Binding

- JComboBox cell editor with three options (not COMPLETED, as client cannot complete orders)
- setValueAt() called on TableSorter when combo box selection changes
- Immediate table repaint() triggered after status change
- No automatic persistence; changes only saved on commit

### Error Handling

- ApplRequestProcessor catches AdminBDException
- Returns XML error response with exception message
- Client should display error dialog to user

## Constraints and Assumptions

1. **Order Status Enumeration**: Exactly four statuses (PENDING, APPROVED, DENIED, COMPLETED); no custom statuses allowed
2. **Client Status Filtering**: Client combo box only offers APPROVED and DENIED (not PENDING or COMPLETED)
3. **Batch Atomicity**: All changes in single commit either all succeed or all rollback
4. **Uncommitted Loss Warning**: Only checks for status != PENDING; assumes all changes represent non-PENDING transitions
5. **Session Persistence**: JNLP embeds session ID; if session expires, subsequent requests fail with "Session Timed Out"
6. **XML Serialization**: OrderApproval must be parseable by ApplRequestProcessor.updateOrders() XML parsing logic
7. **No Partial Failure**: If one order fails, entire update fails (atomic transaction)

## Key Files

- **Client**: PetStoreAdminClient.java (main), OrdersApprovePanel.java, DataSource.java
- **Server**: ApplRequestProcessor.java, AdminRequestBD.java
- **Value Objects**: OrderApproval.java, ChangedOrder.java
- **Deployment**: admin.jnlp (generated JNLP template)

## Performance Considerations

- OrdersApprovePanel loads all orders into memory (no pagination)
- Each approve/deny click updates table model immediately (no network latency)
- Commit sends all changes in single request (efficient batch processing)
- Refresh loads all orders from server (potential bottleneck for large datasets)
- XML parsing in updateOrders() iterates through entire NodeList

# Rebuild on this repository (sprint SWHR3-S-0003)

Everything above this heading is the extracted legacy design and is left as extracted. This part records how the capability is rebuilt on this repository. Where the two disagree, this part wins for implementation, and `## Spec discrepancies` below says how each scenario is verified.

## Codebase findings

Measured on `vortex/sprint/swhr3-s-0003-21038629` at `8abd6a0`.

- **No order data exists.** `db/schema.ts` has `users` (starter demo), `accounts`, `customers` and `credit_cards`. Migrations stop at `drizzle/0002_breezy_ultimo.sql`. Nothing creates orders; checkout is `swhr3-i-0005`.
- **Authentication is real, roles are not.** SWHR3-S-0001 replaced the stub. `middleware/auth.ts` resolves a sealed-cookie session (`lib/session.ts`) into `event.context.user = { id, username }` and 401s on an exact-match path list (`lib/protected-resources.ts`). No account has a role, so nothing can tell an administrator from a customer. The idea description ("hardcoded `{ name: "Yeasin" }`", "one table") predates S-0001 and is stale.
- **Shared server logic already has a home.** `lib/` holds services that throw typed errors (`lib/errors.ts`), and routes convert them with `toHttpError`, giving every error body the shape `{ message, data: { code, fieldErrors? } }`. Multi-row writes go through `withTransaction` (`lib/transaction.ts`), which is synchronous on bun-sqlite and already implements the legacy `Required` semantics. `db.transaction` accepts `behavior: "immediate"`.
- **Client conventions.** `apiFetch` (`src/utils/api.ts`) is the only client HTTP path and raises `ApiError` carrying the server body. `useSession` (`src/hooks/use-session.ts`) reads `GET /api/session`. Page protection is `RequireAuth` plus `PROTECTED_PAGE_PATHS`. `src/` cannot import `lib/`: shared values are mirrored under `src/constants/`, and a parity test keeps each mirror equal to its server original (`tsconfig.node.json` includes the mirrored file).
- **UI primitives.** `src/components/ui/` has Button, Input, Label, Checkbox, Select, Alert and FormField. There is no Table, Dialog or status badge. `@headlessui/react` (Dialog) is already a dependency, used by `src/pages/index.tsx`. The mockups use the existing Space Grotesk font and neutral tokens.
- **Test harness.** Vitest runs a `server` project (`routes/`, `middleware/`, `lib/`, node environment, in-memory db) and a `client` project (jsdom). Playwright runs against the dev server on :5178 with the persistent file-backed `sqlite.db`, fully parallel, so every E2E test must create its own data. The E2E runner cannot import `bun:sqlite`.
- **CI.** `.github/workflows/ci.yml` already runs doc links, typecheck, lint, unit, build and E2E on push and pull request to `vortex/**`, `dev` and `main`. It needs no change: new tests land in the existing jobs.
- **Manifest regression test.** `src/utils/manifest-change-dirs.test.ts` (SWHR3-T-0023) requires every `build/manifest.yaml` `change.dir` to exist. When this sprint closes, the platform archives this change to `openspec/changes/archive/<date>-swhr3-i-0003-…`, the `order-approval` path dangles, and the test fails on the land. Phase 7 fixes that.

## Decisions

- **D1 — One `orders` table, owned by this change and extended by checkout.** Columns: `id` (integer PK, autoincrement), `accountId` (FK `accounts.id`, per ARCHITECTURE Key Decision "customer-owned data references `accounts.id`"), `customerName` (text snapshot of the name at order time), `orderDate` (timestamp), `totalCents` (integer; money is never a float), `status` (text, one of D2, default `PENDING`), `updatedAt` (timestamp). `swhr3-i-0005` adds line items and address snapshots as new columns and tables; it does not reshape these.
- **D2 — The status vocabulary lives in one module.** `lib/order-status.ts` exports `ORDER_STATUSES = ["PENDING","APPROVED","DENIED","COMPLETED"]` and `ASSIGNABLE_STATUSES = ["APPROVED","DENIED"]`, plus `assertTransition(from, to)`. The only legal administrator transitions are `PENDING → APPROVED` and `PENDING → DENIED`. Every other pair throws `InvalidTransitionError` (409, code `INVALID_TRANSITION`), with a message naming the order and its current status. `src/constants/order-status.ts` mirrors both arrays, and a parity test holds them equal.
- **D3 — Roles live on `accounts.role` and are read per request.** New column `role` (text, not null, default `"customer"`; this change uses only `"customer"` and `"admin"`). The role is **not** put in the session cookie: the middleware reads it from the database for admin paths, so a revoked role takes effect on the next request and existing cookies stay valid. `lib/roles.ts` owns `getAccountRole(accountId)`.
- **D4 — `/api/admin/**`is admin-only by prefix, enforced in`middleware/auth.ts`.** No session on an admin path gives the existing 401 ("Authentication required" / "Session timed out"). A session whose account is not `admin`gives 403`FORBIDDEN` "Administrator credentials required" (`ForbiddenError`in`lib/errors.ts`). This is a prefix, not the exact-match list, so a future admin route cannot be added unprotected. Customer paths keep the exact-match list.
- **D5 — The transport is JSON over the existing error shape.** No XML, servlet, business delegate, EJB or JNLP (canvas non-scope). `GET /api/admin/orders` returns all four groups. `POST /api/admin/orders/status` takes an `OrderApprovalRequest` with a `requestType` discriminator and answers `{ type: "UPDATEORDERS", status: "SUCCESS", updated }`. Failures use the standard `toHttpError` body, whose `message` carries the server's explanation. See C4–C6.
- **D6 — One batch is one immediate transaction.** `lib/order-approval.ts` `updateOrders(changes)` runs every change in a single `withTransaction(…, { behavior: "immediate" })`. Each change calls `updateOrderStatus`, which re-reads the row inside the transaction and applies D2. Any failure (unknown id, non-PENDING row, validation) throws, and nothing in the batch persists. Immediate mode takes the write lock at `BEGIN`, so a second administrator's overlapping commit waits and then fails cleanly on the now non-PENDING row instead of lost-updating it.
- **D7 — Transitions are enforced and logged, not audited.** A successful commit writes one server log line, `order-approval: committed N (id→STATUS, …)`, without the actor, because the PRD non-goal forbids an audit trail of who decided what. Nothing is persisted beyond the new status and `updatedAt`.
- **D8 — Staged decisions are client state keyed by order id.** `useStagedDecisions` keeps a `Map<orderId, "APPROVED"|"DENIED">`. "Uncommitted changes exist" means the map is non-empty; the legacy "any row whose status is not PENDING" test is not used (SD7). Staging a row back to PENDING is not offered. "Clear selection" deselects rows only, and a staged row is un-staged by removing its entry.
- **D9 — The UI is an admin area at `/admin`, gated in the shell.** `AdminShell` wraps every admin page: header "Pet Store · ADMIN", an Orders nav link, the user name with an ADMINISTRATOR badge, and Sign out. Its `RequireAdmin` gate sends a signed-out visitor, or a non-admin, to `/admin/signin?redirect=<path>`. That page signs in through the existing `POST /api/auth/signin`, then checks the role; a non-admin sees the "This account is not an administrator" state. Pages: `/admin` (home with the four counts), `/admin/orders` (queue), `/admin/signin`. There is no Reports link (`admin-dashboard`, `swhr3-i-0008`).
- **D10 — The queue follows the wireframe's four tabs, styled like the mockup.** The tabs are Pending, Approved, Denied and Completed, each with its count, which the "four statuses displayed" scenario needs; the mockup's two-tab "Pending / Decided" layout is not used. Only the Pending tab is editable (row checkboxes, Approve selected, Deny selected, a per-row status select offering only APPROVED/DENIED). The other tabs are read-only. Every column is client-side sortable. The commit button reads "Commit N decisions".
- **D11 — Commit and refresh each confirm in a dialog.** Commit opens a dialog listing `id: PENDING → STATUS` for every staged change and saying it is all-or-nothing. On success, a success alert shows and the orders reload; on failure, a destructive alert quotes the server message and every staged decision is kept. Refresh with staged changes opens "Discard N uncommitted changes?" with the options "Cancel — keep my changes" and "Refresh anyway". Refresh with nothing staged reloads immediately.
- **D12 — Admins are provisioned by an operator script, and E2E data by a seed script.** `db/grant-admin.ts <username>` sets `role = "admin"` on an existing account, exposed as the package script `admin:grant`; there is no admin UI. `db/seed-orders.ts` inserts PENDING orders for a given account and prints their ids as JSON, for local demos and for E2E. The Playwright spec spawns both under Bun, because the E2E runner cannot load `bun:sqlite`. No test-only HTTP endpoint exists.

## Interface contracts

Fixed. A ticket that needs one of these changed stops and asks planning.

- **C1 — Schema** (`db/schema.ts`, migration `drizzle/0003_*`): `orders` as D1, and `accounts.role` as D3. Export name: `orders`.
- **C2 — Status module** (`lib/order-status.ts`): `ORDER_STATUSES`, `ASSIGNABLE_STATUSES`, `type OrderStatus`, `type AssignableStatus`, `isOrderStatus(v)`, `isAssignableStatus(v)`, `assertTransition(orderId: number, from: OrderStatus, to: OrderStatus): void`. Mirror: `src/constants/order-status.ts` exports the same two arrays and two types.
- **C3 — Orders service** (`lib/orders.ts`): `type OrderRow = { id: number; customerName: string; orderDate: string /* ISO 8601 */; totalCents: number; status: OrderStatus }`, `listOrdersByStatus(status): OrderRow[]`, `getOrdersGroupedByStatus(): Record<OrderStatus, OrderRow[]>` (all four keys always present, each sorted by `orderDate` ascending), `updateOrderStatus(tx: DbOrTx, orderId: number, to: AssignableStatus): void` (throws `NotFoundError` or `InvalidTransitionError`).
- **C4 — Batch service** (`lib/order-approval.ts`): `type ChangedOrder = { orderId: number; status: AssignableStatus }`, `type OrderApproval = { changes: ChangedOrder[] }`, `updateOrders(approval: OrderApproval): { updated: number }`.
- **C5 — Request parsing** (`lib/order-approval-request.ts`): `parseOrderApprovalRequest(body: unknown): OrderApproval`. It requires `requestType === "UPDATESTATUS"` and a non-empty `changes` array of at most 500 entries, each with a positive integer `orderId` (no duplicates) and a `status` in `ASSIGNABLE_STATUSES`. Otherwise it throws `ValidationError` (422) with `fieldErrors` keyed `requestType`, `changes`, or `changes.<index>.orderId|status`.
- **C6 — HTTP**:
  - `GET /api/admin/orders` → 200 `{ orders: Record<OrderStatus, OrderRow[]> }`.
  - `POST /api/admin/orders/status` with body `{ requestType: "UPDATESTATUS", changes: ChangedOrder[] }` → 200 `{ type: "UPDATEORDERS", status: "SUCCESS", updated: number }`; errors 422, 404, 409 or 500 in the `toHttpError` shape.
  - Both return 401 when signed out and 403 `FORBIDDEN` when signed in without the admin role (D4).
  - `GET /api/session` → `user` gains `role: "customer" | "admin"`.
- **C7 — Errors** (`lib/errors.ts`): `InvalidTransitionError` (409, `INVALID_TRANSITION`) and `ForbiddenError` (403, `FORBIDDEN`, default message "Administrator credentials required").
- **C8 — Transaction helper** (`lib/transaction.ts`): `withTransaction(fn, outer?, options?: { behavior?: "deferred" | "immediate" | "exclusive" })`. Existing call sites are unchanged.
- **C9 — Client types** (`src/types/order-approval.ts`): `OrderRow`, `OrdersByStatus`, `ChangedOrder`, `OrderApprovalRequest`, `OrderApprovalResponse`, matching C3–C6.
- **C10 — Staged decisions hook** (`src/hooks/use-staged-decisions.ts`): `useStagedDecisions()` → `{ staged: ReadonlyMap<number, AssignableStatus>; stage(ids: number[], status: AssignableStatus): void; unstage(id: number): void; clear(): void; count: number; hasUncommittedChanges: boolean; toRequest(): OrderApprovalRequest }`. `toRequest()` lists changes in ascending `orderId` order.
- **C11 — Client API** (`src/utils/admin-orders-api.ts`): `fetchOrdersByStatus(): Promise<OrdersByStatus>` and `commitOrderDecisions(req: OrderApprovalRequest): Promise<OrderApprovalResponse>`. Both go through `apiFetch` with the session cookie and surface `ApiError` unchanged.
- **C12 — UI components**: `Table` family, `Badge` (variant per status) and `Dialog` (headlessui-based) in `src/components/ui/`. `OrdersTable` (`src/components/admin/orders-table.tsx`) takes props `{ rows, editable, staged, selectedIds, onSelectionChange, onStage, sort, onSortChange }`. `CommitDecisionsDialog` and `RefreshOrdersControl` in `src/components/admin/`. `AdminShell` and `RequireAdmin` in `src/components/admin/`.

## Phases

1. **Data and rules** — C1, C2, C3 and C7 (the schema, status module, orders service and errors).
2. **Server write path** — C4, C8, C5 and the two admin routes (C6), plus admin authorization (D3, D4).
3. **Client building blocks** — C9, C10, C11 and the C12 primitives.
4. **Admin area** — the shell, gate, sign-in-required page, home and queue page (D9, D10).
5. **Commit and refresh flows** — D11.
6. **Test harness** — every ticket adds its own colocated tests: `lib/`, `routes/` and `middleware/` tests run in the Vitest `server` project, component and page tests in `client`. The new E2E spec `e2e/order-approval.spec.ts` gets its data from `db/grant-admin.ts` and `db/seed-orders.ts` under Bun (D12). Each test uses unique accounts and its own order ids, because the E2E database persists and runs in parallel.
7. **CI** — no workflow change: `.github/workflows/ci.yml` already runs every tier on pushes and pull requests to `vortex/**`. The manifest regression test is taught to accept an archived change directory (`openspec/changes/archive/<date>-<id>`), so this sprint's own archive does not fail the land.

## Spec discrepancies

The delta spec describes the legacy mechanism. Each row says how QA verifies that scenario on this repository.

| #    | Spec says                                                                                        | This repository                                                                                               | Verify the scenario as                                                                   |
| ---- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| SD1  | Swing `OrdersApprovePanel`, `JTable`, `TableSorter`                                              | React page `/admin/orders`, `OrdersTable`, client-side sort                                                   | the page and component behaviour                                                         |
| SD2  | XML `OrderApproval` with `<RequestType>`, `<Order><OrderId><OrderStatus>`                        | JSON `{ requestType: "UPDATESTATUS", changes: [{ orderId, status }] }` (C6)                                   | the JSON body carries the same fields; "XML" reads as "the request body"                 |
| SD3  | HTTP POST to `ApplRequestProcessor`; routing on `RequestType`                                    | `POST /api/admin/orders/status`; the handler rejects any `requestType` other than `UPDATESTATUS` with 422     | the route                                                                                |
| SD4  | `AdminRequestBD.updateOrders()` and `ChangedOrder` objects                                       | `lib/order-approval.ts` `updateOrders()` and the `ChangedOrder` type; `parseOrderApprovalRequest` builds them | the service                                                                              |
| SD5  | XML response `Type=UPDATEORDERS`, `Status=SUCCESS`; XML error carrying the exception message     | JSON `{ type: "UPDATEORDERS", status: "SUCCESS", updated }`; the error body `{ message, data: { code } }`     | JSON fields                                                                              |
| SD6  | Container-managed transaction, attribute `Required`                                              | `withTransaction` (already `Required`-shaped), immediate mode (D6)                                            | persisted rows after a mixed batch                                                       |
| SD7  | "Uncommitted" means any row status other than PENDING                                            | a non-empty staged map (D8)                                                                                   | the dialog appears exactly when something is staged                                      |
| SD8  | JNLP embeds `req.getSession().getId()`; the client uses it for requests                          | no WebStart: the browser sends the sealed httpOnly `petstore_session` cookie on every same-origin request     | the admin API accepts the session cookie from sign-in, and a request without it gets 401 |
| SD9  | Combo box offers PENDING, APPROVED, DENIED (design text); scenario says APPROVED and DENIED only | APPROVED and DENIED only (the scenario and the wireframe win)                                                 | the select's options                                                                     |
| SD10 | "Administrator credentials required" via form login and role                                     | `accounts.role`, a 403 from the middleware, and the `/admin/signin` state (D3, D4, D9)                        | 403 plus the UI state                                                                    |
| SD11 | The idea AC lists "pending, approved, processing, or completed"                                  | the spec's four: PENDING, APPROVED, DENIED, COMPLETED. There is no "processing" status                        | the four statuses                                                                        |
| SD12 | The idea AC says transitions are "enforced and logged"; the PRD non-goal forbids an audit trail  | enforced (D2); one log line per commit without the actor (D7)                                                 | enforcement; the log line                                                                |
| SD13 | The idea description puts pages under `src/pages/orders/`, has no service layer, and a stub auth | pages under `src/pages/admin/`; services in `lib/` per ARCHITECTURE; real sessions from S-0001                | —                                                                                        |
| SD14 | The hi-fi mockup shows two tabs (Pending review / Decided) and a Reports nav                     | the wireframe's four tabs (D10); no Reports link until `admin-dashboard`                                      | the four tabs                                                                            |
| SD15 | The mockup's sign-in note mentions ending a supplier session                                     | there is no supplier role yet; the note is omitted                                                            | —                                                                                        |

## Risks

- **R1 — E2E data isolation.** The E2E database persists across runs, so the pending queue grows with every run. Tests must address rows by the ids the seed prints, never by position.
- **R2 — Ticket fan-out.** The given decomposition is 12 tickets for one capability. Contracts C1–C12 are what keep parallel tickets from colliding; a ticket that has to break one stops and asks.

## Ticket map

EPIC SWHR3-T-0032. Stories: SWHR3-T-0033 (server rules and write path), SWHR3-T-0034 (read path and admin area), SWHR3-T-0035 (staging, commit, refresh, E2E). One TASK per `tasks.md` group, in group order.

| Group                             | TASK         | Story  | Depends on                             | Scenarios (acceptance criteria)                                                              |
| --------------------------------- | ------------ | ------ | -------------------------------------- | -------------------------------------------------------------------------------------------- |
| 1. Order Status Management        | SWHR3-T-0036 | T-0033 | —                                      | Orders are queryable by status                                                               |
| 2. Rich Client UI                 | SWHR3-T-0037 | T-0035 | T-0036                                 | Status values available; Single → APPROVED; Multiple denied; Only APPROVED/DENIED options    |
| 3. Client-Side Change Tracking    | SWHR3-T-0038 | T-0035 | T-0036                                 | Serialized format; OrderApproval format                                                      |
| 4. Server Communication Protocol  | SWHR3-T-0039 | T-0033 | T-0045                                 | UPDATESTATUS processed; Success response; Error response; Request type routing               |
| 5. Business Delegate              | SWHR3-T-0040 | T-0033 | T-0036                                 | All persisted or all rolled back                                                             |
| 6. Data Retrieval and Filtering   | SWHR3-T-0041 | T-0034 | T-0036                                 | All status groups retrieved on refresh                                                       |
| 7. Uncommitted Changes Detection  | SWHR3-T-0042 | T-0035 | T-0046                                 | Warning displayed; Refresh confirmed; Refresh cancelled                                      |
| 8. Client-Server Integration      | SWHR3-T-0043 | T-0035 | T-0037, T-0038                         | Changes batched and sent on commit; Session ID in JNLP; Session ID used                      |
| 9. Transaction Management         | SWHR3-T-0044 | T-0033 | T-0040                                 | Single transaction; Partial failure rollback                                                 |
| 10. Error Handling and Validation | SWHR3-T-0045 | T-0033 | T-0040                                 | Parsed from request; ChangedOrder created; OrderApproval collects; Administrator restriction |
| 11. Admin Interface Integration   | SWHR3-T-0046 | T-0034 | T-0037, T-0038, T-0041, T-0043, T-0045 | (contract criteria: gate, home, four tabs)                                                   |
| 12. Testing and Validation        | SWHR3-T-0047 | T-0035 | T-0039, T-0042, T-0044, T-0046         | (end-to-end journey; archive-safe manifest test)                                             |

Tickets that run in parallel have disjoint file ownership. The files shared in sequence are `src/pages/admin/orders.tsx` (T-0046, then T-0042) and `lib/order-approval.ts` (T-0040, then T-0044). Nobody edits the `src/utils/index.ts`, `src/hooks/index.ts` or `src/types/index.ts` barrels; import new modules by path.
