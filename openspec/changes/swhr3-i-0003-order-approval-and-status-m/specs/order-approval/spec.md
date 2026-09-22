## ADDED Requirements

### Requirement: Order status enumeration

The system SHALL support exactly four order status values: PENDING, APPROVED, DENIED, and COMPLETED.

#### Scenario: Status values are available in approval interface

- **GIVEN** an administrator accessing the order approval panel
- **WHEN** viewing the order status options
- **THEN** the system SHALL display PENDING, APPROVED, DENIED, and COMPLETED as the available status values

#### Scenario: Orders are queryable by status

- **GIVEN** orders in the system with different status values
- **WHEN** the admin client queries for orders
- **THEN** the system SHALL return orders grouped by all four status types: PENDING orders, APPROVED orders, DENIED orders, and COMPLETED orders

### Requirement: Order approval via inline status editing

The system SHALL allow administrators to select one or more orders and change their status to APPROVED or DENIED directly in the approval interface.

#### Scenario: Single order status is changed to APPROVED

- **GIVEN** an order displayed in the approval panel with PENDING status
- **WHEN** the administrator selects the order row and clicks the approve button
- **THEN** the system SHALL update the order status in the approval panel to APPROVED

#### Scenario: Multiple orders are denied in batch

- **GIVEN** multiple orders selected in the approval panel
- **WHEN** the administrator clicks the deny button
- **THEN** the system SHALL update all selected order statuses to DENIED in the local interface

### Requirement: Batch order status updates

The system SHALL collect multiple order status changes locally and send them to the server in a single atomic update when the administrator clicks commit.

#### Scenario: Changes are batched and sent on commit

- **GIVEN** an administrator with one or more pending order status changes
- **WHEN** the administrator clicks the commit button
- **THEN** the system SHALL package all pending changes into a single XML OrderApproval message and send to server via HTTP POST to ApplRequestProcessor

#### Scenario: Order changes are serialized to XML format

- **GIVEN** pending order status changes (e.g., OrderId 1001 to APPROVED, OrderId 1002 to DENIED)
- **WHEN** the commit operation packages the changes
- **THEN** the system SHALL serialize to XML containing Order elements with OrderId and OrderStatus sub-elements

### Requirement: Uncommitted changes detection

The system SHALL warn the administrator if uncommitted order status changes exist when attempting to refresh orders, and SHALL require explicit confirmation to proceed.

#### Scenario: Warning is displayed for pending changes

- **GIVEN** an order with status changed from PENDING to APPROVED but not yet committed
- **WHEN** the administrator clicks the refresh button
- **THEN** the system SHALL display a confirmation dialog warning of uncommitted changes

#### Scenario: Refresh requires confirmation

- **GIVEN** uncommitted order changes and confirmation dialog displayed
- **WHEN** the administrator clicks OK to confirm
- **THEN** the system SHALL proceed with refresh and reload orders from server

#### Scenario: Refresh is canceled

- **GIVEN** uncommitted order changes and confirmation dialog displayed
- **WHEN** the administrator clicks Cancel
- **THEN** the system SHALL NOT proceed with refresh and SHALL retain local changes

### Requirement: Server-side order update processing

The system SHALL receive XML-serialized order approval messages from the client, parse the order changes, and persist them via business logic components with atomic transaction semantics.

#### Scenario: UPDATESTATUS request is processed

- **GIVEN** XML message with RequestType UPDATESTATUS containing order status changes
- **WHEN** the ApplRequestProcessor servlet receives the request
- **THEN** the system SHALL route to updateOrders() method and delegate to AdminRequestBD

#### Scenario: Order changes are parsed from XML

- **GIVEN** XML OrderApproval message with Order elements
- **WHEN** updateOrders() processes the message
- **THEN** the system SHALL extract OrderId and OrderStatus from each Order element and create ChangedOrder objects

#### Scenario: All changes are persisted or all rolled back

- **GIVEN** multiple orders with status changes and one order fails to update
- **WHEN** the batch update is processed
- **THEN** the system SHALL rollback all changes if any order update fails (atomic transaction behavior)

### Requirement: XML OrderApproval message format

The system SHALL serialize order status changes to XML format containing OrderId and OrderStatus elements for each modified order.

#### Scenario: OrderApproval XML is correctly formatted

- **GIVEN** changes to multiple orders in the approval panel
- **WHEN** commit is called and changes are serialized
- **THEN** the system SHALL produce XML with root RequestType element set to UPDATESTATUS and Order child elements containing OrderId and OrderStatus

### Requirement: Successful update response

The system SHALL return an XML response confirming successful order status updates or indicating an error.

#### Scenario: Success response is returned

- **GIVEN** valid order updates received by ApplRequestProcessor
- **WHEN** all order updates succeed
- **THEN** the system SHALL return XML response with Type=UPDATEORDERS and Status=SUCCESS

#### Scenario: Error response includes exception message

- **GIVEN** an AdminBDException thrown during order update
- **WHEN** the exception is caught by ApplRequestProcessor
- **THEN** the system SHALL return XML error response with exception message

### Requirement: Transaction atomicity for order updates

The system SHALL enforce container-managed transactions on all order update operations, ensuring that either all changes in a batch commit or none of them persist.

#### Scenario: Multiple orders are updated in single transaction

- **GIVEN** a batch of three order status changes in one commit request
- **WHEN** AdminRequestBD.updateOrders() processes the batch
- **THEN** the system SHALL execute all three updates within a single transaction context

#### Scenario: Partial batch failure triggers rollback

- **GIVEN** a batch of three order updates where the second update fails
- **WHEN** the transaction is active and failure occurs
- **THEN** the system SHALL rollback all three updates, leaving no partial updates persisted

### Requirement: Status change restrictions

The system SHALL restrict which status values administrators can assign to orders, allowing only APPROVED or DENIED assignments through the approval interface.

#### Scenario: Only APPROVED or DENIED options are available

- **GIVEN** the order status combo box in approval panel
- **WHEN** the administrator opens the dropdown
- **THEN** the system SHALL display only APPROVED and DENIED as options (PENDING and COMPLETED are not editable)

### Requirement: Administrator role restriction

The system SHALL restrict order approval operations to users with the administrator role.

#### Scenario: Only administrators can access approval functions

- **GIVEN** an authenticated user without administrator role
- **WHEN** attempting to modify order statuses
- **THEN** the system SHALL deny the operation and require administrator credentials

### Requirement: Session persistence through JNLP deployment

The system SHALL embed the user's session ID in the JNLP file delivered to the client, enabling authenticated requests from the rich client application.

#### Scenario: Session ID is passed in JNLP arguments

- **GIVEN** an administrator launching the rich client via Java WebStart
- **WHEN** the JNLP file is generated by AdminRequestProcessor.buildJNLP()
- **THEN** the system SHALL embed req.getSession().getId() as an argument in the JNLP application descriptor

#### Scenario: Session ID is used for authenticated requests

- **GIVEN** a rich client application running with embedded session ID
- **WHEN** the client sends order update requests
- **THEN** the system SHALL use the embedded session ID for request authentication

### Requirement: XML Request Type identification

The system SHALL route order approval requests based on RequestType element value UPDATESTATUS in the XML request.

#### Scenario: UPDATESTATUS route is evaluated

- **GIVEN** XML message with RequestType element
- **WHEN** ApplRequestProcessor.updateOrders() checks request type
- **THEN** the system SHALL route to updateOrders() method if RequestType equals UPDATESTATUS

### Requirement: Order data object creation and transfer

The system SHALL create ChangedOrder objects containing orderId and orderStatus for each modified order, packaging them into OrderApproval container for batch processing.

#### Scenario: ChangedOrder is created from XML

- **GIVEN** XML Order element with OrderId and OrderStatus sub-elements
- **WHEN** the element is parsed in updateOrders()
- **THEN** the system SHALL create new ChangedOrder(orderId, orderStatus) object

#### Scenario: OrderApproval collects all changes

- **GIVEN** multiple ChangedOrder objects from XML parsing
- **WHEN** all orders are extracted from the XML message
- **THEN** the system SHALL aggregate into single OrderApproval object containing all changes

### Requirement: Client-side order table model refresh

The system SHALL reload all orders from the server, aggregating PENDING, APPROVED, DENIED, and COMPLETED status groups into a single refreshed order list.

#### Scenario: All status groups are retrieved on refresh

- **GIVEN** a refresh action initiated by the administrator
- **WHEN** the client calls getOrders() on the server
- **THEN** the system SHALL query and return orders for all four status types and combine into single result set
