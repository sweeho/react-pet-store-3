import { sql } from "drizzle-orm";
import { integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
});

// design.md D8/C6: the account an operator signs in with. `customers`
// links to this 1:1 through a unique accountId. `role` (design.md D3, C1)
// is read fresh per request rather than cached in the session cookie, so a
// revoked role takes effect on the account's next request.
export const accounts = sqliteTable("accounts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("customer"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// design.md D8/C13: the profile captured by the create-customer form.
// Preferences are columns rather than a table because they are 1:1 with the
// customer and always read with the profile.
export const customers = sqliteTable("customers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id")
    .notNull()
    .unique()
    .references(() => accounts.id),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  telephone: text("telephone").notNull(),
  street1: text("street1").notNull(),
  street2: text("street2"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  postalCode: text("postal_code").notNull(),
  country: text("country").notNull(),
  locale: text("locale").notNull().default("en_US"),
  favoriteCategory: text("favorite_category"),
  myListEnabled: integer("my_list_enabled", { mode: "boolean" }).notNull(),
  petTipsEnabled: integer("pet_tips_enabled", { mode: "boolean" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// design.md D8/D9/C13: 1:1 with customers, ON DELETE CASCADE. The card
// number is stored as entered; redacting it to its last four digits on the
// way out is a service-layer concern (D9), not a storage one.
export const creditCards = sqliteTable("credit_cards", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: integer("customer_id")
    .notNull()
    .unique()
    .references(() => customers.id, { onDelete: "cascade" }),
  cardType: text("card_type").notNull(),
  cardNumber: text("card_number").notNull(),
  expiryMonth: integer("expiry_month").notNull(),
  expiryYear: integer("expiry_year").notNull(),
});

// design.md D1/C1: one row per order, owned by the account that placed it.
// `status` is one of lib/order-status.ts's ORDER_STATUSES; the column
// stores it as plain text (not a $type/CHECK) so schema.ts stays free of a
// lib/ import, and lib/orders.ts is the only writer of `status`. Checkout
// (swhr3-i-0005) adds line items and address snapshots alongside these
// columns without reshaping them.
export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id),
  customerName: text("customer_name").notNull(),
  orderDate: integer("order_date", { mode: "timestamp" }).notNull(),
  totalCents: integer("total_cents").notNull(),
  status: text("status").notNull().default("PENDING"),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  // design.md D3/C1: checkout snapshots. Nullable because orders seeded
  // before checkout existed have none.
  email: text("email"),
  cardType: text("card_type"),
  cardNumber: text("card_number"),
  cardExpiry: text("card_expiry"),
  // design.md D1/C1: the fulfilment lifecycle, separate from the approval
  // status above. Existing rows read PENDING.
  workflowStage: text("workflow_stage").notNull().default("PENDING"),
});

// design.md D3/C1: billing (BILL_TO) and shipping (SHIP_TO) addresses as
// snapshots of what the customer entered; later profile edits never touch them.
export const orderContacts = sqliteTable(
  "order_contacts",
  {
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id),
    role: text("role").notNull(),
    familyName: text("family_name").notNull(),
    givenName: text("given_name").notNull(),
    address1: text("address1").notNull(),
    address2: text("address2"),
    city: text("city").notNull(),
    stateOrProvince: text("state_or_province").notNull(),
    postalCode: text("postal_code").notNull(),
    country: text("country").notNull(),
    telephoneNumber: text("telephone_number").notNull(),
    email: text("email").notNull(),
  },
  (t) => [primaryKey({ columns: [t.orderId, t.role] })],
);

// design.md D1/C1: anonymous cart state, keyed by the petstore_cart cookie
// token. item_id is deliberately not a foreign key (D4).
export const cartItems = sqliteTable(
  "cart_items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    sessionToken: text("session_token").notNull(),
    itemId: text("item_id").notNull(),
    quantity: integer("quantity").notNull(),
  },
  (t) => [uniqueIndex("cart_items_session_token_item_id_unique").on(t.sessionToken, t.itemId)],
);

// design.md D3/C1: minimal catalogue; unit cost is integer cents (D6).
export const catalogItems = sqliteTable("catalog_items", {
  itemId: text("item_id").primaryKey(),
  productId: text("product_id").notNull(),
  category: text("category").notNull(),
  unitCostCents: integer("unit_cost_cents").notNull(),
});

export const catalogItemDetails = sqliteTable(
  "catalog_item_details",
  {
    itemId: text("item_id")
      .notNull()
      .references(() => catalogItems.itemId),
    locale: text("locale").notNull(),
    name: text("name").notNull(),
    attribute: text("attribute").notNull(),
  },
  (t) => [primaryKey({ columns: [t.itemId, t.locale] })],
);

// design.md D11/C1: defined now, written by order-checkout later.
export const lineItems = sqliteTable(
  "line_items",
  {
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id),
    lineNumber: integer("line_number").notNull(),
    categoryId: text("category_id").notNull(),
    productId: text("product_id").notNull(),
    itemId: text("item_id").notNull(),
    quantity: integer("quantity").notNull(),
    unitPriceCents: integer("unit_price_cents").notNull(),
    quantityShipped: integer("quantity_shipped").notNull().default(0),
    // design.md C1/D6: set when allocation groups the line into a supplier PO.
    supplierPoId: integer("supplier_po_id").references(() => supplierPurchaseOrders.id),
  },
  (t) => [primaryKey({ columns: [t.orderId, t.lineNumber] })],
);

// design.md C1 (order-processing-and-fulfilment): the workflow tables.
export const orderStageHistory = sqliteTable("order_stage_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id),
  stage: text("stage").notNull(),
  changedAt: integer("changed_at", { mode: "timestamp" }).notNull(),
});

export const paymentAuthorizations = sqliteTable("payment_authorizations", {
  orderId: integer("order_id")
    .primaryKey()
    .references(() => orders.id),
  processor: text("processor").notNull(),
  transactionId: text("transaction_id").notNull().unique(),
  authorizationCode: text("authorization_code").notNull(),
  amountCents: integer("amount_cents").notNull(),
  authorizedAt: integer("authorized_at", { mode: "timestamp" }).notNull(),
});

export const notificationOutbox = sqliteTable("notification_outbox", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id),
  kind: text("kind").notNull(),
  recipient: text("recipient").notNull(),
  payload: text("payload").notNull(),
  status: text("status").notNull().default("QUEUED"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const inventory = sqliteTable("inventory", {
  itemId: text("item_id")
    .primaryKey()
    .references(() => catalogItems.itemId),
  quantity: integer("quantity").notNull(),
});

export const inventoryReservations = sqliteTable(
  "inventory_reservations",
  {
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id),
    itemId: text("item_id").notNull(),
    quantity: integer("quantity").notNull(),
  },
  (t) => [primaryKey({ columns: [t.orderId, t.itemId] })],
);

export const supplierPurchaseOrders = sqliteTable("supplier_purchase_orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id),
  supplierId: text("supplier_id").notNull(),
  // design.md D2 (supplier-portal-and-inventory): PENDING -> PROCESSING -> COMPLETED.
  status: text("status").notNull().default("PENDING"),
  expectedDeliveryDate: integer("expected_delivery_date", { mode: "timestamp" }).notNull(),
  trackingNumber: text("tracking_number"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  shippedAt: integer("shipped_at", { mode: "timestamp" }),
});

// design.md C1 (supplier-portal-and-inventory): the supplier-side tables.
export const supplierPoContacts = sqliteTable("supplier_po_contacts", {
  supplierPoId: integer("supplier_po_id")
    .primaryKey()
    .references(() => supplierPurchaseOrders.id, { onDelete: "cascade" }),
  givenName: text("given_name").notNull(),
  familyName: text("family_name").notNull(),
  email: text("email").notNull(),
  telephone: text("telephone").notNull(),
});

export const supplierPoAddresses = sqliteTable("supplier_po_addresses", {
  supplierPoId: integer("supplier_po_id")
    .primaryKey()
    .references(() => supplierPoContacts.supplierPoId, { onDelete: "cascade" }),
  address1: text("address1").notNull(),
  address2: text("address2"),
  city: text("city").notNull(),
  stateOrProvince: text("state_or_province").notNull(),
  postalCode: text("postal_code").notNull(),
  country: text("country").notNull(),
});

export const supplierInvoices = sqliteTable("supplier_invoices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  supplierPoId: integer("supplier_po_id")
    .notNull()
    .unique()
    .references(() => supplierPurchaseOrders.id),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id),
  invoiceDate: integer("invoice_date", { mode: "timestamp" }).notNull(),
  lines: text("lines").notNull(),
  totalCents: integer("total_cents").notNull(),
  status: text("status").notNull().default("SENT"),
});

export const supplierFulfilmentAttempts = sqliteTable("supplier_fulfilment_attempts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  supplierPoId: integer("supplier_po_id")
    .notNull()
    .references(() => supplierPurchaseOrders.id),
  attemptedAt: integer("attempted_at", { mode: "timestamp" }).notNull(),
  result: text("result").notNull(),
  detail: text("detail").notNull(),
});
