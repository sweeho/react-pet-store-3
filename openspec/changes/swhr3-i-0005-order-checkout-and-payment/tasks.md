## 1. Address Collection Forms

- [ ] 1.1 Create enter_order_information.jsp form with billing address section (SWHR3-T-0083)
- [ ] 1.2 Add billing address input fields: family name, given name, address 1, address 2, city, state, postal, country, phone, email (SWHR3-T-0083)
- [ ] 1.3 Add shipping address section to same form with duplicate field sets (SWHR3-T-0083)
- [ ] 1.4 Implement address field labels and form layout for usability (SWHR3-T-0083)
- [ ] 1.5 Add "Use Billing Address for Shipping" checkbox option (SWHR3-T-0083)
- [ ] 1.6 Add credit card fields to checkout form (SWHR3-T-0083)
- [ ] 1.7 Add form submission button and JavaScript form validation (SWHR3-T-0083)

## 2. Web-Tier Address Validation

- [x] 2.1 Create OrderHTMLAction.extractContactInfo() method (SWHR3-T-0084)
- [x] 2.2 Implement field extraction with configurable suffix for billing/shipping distinction (SWHR3-T-0084)
- [x] 2.3 Implement required field validation for all address fields except address_2 (SWHR3-T-0084)
- [x] 2.4 Collect missing field names in ArrayList for error display (SWHR3-T-0084)
- [x] 2.5 Throw MissingFormDataException with missing field list when validation fails (SWHR3-T-0084)
- [x] 2.6 Convert empty address_2 to null for optional field handling (SWHR3-T-0084)
- [x] 2.7 Return ContactInfo object with all extracted address fields (SWHR3-T-0084)

## 3. Credit Card Collection

- [ ] 3.1 Add credit card form fields to checkout page (card number, type, month, year) (SWHR3-T-0085)
- [ ] 3.2 Implement card type combo box with options: Java Card, Duke Express, Meow Card (SWHR3-T-0085)
- [ ] 3.3 Implement expiry month dropdown (01-12) (SWHR3-T-0085)
- [ ] 3.4 Implement expiry year dropdown with future years (SWHR3-T-0085)
- [ ] 3.5 Create CustomerHTMLAction.extractCreditCard() method (SWHR3-T-0085)
- [ ] 3.6 Extract credit card fields from request parameters (SWHR3-T-0085)
- [ ] 3.7 Validate credit card fields are non-empty (SWHR3-T-0085)
- [ ] 3.8 Concatenate month/year to MM/YYYY format (SWHR3-T-0085)
- [ ] 3.9 Create CreditCard value object with number, type, formatted expiry (SWHR3-T-0085)
- [ ] 3.10 Throw validation exception on missing required credit card fields (SWHR3-T-0085)

## 4. Order Creation Action

- [ ] 4.1 Create OrderHTMLAction.perform() method (SWHR3-T-0086)
- [ ] 4.2 Extract billing address via extractContactInfo(request, "\_a") (SWHR3-T-0086)
- [ ] 4.3 Extract shipping address via extractContactInfo(request, "\_b") (SWHR3-T-0086)
- [ ] 4.4 Extract credit card via extractCreditCard(request) (SWHR3-T-0086)
- [ ] 4.5 Handle address suffix parameter variation (SWHR3-T-0086)
- [ ] 4.6 Create OrderEvent with shipper, receiver, and credit card (SWHR3-T-0086)
- [ ] 4.7 Forward OrderEvent to EJB tier for processing (SWHR3-T-0086)
- [ ] 4.8 Implement error handling and form redisplay on validation failure (SWHR3-T-0086)

## 5. EJB Order Processing

- [ ] 5.1 Create OrderEJBAction for stateless order processing (SWHR3-T-0087)
- [ ] 5.2 Implement ejbCreate() with required transaction attributes (CMT Required) (SWHR3-T-0087)
- [ ] 5.3 Implement perform(OrderEvent) method (SWHR3-T-0087)
- [ ] 5.4 Retrieve shopping cart from customer session via ShoppingClientFacade (SWHR3-T-0087)
- [ ] 5.5 Validate cart is not empty (check items.size() > 0) (SWHR3-T-0087)
- [ ] 5.6 Throw ShoppingCartEmptyOrderException if cart validation fails (SWHR3-T-0087)
- [ ] 5.7 Retrieve customer ID from ShoppingClientFacade.getUserId() (SWHR3-T-0087)
- [ ] 5.8 Generate unique order ID via UniqueIdGenerator.getUniqueId("1001") (SWHR3-T-0087)
- [ ] 5.9 Create PurchaseOrder with order ID, current date, customer ID (SWHR3-T-0087)
- [ ] 5.10 Set billing and shipping ContactInfo from order event (SWHR3-T-0087)
- [ ] 5.11 Set credit card payment method (SWHR3-T-0087)
- [ ] 5.12 Persist order via entity bean home interface (SWHR3-T-0087)

## 6. Order ID Generation

- [ ] 6.1 Implement UniqueIdGenerator component (SWHR3-T-0088)
- [ ] 6.2 Implement getUniqueId(baseId) method (SWHR3-T-0088)
- [ ] 6.3 Generate unique identifiers without database collision (SWHR3-T-0088)
- [ ] 6.4 Initialize generator with base ID "1001" (SWHR3-T-0088)
- [ ] 6.5 Ensure thread-safe ID generation for concurrent checkout (SWHR3-T-0088)

## 7. Shopping Cart Validation

- [x] 7.1 Implement cart retrieval from customer session (SWHR3-T-0089)
- [x] 7.2 Implement getItems() method to retrieve line items from cart (SWHR3-T-0089)
- [x] 7.3 Implement cart.size() or items.size() check (SWHR3-T-0089)
- [x] 7.4 Create ShoppingCartEmptyOrderException class (SWHR3-T-0089)
- [x] 7.5 Implement exception throwing with descriptive error message (SWHR3-T-0089)
- [x] 7.6 Propagate exception to web tier for user display (SWHR3-T-0089)

## 8. Purchase Order Entity

- [x] 8.1 Create PurchaseOrder entity bean (stateless or stateful) (SWHR3-T-0090)
- [x] 8.2 Define PurchaseOrder fields: orderId, orderDate, userId, emailId, billTo, shipTo, creditCard (SWHR3-T-0090)
- [x] 8.3 Implement ejbCreate() lifecycle methods for entity (SWHR3-T-0090)
- [x] 8.4 Create PurchaseOrderHome interface for JNDI lookup (SWHR3-T-0090)
- [x] 8.5 Create PurchaseOrderLocal interface for local access (SWHR3-T-0090)
- [x] 8.6 Implement transaction support with CMT Required semantics (SWHR3-T-0090)
- [x] 8.7 Map entity bean to persistent storage (EJB ORM) (SWHR3-T-0090)

## 9. Contact Information Integration

- [x] 9.1 Create ContactInfo value object class (SWHR3-T-0091)
- [x] 9.2 Implement fields: familyName, givenName, address1, address2, city, stateOrProvince, postalCode, country, telephoneNumber, email (SWHR3-T-0091)
- [x] 9.3 Implement getters and setters for all fields (SWHR3-T-0091)
- [x] 9.4 Implement serialization support for EJB communication (SWHR3-T-0091)
- [x] 9.5 Integrate with existing contact info component API (SWHR3-T-0091)
- [x] 9.6 Support optional address2 field (nullable) (SWHR3-T-0091)

## 10. Credit Card Value Object

- [x] 10.1 Create CreditCard class (SWHR3-T-0092)
- [x] 10.2 Implement fields: cardNumber, cardType, expiryDate (SWHR3-T-0092)
- [x] 10.3 Implement constructor with three string parameters (SWHR3-T-0092)
- [x] 10.4 Implement getters for card fields (SWHR3-T-0092)
- [x] 10.5 Implement serialization support (SWHR3-T-0092)
- [x] 10.6 Validate card type enumeration (Java Card, Duke Express, Meow Card) (SWHR3-T-0092)

## 11. Form Validation Exceptions

- [x] 11.1 Create MissingFormDataException extends Exception (SWHR3-T-0093)
- [x] 11.2 Add missingFields ArrayList parameter to constructor (SWHR3-T-0093)
- [x] 11.3 Implement getMissingFields() accessor (SWHR3-T-0093)
- [x] 11.4 Create exception with message listing all missing fields (SWHR3-T-0093)
- [x] 11.5 Create ShoppingCartEmptyOrderException extends Exception (SWHR3-T-0093)
- [x] 11.6 Implement error message handling for user display (SWHR3-T-0093)

## 12. Order Confirmation

- [ ] 12.1 Create order_confirmation.jsp page (SWHR3-T-0094)
- [ ] 12.2 Display order ID and confirmation number (SWHR3-T-0094)
- [ ] 12.3 Display order date (SWHR3-T-0094)
- [ ] 12.4 Display billing address details (SWHR3-T-0094)
- [ ] 12.5 Display shipping address details (SWHR3-T-0094)
- [ ] 12.6 Display order line items with quantities and prices (SWHR3-T-0094)
- [ ] 12.7 Display order total and payment method (SWHR3-T-0094)
- [ ] 12.8 Add link to email address for order confirmation (SWHR3-T-0094)

## 13. Struts Configuration

- [ ] 13.1 Map order checkout action in struts-config.xml (SWHR3-T-0095)
- [ ] 13.2 Map OrderHTMLAction to order submission endpoint (SWHR3-T-0095)
- [ ] 13.3 Configure forward to confirmation screen on success (SWHR3-T-0095)
- [ ] 13.4 Configure forward to form on validation error (SWHR3-T-0095)
- [ ] 13.5 Map OrderEJBAction for order processing (SWHR3-T-0095)
- [ ] 13.6 Configure exception handler for MissingFormDataException (SWHR3-T-0095)
- [ ] 13.7 Configure exception handler for ShoppingCartEmptyOrderException (SWHR3-T-0095)

## 14. Integration Testing

- [ ] 14.1 Test complete checkout flow with valid addresses and payment (SWHR3-T-0096)
- [ ] 14.2 Test billing address required field validation (SWHR3-T-0096)
- [ ] 14.3 Test shipping address field validation (SWHR3-T-0096)
- [ ] 14.4 Test optional address_2 field handling (SWHR3-T-0096)
- [ ] 14.5 Test credit card field validation (SWHR3-T-0096)
- [ ] 14.6 Test empty cart checkout rejection (SWHR3-T-0096)
- [ ] 14.7 Test order ID uniqueness with concurrent checkouts (SWHR3-T-0096)
- [ ] 14.8 Test order persistence and retrieval (SWHR3-T-0096)
- [ ] 14.9 Test customer ID and email assignment to order (SWHR3-T-0096)
- [ ] 14.10 Test order confirmation page display (SWHR3-T-0096)

## 15. Error Handling and Recovery

- [ ] 15.1 Implement form redisplay on address validation failure (SWHR3-T-0097)
- [ ] 15.2 Implement error message display for missing fields (SWHR3-T-0097)
- [ ] 15.3 Implement cart validation error handling (SWHR3-T-0097)
- [ ] 15.4 Implement database error handling during order persistence (SWHR3-T-0097)
- [ ] 15.5 Implement exception logging for debugging (SWHR3-T-0097)
- [ ] 15.6 Implement user-friendly error messages (SWHR3-T-0097)
- [ ] 15.7 Implement session rollback on order creation failure (SWHR3-T-0097)

## 16. Security and Validation

- [ ] 16.1 Enforce customer authentication for checkout access (SWHR3-T-0098)
- [ ] 16.2 Validate customer session validity during checkout (SWHR3-T-0098)
- [ ] 16.3 Prevent unauthenticated order placement (SWHR3-T-0098)
- [ ] 16.4 Implement CSRF protection on checkout form (SWHR3-T-0098)
- [ ] 16.5 Validate credit card format before storage (SWHR3-T-0098)
- [ ] 16.6 Implement SSL/TLS for payment information transmission (SWHR3-T-0098)
- [ ] 16.7 Log all order creation events for audit trail (SWHR3-T-0098)
