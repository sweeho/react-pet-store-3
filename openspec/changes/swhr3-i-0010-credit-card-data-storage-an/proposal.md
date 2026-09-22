# Credit Card Validation Capability Extraction

## Summary

This change extracts credit card validation and storage functionality from the legacy application into OpenSpec requirements. The capability provides secure storage and management of credit card data through a container-managed EJB entity with support for multiple creation methods, transactional integrity, and XML serialization.

## Extracted Capabilities

The creditcard-validation capability encompasses:

- **Card Data Storage**: CMP 2.x entity bean persistence for card details
- **Field Validation**: Card type enumeration (Java Card, Duke Express, Meow Card)
- **Expiry Date Parsing**: MM/YYYY format with component extraction
- **Transaction Management**: Container-managed transactions with Required semantics
- **Access Control**: Unrestricted public access to all card operations
- **Value Object Serialization**: DOM-based XML marshalling for data transfer
- **Multiple Creation Paths**: Flexible entity instantiation methods

## Key Design Patterns

1. **Container-Managed Persistence**: CMP 2.x EJB entity for persistence
2. **Value Object**: Separate data transfer object mirroring entity fields
3. **XML Serialization**: DOM-based serialization for integration scenarios
4. **Multiple Creation Methods**: Overloaded create() methods for flexibility
5. **Declarative Security**: Unchecked permission on all methods

## Technical Stack

- **Persistence**: EJB 2.x Container-Managed Persistence (CMP)
- **Entity Bean**: CreditCardEJB with Local interface
- **Value Object**: CreditCard class with XML support
- **Serialization**: DOM Node marshalling with DTD reference
- **Transactions**: Container-Managed Transactions (CMT) with Required attribute

## Entity Model

**CreditCard Entity Fields**:

- `cardNumber`: String (up to 30 characters based on form constraints)
- `cardType`: String (restricted to: Java(TM) Card, Duke Express, Meow Card)
- `expiryDate`: String in MM/YYYY format where MM ∈ [01-12], YYYY is 4 digits

## Risks and Ambiguities

1. **Expiry Date Parse Failures**: Silent defaults to 01/2010 when format is invalid or null
2. **Card Type Label Mismatch**: Display labels ("Meow Club") may differ from stored values ("Meow Card")
3. **Primary Key Strategy**: Object-typed primary key suggests synthetic or container-generated key (exact strategy in vendor config)
4. **Card Number Length**: JSP shows maxlength=30 but no database constraint documented
5. **Invalid Expiry Handling**: No documented behavior when month > 12 or year format invalid

## Out of Scope

- Payment processing and authorization
- Credit card validation algorithms (Luhn, etc.)
- PCI compliance and encryption
- Fraud detection
- Card tokenization
- Integration with payment gateways
