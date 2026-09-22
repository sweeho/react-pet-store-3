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
