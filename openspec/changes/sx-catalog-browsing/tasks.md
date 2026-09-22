## 1. Data Model

- [ ] 1.1 Define Category entity with id, name, and description fields as serializable
- [ ] 1.2 Define Product entity with id, name, and description fields as serializable
- [ ] 1.3 Define Item entity with 13 fields: category, productId, productName, itemId, description, listPrice, unitCost, imageLocation, attribute1-5
- [ ] 1.4 Define Page pagination container with objects list, start index, and hasNext boolean
- [ ] 1.5 Implement Page navigation methods: isNextPageAvailable(), isPreviousPageAvailable(), getStartOfNextPage(), getStartOfPreviousPage()

## 2. EJB Service Layer

- [ ] 2.1 Declare CatalogLocal stateless session bean interface with seven business methods
- [ ] 2.2 Implement CatalogEJB stateless session bean with ejbCreate() and destroy() lifecycle
- [ ] 2.3 Initialize CatalogDAO via CatalogDAOFactory in ejbCreate()
- [ ] 2.4 Implement all seven business method delegations to DAO layer in CatalogEJB

## 3. DAO and Data Access

- [ ] 3.1 Define CatalogDAO interface contract for all data access operations
- [ ] 3.2 Implement GenericCatalogDAO with JDBC and parameterized SQL queries
- [ ] 3.3 Create CatalogDAOFactory to instantiate database-specific DAO implementations
- [ ] 3.4 Configure JNDI environment entries for DAO class selection and database type

## 4. Single Entity Retrieval

- [ ] 4.1 Implement getCategory(String categoryID, Locale locale) with null return for no match
- [ ] 4.2 Implement getProduct(String productID, Locale locale) with null return for no match
- [ ] 4.3 Implement getItem(String itemID, Locale locale) with null return for no match
- [ ] 4.4 Ensure all single-entity methods pass locale.toString() as first SQL parameter

## 5. Hierarchical Browsing

- [ ] 5.1 Implement getProducts(String categoryID, int start, int count, Locale locale) pagination
- [ ] 5.2 Implement getItems(String productID, int start, int count, Locale locale) pagination
- [ ] 5.3 Implement getCategories(int start, int count, Locale locale) root-level pagination
- [ ] 5.4 Ensure hierarchical queries filter by parent ID and return paginated Page objects

## 6. Pagination Implementation

- [ ] 6.1 Implement offset-based pagination using ResultSet.absolute(start+1) positioning
- [ ] 6.2 Implement count-based row limiting with while loop and decrement
- [ ] 6.3 Calculate hasNext flag by attempting ResultSet.next() after collecting count rows
- [ ] 6.4 Return Page objects with original start index for navigation calculation
- [ ] 6.5 Handle edge case when start index is beyond available results (return empty Page)

## 7. Full-Text Search

- [ ] 7.1 Implement searchItems(String searchQuery, int start, int count, Locale locale) method
- [ ] 7.2 Tokenize search query on whitespace using StringTokenizer
- [ ] 7.3 Return Page.EMPTY_PAGE when query yields no tokens after tokenization
- [ ] 7.4 Build LIKE patterns with "%keyword%" for each token
- [ ] 7.5 Apply patterns across three searchable fields in parameterized SQL
- [ ] 7.6 Return paginated search results with same Page contract as other operations

## 8. Locale Support

- [ ] 8.1 Add Locale parameter to all seven catalog method signatures
- [ ] 8.2 Pass locale.toString() as first SQL parameter in all DAO queries
- [ ] 8.3 Configure database to return locale-specific description strings
- [ ] 8.4 Ensure locale parameter flows from web tier through EJB to DAO layer

## 9. Transaction Management

- [ ] 9.1 Declare all seven business methods with trans-attribute=Required in ejb-jar.xml
- [ ] 9.2 Verify container-managed transaction enforcement at deployment
- [ ] 9.3 Ensure all data access operations participate in transactions
- [ ] 9.4 Handle transaction rollback on exceptions (CatalogDAOSysException)

## 10. Security and Access Control

- [ ] 10.1 Declare method-permission with unchecked element for all CatalogEJB methods
- [ ] 10.2 Verify no authentication or authorization checks on catalog operations
- [ ] 10.3 Confirm public access to all catalog browsing functionality
- [ ] 10.4 Document unrestricted access policy in deployment descriptors

## 11. Database Configuration

- [ ] 11.1 Define JDBC DataSource for catalog database in web.xml resource-ref
- [ ] 11.2 Configure connection pooling and lifecycle management
- [ ] 11.3 Define SQL queries for getCategory, getCategories, getProduct, getProducts, getItem, getItems, searchItems
- [ ] 11.4 Implement buildSQLStatement() method for dynamic SQL construction from configuration

## 12. Web Tier Integration

- [ ] 12.1 Implement category.jsp displaying paginated categories
- [ ] 12.2 Implement product.jsp displaying paginated products within category
- [ ] 12.3 Implement item.jsp displaying all 13 item attributes and image
- [ ] 12.4 Add search interface and form handling for searchItems() invocation
- [ ] 12.5 Implement pagination controls with forward/backward navigation
- [ ] 12.6 Support locale selection and pass locale through request flow

## 13. Error Handling

- [ ] 13.1 Define CatalogDAOSysException for data access layer errors
- [ ] 13.2 Handle connection errors gracefully in DAO methods
- [ ] 13.3 Handle SQL parsing and execution errors in buildSQLStatement()
- [ ] 13.4 Provide meaningful error responses when entity not found
- [ ] 13.5 Propagate exceptions from DAO to EJB to web tier appropriately

## 14. Testing and Validation

- [ ] 14.1 Create unit tests for Category, Product, Item entity construction
- [ ] 14.2 Create unit tests for Page pagination calculations
- [ ] 14.3 Create integration tests for single entity retrieval by ID
- [ ] 14.4 Create integration tests for hierarchical browsing (getProducts, getItems)
- [ ] 14.5 Create integration tests for pagination with multiple pages
- [ ] 14.6 Create integration tests for full-text search with various keywords
- [ ] 14.7 Create locale-specific tests verifying i18n behavior
- [ ] 14.8 Test unrestricted access without authentication
- [ ] 14.9 Verify transaction semantics with transaction monitoring
- [ ] 14.10 Performance test pagination with large result sets
