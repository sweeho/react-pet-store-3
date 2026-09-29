# order-workflow Specification

## Purpose

TBD - created by archiving change swhr3-i-0006-order-processing-and-fulfil. Update Purpose after archive.

## Requirements

### Requirement: Order creation with validation

ID: SWHR3-R-0050

The system SHALL create purchase orders only when the shopping cart contains items and all customer information is valid.

#### Scenario: Order is created with valid cart and customer data

ID: SWHR3-R-0050.01

- **GIVEN** a customer with items in cart, valid billing/shipping addresses, and payment method
- **WHEN** OrderEJBAction receives OrderEvent and processes the order
- **THEN** the system SHALL create PurchaseOrder with unique ID and persist to database

#### Scenario: Order creation fails if cart is empty

ID: SWHR3-R-0050.02

- **GIVEN** an empty shopping cart
- **WHEN** order creation is attempted
- **THEN** the system SHALL throw ShoppingCartEmptyOrderException and prevent order creation

### Requirement: Unique order ID generation

ID: SWHR3-R-0051

The system SHALL generate unique order identifiers using UniqueIdGenerator to prevent collisions.

#### Scenario: Order ID is generated and stored

ID: SWHR3-R-0051.01

- **GIVEN** order creation in progress
- **WHEN** OrderEJBAction calls UniqueIdGenerator.getUniqueId("1001")
- **THEN** the system SHALL create unique order ID and assign to PurchaseOrder

### Requirement: Order date capture

ID: SWHR3-R-0052

The system SHALL capture the current system date when an order is created and store it as the order date.

#### Scenario: Order date is set to current date

ID: SWHR3-R-0052.01

- **GIVEN** an order being created at specific moment
- **WHEN** PurchaseOrder is initialized
- **THEN** the system SHALL set OrderDate to current system date via new Date()

### Requirement: Line item creation and aggregation

ID: SWHR3-R-0053

The system SHALL create line item entities for each cart item and associate them with the purchase order.

#### Scenario: Line items are created for all cart items

ID: SWHR3-R-0053.01

- **GIVEN** a cart with multiple items and quantities
- **WHEN** order is created
- **THEN** the system SHALL create LineItem entity for each cart item with product ID, quantity, unit price

### Requirement: Order total calculation

ID: SWHR3-R-0054

The system SHALL calculate order total as sum of all line item totals (quantity × unit price per line item).

#### Scenario: Order total is calculated correctly

ID: SWHR3-R-0054.01

- **GIVEN** multiple line items with different quantities and prices
- **WHEN** order is finalized
- **THEN** the system SHALL sum line totals to calculate order total

### Requirement: Payment processing

ID: SWHR3-R-0055

The system SHALL process credit card payment through payment processor and update order status based on authorization result.

#### Scenario: Payment is authorized and order proceeds

ID: SWHR3-R-0055.01

- **GIVEN** valid credit card and order amount
- **WHEN** payment processor is invoked
- **THEN** the system SHALL authorize charge and update order status to PAID

#### Scenario: Payment fails and order is rejected

ID: SWHR3-R-0055.02

- **GIVEN** invalid credit card or authorization failure
- **WHEN** payment processor rejects authorization
- **THEN** the system SHALL rollback order and notify customer

### Requirement: Order status lifecycle

ID: SWHR3-R-0056

The system SHALL manage order status through defined state transitions: PENDING → PAID → CONFIRMED → ALLOCATED → SHIPPED → DELIVERED → COMPLETED.

#### Scenario: Order status transitions are enforced

ID: SWHR3-R-0056.01

- **GIVEN** an order in PENDING state
- **WHEN** payment is successful
- **THEN** system SHALL transition order status to PAID

### Requirement: Order confirmation notification

ID: SWHR3-R-0057

The system SHALL queue order confirmation notifications to async message queue for customer communication.

#### Scenario: Confirmation is queued to message system

ID: SWHR3-R-0057.01

- **GIVEN** successful order creation and payment
- **WHEN** order processing completes
- **THEN** the system SHALL queue order confirmation message with order details, total, shipping address

### Requirement: Inventory reservation

ID: SWHR3-R-0058

The system SHALL reserve ordered items from inventory system to ensure fulfillment availability.

#### Scenario: Inventory is reserved for order items

ID: SWHR3-R-0058.01

- **GIVEN** line items with product IDs and quantities
- **WHEN** inventory reservation is triggered
- **THEN** the system SHALL decrement available inventory and hold items for order fulfillment

### Requirement: Supplier PO generation

ID: SWHR3-R-0059

The system SHALL create purchase orders with suppliers for items requiring external procurement.

#### Scenario: Supplier POs are created for items

ID: SWHR3-R-0059.01

- **GIVEN** order line items requiring supplier fulfillment
- **WHEN** supplier PO generation is triggered
- **THEN** the system SHALL create SupplierPO entities grouped by supplier with delivery date expectations

### Requirement: Transaction atomicity

ID: SWHR3-R-0060

The system SHALL ensure all order components (PurchaseOrder, LineItems, SupplierPOs, Inventory reservations) are created atomically within single transaction.

#### Scenario: All order components succeed or all fail

ID: SWHR3-R-0060.01

- **GIVEN** order creation with multiple components
- **WHEN** any component fails (e.g., payment declined)
- **THEN** the system SHALL rollback entire transaction, leaving no partial order state

### Requirement: Order total price storage

ID: SWHR3-R-0061

The system SHALL store the order total amount calculated from line items on the PurchaseOrder.

#### Scenario: Order total is persisted

ID: SWHR3-R-0061.01

- **GIVEN** calculated order total amount
- **WHEN** PurchaseOrder is created
- **THEN** the system SHALL persist TotalAmount to database

### Requirement: Order fulfillment tracking

ID: SWHR3-R-0062

The system SHALL track order through fulfillment lifecycle from allocation through delivery.

#### Scenario: Order is tracked through fulfillment

ID: SWHR3-R-0062.01

- **GIVEN** order in ALLOCATED state with supplier POs created
- **WHEN** shipment is processed
- **THEN** the system SHALL update status to SHIPPED and track via supplier tracking numbers

### Requirement: Service locator integration

ID: SWHR3-R-0063

The system SHALL use ServiceLocator pattern to locate and access EJB components required for order processing.

#### Scenario: EJB components are located via ServiceLocator

ID: SWHR3-R-0063.01

- **GIVEN** need to access OrderEJB, PaymentProcessorEJB, InventoryEJB
- **WHEN** order processing calls ServiceLocator.getLocalHome()
- **THEN** the system SHALL return appropriate home interface for JNDI access

### Requirement: Order customer association

ID: SWHR3-R-0064

The system SHALL associate each order with the authenticated customer ID and capture customer email address.

#### Scenario: Order is linked to customer

ID: SWHR3-R-0064.01

- **GIVEN** authenticated customer completing order
- **WHEN** PurchaseOrder is created
- **THEN** the system SHALL store customer UserId and email address from session context and billing address
