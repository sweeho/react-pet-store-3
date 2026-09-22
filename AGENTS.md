# Rebuild Guidance: SX-0001 Petstore Capabilities

This document guides the rebuild of six Petstore capabilities extracted from the legacy J2EE application.

## Team Roles and Responsibilities

### Architecture

- Review all capability deltas against the technical stack specification (Vite React SPA + Nitro server, SQLite/Drizzle, Tailwind CSS)
- Validate dependency order and make decisions on cross-capability boundaries
- Document key architecture decisions in ARCHITECTURE.md

### Implementation

- Decompose each capability into tasks from the synthesized `tasks.md`
- Implement requirements from the delta spec with GIVEN/WHEN/THEN scenarios as test contracts
- Ensure acceptance criteria from the capability canvas are met
- Test against each scenario in the spec before marking tasks complete

### Validation

- Verify each acceptance criterion from the capability canvas
- Test all GIVEN/WHEN/THEN scenarios from the delta spec
- Record verdicts per requirement and fix defects in place on the sprint branch
- Escalate unfixable defects to backlog with traceability to the originating requirement

### Security

- Review all authentication and authorization requirements in delta specs
- Validate role-based access control (admin, customer, supplier roles)
- Ensure sensitive data (passwords, credit cards, inventory) is handled per requirements

## Capability Dependency Graph

```
customer-management (no dependencies)
    ↓
shopping-cart
order-approval
    ↓
order-checkout → order-workflow
    ↓
supplier-integration
```

**Build sequence**: 1) customer-management, 2) order-approval & shopping-cart (parallel), 3) order-checkout, 4) order-workflow, 5) supplier-integration.

## Technical Stack Constraints

All capabilities MUST be implemented within these boundaries:

- **Frontend**: Vite React SPA with file-based routing (`vite-plugin-pages`), react-router, Tailwind CSS
- **Backend**: Nitro (H3) server with file-based routes, NO Next.js or App Router
- **Database**: SQLite (better-sqlite3) with Drizzle ORM, migrations in `drizzle/` directory
- **Styling**: Tailwind CSS (CSS-first, no `tailwind.config.js`), shadcn/ui primitives, lucide-react icons
- **Testing**: Vitest (unit/integration) + Testing Library (UI) + Playwright (E2E)
- **Auto-imports**: React and react-router via `unplugin-auto-import`

## Cross-Capability Coordination

### Customer Management → Downstream

- **Provides**: Customer authentication, session management, role-based access (customer, admin, supplier)
- **Used by**: Order Workflow (for customer association), Supplier Integration (admin role check)

### Shopping Cart → Order Checkout

- **Provides**: Cart item collection, subtotals, cart-to-order migration
- **Used by**: Order Checkout for cart validation and line item creation

### Order Checkout → Order Workflow

- **Provides**: Order creation with addresses, payment method capture
- **Used by**: Order Workflow for payment processing and status management

### Order Workflow → Supplier Integration

- **Provides**: Inventory reservation, supplier PO generation, invoice shipment status
- **Used by**: Supplier Integration for inventory updates and order reprocessing

## Testing Strategy

### Unit Tests

- Validation logic (addresses, quantities, credit cards)
- Calculation logic (subtotals, line totals)
- State machines (order status transitions)

### Integration Tests

- Checkout workflow (address collection → order creation)
- Order processing (payment → inventory → fulfillment)
- Cart modifications (add/remove/update → subtotal recalc)

### E2E Tests (Playwright)

- Customer registration → sign-on → browse → add to cart → checkout → order confirmation
- Supplier login → view inventory → update quantities → monitor order status

## Delivery Criteria

All capabilities must pass:

1. **Correctness**: All acceptance criteria from capability canvas verified
2. **Completeness**: All GIVEN/WHEN/THEN scenarios from delta spec pass
3. **Integration**: Cross-capability data flows function correctly
4. **Security**: Role-based access enforced, sensitive data protected
5. **Testing**: Unit/integration/E2E coverage minimum 70%
6. **Performance**: Page loads < 2s, checkout flow < 3s, API responses < 500ms

## Traceability

Each requirement is traceable to:

- **Spec file**: `specs/<capability>/spec.md`
- **Legacy source**: IR record key and file path
- **Implementation task**: `tasks.md` task group and checkbox
- **Test scenario**: GIVEN/WHEN/THEN from delta spec
