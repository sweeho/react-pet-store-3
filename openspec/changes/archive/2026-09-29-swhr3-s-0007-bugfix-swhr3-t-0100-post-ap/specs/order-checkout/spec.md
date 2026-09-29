## ADDED Requirements

### Requirement: Order submission accepts only JSON
ID: SWHR3-R-0049

The system SHALL accept an order submission only when its declared content type is `application/json`, ignoring media-type parameters and letter case. It SHALL refuse any other content type, including a missing one, with status 415 before the submission is processed. A refused submission SHALL create no order, SHALL leave the shopping cart unchanged, and SHALL record no order-creation log entry.

#### Scenario: Form-encoded submission is refused
ID: SWHR3-R-0049.01

- **GIVEN** a signed-in customer with items in the cart
- **WHEN** the customer submits a complete checkout with content type `application/x-www-form-urlencoded`
- **THEN** the system SHALL answer 415 with code `UNSUPPORTED_MEDIA_TYPE`, create no order, and leave the cart unchanged

#### Scenario: Plain-text submission is refused
ID: SWHR3-R-0049.02

- **GIVEN** a signed-in customer with items in the cart
- **WHEN** the customer submits a complete checkout as JSON text with content type `text/plain`
- **THEN** the system SHALL answer 415, create no order, and leave the cart unchanged

#### Scenario: Multipart submission is refused
ID: SWHR3-R-0049.03

- **GIVEN** a signed-in customer with items in the cart
- **WHEN** the customer submits a complete checkout with content type `multipart/form-data`
- **THEN** the system SHALL answer 415, create no order, and leave the cart unchanged

#### Scenario: Submission without a content type is refused
ID: SWHR3-R-0049.04

- **GIVEN** a signed-in customer with items in the cart
- **WHEN** the customer submits a complete checkout as JSON text with no content-type header
- **THEN** the system SHALL answer 415, create no order, and leave the cart unchanged

#### Scenario: JSON submission with a charset parameter is accepted
ID: SWHR3-R-0049.05

- **GIVEN** a signed-in customer with items in the cart
- **WHEN** the customer submits a complete checkout with content type `application/json; charset=utf-8`
- **THEN** the system SHALL answer 201 and create the order

#### Scenario: Refused submission records no order log entry
ID: SWHR3-R-0049.06

- **GIVEN** a signed-in customer with items in the cart
- **WHEN** the customer submits a complete checkout with a non-JSON content type
- **THEN** the system SHALL record no order-creation log entry
