# shopping-cart Specification

## Purpose

TBD - created by archiving change swhr3-i-0004-shopping-cart-and-item-mana. Update Purpose after archive.

## Requirements

### Requirement: Empty shopping cart display

ID: SWHR3-R-0016

The shopping cart display screen SHALL render as empty when no items are in the cart, displaying the message "Your Shopping Cart is Empty."

#### Scenario: Empty cart message is displayed

ID: SWHR3-R-0016.01

- **GIVEN** a user with an empty shopping cart
- **WHEN** the user navigates to the cart page
- **THEN** the system SHALL display the message "Your Shopping Cart is Empty" and no item table

#### Scenario: Empty cart message replaces item table

ID: SWHR3-R-0016.02

- **GIVEN** a cart that previously contained items
- **WHEN** the user removes the last item or clears the cart
- **THEN** the system SHALL transition to empty state display with the empty message

### Requirement: Shopping cart display with items

ID: SWHR3-R-0017

The shopping cart display screen SHALL show all items in a table with columns for item name/description, remove link, quantity input field, unit price, and row total. The screen SHALL display a cart subtotal at the bottom and provide an "Update Cart" button to modify quantities and a "Check Out" link to proceed to checkout.

#### Scenario: Cart displays populated items in table format

ID: SWHR3-R-0017.01

- **GIVEN** a cart containing multiple items
- **WHEN** the cart page is rendered
- **THEN** the system SHALL display a table with one row per item showing item name, attribute, quantity input, unit price, and calculated line total (quantity × unitCost)

#### Scenario: Cart provides quantity input for modification

ID: SWHR3-R-0017.02

- **GIVEN** a cart item displayed in the cart table
- **WHEN** the cart page is rendered
- **THEN** the system SHALL display an editable text input field named itemQuantity\_<itemId> with the current quantity value

#### Scenario: Cart shows remove link for each item

ID: SWHR3-R-0017.03

- **GIVEN** a cart item in the display table
- **WHEN** the cart page is rendered
- **THEN** the system SHALL provide a clickable "Remove" link for each item to delete it from the cart

#### Scenario: Cart displays subtotal at bottom

ID: SWHR3-R-0017.04

- **GIVEN** a cart with multiple items having different quantities and prices
- **WHEN** the cart page is rendered
- **THEN** the system SHALL display a subtotal row showing the sum of all line totals formatted as currency

#### Scenario: Update Cart button submits quantity changes

ID: SWHR3-R-0017.05

- **GIVEN** a user modifying quantities in the cart
- **WHEN** the user clicks "Update Cart" button
- **THEN** the system SHALL submit the form with action="cart.do" and action="update", processing all itemQuantity\_ parameters

#### Scenario: Check Out link proceeds to order entry

ID: SWHR3-R-0017.06

- **GIVEN** a populated shopping cart
- **WHEN** the user clicks "Check Out" link
- **THEN** the system SHALL navigate to the order entry page (enter_order_information.screen)

### Requirement: Stateful shopping cart session bean

ID: SWHR3-R-0018

The system SHALL provide a stateful shopping cart session bean that maintains a collection of items during a user's browsing and purchasing session.

#### Scenario: Cart state persists across requests

ID: SWHR3-R-0018.01

- **GIVEN** a user with items in a shopping cart
- **WHEN** the user browses the catalog and returns to the cart
- **THEN** the system SHALL retain all previously added items in the cart state

#### Scenario: Cart is initialized as empty HashMap

ID: SWHR3-R-0018.02

- **GIVEN** a new user session
- **WHEN** the ShoppingCartLocalEJB is instantiated
- **THEN** the system SHALL initialize cart state as an empty HashMap ready to accept items

### Requirement: Add items to shopping cart

ID: SWHR3-R-0019

The system SHALL allow users to add items to the shopping cart by item identifier, defaulting the quantity to 1 if not explicitly specified.

#### Scenario: Item is added with default quantity

ID: SWHR3-R-0019.01

- **GIVEN** a user selecting an item for purchase without specifying quantity
- **WHEN** the purchase action is triggered with only itemId parameter
- **THEN** the system SHALL call addItem(itemId) and add the item with quantity 1

#### Scenario: Item is added with explicit quantity

ID: SWHR3-R-0019.02

- **GIVEN** a user adding an item with a specified quantity > 0
- **WHEN** addItem(itemId, quantity) is invoked
- **THEN** the system SHALL add the item with the specified quantity value

### Requirement: Remove items from shopping cart

ID: SWHR3-R-0020

The system SHALL allow users to remove items from the shopping cart by item identifier.

#### Scenario: Item is removed by identifier

ID: SWHR3-R-0020.01

- **GIVEN** a cart containing an item with a specific itemId
- **WHEN** the user selects the remove action for that item
- **THEN** the system SHALL call deleteItem(itemId) and remove the item from the cart HashMap

### Requirement: Update item quantities in shopping cart

ID: SWHR3-R-0021

The system SHALL allow users to update item quantities in the shopping cart. When quantity is set to zero or less, the item SHALL be removed from the cart.

#### Scenario: Quantity is updated to positive value

ID: SWHR3-R-0021.01

- **GIVEN** an item in the cart with current quantity
- **WHEN** the user updates the quantity input to a positive value and submits update
- **THEN** the system SHALL call updateItemQuantity(itemId, newQty) and store the new quantity

#### Scenario: Quantity is set to zero and item is removed

ID: SWHR3-R-0021.02

- **GIVEN** an item in the cart
- **WHEN** the user updates the quantity to 0
- **THEN** the system SHALL remove the item from the cart (not store with zero quantity)

#### Scenario: Quantity is set to negative and item is removed

ID: SWHR3-R-0021.03

- **GIVEN** an item in the cart
- **WHEN** the user enters a negative quantity (or system defaults non-numeric to 0)
- **THEN** the system SHALL remove the item from the cart

### Requirement: Calculate cart subtotal

ID: SWHR3-R-0022

The system SHALL calculate the cart subtotal as the sum of (unit price × quantity) for all items currently in the cart.

#### Scenario: Subtotal is calculated correctly

ID: SWHR3-R-0022.01

- **GIVEN** a cart with multiple items having different quantities and unit prices
- **WHEN** getSubTotal() is invoked
- **THEN** the system SHALL return the sum of (unitCost × quantity) for each CartItem

#### Scenario: Subtotal handles empty cart

ID: SWHR3-R-0022.02

- **GIVEN** an empty shopping cart
- **WHEN** getSubTotal() is called
- **THEN** the system SHALL return null or 0.0

### Requirement: Retrieve cart items with catalog enrichment

ID: SWHR3-R-0023

The system SHALL retrieve cart item details from the Catalog component, mapping each cart entry (itemID, quantity) to full product information including product name, category, attribute, and list price.

#### Scenario: Cart items are enriched with catalog data

ID: SWHR3-R-0023.01

- **GIVEN** a cart containing itemIds
- **WHEN** getItems() is called
- **THEN** the system SHALL call CatalogHelper.getItem(itemId, locale) for each item and create CartItem objects with product details

#### Scenario: Catalog lookup failure is handled gracefully

ID: SWHR3-R-0023.02

- **GIVEN** a catalog item that cannot be found or accessed
- **WHEN** CatalogException is thrown during catalog lookup
- **THEN** the system SHALL log the exception and skip that item (continue processing remaining items)

### Requirement: Count distinct items in cart

ID: SWHR3-R-0024

The system SHALL provide the count of distinct items (not total quantity) currently in the shopping cart.

#### Scenario: Count reflects distinct itemIds

ID: SWHR3-R-0024.01

- **GIVEN** a cart with 3 distinct items having various quantities
- **WHEN** getCount() is called
- **THEN** the system SHALL return 3 (the number of unique itemIds, not the sum of quantities)

#### Scenario: Count is zero for empty cart

ID: SWHR3-R-0024.02

- **GIVEN** an empty shopping cart
- **WHEN** getCount() is called
- **THEN** the system SHALL return 0

### Requirement: Empty shopping cart operation

ID: SWHR3-R-0025

The system SHALL provide the ability to empty (clear) all items from the shopping cart in a single operation.

#### Scenario: All items are removed at once

ID: SWHR3-R-0025.01

- **GIVEN** a cart with multiple items
- **WHEN** empty() is called
- **THEN** the system SHALL remove all items via HashMap.clear() in one operation

### Requirement: Locale-specific product information

ID: SWHR3-R-0026

The system SHALL support locale-specific product information retrieval in the shopping cart based on the user's locale preference, defaulting to US English (Locale.US).

#### Scenario: Locale is used in catalog lookups

ID: SWHR3-R-0026.01

- **GIVEN** a user with non-default locale preference
- **WHEN** setLocale(locale) is called and getItems() retrieves items
- **THEN** the system SHALL pass the locale to CatalogHelper.getItem(itemId, locale)

#### Scenario: Default locale is US English

ID: SWHR3-R-0026.02

- **GIVEN** a new shopping cart session
- **WHEN** no explicit locale is set
- **THEN** the system SHALL use Locale.US as the default for catalog queries

### Requirement: Cart operation transactions

ID: SWHR3-R-0027

The system SHALL ensure that all shopping cart operations (add item, remove item, update quantities, get items, get subtotal, empty cart, set locale) are executed within a container-managed transaction with the Required transaction attribute.

#### Scenario: Each cart operation is transactional

ID: SWHR3-R-0027.01

- **GIVEN** a cart operation being invoked
- **WHEN** the method is called on ShoppingCartLocalEJB
- **THEN** the system SHALL execute within a transaction with trans-attribute=Required

### Requirement: Cart access control

ID: SWHR3-R-0028

The system SHALL allow all users (unchecked) to perform shopping cart operations without role-based access restrictions.

#### Scenario: Anonymous users can access cart

ID: SWHR3-R-0028.01

- **GIVEN** any user attempting to access cart methods
- **WHEN** ShoppingCartEJB methods are invoked
- **THEN** the system SHALL permit access with no role checks (method-permission unchecked)

### Requirement: CartItem value object

ID: SWHR3-R-0029

A CartItem entity SHALL contain the following attributes: itemId, productId, category, name, attribute, quantity, and unitCost. The entity SHALL calculate totalCost as quantity × unitCost.

#### Scenario: CartItem encapsulates all display fields

ID: SWHR3-R-0029.01

- **GIVEN** a CartItem created from catalog Item and cart quantity
- **WHEN** the CartItem is constructed
- **THEN** the system SHALL store itemId, productId, category, name, attribute, quantity (int), and unitCost (double)

#### Scenario: Total cost is calculated correctly

ID: SWHR3-R-0029.02

- **GIVEN** a CartItem with quantity=5 and unitCost=19.99
- **WHEN** getTotalCost() is called
- **THEN** the system SHALL return 99.95

### Requirement: Shopping cart HTML action

ID: SWHR3-R-0030

The web action layer SHALL parse HTTP request parameters and route user actions to appropriate cart service calls via CartEvent objects.

#### Scenario: Purchase action creates ADD_ITEM event

ID: SWHR3-R-0030.01

- **GIVEN** an HTTP request with action="purchase" and itemId parameter
- **WHEN** CartHTMLAction.perform() is invoked
- **THEN** the system SHALL create CartEvent(CartEvent.ADD_ITEM, itemId) and route to EJB tier

#### Scenario: Remove action creates DELETE_ITEM event

ID: SWHR3-R-0030.02

- **GIVEN** an HTTP request with action="remove" and itemId parameter
- **WHEN** CartHTMLAction.perform() processes the request
- **THEN** the system SHALL create CartEvent(CartEvent.DELETE_ITEM, itemId)

#### Scenario: Update action parses quantity parameters

ID: SWHR3-R-0030.03

- **GIVEN** an HTTP request with action="update" and form fields matching itemQuantity\_<itemId>
- **WHEN** CartHTMLAction.perform() parses parameters
- **THEN** the system SHALL extract all itemQuantity\_ fields, parse quantities, and create UPDATE_ITEMS CartEvent

#### Scenario: Quantity parsing handles non-numeric values

ID: SWHR3-R-0030.04

- **GIVEN** an HTML form with invalid (non-numeric) quantity input
- **WHEN** CartHTMLAction parses the field value
- **THEN** the system SHALL catch NumberFormatException and default to quantity 0 (triggering item removal)

### Requirement: Shopping cart workflow

ID: SWHR3-R-0031

The shopping cart workflow SHALL support the following user actions in sequence: (1) browse catalog and add items (purchase action), (2) view cart, (3) remove items (remove action), (4) modify quantities (update action), and (5) proceed to checkout (provided cart is not empty).

#### Scenario: Complete workflow from purchase to checkout

ID: SWHR3-R-0031.01

- **GIVEN** a user navigating the shopping cart workflow
- **WHEN** the user selects purchase, views cart, updates quantities, and clicks checkout
- **THEN** the system SHALL process each action (ADD_ITEM, DELETE_ITEM, UPDATE_ITEMS) and display cart state accordingly

### Requirement: Empty cart checkout prevention

ID: SWHR3-R-0032

When a user attempts to checkout (proceed to order entry) with an empty cart, the system SHALL prevent the checkout and display the error message: "The Shopping Cart is Empty and the order could not be placed."

#### Scenario: Empty cart blocks checkout

ID: SWHR3-R-0032.01

- **GIVEN** a user with an empty shopping cart
- **WHEN** the user attempts to proceed to order entry
- **THEN** the system SHALL display the error message "The Shopping Cart is Empty and the order could not be placed" and prevent navigation

### Requirement: LineItem container-managed persistence entity

ID: SWHR3-R-0033

The system SHALL store line items as a Container-Managed Persistence (CMP) entity bean with seven required fields: categoryId, productId, itemId, lineNumber, quantity, unitPrice, and quantityShipped.

#### Scenario: LineItem entity is stored with CMP 2.x

ID: SWHR3-R-0033.01

- **GIVEN** order processing requiring line item storage
- **WHEN** LineItemEJB is instantiated
- **THEN** the system SHALL persist the entity via Container-Managed Persistence with seven CMP fields

#### Scenario: LineItem fields are accessible via abstract methods

ID: SWHR3-R-0033.02

- **GIVEN** a LineItemEJB instance
- **WHEN** getter/setter methods are called
- **THEN** the system SHALL provide getCategoryId(), getProductId(), getItemId(), getLineNumber(), getQuantity(), getUnitPrice(), and getQuantityShipped() methods

### Requirement: LineItem quantity tracking

ID: SWHR3-R-0034

The system SHALL track ordered quantity separately from shipped quantity for each line item. The quantityShipped field MAY be updated to reflect partial or complete shipment of the ordered quantity.

#### Scenario: Order quantity is independent from shipped quantity

ID: SWHR3-R-0034.01

- **GIVEN** a line item with ordered quantity 10
- **WHEN** only 5 units are shipped
- **THEN** the system SHALL maintain quantity=10 and quantityShipped=5 as separate values

### Requirement: CartHTMLAction NumberFormatException handling

ID: SWHR3-R-0035

When a user submits invalid (non-numeric) quantity inputs in the cart update form, the system SHALL catch the NumberFormatException and default the quantity to 0, which triggers automatic item removal.

#### Scenario: Invalid quantity input defaults to removal

ID: SWHR3-R-0035.01

- **GIVEN** a cart form submission with non-numeric quantity value
- **WHEN** CartHTMLAction parses the field
- **THEN** the system SHALL catch NumberFormatException, default to 0, and trigger item removal
