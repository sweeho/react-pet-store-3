# Shopping Cart Design

## User Interface

Two screen records were extracted for this capability. Their visible contracts are specified in specs/shopping-cart/spec.md as requirements.

## Architecture Overview

The shopping cart is implemented as a stateful session bean component managing a HashMap of cart items during the user's session:

1. **Web Tier**: CartHTMLAction parses HTTP requests and creates CartEvent objects
2. **Business Tier**: CartEJBAction dispatches events to ShoppingCartLocalEJB methods
3. **Session Tier**: ShoppingCartLocalEJB maintains stateful HashMap of itemId → quantity
4. **Data Enrichment**: CatalogHelper looks up product details for display
5. **Presentation Tier**: cart.jsp renders items with editable quantities and action links

### Cart Workflow

1. **Add Item**: User selects "purchase" action, item added with quantity 1 or specified quantity
2. **View Cart**: Cart screen displays all items with quantities, unit prices, and line totals
3. **Update Quantities**: User modifies quantity inputs and submits "update" form
4. **Remove Items**: User clicks remove link for individual item or quantity set to 0
5. **Checkout**: User clicks "Check Out" link to proceed to order entry when cart non-empty
6. **Empty Cart**: Entire cart cleared with single operation

### Key Components

**ShoppingCartLocalEJB** (Stateful Session Bean):

- Maintains HashMap of itemId → quantity pairs
- Provides addItem(itemId), addItem(itemId, qty), deleteItem(itemId), updateItemQuantity(itemId, qty)
- Methods: getItems() (enriched with catalog details), getSubTotal(), getCount(), empty()
- Supports locale for product information retrieval via setLocale()

**CartHTMLAction** (Web Action):

- Parses request parameters for actions: "purchase", "remove", "update"
- Extracts itemId, quantity, and parameters matching pattern "itemQuantity\_"
- Creates CartEvent objects for routing to EJB tier
- Handles NumberFormatException from quantity parsing (defaults to 0)

**CartEJBAction** (EJB Action):

- Receives CartEvent from HTML tier
- Dispatches to appropriate ShoppingCartLocalEJB methods based on action type
- Handles ADD_ITEM, DELETE_ITEM, UPDATE_ITEMS, EMPTY event types

**CartItem** (Value Object):

- Contains itemId, productId, category, name, attribute, quantity, unitCost
- Calculated property: totalCost = quantity × unitCost
- Used for display in cart.jsp

**CatalogHelper** (Integration):

- Called by getItems() to look up Item details by itemId
- Passed locale to support multi-language product names
- Catches CatalogException and continues (skips item silently if lookup fails)

**LineItemEJB** (CMP 2.x Entity Bean):

- Container-Managed Persistence entity storing order line items
- Fields: categoryId, productId, itemId, lineNumber, quantity, unitPrice, quantityShipped
- Used in order processing, related to shopping cart through product references

### Data Model

**Shopping Cart State** (In-Memory):

- HashMap<itemId, quantity> stored in ShoppingCartLocalEJB
- Per-session; cleared on session timeout
- No persistent storage within cart component

**CartItem** (Display Model):

- itemId, productId, category, name, attribute, quantity, unitCost
- Transient value object constructed from cart state + catalog lookup

**LineItem** (Persistent):

- CMP entity with seven fields capturing order line details
- Created when order is placed from cart items

### Transactions

All cart-modifying operations execute within container-managed transactions with Required attribute:

- addItem (both overloads)
- deleteItem
- updateItemQuantity
- empty
- setLocale

Read-only operations also transactional: getItems, getSubTotal, getCount

### Security

All shopping cart operations declared as unchecked in ejb-jar.xml, meaning no role-based access control. Any authenticated or anonymous user may perform cart operations.

### Notable Implementation Details

- Quantity field maxlength="10" in JSP allows values up to 9,999,999,999 with no validation
- NumberFormatException in quantity parsing defaults to quantity 0, triggering removal
- CatalogException during getItems() is caught and logged to System.out, item skipped silently
- Stateful session bean timeout and replication policy not visible in component source
- addItem(itemId, qty) overload defined in implementation but not in ShoppingCartLocal interface
- Empty cart condition checked only in presentation; enforcement may also be in order-entry tier

## Key Files

- **Session Bean**: ShoppingCartLocalEJB.java, ShoppingCartLocal.java, ShoppingCartLocalHome.java
- **Web Action**: CartHTMLAction.java
- **EJB Action**: CartEJBAction.java
- **Value Object**: CartItem.java
- **Entity Bean**: LineItemEJB.java
- **View**: cart.jsp
- **Configuration**: ejb-jar.xml, struts-config.xml
