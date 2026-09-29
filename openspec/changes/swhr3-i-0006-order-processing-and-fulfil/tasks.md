## 1. Order Validation

- [ ] 1.1 Implement cart validation (must not be empty) before order creation (SWHR3-T-0109)
- [ ] 1.2 Implement customer authentication and session validation (SWHR3-T-0109)
- [ ] 1.3 Validate billing and shipping address completeness (SWHR3-T-0109)
- [ ] 1.4 Validate credit card information present (SWHR3-T-0109)

## 2. Order Creation

- [ ] 2.1 Generate unique order ID via UniqueIdGenerator (SWHR3-T-0110)
- [ ] 2.2 Create PurchaseOrder entity with order ID, date, customer ID (SWHR3-T-0110)
- [ ] 2.3 Set billing address (BillTo) from checkout form (SWHR3-T-0110)
- [ ] 2.4 Set shipping address (ShipTo) from checkout form (SWHR3-T-0110)
- [ ] 2.5 Set credit card payment method (SWHR3-T-0110)
- [ ] 2.6 Calculate order total from cart line items (SWHR3-T-0110)
- [ ] 2.7 Persist PurchaseOrder entity (SWHR3-T-0110)

## 3. Line Item Management

- [ ] 3.1 Create LineItem entity for each cart item (SWHR3-T-0111)
- [ ] 3.2 Set product ID, item ID, quantity on line items (SWHR3-T-0111)
- [ ] 3.3 Set unit price and calculate line total (SWHR3-T-0111)
- [ ] 3.4 Associate line items with PurchaseOrder (SWHR3-T-0111)
- [ ] 3.5 Persist line items to database (SWHR3-T-0111)

## 4. Payment Processing

- [ ] 4.1 Invoke payment processor with credit card and order total (SWHR3-T-0112)
- [ ] 4.2 Handle payment processor response (approved/declined/error) (SWHR3-T-0112)
- [ ] 4.3 Store transaction ID and authorization code (SWHR3-T-0112)
- [ ] 4.4 Update order status to PAID on successful charge (SWHR3-T-0112)
- [ ] 4.5 Implement payment failure handling and error messaging (SWHR3-T-0112)

## 5. Order Status Management

- [ ] 5.1 Define order status enumeration (PENDING, PAID, CONFIRMED, ALLOCATED, SHIPPED, DELIVERED, COMPLETED) (SWHR3-T-0113)
- [ ] 5.2 Implement status transition validation in ProcessManager (SWHR3-T-0113)
- [ ] 5.3 Implement status update methods on PurchaseOrder (SWHR3-T-0113)
- [ ] 5.4 Persist status changes to database (SWHR3-T-0113)
- [ ] 5.5 Track status change timestamps (SWHR3-T-0113)

## 6. Order Notifications

- [ ] 6.1 Create order confirmation notification message (SWHR3-T-0114)
- [ ] 6.2 Queue notification to async message queue (SWHR3-T-0114)
- [ ] 6.3 Include order details in notification (order ID, items, total, shipping date estimate) (SWHR3-T-0114)
- [ ] 6.4 Implement notification error handling (SWHR3-T-0114)

## 7. Inventory Integration

- [x] 7.1 Reserve inventory items for ordered products (SWHR3-T-0115)
- [x] 7.2 Update inventory availability counts (SWHR3-T-0115)
- [x] 7.3 Handle out-of-stock items (backorder or cancel) (SWHR3-T-0115)
- [x] 7.4 Track inventory reservations by order ID (SWHR3-T-0115)

## 8. Supplier PO Generation

- [x] 8.1 Determine which items require supplier fulfillment (SWHR3-T-0116)
- [x] 8.2 Group items by supplier (SWHR3-T-0116)
- [x] 8.3 Create SupplierPO entity for each supplier (SWHR3-T-0116)
- [x] 8.4 Add line items to supplier POs (SWHR3-T-0116)
- [x] 8.5 Set delivery date expectations (SWHR3-T-0116)
- [x] 8.6 Persist supplier POs (SWHR3-T-0116)

## 9. Order Processing Facade

- [ ] 9.1 Create OrderProcessingFacade coordinating facade (SWHR3-T-0117)
- [ ] 9.2 Implement processOrder(OrderEvent) orchestration method (SWHR3-T-0117)
- [ ] 9.3 Coordinate payment, inventory, notification components (SWHR3-T-0117)
- [ ] 9.4 Implement transaction management for facade (SWHR3-T-0117)
- [ ] 9.5 Implement exception handling and rollback logic (SWHR3-T-0117)

## 10. Process Manager

- [ ] 10.1 Create ProcessManager state machine (SWHR3-T-0118)
- [ ] 10.2 Implement order status state transitions (SWHR3-T-0118)
- [ ] 10.3 Validate state transition rules (SWHR3-T-0118)
- [ ] 10.4 Implement status change notifications (SWHR3-T-0118)
- [ ] 10.5 Coordinate subprocess execution per state (SWHR3-T-0118)

## 11. EJB Transaction Management

- [ ] 11.1 Configure CMT (Container-Managed Transactions) for all order operations (SWHR3-T-0119)
- [ ] 11.2 Set transaction attribute to Required for order creation (SWHR3-T-0119)
- [ ] 11.3 Set transaction attribute to Required for line item creation (SWHR3-T-0119)
- [ ] 11.4 Set transaction attribute to Required for payment processing (SWHR3-T-0119)
- [ ] 11.5 Implement rollback on payment failures (SWHR3-T-0119)

## 12. Order Persistence

- [x] 12.1 Create PurchaseOrder entity bean deployment (SWHR3-T-0120)
- [x] 12.2 Create LineItem entity bean deployment (SWHR3-T-0120)
- [x] 12.3 Create SupplierPO entity bean deployment (SWHR3-T-0120)
- [x] 12.4 Define entity relationships and mappings (SWHR3-T-0120)
- [x] 12.5 Create finder methods for order queries (SWHR3-T-0120)

## 13. Error Handling

- [ ] 13.1 Implement payment processor error handling (SWHR3-T-0121)
- [ ] 13.2 Implement inventory system error handling (SWHR3-T-0121)
- [ ] 13.3 Implement supplier PO generation errors (SWHR3-T-0121)
- [ ] 13.4 Implement exception-to-user-message mapping (SWHR3-T-0121)
- [ ] 13.5 Log all errors for diagnostics (SWHR3-T-0121)

## 14. Testing

- [ ] 14.1 Test order creation flow end-to-end (SWHR3-T-0122)
- [ ] 14.2 Test payment processing success and failure paths (SWHR3-T-0122)
- [ ] 14.3 Test inventory reservation and updates (SWHR3-T-0122)
- [ ] 14.4 Test supplier PO generation (SWHR3-T-0122)
- [ ] 14.5 Test order status transitions (SWHR3-T-0122)
- [ ] 14.6 Test notification queuing (SWHR3-T-0122)
- [ ] 14.7 Test transaction rollback on failures (SWHR3-T-0122)
- [ ] 14.8 Test concurrent order processing (SWHR3-T-0122)
