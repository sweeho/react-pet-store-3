-- EXTRACTED FROM LEGACY SOURCE — evidence of what exists, not a build target. Where this disagrees with a capability delta spec, the delta spec wins.

-- Customer Management Tables
CREATE TABLE Customer (
    customerId VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    familyName VARCHAR(255),
    givenName VARCHAR(255),
    password VARCHAR(255) NOT NULL,
    status VARCHAR(50),
    createdDate TIMESTAMP
);

-- Shopping Cart Tables
CREATE TABLE ShoppingCart (
    shoppingCartId VARCHAR(255) PRIMARY KEY,
    customerId VARCHAR(255) NOT NULL,
    itemCount INTEGER DEFAULT 0,
    subtotal DECIMAL(10, 2),
    createdDate TIMESTAMP,
    FOREIGN KEY (customerId) REFERENCES Customer(customerId)
);

CREATE TABLE CartItem (
    cartItemId VARCHAR(255) PRIMARY KEY,
    shoppingCartId VARCHAR(255) NOT NULL,
    itemId VARCHAR(255) NOT NULL,
    productId VARCHAR(255),
    category VARCHAR(255),
    productName VARCHAR(255),
    attribute VARCHAR(255),
    quantity INTEGER,
    unitCost DECIMAL(10, 2),
    FOREIGN KEY (shoppingCartId) REFERENCES ShoppingCart(shoppingCartId)
);

-- Order Processing Tables
CREATE TABLE PurchaseOrder (
    orderId VARCHAR(255) PRIMARY KEY,
    customerId VARCHAR(255) NOT NULL,
    orderDate TIMESTAMP NOT NULL,
    emailId VARCHAR(255),
    totalAmount DECIMAL(10, 2),
    status VARCHAR(50),
    poStatus VARCHAR(50),
    billToContactId VARCHAR(255),
    shipToContactId VARCHAR(255),
    FOREIGN KEY (customerId) REFERENCES Customer(customerId)
);

CREATE TABLE OrderLineItem (
    lineItemId VARCHAR(255) PRIMARY KEY,
    orderId VARCHAR(255) NOT NULL,
    lineNumber INTEGER,
    itemId VARCHAR(255),
    productId VARCHAR(255),
    categoryId VARCHAR(255),
    quantity INTEGER NOT NULL,
    unitPrice DECIMAL(10, 2),
    quantityShipped INTEGER DEFAULT 0,
    supplierPoId VARCHAR(255),
    FOREIGN KEY (orderId) REFERENCES PurchaseOrder(orderId)
);

-- Address and Contact Information
CREATE TABLE ContactInfo (
    contactInfoId VARCHAR(255) PRIMARY KEY,
    givenName VARCHAR(255),
    familyName VARCHAR(255),
    email VARCHAR(255),
    telephone VARCHAR(255),
    addressId VARCHAR(255)
);

CREATE TABLE Address (
    addressId VARCHAR(255) PRIMARY KEY,
    street1 VARCHAR(255),
    street2 VARCHAR(255),
    city VARCHAR(255),
    state VARCHAR(255),
    postalCode VARCHAR(255),
    country VARCHAR(255)
);

-- Inventory Management Tables
CREATE TABLE Inventory (
    itemId VARCHAR(255) PRIMARY KEY,
    quantity INTEGER NOT NULL DEFAULT 0,
    createdDate TIMESTAMP
);

CREATE TABLE Item (
    itemId VARCHAR(255) PRIMARY KEY,
    productId VARCHAR(255) NOT NULL,
    categoryId VARCHAR(255),
    attribute VARCHAR(255),
    listCost DECIMAL(10, 2),
    FOREIGN KEY (productId) REFERENCES Product(productId)
);

CREATE TABLE Product (
    productId VARCHAR(255) PRIMARY KEY,
    productName VARCHAR(255) NOT NULL,
    category VARCHAR(255)
);

-- Supplier Integration Tables
CREATE TABLE SupplierOrder (
    poId VARCHAR(255) PRIMARY KEY,
    poDate LONG NOT NULL,
    poStatus VARCHAR(50),
    contactInfoId VARCHAR(255),
    FOREIGN KEY (contactInfoId) REFERENCES ContactInfo(contactInfoId)
);

CREATE TABLE SupplierPO (
    supplierPoId VARCHAR(255) PRIMARY KEY,
    supplierId VARCHAR(255),
    orderDate TIMESTAMP,
    deliveryDate TIMESTAMP,
    status VARCHAR(50)
);

-- Relationships
CREATE TABLE SupplierOrder_LineItem (
    supplierOrderId VARCHAR(255) NOT NULL,
    lineItemId VARCHAR(255) NOT NULL,
    PRIMARY KEY (supplierOrderId, lineItemId),
    FOREIGN KEY (supplierOrderId) REFERENCES SupplierOrder(poId),
    FOREIGN KEY (lineItemId) REFERENCES OrderLineItem(lineItemId)
);

-- Indexes for performance
CREATE INDEX idx_customer_email ON Customer(email);
CREATE INDEX idx_purchase_order_customer ON PurchaseOrder(customerId);
CREATE INDEX idx_order_line_item_order ON OrderLineItem(orderId);
CREATE INDEX idx_inventory_item ON Inventory(itemId);
CREATE INDEX idx_supplier_order_status ON SupplierOrder(poStatus);
