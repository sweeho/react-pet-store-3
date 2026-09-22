## 1. Address Collection Forms

- [ ] 1.1 Create enter_order_information.jsp form with billing address section
- [ ] 1.2 Add billing address input fields: family name, given name, address 1, address 2, city, state, postal, country, phone, email
- [ ] 1.3 Add shipping address section to same form with duplicate field sets
- [ ] 1.4 Implement address field labels and form layout for usability
- [ ] 1.5 Add "Use Billing Address for Shipping" checkbox option
- [ ] 1.6 Add credit card fields to checkout form
- [ ] 1.7 Add form submission button and JavaScript form validation

## 2. Web-Tier Address Validation

- [ ] 2.1 Create OrderHTMLAction.extractContactInfo() method
- [ ] 2.2 Implement field extraction with configurable suffix for billing/shipping distinction
- [ ] 2.3 Implement required field validation for all address fields except address_2
- [ ] 2.4 Collect missing field names in ArrayList for error display
- [ ] 2.5 Throw MissingFormDataException with missing field list when validation fails
- [ ] 2.6 Convert empty address_2 to null for optional field handling
- [ ] 2.7 Return ContactInfo object with all extracted address fields

## 3. Credit Card Collection

- [ ] 3.1 Add credit card form fields to checkout page (card number, type, month, year)
- [ ] 3.2 Implement card type combo box with options: Java Card, Duke Express, Meow Card
- [ ] 3.3 Implement expiry month dropdown (01-12)
- [ ] 3.4 Implement expiry year dropdown with future years
- [ ] 3.5 Create CustomerHTMLAction.extractCreditCard() method
- [ ] 3.6 Extract credit card fields from request parameters
- [ ] 3.7 Validate credit card fields are non-empty
- [ ] 3.8 Concatenate month/year to MM/YYYY format
- [ ] 3.9 Create CreditCard value object with number, type, formatted expiry
- [ ] 3.10 Throw validation exception on missing required credit card fields

## 4. Order Creation Action

- [ ] 4.1 Create OrderHTMLAction.perform() method
- [ ] 4.2 Extract billing address via extractContactInfo(request, "\_a")
- [ ] 4.3 Extract shipping address via extractContactInfo(request, "\_b")
- [ ] 4.4 Extract credit card via extractCreditCard(request)
- [ ] 4.5 Handle address suffix parameter variation
- [ ] 4.6 Create OrderEvent with shipper, receiver, and credit card
- [ ] 4.7 Forward OrderEvent to EJB tier for processing
- [ ] 4.8 Implement error handling and form redisplay on validation failure

## 5. EJB Order Processing

- [ ] 5.1 Create OrderEJBAction for stateless order processing
- [ ] 5.2 Implement ejbCreate() with required transaction attributes (CMT Required)
- [ ] 5.3 Implement perform(OrderEvent) method
- [ ] 5.4 Retrieve shopping cart from customer session via ShoppingClientFacade
- [ ] 5.5 Validate cart is not empty (check items.size() > 0)
- [ ] 5.6 Throw ShoppingCartEmptyOrderException if cart validation fails
- [ ] 5.7 Retrieve customer ID from ShoppingClientFacade.getUserId()
- [ ] 5.8 Generate unique order ID via UniqueIdGenerator.getUniqueId("1001")
- [ ] 5.9 Create PurchaseOrder with order ID, current date, customer ID
- [ ] 5.10 Set billing and shipping ContactInfo from order event
- [ ] 5.11 Set credit card payment method
- [ ] 5.12 Persist order via entity bean home interface

## 6. Order ID Generation

- [ ] 6.1 Implement UniqueIdGenerator component
- [ ] 6.2 Implement getUniqueId(baseId) method
- [ ] 6.3 Generate unique identifiers without database collision
- [ ] 6.4 Initialize generator with base ID "1001"
- [ ] 6.5 Ensure thread-safe ID generation for concurrent checkout

## 7. Shopping Cart Validation

- [ ] 7.1 Implement cart retrieval from customer session
- [ ] 7.2 Implement getItems() method to retrieve line items from cart
- [ ] 7.3 Implement cart.size() or items.size() check
- [ ] 7.4 Create ShoppingCartEmptyOrderException class
- [ ] 7.5 Implement exception throwing with descriptive error message
- [ ] 7.6 Propagate exception to web tier for user display

## 8. Purchase Order Entity

- [ ] 8.1 Create PurchaseOrder entity bean (stateless or stateful)
- [ ] 8.2 Define PurchaseOrder fields: orderId, orderDate, userId, emailId, billTo, shipTo, creditCard
- [ ] 8.3 Implement ejbCreate() lifecycle methods for entity
- [ ] 8.4 Create PurchaseOrderHome interface for JNDI lookup
- [ ] 8.5 Create PurchaseOrderLocal interface for local access
- [ ] 8.6 Implement transaction support with CMT Required semantics
- [ ] 8.7 Map entity bean to persistent storage (EJB ORM)

## 9. Contact Information Integration

- [ ] 9.1 Create ContactInfo value object class
- [ ] 9.2 Implement fields: familyName, givenName, address1, address2, city, stateOrProvince, postalCode, country, telephoneNumber, email
- [ ] 9.3 Implement getters and setters for all fields
- [ ] 9.4 Implement serialization support for EJB communication
- [ ] 9.5 Integrate with existing contact info component API
- [ ] 9.6 Support optional address2 field (nullable)

## 10. Credit Card Value Object

- [ ] 10.1 Create CreditCard class
- [ ] 10.2 Implement fields: cardNumber, cardType, expiryDate
- [ ] 10.3 Implement constructor with three string parameters
- [ ] 10.4 Implement getters for card fields
- [ ] 10.5 Implement serialization support
- [ ] 10.6 Validate card type enumeration (Java Card, Duke Express, Meow Card)

## 11. Form Validation Exceptions

- [ ] 11.1 Create MissingFormDataException extends Exception
- [ ] 11.2 Add missingFields ArrayList parameter to constructor
- [ ] 11.3 Implement getMissingFields() accessor
- [ ] 11.4 Create exception with message listing all missing fields
- [ ] 11.5 Create ShoppingCartEmptyOrderException extends Exception
- [ ] 11.6 Implement error message handling for user display

## 12. Order Confirmation

- [ ] 12.1 Create order_confirmation.jsp page
- [ ] 12.2 Display order ID and confirmation number
- [ ] 12.3 Display order date
- [ ] 12.4 Display billing address details
- [ ] 12.5 Display shipping address details
- [ ] 12.6 Display order line items with quantities and prices
- [ ] 12.7 Display order total and payment method
- [ ] 12.8 Add link to email address for order confirmation

## 13. Struts Configuration

- [ ] 13.1 Map order checkout action in struts-config.xml
- [ ] 13.2 Map OrderHTMLAction to order submission endpoint
- [ ] 13.3 Configure forward to confirmation screen on success
- [ ] 13.4 Configure forward to form on validation error
- [ ] 13.5 Map OrderEJBAction for order processing
- [ ] 13.6 Configure exception handler for MissingFormDataException
- [ ] 13.7 Configure exception handler for ShoppingCartEmptyOrderException

## 14. Integration Testing

- [ ] 14.1 Test complete checkout flow with valid addresses and payment
- [ ] 14.2 Test billing address required field validation
- [ ] 14.3 Test shipping address field validation
- [ ] 14.4 Test optional address_2 field handling
- [ ] 14.5 Test credit card field validation
- [ ] 14.6 Test empty cart checkout rejection
- [ ] 14.7 Test order ID uniqueness with concurrent checkouts
- [ ] 14.8 Test order persistence and retrieval
- [ ] 14.9 Test customer ID and email assignment to order
- [ ] 14.10 Test order confirmation page display

## 15. Error Handling and Recovery

- [ ] 15.1 Implement form redisplay on address validation failure
- [ ] 15.2 Implement error message display for missing fields
- [ ] 15.3 Implement cart validation error handling
- [ ] 15.4 Implement database error handling during order persistence
- [ ] 15.5 Implement exception logging for debugging
- [ ] 15.6 Implement user-friendly error messages
- [ ] 15.7 Implement session rollback on order creation failure

## 16. Security and Validation

- [ ] 16.1 Enforce customer authentication for checkout access
- [ ] 16.2 Validate customer session validity during checkout
- [ ] 16.3 Prevent unauthenticated order placement
- [ ] 16.4 Implement CSRF protection on checkout form
- [ ] 16.5 Validate credit card format before storage
- [ ] 16.6 Implement SSL/TLS for payment information transmission
- [ ] 16.7 Log all order creation events for audit trail
