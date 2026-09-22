# Shopping Cart Capability Extraction

## Summary

This change extracts shopping cart functionality from the legacy application. The capability provides core e-commerce features for managing user shopping carts, including item management, price calculations, and the cart display interface.

## Extracted Capabilities

The shopping-cart capability encompasses:

- **Cart Session Management**: Maintaining stateful shopping cart during user session
- **Item Addition**: Adding items to cart with default or specified quantities
- **Item Removal**: Removing items from cart by identifier
- **Quantity Updates**: Modifying item quantities with automatic removal at zero or below
- **Cart Display**: Rendering cart contents with editable quantities and checkout link
- **Price Calculations**: Computing subtotals and line totals from items and quantities
- **Inventory Enrichment**: Fetching product details from catalog to display with cart items
- **Locale Support**: Supporting multi-language product information based on user locale
- **Cart Operations**: Clearing entire cart and retrieving item counts
- **User Actions**: Supporting purchase, remove, update, and checkout workflows

## Technical Stack

- **EJB Tier**: Stateful session bean (ShoppingCartLocalEJB) maintaining cart state
- **Entity Beans**: LineItem CMP 2.x entities storing order line items
- **Value Objects**: CartItem model objects for display enrichment
- **Web Tier**: Struts CartHTMLAction routing user actions to cart service
- **View Tier**: cart.jsp rendering items with form controls for updates
- **Integration**: CatalogHelper integration for product detail enrichment
- **Transactions**: Container-managed transactions ensuring consistency
- **Messaging**: CartEvent objects for action routing between tiers

## Key Patterns

- **Stateful Session Bean**: ShoppingCartLocalEJB maintains HashMap of itemId → quantity mappings
- **Event Pattern**: CartHTMLAction creates CartEvent objects routed to CartEJBAction
- **Enrichment Pattern**: CartItem combines cart quantity with Catalog product details
- **Double Dispatch**: Separate HTML and EJB action tiers handling web and business logic
- **Locale Propagation**: User locale passed through cart operations to catalog queries
- **Transaction Boundaries**: All cart modifications wrapped in Required transactions
