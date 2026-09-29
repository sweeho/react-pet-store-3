# Supplier Integration Design

## User Interface

Three screen records were extracted for this capability. Their visible contracts are specified in specs/supplier-integration/spec.md as requirements.

## Architecture Overview

The supplier integration system is implemented as a supplier portal with request processing, inventory management, and order fulfillment workflows:

1. **Web Tier**: RcvrRequestProcessor servlet routes supplier requests based on screen parameter
2. **Request Processing**: Handles inventory display, updates, and order status queries
3. **Session Management**: Maintains supplier administrator sessions with role-based access
4. **Inventory Management**: Tracks and updates inventory levels with automatic order reprocessing
5. **Order Processing**: SupplierOrder entities with state management and fulfillment tracking
6. **Business Logic Tier**: Inventory updates trigger automatic reprocessing of pending orders
7. **Data Tier**: CMP 2.x entity beans with container-managed relationships

### Supplier Portal Workflow

1. **Authentication**: Supplier administrator logs in with authentication check
2. **Inventory View**: Display current inventory levels for all items
3. **Inventory Update**: Modify quantities for selected items via form submission
4. **Order Reprocessing**: Automatically retry pending orders after inventory changes
5. **Invoice Generation**: Generate invoices for completed orders
6. **Order Status**: Track orders through pending, processing, and completed states
7. **Shipment Tracking**: Update order status with delivery information

### Key Components

**RcvrRequestProcessor** (Servlet):

- Routes requests based on currentScreen parameter
- Handles "displayinventory" screen for viewing inventory
- Handles "updateinventory" screen for inventory modifications
- Coordinates transaction management for multi-step operations
- Calls DisplayInventoryBean for screen display
- Calls InventoryEJB for inventory operations
- Manages order reprocessing after inventory updates

**SupplierOrder Entity** (CMP 2.x):

- poId (String, primary key): Unique purchase order identifier
- poDate (long): Timestamp of order creation
- poStatus (String): Current order status (pending, processing, completed)
- Relationship to ContactInfo for shipping address
- Tracks supplier orders received from petstore

**ContactInfo Entity** (CMP 2.x):

- givenName, familyName: Receiver name
- email, telephone: Contact information
- One-to-one relationship to Address entity
- Stores shipping address information

**Address Entity**:

- Street address fields
- City, state, postal code
- Country information
- Related to ContactInfo via one-to-one relationship

**InventoryLocal Interface**:

- findByPrimaryKey(itemId) - retrieve inventory item
- Provides access to inventory quantities

**DisplayInventoryBean**:

- getInventory() - retrieves all inventory items for display
- Used by displayinventory.jsp to render inventory table

### Request Processing Flow

1. RcvrRequestProcessor.doGet() checks authentication and authorization
2. Checks role: isUserInRole("administrator")
3. Routes based on currentScreen parameter
4. For "displayinventory": forwards to displayinventory.jsp
5. For "updateinventory": begins transaction, calls updateInventory, calls processPendingPO, commits
6. updateInventory parses request parameters matching patterns: qty_itemId, item_itemId
7. processPendingPO retries any pending SupplierOrder entities
8. Automatic invoice generation for completed orders

### Data Model

**SupplierOrder**:

- One-to-many relationship with OrderLineItem entities
- One-to-one relationship with ContactInfo for delivery address
- poStatus field defines order lifecycle state
- poDate captures order creation timestamp

**ContactInfo**:

- One-to-one relationship with SupplierOrder (foreign key reference)
- One-to-one relationship with Address
- Stores receiver contact details

**Address**:

- Related to ContactInfo (one-to-one)
- Stores complete delivery address information

### Transactions

All supplier order operations execute within container-managed transactions:

- Order creation within SupplierOrderEJB
- Inventory updates with Required attribute
- Order reprocessing within transaction boundary
- Invoice generation within order processing transaction

### Security

Supplier portal protected by:

- web.xml security-constraint restricting access to administrator role
- isUserInRole("administrator") check in RcvrRequestProcessor
- Session-based authentication for supplier administrators
- Unchecked permission for unauthenticated access (handled by container)

### Integration Points

- Inventory system integration for real-time quantity lookup and update
- Order processing system integration for pending order retry
- Invoice generation system triggered after order fulfillment
- Supplier order lifecycle management with status tracking

### Notable Implementation Details

- Checkbox named "item_itemId" marks items for update (may represent UI artifact)
- Quantity update parameters follow pattern "qty_itemId"
- RcvrRequestProcessor begins/commits transaction boundaries manually
- processPendingPO called automatically after inventory updates
- Invoice generation triggered within same transaction as order reprocessing
- displayinventory.jsp uses DisplayInventoryBean for data retrieval
- InventoryLocal home obtained via ServiceLocator pattern

## Key Files

- **Supplier Portal Servlet**: RcvrRequestProcessor.java
- **Entity Beans**: SupplierOrderEJB.java, ContactInfoEJB.java, AddressEJB.java
- **Business Beans**: DisplayInventoryBean.java
- **Interfaces**: SupplierOrderLocal.java, InventoryLocal.java
- **Views**: displayinventory.jsp
- **Configuration**: ejb-jar.xml, web.xml, struts-config.xml

---

## Rebuild on this repository (sprint SWHR3-S-0009)

Everything above this heading was extracted from the legacy system. Everything below records how this repository delivers it. Implementation tickets read this section first. It cites decisions as `D`, fixed interface contracts as `C` and spec discrepancies as `SD`. The designs are in `artifacts/SWHR3-S-0009/design/` (index `MANIFEST.md`).

### Codebase findings

- **The idea's picture of the repo is stale.** Accounts, sessions, roles (`customer` / `admin`), the catalogue, the cart, checkout, order approval and the order workflow have all shipped.
- **Change `swhr3-i-0006-order-processing-and-fulfil` already built the tables this capability needs:** `inventory`, `inventory_reservations` and `supplier_purchase_orders`, with `line_items.supplier_po_id`. It also built:
  - `lib/inventory.ts`: `reserveInventory`, which is all-or-nothing, and `setInventory`.
  - `lib/supplier-pos.ts`: `createSupplierPOs`, which groups by supplier with a 7-day delivery expectation, and `markPoShipped`.
  - `lib/process-manager.ts`:
    - `allocateOrder`, run at admin approval: it reserves stock and creates POs, or returns WAITING with no PO.
    - `retryWaitingAllocations`.
    - `recordShipment`, which moves the stage to SHIPPED and the status to COMPLETED when every PO has shipped.
  - The operator scripts `db/seed-inventory.ts`, `db/allocate-waiting.ts` and `db/ship-supplier-po.ts`.

  That change's SD4 says this capability builds on these and must not recreate them.

- **PO statuses today are `OPEN` and `SHIPPED`.** The order-workflow spec of record does not name PO statuses.
- **`line_items` already carries the seven legacy line-item attributes:** category, product, item, line number, quantity, unit price in cents, and quantity shipped. Nothing writes `quantity_shipped` yet.
- **Auth.** `lib/roles.ts` defines `AccountRole = "customer" | "admin"`, read from the database per request. `middleware/auth.ts` enforces the `/api/admin/` prefix (401 without a session, 403 for the wrong role). `db/grant-admin.ts` is the provisioning script (`admin:grant`). The admin area has `AdminShell`, `RequireAdmin` and `/admin/signin` to copy.
- **Other patterns to reuse.** JSON bodies are read with `lib/json-body.ts` `readJsonBody`. Every multi-row write uses `withTransaction(fn, outer, { behavior: "immediate" })`. The `src/components/ui/` primitives (`Table`, `Input`, `Checkbox`, `Alert`, `Button`) all exist.
- **Tests.** `lib/`, `routes/` and `middleware/` tests run in the Vitest server project against the in-memory db. E2E seeds with Bun scripts and grants roles with the grant scripts.
- **CI.** `.github/workflows/ci.yml` already runs every tier on `vortex/**`. No workflow change is needed.

### Decisions

- **D1 — The portal belongs to a new `supplier` role, labelled "Supplier administrator".**
  - The PRD gives supplier staff their own login and says administrators cannot modify inventory. The mockups name the role "Supplier administrator" and show "Access denied" to anyone without it.
  - `AccountRole` gains `"supplier"`.
  - The `/api/supplier/` prefix answers 401 without a session and 403 `FORBIDDEN` for any other role, store administrators included.
  - Operators grant the role with `bun run supplier:grant <username>`.
  - The pages are `/supplier/signin`, and `/supplier` behind `RequireSupplier` inside `SupplierShell`.
- **D2 — Supplier orders are the existing `supplier_purchase_orders`, with a new status vocabulary: `PENDING → PROCESSING → COMPLETED`.**
  - Migration `0007` maps `OPEN` to `PROCESSING` (stock was already reserved) and `SHIPPED` to `COMPLETED`, and changes the default to `PENDING`.
  - `poId` is the integer `id` and `poDate` is `created_at` (SD2).
- **D3 — Approval always creates PENDING POs, then tries to fulfil them.**
  - `allocateOrder` (APPROVED at CONFIRMED) creates the POs as `PENDING`, copies the delivery contact and address (D4), and calls `fulfilSupplierOrder` for each PO.
  - When every PO of the order is `PROCESSING`, the stage becomes ALLOCATED and the result is `ALLOCATED`; otherwise `WAITING`.
  - Observable order-workflow behaviour is unchanged. A stocked order is reserved and ALLOCATED at approval, and a short one waits at CONFIRMED, now with a PENDING PO rather than none.
- **D4 — Each PO gets a delivery contact and address, copied at creation from the order's `SHIP_TO` snapshot.**
  - `supplier_po_contacts` (1:1 with the PO, cascade delete) holds given name, family name, email and telephone.
  - `supplier_po_addresses` (1:1 with the contact, cascade delete) holds address lines 1–2, city, state or province, postal code and country.
  - The portal never displays them (PRD: supplier staff see no customer data, SD5). They exist for shipping and are read only by `getSupplierOrder`.
- **D5 — Fulfilling a PO checks and deducts inventory, all-or-nothing per PO.**
  - `fulfilSupplierOrder(tx, poId)` acts only on a `PENDING` PO. It calls `reserveInventory` for that PO's lines.
  - On success the PO becomes `PROCESSING`.
  - On shortage nothing is deducted, the PO stays `PENDING`, and the attempt is recorded as `UNABLE` with the short items (D10).
  - `processPendingSupplierOrders(tx)` runs every `PENDING` PO, oldest first. `retryWaitingAllocations()` now delegates to it.
- **D6 — An inventory update and the reprocessing it triggers are one immediate transaction.**
  - `applyInventoryUpdate(updates, outer?)` sets each quantity (logging before and after), then calls `processPendingSupplierOrders`.
  - Any failure rolls back both.
  - `POST /api/supplier/inventory` calls it.
- **D7 — The form keeps the legacy field names, sent as a flat JSON object.**
  - Each row has `qty_<itemId>` (text) and `item_<itemId>` (checkbox).
  - `parseInventoryForm(body)` keeps only rows whose checkbox is ticked and whose quantity is a whole number ≥ 0. Every other row is skipped silently, as the spec requires.
  - The route answers 200 `{ updated: string[], processedOrders: number, fulfilledOrders: number, inventory: InventoryRow[] }`.
- **D8 — Inventory lists every catalogue item.** `getInventory()` left-joins `catalog_items` to `inventory`; an item with no row shows quantity 0. This answers "where does initial inventory come from". The columns are item ID and quantity only, per the spec and mockup.
- **D9 — The invoice is generated at completion and drives order completion.**
  - `recordShipment(poId, tracking)` moves the PO `PROCESSING → COMPLETED` with its tracking number.
  - It generates a `supplier_invoices` row: PO, order, invoice date, line JSON (item, quantity, unit price, line total), total in cents, status `SENT`, and a snapshot of the delivery contact.
  - It then delivers the invoice in-process to the order side with `receiveInvoice(tx, invoiceId)`. That sets `line_items.quantity_shipped` for the PO's lines, and when every PO of the order is `COMPLETED` it moves the stage to SHIPPED and the status to COMPLETED.
  - All of this is one transaction. There is no JMS; the typed in-process call is the "topic" (SD3).
- **D10 — Every fulfilment attempt is recorded** in `supplier_fulfilment_attempts`: PO, time, result `FULFILLED` or `UNABLE`, and JSON of the short items. Each attempt is also logged. Supplier inventory changes are logged with before and after values.

### Fixed interface contracts

- **C1 — Schema** (`db/schema.ts`, migration `drizzle/0007_*`, new tables registered in `db/client.ts`):
  - `supplier_purchase_orders.status` defaults to `'PENDING'`, with the data mapping of D2.
  - `supplierPoContacts` = `supplier_po_contacts`: `supplierPoId` PK → POs, on delete cascade; `givenName`, `familyName`, `email`, `telephone`.
  - `supplierPoAddresses` = `supplier_po_addresses`: `supplierPoId` PK → `supplier_po_contacts`, on delete cascade; `address1`, `address2` (nullable), `city`, `stateOrProvince`, `postalCode`, `country`.
  - `supplierInvoices` = `supplier_invoices`: `id` PK; `supplierPoId` unique → POs; `orderId`; `invoiceDate`; `lines` (JSON); `totalCents`; `status` default `'SENT'`.
  - `supplierFulfilmentAttempts` = `supplier_fulfilment_attempts`: `id` PK; `supplierPoId`; `attemptedAt`; `result`; `detail` (JSON).
- **C2 — `lib/supplier-order-status.ts`:**
  - `SUPPLIER_ORDER_STATUSES = ["PENDING", "PROCESSING", "COMPLETED"]` and `type SupplierOrderStatus`.
  - `assertSupplierOrderTransition(poId, from, to)`, legal only for PENDING→PROCESSING and PROCESSING→COMPLETED. It throws `InvalidTransitionError`, reused.
- **C3 — Contact and address modules:**
  - `lib/supplier-order-contacts.ts`: `interface SupplierContact { givenName; familyName; email; telephone }`, `insertSupplierContact(tx, poId, c)` and `getSupplierContact(poId, tx?)`.
  - `lib/supplier-order-addresses.ts`: `interface SupplierAddress { address1; address2: string | null; city; stateOrProvince; postalCode; country }`, `insertSupplierAddress(tx, poId, a)` and `getSupplierAddress(poId, tx?)`.
- **C4 — `lib/supplier-orders.ts`:**
  - `getSupplierOrder(poId, tx?)` returns `{ poId, poDate, poStatus, orderId, supplierId, expectedDeliveryDate, trackingNumber, contact, address, lines }`, where `lines` are the PO's `line_items` rows with all seven attributes.
  - `listSupplierOrders(status?)`.
  - `deleteSupplierOrder(tx, poId)` is used for cascade tests only.
- **C5 — `lib/inventory.ts` additions:**
  - `interface InventoryRow { itemId: string; quantity: number }`
  - `getInventory(tx?): InventoryRow[]`, in item-id order
  - `getInventoryItem(itemId, tx?): InventoryRow`, which throws `NotFoundError` for a non-catalogue item
  - `updateQuantity(tx, itemId, quantity): { before: number; after: number }`
- **C6 — `lib/supplier-request.ts`:** `QTY_FIELD_PREFIX = "qty_"`, `ITEM_FIELD_PREFIX = "item_"`, and `parseInventoryForm(body: unknown): { itemId: string; quantity: number }[]`. A checkbox counts as ticked for `true`, `"on"` or `"true"`.
- **C7 — `lib/inventory-update.ts`:** `applyInventoryUpdate(updates, outer?)` returns `{ updated: string[]; processedOrders: number; fulfilledOrders: number }`.
- **C8 — `lib/supplier-fulfilment.ts`:**
  - `fulfilSupplierOrder(tx, poId)` returns `{ result: "FULFILLED" | "UNABLE" | "SKIPPED"; shortItems: { itemId: string; needed: number; available: number }[] }`.
  - `processPendingSupplierOrders(tx)` returns `{ processed: number; fulfilled: number }`.
- **C9 — `lib/invoices.ts`:**
  - `generateInvoice(tx, poId): number`
  - `receiveInvoice(tx, invoiceId): { orderCompleted: boolean }`
  - `getInvoice(invoiceId, tx?)`
- **C10 — HTTP:**
  - `GET /api/supplier/inventory` answers 200 `{ items: InventoryRow[] }`.
  - `POST /api/supplier/inventory` takes a C6 body (JSON only) and answers 200 per D7.
  - Both answer 401 without a session and 403 `FORBIDDEN` for a non-supplier.
- **C12 — `lib/supplier-pos.ts`:** `createSupplierPOs(tx, orderId, lines, now = new Date(), options?: { status?: SupplierOrderStatus })` defaults `status` to `PENDING`. Until SWHR3-T-0137 rewrites `allocateOrder`, that one call passes `{ status: "PROCESSING" }` to keep today's behaviour, because stock is already reserved there.
- **C11 — Client:**
  - `src/types/supplier.ts` (`InventoryRow`, `InventoryUpdateResult`).
  - `src/utils/supplier-api.ts` (`getInventory()`, `updateInventory(fields)`).
  - `src/constants/supplier.ts` (`SUPPLIER_HOME = "/supplier"`, `SUPPLIER_SIGNIN = "/supplier/signin"`, `SUPPLIER_ROLE_LABEL = "Supplier administrator"`).

### Phases

1. **Access:** the supplier role, the API prefix rule and the grant script.
2. **Data:** the migration, status vocabulary, contact, address and supplier-order read models, and inventory reads and writes.
3. **Fulfilment:** PENDING PO creation with the contact copy; fulfilment and reprocessing; invoices driving completion; the atomic inventory update.
4. **HTTP:** the form parser and the two supplier routes.
5. **UI:** the shell, sign-in, access-denied page and client binding; then the inventory page.
6. **Hardening:** atomicity suites, and fulfilment-attempt records and logging.
7. **Test harness:** unit tests beside every `lib/` module, route tests with a real `H3Event`, and Testing Library tests for the supplier pages. `e2e/supplier-portal.spec.ts` covers:
   - A supplier signs in and updates stock.
   - A waiting approved order is fulfilled and completed after shipping.
   - A store administrator sees "Access denied".
   - An invalid row is skipped.

   The existing `e2e/order-workflow.spec.ts` must keep passing.

8. **CI:** no workflow change.

### Spec discrepancies

Recorded here and on the planning ticket. The delta spec is left as extracted.

- **SD1 — "Administrator role" / web.xml security-constraint / `isUserInRole("administrator")`.** The PRD gives supplier staff a separate role and forbids administrators from modifying inventory. Access is the `supplier` role, labelled "Supplier administrator" as in the mockups (D1). A store administrator gets 403 or "Access denied". The idea's non-scope line "Supplier authentication … `middleware/auth.ts` stays a stub" is stale: auth has shipped.
- **SD2 — CMP entity beans, local and home interfaces, ejb-jar.xml, and a String `poId` with a `long` `poDate`.** These are Drizzle tables. `poId` is the integer PO `id` and `poDate` is `created_at`. `setQuantity` is `updateQuantity` (C5).
- **SD3 — JMS Queue in, JMS Topic out, `SupplierOrderMDB`, `TransitionDelegate`, XML.** There is no transport, and the supplier and the order processing centre run in one app. POs are created in-process at approval (D3). The invoice goes back through a typed in-process call, `receiveInvoice`, in the same transaction (D9). No XML is produced or parsed.
- **SD4 — The `RcvrRequestProcessor` servlet with `currentScreen` routing.** This becomes file-based routes: `GET` and `POST /api/supplier/inventory`, plus the `/supplier` pages.
- **SD5 — ContactInfo and Address shown with the order, versus the PRD's "the supplier sees no customer data".** They are stored on the supplier side for shipping (D4) and never displayed in the portal.
- **SD6 — "Validate quantity values are positive" (tasks 14.6) versus the scenarios' "non-negative accepted".** Zero is accepted, because the scenarios and the mockup show 0 stock.
- **SD7 — "Display success/error message" (14.7, 14.8) versus "skip invalid items without error notification".** Invalid rows are skipped silently. The success banner reports how many rows were saved; a failed request shows an error alert.
- **SD8 — ServiceLocator.** Modules are imported statically; the scenario is not testable as written.
- **SD9 — The PO status vocabulary changes from `OPEN`/`SHIPPED` (change `swhr3-i-0006-order-processing-and-fulfil`) to `PENDING`/`PROCESSING`/`COMPLETED`.** It is migrated in place (D2). An approved order short of stock now holds a PENDING PO instead of none (D3). The order-workflow scenarios are unaffected, but that change's unit tests asserting `OPEN`/`SHIPPED` or "no PO while waiting" are updated by the tickets that own the code.
- **SD10 — "Multiple administrators" / "concurrent inventory updates" (tasks 18.8, 18.9).** Immediate-mode transactions serialise updates. The test is two concurrent `applyInventoryUpdate` calls ending in a consistent state.

### Ticket map and sequencing

There is one TASK per tasks.md group, G1→0128 through G18→0145 in order, each with its plan at `artifacts/SWHR3-S-0009/<KEY>/PLAN.md`. All keys are `SWHR3-T-`.

- **Roots, in parallel:** 0128 (G1 access), 0129 (G2 schema), 0133 (G6 inventory).
- **Data chain:** 0129 → {0130, 0131} → 0132 → 0139 (also after 0133) → 0137 → 0138 → 0141 (also after 0128) → 0136 → 0134.
- **Other branches:**
  - 0135 runs after 0128 and 0133.
  - 0144 runs after 0134, 0135 and 0128; then 0140.
  - 0142 and 0143 run after 0136 and 0138.
  - 0145 runs after 0140, 0142 and 0143.

No two parallel tickets share a file.
