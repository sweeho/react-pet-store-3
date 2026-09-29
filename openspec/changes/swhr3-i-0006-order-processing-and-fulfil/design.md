# Order Workflow Design

## User interface

No screen records were extracted for this capability; its user interface is unspecified.

## Architecture Overview

Order workflow is implemented as a coordinated set of EJB components managing the complete order lifecycle:

1. **Order Entry Tier**: OrderHTMLAction and OrderEJBAction coordinate order creation
2. **Business Processing Tier**: OrderProcessingFacade and ProcessManager orchestrate workflow
3. **Data Tier**: PurchaseOrder, LineItem, and OrderStatus entity beans with persistence
4. **Integration Tier**: Payment processor, inventory system, supplier coordination
5. **Notification Tier**: Order events published to message queue for async processing

### Order Workflow Lifecycle

1. **Order Creation**: OrderEJBAction validates cart and creates PurchaseOrder with unique ID
2. **Payment Processing**: Charge credit card through payment processor
3. **Order Confirmation**: Generate confirmation and queue notification message
4. **Inventory Reservation**: Reserve items from inventory for allocated fulfillment
5. **Supplier PO Generation**: Create purchase orders with suppliers for items
6. **Order Fulfillment**: Coordinate picking, packing, and shipping
7. **Order Delivery**: Update status when delivered to customer
8. **Order Completion**: Mark order complete and archive

### Key Components

**OrderEJBAction**:

- Validates shopping cart not empty
- Generates unique order ID via UniqueIdGenerator
- Creates PurchaseOrder with customer, billing/shipping addresses, payment method
- Initiates order event processing

**OrderProcessingFacade**:

- Coordinates multi-step order processing
- Manages payment processing and exception handling
- Delegates to specialized components (InventoryEJB, SupplierPO, Notification)

**ProcessManager**:

- State machine managing order status transitions
- Enforces valid state transitions
- Coordinates subprocess execution

**LineItem Entities**:

- Represent individual ordered items
- Store product, quantity, unit price, line total
- Reference parent PurchaseOrder

**OrderStatus**:

- PENDING: Order created, awaiting payment
- PAID: Payment processed
- CONFIRMED: Customer confirmation sent
- ALLOCATED: Inventory reserved
- SHIPPED: Items dispatched to customer
- DELIVERED: Order received
- COMPLETED: Order fulfilled

### Data Model

**PurchaseOrder Entity**:

- OrderId (unique), OrderDate, CustomerUserId, CustomerEmail
- BillTo/ShipTo (ContactInfo), CreditCard (payment method)
- OrderLineItems (collection of LineItem entities)
- OrderStatus, TotalAmount, CreatedDate

**LineItem Entity**:

- LineItemId, PurchaseOrderId (foreign key)
- ProductId, ItemId, Quantity, UnitPrice, LineTotal
- SupplierPoId (reference to supplier order)

**SupplierPO Entity**:

- SupplierPoId, SupplierId, OrderDate
- LineItems (references to order line items)
- DeliveryDate, Status

## Constraints and Assumptions

1. **Order Validation**: Cart must not be empty
2. **Payment Required**: Order cannot proceed without successful credit card charge
3. **State Transitions**: Order status follows defined state machine
4. **Line Item Consistency**: Quantities and prices locked after order creation
5. **Supplier Integration**: Supplier POs created for items requiring external procurement
6. **Notification Async**: Customer notifications sent via message queue
7. **Transaction Atomicity**: Order and all components created in single transaction

## Key Files

- **Order Processing**: OrderEJBAction.java, OrderProcessingFacade.java
- **Process Management**: ProcessManager.java, OrderStatus.java
- **Entity Beans**: PurchaseOrder.java, LineItem.java, SupplierPO.java
- **Integration**: InventoryEJB.java, PaymentProcessor.java
- **Configuration**: ejb-jar.xml, deployment descriptor

---

## Rebuild on this repository (sprint SWHR3-S-0008)

Everything above this heading was extracted from the legacy system. Everything below records how this repository delivers it. Implementation tickets read this section first. It cites decisions as `D`, fixed interface contracts as `C` and spec discrepancies as `SD`. The idea carries no design blocks, and this change adds no page. The one visible change is a payment-declined alert on `/checkout`, built from the existing `Alert` pattern.

### Codebase findings

- **Most of "order creation" already exists.** It shipped with change `swhr3-i-0005-order-checkout-and-payment`:
  - `POST /api/orders` requires JSON (bugfix `swhr3-s-0007-bugfix-swhr3-t-0100-post-ap`) and parses with `lib/checkout-request.ts`.
  - `lib/checkout.ts` `placeOrder` runs one immediate transaction. It reads the cart (empty raises `ShoppingCartEmptyError`) and writes `orders` with a unique AUTOINCREMENT id, `order_date` = now, `account_id` from the session, `email` from billing and `total_cents` = sum of lines. It then writes the `order_contacts` and `line_items` snapshots and empties the cart.
  - After commit, `placeOrder` logs one line. Given an outer transaction it logs before that outer transaction commits, which T-0087 noted.
- **Order status belongs to order-approval.** `lib/order-status.ts` fixes `ORDER_STATUSES = PENDING | APPROVED | DENIED | COMPLETED`, and the only legal transitions are admin PENDING→APPROVED and PENDING→DENIED. `lib/orders.ts` is the only status writer, and `lib/order-approval.ts` `updateOrders` commits admin batches in one immediate transaction. The spec of record `openspec/specs/order-approval/` and the admin UI's four tabs depend on this vocabulary.
- **Nothing exists for:** payment, notifications, inventory, suppliers, supplier POs, fulfilment stages or stage timestamps. The catalogue has no supplier column.
- **The PRD constrains this capability:**
  - Card details are stored but "never authorised or charged" (a non-goal).
  - The storefront never reads inventory; orders are taken for out-of-stock items and "resolved later".
  - Order states are Pending / Approved / Denied / Completed, and Completed means all lines fulfilled.
  - Fulfilment is automatic against supplier inventory, and waiting orders are re-evaluated when inventory changes.
  - One supplier fulfils all orders.
  - Shipment tracking after Completed is a non-goal.
  - Emails are asynchronous and owned by `customer-communications`.
- **The idea leaves five open questions:** inventory ownership, two status vocabularies, the payment owner, SHIPPED versus out-of-scope tracking, and what "queued" means. D1–D8 settle them for this sprint.
- **Tests:** `lib/`, `routes/` and `middleware/` tests run in the Vitest server project against the in-memory db. E2E seeds by spawning Bun scripts.
- **CI:** `.github/workflows/ci.yml` already runs every tier on `vortex/**`. No workflow change is needed.

### Decisions

- **D1 — Two fields, not one machine.** `orders.status` stays the approval status of record: PENDING, APPROVED, DENIED, COMPLETED, unchanged apart from D7. The spec's lifecycle becomes a new `orders.workflow_stage`: PENDING → PAID → CONFIRMED → ALLOCATED → SHIPPED → DELIVERED → COMPLETED.
  - Each stage change also appends a row to `order_stage_history`, with its timestamp (tasks 5.5).
  - Stages move only one step forward (`lib/workflow-stage.ts`).
  - Folding the stages into `status` would break the order-approval spec, the admin UI and the PRD's four-state customer lifecycle.
- **D2 — Payment is a seam that never charges.**
  - `lib/payment.ts` defines `PaymentAuthorizer`. Its default, `noChargeAuthorizer`, moves no money (PRD non-goal). It approves every card that passed checkout validation and records a `payment_authorizations` row with a local `transaction_id` and `authorization_code`.
  - One documented test card number, `4000 0000 0000 0002`, is always declined. That makes the decline path testable end to end.
  - A decline throws `PaymentDeclinedError`: 402, `PAYMENT_DECLINED`, "Your card was declined. No order was placed."
- **D3 — Placing an order is `processOrder`, one immediate transaction** (`lib/order-processing.ts`):
  1. Write the order through the non-logging core of `placeOrder`.
  2. Authorize payment; `authorizePayment` sets the stage to PAID.
  3. Queue the confirmation; `queueOrderConfirmation` sets the stage to CONFIRMED.

  Any failure, including a decline, rolls everything back, and the cart is untouched. The existing checkout log line is written once, after commit. `POST /api/orders` calls `processOrder` instead of `placeOrder`.

- **D4 — "Queued" is an outbox row.** `notification_outbox` gets one `ORDER_CONFIRMATION` row per order, status `QUEUED`. Its JSON payload carries the order id, email, lines (item, name, quantity, line total), total and ship-to address. `customer-communications` will deliver and mark rows; nothing sends mail in this sprint.
- **D5 — Inventory is reserved at approval, not at placement.** This follows the PRD: the storefront never reads inventory. When an order becomes APPROVED, `allocateOrder(tx, orderId)` runs.
  - If every line's `inventory.quantity` covers it, it decrements each item, writes `inventory_reservations` rows, creates the supplier POs (D6) and sets the stage to ALLOCATED.
  - Otherwise it changes nothing and the order waits at CONFIRMED. There is no partial allocation or backorder, per the idea's out-of-scope list.
  - `retryWaitingAllocations()` re-runs allocation for every APPROVED order still at CONFIRMED. Supplier-integration calls it when inventory changes; this sprint exposes it plus an operator script.
- **D6 — Supplier POs are grouped by supplier; there is one supplier today.**
  - `lib/suppliers.ts` `supplierForItem(itemId)` returns `DEFAULT_SUPPLIER_ID = "PETSTORE-SUPPLIER"`, because the PRD names one supplier. Grouping is still generic.
  - Each group becomes one `supplier_purchase_orders` row: status `OPEN` and `expected_delivery_date` = allocation time + `SUPPLIER_LEAD_DAYS` (7).
  - Each line item gets its `supplier_po_id`.
- **D7 — Shipment completes the order.** `recordShipment(supplierPoId, trackingNumber)` (process manager) marks the PO `SHIPPED` with its tracking number (a supplier's number, not a carrier integration). When every PO of the order has shipped, the stage becomes SHIPPED and the status COMPLETED.
  - `lib/order-status.ts` gains APPROVED → COMPLETED as a system transition, not an admin-assignable one.
  - DELIVERED and COMPLETED stages exist in the machine, but nothing triggers them this sprint: carrier data is out of scope.
- **D8 — Allocation runs inside the admin commit.** `lib/order-approval.ts` `updateOrders` calls `allocateOrder(tx, id)` inside its transaction for each order moved to APPROVED. An allocation that waits for stock never fails the commit. Denied orders are never allocated.

### Fixed interface contracts

- **C1 — Schema** (`db/schema.ts`, migration `drizzle/0006_*`), with new tables registered in `db/client.ts`:
  - `orders.workflowStage` (`workflow_stage`): text, not null, default `'PENDING'`.
  - `orderStageHistory` = `order_stage_history`: `id` PK; `orderId` → orders; `stage`; `changedAt` (timestamp).
  - `paymentAuthorizations` = `payment_authorizations`: `orderId` PK → orders; `processor`; `transactionId` unique; `authorizationCode`; `amountCents`; `authorizedAt`.
  - `notificationOutbox` = `notification_outbox`: `id` PK; `orderId` → orders; `kind`; `recipient`; `payload` (JSON text); `status` default `'QUEUED'`; `createdAt`.
  - `inventory`: `itemId` PK → `catalog_items.item_id`; `quantity` integer, not null.
  - `inventoryReservations` = `inventory_reservations`: `orderId`, `itemId`, `quantity`; PK (`order_id`, `item_id`).
  - `supplierPurchaseOrders` = `supplier_purchase_orders`: `id` PK; `orderId` → orders; `supplierId`; `status` default `'OPEN'`; `expectedDeliveryDate`; `trackingNumber` (nullable); `createdAt`; `shippedAt` (nullable).
  - `line_items` gains nullable `supplierPoId` → `supplier_purchase_orders.id`.
- **C2 — `lib/order-records.ts`** (the finders, tasks 12.5):
  - `getOrderRecord(orderId, tx?)` returns the order, its lines, contacts, stage history, payment, reservations and supplier POs.
  - `listOrdersByStage(stage, tx?)`.
- **C3 — `lib/workflow-stage.ts`:**
  - `WORKFLOW_STAGES` and `type WorkflowStage`.
  - `nextStage(stage): WorkflowStage | null`.
  - `assertStageTransition(orderId, from, to)` throws `InvalidTransitionError`.
  - `setWorkflowStage(tx, orderId, to)` re-reads the stage, asserts the transition, updates `workflow_stage` and appends history.
- **C4 — `lib/payment.ts`:**
  - `interface PaymentAuthorizer { authorize(card: CreditCard, amountCents: number): { approved: true; transactionId: string; authorizationCode: string } | { approved: false; reason: string } }`
  - `noChargeAuthorizer` and `DECLINE_TEST_CARD = "4000000000000002"`.
  - `authorizePayment(tx, orderId, card, amountCents, authorizer = noChargeAuthorizer)` writes the row and advances the stage to PAID with `setWorkflowStage`, or throws `PaymentDeclinedError`.
  - `lib/errors.ts` gains `PaymentDeclinedError` (402, `PAYMENT_DECLINED`).
- **C5 — `lib/notifications.ts`:** `queueOrderConfirmation(tx, orderId): number` writes the outbox row, advances the stage to CONFIRMED, and returns the outbox id; `ORDER_CONFIRMATION` is the kind constant.
- **C6 — `lib/inventory.ts`:**
  - `reserveInventory(tx, orderId, lines): boolean` is all-or-nothing and changes nothing on `false`.
  - `setInventory(itemId, quantity, tx?)`.
  - Operator script `db/seed-inventory.ts` (`--item <id> --quantity <n>`, or `--all <n>`).
- **C7 — `lib/suppliers.ts` / `lib/supplier-pos.ts`:**
  - `DEFAULT_SUPPLIER_ID`, `SUPPLIER_LEAD_DAYS` and `supplierForItem`.
  - `createSupplierPOs(tx, orderId, lines, now = new Date()): number[]`.
  - `markPoShipped(tx, supplierPoId, trackingNumber)` sets the PO to SHIPPED with its tracking number and `shippedAt`.
- **C8 — `lib/order-processing.ts`:** `processOrder(input: PlaceOrderInput, options?: { authorizer?: PaymentAuthorizer }, outer?)` returns the same `{ orderId, orderDate, email }` as `placeOrder` (D3). `lib/checkout.ts` exports `placeOrderInTx(tx, input)`, the non-logging core; `placeOrder` keeps its signature and behaviour.
- **C9 — `lib/process-manager.ts`:** `allocateOrder(tx, orderId): "ALLOCATED" | "WAITING" | "SKIPPED"` and `retryWaitingAllocations(): number` (D5, D8). `recordShipment(supplierPoId, trackingNumber): { orderCompleted: boolean }` calls `markPoShipped`; when every PO of the order has shipped, it sets the stage to SHIPPED and completes the status through `lib/orders.ts` `completeOrder(tx, orderId)` (D7). Operator scripts: `db/ship-supplier-po.ts --po <id> --tracking <n>` and `db/allocate-waiting.ts`.
- **C10 — HTTP:** `POST /api/orders` keeps its contract (201 / 401 / 409 / 415 / 422) and adds 402 `PAYMENT_DECLINED`.

### Phases

1. **Persistence:** schema, migration and finders.
2. **Components, in parallel:** workflow stages, payment seam, confirmation outbox, inventory, supplier POs.
3. **Orchestration:** `processOrder` wired into `POST /api/orders`; the process manager for allocation-on-approval and shipment.
4. **Error handling:** the decline message on `/checkout`, with diagnostic logging.
5. **Test harness:** unit tests beside every `lib/` module (in-memory db), plus route tests with a real `H3Event`, all reached through the facade. G1–G3 and G11 are regression and atomicity suites over behaviour checkout already built. G14 adds `e2e/order-workflow.spec.ts`:
   - Place an order in the browser.
   - Seed inventory and approve the order as an administrator.
   - Ship its PO with the operator script, and see the order in the Completed tab.
   - Place an order with the decline test card, and see the alert with no order created.
6. **CI:** no workflow change. The existing workflow runs every tier on `vortex/**`.

### Spec discrepancies

Recorded here and on the planning ticket. The delta spec is left as extracted.

- **SD1 — Payment contradicts the PRD non-goal** ("never authorised or charged"). Delivered as a seam whose default records an authorisation without contacting any processor or moving money (D2). "Authorize charge" is satisfied in form, not as a real charge; a human decision is needed before any real gateway.
- **SD2 — Two status vocabularies** (idea open question). Resolved as two fields (D1). The spec's scenario "transition order status to PAID" is met by `workflow_stage`; `orders.status` stays the PRD's four states.
- **SD3 — Inventory reservation at order time contradicts the PRD** (the storefront never reads inventory, and out-of-stock orders are resolved later). Reservation happens at approval (D5). The spec's atomicity requirement lists inventory reservations and supplier POs in the same transaction as the order. Here placement is atomic (order, lines, payment, outbox) and allocation is atomic (reservations, POs, stage). Each is all-or-nothing, but they are two transactions.
- **SD4 — Inventory and supplier-PO ownership** (idea open question). This change creates `inventory`, `inventory_reservations` and `supplier_purchase_orders` and the logic that writes them. `supplier-integration` (`swhr3-i-0007-supplier-portal-and-invento`) builds the supplier UI, inventory updates and the re-evaluation trigger on top, calling `retryWaitingAllocations`, and must not recreate these tables.
- **SD5 — "Track via supplier tracking numbers" versus "no shipment tracking"** (PRD, and the idea's out-of-scope list). A supplier-entered tracking number is stored on the PO (D7). There is no carrier API and no customer-facing tracking. DELIVERED and COMPLETED stages have no trigger.
- **SD6 — "Queue to async message queue":** there is no broker. It is an outbox row (D4) for `customer-communications` (`swhr3-i-0011-customer-communications-and`). "Notify customer" on a decline is the checkout-page error, not an email.
- **SD7 — ServiceLocator / JNDI / ejb-jar.xml / CMT:** these have no counterpart. Modules are imported statically; there is no runtime lookup that can fail. Transactions are `withTransaction` with Required semantics. The ServiceLocator scenario is not testable as written, and its ticket proves the modules resolve statically.
- **SD8 — "Unique ID via UniqueIdGenerator":** already `orders.id` AUTOINCREMENT, per the checkout change's D5.
- **SD9 — Many requirements are already met by checkout:** order creation, unique id, order date, line items, total calculation, total storage, customer association and empty-cart refusal. Groups 1, 2, 3 and 12 (finders aside) therefore deliver regression tests through `processOrder` rather than new code.
- **SD10 — `LineTotal` and `CreatedDate` columns (legacy data model):** not added. The line total is derived (`quantity × unit_price_cents`), and `order_date` is the creation time.
- **SD11 — Auto-approval under $500** (PRD goal) is not in this delta spec and is not built. Every order still waits for an administrator.

### Ticket map and sequencing

There is one TASK per tasks.md group, each with its plan at `artifacts/SWHR3-S-0008/<KEY>/PLAN.md`. All keys are `SWHR3-T-`.

- **0120 (G12)** schema comes first.
- **Then in parallel:** 0113 (G5) stages → {0112 (G4) payment, 0114 (G6) outbox}; 0115 (G7) inventory; 0116 (G8) supplier POs.
- **0117 (G9)** facade waits on 0112, 0114, 0115 and 0116.
- **Then in parallel:** 0118 (G10) process manager; 0119 (G11) atomicity suite; 0121 (G13) errors and UI; 0109, 0110, 0111 (G1–G3) regression suites.
- **0122 (G14)** end-to-end waits on 0109, 0110, 0111, 0118, 0119 and 0121.

No two parallel tickets share a file.
