## ADDED Requirements

### Requirement: Customer sign-on screen

The system SHALL display a sign-on screen containing username and password input fields, a sign-in button, and a "Remember My User Name" checkbox for existing customers.

#### Scenario: Sign-on screen is rendered

- **GIVEN** an unauthenticated user accessing a protected resource
- **WHEN** the system redirects to the sign-on page
- **THEN** the screen SHALL display username input field (name="j_username"), password input field (name="j_password"), sign-in button, and remember username checkbox

#### Scenario: Username is restored from cookie

- **GIVEN** a user previously selected "Remember My User Name"
- **WHEN** the user visits the sign-on screen in a new session
- **THEN** the username field SHALL be pre-populated from the bp_signon cookie

### Requirement: User registration screen

The system SHALL display a user registration screen containing username and password input fields (with password confirmation), and a "Create New Account" button for new customers.

#### Scenario: Registration screen is rendered

- **GIVEN** a new customer accessing the registration page
- **WHEN** the registration form is displayed
- **THEN** the screen SHALL show username input, password input, password confirmation input, and create account button

#### Scenario: Registration form submits to handler

- **GIVEN** a user completes the registration form
- **WHEN** the user clicks "Create New Account"
- **THEN** the form SHALL submit to createuser.do endpoint with method POST

### Requirement: Sign-on error screen

The system SHALL display a sign-on error screen indicating that the username and password combination was not found.

#### Scenario: Error is displayed on authentication failure

- **GIVEN** a user submits incorrect credentials
- **WHEN** the sign-on validation fails
- **THEN** the system SHALL render signon_error.screen displaying message "There were errors signing you in. The user name and password you entered were not found in our records."

### Requirement: Customer creation screen

The system SHALL present a Create Customer screen that collects contact information (first name, last name, street address lines, city, state/province, postal code, country, telephone, email), credit card information (card number, card type, expiry date), and profile information (preferred language, favorite category, MyList feature checkbox, pet tips banners checkbox).

#### Scenario: Customer creation form collects all required fields

- **GIVEN** a user accesses the customer creation page
- **WHEN** the create_customer.jsp form is rendered
- **THEN** the screen SHALL display sections for Contact Information, Credit Card Information, and Profile Information with all specified input fields

#### Scenario: Form submission is processed

- **GIVEN** a user completes all fields and clicks Submit
- **WHEN** the form is submitted
- **THEN** the system SHALL post to createcustomer.do with action=create

### Requirement: Sign-on form parameters

The system SHALL display a sign-on form that collects userName and password parameters named j_username and j_password, and an optional remember username checkbox parameter named j_remember_username.

#### Scenario: Form parameters are accepted

- **GIVEN** a user submitting sign-on credentials
- **WHEN** the form is processed
- **THEN** the system SHALL accept j_username parameter, j_password parameter, and optional j_remember_username parameter

### Requirement: Error screen display on exceptions

The system SHALL render an ERROR screen when exceptions occur during request processing, with the exception made available to the JSP via the javax.servlet.jsp.jspException request attribute.

#### Scenario: Exception is caught and error screen displayed

- **GIVEN** an exception thrown during request processing
- **WHEN** MainServlet.doProcess() catches the exception
- **THEN** the system SHALL set javax.servlet.jsp.jspException attribute and forward to ERROR screen template

### Requirement: User authentication via form-based login

The system SHALL authenticate users using form-based login with username and password validation against the SignOn EJB component.

#### Scenario: Valid credentials authenticate the user

- **GIVEN** a user submitting valid username and password to j_signon_check
- **WHEN** SignOnFilter.validateSignOn() validates the credentials
- **THEN** the system SHALL look up SignOnEJB via ServiceLocator and invoke validateUser(), creating an authenticated session on success

#### Scenario: Invalid credentials are rejected

- **GIVEN** a user submitting invalid username or password
- **WHEN** SignOnEJB.validateUser() fails to find matching user
- **THEN** the system SHALL deny authentication and forward to the sign-on error page

### Requirement: Session lifecycle management

The system SHALL create HTTP sessions upon successful authentication, store user identity and locale preferences in the session, and expire sessions after 30 minutes of inactivity.

#### Scenario: Session is created on authentication

- **GIVEN** a user successfully authenticating
- **WHEN** SignOnFilter completes validation
- **THEN** the system SHALL create an HttpSession with user ID stored in WebKeys.USER_ID attribute

#### Scenario: Session timeout is enforced

- **GIVEN** a session idle for 30 minutes
- **WHEN** the container evaluates session timeout
- **THEN** the system SHALL automatically invalidate the session

#### Scenario: Default locale is initialized

- **GIVEN** a new authenticated session
- **WHEN** MainServlet.doProcess() initializes session attributes
- **THEN** the system SHALL set WebKeys.LOCALE to en_US if not already present

### Requirement: Protected resource access control

The system SHALL intercept requests to protected resources and redirect unauthenticated users to the sign-on page, using configuration-driven URL pattern matching.

#### Scenario: Unauthenticated access is redirected

- **GIVEN** an unauthenticated user requesting a protected resource
- **WHEN** SignOnFilter.doFilter() checks authentication
- **THEN** the system SHALL redirect to the configured signon-form-page

#### Scenario: Protected resource patterns are evaluated

- **GIVEN** a request URL and a list of protected resource patterns from signon-config.xml
- **WHEN** SignOnFilter evaluates URL against patterns
- **THEN** the system SHALL match exact URL patterns and enforce protection for matches

#### Scenario: Original URL is stored for post-authentication redirect

- **GIVEN** an unauthenticated user accessing a protected resource
- **WHEN** SignOnFilter redirects to sign-on page
- **THEN** the system SHALL store the original request URL in session attribute ORIGINAL_URL

### Requirement: Cookie-based remember username

The system SHALL persist the username in a browser cookie when the user selects the "Remember My User Name" checkbox, and restore the username from the cookie on subsequent sign-on screen visits.

#### Scenario: Cookie is set on user preference

- **GIVEN** a user selecting "Remember My User Name" during sign-on
- **WHEN** the authentication request is processed
- **THEN** the system SHALL set bp_signon cookie in the response with the username value

#### Scenario: Cookie is read on subsequent visits

- **GIVEN** a user with existing bp_signon cookie value
- **WHEN** the sign-on screen is displayed
- **THEN** the system SHALL read the cookie and pre-populate the username field

### Requirement: New user registration and duplicate detection

The system SHALL support new user account creation via the registration form, detecting and rejecting attempts to create duplicate usernames.

#### Scenario: Valid new user is registered

- **GIVEN** a user submitting registration with new username and password
- **WHEN** CreateUserEJBAction invokes SignOnEJB.createUser()
- **THEN** the system SHALL create the user identity and return success

#### Scenario: Duplicate username is detected

- **GIVEN** a user attempting to register with an existing username
- **WHEN** SignOnEJB.createUser() detects the duplicate
- **THEN** the system SHALL throw CreateException, which SHALL be wrapped as DuplicateAccountException

### Requirement: Customer profile creation and persistence

The system SHALL store customer profiles comprising contact information, credit card details, and user preferences in persistent entity beans.

#### Scenario: Customer profile is created

- **GIVEN** a user submitting the customer creation form with all required fields
- **WHEN** the system invokes CustomerEJB.createCustomer()
- **THEN** the system SHALL persist all form data in the Customer entity and return success

#### Scenario: Customer profile is retrieved

- **GIVEN** an authenticated user
- **WHEN** the system invokes CustomerEJB.getCustomer(userId)
- **THEN** the system SHALL return the persisted customer profile with all stored fields

### Requirement: Session invalidation on logout

The system SHALL invalidate the HTTP session when a user logs out, clearing all session attributes and preventing further access with the invalidated session ID.

#### Scenario: Session is invalidated

- **GIVEN** an authenticated user accessing the logout page
- **WHEN** logout.jsp calls request.getSession().invalidate()
- **THEN** the system SHALL clear all session data and mark the session as invalid

### Requirement: Session timeout detection

The system SHALL detect when a user's session has expired and return an error response indicating that the session has timed out.

#### Scenario: Expired session is detected

- **GIVEN** a user whose session has timed out making a request
- **WHEN** ApplRequestProcessor calls req.getSession(false)
- **THEN** the system SHALL detect null session and return XML error response "Session Timed Out; Please exit and login as admin from the login page"

### Requirement: Transaction semantics for customer operations

The system SHALL enforce Container-Managed Transactions with Required semantics on all customer and sign-on EJB methods, ensuring ACID properties for all operations.

#### Scenario: Transaction is created for standalone operation

- **GIVEN** a method invocation outside any transaction context
- **WHEN** a CustomerEJB method executes
- **THEN** the system SHALL automatically create and commit a transaction for that method

#### Scenario: Method participates in existing transaction

- **GIVEN** a call from within an existing transaction
- **WHEN** CustomerEJB.createCustomer() is invoked
- **THEN** the method SHALL participate in the existing transaction

### Requirement: Form-based authentication configuration

The system SHALL declare form-based authentication in the deployment configuration with URLs for login and error pages.

#### Scenario: Form-based auth is configured

- **GIVEN** web.xml configuration
- **WHEN** the application initializes
- **THEN** the system SHALL read login-config with auth-method=FORM, form-login-page, and form-error-page

### Requirement: Exception to screen mapping

The system SHALL map application exceptions to appropriate error screens using exception-based screen flow determination.

#### Scenario: Exception is mapped to error screen

- **GIVEN** an exception thrown during request processing
- **WHEN** MainServlet catches the exception and invokes ScreenFlowManager.getExceptionScreen()
- **THEN** the system SHALL return an appropriate screen template name for rendering the error

### Requirement: ServiceLocator-based EJB lookup

The system SHALL use the ServiceLocator pattern to perform JNDI lookups of EJB home interfaces for customer and sign-on components.

#### Scenario: EJB home is located

- **GIVEN** code needing to invoke an EJB method
- **WHEN** ServiceLocator.getLocalHome(JNDINames.CUSTOMER_EJBHOME) is called
- **THEN** the system SHALL perform JNDI lookup and return the CustomerLocalHome interface

#### Scenario: Service lookup failure is handled

- **GIVEN** an unsuccessful JNDI lookup
- **WHEN** ServiceLocator throws ServiceLocatorException
- **THEN** the system SHALL wrap the exception as DuplicateAccountException or appropriate error

### Requirement: Customer profile updates

The system SHALL support modification of existing customer profiles with persistence of updated attributes.

#### Scenario: Customer profile is updated

- **GIVEN** an authenticated customer with existing profile
- **WHEN** the system invokes CustomerEJB.updateCustomer()
- **THEN** the system SHALL persist all modifications to the customer entity

### Requirement: Protected resource configuration

The system SHALL load and cache protected resource definitions from signon-config.xml at application startup, including URL patterns and sign-on/error page URLs.

#### Scenario: Protected resources are loaded

- **GIVEN** application startup
- **WHEN** SignOnFilter.init() executes
- **THEN** the system SHALL load signon-config.xml and cache protected resource patterns in memory
