## ADDED Requirements

### Requirement: Billing address collection

The system SHALL collect billing address information including family name, given name, street address (primary and optional secondary), city, state/province, postal code, country, telephone number, and email from the customer during checkout.

#### Scenario: All required billing address fields are collected

- **GIVEN** a customer on the order checkout page
- **WHEN** the customer enters billing address details
- **THEN** the system SHALL accept family name, given name, address line 1, city, state, postal code, country, telephone, and email

#### Scenario: Address line 2 is optional

- **GIVEN** a customer entering billing address
- **WHEN** the customer leaves address line 2 (secondary street address) empty
- **THEN** the system SHALL accept the form without address line 2 and treat it as null

#### Scenario: Required billing fields are validated

- **GIVEN** a customer submitting billing address with missing required field
- **WHEN** the form submission is processed
- **THEN** the system SHALL throw MissingFormDataException and display which fields are missing

### Requirement: Shipping address collection

The system SHALL collect separate shipping address information with the same required fields as billing address during checkout.

#### Scenario: Shipping address is collected independently

- **GIVEN** a customer on checkout page with separate shipping address section
- **WHEN** the customer enters shipping address details with address suffix "\_b"
- **THEN** the system SHALL accept all shipping address fields with identical validation rules

#### Scenario: Shipping address can differ from billing

- **GIVEN** a customer with existing billing address
- **WHEN** the customer enters a different shipping address
- **THEN** the system SHALL store both billing and shipping addresses as separate ContactInfo objects

### Requirement: Credit card collection for payment

The system SHALL collect credit card payment information including card number, card type, and expiry date (month and year as separate dropdowns).

#### Scenario: Credit card fields are provided during checkout

- **GIVEN** a customer on order checkout page
- **WHEN** the customer enters credit card information
- **THEN** the system SHALL accept card number, card type selection, expiry month (01-12), and expiry year

#### Scenario: Card type is restricted to supported values

- **GIVEN** a customer selecting payment method
- **WHEN** viewing card type options
- **THEN** the system SHALL display exactly three options: Java Card, Duke Express, and Meow Card

#### Scenario: Expiry date is formatted for storage

- **GIVEN** a customer selecting expiry month (e.g., 03) and year (e.g., 2025)
- **WHEN** the checkout form is submitted
- **THEN** the system SHALL format expiry date as MM/YYYY (e.g., "03/2025") for storage

### Requirement: Shopping cart validation before order placement

The system SHALL validate that the shopping cart contains items before allowing an order to be placed.

#### Scenario: Order placement requires non-empty cart

- **GIVEN** an empty shopping cart
- **WHEN** a customer attempts to submit order
- **THEN** the system SHALL throw ShoppingCartEmptyOrderException with message "Shopping cart is empty"

#### Scenario: Order is rejected if cart becomes empty

- **GIVEN** a customer with items in cart during checkout
- **WHEN** the cart becomes empty before order processing completes
- **THEN** the system SHALL prevent order creation and display error message

### Requirement: Order creation with unique ID

The system SHALL generate a unique order ID, set the order date to the current system date, and create a purchase order associated with the authenticated customer.

#### Scenario: Order ID is generated uniquely

- **GIVEN** a customer submitting a valid checkout form with non-empty cart
- **WHEN** OrderEJBAction processes the order
- **THEN** the system SHALL generate unique order ID via UniqueIdGenerator.getUniqueId("1001")

#### Scenario: Order date is set to current date

- **GIVEN** a customer completing checkout at specific time
- **WHEN** the order is created
- **THEN** the system SHALL set order date to current system date via new Date()

#### Scenario: Order is associated with customer

- **GIVEN** an authenticated customer completing checkout
- **WHEN** the order is created
- **THEN** the system SHALL retrieve customer ID from ShoppingClientFacade and associate with order

### Requirement: Order email assignment

The system SHALL assign the email address from the billing address to the order for confirmation notifications.

#### Scenario: Email is captured from billing address

- **GIVEN** a customer entering billing address with email field
- **WHEN** the order is created
- **THEN** the system SHALL store the email address from billTo.getEmail() in the order emailId field

### Requirement: Address field validation and error handling

The system SHALL validate required address fields and provide clear feedback on missing or invalid data.

#### Scenario: Missing required address fields are reported

- **GIVEN** a customer submitting checkout with empty required address field
- **WHEN** extractContactInfo() validates the fields
- **THEN** the system SHALL collect all missing field names and throw MissingFormDataException with the list

#### Scenario: Whitespace-only fields are treated as missing

- **GIVEN** a customer submitting address fields containing only spaces
- **WHEN** validation processes the fields
- **THEN** the system SHALL trim whitespace and treat empty strings as missing required fields

### Requirement: Order processing workflow

The system SHALL coordinate form validation, order creation, and payment processing as part of the complete checkout workflow.

#### Scenario: Checkout workflow processes addresses and payment

- **GIVEN** a valid checkout form with billing address, shipping address, and credit card
- **WHEN** OrderHTMLAction.perform() is invoked
- **THEN** the system SHALL extract all three components and create OrderEvent for EJB processing

#### Scenario: Order event contains complete checkout data

- **GIVEN** a completed checkout form submission
- **WHEN** OrderEvent is created
- **THEN** the system SHALL include shipper (billing address), receiver (shipping address), and payment method

### Requirement: Form field extraction with suffix parameter

The system SHALL support reusable address extraction logic for both billing and shipping addresses using configurable field name suffixes.

#### Scenario: Billing address extracted with "\_a" suffix

- **GIVEN** checkout form with billing address fields suffixed with "\_a"
- **WHEN** extractContactInfo(request, "\_a") is called
- **THEN** the system SHALL extract family_name_a, given_name_a, address_1_a, etc. parameters

#### Scenario: Shipping address extracted with "\_b" suffix

- **GIVEN** checkout form with shipping address fields suffixed with "\_b"
- **WHEN** extractContactInfo(request, "\_b") is called
- **THEN** the system SHALL extract family_name_b, given_name_b, address_1_b, etc. parameters

### Requirement: Credit card value object creation

The system SHALL create CreditCard value objects containing card number, card type, and formatted expiry date.

#### Scenario: Credit card object captures all payment details

- **GIVEN** credit card form input with number, type, and expiry month/year
- **WHEN** extractCreditCard(request) processes the data
- **THEN** the system SHALL create CreditCard object with cardNumber, cardType, and expiryDate fields

### Requirement: Contact information persistence

The system SHALL create ContactInfo value objects for both billing and shipping addresses with all collected fields.

#### Scenario: Contact info object contains address fields

- **GIVEN** extracted address information
- **WHEN** ContactInfo object is created
- **THEN** the system SHALL include all fields: familyName, givenName, address1, address2 (nullable), city, stateOrProvince, postalCode, country, telephoneNumber, email

### Requirement: Transactional order creation

The system SHALL ensure order creation is atomic with container-managed transaction semantics.

#### Scenario: Order creation is transactional

- **GIVEN** an order ready for processing
- **WHEN** OrderEJBAction creates and persists the order
- **THEN** the system SHALL execute within container-managed transaction (CMT with Required semantics)

#### Scenario: Partial failures rollback entire order

- **GIVEN** order creation in progress with multiple address and payment validations
- **WHEN** any component fails during transaction
- **THEN** the system SHALL rollback entire order creation leaving no partial data

### Requirement: Checkout form display

The system SHALL display the order checkout form collecting billing address, shipping address, and credit card information.

#### Scenario: Checkout form is displayed with all sections

- **GIVEN** a customer accessing the checkout page
- **WHEN** enter_order_information screen is rendered
- **THEN** the system SHALL display billing address section, shipping address section, and credit card section with all required fields
