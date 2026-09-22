# Order Approval Design

## User interface

No screen records were extracted for this capability; its user interface is unspecified. The order approval functionality is implemented in the rich client Java Swing application, accessed through the admin interface after authentication and JNLP deployment.

## Architecture Overview

Order approval is implemented as a distributed system connecting a rich client to a backend J2EE server:

1. **Client Tier**: Java Swing application (PetStoreAdminClient) with OrdersApprovePanel
2. **Communication Tier**: HTTP/XML messaging via ApplRequestProcessor servlet
3. **Business Tier**: AdminRequestBD business delegate and EJB session beans
4. **Persistence Tier**: Order entity beans and status tracking

### Order Status Lifecycle

The system supports four order statuses:

- **PENDING**: Initial state for newly created orders, awaiting approval
- **APPROVED**: Administrator has approved the order for processing
- **DENIED**: Administrator has rejected the order
- **COMPLETED**: Order has been fulfilled and closed

### Order Approval Workflow

1. Administrator accesses admin interface via form-based authentication
2. Selects "Launch Rich Client" button, receives JNLP file with session ID
3. Java WebStart executes client with embedded session ID and server details
4. Client connects to ApplRequestProcessor to retrieve orders by status
5. OrdersApprovePanel displays orders in tabbed view with read-only and approval tabs
6. Administrator selects rows and clicks approve or deny buttons
7. Client updates table model locally (status column, row 4)
8. Administrator clicks commit button to send changes
9. TableModel.commit() packages modified orders into OrderApproval XML
10. XML sent to ApplRequestProcessor with request type UPDATESTATUS
11. ApplRequestProcessor.updateOrders() parses XML and delegates to AdminRequestBD
12. AdminRequestBD.updateOrders() persists changes via order EJB operations

### Client Components

**OrdersApprovePanel**:

- JTable displaying orders with columns: OrderId, CustomerName, OrderDate, OrderTotal, OrderStatus
- OrderStatus column (index 4) editable via JComboBox with options: PENDING, APPROVED, DENIED
- Approve button: sets all selected row statuses to APPROVED
- Deny button: sets all selected row statuses to DENIED
- Commit button: saves changes to server
- Refresh button: reloads orders from server

**TableSorter (proxy pattern)**:

- Wraps order table model to allow sorting
- Intercepts setValueAt() calls to update status column
- Triggers table repaint to reflect UI changes

**DataSource**:

- getOrders() queries server for all order status types (PENDING, APPROVED, DENIED, COMPLETED)
- RefreshAction checks for uncommitted changes (any status != PENDING)
- Warns user with JOptionPane confirmation dialog if changes exist
- Only proceeds with refresh if user confirms

### Server Components

**ApplRequestProcessor Servlet**:

- Receives POST requests with XML-encoded orders
- Extracts request type (UPDATESTATUS) from XML root element
- Calls updateOrders() for status change requests
- Returns XML response: status=SUCCESS or error message

**AdminRequestBD (Business Delegate)**:

- updateOrders() accepts OrderApproval value object
- Iterates through ChangedOrder items
- Updates each order via EJB session bean method
- Throws AdminBDException on failure (caught by servlet and returned as error response)

### XML Message Format

**Request (OrderApproval)**:

```xml
<Request>
  <RequestType>UPDATESTATUS</RequestType>
  <Order>
    <OrderId>1001</OrderId>
    <OrderStatus>APPROVED</OrderStatus>
  </Order>
  <Order>
    <OrderId>1002</OrderId>
    <OrderStatus>DENIED</OrderStatus>
  </Order>
</Request>
```

**Response**:

```xml
<Response>
  <Type>UPDATEORDERS</Type>
  <Status>SUCCESS</Status>
</Response>
```

### Data Model

**Order Entity**:

- Fields: OrderId (key), CustomerId, OrderDate, OrderTotal, OrderStatus
- OrderStatus: one of PENDING, APPROVED, DENIED, COMPLETED
- Accessed through EJB local interface for status updates

**OrderApproval Value Object**:

- Represents batch of order status changes
- Contains: List<ChangedOrder>
- Serializable for XML marshalling

**ChangedOrder Value Object**:

- Fields: orderId, orderStatus
- Extracted from XML during request parsing

### Transaction Semantics

- AdminRequestBD.updateOrders() operates within container-managed transaction
- Multiple order updates grouped in single transaction for atomicity
- Rollback on any individual order update failure
- Response indicates SUCCESS or returns exception details

## Legacy Implementation Notes

### Client-Server Communication

- HTTP POST to /admin/ApplRequestProcessor
- Request body: XML-serialized OrderApproval
- Response content-type: text/xml
- Session ID embedded in JNLP file passed as cookie in requests

### Uncomitted Changes Detection

- RefreshAction iterates through OrdersApproveTableModel rows
- Checks column 4 (status) value against PENDING
- Any non-PENDING value indicates uncommitted change
- Dialog title and message retrieved from resource bundle

### Order Status UI Binding

- JComboBox cell editor with three options (not COMPLETED, as client cannot complete orders)
- setValueAt() called on TableSorter when combo box selection changes
- Immediate table repaint() triggered after status change
- No automatic persistence; changes only saved on commit

### Error Handling

- ApplRequestProcessor catches AdminBDException
- Returns XML error response with exception message
- Client should display error dialog to user

## Constraints and Assumptions

1. **Order Status Enumeration**: Exactly four statuses (PENDING, APPROVED, DENIED, COMPLETED); no custom statuses allowed
2. **Client Status Filtering**: Client combo box only offers APPROVED and DENIED (not PENDING or COMPLETED)
3. **Batch Atomicity**: All changes in single commit either all succeed or all rollback
4. **Uncommitted Loss Warning**: Only checks for status != PENDING; assumes all changes represent non-PENDING transitions
5. **Session Persistence**: JNLP embeds session ID; if session expires, subsequent requests fail with "Session Timed Out"
6. **XML Serialization**: OrderApproval must be parseable by ApplRequestProcessor.updateOrders() XML parsing logic
7. **No Partial Failure**: If one order fails, entire update fails (atomic transaction)

## Key Files

- **Client**: PetStoreAdminClient.java (main), OrdersApprovePanel.java, DataSource.java
- **Server**: ApplRequestProcessor.java, AdminRequestBD.java
- **Value Objects**: OrderApproval.java, ChangedOrder.java
- **Deployment**: admin.jnlp (generated JNLP template)

## Performance Considerations

- OrdersApprovePanel loads all orders into memory (no pagination)
- Each approve/deny click updates table model immediately (no network latency)
- Commit sends all changes in single request (efficient batch processing)
- Refresh loads all orders from server (potential bottleneck for large datasets)
- XML parsing in updateOrders() iterates through entire NodeList
