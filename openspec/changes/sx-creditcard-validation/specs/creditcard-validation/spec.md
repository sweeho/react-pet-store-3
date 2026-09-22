## ADDED Requirements

### Requirement: Credit card data storage

The system SHALL store credit card information comprising three required fields: card number, card type, and expiry date, with persistence provided by a container-managed entity bean.

#### Scenario: Credit card is created with all fields

- **GIVEN** a customer provides card number, card type, and expiry date
- **WHEN** a credit card entity is created
- **THEN** all three fields SHALL be stored and retrievable from the persistent entity

#### Scenario: Credit card fields are updated

- **GIVEN** a stored credit card entity
- **WHEN** any of the three fields are modified
- **THEN** the changes SHALL be persisted within a transaction boundary

### Requirement: Card number field

The system SHALL accept and persist a card number as a string field with a maximum length sufficient for all valid card number formats.

#### Scenario: Valid card number is stored

- **GIVEN** a customer enters a card number
- **WHEN** the card number is submitted
- **THEN** the system SHALL store the card number string and make it retrievable via getCardNumber()

### Requirement: Card type validation

The system SHALL restrict card type values to a defined set: Java(TM) Card, Duke Express, and Meow Card.

#### Scenario: Valid card type is accepted

- **GIVEN** a customer selects a valid card type from the available options
- **WHEN** the card is created
- **THEN** the selected card type SHALL be stored

#### Scenario: Card type is persisted and retrievable

- **GIVEN** a credit card has been created with a specific card type
- **WHEN** the card is retrieved
- **THEN** getCardType() SHALL return the exact card type value that was stored

### Requirement: Expiry date storage and parsing

The system SHALL store card expiry dates in MM/YYYY format where MM is a two-digit month (01-12) and YYYY is a four-digit year, and SHALL provide methods to extract the month and year components.

#### Scenario: Expiry date in correct format is stored

- **GIVEN** a customer provides an expiry month (01-12) and year
- **WHEN** the credit card is created
- **THEN** the system SHALL store the expiry date in MM/YYYY format (e.g., "03/2025")

#### Scenario: Expiry components are extractable

- **GIVEN** a credit card with stored expiry date "06/2028"
- **WHEN** getExpiryMonth() is called
- **THEN** the method SHALL return "06"

#### Scenario: Year is extractable from expiry date

- **GIVEN** a credit card with stored expiry date "06/2028"
- **WHEN** getExpiryYear() is called
- **THEN** the method SHALL return "2028"

### Requirement: Unrestricted credit card access

The system SHALL allow any caller to access credit card operations without authentication or authorization restrictions, using caller identity with unchecked permissions on all methods.

#### Scenario: Caller accesses credit card methods without restriction

- **GIVEN** a caller invokes any CreditCard EJB method
- **WHEN** the method is called
- **THEN** the system SHALL execute the method without checking caller identity or role

### Requirement: Credit card creation methods

The system SHALL support three distinct ways to create credit card entities: (1) providing card number, type, and expiry date as separate string parameters, (2) providing a CreditCard value object, and (3) creating an empty card entity.

#### Scenario: Card created with individual parameters

- **GIVEN** three string parameters for card number, type, and expiry date
- **WHEN** create(String, String, String) is invoked
- **THEN** the system SHALL create and persist a credit card entity with those values

#### Scenario: Card created from value object

- **GIVEN** a CreditCard value object containing card details
- **WHEN** create(CreditCard) is invoked
- **THEN** the system SHALL extract the object's fields and create a persisted entity

#### Scenario: Empty card entity created

- **GIVEN** no parameters
- **WHEN** create() is invoked with no arguments
- **THEN** the system SHALL create an empty credit card entity

### Requirement: Credit card transactional integrity

The system SHALL enforce container-managed transactions with Required semantics on all credit card operations, ensuring each invocation either commits within an existing transaction or creates a new one.

#### Scenario: Transaction is created for standalone operation

- **GIVEN** a credit card method is invoked outside any transaction context
- **WHEN** the method executes
- **THEN** the system SHALL create a new transaction, execute the method atomically, and commit

#### Scenario: Method joins existing transaction

- **GIVEN** a credit card method is invoked within an existing transaction
- **WHEN** the method executes
- **THEN** the method SHALL participate in the existing transaction and share its ACID boundaries

### Requirement: Credit card value object serialization

The system SHALL provide a CreditCard value object that mirrors the entity's fields and supports XML serialization and deserialization via DOM (Document Object Model).

#### Scenario: Value object is serialized to XML

- **GIVEN** a CreditCard value object with populated fields
- **WHEN** toDOM(Document) is called
- **THEN** the method SHALL return an XML DOM node representing the card data

#### Scenario: Value object is deserialized from XML

- **GIVEN** an XML DOM node containing credit card data
- **WHEN** fromDOM(Node) is called
- **THEN** the system SHALL parse the XML and return a populated CreditCard value object
