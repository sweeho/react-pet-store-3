# Supplier Integration Design

## User Interface

Three screen records were extracted for this capability. Their visible contracts are specified in specs/supplier-integration/spec.md as requirements.

## Architecture Overview

The supplier integration system is implemented as a supplier portal with request processing, inventory management, and order fulfillment workflows:

1. **Web Tier**: RcvrRequestProcessor servlet routes supplier requests based on screen parameter
2. **Request Processing**: Handles inventory display, updates, and order status queries
3. **Session Management**: Maintains supplier administrator sessions with role-based access
4. **Inventory Management**: Tracks and updates inventory levels with automatic order reprocessing
5. **Order Processing**: SupplierOrder entities with state management and fulfillment tracking
6. **Business Logic Tier**: Inventory updates trigger automatic reprocessing of pending orders
7. **Data Tier**: CMP 2.x entity beans with container-managed relationships

### Supplier Portal Workflow

1. **Authentication**: Supplier administrator logs in with authentication check
2. **Inventory View**: Display current inventory levels for all items
3. **Inventory Update**: Modify quantities for selected items via form submission
4. **Order Reprocessing**: Automatically retry pending orders after inventory changes
5. **Invoice Generation**: Generate invoices for completed orders
6. **Order Status**: Track orders through pending, processing, and completed states
7. **Shipment Tracking**: Update order status with delivery information

### Key Components

**RcvrRequestProcessor** (Servlet):

- Routes requests based on currentScreen parameter
- Handles "displayinventory" screen for viewing inventory
- Handles "updateinventory" screen for inventory modifications
- Coordinates transaction management for multi-step operations
- Calls DisplayInventoryBean for screen display
- Calls InventoryEJB for inventory operations
- Manages order reprocessing after inventory updates

**SupplierOrder Entity** (CMP 2.x):

- poId (String, primary key): Unique purchase order identifier
- poDate (long): Timestamp of order creation
- poStatus (String): Current order status (pending, processing, completed)
- Relationship to ContactInfo for shipping address
- Tracks supplier orders received from petstore

**ContactInfo Entity** (CMP 2.x):

- givenName, familyName: Receiver name
- email, telephone: Contact information
- One-to-one relationship to Address entity
- Stores shipping address information

**Address Entity**:

- Street address fields
- City, state, postal code
- Country information
- Related to ContactInfo via one-to-one relationship

**InventoryLocal Interface**:

- findByPrimaryKey(itemId) - retrieve inventory item
- Provides access to inventory quantities

**DisplayInventoryBean**:

- getInventory() - retrieves all inventory items for display
- Used by displayinventory.jsp to render inventory table

### Request Processing Flow

1. RcvrRequestProcessor.doGet() checks authentication and authorization
2. Checks role: isUserInRole("administrator")
3. Routes based on currentScreen parameter
4. For "displayinventory": forwards to displayinventory.jsp
5. For "updateinventory": begins transaction, calls updateInventory, calls processPendingPO, commits
6. updateInventory parses request parameters matching patterns: qty_itemId, item_itemId
7. processPendingPO retries any pending SupplierOrder entities
8. Automatic invoice generation for completed orders

### Data Model

**SupplierOrder**:

- One-to-many relationship with OrderLineItem entities
- One-to-one relationship with ContactInfo for delivery address
- poStatus field defines order lifecycle state
- poDate captures order creation timestamp

**ContactInfo**:

- One-to-one relationship with SupplierOrder (foreign key reference)
- One-to-one relationship with Address
- Stores receiver contact details

**Address**:

- Related to ContactInfo (one-to-one)
- Stores complete delivery address information

### Transactions

All supplier order operations execute within container-managed transactions:

- Order creation within SupplierOrderEJB
- Inventory updates with Required attribute
- Order reprocessing within transaction boundary
- Invoice generation within order processing transaction

### Security

Supplier portal protected by:

- web.xml security-constraint restricting access to administrator role
- isUserInRole("administrator") check in RcvrRequestProcessor
- Session-based authentication for supplier administrators
- Unchecked permission for unauthenticated access (handled by container)

### Integration Points

- Inventory system integration for real-time quantity lookup and update
- Order processing system integration for pending order retry
- Invoice generation system triggered after order fulfillment
- Supplier order lifecycle management with status tracking

### Notable Implementation Details

- Checkbox named "item_itemId" marks items for update (may represent UI artifact)
- Quantity update parameters follow pattern "qty_itemId"
- RcvrRequestProcessor begins/commits transaction boundaries manually
- processPendingPO called automatically after inventory updates
- Invoice generation triggered within same transaction as order reprocessing
- displayinventory.jsp uses DisplayInventoryBean for data retrieval
- InventoryLocal home obtained via ServiceLocator pattern

## Key Files

- **Supplier Portal Servlet**: RcvrRequestProcessor.java
- **Entity Beans**: SupplierOrderEJB.java, ContactInfoEJB.java, AddressEJB.java
- **Business Beans**: DisplayInventoryBean.java
- **Interfaces**: SupplierOrderLocal.java, InventoryLocal.java
- **Views**: displayinventory.jsp
- **Configuration**: ejb-jar.xml, web.xml, struts-config.xml
