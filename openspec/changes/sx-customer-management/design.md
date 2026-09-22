# Customer Management Design

## User interface

The customer-management capability provides six user-facing screens:

1. **Sign-on screen** (signon.jsp): Username and password input fields, sign-in button, remember username checkbox for existing customers
2. **User registration screen** (signon.jsp): New account creation with username, password, and password confirmation fields
3. **Sign-on error screen** (signon_failed.jsp): Error messaging for failed authentication attempts
4. **Create customer screen** (create_customer.jsp): Comprehensive form collecting contact information, credit card details, and profile preferences
5. **Sign-on form** (signon.screen): Parameter-based form collecting j_username, j_password, and optional j_remember_username
6. **Error screen**: Exception display screen for request processing failures

## Architecture Overview

Customer management is implemented as a three-tier system:

1. **Web Tier**: SignOnFilter intercepts requests; JSP forms render screens; servlet handles POST submissions
2. **EJB Tier**: CustomerEJB (stateless session bean) orchestrates customer operations; SignOnEJB manages user identities
3. **Persistence Tier**: Entity beans store customer profiles, contact info, preferences; CMP provides automatic persistence

### Request Flow

1. User accesses protected resource → SignOnFilter checks authentication
2. If unauthenticated → redirect to sign-on page (signon.screen)
3. User submits credentials to j_signon_check endpoint
4. SignOnFilter validates against SignOn EJB
5. On success → session established, HttpSession getAttribute(WebKeys.USER_ID) returns userid
6. On failure → forward to signon_error.screen with error message

### Protected Resources Configuration

Protected resources are defined in signon-config.xml with URL patterns and specify:

- signon-form-page: page to redirect for sign-on (typically signon.screen)
- signon-form-error-page: page for failed authentication (typically signon_error.screen)

### Session Management

- Default timeout: 30 minutes (configured in web.xml session-config)
- Locale initialization: Default en_US, stored in session attribute WebKeys.LOCALE
- Session ID: Available via request.getSession().getId()
- Session invalidation: Explicit call on logout via request.getSession().invalidate()

### EJB Components

**CustomerEJB** (stateless session bean):

- Methods: createCustomer(), getCustomer(), updateCustomer(), deleteCustomer()
- Transaction semantics: Container-Managed Transactions (CMT) with Required attribute
- Local interface: CustomerLocal extends EJBLocalObject

**SignOnEJB** (stateless session bean):

- Methods: createUser(), validateUser(), changePassword()
- Uses ServiceLocator pattern for lookup
- Transaction semantics: CMT with Required attribute
- Handles duplicate account detection via CreateException

### Data Model

**Customer Entity** (CMP 2.x):

- Fields: userId (key), firstName, lastName, email, telephone, locale, favoriteCategory
- Lifecycle: ejbCreate(), ejbPostCreate(), ejbRemove()
- Local home: CustomerLocalHome

**CustomerProfile Value Object**:

- Mirrors entity fields for data transfer
- Serializable for remote invocation
- Contains: contact info, preferences, cookie persistence flags

## Legacy Implementation Notes

### Form Processing

- Form submission to createuser.do or j_signon_check endpoints
- Form validation via waf:input with validation attribute
- Remember username persisted in browser cookie (bp_signon)

### Error Handling

- Authentication failure: getParameter() call on invalid credentials
- Session timeout: req.getSession(false) returns null; XML error response returned
- Duplicate account: CreateException caught and wrapped in DuplicateAccountException

### Exception Mapping

- MainServlet.doProcess() catches Throwable and sets javax.servlet.jsp.jspException attribute
- ScreenFlowManager.getExceptionScreen() determines error screen based on exception type
- ERROR screen template combines banner.jsp, errorpage.jsp, footer.jsp

## Constraints and Assumptions

1. **Form-based Authentication**: Uses standard J2EE form-based login, not programmatic
2. **Protected Resource List**: URL patterns must match exactly (no wildcard matching observed)
3. **Session Timeout**: Single global timeout applies to all sessions; no per-user override
4. **Password Redaction**: Password fields contain redacted sensitive data; exact handling unclear
5. **Locale Inheritance**: If not set in session, defaults to en_US; no locale parameter passing observed in sign-on form
6. **Cookie Usage**: Remember username persists across sessions via browser cookie
7. **Transaction Semantics**: All EJB methods use Required semantics; they must complete within transaction boundaries
8. **ServiceLocator Pattern**: Runtime JNDI lookup; no caching of home references between requests

## Key Files

- **Web tier**: signon.jsp (forms), signon_failed.jsp (error), create_customer.jsp (registration)
- **Filters**: SignOnFilter.java (authentication interception)
- **EJB**: CustomerEJB.java, SignOnEJB.java (business logic)
- **Configuration**: signon-config.xml (protected resources), web.xml (session timeout)
- **Screens**: screendefinitions.xml (template definitions)

## Performance Considerations

- Session lookup on every request via SignOnFilter.doFilter()
- EJB local interface used for same-container calls (no network overhead)
- Service locator performs JNDI lookup for each EJB method call (potential bottleneck)
- Protected resource list stored in memory after initialization
