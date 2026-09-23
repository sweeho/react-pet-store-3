## 1. Authentication & Sign-On Forms

- [ ] 1.1 Implement sign-on screen (signon.jsp) with username and password input fields (SWHR3-T-0007)
- [ ] 1.2 Add sign-in button and form submission to j_signon_check endpoint (SWHR3-T-0007)
- [ ] 1.3 Implement "Remember My User Name" checkbox with cookie persistence (SWHR3-T-0007)
- [ ] 1.4 Restore username from cookie when user previously selected remember option (SWHR3-T-0007)
- [ ] 1.5 Implement sign-on form parameter handling (j_username, j_password, j_remember_username) (SWHR3-T-0007)
- [ ] 1.6 Create SignOnFilter.validateSignOn() method to extract and validate form parameters (SWHR3-T-0007)
- [ ] 1.7 Implement form-based authentication handler (j_security_check endpoint) (SWHR3-T-0007)

## 2. User Registration

- [ ] 2.1 Implement user registration screen in signon.jsp for new account creation (SWHR3-T-0008)
- [ ] 2.2 Add password confirmation field to registration form (SWHR3-T-0008)
- [ ] 2.3 Implement form submission to createuser.do endpoint (SWHR3-T-0008)
- [ ] 2.4 Create CreateUserEJBAction to handle registration request (SWHR3-T-0008)
- [ ] 2.5 Implement ServiceLocator lookup of SignOnLocalHome (SWHR3-T-0008)
- [ ] 2.6 Implement SignOnEJB.createUser() with duplicate account detection (SWHR3-T-0008)
- [ ] 2.7 Throw DuplicateAccountException when username already exists (SWHR3-T-0008)

## 3. Sign-On Error Handling

- [ ] 3.1 Implement signon_failed.jsp for failed authentication display (SWHR3-T-0009)
- [ ] 3.2 Map sign-on failures to signon_error.screen template (SWHR3-T-0009)
- [ ] 3.3 Display error message "user name and password you entered were not found" (SWHR3-T-0009)
- [ ] 3.4 Implement error page in signon-config.xml (signon-form-error-page) (SWHR3-T-0009)
- [ ] 3.5 Implement SignOnFilter redirect to error page on validation failure (SWHR3-T-0009)
- [ ] 3.6 Clear sensitive form data after failed authentication (SWHR3-T-0009)

## 4. Session Management

- [ ] 4.1 Configure session timeout in web.xml (session-config/session-timeout = 30) (SWHR3-T-0010)
- [ ] 4.2 Implement session creation on successful authentication (SWHR3-T-0010)
- [ ] 4.3 Store user ID in session attribute WebKeys.USER_ID (SWHR3-T-0010)
- [ ] 4.4 Store default locale in session attribute WebKeys.LOCALE (en_US default) (SWHR3-T-0010)
- [ ] 4.5 Implement MainServlet.doProcess() locale initialization logic (SWHR3-T-0010)
- [ ] 4.6 Implement session invalidation on logout (SWHR3-T-0010)
- [ ] 4.7 Detect session timeout in ApplRequestProcessor (req.getSession(false) == null) (SWHR3-T-0010)

## 5. Protected Resources & Access Control

- [ ] 5.1 Implement SignOnFilter.doFilter() for request interception (SWHR3-T-0011)
- [ ] 5.2 Load protected resources configuration from signon-config.xml (SWHR3-T-0011)
- [ ] 5.3 Parse URL patterns and protected resource definitions at filter initialization (SWHR3-T-0011)
- [ ] 5.4 Check authentication status (session != null) for each request (SWHR3-T-0011)
- [ ] 5.5 Implement redirect to sign-on page for unauthenticated access to protected resources (SWHR3-T-0011)
- [ ] 5.6 Store original request URL in session for post-authentication redirect (SWHR3-T-0011)
- [ ] 5.7 Match requested URL against configured protected resource patterns (SWHR3-T-0011)

## 6. Customer Profile Storage

- [ ] 6.1 Design CustomerEJB entity bean with CMP 2.x persistence (SWHR3-T-0012)
- [ ] 6.2 Define CMP fields: userId, firstName, lastName, email, telephone, locale, favoriteCategory (SWHR3-T-0012)
- [ ] 6.3 Create CustomerLocalHome interface with create() and findByPrimaryKey() methods (SWHR3-T-0012)
- [ ] 6.4 Create CustomerLocal interface with getter and setter methods (SWHR3-T-0012)
- [ ] 6.5 Implement ejbCreate(), ejbPostCreate(), ejbRemove() lifecycle methods (SWHR3-T-0012)
- [ ] 6.6 Implement abstract getter/setter methods for all CMP fields (SWHR3-T-0012)
- [ ] 6.7 Declare primary key class and abstract schema in deployment descriptor (SWHR3-T-0012)

## 7. Customer Profile Value Object

- [ ] 7.1 Create CustomerProfile serializable value object class (SWHR3-T-0013)
- [ ] 7.2 Mirror CMP entity fields in value object (SWHR3-T-0013)
- [ ] 7.3 Implement getters and setters for all customer profile fields (SWHR3-T-0013)
- [ ] 7.4 Implement toDOM(Document) for XML serialization (SWHR3-T-0013)
- [ ] 7.5 Implement fromDOM(Node) for XML deserialization (SWHR3-T-0013)
- [ ] 7.6 Define XML element names (CUSTOMER, FIRST_NAME, LAST_NAME, EMAIL, etc.) (SWHR3-T-0013)
- [ ] 7.7 Support CustomerProfile data transfer between web and EJB tiers (SWHR3-T-0013)

## 8. Customer Creation Form

- [ ] 8.1 Implement create_customer.jsp form with Contact Information section (SWHR3-T-0014)
- [ ] 8.2 Add form fields for first name, last name, street address (2 lines), city, state/province (SWHR3-T-0014)
- [ ] 8.3 Add postal code, country, telephone, email input fields (SWHR3-T-0014)
- [ ] 8.4 Implement Credit Card Information section with card number, type, expiry date dropdowns (SWHR3-T-0014)
- [ ] 8.5 Implement Profile Information section with language dropdown (SWHR3-T-0014)
- [ ] 8.6 Add favorite category dropdown and checkboxes for MyList feature and pet tips banners (SWHR3-T-0014)
- [ ] 8.7 Set form submission to createcustomer.do with action=create (SWHR3-T-0014)

## 9. Customer Profile Operations

- [ ] 9.1 Implement CustomerEJB.createCustomer() for new customer registration (SWHR3-T-0015)
- [ ] 9.2 Implement CustomerEJB.getCustomer() to retrieve existing customer profiles (SWHR3-T-0015)
- [ ] 9.3 Implement CustomerEJB.updateCustomer() to modify customer attributes (SWHR3-T-0015)
- [ ] 9.4 Implement CustomerEJB.deleteCustomer() for account removal (SWHR3-T-0015)
- [ ] 9.5 Implement CustomerLocalHome.findByUserId() finder method (SWHR3-T-0015)
- [ ] 9.6 Implement customer profile validation before persistence (SWHR3-T-0015)
- [ ] 9.7 Implement email uniqueness constraint checking (SWHR3-T-0015)

## 10. EJB Service Layer

- [x] 10.1 Create CustomerLocal interface extending EJBLocalObject (SWHR3-T-0016)
- [x] 10.2 Create CustomerLocalHome interface extending EJBLocalHome (SWHR3-T-0016)
- [x] 10.3 Implement customer query methods in CustomerEJB (stateless session bean) (SWHR3-T-0016)
- [x] 10.4 Implement ServiceLocator pattern for EJB lookup (SWHR3-T-0016)
- [x] 10.5 Create JNDI names for CustomerLocalHome and SignOnLocalHome (SWHR3-T-0016)
- [x] 10.6 Implement exception handling and wrapping in service layer (SWHR3-T-0016)
- [x] 10.7 Declare local interfaces in ejb-jar.xml deployment descriptor (SWHR3-T-0016)

## 11. SignOn Component Integration

- [ ] 11.1 Implement SignOnEJB stateless session bean with createUser() method (SWHR3-T-0017)
- [ ] 11.2 Implement SignOnEJB.validateUser() for sign-on validation (SWHR3-T-0017)
- [ ] 11.3 Implement SignOnEJB.changePassword() for account updates (SWHR3-T-0017)
- [ ] 11.4 Implement UserEntity (CMP entity bean) for user identity storage (SWHR3-T-0017)
- [ ] 11.5 Implement SignOnLocalHome interface with create() and findByPrimaryKey() (SWHR3-T-0017)
- [ ] 11.6 Implement CreateException handling for duplicate username detection (SWHR3-T-0017)
- [ ] 11.7 Configure SignOn EJB in ejb-jar.xml with transaction attributes (SWHR3-T-0017)

## 12. Transaction Management

- [ ] 12.1 Configure Container-Managed Transactions (CMT) for all EJB methods (SWHR3-T-0018)
- [ ] 12.2 Declare trans-attribute=Required for CustomerEJB create() method (SWHR3-T-0018)
- [ ] 12.3 Declare trans-attribute=Required for all CustomerEJB getter/setter methods (SWHR3-T-0018)
- [ ] 12.4 Declare trans-attribute=Required for finder methods (findByUserId, findByEmail) (SWHR3-T-0018)
- [ ] 12.5 Declare trans-attribute=Required for SignOnEJB create() and validation methods (SWHR3-T-0018)
- [ ] 12.6 Implement transaction rollback on exception in EJB methods (SWHR3-T-0018)
- [ ] 12.7 Verify ACID boundaries for multi-step operations (registration + SignOn creation) (SWHR3-T-0018)

## 13. Error Handling & Exception Mapping

- [ ] 13.1 Implement MainServlet.doProcess() exception handler (catch Throwable) (SWHR3-T-0019)
- [ ] 13.2 Implement ScreenFlowManager.getExceptionScreen() exception-to-screen mapping (SWHR3-T-0019)
- [ ] 13.3 Set javax.servlet.jsp.jspException request attribute before forwarding (SWHR3-T-0019)
- [ ] 13.4 Create ERROR screen definition in screendefinitions.xml (SWHR3-T-0019)
- [ ] 13.5 Implement errorpage.jsp to display exception details (SWHR3-T-0019)
- [ ] 13.6 Map DuplicateAccountException to user-friendly error screen (SWHR3-T-0019)
- [ ] 13.7 Implement logging of exceptions for debugging (SWHR3-T-0019)

## 14. Security Configuration

- [x] 14.1 Configure form-based authentication in web.xml (auth-method=FORM) (SWHR3-T-0020)
- [x] 14.2 Set form-login-page to /login.jsp or /signon.screen (SWHR3-T-0020)
- [x] 14.3 Set form-error-page to /error.jsp or /signon_error.screen (SWHR3-T-0020)
- [x] 14.4 Define security realm in login-config element (SWHR3-T-0020)
- [x] 14.5 Implement password length constraints (MAX_PASSWD_LENGTH constant) (SWHR3-T-0020)
- [x] 14.6 Implement username character restrictions (alphanumeric validation) (SWHR3-T-0020)
- [x] 14.7 Configure authorization roles (if required) for different user types (SWHR3-T-0020)

## 15. Form Validation & Constraints

- [x] 15.1 Implement JSP form validation for required fields (username, password) (SWHR3-T-0021)
- [x] 15.2 Validate password confirmation match in registration form (SWHR3-T-0021)
- [x] 15.3 Add client-side validation using waf:input validation attribute (SWHR3-T-0021)
- [x] 15.4 Validate email format in customer creation form (SWHR3-T-0021)
- [x] 15.5 Implement server-side validation in CreateUserEJBAction (SWHR3-T-0021)
- [x] 15.6 Set maxlength on text input fields (username, passwords, names) (SWHR3-T-0021)
- [x] 15.7 Implement form value preservation on validation failure (SWHR3-T-0021)

## 16. Testing & Integration

- [ ] 16.1 Create integration tests for sign-on flow (valid/invalid credentials) (SWHR3-T-0022)
- [ ] 16.2 Test protected resource access without authentication (SWHR3-T-0022)
- [ ] 16.3 Test session creation and timeout behavior (SWHR3-T-0022)
- [ ] 16.4 Test remember username cookie persistence (SWHR3-T-0022)
- [ ] 16.5 Test duplicate account detection on registration (SWHR3-T-0022)
- [ ] 16.6 Test customer profile creation with all form fields (SWHR3-T-0022)
- [ ] 16.7 Test error screen rendering on exceptions (SWHR3-T-0022)
- [ ] 16.8 Test transaction rollback on concurrent duplicate registrations (SWHR3-T-0022)
