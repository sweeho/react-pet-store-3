## Summary

React Pet Store 3 is a modernization of the Java Pet Store 1.3.2 e-commerce platform, a reference implementation for distributed online retail with asynchronous order processing. The system lets customers browse and purchase pets through a web storefront, routes high-value orders ($500+) through a human approval workflow, and fulfils them against supplier inventory — with the whole path from cart to shipment handled through asynchronous, durable communication.

The core value proposition is decoupling: a slow supplier or overloaded administrator never blocks a customer from ordering. Orders are handed off immediately; approval and fulfilment happen downstream. The system serves three roles — shoppers, administrators, and supplier staff — each with its own interface and no cross-role visibility.

## Context

This is a migration from J2EE Petstore 1.3.2, a reference implementation from Sun Microsystems (circa 2004). The legacy system is production-like but not production-ready: it takes shortcuts on payment, lacks order history visibility to customers, offers no refunds or cancellations, and has no audit trail of approval decisions. These are deliberate out-of-scope items in the design, not bugs to fix.

The system manages:

- A hierarchical product catalogue (category → product → item) with five reference categories (Birds, Cats, Dogs, Fish, Reptiles)
- Shopping carts scoped to a browser session
- Customer accounts with contact information, shipping/billing addresses, and a stored payment card (one per customer)
- Orders flowing through a four-state lifecycle (Pending → Approved → Completed, or Denied)
- Multi-language support (English, Japanese, Chinese) for both the interface and catalogue content
- Role-based access control (shopper, administrator, supplier staff)

Communication between the storefront, order processing centre, admin interface, and supplier system is fully asynchronous and durable. An outage in any component delays work but loses no data.

## Goals

1. **Unblocked ordering** — A customer can find a product, add it to a cart, and place an order without delays caused by administrator queues or supplier inventory checks. Orders under $500 are approved automatically.

2. **Risk-aware review** — High-value orders ($500 and above) are held for human review so review effort scales with risk rather than volume. Decisions are staged locally and committed in batch.

3. **Automatic fulfilment** — Once an order is approved, the system attempts to fulfil it against supplier inventory automatically, and completes the order without human intervention the moment stock is available.

4. **Customer visibility** — Customers receive email notifications at every order status change (approved, denied, completed) without needing to return to the site.

5. **Multilingual experience** — The storefront and catalogue are fully localized (English, Japanese, Chinese) and users can switch languages per session or set a preference in their profile.

6. **Sales insights** — Administrators can view sales by category over a chosen date range with both pie and bar charts to understand what sells.

7. **Resilience** — The supplier, review queue, and email system are all on independent schedules. A delay in any of them does not block customers from ordering or administrators from approving.

## Non-goals

- Real payment processing — Card details are stored and echoed back, but never authorised or charged.
- Customer order history — Customers receive a confirmation number on screen and via email, with no way to look up previous orders.
- Shipment tracking — After an order is marked Complete, there is no further visibility or tracking.
- Order modifications — Orders cannot be modified or cancelled after submission.
- Pre-purchase stock visibility — Availability is resolved after checkout, never shown before, to keep the ordering flow fast.
- Self-service password reset — There is no recovery path for lost passwords.
- Multiple suppliers or sourcing logic — One supplier fulfils all orders.
- Mobile or responsive design — The UI is optimized for desktop and uses fixed-width layouts throughout.
- Audit trail for approval decisions — Administrators make decisions in batch with no record of who decided what.

## Users

Three roles, each with its own interface and separate authentication. Sessions for administrator and supplier are mutually exclusive in a single browser.

**Shopper**

Wants to find a specific pet quickly, see its price, and buy it with minimal friction. Willing to create an account at checkout, unwilling to create one just to browse. Needs the site in their language (English, Japanese, or Chinese). Can only see and change their own account; has no visibility into order status after the confirmation screen and relies entirely on email.

**Administrator**

Reviews orders carrying real financial risk and decides whether the store should honour them. Works in batches rather than one at a time, so the interface supports staging multiple decisions and committing them together. Also the only role with access to sales reporting. Cannot modify orders, customers, or the catalogue — the only action available is a status decision (Approve or Deny).

**Supplier staff**

Keeps recorded inventory matching real warehouse stock. Their updates trigger automatic re-evaluation of waiting orders, so the role is on the critical path for fulfilment even though staff never interact with orders directly. Has no view of customers or order details, only line items to fulfil.

## User journeys

**Shopper: Browse and purchase**

1. Home page — Five category tiles (Birds, Cats, Dogs, Fish, Reptiles)
2. Category listing — Browse products with pagination
3. Product page — View items with prices and descriptions
4. Item page (optional) — Full details, image, and add-to-cart
5. Shopping cart — Review quantities, subtotal, Update and Checkout buttons
6. Sign in (if not already) — Username and password (pre-filled from cookie if available)
7. Account creation (if new) — Contact details, card, and profile preferences in one form
8. Checkout form — Billing and shipping addresses (pre-filled from account), review and submit
9. Order confirmation — Order number and notification email address displayed on screen

**Shopper: Search and purchase**

1. Home or any page — Use search box (top right)
2. Search results — Item-level results with pagination (two per page)
3. Item page or add from results — Add to cart from search results or navigate to item page
4. Proceed as above from step 5 (Shopping cart)

**Shopper: Personalization**

1. Home page — Browse or search as normal
2. After sign-in — MyList panel (if enabled) shows products from favourite category
3. Profile page — Switch language, set favourite category, toggle MyList and pet tips

**Administrator: Approve orders**

1. Admin client home — Pending and decided orders shown in separate queues
2. Pending queue — Table shows order number, customer, date, amount, status; sortable by any column
3. Select orders — Mark one or more as Approved or Denied locally (staged)
4. Commit — Submit staged decisions; they become permanent
5. Decided queue — View previous decisions (read-only)

**Administrator: View sales reports**

1. Admin client home — Navigate to Reports tab
2. Select date range — Enter start and end dates
3. Generate report — Pie chart (category share) and bar chart (volume by category)
4. View or refresh — Reports are on-demand, not scheduled

**Supplier: Update inventory**

1. Supplier app home — Sign in with staff credentials
2. Inventory listing — Table of all items with current quantities
3. Enter new quantities — One per row, with checkbox to mark for update
4. Submit — Only rows with checkboxes checked are written; unmarked rows are ignored
5. Notification — OPC is notified and re-evaluates all waiting orders

## Capability map

- **catalog-browsing** — Searching, filtering, and browsing pet products by category with multi-language support
- **shopping-cart** — Add, remove, and manage items in a shopping cart session with quantity management
- **order-checkout** — Collect customer contact info, shipping address, billing address, and credit card for order placement
- **creditcard-validation** — Validate card type, number, and expiry date; store payment details securely
- **order-workflow** — Manage order lifecycle through states (Pending → Approved → Completed or Denied) and trigger fulfilment
- **customer-management** — Register users, authenticate via sign-on, and manage customer profile and stored payment method
- **supplier-integration** — Receive purchase order requests from OPC, fulfil from inventory, send invoices, and receive inventory updates
- **order-approval** — Admin review and approval/denial of orders with $500 threshold by total order amount
- **customer-communications** — Send order confirmation, approval, denial, and completion emails to customers asynchronously
- **admin-dashboard** — View orders by status in sortable queues and generate sales reports (pie and bar charts by category and date range)

## Screens

**Storefront**

- Home page with category image map and sidebar
- Category listing (products, paginated two per page)
- Product page (items with descriptions and prices)
- Item detail page (image, list price, customer price, add-to-cart)
- Search results page (items paginated, query preserved across pages)
- Shopping cart (item name, remove link, quantity input, unit price, line total, subtotal, Update Cart and Checkout buttons)
- Empty cart message
- Sign-in form (returning customer vs. new account creation side by side)
- Account creation form (contact details, credit card, profile preferences in one form)
- Checkout form (billing and shipping addresses, pre-filled from account; all fields except second address line required)
- Order confirmation (order number and notification email address)
- Account profile page (view and edit contact details, card, preferences; cannot change username or password)
- MyList panel (if enabled; shows up to ten products from favourite category)

**Admin client**

- Home page (navigation to order review or reports)
- Pending orders queue (table: order number, customer, date, amount, status; sortable; stage Approve/Deny locally)
- Decided orders queue (read-only table of approved and denied orders)
- Batch commit dialog (confirm staged decisions before sending to server)
- Sales reports page (date range input, pie chart by category, bar chart volume by category)

**Supplier**

- Inventory listing (table: itemId, current quantity; one new quantity field and checkbox per row)
- No customer or order visibility

## Constraints and assumptions

**Architecture**

- Four independent applications communicate asynchronously via durable message queues and documents (no real-time RPC).
- Storefront hands off orders and returns immediately; OPC processes them downstream.
- All inter-application communication uses agreed-upon document schemas, not internal data structures.
- Admin client is the exception: it talks to OPC synchronously over HTTP for immediate feedback.

**Order workflow**

- Orders below $500 are auto-approved; $500 and above are held for human review.
- A single $500 threshold is applied to total order amount, not per line or per category.
- Order states are Pending (awaiting review), Approved (approved or auto-approved), Denied (rejected, terminal), and Completed (all lines fulfilled).
- An order cannot be reopened, modified, or cancelled after submission.
- Fulfilment is automatic: no manual picking or shipping confirmation.

**Data and payment**

- Each customer has exactly one credit card stored on their account.
- Card details are stored and shown to the customer but never authorised or charged (payment is out-of-scope).
- Orders contain a snapshot of the customer's billing and shipping addresses at purchase time; changes to the account profile do not affect prior orders.
- Catalogue content (product names, descriptions) is multi-language (English, Japanese, Chinese).
- Users can switch language per session or set a default in their profile.

**Availability**

- The storefront does not read inventory; it will take orders for out-of-stock items and the OPC resolves them later.
- Orders waiting for stock are re-evaluated automatically whenever supplier inventory changes.
- The admin queue loads on demand; there is no polling or real-time push.
- Email delivery is asynchronous; a mail server outage does not block order processing.

**Scope boundaries**

- Storefront never sees the OPC, supplier, or admin interfaces.
- Supplier never sees customer data or order details, only line items to fulfil.
- Administrator cannot modify orders, customers, catalogue, or inventory — only approve or deny.
- No audit trail of who made approval decisions.

## Open questions

1. **Approval threshold and rules** — The legacy system has a hardcoded $500 threshold with a second unused threshold at $50,000. Should this become a configuration setting? Should the rebuild support rule-based thresholds (e.g., "all orders from new customers" or "anything shipping internationally")?

2. **Customer order history** — The legacy system provides no way for customers to look up previous orders. Should the rebuild offer this capability?

3. **Mobile and responsive design** — The legacy system is desktop-only with fixed-width layouts. Should the rebuild target mobile browsers or responsive design?

4. **Payment processing** — Should card details continue to be stored without processing, or should a payment gateway be integrated? (Currently out-of-scope; flagged for decision.)

5. **Order modification** — Should customers be able to cancel or modify orders after submission? (Currently not supported; may need policy decision.)

6. **Audit and compliance** — Should the rebuild include an audit trail for approval decisions and customer data access for regulatory compliance (GDPR, PCI)?

7. **Personalization** — The legacy system supports favourite categories, MyList, and pet-care tips banners. Are these features valuable enough to retain, or should the rebuild focus on core shopping?

8. **Supplier selection and dropshipping** — The legacy system assumes one supplier. Should the rebuild support multiple suppliers, sourcing logic, or dropshipping?

## Sources

See design/prd/sources.yaml for detailed source mappings by section.
