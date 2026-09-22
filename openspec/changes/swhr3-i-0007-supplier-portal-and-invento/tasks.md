## 1. Supplier Portal Authentication

- [ ] 1.1 Implement supplier administrator login mechanism
- [ ] 1.2 Add role-based access control for administrator role
- [ ] 1.3 Protect portal access via web.xml security-constraint
- [ ] 1.4 Implement session management for authenticated suppliers
- [ ] 1.5 Create login failure error handling
- [ ] 1.6 Implement logout functionality

## 2. Supplier Order Entity Bean

- [ ] 2.1 Create SupplierOrder CMP 2.x entity bean
- [ ] 2.2 Declare poId field as primary key (String)
- [ ] 2.3 Declare poDate field (long timestamp)
- [ ] 2.4 Declare poStatus field (String: pending, processing, completed)
- [ ] 2.5 Implement abstract getter/setter methods for all fields
- [ ] 2.6 Configure ejb-jar.xml with entity declaration and CMP configuration
- [ ] 2.7 Create SupplierOrderLocal interface
- [ ] 2.8 Create SupplierOrderLocalHome interface

## 3. Contact Information Entity

- [ ] 3.1 Create ContactInfo CMP 2.x entity bean
- [ ] 3.2 Declare givenName field (String)
- [ ] 3.3 Declare familyName field (String)
- [ ] 3.4 Declare email field (String)
- [ ] 3.5 Declare telephone field (String)
- [ ] 3.6 Implement abstract getter/setter methods
- [ ] 3.7 Create ContactInfoLocal interface
- [ ] 3.8 Create ContactInfoLocalHome interface

## 4. Address Entity Bean

- [ ] 4.1 Create Address CMP 2.x entity bean
- [ ] 4.2 Declare address line 1 field (String)
- [ ] 4.3 Declare address line 2 field (String, optional)
- [ ] 4.4 Declare city field (String)
- [ ] 4.5 Declare state/province field (String)
- [ ] 4.6 Declare postal code field (String)
- [ ] 4.7 Declare country field (String)
- [ ] 4.8 Implement abstract getter/setter methods
- [ ] 4.9 Create AddressLocal interface
- [ ] 4.10 Create AddressLocalHome interface

## 5. EJB Relationships

- [ ] 5.1 Define one-to-one relationship between SupplierOrder and ContactInfo
- [ ] 5.2 Define cascade delete for SupplierOrder-ContactInfo relationship
- [ ] 5.3 Define one-to-one relationship between ContactInfo and Address
- [ ] 5.4 Define cascade delete for ContactInfo-Address relationship
- [ ] 5.5 Declare relationship role names in ejb-jar.xml
- [ ] 5.6 Configure CMR fields for bidirectional access

## 6. Inventory Management

- [ ] 6.1 Create InventoryLocal interface for inventory access
- [ ] 6.2 Implement findByPrimaryKey(itemId) for item retrieval
- [ ] 6.3 Implement getQuantity() method for inventory levels
- [ ] 6.4 Implement updateQuantity(itemId, newQuantity) for updates
- [ ] 6.5 Create DisplayInventoryBean for inventory display
- [ ] 6.6 Implement getInventory() method returning all items
- [ ] 6.7 Support real-time quantity lookup
- [ ] 6.8 Test inventory retrieval and updates

## 7. Request Processing Servlet

- [ ] 7.1 Create RcvrRequestProcessor servlet
- [ ] 7.2 Implement doGet() for initial request handling
- [ ] 7.3 Implement doPost() for form submissions
- [ ] 7.4 Add authentication check via isUserInRole("administrator")
- [ ] 7.5 Parse currentScreen request parameter
- [ ] 7.6 Route "displayinventory" to JSP forward
- [ ] 7.7 Route "updateinventory" to inventory update handler
- [ ] 7.8 Implement exception handling for request processing

## 8. Inventory Display Handler

- [ ] 8.1 Implement inventory display request handling in RcvrRequestProcessor
- [ ] 8.2 Check currentScreen equals "displayinventory"
- [ ] 8.3 Retrieve DisplayInventoryBean
- [ ] 8.4 Call getInventory() to fetch all items
- [ ] 8.5 Store inventory data in request for JSP display
- [ ] 8.6 Forward to displayinventory.jsp
- [ ] 8.7 Test inventory display page rendering

## 9. Inventory Update Handler

- [ ] 9.1 Implement updateinventory screen handling
- [ ] 9.2 Check currentScreen equals "updateinventory"
- [ ] 9.3 Begin container-managed transaction
- [ ] 9.4 Implement updateInventory() to parse form parameters
- [ ] 9.5 Extract qty_itemId parameters for quantities
- [ ] 9.6 Extract item_itemId checkbox parameters for selection
- [ ] 9.7 Update inventory quantities via InventoryLocal
- [ ] 9.8 Call processPendingPO() for order reprocessing
- [ ] 9.9 Commit transaction
- [ ] 9.10 Test inventory update workflow

## 10. Pending Order Reprocessing

- [ ] 10.1 Implement processPendingPO() in RcvrRequestProcessor
- [ ] 10.2 Query for all SupplierOrder with status "pending"
- [ ] 10.3 For each pending order, attempt fulfillment based on new inventory
- [ ] 10.4 Update order status to "processing" when item quantity sufficient
- [ ] 10.5 Update order status to "completed" when fully fulfilled
- [ ] 10.6 Trigger invoice generation for completed orders
- [ ] 10.7 Handle fulfillment failures gracefully
- [ ] 10.8 Log reprocessing attempts

## 11. Invoice Generation

- [ ] 11.1 Create invoice generation system
- [ ] 11.2 Trigger invoice on order status change to "completed"
- [ ] 11.3 Include order details in invoice (order ID, items, quantities)
- [ ] 11.4 Include supplier/receiver contact information
- [ ] 11.5 Calculate totals (quantity × unit price per line)
- [ ] 11.6 Store generated invoices
- [ ] 11.7 Handle invoice generation errors

## 12. Supplier Order Creation

- [ ] 12.1 Implement SupplierOrder creation via ejbCreate()
- [ ] 12.2 Generate unique poId (purchase order identifier)
- [ ] 12.3 Set poDate to current timestamp
- [ ] 12.4 Initialize poStatus to "pending"
- [ ] 12.5 Create associated ContactInfo in ejbPostCreate()
- [ ] 12.6 Create associated Address for shipping
- [ ] 12.7 Establish CMR relationships to ContactInfo
- [ ] 12.8 Support cascading delete on order removal

## 13. Inventory Display View

- [ ] 13.1 Create displayinventory.jsp page
- [ ] 13.2 Add authentication check for administrator role
- [ ] 13.3 Render inventory table with itemId column
- [ ] 13.4 Display current quantity for each item
- [ ] 13.5 Create form with input fields for new quantities
- [ ] 13.6 Name quantity input fields as qty_itemId pattern
- [ ] 13.7 Add checkboxes to mark items for update (item_itemId)
- [ ] 13.8 Implement "Update Inventory" submit button
- [ ] 13.9 Display empty inventory message when no items exist
- [ ] 13.10 Apply petstore styling to inventory display

## 14. Form Submission Handler

- [ ] 14.1 Configure form action to post to RcvrRequestProcessor
- [ ] 14.2 Add currentScreen=updateinventory hidden parameter
- [ ] 14.3 Implement quantity parameter parsing
- [ ] 14.4 Parse checkbox selections via item_itemId pattern
- [ ] 14.5 Handle non-numeric quantity input gracefully
- [ ] 14.6 Validate quantity values are positive
- [ ] 14.7 Display success message after update
- [ ] 14.8 Display error message on update failure

## 15. Transaction Management

- [ ] 15.1 Configure container-managed transactions for entity beans
- [ ] 15.2 Set transaction attribute to Required for SupplierOrder operations
- [ ] 15.3 Set transaction attribute to Required for inventory updates
- [ ] 15.4 Implement transaction boundaries in RcvrRequestProcessor
- [ ] 15.5 Ensure inventory update + order reprocessing within single transaction
- [ ] 15.6 Test transactional consistency with rollback scenarios

## 16. Error Handling and Logging

- [ ] 16.1 Implement inventory lookup error handling
- [ ] 16.2 Implement order processing error handling
- [ ] 16.3 Log all supplier portal activities
- [ ] 16.4 Log inventory update events with before/after values
- [ ] 16.5 Log order reprocessing attempts and results
- [ ] 16.6 Display user-friendly error messages for failures
- [ ] 16.7 Implement exception recovery for partial failures

## 17. Supplier Portal Configuration

- [ ] 17.1 Configure web.xml security-constraint for supplier portal
- [ ] 17.2 Restrict access to administrator role
- [ ] 17.3 Map RcvrRequestProcessor servlet URL pattern
- [ ] 17.4 Configure struts-config.xml for form actions
- [ ] 17.5 Define form bean for inventory display
- [ ] 17.6 Map JSP forwards for screen navigation
- [ ] 17.7 Configure exception handlers for portal errors

## 18. Testing and Validation

- [ ] 18.1 Test supplier authentication and session management
- [ ] 18.2 Test inventory display for authorized users
- [ ] 18.3 Test inventory update with valid quantities
- [ ] 18.4 Test inventory update with invalid input
- [ ] 18.5 Test pending order reprocessing after inventory update
- [ ] 18.6 Test invoice generation for completed orders
- [ ] 18.7 Test transaction rollback on update failure
- [ ] 18.8 Test concurrent inventory updates
- [ ] 18.9 Test supplier portal with multiple administrators
- [ ] 18.10 Verify role-based access control enforcement
