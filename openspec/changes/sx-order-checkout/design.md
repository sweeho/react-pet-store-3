# Order Checkout Design

## User interface

The order-checkout capability provides checkout forms for customers to enter billing and shipping addresses, select payment method, and review their order. Forms are implemented as JSP pages accessed through the enter_order_information screen.

## Architecture Overview

Order checkout is implemented as a web-tier form collection layer with EJB-tier order processing:

1. **Web Tier**: Struts actions (OrderHTMLAction, CustomerHTMLAction) validate form data and route to EJB tier
2. **EJB Tier**: OrderEJBAction processes validated data, creates purchase order, integrates with shopping cart
3. **Integration Tier**: ContactInfo and Address components handle address persistence and validation
4. **Business Objects**: Order, PurchaseOrder, ContactInfo, CreditCard value objects manage checkout data

### Checkout Workflow

1. Customer views cart and initiates checkout via "Place Order" action
2. Web tier displays enter_order_information screen with billing address form
3. Customer enters billing address (family name, given name, address 1, address 2 optional, city, state, postal code, country, telephone, email)
4. Customer enters shipping address with same fields (can be same as billing)
5. Customer enters credit card payment information (card number, type, expiry month/year)
6. OrderHTMLAction.perform() validates all required fields
7. OrderEvent created with shipper (billing), receiver (shipping), and credit card
8. OrderEJBAction processes event:
   - Retrieves shopping cart from customer session
   - Validates cart is not empty
   - Generates unique order ID via UniqueIdGenerator
   - Sets order date to current system date
   - Creates PurchaseOrder with customer ID, email, addresses, and payment method
   - Persists order via EJB entity bean
9. System displays order confirmation screen with order details

### Form Field Requirements

**Address Fields (Billing and Shipping)**:

- Family Name (required)
- Given Name (required)
- Street Address Line 1 (required)
- Street Address Line 2 (optional)
- City (required)
- State/Province (required)
- Postal Code (required)
- Country (required)
- Telephone Number (required)
- Email Address (required)

**Credit Card Fields**:

- Card Number (required)
- Card Type (required) - options: Java Card, Duke Express, Meow Card
- Expiry Month (required) - dropdown 01-12
- Expiry Year (required) - dropdown of valid future years

### Data Model

**PurchaseOrder Entity**:

- OrderId (unique identifier, generated)
- OrderDate (set to current system date)
- UserId (from authenticated customer session)
- EmailId (from billing address email field)
- BillTo (ContactInfo for billing address)
- ShipTo (ContactInfo for shipping address)
- CreditCard (payment method)
- OrderLineItems (from shopping cart)
- OrderStatus (PENDING initially)

**ContactInfo Value Object**:

- FamilyName, GivenName, Address1, Address2, City, StateOrProvince, PostalCode, Country, TelephoneNumber, Email
- Used for both billing and shipping addresses
- Validated independently with identical rules

**CreditCard Value Object**:

- CardNumber (string)
- CardType (enumerated: Java Card, Duke Express, Meow Card)
- ExpiryDate (MM/YYYY format, derived from separate month/year fields)

### Struts Actions

**OrderHTMLAction**:

- perform(HttpServletRequest) called on form submission
- extractContactInfo(request, suffix) validates address fields
- Handles suffixes: "\_a" for billing, "\_b" for shipping
- Throws MissingFormDataException if required fields missing
- Creates OrderEvent with billing, shipping, and credit card data

**CustomerHTMLAction**:

- extractCreditCard(request) validates payment information
- Parses card number, type, expiry month/year from request parameters
- Creates CreditCard value object
- Combines month and year into MM/YYYY expiry format

**OrderEJBAction**:

- Receives OrderEvent from web tier
- Retrieves shopping cart from customer session via ShoppingClientFacade
- Validates cart contains items (throws ShoppingCartEmptyOrderException if empty)
- Generates unique order ID via UniqueIdGenerator.getUniqueId("1001")
- Creates PurchaseOrder with order ID, current date, customer ID, email
- Persists order via EJB entity bean
- Returns order confirmation

### Error Handling

**MissingFormDataException**:

- Thrown when required address fields are empty after trimming
- Collects list of missing field names and displays validation errors
- User returns to form to correct data

**ShoppingCartEmptyOrderException**:

- Thrown if cart contains no items when order is submitted
- Prevents creation of empty orders
- Directs user back to shopping cart

**Form Validation**:

- All address fields except "address_2" are required
- Email field is optional in address extraction but required via form
- Credit card fields are all required
- Expiry date components parsed and validated as integers
- Address suffix pattern allows reuse of validation logic for billing/shipping

### Session and State Management

- Shopping cart maintained in customer session via ShoppingClientFacade
- Customer ID available from authenticated session principal
- Email address persisted in order for confirmation notifications
- Order creation is transactional at EJB level (CMT with Required semantics)

## Legacy Implementation Notes

### Form Processing

- Form submission to order action endpoint (Struts mapping)
- Request parameters parsed with suffixes for billing/shipping distinction
- Missing field validation performed before creating order object
- Addresses extracted as ContactInfo objects with field copying

### Credit Card Handling

- Card information passed as hardcoded values in some code paths (legacy placeholder)
- Expiry month and year provided as separate dropdowns in JSP forms
- Concatenated to MM/YYYY format before storing
- Card type is enumerated selection from combo box (Java Card, Duke Express, Meow Card)

### Order ID Generation

- UniqueIdGenerator pattern used to create unique order identifiers
- Generator seeded with base ID "1001"
- Ensures no order ID collisions in database

### Address Component Integration

- ContactInfo retrieved from address component API
- Address persistence handled by separate address management subsystem
- Address components provide shared validation and storage

## Constraints and Assumptions

1. **Required Fields**: All address fields except address line 2 are mandatory
2. **Address Suffixes**: Billing address uses "\_a" suffix, shipping uses "\_b" suffix for form parameters
3. **Email Requirement**: Email in checkout form is required and used for order confirmation
4. **Credit Card Format**: Expiry date stored as MM/YYYY string (e.g., "03/2025")
5. **Card Types**: Only three card types supported (Java Card, Duke Express, Meow Card)
6. **Order ID Uniqueness**: UniqueIdGenerator guarantees unique IDs without database collision
7. **Cart Requirement**: Empty cart validation prevents order creation with no line items
8. **Session Scope**: Checkout assumes customer is authenticated with valid session
9. **Transaction Semantics**: Order creation is atomic (all or nothing at EJB level)
10. **Field Trimming**: All string fields trimmed to remove whitespace before validation

## Key Files

- **Web Actions**: OrderHTMLAction.java, CustomerHTMLAction.java
- **EJB Actions**: OrderEJBAction.java
- **Business Objects**: Order.java, PurchaseOrder.java, ContactInfo.java, CreditCard.java
- **JSP Forms**: enter_order_information.jsp, order_confirmation.jsp
- **Configuration**: struts-config.xml (action mappings)
- **Screen Definitions**: screendefinitions_en_US.xml (enter_order_information screen)

## Performance Considerations

- Form field validation at action level (web tier) reduces EJB processing
- ContactInfo objects created during form extraction (no lazy loading)
- Address component lookups may require database queries for existing addresses
- Order ID generation may contend on UniqueIdGenerator in high-concurrency scenarios
- Transaction scope limited to order creation (does not include cart item copying)
