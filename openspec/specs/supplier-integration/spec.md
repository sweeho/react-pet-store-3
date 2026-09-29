# supplier-integration Specification

## Purpose

TBD - created by archiving change swhr3-i-0007-supplier-portal-and-invento. Update Purpose after archive.

## Requirements

### Requirement: Inventory display screen

ID: SWHR3-R-0065

The system SHALL provide a web interface that displays all current inventory items with their itemId and existing quantity. Only authenticated users with administrator role SHALL view this screen.

#### Scenario: Inventory items are displayed to authorized users

ID: SWHR3-R-0065.01

- **GIVEN** an authenticated supplier administrator
- **WHEN** the user navigates to the inventory display page
- **THEN** the system SHALL display a table with all inventory items showing itemId and current quantity columns

#### Scenario: Inventory display is restricted to administrators

ID: SWHR3-R-0065.02

- **GIVEN** an unauthenticated user or non-administrator
- **WHEN** the user attempts to access the inventory display
- **THEN** the system SHALL deny access and restrict display to only authenticated administrators with administrator role

### Requirement: Inventory update form

ID: SWHR3-R-0066

The system SHALL provide a web form that allows authenticated administrators to update inventory quantities for individual items. For each inventory item, a text input field SHALL accept a new quantity value, and a checkbox SHALL mark items for update. Submitting the form SHALL trigger inventory update and reprocessing of all pending orders.

#### Scenario: Update form displays quantity input fields

ID: SWHR3-R-0066.01

- **GIVEN** an inventory display page with current items
- **WHEN** the page is rendered
- **THEN** the system SHALL display text input fields named qty\_<itemId> for entering new quantities

#### Scenario: Checkboxes mark items for updating

ID: SWHR3-R-0066.02

- **GIVEN** each item displayed in the inventory table
- **WHEN** the form is rendered
- **THEN** the system SHALL include a checkbox named item\_<itemId> for each item to mark it for update

#### Scenario: Form submission updates inventory and reprocesses orders

ID: SWHR3-R-0066.03

- **GIVEN** an inventory form with selected items and new quantities
- **WHEN** the user submits the form with action="updateinventory"
- **THEN** the system SHALL update quantities for selected items and automatically reprocess all pending supplier orders

### Requirement: Inventory update page

ID: SWHR3-R-0067

The system SHALL display an "Inventory Update Page" that shows all current inventory items with their itemId and current quantity. For each item, the user SHALL be able to enter a new quantity and select a checkbox to mark the item for update. Submitting the form SHALL update quantities and trigger retry of pending orders.

#### Scenario: Complete inventory update workflow is provided

ID: SWHR3-R-0067.01

- **GIVEN** an inventory page with all current items
- **WHEN** the user views the page
- **THEN** the system SHALL display itemId, existing quantity, new quantity input field, and update checkbox in table format for each item

#### Scenario: Invalid quantity input is handled

ID: SWHR3-R-0067.02

- **GIVEN** a form submission with invalid (non-numeric) quantity values
- **WHEN** the form is processed
- **THEN** the system SHALL skip items with invalid quantities or empty fields without error notification

### Requirement: Supplier order entity

ID: SWHR3-R-0068

The system SHALL maintain a SupplierOrder entity with an identifier (poId), date (poDate), and status (poStatus) to represent a purchase order received from the petstore.

#### Scenario: Supplier order is created with required fields

ID: SWHR3-R-0068.01

- **GIVEN** a new purchase order from petstore
- **WHEN** SupplierOrder is created
- **THEN** the system SHALL set poId as unique identifier, poDate as creation timestamp, and poStatus as initial state

#### Scenario: Order status is tracked through lifecycle

ID: SWHR3-R-0068.02

- **GIVEN** a supplier order
- **WHEN** order progresses through fulfillment
- **THEN** the system SHALL update poStatus through states: pending, processing, completed

### Requirement: Inventory entity

ID: SWHR3-R-0069

Inventory SHALL be represented as an entity with itemId as a unique identifier and quantity as a numeric attribute tracking available stock.

#### Scenario: Inventory item is tracked with quantity

ID: SWHR3-R-0069.01

- **GIVEN** an inventory item for a product
- **WHEN** inventory is created
- **THEN** the system SHALL store itemId as identifier and quantity as mutable numeric field

#### Scenario: Inventory quantity can be updated

ID: SWHR3-R-0069.02

- **GIVEN** an inventory item
- **WHEN** inventory updates occur (purchases, restocking)
- **THEN** the system SHALL modify quantity value via setQuantity method

### Requirement: Contact information entity

ID: SWHR3-R-0070

Each SupplierOrder SHALL maintain a one-to-one relationship with ContactInfo to store shipping information (contact name, email, telephone, and address).

#### Scenario: Supplier order has associated contact information

ID: SWHR3-R-0070.01

- **GIVEN** a supplier order being created
- **WHEN** the order is persisted
- **THEN** the system SHALL automatically create and link ContactInfo with givenName, familyName, email, and telephone fields

### Requirement: Address entity

ID: SWHR3-R-0071

Each ContactInfo entity for a supplier order SHALL include givenName, familyName, email, and telephone fields, and SHALL maintain a one-to-one relationship with an Address entity for delivery address details.

#### Scenario: Contact info links to delivery address

ID: SWHR3-R-0071.01

- **GIVEN** supplier order contact information
- **WHEN** the order requires delivery address
- **THEN** the system SHALL relate ContactInfo to Address entity with complete street, city, state, postal code, and country fields

### Requirement: Line item entity

ID: SWHR3-R-0072

LineItem SHALL represent a single line in a purchase order with itemId, quantity, quantityShipped, lineNumber, categoryId, productId, and unitPrice attributes.

#### Scenario: Line item captures order line details

ID: SWHR3-R-0072.01

- **GIVEN** a line item in a supplier purchase order
- **WHEN** the item is created
- **THEN** the system SHALL store all seven attributes: itemId, quantity, quantityShipped, lineNumber, categoryId, productId, unitPrice

### Requirement: Inventory validation for order fulfillment

ID: SWHR3-R-0073

The system SHALL validate that the quantity available in inventory is sufficient to fulfill each line item in a purchase order before deducting from inventory.

#### Scenario: Inventory is checked before fulfillment

ID: SWHR3-R-0073.01

- **GIVEN** a supplier order with line items
- **WHEN** order fulfillment processing begins
- **THEN** the system SHALL check inventory quantity against line item quantity before deducting

#### Scenario: Insufficient inventory prevents fulfillment

ID: SWHR3-R-0073.02

- **GIVEN** a line item requiring more inventory than available
- **WHEN** inventory check occurs
- **THEN** the system SHALL not deduct inventory and mark item as unable to fulfill

### Requirement: Inventory quantity update validation

ID: SWHR3-R-0074

The system SHALL only update inventory quantities if the provided quantity value is a valid non-negative integer. Quantities less than 0 SHALL be rejected.

#### Scenario: Non-negative quantities are accepted

ID: SWHR3-R-0074.01

- **GIVEN** an inventory update form with non-negative quantity value
- **WHEN** the form is submitted
- **THEN** the system SHALL accept the update and modify inventory

#### Scenario: Negative quantities are rejected

ID: SWHR3-R-0074.02

- **GIVEN** an inventory update with negative quantity value
- **WHEN** the form is processed
- **THEN** the system SHALL reject the update and skip that item without modification

### Requirement: Pending order reprocessing

ID: SWHR3-R-0075

When an inventory update occurs, the system SHALL automatically reprocess all pending supplier orders to attempt fulfillment based on new inventory availability.

#### Scenario: Pending orders are retried after inventory update

ID: SWHR3-R-0075.01

- **GIVEN** pending supplier orders and an inventory update
- **WHEN** inventory quantities are modified and committed
- **THEN** the system SHALL automatically retry all pending orders for fulfillment

#### Scenario: Order status is updated on successful fulfillment

ID: SWHR3-R-0075.02

- **GIVEN** a pending order retried with sufficient inventory
- **WHEN** reprocessing checks pass inventory validation
- **THEN** the system SHALL update order status from pending to processing or completed

### Requirement: Invoice generation

ID: SWHR3-R-0076

When a supplier order is fulfilled, the system SHALL generate an invoice containing order details, line items with quantities and unit prices, totals, and shipment information.

#### Scenario: Invoice is generated for fulfilled order

ID: SWHR3-R-0076.01

- **GIVEN** a supplier order with all line items fulfillable
- **WHEN** inventory is sufficient and fulfillment completes
- **THEN** the system SHALL generate invoice with order ID, date, items, quantities, and total amount

### Requirement: Order fulfillment workflow

ID: SWHR3-R-0077

GIVEN a purchase order XML message is received via JMS Queue from the Order Processing Center, WHEN the supplier system receives and processes the message, THEN the system SHALL parse the XML, persist the order, check inventory for each line item, reduce inventory for items that can be fulfilled, generate an invoice for shipped items, and send the invoice back via JMS Topic to notify the OPC.

#### Scenario: Complete order processing workflow executes

ID: SWHR3-R-0077.01

- **GIVEN** a purchase order XML received via JMS
- **WHEN** SupplierOrderMDB receives the message
- **THEN** the system SHALL parse XML, create SupplierOrder, check inventory, reduce quantities, generate invoice, and send via JMS Topic

### Requirement: Invoice messaging integration

ID: SWHR3-R-0078

When an invoice is generated and ready to ship, the system SHALL invoke a TransitionDelegate to send the invoice XML document back to the order processing center via asynchronous messaging (JMS topic).

#### Scenario: Invoice is sent to order processing center

ID: SWHR3-R-0078.01

- **GIVEN** an invoice generated from supplier order fulfillment
- **WHEN** the invoice is ready for transmission
- **THEN** the system SHALL invoke TransitionDelegate to send invoice XML via JMS Topic

### Requirement: Container-managed transactions

ID: SWHR3-R-0079

All supplier order and inventory operations SHALL execute within container-managed transactions with Required transaction attribute, ensuring atomicity of multi-step operations.

#### Scenario: Order creation is transactional

ID: SWHR3-R-0079.01

- **GIVEN** supplier order creation with related ContactInfo and Address
- **WHEN** order is being persisted
- **THEN** the system SHALL execute within single transaction with Required attribute

#### Scenario: Inventory update and order reprocessing are atomic

ID: SWHR3-R-0079.02

- **GIVEN** inventory updates combined with pending order reprocessing
- **WHEN** the request is processed
- **THEN** the system SHALL execute both operations within single transaction, rolling back if either fails

### Requirement: Role-based supplier access control

ID: SWHR3-R-0080

The supplier portal operations SHALL be restricted to authenticated users with administrator role, enforced at both the container security level and the application code level.

#### Scenario: Administrator role is enforced

ID: SWHR3-R-0080.01

- **GIVEN** a supplier user attempting inventory access
- **WHEN** the user lacks administrator role
- **THEN** the system SHALL deny access via web.xml security-constraint and isUserInRole check

### Requirement: ServiceLocator pattern integration

ID: SWHR3-R-0081

The supplier system SHALL use ServiceLocator pattern to locate and access EJB components required for order processing, inventory management, and transition delegation.

#### Scenario: EJB components are located dynamically

ID: SWHR3-R-0081.01

- **GIVEN** supplier order processing requiring inventory and fulfillment components
- **WHEN** the processing begins
- **THEN** the system SHALL use ServiceLocator to obtain local home interfaces for InventoryEJB, OrderFulfillmentFacadeEJB, and other components

### Requirement: DisplayInventoryBean display logic

ID: SWHR3-R-0082

The system SHALL use DisplayInventoryBean to retrieve and format inventory data for display on the inventory management interface, providing getInventory() method returning current inventory items.

#### Scenario: DisplayInventoryBean retrieves all inventory

ID: SWHR3-R-0082.01

- **GIVEN** an inventory display request
- **WHEN** displayinventory.jsp calls displayInventory.getInventory()
- **THEN** the system SHALL return collection of all InventoryLocal entities with current quantities
