## 1. Authentication & Sign-On Forms

- [ ] 1.1 Implement sign-on screen (signon.jsp) with username and password input fields
- [ ] 1.2 Add sign-in button and form submission to j_signon_check endpoint
- [ ] 1.3 Implement "Remember My User Name" checkbox with cookie persistence
- [ ] 1.4 Restore username from cookie when user previously selected remember option
- [ ] 1.5 Implement sign-on form parameter handling (j_username, j_password, j_remember_username)
- [ ] 1.6 Create SignOnFilter.validateSignOn() method to extract and validate form parameters
- [ ] 1.7 Implement form-based authentication handler (j_security_check endpoint)

## 2. User Registration

- [ ] 2.1 Implement user registration screen in signon.jsp for new account creation
- [ ] 2.2 Add password confirmation field to registration form
- [ ] 2.3 Implement form submission to createuser.do endpoint
- [ ] 2.4 Create CreateUserEJBAction to handle registration request
- [ ] 2.5 Implement ServiceLocator lookup of SignOnLocalHome
- [ ] 2.6 Implement SignOnEJB.createUser() with duplicate account detection
- [ ] 2.7 Throw DuplicateAccountException when username already exists

## 3. Sign-On Error Handling

- [ ] 3.1 Implement signon_failed.jsp for failed authentication display
- [ ] 3.2 Map sign-on failures to signon_error.screen template
- [ ] 3.3 Display error message "user name and password you entered were not found"
- [ ] 3.4 Implement error page in signon-config.xml (signon-form-error-page)
- [ ] 3.5 Implement SignOnFilter redirect to error page on validation failure
- [ ] 3.6 Clear sensitive form data after failed authentication

## 4. Session Management

- [ ] 4.1 Configure session timeout in web.xml (session-config/session-timeout = 30)
- [ ] 4.2 Implement session creation on successful authentication
- [ ] 4.3 Store user ID in session attribute WebKeys.USER_ID
- [ ] 4.4 Store default locale in session attribute WebKeys.LOCALE (en_US default)
- [ ] 4.5 Implement MainServlet.doProcess() locale initialization logic
- [ ] 4.6 Implement session invalidation on logout
- [ ] 4.7 Detect session timeout in ApplRequestProcessor (req.getSession(false) == null)

## 5. Protected Resources & Access Control

- [ ] 5.1 Implement SignOnFilter.doFilter() for request interception
- [ ] 5.2 Load protected resources configuration from signon-config.xml
- [ ] 5.3 Parse URL patterns and protected resource definitions at filter initialization
- [ ] 5.4 Check authentication status (session != null) for each request
- [ ] 5.5 Implement redirect to sign-on page for unauthenticated access to protected resources
- [ ] 5.6 Store original request URL in session for post-authentication redirect
- [ ] 5.7 Match requested URL against configured protected resource patterns

## 6. Customer Profile Storage

- [ ] 6.1 Design CustomerEJB entity bean with CMP 2.x persistence
- [ ] 6.2 Define CMP fields: userId, firstName, lastName, email, telephone, locale, favoriteCategory
- [ ] 6.3 Create CustomerLocalHome interface with create() and findByPrimaryKey() methods
- [ ] 6.4 Create CustomerLocal interface with getter and setter methods
- [ ] 6.5 Implement ejbCreate(), ejbPostCreate(), ejbRemove() lifecycle methods
- [ ] 6.6 Implement abstract getter/setter methods for all CMP fields
- [ ] 6.7 Declare primary key class and abstract schema in deployment descriptor

## 7. Customer Profile Value Object

- [ ] 7.1 Create CustomerProfile serializable value object class
- [ ] 7.2 Mirror CMP entity fields in value object
- [ ] 7.3 Implement getters and setters for all customer profile fields
- [ ] 7.4 Implement toDOM(Document) for XML serialization
- [ ] 7.5 Implement fromDOM(Node) for XML deserialization
- [ ] 7.6 Define XML element names (CUSTOMER, FIRST_NAME, LAST_NAME, EMAIL, etc.)
- [ ] 7.7 Support CustomerProfile data transfer between web and EJB tiers

## 8. Customer Creation Form

- [ ] 8.1 Implement create_customer.jsp form with Contact Information section
- [ ] 8.2 Add form fields for first name, last name, street address (2 lines), city, state/province
- [ ] 8.3 Add postal code, country, telephone, email input fields
- [ ] 8.4 Implement Credit Card Information section with card number, type, expiry date dropdowns
- [ ] 8.5 Implement Profile Information section with language dropdown
- [ ] 8.6 Add favorite category dropdown and checkboxes for MyList feature and pet tips banners
- [ ] 8.7 Set form submission to createcustomer.do with action=create

## 9. Customer Profile Operations

- [ ] 9.1 Implement CustomerEJB.createCustomer() for new customer registration
- [ ] 9.2 Implement CustomerEJB.getCustomer() to retrieve existing customer profiles
- [ ] 9.3 Implement CustomerEJB.updateCustomer() to modify customer attributes
- [ ] 9.4 Implement CustomerEJB.deleteCustomer() for account removal
- [ ] 9.5 Implement CustomerLocalHome.findByUserId() finder method
- [ ] 9.6 Implement customer profile validation before persistence
- [ ] 9.7 Implement email uniqueness constraint checking

## 10. EJB Service Layer

- [ ] 10.1 Create CustomerLocal interface extending EJBLocalObject
- [ ] 10.2 Create CustomerLocalHome interface extending EJBLocalHome
- [ ] 10.3 Implement customer query methods in CustomerEJB (stateless session bean)
- [ ] 10.4 Implement ServiceLocator pattern for EJB lookup
- [ ] 10.5 Create JNDI names for CustomerLocalHome and SignOnLocalHome
- [ ] 10.6 Implement exception handling and wrapping in service layer
- [ ] 10.7 Declare local interfaces in ejb-jar.xml deployment descriptor

## 11. SignOn Component Integration

- [ ] 11.1 Implement SignOnEJB stateless session bean with createUser() method
- [ ] 11.2 Implement SignOnEJB.validateUser() for sign-on validation
- [ ] 11.3 Implement SignOnEJB.changePassword() for account updates
- [ ] 11.4 Implement UserEntity (CMP entity bean) for user identity storage
- [ ] 11.5 Implement SignOnLocalHome interface with create() and findByPrimaryKey()
- [ ] 11.6 Implement CreateException handling for duplicate username detection
- [ ] 11.7 Configure SignOn EJB in ejb-jar.xml with transaction attributes

## 12. Transaction Management

- [ ] 12.1 Configure Container-Managed Transactions (CMT) for all EJB methods
- [ ] 12.2 Declare trans-attribute=Required for CustomerEJB create() method
- [ ] 12.3 Declare trans-attribute=Required for all CustomerEJB getter/setter methods
- [ ] 12.4 Declare trans-attribute=Required for finder methods (findByUserId, findByEmail)
- [ ] 12.5 Declare trans-attribute=Required for SignOnEJB create() and validation methods
- [ ] 12.6 Implement transaction rollback on exception in EJB methods
- [ ] 12.7 Verify ACID boundaries for multi-step operations (registration + SignOn creation)

## 13. Error Handling & Exception Mapping

- [ ] 13.1 Implement MainServlet.doProcess() exception handler (catch Throwable)
- [ ] 13.2 Implement ScreenFlowManager.getExceptionScreen() exception-to-screen mapping
- [ ] 13.3 Set javax.servlet.jsp.jspException request attribute before forwarding
- [ ] 13.4 Create ERROR screen definition in screendefinitions.xml
- [ ] 13.5 Implement errorpage.jsp to display exception details
- [ ] 13.6 Map DuplicateAccountException to user-friendly error screen
- [ ] 13.7 Implement logging of exceptions for debugging

## 14. Security Configuration

- [ ] 14.1 Configure form-based authentication in web.xml (auth-method=FORM)
- [ ] 14.2 Set form-login-page to /login.jsp or /signon.screen
- [ ] 14.3 Set form-error-page to /error.jsp or /signon_error.screen
- [ ] 14.4 Define security realm in login-config element
- [ ] 14.5 Implement password length constraints (MAX_PASSWD_LENGTH constant)
- [ ] 14.6 Implement username character restrictions (alphanumeric validation)
- [ ] 14.7 Configure authorization roles (if required) for different user types

## 15. Form Validation & Constraints

- [ ] 15.1 Implement JSP form validation for required fields (username, password)
- [ ] 15.2 Validate password confirmation match in registration form
- [ ] 15.3 Add client-side validation using waf:input validation attribute
- [ ] 15.4 Validate email format in customer creation form
- [ ] 15.5 Implement server-side validation in CreateUserEJBAction
- [ ] 15.6 Set maxlength on text input fields (username, passwords, names)
- [ ] 15.7 Implement form value preservation on validation failure

## 16. Testing & Integration

- [ ] 16.1 Create integration tests for sign-on flow (valid/invalid credentials)
- [ ] 16.2 Test protected resource access without authentication
- [ ] 16.3 Test session creation and timeout behavior
- [ ] 16.4 Test remember username cookie persistence
- [ ] 16.5 Test duplicate account detection on registration
- [ ] 16.6 Test customer profile creation with all form fields
- [ ] 16.7 Test error screen rendering on exceptions
- [ ] 16.8 Test transaction rollback on concurrent duplicate registrations
