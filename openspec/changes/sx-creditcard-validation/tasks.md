## 1. Data Model & Entity Definition

- [ ] 1.1 Define CreditCardEJB as CMP 2.x entity bean with Container persistence-type
- [ ] 1.2 Define three CMP fields: cardNumber (String), cardType (String), expiryDate (String)
- [ ] 1.3 Generate abstract getter/setter methods for all three CMP fields
- [ ] 1.4 Define CreditCard value object with matching three fields and serializable interface
- [ ] 1.5 Implement constructors: no-arg constructor and constructor with all three parameters

## 2. Value Object Implementation

- [ ] 2.1 Implement CreditCard.getCardNumber(), getCardType(), getExpiryDate() accessors
- [ ] 2.2 Implement CreditCard.setCardNumber(), setCardType(), setExpiryDate() mutators
- [ ] 2.3 Implement CreditCard.toDOM(Document) to serialize to XML DOM node
- [ ] 2.4 Implement CreditCard.fromDOM(Node) to deserialize from XML DOM node
- [ ] 2.5 Define DTD public and system IDs for XML serialization
- [ ] 2.6 Define XML element name constants (CreditCard, CardNumber, CardType, ExpiryDate)

## 3. EJB Lifecycle Methods

- [ ] 3.1 Implement ejbCreate(String, String, String) with field initialization
- [ ] 3.2 Implement ejbCreate(CreditCard) with value object extraction
- [ ] 3.3 Implement ejbCreate() with no-arg constructor support
- [ ] 3.4 Implement ejbPostCreate lifecycle methods for all three variants
- [ ] 3.5 Implement ejbRemove() for entity deletion

## 4. Expiry Date Parsing

- [ ] 4.1 Implement getExpiryMonth() to extract text before "/" character
- [ ] 4.2 Implement getExpiryMonth() fallback to "01" when format invalid or null
- [ ] 4.3 Implement getExpiryYear() to extract text after "/" character
- [ ] 4.4 Implement getExpiryYear() fallback to "2010" when format invalid or null
- [ ] 4.5 Implement expiryDate storage in MM/YYYY format (e.g., "03/2025")

## 5. Home Interface Definition

- [ ] 5.1 Define CreditCardLocalHome interface extending EJBLocalHome
- [ ] 5.2 Declare create(String, String, String) method
- [ ] 5.3 Declare create(CreditCard) method
- [ ] 5.4 Declare create() no-arg method
- [ ] 5.5 Declare findByPrimaryKey(Object) method

## 6. Local Interface Definition

- [ ] 6.1 Define CreditCardLocal interface extending EJBLocalObject
- [ ] 6.2 Declare getCardNumber(), setCardNumber(String) methods
- [ ] 6.3 Declare getCardType(), setCardType(String) methods
- [ ] 6.4 Declare getExpiryDate(), setExpiryDate(String) methods
- [ ] 6.5 Declare getExpiryMonth(), getExpiryYear() parser methods

## 7. EJB Deployment Configuration

- [ ] 7.1 Configure CreditCardEJB as entity with persistence-type=Container, cmp-version=2.x
- [ ] 7.2 Declare LocalHome and Local interface references in ejb-jar.xml
- [ ] 7.3 Set primary-key-class to Object (container-managed key)
- [ ] 7.4 Define abstract-schema-name as "CreditCard"
- [ ] 7.5 Declare all three CMP fields in deployment descriptor

## 8. Transaction Configuration

- [ ] 8.1 Declare trans-attribute=Required for ejbCreate(String, String, String)
- [ ] 8.2 Declare trans-attribute=Required for ejbCreate(CreditCard)
- [ ] 8.3 Declare trans-attribute=Required for ejbCreate()
- [ ] 8.4 Declare trans-attribute=Required for all getter methods
- [ ] 8.5 Declare trans-attribute=Required for all setter methods
- [ ] 8.6 Declare trans-attribute=Required for findByPrimaryKey()
- [ ] 8.7 Declare trans-attribute=Required for remove()

## 9. Security Configuration

- [ ] 9.1 Configure security-identity with use-caller-identity
- [ ] 9.2 Declare method-permission with unchecked element for all (\*) methods
- [ ] 9.3 Verify no role-based authorization constraints are applied

## 10. Data Validation & Constraints

- [ ] 10.1 Validate card type is one of: "Java(TM) Card", "Duke Express", "Meow Card"
- [ ] 10.2 Implement card type constraint (UI-level validation, app-server mapping)
- [ ] 10.3 Validate expiry date format MM/YYYY with MM in [01-12]
- [ ] 10.4 Document card number maximum length (30 characters from JSP)
- [ ] 10.5 Document behavior for null or malformed expiry dates

## 11. XML Serialization Configuration

- [ ] 11.1 Define DTD reference: "-//Sun Microsystems, Inc. - J2EE Blueprints Group//DTD CreditCard 1.1//EN"
- [ ] 11.2 Define DTD system ID: "/com/sun/j2ee/blueprints/creditcard/rsrc/schemas/CreditCard.dtd"
- [ ] 11.3 Implement XML element name mapping (CreditCard, CardNumber, CardType, ExpiryDate)
- [ ] 11.4 Test DOM serialization round-trip (object → XML → object)

## 12. Integration & Testing

- [ ] 12.1 Create unit tests for all three create() method variants
- [ ] 12.2 Create unit tests for getters and setters
- [ ] 12.3 Create unit tests for getExpiryMonth() and getExpiryYear() parsing
- [ ] 12.4 Test expiry parsing with valid MM/YYYY format
- [ ] 12.5 Test expiry parsing with invalid/null expiry dates (verify fallback defaults)
- [ ] 12.6 Create tests for XML serialization (toDOM/fromDOM round-trip)
- [ ] 12.7 Test card type validation with all three valid values
- [ ] 12.8 Verify transaction semantics (Required attribute behavior)
- [ ] 12.9 Verify unrestricted access (no authentication/authorization checks)
- [ ] 12.10 Integration test with create_customer.jsp form submission
