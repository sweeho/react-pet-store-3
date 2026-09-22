# Customer Communications Design

## User interface

No screen records were extracted for this capability; its user interface is unspecified.

## Architecture Overview

The customer communications capability uses asynchronous messaging:

- **AsyncSender EJB**: Stateless session bean for queuing communications
- **Mailer Component**: Email service implementation
- **Message Queue**: JMS-based communication queue
- **XML Documents**: Structured communication payloads

## Key Components

- AsyncSenderLocalHome/Local interfaces for local EJB access
- Mailer for email composition and delivery
- XML Document serialization for message structure
- PurchaseOrder integration for order notifications

## Transaction Semantics

- CMT with Required attribute on AsyncSender methods
- Async processing via message queue
- Exception mapping to error screens
