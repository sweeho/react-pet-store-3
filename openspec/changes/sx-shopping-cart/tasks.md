## 1. Shopping Cart Session Bean

- [ ] 1.1 Create ShoppingCartLocalEJB stateful session bean class
- [ ] 1.2 Declare private HashMap cart field for storing items
- [ ] 1.3 Implement ejbCreate() to initialize HashMap
- [ ] 1.4 Declare private Locale field defaulting to Locale.US
- [ ] 1.5 Configure ejb-jar.xml with session-type=Stateful
- [ ] 1.6 Configure transaction-type=Container in ejb-jar.xml
- [ ] 1.7 Create ShoppingCartLocal interface with method signatures
- [ ] 1.8 Create ShoppingCartLocalHome interface for JNDI lookup

## 2. Item Addition Operations

- [ ] 2.1 Implement addItem(String itemId) method with quantity 1 default
- [ ] 2.2 Implement addItem(String itemId, int qty) overload for explicit quantity
- [ ] 2.3 Add both method signatures to ShoppingCartLocal interface
- [ ] 2.4 Declare container-transaction with trans-attribute=Required for addItem
- [ ] 2.5 Test item addition with default and explicit quantities

## 3. Item Removal Operations

- [ ] 3.1 Implement deleteItem(String itemId) method
- [ ] 3.2 Add deleteItem method to ShoppingCartLocal interface
- [ ] 3.3 Declare container-transaction with trans-attribute=Required for deleteItem
- [ ] 3.4 Implement item removal via HashMap.remove()
- [ ] 3.5 Test single item removal from cart

## 4. Quantity Update Operations

- [ ] 4.1 Implement updateItemQuantity(String itemId, int newQty) method
- [ ] 4.2 Add updateItemQuantity method to ShoppingCartLocal interface
- [ ] 4.3 Implement quantity 0 or negative removal logic (remove and re-add only if > 0)
- [ ] 4.4 Declare container-transaction with trans-attribute=Required for updateItemQuantity
- [ ] 4.5 Test quantity update with positive, zero, and negative values

## 5. Cart Retrieval and Enrichment

- [ ] 5.1 Implement getDetails() method returning HashMap copy
- [ ] 5.2 Implement getItems() method using CatalogHelper for enrichment
- [ ] 5.3 Create CartItem value object from catalog Item and cart quantity
- [ ] 5.4 Handle CatalogException with logging and item skip
- [ ] 5.5 Return collection of CartItem objects for display
- [ ] 5.6 Add getItems method to ShoppingCartLocal interface

## 6. Cart Calculations

- [ ] 6.1 Implement getSubTotal() method iterating through CartItems
- [ ] 6.2 Calculate subtotal as sum of (quantity × unitCost) per item
- [ ] 6.3 Handle null items collection gracefully
- [ ] 6.4 Return Double for subtotal value
- [ ] 6.5 Add getSubTotal method to ShoppingCartLocal interface
- [ ] 6.6 Test subtotal calculation with multiple items

## 7. Item and Cart Counts

- [ ] 7.1 Implement getCount() method returning HashMap.size()
- [ ] 7.2 Implement getDetails() to return internal HashMap copy
- [ ] 7.3 Add getCount method to ShoppingCartLocal interface
- [ ] 7.4 Add getDetails method to ShoppingCartLocal interface
- [ ] 7.5 Test count retrieval with empty, single, and multiple items

## 8. Locale Support

- [ ] 8.1 Implement setLocale(Locale locale) method
- [ ] 8.2 Add setLocale method to ShoppingCartLocal interface
- [ ] 8.3 Declare container-transaction with trans-attribute=Required for setLocale
- [ ] 8.4 Use stored locale in getItems() when calling catalog.getItem()
- [ ] 8.5 Test locale propagation to catalog lookups

## 9. Cart Clearing

- [ ] 9.1 Implement empty() method calling HashMap.clear()
- [ ] 9.2 Add empty method to ShoppingCartLocal interface
- [ ] 9.3 Declare container-transaction with trans-attribute=Required for empty
- [ ] 9.4 Test cart clearing operation

## 10. CartItem Value Object

- [ ] 10.1 Create CartItem class with fields: itemId, productId, category, name, attribute, quantity, unitCost
- [ ] 10.2 Implement constructor with all seven parameters
- [ ] 10.3 Implement getter methods for all fields
- [ ] 10.4 Implement getTotalCost() calculated property (quantity × unitCost)
- [ ] 10.5 Implement Serializable interface for EJB transport
- [ ] 10.6 Test CartItem creation and calculations

## 11. Security Configuration

- [ ] 11.1 Add method-permission with unchecked element to ejb-jar.xml
- [ ] 11.2 Apply unchecked permission to all cart methods
- [ ] 11.3 Test that all users can access cart operations without role restrictions

## 12. Web Tier Action Handler

- [ ] 12.1 Create CartHTMLAction class extending Struts Action
- [ ] 12.2 Implement perform(HttpServletRequest) parsing action parameter
- [ ] 12.3 Handle "purchase" action creating ADD_ITEM CartEvent
- [ ] 12.4 Handle "remove" action creating DELETE_ITEM CartEvent
- [ ] 12.5 Handle "update" action parsing itemQuantity\_ parameters
- [ ] 12.6 Extract itemId from itemQuantity\_ form field names
- [ ] 12.7 Parse quantity values with NumberFormatException handling (default 0)
- [ ] 12.8 Create UPDATE_ITEMS CartEvent with items map
- [ ] 12.9 Handle empty actionType gracefully

## 13. EJB Tier Action Handler

- [ ] 13.1 Create CartEJBAction class for EJB-tier dispatch
- [ ] 13.2 Implement perform(CartEvent) method
- [ ] 13.3 Handle CartEvent.ADD_ITEM action calling cart.addItem()
- [ ] 13.4 Handle CartEvent.DELETE_ITEM action calling cart.deleteItem()
- [ ] 13.5 Handle CartEvent.UPDATE_ITEMS iterating map and calling updateItemQuantity()
- [ ] 13.6 Handle CartEvent.EMPTY action calling cart.empty()
- [ ] 13.7 Test action dispatch routing

## 14. Catalog Integration

- [ ] 14.1 Create CatalogHelper for cart item enrichment
- [ ] 14.2 Implement getItem(itemId, locale) lookup method
- [ ] 14.3 Return full Item object with product details
- [ ] 14.4 Handle CatalogException gracefully
- [ ] 14.5 Test catalog integration and exception handling

## 15. Cart Display View

- [ ] 15.1 Create cart.jsp page rendering shopping cart
- [ ] 15.2 Use JSTL <c:choose> for empty vs populated cart states
- [ ] 15.3 Display "Your Shopping Cart is Empty" message when cart.count == 0
- [ ] 15.4 Create table structure for cart items
- [ ] 15.5 Add columns: item name/attribute, remove link, quantity input, unit price, line total
- [ ] 15.6 Use <c:forEach> to iterate cart.items
- [ ] 15.7 Create quantity input fields with name pattern itemQuantity\_<itemId>
- [ ] 15.8 Display line totals calculated from quantity and unit price
- [ ] 15.9 Display cart subtotal row with total currency formatting
- [ ] 15.10 Add "Update Cart" form submit button
- [ ] 15.11 Add "Check Out" link pointing to order entry page
- [ ] 15.12 Apply petstore CSS styling to cart display

## 16. Struts Configuration

- [ ] 16.1 Map CartHTMLAction in struts-config.xml
- [ ] 16.2 Map CartEJBAction in struts-config.xml
- [ ] 16.3 Configure forward for cart display page
- [ ] 16.4 Configure forward for checkout transition
- [ ] 16.5 Configure exception handlers for cart errors

## 17. Integration Testing

- [ ] 17.1 Test add item workflow with purchase action
- [ ] 17.2 Test remove item workflow with remove action
- [ ] 17.3 Test update quantity workflow with update action
- [ ] 17.4 Test empty cart display with zero items
- [ ] 17.5 Test populated cart with multiple items
- [ ] 17.6 Test quantity defaults and overloads
- [ ] 17.7 Test subtotal calculation accuracy
- [ ] 17.8 Test cart clearing operation
- [ ] 17.9 Test locale propagation to catalog
- [ ] 17.10 Test transaction rollback on failures

## 18. Error Handling

- [ ] 18.1 Test invalid quantity input (non-numeric) handling
- [ ] 18.2 Test catalog lookup failure graceful degradation
- [ ] 18.3 Test missing itemId parameter handling
- [ ] 18.4 Test session timeout behavior
- [ ] 18.5 Test concurrent cart access in clustered environment
