## 1. Supplier Portal Authentication

- [ ] 1.1 Implement supplier administrator login mechanism (SWHR3-T-0128)
- [ ] 1.2 Add role-based access control for administrator role (SWHR3-T-0128)
- [ ] 1.3 Protect portal access via web.xml security-constraint (SWHR3-T-0128)
- [ ] 1.4 Implement session management for authenticated suppliers (SWHR3-T-0128)
- [ ] 1.5 Create login failure error handling (SWHR3-T-0128)
- [ ] 1.6 Implement logout functionality (SWHR3-T-0128)

## 2. Supplier Order Entity Bean

- [ ] 2.1 Create SupplierOrder CMP 2.x entity bean (SWHR3-T-0129)
- [ ] 2.2 Declare poId field as primary key (String) (SWHR3-T-0129)
- [ ] 2.3 Declare poDate field (long timestamp) (SWHR3-T-0129)
- [ ] 2.4 Declare poStatus field (String: pending, processing, completed) (SWHR3-T-0129)
- [ ] 2.5 Implement abstract getter/setter methods for all fields (SWHR3-T-0129)
- [ ] 2.6 Configure ejb-jar.xml with entity declaration and CMP configuration (SWHR3-T-0129)
- [ ] 2.7 Create SupplierOrderLocal interface (SWHR3-T-0129)
- [ ] 2.8 Create SupplierOrderLocalHome interface (SWHR3-T-0129)

## 3. Contact Information Entity

- [ ] 3.1 Create ContactInfo CMP 2.x entity bean (SWHR3-T-0130)
- [ ] 3.2 Declare givenName field (String) (SWHR3-T-0130)
- [ ] 3.3 Declare familyName field (String) (SWHR3-T-0130)
- [ ] 3.4 Declare email field (String) (SWHR3-T-0130)
- [ ] 3.5 Declare telephone field (String) (SWHR3-T-0130)
- [ ] 3.6 Implement abstract getter/setter methods (SWHR3-T-0130)
- [ ] 3.7 Create ContactInfoLocal interface (SWHR3-T-0130)
- [ ] 3.8 Create ContactInfoLocalHome interface (SWHR3-T-0130)

## 4. Address Entity Bean

- [ ] 4.1 Create Address CMP 2.x entity bean (SWHR3-T-0131)
- [ ] 4.2 Declare address line 1 field (String) (SWHR3-T-0131)
- [ ] 4.3 Declare address line 2 field (String, optional) (SWHR3-T-0131)
- [ ] 4.4 Declare city field (String) (SWHR3-T-0131)
- [ ] 4.5 Declare state/province field (String) (SWHR3-T-0131)
- [ ] 4.6 Declare postal code field (String) (SWHR3-T-0131)
- [ ] 4.7 Declare country field (String) (SWHR3-T-0131)
- [ ] 4.8 Implement abstract getter/setter methods (SWHR3-T-0131)
- [ ] 4.9 Create AddressLocal interface (SWHR3-T-0131)
- [ ] 4.10 Create AddressLocalHome interface (SWHR3-T-0131)

## 5. EJB Relationships

- [ ] 5.1 Define one-to-one relationship between SupplierOrder and ContactInfo (SWHR3-T-0132)
- [ ] 5.2 Define cascade delete for SupplierOrder-ContactInfo relationship (SWHR3-T-0132)
- [ ] 5.3 Define one-to-one relationship between ContactInfo and Address (SWHR3-T-0132)
- [ ] 5.4 Define cascade delete for ContactInfo-Address relationship (SWHR3-T-0132)
- [ ] 5.5 Declare relationship role names in ejb-jar.xml (SWHR3-T-0132)
- [ ] 5.6 Configure CMR fields for bidirectional access (SWHR3-T-0132)

## 6. Inventory Management

- [ ] 6.1 Create InventoryLocal interface for inventory access (SWHR3-T-0133)
- [ ] 6.2 Implement findByPrimaryKey(itemId) for item retrieval (SWHR3-T-0133)
- [ ] 6.3 Implement getQuantity() method for inventory levels (SWHR3-T-0133)
- [ ] 6.4 Implement updateQuantity(itemId, newQuantity) for updates (SWHR3-T-0133)
- [ ] 6.5 Create DisplayInventoryBean for inventory display (SWHR3-T-0133)
- [ ] 6.6 Implement getInventory() method returning all items (SWHR3-T-0133)
- [ ] 6.7 Support real-time quantity lookup (SWHR3-T-0133)
- [ ] 6.8 Test inventory retrieval and updates (SWHR3-T-0133)

## 7. Request Processing Servlet

- [ ] 7.1 Create RcvrRequestProcessor servlet (SWHR3-T-0134)
- [ ] 7.2 Implement doGet() for initial request handling (SWHR3-T-0134)
- [ ] 7.3 Implement doPost() for form submissions (SWHR3-T-0134)
- [ ] 7.4 Add authentication check via isUserInRole("administrator") (SWHR3-T-0134)
- [ ] 7.5 Parse currentScreen request parameter (SWHR3-T-0134)
- [ ] 7.6 Route "displayinventory" to JSP forward (SWHR3-T-0134)
- [ ] 7.7 Route "updateinventory" to inventory update handler (SWHR3-T-0134)
- [ ] 7.8 Implement exception handling for request processing (SWHR3-T-0134)

## 8. Inventory Display Handler

- [ ] 8.1 Implement inventory display request handling in RcvrRequestProcessor (SWHR3-T-0135)
- [ ] 8.2 Check currentScreen equals "displayinventory" (SWHR3-T-0135)
- [ ] 8.3 Retrieve DisplayInventoryBean (SWHR3-T-0135)
- [ ] 8.4 Call getInventory() to fetch all items (SWHR3-T-0135)
- [ ] 8.5 Store inventory data in request for JSP display (SWHR3-T-0135)
- [ ] 8.6 Forward to displayinventory.jsp (SWHR3-T-0135)
- [ ] 8.7 Test inventory display page rendering (SWHR3-T-0135)

## 9. Inventory Update Handler

- [ ] 9.1 Implement updateinventory screen handling (SWHR3-T-0136)
- [ ] 9.2 Check currentScreen equals "updateinventory" (SWHR3-T-0136)
- [ ] 9.3 Begin container-managed transaction (SWHR3-T-0136)
- [ ] 9.4 Implement updateInventory() to parse form parameters (SWHR3-T-0136)
- [ ] 9.5 Extract qty_itemId parameters for quantities (SWHR3-T-0136)
- [ ] 9.6 Extract item_itemId checkbox parameters for selection (SWHR3-T-0136)
- [ ] 9.7 Update inventory quantities via InventoryLocal (SWHR3-T-0136)
- [ ] 9.8 Call processPendingPO() for order reprocessing (SWHR3-T-0136)
- [ ] 9.9 Commit transaction (SWHR3-T-0136)
- [ ] 9.10 Test inventory update workflow (SWHR3-T-0136)

## 10. Pending Order Reprocessing

- [ ] 10.1 Implement processPendingPO() in RcvrRequestProcessor (SWHR3-T-0137)
- [ ] 10.2 Query for all SupplierOrder with status "pending" (SWHR3-T-0137)
- [ ] 10.3 For each pending order, attempt fulfillment based on new inventory (SWHR3-T-0137)
- [ ] 10.4 Update order status to "processing" when item quantity sufficient (SWHR3-T-0137)
- [ ] 10.5 Update order status to "completed" when fully fulfilled (SWHR3-T-0137)
- [ ] 10.6 Trigger invoice generation for completed orders (SWHR3-T-0137)
- [ ] 10.7 Handle fulfillment failures gracefully (SWHR3-T-0137)
- [ ] 10.8 Log reprocessing attempts (SWHR3-T-0137)

## 11. Invoice Generation

- [ ] 11.1 Create invoice generation system (SWHR3-T-0138)
- [ ] 11.2 Trigger invoice on order status change to "completed" (SWHR3-T-0138)
- [ ] 11.3 Include order details in invoice (order ID, items, quantities) (SWHR3-T-0138)
- [ ] 11.4 Include supplier/receiver contact information (SWHR3-T-0138)
- [ ] 11.5 Calculate totals (quantity × unit price per line) (SWHR3-T-0138)
- [ ] 11.6 Store generated invoices (SWHR3-T-0138)
- [ ] 11.7 Handle invoice generation errors (SWHR3-T-0138)

## 12. Supplier Order Creation

- [ ] 12.1 Implement SupplierOrder creation via ejbCreate() (SWHR3-T-0139)
- [ ] 12.2 Generate unique poId (purchase order identifier) (SWHR3-T-0139)
- [ ] 12.3 Set poDate to current timestamp (SWHR3-T-0139)
- [ ] 12.4 Initialize poStatus to "pending" (SWHR3-T-0139)
- [ ] 12.5 Create associated ContactInfo in ejbPostCreate() (SWHR3-T-0139)
- [ ] 12.6 Create associated Address for shipping (SWHR3-T-0139)
- [ ] 12.7 Establish CMR relationships to ContactInfo (SWHR3-T-0139)
- [ ] 12.8 Support cascading delete on order removal (SWHR3-T-0139)

## 13. Inventory Display View

- [ ] 13.1 Create displayinventory.jsp page (SWHR3-T-0140)
- [ ] 13.2 Add authentication check for administrator role (SWHR3-T-0140)
- [ ] 13.3 Render inventory table with itemId column (SWHR3-T-0140)
- [ ] 13.4 Display current quantity for each item (SWHR3-T-0140)
- [ ] 13.5 Create form with input fields for new quantities (SWHR3-T-0140)
- [ ] 13.6 Name quantity input fields as qty_itemId pattern (SWHR3-T-0140)
- [ ] 13.7 Add checkboxes to mark items for update (item_itemId) (SWHR3-T-0140)
- [ ] 13.8 Implement "Update Inventory" submit button (SWHR3-T-0140)
- [ ] 13.9 Display empty inventory message when no items exist (SWHR3-T-0140)
- [ ] 13.10 Apply petstore styling to inventory display (SWHR3-T-0140)

## 14. Form Submission Handler

- [ ] 14.1 Configure form action to post to RcvrRequestProcessor (SWHR3-T-0141)
- [ ] 14.2 Add currentScreen=updateinventory hidden parameter (SWHR3-T-0141)
- [ ] 14.3 Implement quantity parameter parsing (SWHR3-T-0141)
- [ ] 14.4 Parse checkbox selections via item_itemId pattern (SWHR3-T-0141)
- [ ] 14.5 Handle non-numeric quantity input gracefully (SWHR3-T-0141)
- [ ] 14.6 Validate quantity values are positive (SWHR3-T-0141)
- [ ] 14.7 Display success message after update (SWHR3-T-0141)
- [ ] 14.8 Display error message on update failure (SWHR3-T-0141)

## 15. Transaction Management

- [ ] 15.1 Configure container-managed transactions for entity beans (SWHR3-T-0142)
- [ ] 15.2 Set transaction attribute to Required for SupplierOrder operations (SWHR3-T-0142)
- [ ] 15.3 Set transaction attribute to Required for inventory updates (SWHR3-T-0142)
- [ ] 15.4 Implement transaction boundaries in RcvrRequestProcessor (SWHR3-T-0142)
- [ ] 15.5 Ensure inventory update + order reprocessing within single transaction (SWHR3-T-0142)
- [ ] 15.6 Test transactional consistency with rollback scenarios (SWHR3-T-0142)

## 16. Error Handling and Logging

- [ ] 16.1 Implement inventory lookup error handling (SWHR3-T-0143)
- [ ] 16.2 Implement order processing error handling (SWHR3-T-0143)
- [ ] 16.3 Log all supplier portal activities (SWHR3-T-0143)
- [ ] 16.4 Log inventory update events with before/after values (SWHR3-T-0143)
- [ ] 16.5 Log order reprocessing attempts and results (SWHR3-T-0143)
- [ ] 16.6 Display user-friendly error messages for failures (SWHR3-T-0143)
- [ ] 16.7 Implement exception recovery for partial failures (SWHR3-T-0143)

## 17. Supplier Portal Configuration

- [ ] 17.1 Configure web.xml security-constraint for supplier portal (SWHR3-T-0144)
- [ ] 17.2 Restrict access to administrator role (SWHR3-T-0144)
- [ ] 17.3 Map RcvrRequestProcessor servlet URL pattern (SWHR3-T-0144)
- [ ] 17.4 Configure struts-config.xml for form actions (SWHR3-T-0144)
- [ ] 17.5 Define form bean for inventory display (SWHR3-T-0144)
- [ ] 17.6 Map JSP forwards for screen navigation (SWHR3-T-0144)
- [ ] 17.7 Configure exception handlers for portal errors (SWHR3-T-0144)

## 18. Testing and Validation

- [ ] 18.1 Test supplier authentication and session management (SWHR3-T-0145)
- [ ] 18.2 Test inventory display for authorized users (SWHR3-T-0145)
- [ ] 18.3 Test inventory update with valid quantities (SWHR3-T-0145)
- [ ] 18.4 Test inventory update with invalid input (SWHR3-T-0145)
- [ ] 18.5 Test pending order reprocessing after inventory update (SWHR3-T-0145)
- [ ] 18.6 Test invoice generation for completed orders (SWHR3-T-0145)
- [ ] 18.7 Test transaction rollback on update failure (SWHR3-T-0145)
- [ ] 18.8 Test concurrent inventory updates (SWHR3-T-0145)
- [ ] 18.9 Test supplier portal with multiple administrators (SWHR3-T-0145)
- [ ] 18.10 Verify role-based access control enforcement (SWHR3-T-0145)
