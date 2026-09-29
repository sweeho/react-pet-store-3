## 1. Shopping Cart Session Bean

- [x] 1.1 Create ShoppingCartLocalEJB stateful session bean class (SWHR3-T-0058)
- [x] 1.2 Declare private HashMap cart field for storing items (SWHR3-T-0058)
- [x] 1.3 Implement ejbCreate() to initialize HashMap (SWHR3-T-0058)
- [x] 1.4 Declare private Locale field defaulting to Locale.US (SWHR3-T-0058)
- [x] 1.5 Configure ejb-jar.xml with session-type=Stateful (SWHR3-T-0058)
- [x] 1.6 Configure transaction-type=Container in ejb-jar.xml (SWHR3-T-0058)
- [x] 1.7 Create ShoppingCartLocal interface with method signatures (SWHR3-T-0058)
- [x] 1.8 Create ShoppingCartLocalHome interface for JNDI lookup (SWHR3-T-0058)

## 2. Item Addition Operations

- [x] 2.1 Implement addItem(String itemId) method with quantity 1 default (SWHR3-T-0059)
- [x] 2.2 Implement addItem(String itemId, int qty) overload for explicit quantity (SWHR3-T-0059)
- [x] 2.3 Add both method signatures to ShoppingCartLocal interface (SWHR3-T-0059)
- [x] 2.4 Declare container-transaction with trans-attribute=Required for addItem (SWHR3-T-0059)
- [x] 2.5 Test item addition with default and explicit quantities (SWHR3-T-0059)

## 3. Item Removal Operations

- [x] 3.1 Implement deleteItem(String itemId) method (SWHR3-T-0060)
- [x] 3.2 Add deleteItem method to ShoppingCartLocal interface (SWHR3-T-0060)
- [x] 3.3 Declare container-transaction with trans-attribute=Required for deleteItem (SWHR3-T-0060)
- [x] 3.4 Implement item removal via HashMap.remove() (SWHR3-T-0060)
- [x] 3.5 Test single item removal from cart (SWHR3-T-0060)

## 4. Quantity Update Operations

- [x] 4.1 Implement updateItemQuantity(String itemId, int newQty) method (SWHR3-T-0061)
- [x] 4.2 Add updateItemQuantity method to ShoppingCartLocal interface (SWHR3-T-0061)
- [x] 4.3 Implement quantity 0 or negative removal logic (remove and re-add only if > 0) (SWHR3-T-0061)
- [x] 4.4 Declare container-transaction with trans-attribute=Required for updateItemQuantity (SWHR3-T-0061)
- [x] 4.5 Test quantity update with positive, zero, and negative values (SWHR3-T-0061)

## 5. Cart Retrieval and Enrichment

- [x] 5.1 Implement getDetails() method returning HashMap copy (SWHR3-T-0062)
- [x] 5.2 Implement getItems() method using CatalogHelper for enrichment (SWHR3-T-0062)
- [x] 5.3 Create CartItem value object from catalog Item and cart quantity (SWHR3-T-0062)
- [x] 5.4 Handle CatalogException with logging and item skip (SWHR3-T-0062)
- [x] 5.5 Return collection of CartItem objects for display (SWHR3-T-0062)
- [x] 5.6 Add getItems method to ShoppingCartLocal interface (SWHR3-T-0062)

## 6. Cart Calculations

- [x] 6.1 Implement getSubTotal() method iterating through CartItems (SWHR3-T-0063)
- [x] 6.2 Calculate subtotal as sum of (quantity × unitCost) per item (SWHR3-T-0063)
- [x] 6.3 Handle null items collection gracefully (SWHR3-T-0063)
- [x] 6.4 Return Double for subtotal value (SWHR3-T-0063)
- [x] 6.5 Add getSubTotal method to ShoppingCartLocal interface (SWHR3-T-0063)
- [x] 6.6 Test subtotal calculation with multiple items (SWHR3-T-0063)

## 7. Item and Cart Counts

- [x] 7.1 Implement getCount() method returning HashMap.size() (SWHR3-T-0064)
- [x] 7.2 Implement getDetails() to return internal HashMap copy (SWHR3-T-0064)
- [x] 7.3 Add getCount method to ShoppingCartLocal interface (SWHR3-T-0064)
- [x] 7.4 Add getDetails method to ShoppingCartLocal interface (SWHR3-T-0064)
- [x] 7.5 Test count retrieval with empty, single, and multiple items (SWHR3-T-0064)

## 8. Locale Support

- [x] 8.1 Implement setLocale(Locale locale) method (SWHR3-T-0065)
- [x] 8.2 Add setLocale method to ShoppingCartLocal interface (SWHR3-T-0065)
- [x] 8.3 Declare container-transaction with trans-attribute=Required for setLocale (SWHR3-T-0065)
- [x] 8.4 Use stored locale in getItems() when calling catalog.getItem() (SWHR3-T-0065)
- [x] 8.5 Test locale propagation to catalog lookups (SWHR3-T-0065)

## 9. Cart Clearing

- [x] 9.1 Implement empty() method calling HashMap.clear() (SWHR3-T-0066)
- [x] 9.2 Add empty method to ShoppingCartLocal interface (SWHR3-T-0066)
- [x] 9.3 Declare container-transaction with trans-attribute=Required for empty (SWHR3-T-0066)
- [x] 9.4 Test cart clearing operation (SWHR3-T-0066)

## 10. CartItem Value Object

- [x] 10.1 Create CartItem class with fields: itemId, productId, category, name, attribute, quantity, unitCost (SWHR3-T-0067)
- [x] 10.2 Implement constructor with all seven parameters (SWHR3-T-0067)
- [x] 10.3 Implement getter methods for all fields (SWHR3-T-0067)
- [x] 10.4 Implement getTotalCost() calculated property (quantity × unitCost) (SWHR3-T-0067)
- [x] 10.5 Implement Serializable interface for EJB transport (SWHR3-T-0067)
- [x] 10.6 Test CartItem creation and calculations (SWHR3-T-0067)

## 11. Security Configuration

- [x] 11.1 Add method-permission with unchecked element to ejb-jar.xml (SWHR3-T-0068)
- [x] 11.2 Apply unchecked permission to all cart methods (SWHR3-T-0068)
- [x] 11.3 Test that all users can access cart operations without role restrictions (SWHR3-T-0068)

## 12. Web Tier Action Handler

- [x] 12.1 Create CartHTMLAction class extending Struts Action (SWHR3-T-0069)
- [x] 12.2 Implement perform(HttpServletRequest) parsing action parameter (SWHR3-T-0069)
- [x] 12.3 Handle "purchase" action creating ADD_ITEM CartEvent (SWHR3-T-0069)
- [x] 12.4 Handle "remove" action creating DELETE_ITEM CartEvent (SWHR3-T-0069)
- [x] 12.5 Handle "update" action parsing itemQuantity\_ parameters (SWHR3-T-0069)
- [x] 12.6 Extract itemId from itemQuantity\_ form field names (SWHR3-T-0069)
- [x] 12.7 Parse quantity values with NumberFormatException handling (default 0) (SWHR3-T-0069)
- [x] 12.8 Create UPDATE_ITEMS CartEvent with items map (SWHR3-T-0069)
- [x] 12.9 Handle empty actionType gracefully (SWHR3-T-0069)

## 13. EJB Tier Action Handler

- [x] 13.1 Create CartEJBAction class for EJB-tier dispatch (SWHR3-T-0070)
- [x] 13.2 Implement perform(CartEvent) method (SWHR3-T-0070)
- [x] 13.3 Handle CartEvent.ADD_ITEM action calling cart.addItem() (SWHR3-T-0070)
- [x] 13.4 Handle CartEvent.DELETE_ITEM action calling cart.deleteItem() (SWHR3-T-0070)
- [x] 13.5 Handle CartEvent.UPDATE_ITEMS iterating map and calling updateItemQuantity() (SWHR3-T-0070)
- [x] 13.6 Handle CartEvent.EMPTY action calling cart.empty() (SWHR3-T-0070)
- [x] 13.7 Test action dispatch routing (SWHR3-T-0070)

## 14. Catalog Integration

- [x] 14.1 Create CatalogHelper for cart item enrichment (SWHR3-T-0071)
- [x] 14.2 Implement getItem(itemId, locale) lookup method (SWHR3-T-0071)
- [x] 14.3 Return full Item object with product details (SWHR3-T-0071)
- [x] 14.4 Handle CatalogException gracefully (SWHR3-T-0071)
- [x] 14.5 Test catalog integration and exception handling (SWHR3-T-0071)

## 15. Cart Display View

- [ ] 15.1 Create cart.jsp page rendering shopping cart (SWHR3-T-0072)
- [ ] 15.2 Use JSTL <c:choose> for empty vs populated cart states (SWHR3-T-0072)
- [ ] 15.3 Display "Your Shopping Cart is Empty" message when cart.count == 0 (SWHR3-T-0072)
- [ ] 15.4 Create table structure for cart items (SWHR3-T-0072)
- [ ] 15.5 Add columns: item name/attribute, remove link, quantity input, unit price, line total (SWHR3-T-0072)
- [ ] 15.6 Use <c:forEach> to iterate cart.items (SWHR3-T-0072)
- [ ] 15.7 Create quantity input fields with name pattern itemQuantity\_<itemId> (SWHR3-T-0072)
- [ ] 15.8 Display line totals calculated from quantity and unit price (SWHR3-T-0072)
- [ ] 15.9 Display cart subtotal row with total currency formatting (SWHR3-T-0072)
- [ ] 15.10 Add "Update Cart" form submit button (SWHR3-T-0072)
- [ ] 15.11 Add "Check Out" link pointing to order entry page (SWHR3-T-0072)
- [ ] 15.12 Apply petstore CSS styling to cart display (SWHR3-T-0072)

## 16. Struts Configuration

- [x] 16.1 Map CartHTMLAction in struts-config.xml (SWHR3-T-0073)
- [x] 16.2 Map CartEJBAction in struts-config.xml (SWHR3-T-0073)
- [x] 16.3 Configure forward for cart display page (SWHR3-T-0073)
- [x] 16.4 Configure forward for checkout transition (SWHR3-T-0073)
- [x] 16.5 Configure exception handlers for cart errors (SWHR3-T-0073)

## 17. Integration Testing

- [ ] 17.1 Test add item workflow with purchase action (SWHR3-T-0074)
- [ ] 17.2 Test remove item workflow with remove action (SWHR3-T-0074)
- [ ] 17.3 Test update quantity workflow with update action (SWHR3-T-0074)
- [ ] 17.4 Test empty cart display with zero items (SWHR3-T-0074)
- [ ] 17.5 Test populated cart with multiple items (SWHR3-T-0074)
- [ ] 17.6 Test quantity defaults and overloads (SWHR3-T-0074)
- [ ] 17.7 Test subtotal calculation accuracy (SWHR3-T-0074)
- [ ] 17.8 Test cart clearing operation (SWHR3-T-0074)
- [ ] 17.9 Test locale propagation to catalog (SWHR3-T-0074)
- [ ] 17.10 Test transaction rollback on failures (SWHR3-T-0074)

## 18. Error Handling

- [x] 18.1 Test invalid quantity input (non-numeric) handling (SWHR3-T-0075)
- [x] 18.2 Test catalog lookup failure graceful degradation (SWHR3-T-0075)
- [x] 18.3 Test missing itemId parameter handling (SWHR3-T-0075)
- [x] 18.4 Test session timeout behavior (SWHR3-T-0075)
- [x] 18.5 Test concurrent cart access in clustered environment (SWHR3-T-0075)
