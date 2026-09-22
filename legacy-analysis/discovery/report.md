# SX-0001 Discovery Phase Report

## Executive Summary

The legacy system is a J2EE Petstore application (v1.3.2) from the Sun Microsystems J2EE Blueprints reference implementation. It is a complex, distributed e-commerce platform with a three-tier architecture: a web presentation tier, EJB business logic tier, and a database tier. The system manages product catalogs, shopping carts, order processing, payment processing, order approval workflows, customer communications, and supplier integration.

**Total Codebase Size:** ~95,000 lines of code (excluding third-party libraries)
**Module Count:** 23 distinct extraction targets
**High-Risk Modules:** 5 (requires priority extraction)
**Architectural Style:** EJB 2.0, Struts-like MVC, message-driven architecture (JMS), XML-centric data model

---

## Module Inventory & Risk Profile

### Tier 1: Presentation (Web Applications)

| Module            | LOC    | Screens | Risk   | Notes                                                                        |
| ----------------- | ------ | ------- | ------ | ---------------------------------------------------------------------------- |
| **apps/petstore** | 18,460 | 67      | HIGH   | Main storefront; highest complexity; integrates with all business components |
| **apps/opc**      | 5,212  | 1       | HIGH   | Backend order processing; handles PO receipts, invoices, approvals via JMS   |
| **apps/admin**    | 5,497  | 4       | MEDIUM | Admin dashboard; order reporting and chart generation; limited UI            |
| **apps/supplier** | 4,097  | 7       | MEDIUM | Supplier portal; purchase order and invoice management                       |

**Presentation Tier Characteristics:**

- Servlet-based with front controller pattern (MainServlet)
- Multi-language support (en_US, ja_JP, zh_CN)
- Screen definitions in XML (screendefinitions\_\*.xml)
- UTF-8 encoding filter applied globally
- Sign-on filter enforces authentication
- JMS message-driven beans handle async order workflows

### Tier 2: Business Logic Components

| Module             | LOC   | Role                           | Risk   | Dependencies                               |
| ------------------ | ----- | ------------------------------ | ------ | ------------------------------------------ |
| **purchaseorder**  | 2,366 | Order data model & EJB         | HIGH   | ContactInfo, CreditCard, LineItem, Address |
| **processmanager** | 1,322 | Order workflow state machine   | HIGH   | None (core orchestrator)                   |
| **creditcard**     | 769   | Payment validation             | HIGH   | xmldocuments (XML ser/deser)               |
| **catalog**        | 2,866 | Product catalog & search       | MEDIUM | ServiceLocator, util                       |
| **customer**       | 2,385 | Customer profile & account     | MEDIUM | ContactInfo, CreditCard                    |
| **signon**         | 1,559 | Authentication & authorization | HIGH   | None (core security)                       |
| **cart**           | 829   | Shopping cart state            | MEDIUM | Catalog                                    |
| **supplierpo**     | 1,924 | Supplier order model           | LOW    | Address, ContactInfo, LineItem             |
| **contactinfo**    | 1,266 | Contact data model (entity)    | LOW    | Address, xmldocuments                      |
| **address**        | 992   | Address data model (entity)    | LOW    | xmldocuments                               |
| **lineitem**       | 820   | Line item data model (entity)  | LOW    | xmldocuments                               |
| **mailer**         | 840   | Email notifications            | LOW    | xmldocuments                               |

### Tier 3: Infrastructure & Utilities

| Module             | LOC   | Role                                | Risk   | Notes                                                |
| ------------------ | ----- | ----------------------------------- | ------ | ---------------------------------------------------- |
| **waf**            | 8,334 | Web application framework           | MEDIUM | Struts-like controller; form handling; model binding |
| **xmldocuments**   | 2,042 | XML serialization/deserialization   | LOW    | Core data format (DOM/SAX parsing)                   |
| **servicelocator** | 758   | JNDI service locator pattern        | LOW    | Abstracts EJB lookups                                |
| **asyncsender**    | 549   | Async message sending (JMS wrapper) | LOW    | Used by mailer and reporting                         |
| **uidgen**         | 756   | Unique ID generation                | LOW    | Generates order IDs, customer IDs                    |
| **util**           | 181   | Common utilities                    | LOW    | String manipulation, helpers                         |
| **encodingfilter** | 180   | HTTP request encoding filter        | LOW    | Ensures UTF-8 processing                             |

---

## Architecture Overview

### Technology Stack

- **J2EE 1.3 / EJB 2.0** (Stateful and stateless session beans, entity beans, message-driven beans)
- **JMS** (Message-driven order processing and customer communications)
- **XML** (Data serialization, configuration, DTD validation)
- **Servlet 2.3** (Request handling and response generation)
- **JSP 1.2** (Page templating)
- **Cloudscape/Derby** (Embedded database referenced in build configs)

### Key Architectural Patterns

#### 1. **Order Processing Workflow**

Order workflow is centralized in `components/processmanager` and follows a strict state machine:

```
PENDING → APPROVED → SHIPPED_PART → COMPLETED
       ↘ DENIED
```

States are managed as string constants in `OrderStatusNames.java`:

- `PENDING`: Order placed, awaiting approval
- `APPROVED`: Admin approved order
- `SHIPPED_PART`: Partial shipment (line items partially fulfilled)
- `COMPLETED`: All line items shipped
- `DENIED`: Order rejected by admin

#### 2. **Message-Driven Architecture (OPC)**

The Order Processing Center (`apps/opc`) consumes asynchronous events via JMS:

- `PurchaseOrderMDB`: Receives new orders from petstore app (Queue: `jms/PurchaseOrderQueue`)
- `OrderApprovalMDB`: Receives approval decisions from admin (Queue: `jms/OrderApprovalQueue`)
- `InvoiceMDB`: Receives supplier invoices (Topic: publish/subscribe pattern)
- `MailInvoiceMDB`, `MailOrderApprovalMDB`, `MailCompletedOrderMDB`: Customer relation management via emails

#### 3. **Data Model Pattern**

All domain objects are XML-serializable:

- `PurchaseOrder` → Contains `ContactInfo`, `CreditCard`, collection of `LineItem`
- `ContactInfo` → Contains `Address` and contact details
- `CreditCard` → Card number, type, expiry date
- XML DTD validation enabled for PurchaseOrder and CreditCard

#### 4. **EJB Architecture**

- **Entity Beans** (CMP): ContactInfo, Address, PurchaseOrder, CreditCard, LineItem, Customer
- **Session Beans**: Catalog (LocalHome), ProcessManager (LocalHome), OPCAdminFacade (Remote)
- **Message-Driven Beans**: Multiple MDBs for async event processing
- **Transaction Control**: Container-managed transactions (trans-attribute: Required) on key operations

#### 5. **Authentication & Authorization**

- Sign-on component provides user registration and login
- SignOnFilter enforces authentication on all routes
- Role-based access control via `isUserInRole()` checks
- Admin functions accessible only by admin role

---

## Dependency Map

### Critical Paths (High Coupling)

1. **Shopping Flow**: petstore → cart → catalog → purchaseorder → creditcard → contactinfo
2. **Order Processing**: opc → purchaseorder → processmanager → mailer
3. **Admin Dashboard**: admin → opc facade → processmanager
4. **Supplier Coordination**: supplier → supplierpo → processmanager

### Dependency Layers

```
Presentation Tier (apps/*)
    ↓
Business Logic (components/{purchaseorder, processmanager, cart, catalog, customer, creditcard, signon})
    ↓
Data Models (components/{address, contactinfo, lineitem, supplierpo})
    ↓
Infrastructure (components/{xmldocuments, servicelocator, mailer, asyncsender, uidgen, util})
```

No circular dependencies detected. Clean layering enables incremental extraction.

---

## High-Risk Areas Requiring Priority Extraction

### 1. **apps/petstore** - Main Storefront

- **Why Critical**: Single point of entry for customers; integrates with nearly all business logic
- **Complexity**: 67 JSP screens, 18K LOC of servlet/controller logic
- **State Management**: Session-based cart management, customer authentication
- **Dependencies**: Deep coupling to catalog, cart, customer, purchaseorder, creditcard
- **Risk Factors**: Multi-language support complexity, screen state coordination

### 2. **components/purchaseorder** - Order Data Model

- **Why Critical**: Central domain entity; all order workflows revolve around it
- **Complexity**: XML serialization/deserialization, nested object graphs (ContactInfo, CreditCard, LineItem)
- **State Management**: Order total price calculation, discount/surcharge ordering
- **Risk Factors**: Embedded XML DTD validation, date parsing with locale-specific formatting

### 3. **components/processmanager** - Order Workflow Orchestrator

- **Why Critical**: Manages order state transitions; enforces workflow invariants
- **Complexity**: State machine with transition logic, approval thresholds
- **Risk Factors**: Transactional consistency requirements, concurrent order updates from multiple MDBs

### 4. **components/creditcard** - Payment Processing

- **Why Critical**: Handles sensitive payment data; validates card eligibility
- **Complexity**: Card type validation, expiry date checking, card acceptance rules
- **Risk Factors**: PCI compliance implications (stored card data), validation rule undocumentation

### 5. **apps/opc** - Backend Order Processing

- **Why Critical**: Event-driven order fulfillment; integrates with inventory and suppliers
- **Complexity**: Multiple MDB patterns, asynchronous state transitions
- **Risk Factors**: Message ordering guarantees, idempotency of invoice processing, supplier invoice reconciliation

---

## Exclusions & Out-of-Scope

### Excluded from Initial Extraction

1. **Third-party library components** (lib/ directory) - Not part of business logic extraction
2. **Build infrastructure** (build.xml, Ant scripts) - Build tooling, not runtime behavior
3. **Database DDL and SQL files** - Schema inference deferred to schema-mapping phase
4. **Documentation** (docs/ directory) - Separate documentation extraction track
5. **Internationalization bundles** - i18n configuration deferred; 67 JSPs have localized variants that will be handled in phase 2
6. **Test files** (if present) - Not found in legacy-source; no automated test suite to extract

### Technology Stack Not Being Extracted

- EJB 2.0 CMP descriptors (orm.xml, ejb-jar.xml) - Will be mapped to modern ORM schema during mapping phase
- Cloudscape/Derby database setup scripts - Will be handled in phase 3 (schema extraction)
- JMS queue/topic configurations - Async patterns will be extracted as behavioral requirements

---

## Discovered Gaps & Ambiguities

### Confidence-Reducing Findings

1. **Order Thresholds Undocumented**: References to order approval thresholds appear in OrderApprovalMDB but no constants found defining them. Marked for clarification in requirements extraction phase.
2. **Card Acceptance Rules**: CreditCard component performs validation but criteria for which card types are accepted is not explicit in code. Business rule documentation missing.
3. **Discount/Surcharge Calculation**: PurchaseOrder.getTotalPrice() returns float with no commentary on rounding rules or calculation order. Flag: potential money calculation defect.
4. **Shipping/Billing Address Validation**: ContactInfo holds address but no validation rules found for required fields or format constraints.
5. **Locale-Specific Date Parsing**: SimpleDateFormat("yyyy-MM-dd") hard-coded; no i18n of date formats visible.

### Reachability Questions

- Some MDB classes and process manager transitions reference deployed configurations not visible in source (e.g., `param/transitiondelegate/OrderApprovalTD`). These will be resolved during extraction.

---

## Module Extraction Priority Queue

**Priority 1 (Extract First - Core Workflows)**

1. components/processmanager
2. components/purchaseorder
3. components/creditcard
4. apps/petstore

**Priority 2 (Extract Second - Supporting Business Logic)** 5. components/cart 6. components/catalog 7. components/customer 8. components/signon 9. apps/opc

**Priority 3 (Extract Third - Secondary Features)** 10. apps/admin 11. apps/supplier 12. components/supplierpo 13. components/mailer

**Priority 4 (Extract Last - Infrastructure)**
14–23. Remaining utilities and data models

---

## Recommendations for Extraction Phase

### Immediate Actions

- Verify order approval thresholds in admin configuration or DB schema
- Identify total price calculation rules (rounding, discount order, tax treatment)
- Obtain i18n and locale rules for date/currency formatting
- Confirm PCI compliance scope: which components touch credit card data, what's stored vs. transient

### Extraction Strategy

- **Dependency-driven extraction**: Start with processmanager (no deps), then purchaseorder, then apps
- **Phase modules by risk**: Extract high-risk modules in dedicated spec docs to allow focused validation
- **Test extraction on highest-complexity module first**: petstore (67 screens) to validate method before scaling

---

## Files Analyzed

This discovery phase examined:

- 112 Java source files
- 33 XML configuration files (ejb-jar.xml, web.xml, struts-config equivalents, build.xml)
- 79 JSP page templates
- Setup and build configurations

Source tree structure preserved and analyzed as single legacy-source/ commit with `-text -diff` attributes (binary-safe).

---

## Next Steps

Phase 2 (Extraction) will:

1. Produce detailed requirements for each module in OpenSpec format
2. Identify implicit business rules embedded in code
3. Trace rule locations (file:line) for verification
4. Resolve ambiguities flagged in this report
5. Define capability-based change specs for each coherent behavior area

Discovery complete. 23 modules inventoried, 5 high-risk areas identified, 10 capabilities defined, dependency graph produced.
