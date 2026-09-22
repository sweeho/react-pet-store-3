# Catalog Browsing Capability Extraction

## Summary

This change extracts the catalog browsing capability from the legacy application into OpenSpec requirements. The catalog browsing capability provides customers with a hierarchical interface to discover and browse product categories, products, and items with support for pagination, full-text search, and multi-locale display.

## Extracted Capabilities

The catalog-browsing capability encompasses:

- **Hierarchy Navigation**: Three-level taxonomy (Categories > Products > Items)
- **Data Access**: EJB-based catalog service with DAO factory pattern
- **Pagination**: Offset-based navigation with bidirectional traversal
- **Search**: Full-text substring search across item names, descriptions, and attributes
- **Localization**: Locale-aware queries supporting multiple languages
- **Access Control**: Unrestricted public access to all catalog operations
- **Transaction Management**: Container-managed transactions on all operations

## Key Design Patterns

1. **DAO Factory Pattern**: Database-agnostic DAO implementation selection via JNDI configuration
2. **Stateless EJB Service**: Catalog EJB facade encapsulating all catalog operations with Required transaction semantics
3. **Pagination Container**: Page object managing result sets with forward/backward navigation calculations
4. **Locale-Parameterized Queries**: All database operations parameterized with locale for i18n support
5. **Unrestricted Access**: Declarative security with unchecked permission on all methods

## Technical Stack

- **Service Tier**: Stateless Session Bean (CatalogEJB) with Local interface
- **Data Access**: Generic DAO pattern with JDBC and parameterized SQL
- **Pagination**: ResultSet.absolute() positioning with count-based row limiting
- **Search**: LIKE pattern matching with wildcard parameters
- **Configuration**: JNDI environment entries for DAO class and database selection
- **Transactions**: Container-managed (CMT) with Required attribute

## Entity Model

- **Category**: id, name, description
- **Product**: id, name, description (hierarchically linked to Category)
- **Item**: 13 attributes including category, productId, productName, itemId, description, listPrice, unitCost, imageLocation, attribute1-5 (linked to Product)
- **Page**: Pagination container with List, start index, hasNext flag, and navigation helpers

## Risks and Ambiguities

1. **Generic Attributes**: Five generic attributes (attribute1-5) on Item entity lack semantic documentation
2. **Search Semantics**: Multi-keyword search logic (AND vs. OR) not explicitly documented
3. **Database Escape Behavior**: LIKE pattern behavior with special characters database-dependent
4. **Configuration Redaction**: DAO class name and database type stored in redacted environment entries
5. **buildSQLStatement Method**: SQL construction from XML configuration not visible in provided source

## Out of Scope

- Shopping cart integration (separate shopping-cart capability)
- Order processing (separate order-workflow capability)
- Product administration and catalog management
- Inventory management
- Dynamic pricing or promotional pricing
