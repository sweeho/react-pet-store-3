# Admin Dashboard Design

## Architecture Overview

The admin dashboard is a three-tier system:

1. **Web Tier** (JSP-based): Entry point for administrators, delivers rich client via JNLP
2. **Rich Client** (Java Swing): Standalone application for order management and analytics
3. **Business Tier** (EJB): Provides order data, analytics aggregation, and authentication

### Security

- **Authentication**: Form-based login via HttpServletRequest (j_security_check)
- **Authorization**: Role-based access control (administrator role required) enforced via web.xml security-constraint
- **Session Management**: HTTP session-based for web tier, embedded in JNLP launch parameters for rich client
- **Session Timeout**: 54 minutes for web tier (web.xml session-timeout configuration)

### Rich Client Delivery

The rich client is deployed via Java WebStart (JNLP). When an administrator clicks "Launch Rich Client":

1. Browser requests manageorders.do (or equivalent)
2. AdminRequestProcessor.buildJNLP() generates dynamic JNLP XML with:
   - Server hostname and port
   - Session ID (from req.getSession().getId())
   - Main class: PetStoreAdminClient
   - JAR references and application descriptor
3. Response content-type is set to application/x-java-jnlp-file
4. Client browser passes JNLP to Java WebStart launcher
5. Rich client launches and connects to server using embedded session ID

### Data Flow: Order Management

**Viewing Orders**:

1. Rich client (OrdersViewPanel) calls DataSource.getServerOrderData()
2. DataSource sends XML request with Type="GETORDERS" and Status filter
3. ApplRequestProcessor.getOrders() parses request, calls AdminRequestBD.getOrdersByStatus()
4. AdminRequestBD invokes OPCAdminFacadeRemote EJB via JNDI lookup
5. Response returns OrderDetails objects, formatted as XML
6. Client displays in JTable

**Approving Orders**:

1. Administrator selects rows and clicks Approve/Deny button in OrdersApprovePanel
2. OrdersApprovePanel updates TableSorter model with new status
3. Administrator clicks Commit
4. OrdersApproveTableModel.commit() sends XML request with Type="UPDATESTATUS"
5. ApplRequestProcessor.updateOrders() parses XML, builds OrderApproval document
6. AdminRequestBD.updateOrders() sends OrderApproval to AsyncSenderEJB via local JNDI
7. AsyncSender queues message for asynchronous order status update

### Data Flow: Analytics

**Chart Data Retrieval**:

1. Rich client calls DataSource.getServerPieChartData() / getServerBarChartData()
2. DataSource sends XML request with Type="REVENUE" or Type="ORDERS", including Start/End dates and optional category filter
3. ApplRequestProcessor.getChartInfo() parses request, calls AdminRequestBD.getChartInfo()
4. AdminRequestBD invokes OPCAdminFacadeRemote.getChartInfo() EJB
5. EJB returns HashMap with category/item keys and aggregated values
6. ApplRequestProcessor iterates map and formats response XML:
   - For REVENUE: sums (quantity × unit_price), outputs Category/Item elements with amounts and TotalSales
   - For ORDERS: sums quantities, outputs Category/Item elements with counts and TotalSales
7. Client updates PieChartPanel and BarChartPanel

### WAF Integration

The admin web tier uses a custom WAF (Web Application Framework):

1. **Front Controller**: MainServlet receives all \*.do requests
2. **URL Mapping**: mappings.xml defines URL-to-action and URL-to-screen mappings
3. **Request Processing**: RequestProcessor invokes HTMLAction lifecycle (doStart → perform → doEnd)
4. **Event Handling**: Actions generate Events mapped to EJBAction handlers via EventMapping
5. **EJB Tier**: EJBController (stateful session bean) with Required transaction attribute processes events
6. **Screen Flow**: ScreenFlowManager forwards to JSP screens via RequestDispatcher or FlowHandler
7. **Template Rendering**: TemplateServlet processes \*.screen files with optional state caching

### Configuration

**web.xml**:

- MainServlet mapping to \*.do pattern
- TemplateServlet mapping to \*.screen pattern
- Form-based login configuration (form-login-page, form-error-page)
- Security constraints on AdminRequestProcessor (administrator role required)
- EJB references (OPCAdminFacadeRemote, AsyncSender)
- Session configuration (54-minute timeout)

**mappings.xml**:

- URL-to-HTMLAction mappings with screen references
- Event-to-EJBAction mappings
- Exception-to-screen mappings

## Legacy Implementation Notes

### JSP Pages

- **login.jsp**: Form-based login with j_username and j_password fields, default values "jps_admin" / "admin"
- **index.jsp**: Home page with "Launch Rich Client" and "logout" form buttons
- **logout.jsp**: Invalidates session before redirect

### Rich Client Classes

- **PetStoreAdminClient**: Main application window with tabbed panes for Orders and Sales
- **OrdersViewPanel**: JTable displaying all orders (read-only)
- **OrdersApprovePanel**: JTable with editable status column, Approve/Deny/Commit buttons
- **PieChartPanel**: Revenue by category visualization
- **BarChartPanel**: Order count by category visualization
- **DataSource**: Handles data fetching and event notification

### Server Classes

- **AdminRequestProcessor**: Web tier servlet handling JNLP generation and logout
- **ApplRequestProcessor**: XML request handler for rich client (GETORDERS, UPDATESTATUS, REVENUE, ORDERS)
- **AdminRequestBD**: Business delegate for EJB calls
- **OPCAdminFacadeRemote**: EJB facade providing getOrdersByStatus(), getChartInfo(), updateOrders()

### Tag Libraries

**waftags.tld** provides custom JSP tags:

- form, input, checkbox, select: Form generation
- client_cache_link: State preservation via Base64-encoded hidden form variables
- cache: Content refresh with duration control

## Constraints and Assumptions

1. **Java WebStart Availability**: Rich client requires Java Runtime Environment with WebStart support on administrator machines
2. **Session Affinity**: Rich client relies on session ID embedded in JNLP; no automatic reconnection if session expires mid-session
3. **Network Connectivity**: No offline capability; client requires continuous network access to server
4. **Single Administrator User**: Session timeout is per-user; no multi-user scenarios tested
5. **Date Format**: Legacy date parsing uses deprecated Date constructors; exact format handling unclear

## Security Considerations

- Session ID passed in JNLP is URL-visible; may be logged in web server access logs
- No SSL/TLS encryption mentioned in configuration (transport-guarantee=NONE in web.xml)
- Debug output disabled by default (Debug.debuggingOn = false) but can be enabled by code modification
