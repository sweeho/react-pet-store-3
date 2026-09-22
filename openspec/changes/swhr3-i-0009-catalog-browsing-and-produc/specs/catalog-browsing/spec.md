## ADDED Requirements

### Requirement: Product catalog browsing interface

The system SHALL display a hierarchical catalog interface allowing customers to browse categories, products, and items with pagination and search capabilities, supporting all catalog operations through a localized web-based user interface.

#### Scenario: Customer browses product categories

- **GIVEN** the catalog home page is accessed
- **WHEN** the customer requests to view available product categories
- **THEN** the system SHALL display a paginated list of categories with names and descriptions in the selected locale

#### Scenario: Customer browses products within a category

- **GIVEN** a category is displayed
- **WHEN** the customer selects a category
- **THEN** the system SHALL display all products in that category with names and descriptions, paginated with forward/backward navigation

#### Scenario: Customer views individual item details

- **GIVEN** a product is selected
- **WHEN** the customer requests item details
- **THEN** the system SHALL display individual items with all 13 attributes including category, product name, description, price, cost, image location, and five generic attributes

#### Scenario: Customer searches for items

- **GIVEN** the search interface is displayed
- **WHEN** the customer enters search keywords
- **THEN** the system SHALL perform substring search across item names, descriptions, and attributes, returning paginated results for matching items

#### Scenario: Pagination within catalog results

- **GIVEN** a paginated catalog view is displayed
- **WHEN** pagination controls are used
- **THEN** the system SHALL support forward navigation to the next page and backward navigation to the previous page, with availability indicators for each direction

### Requirement: Catalog pagination and navigation

The system SHALL support multi-result catalog operations (categories, products, items, and search results) using offset-based pagination with start index and count parameters, providing bidirectional navigation.

#### Scenario: First page of categories is retrieved

- **GIVEN** a catalog browse operation is initiated
- **WHEN** pagination is requested with start=0 and count=10
- **THEN** the first 10 results SHALL be returned with a hasNext flag indicating whether additional pages exist

#### Scenario: Subsequent pages are navigable forward

- **GIVEN** a paginated result set with more items available
- **WHEN** getStartOfNextPage() is called to calculate the next page offset
- **THEN** the next page index SHALL equal current start + current count

#### Scenario: Previous pages are navigable backward

- **GIVEN** a paginated result set with start > 0
- **WHEN** getStartOfPreviousPage() is called
- **THEN** the previous page index SHALL equal max(start - count, 0), allowing backward navigation

#### Scenario: Page beyond last results

- **GIVEN** pagination with a start index beyond available results
- **WHEN** ResultSet.absolute(start+1) returns false
- **THEN** an empty Page SHALL be returned

### Requirement: Locale-aware catalog operations

The system SHALL support multi-locale catalog browsing where all catalog operations accept a Locale parameter that determines language and formatting of category, product, and item descriptions in query results.

#### Scenario: Catalog is retrieved in requested locale

- **GIVEN** a catalog operation is invoked with Locale parameter en_US
- **WHEN** the DAO layer constructs the SQL query
- **THEN** locale.toString() SHALL be passed as the first SQL parameter to retrieve locale-specific catalog data

#### Scenario: Different locales return different descriptions

- **GIVEN** catalog data exists for multiple locales
- **WHEN** the same operation is invoked with different Locale parameters
- **THEN** results SHALL reflect language and formatting appropriate to each locale

### Requirement: Full-text item search

The system SHALL support full-text search on Item fields (name, description, and generic attributes) using substring matching with tokenized keywords and SQL LIKE patterns.

#### Scenario: Single keyword search

- **GIVEN** a search query containing one keyword
- **WHEN** the search is executed
- **THEN** the system SHALL return all items where the keyword appears as a substring in name, description, or any of the five generic attributes

#### Scenario: Multi-keyword search

- **GIVEN** a search query containing multiple space-separated keywords
- **WHEN** the search is tokenized and executed
- **THEN** the system SHALL apply LIKE pattern matching for each keyword independently across the three searchable fields

#### Scenario: Empty search query returns no results

- **GIVEN** a search query with no keywords after tokenization
- **WHEN** the search is executed
- **WHEN** no tokens result from parsing
- **THEN** Page.EMPTY_PAGE SHALL be returned

### Requirement: Hierarchical product taxonomy

The system SHALL organize products in a three-level hierarchy: Categories contain Products, and Products contain Items, with data retrieval operations supporting each level.

#### Scenario: All products in a category retrieved

- **GIVEN** a category ID is specified
- **WHEN** getProducts(categoryID, start, count, locale) is invoked
- **THEN** all products belonging to that category SHALL be returned as a paginated Page

#### Scenario: All items in a product retrieved

- **GIVEN** a product ID is specified
- **WHEN** getItems(productID, start, count, locale) is invoked
- **THEN** all items belonging to that product SHALL be returned as a paginated Page

#### Scenario: Single entity retrieval by ID

- **GIVEN** a category ID, product ID, or item ID is specified
- **WHEN** getCategory(), getProduct(), or getItem() is invoked
- **THEN** the matching entity SHALL be returned or null if no match exists

### Requirement: Unrestricted catalog access

The system SHALL allow all callers unrestricted access to catalog browsing operations without authentication or authorization checks, making the catalog publicly browsable.

#### Scenario: Unauthenticated user accesses catalog

- **GIVEN** no user is authenticated
- **WHEN** any catalog operation is invoked
- **THEN** the operation SHALL succeed without authentication or role checks
