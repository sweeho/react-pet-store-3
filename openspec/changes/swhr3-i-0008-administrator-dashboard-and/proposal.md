# Admin Dashboard Capability Extraction

## Summary

This change extracts the administrator dashboard capability from the legacy application into OpenSpec requirements. The admin dashboard provides administrators with a secure interface to manage orders, approve status changes, and view sales analytics through a rich client application delivered via Java WebStart.

## Extracted Capabilities

The admin-dashboard capability encompasses:

- **Security**: Form-based authentication with role-based access control (administrator role required)
- **Session Management**: 54-minute session timeout for admin web tier
- **User Interface**: JSP-based web tier with rich Swing-based client application
- **Order Management**: Browse, filter, and approve order status changes
- **Analytics**: Revenue and order quantity aggregation by category with date range filtering
- **Integration**: JNLP delivery mechanism, EJB facade for order and analytics data, XML-based rich client communication

## Key Design Patterns

1. **Multi-tier Architecture**: Web tier (JSP) delivers rich client via JNLP; client communicates with admin web tier via XML
2. **Event-Driven Framework**: HTML actions generate events that map to EJB actions via declarative configuration
3. **Table-based UI**: Sortable tables with color-coded status indicators for order approval
4. **Aggregation Logic**: Server-side calculation of revenue (sum of quantity × unit_price) and order quantities by category
5. **State Preservation**: Client-state caching using Base64-encoded hidden form variables

## Technical Stack

- **Frontend**: Java Swing (rich client), JSP (web tier)
- **Backend**: J2EE Servlet containers, EJB 2.x session and entity beans
- **Communication**: XML over HTTP, Java WebStart (JNLP)
- **Database**: Entity beans with CMP 2.x
- **Framework**: Custom WAF (Web Application Framework) with declarative configuration

## Risks and Ambiguities

1. **Date Handling**: Legacy date arithmetic using deprecated Date constructors may not handle all edge cases
2. **Session Timeout Rationale**: 54-minute timeout value specific to admin tier; reasoning undocumented
3. **Error Handling**: Inconsistent error paths that may return null on failure instead of meaningful error messages
4. **Offline Capability**: TODO comment suggests offline caching intended but not implemented
5. **COMPLETED Order Status**: Unclear whether COMPLETED orders can be selected in the approval panel (UI combo box shows only PENDING, APPROVED, DENIED but server retrieves COMPLETED orders)

## Out of Scope

- Legacy implementation details (Struts, JSP tags, specific Java class names)
- Batch processing and scheduled order management
- Customer-facing portal (separate capability)
- Order processing workflow (separate order-workflow and order-approval capabilities)
