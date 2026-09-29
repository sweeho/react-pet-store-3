## ADDED Requirements

### Requirement: Database lock contention tolerance

The system SHALL wait up to 5 seconds for a write lock held by another process on the shared database before failing a request, so that a short-lived concurrent write (an operator script promoting an account or seeding orders, or a second server instance) never turns an administrator or customer request into a server error.

#### Scenario: Admin order queue loads while another process is writing

- **GIVEN** a signed-in administrator and a separate process holding a write transaction on the database for about one second
- **WHEN** the administrator requests the order queue during that transaction
- **THEN** the response SHALL be the order queue with status 200 once the lock is released, not a 500 "database is locked" error

#### Scenario: A write request waits for a concurrent writer

- **GIVEN** a separate process holding a write transaction on the database for about one second
- **WHEN** a visitor registers a new account during that transaction
- **THEN** the registration SHALL succeed after the lock is released instead of failing with a server error

#### Scenario: Operator scripts run concurrently with the server

- **GIVEN** the server is running and several operator scripts (account promotion, order seeding) are started at the same time against the same database
- **WHEN** each script and the server issue their writes
- **THEN** every script SHALL exit successfully and every concurrent server request SHALL answer without a "database is locked" error

#### Scenario: A lock that is never released still fails

- **GIVEN** a separate process holding a write transaction on the database for longer than 5 seconds
- **WHEN** a request needs to write during that transaction
- **THEN** the request SHALL fail with an error after roughly 5 seconds rather than waiting indefinitely
