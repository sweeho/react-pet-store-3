## ADDED Requirements

### Requirement: Order creation with validation

The system SHALL create purchase orders only when the shopping cart contains items and all customer information is valid.

#### Scenario: Order is created with valid cart and customer data

- **GIVEN** a customer with items in cart, valid billing/shipping addresses, and payment method
- **WHEN** OrderEJBAction receives OrderEvent and processes the order
- **THEN** the system SHALL create PurchaseOrder with unique ID and persist to database

#### Scenario: Order creation fails if cart is empty

- **GIVEN** an empty shopping cart
- **WHEN** order creation is attempted
- **THEN** the system SHALL throw ShoppingCartEmptyOrderException and prevent order creation

### Requirement: Unique order ID generation

The system SHALL generate unique order identifiers using UniqueIdGenerator to prevent collisions.

#### Scenario: Order ID is generated and stored

- **GIVEN** order creation in progress
- **WHEN** OrderEJBAction calls UniqueIdGenerator.getUniqueId("1001")
- **THEN** the system SHALL create unique order ID and assign to PurchaseOrder

### Requirement: Order date capture

The system SHALL capture the current system date when an order is created and store it as the order date.

#### Scenario: Order date is set to current date

- **GIVEN** an order being created at specific moment
- **WHEN** PurchaseOrder is initialized
- **THEN** the system SHALL set OrderDate to current system date via new Date()

### Requirement: Line item creation and aggregation

The system SHALL create line item entities for each cart item and associate them with the purchase order.

#### Scenario: Line items are created for all cart items

- **GIVEN** a cart with multiple items and quantities
- **WHEN** order is created
- **THEN** the system SHALL create LineItem entity for each cart item with product ID, quantity, unit price

### Requirement: Order total calculation

The system SHALL calculate order total as sum of all line item totals (quantity × unit price per line item).

#### Scenario: Order total is calculated correctly

- **GIVEN** multiple line items with different quantities and prices
- **WHEN** order is finalized
- **THEN** the system SHALL sum line totals to calculate order total

### Requirement: Payment processing

The system SHALL process credit card payment through payment processor and update order status based on authorization result.

#### Scenario: Payment is authorized and order proceeds

- **GIVEN** valid credit card and order amount
- **WHEN** payment processor is invoked
- **THEN** the system SHALL authorize charge and update order status to PAID

#### Scenario: Payment fails and order is rejected

- **GIVEN** invalid credit card or authorization failure
- **WHEN** payment processor rejects authorization
- **THEN** the system SHALL rollback order and notify customer

### Requirement: Order status lifecycle

The system SHALL manage order status through defined state transitions: PENDING → PAID → CONFIRMED → ALLOCATED → SHIPPED → DELIVERED → COMPLETED.

#### Scenario: Order status transitions are enforced

- **GIVEN** an order in PENDING state
- **WHEN** payment is successful
- **THEN** system SHALL transition order status to PAID

### Requirement: Order confirmation notification

The system SHALL queue order confirmation notifications to async message queue for customer communication.

#### Scenario: Confirmation is queued to message system

- **GIVEN** successful order creation and payment
- **WHEN** order processing completes
- **THEN** the system SHALL queue order confirmation message with order details, total, shipping address

### Requirement: Inventory reservation

The system SHALL reserve ordered items from inventory system to ensure fulfillment availability.

#### Scenario: Inventory is reserved for order items

- **GIVEN** line items with product IDs and quantities
- **WHEN** inventory reservation is triggered
- **THEN** the system SHALL decrement available inventory and hold items for order fulfillment

### Requirement: Supplier PO generation

The system SHALL create purchase orders with suppliers for items requiring external procurement.

#### Scenario: Supplier POs are created for items

- **GIVEN** order line items requiring supplier fulfillment
- **WHEN** supplier PO generation is triggered
- **THEN** the system SHALL create SupplierPO entities grouped by supplier with delivery date expectations

### Requirement: Transaction atomicity

The system SHALL ensure all order components (PurchaseOrder, LineItems, SupplierPOs, Inventory reservations) are created atomically within single transaction.

#### Scenario: All order components succeed or all fail

- **GIVEN** order creation with multiple components
- **WHEN** any component fails (e.g., payment declined)
- **THEN** the system SHALL rollback entire transaction, leaving no partial order state

### Requirement: Order total price storage

The system SHALL store the order total amount calculated from line items on the PurchaseOrder.

#### Scenario: Order total is persisted

- **GIVEN** calculated order total amount
- **WHEN** PurchaseOrder is created
- **THEN** the system SHALL persist TotalAmount to database

### Requirement: Order fulfillment tracking

The system SHALL track order through fulfillment lifecycle from allocation through delivery.

#### Scenario: Order is tracked through fulfillment

- **GIVEN** order in ALLOCATED state with supplier POs created
- **WHEN** shipment is processed
- **THEN** the system SHALL update status to SHIPPED and track via supplier tracking numbers

### Requirement: Service locator integration

The system SHALL use ServiceLocator pattern to locate and access EJB components required for order processing.

#### Scenario: EJB components are located via ServiceLocator

- **GIVEN** need to access OrderEJB, PaymentProcessorEJB, InventoryEJB
- **WHEN** order processing calls ServiceLocator.getLocalHome()
- **THEN** the system SHALL return appropriate home interface for JNDI access

### Requirement: Order customer association

The system SHALL associate each order with the authenticated customer ID and capture customer email address.

#### Scenario: Order is linked to customer

- **GIVEN** authenticated customer completing order
- **WHEN** PurchaseOrder is created
- **THEN** the system SHALL store customer UserId and email address from session context and billing address
