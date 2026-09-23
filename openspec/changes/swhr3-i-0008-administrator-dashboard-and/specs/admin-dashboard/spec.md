## ADDED Requirements

### Requirement: Administrator login screen

The system SHALL provide an administrator login screen that collects username and password credentials and authenticates users against the application security realm using form-based authentication.

#### Scenario: Administrator logs in with valid credentials

- **GIVEN** the admin login page is displayed
- **WHEN** an administrator enters username "jps_admin" and password "admin"
- **THEN** the system SHALL authenticate the user against the configured realm and forward to the home page

#### Scenario: Invalid credentials are rejected

- **GIVEN** the admin login page is displayed
- **WHEN** an administrator enters incorrect credentials
- **THEN** the system SHALL display the error page and not grant access

### Requirement: Administrator home page

The system SHALL display an admin home page offering options to launch the rich client application or logout from the admin interface.

#### Scenario: Authenticated administrator views home page

- **GIVEN** an authenticated administrator session
- **WHEN** the admin home page is accessed
- **THEN** the page SHALL display a button to "Launch Rich Client" and a button to "logout"

#### Scenario: Administrator initiates rich client launch

- **GIVEN** the admin home page is displayed
- **WHEN** an administrator clicks "Launch Rich Client"
- **THEN** the system SHALL generate a JNLP file and deliver it to the client for Java WebStart execution

### Requirement: Order management interface

The system SHALL provide an order management screen with two tabs: a read-only view tab displaying all orders with status filtering, and an approval tab allowing administrators to change order statuses from PENDING to APPROVED or DENIED.

#### Scenario: Administrator views all orders by status

- **GIVEN** the orders view tab is displayed
- **WHEN** a status filter is applied (PENDING, APPROVED, DENIED, or COMPLETED)
- **THEN** the system SHALL retrieve and display orders matching that status in a table with columns for OrderId, UserId, OrderDate, OrderAmount, and OrderStatus

#### Scenario: Administrator approves pending orders

- **GIVEN** the orders approval tab is displayed with pending orders
- **WHEN** an administrator selects one or more orders and clicks "Approve"
- **THEN** the selected orders' status SHALL be changed to APPROVED in the local client model

#### Scenario: Administrator denies pending orders

- **GIVEN** the orders approval tab is displayed with pending orders
- **WHEN** an administrator selects one or more orders and clicks "Deny"
- **THEN** the selected orders' status SHALL be changed to DENIED in the local client model

#### Scenario: Administrator commits order status changes

- **GIVEN** pending orders have been modified to APPROVED or DENIED status
- **WHEN** the administrator clicks "Commit"
- **THEN** the system SHALL send all modified orders to the server via XML and persist the changes

#### Scenario: Uncommitted changes trigger warning on refresh

- **GIVEN** order status changes exist that have not been committed
- **WHEN** the administrator initiates a data refresh
- **THEN** the system SHALL display a confirmation dialog warning of uncommitted changes and require explicit confirmation to proceed

### Requirement: Sales analytics dashboard

The system SHALL display an analytics dashboard with two tabbed chart views showing sales and order data aggregated by category or individual item, with support for date range filtering.

#### Scenario: Administrator views revenue by category

- **GIVEN** the sales dashboard pie chart tab is displayed
- **WHEN** the administrator selects a date range (start and end dates)
- **THEN** the system SHALL display revenue data aggregated by product category and show the total sales across all categories

#### Scenario: Administrator views order counts by category

- **GIVEN** the sales dashboard bar chart tab is displayed
- **WHEN** the administrator selects a date range (start and end dates)
- **THEN** the system SHALL display order quantities aggregated by product category and show the total order count across all categories

#### Scenario: Category-specific data filtering

- **GIVEN** the sales dashboard is displayed
- **WHEN** a specific product category is selected as a filter
- **THEN** the system SHALL display revenue or order data aggregated by individual items within that category instead of by category

#### Scenario: Dashboard refresh with uncommitted changes

- **GIVEN** uncommitted order status changes exist in the orders panel
- **WHEN** the administrator attempts to refresh dashboard data
- **THEN** the system SHALL warn of uncommitted changes and require confirmation before proceeding

### Requirement: Screen rendering system

The system SHALL render all admin interface screens using a template servlet that processes screen definition files with support for optional caching of previous screen attributes and parameters.

#### Scenario: Screen is rendered from template definition

- **GIVEN** a screen is requested via a \*.screen URL pattern
- **WHEN** TemplateServlet processes the request
- **THEN** the system SHALL load the corresponding screen definition and render the HTML response using template processing

#### Scenario: Screen attributes are cached across navigation

- **GIVEN** screen attribute caching is enabled in configuration
- **WHEN** a user navigates from one screen to another
- **THEN** the system MAY preserve previous screen attributes and pass them to the next screen via hidden form variables

#### Scenario: Screen state is not cached by default

- **GIVEN** no caching configuration is specified
- **WHEN** TemplateServlet initializes
- **THEN** previous screen attributes and parameters SHALL NOT be cached (default behavior is caching disabled)
