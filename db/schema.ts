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
});

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
  },
  (t) => [primaryKey({ columns: [t.orderId, t.lineNumber] })],
);
