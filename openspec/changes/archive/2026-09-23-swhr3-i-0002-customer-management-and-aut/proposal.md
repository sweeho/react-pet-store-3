# Customer Management Capability Extraction

## Summary

This change extracts customer management and authentication functionality from the legacy application. The capability provides user registration, sign-on, session management, profile persistence, and integration with payment processing and contact information components.

## Extracted Capabilities

The customer-management capability encompasses:

- **User Authentication**: Form-based sign-on with username/password validation
- **User Registration**: New account creation with duplicate account detection
- **Session Management**: HTTP session lifecycle with 30-minute timeout and locale preferences
- **Protected Resources**: URL pattern-based access control with automatic redirect to sign-on
- **Customer Profiles**: Persistent storage of customer contact information, preferences, and credentials
- **Account Operations**: Password changes, logout, session invalidation
- **Integration Points**: SignOn component for user identity, OrderEJB for order history, ContactInfo for addresses

## Technical Stack

- **Web Tier**: Servlet filters and JSP forms for authentication UI
- **EJB Tier**: Stateless session beans (CustomerEJB, SignOnEJB) with CMP entities
- **Persistence**: Entity beans with Container-Managed Persistence
- **Security**: Form-based authentication with declarative security constraints
- **Session Management**: HTTP sessions with configurable timeout and locale attributes
- **Transactions**: Container-Managed Transactions (CMT) with Required semantics

## Key Patterns

- **Filter-based Protection**: SignOnFilter intercepts requests to protected resources
- **ServiceLocator Pattern**: Lookup and creation of EJB components
- **Value Objects**: CustomerProfile serializable for data transfer
- **Configuration-driven**: Protected resources and sign-on page URLs from external XML
- **Error Handling**: User/password not found scenarios with dedicated error screens
