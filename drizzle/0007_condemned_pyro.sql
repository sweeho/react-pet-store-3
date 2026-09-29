CREATE TABLE `supplier_fulfilment_attempts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`supplier_po_id` integer NOT NULL,
	`attempted_at` integer NOT NULL,
	`result` text NOT NULL,
	`detail` text NOT NULL,
	FOREIGN KEY (`supplier_po_id`) REFERENCES `supplier_purchase_orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `supplier_invoices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`supplier_po_id` integer NOT NULL,
	`order_id` integer NOT NULL,
	`invoice_date` integer NOT NULL,
	`lines` text NOT NULL,
	`total_cents` integer NOT NULL,
	`status` text DEFAULT 'SENT' NOT NULL,
	FOREIGN KEY (`supplier_po_id`) REFERENCES `supplier_purchase_orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `supplier_invoices_supplier_po_id_unique` ON `supplier_invoices` (`supplier_po_id`);--> statement-breakpoint
CREATE TABLE `supplier_po_addresses` (
	`supplier_po_id` integer PRIMARY KEY NOT NULL,
	`address1` text NOT NULL,
	`address2` text,
	`city` text NOT NULL,
	`state_or_province` text NOT NULL,
	`postal_code` text NOT NULL,
	`country` text NOT NULL,
	FOREIGN KEY (`supplier_po_id`) REFERENCES `supplier_po_contacts`(`supplier_po_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `supplier_po_contacts` (
	`supplier_po_id` integer PRIMARY KEY NOT NULL,
	`given_name` text NOT NULL,
	`family_name` text NOT NULL,
	`email` text NOT NULL,
	`telephone` text NOT NULL,
	FOREIGN KEY (`supplier_po_id`) REFERENCES `supplier_purchase_orders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_supplier_purchase_orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`supplier_id` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`expected_delivery_date` integer NOT NULL,
	`tracking_number` text,
	`created_at` integer NOT NULL,
	`shipped_at` integer,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
-- Data mapping (design.md D2): OPEN (stock already reserved) -> PROCESSING, SHIPPED -> COMPLETED.
INSERT INTO `__new_supplier_purchase_orders`("id", "order_id", "supplier_id", "status", "expected_delivery_date", "tracking_number", "created_at", "shipped_at") SELECT "id", "order_id", "supplier_id", CASE "status" WHEN 'OPEN' THEN 'PROCESSING' WHEN 'SHIPPED' THEN 'COMPLETED' ELSE "status" END, "expected_delivery_date", "tracking_number", "created_at", "shipped_at" FROM `supplier_purchase_orders`;--> statement-breakpoint
DROP TABLE `supplier_purchase_orders`;--> statement-breakpoint
ALTER TABLE `__new_supplier_purchase_orders` RENAME TO `supplier_purchase_orders`;--> statement-breakpoint
PRAGMA foreign_keys=ON;