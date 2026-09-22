# Catalog Browsing Design

## Architecture Overview

The catalog browsing capability is implemented as a three-tier system:

1. **Web Tier**: JSP-based presentation layer (category.jsp, product.jsp, item.jsp)
2. **EJB Tier**: Stateless Catalog EJB service with Local interface
3. **Data Access Tier**: DAO factory pattern with database-specific implementations

### Data Model

**Entity Hierarchy**:

```
Category
  └── Product
       └── Item (13 fields)
```

**Page Container**: Represents paginated result sets with:

- `objects`: List of Category/Product/Item entities
- `start`: Starting index (0-based)
- `hasNext`: Boolean indicating more results available
- Navigation methods: `isNextPageAvailable()`, `isPreviousPageAvailable()`, `getStartOfNextPage()`, `getStartOfPreviousPage()`

### Service Interface

**CatalogLocal EJB Interface** (Stateless Session Bean):

- `getCategory(String categoryID, Locale l)` → Category
- `getCategories(int start, int count, Locale l)` → Page
- `getProduct(String productID, Locale l)` → Product
- `getProducts(String categoryID, int start, int count, Locale l)` → Page
- `getItem(String itemID, Locale l)` → Item
- `getItems(String productID, int start, int count, Locale l)` → Page
- `searchItems(String searchQuery, int start, int count, Locale l)` → Page

All methods:

- Accept Locale parameter for i18n support
- Have trans-attribute=Required for container-managed transactions
- Allow unchecked (unrestricted) access

### Data Access Layer

**CatalogDAO Interface**:

- Defines contract for all data access operations
- Implemented by GenericCatalogDAO (JDBC-based)
- Created via CatalogDAOFactory.getDAO()

**GenericCatalogDAO**:

- Uses JDBC with Connection pooling via DataSource
- Parameterized SQL queries via buildSQLStatement() method
- Result set mapping constructs entity objects from ResultSet rows
- Pagination via ResultSet.absolute(start+1) positioning

### Pagination Strategy

**Offset-Based Pagination**:

- Request includes `start` (starting index) and `count` (maximum rows)
- DAO positions ResultSet to start+1 using absolute()
- Iterates while hasNext and count > 0, collecting entities
- Returns Page object with retrieved objects, original start index, and hasNext flag

**Navigation Calculations**:

- Next page offset: `start + objects.size()`
- Previous page offset: `Math.max(start - objects.size(), 0)`

### Search Implementation

**searchItems(String searchQuery, int start, int count, Locale locale)**:

1. Tokenize searchQuery on whitespace using StringTokenizer
2. If no tokens result, return Page.EMPTY_PAGE
3. For each keyword, build LIKE patterns with wildcards: "%keyword%"
4. Apply parameterized SQL with patterns matching across three fields
5. Return paginated results

**Search Fields**:

- Item description
- Item name
- Item attributes (attribute1-5)

### Locale Support

**Locale-Aware Queries**:

- All methods accept java.util.Locale parameter
- DAO passes `locale.toString()` as first parameter in SQL queries
- Database stores and returns descriptions in the requested locale
- Caller responsible for selecting appropriate locale

### Configuration

**JNDI Environment Entries**:

- `param/CatalogDAOClass`: Fully qualified DAO class name (REDACTED)
- `param/CatalogDAODatabase`: Database type identifier (REDACTED)

**CatalogEJB Lifecycle**:

- `ejbCreate()`: Initializes DAO via CatalogDAOFactory.getDAO()
- `destroy()`: Cleans up DAO reference

### Security

**Method Permission**:

- All methods declared with unchecked permission
- No authentication or role-based authorization
- Publicly accessible catalog browsing

**Transaction Attribute**:

- All methods: trans-attribute=Required
- Each invocation either joins existing transaction or creates new one
- Ensures data consistency and ACID compliance

## Legacy Implementation Notes

### JSP Pages

- **category.jsp**: Displays categories with names and descriptions
- **product.jsp**: Displays products within selected category
- **item.jsp**: Displays item details with all 13 attributes and image
- Screen templates include banner, sidebar, body, and footer components

### Database Schema

The buildSQLStatement() method constructs SQL from external configuration (not visible in provided source) using:

- XML_GET_CATEGORIES: Query for paginated category listing
- XML_GET_PRODUCTS: Query for products in category
- XML_GET_ITEMS: Query for items in product
- XML_GET_ITEM: Query for single item by ID
- XML_SEARCH_ITEMS: Query for item search by keywords

### Result Set Mapping

Entity construction from ResultSet columns:

- **Category**: id (column 1), name (column 2), description (column 3)
- **Product**: id (column 1), name (column 2), description (column 3)
- **Item**: 13-field construction in getItem() and getItems() methods

### DataSource Configuration

- Declared in web.xml as resource-ref: `jdbc/CatalogDB`
- Fast Lane Reader pattern: Direct JDBC access from web tier
- Connection pooling via container DataSource

## Constraints and Assumptions

1. **ResultSet Positioning**: Relies on JDBC driver support for ResultSet.absolute()
2. **Pagination Offset**: Assumes stable row ordering between requests (no row insertions/deletions between pages)
3. **Search Tokenization**: Whitespace is sole delimiter; no quoted phrase support
4. **Locale String Format**: Relies on standard Locale.toString() format for database queries
5. **DAO Factory Configuration**: Database-specific DAO class must be on classpath and loadable by ClassLoader
6. **SQL Construction**: buildSQLStatement() method signature and SQL source not documented in available code

## Performance Considerations

- Single result set fetch per operation (no n+1 queries)
- Pagination reduces memory usage for large result sets via offset positioning
- Locale string passed as SQL parameter avoids dynamic SQL construction
- DAO factory pattern allows database-specific optimization strategies
