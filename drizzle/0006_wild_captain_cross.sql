CREATE TABLE `inventory` (
	`item_id` text PRIMARY KEY NOT NULL,
	`quantity` integer NOT NULL,
	FOREIGN KEY (`item_id`) REFERENCES `catalog_items`(`item_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `inventory_reservations` (
	`order_id` integer NOT NULL,
	`item_id` text NOT NULL,
	`quantity` integer NOT NULL,
	PRIMARY KEY(`order_id`, `item_id`),
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `notification_outbox` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`kind` text NOT NULL,
	`recipient` text NOT NULL,
	`payload` text NOT NULL,
	`status` text DEFAULT 'QUEUED' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `order_stage_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`stage` text NOT NULL,
	`changed_at` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `payment_authorizations` (
	`order_id` integer PRIMARY KEY NOT NULL,
	`processor` text NOT NULL,
	`transaction_id` text NOT NULL,
	`authorization_code` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`authorized_at` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payment_authorizations_transaction_id_unique` ON `payment_authorizations` (`transaction_id`);--> statement-breakpoint
CREATE TABLE `supplier_purchase_orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`supplier_id` text NOT NULL,
	`status` text DEFAULT 'OPEN' NOT NULL,
	`expected_delivery_date` integer NOT NULL,
	`tracking_number` text,
	`created_at` integer NOT NULL,
	`shipped_at` integer,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `line_items` ADD `supplier_po_id` integer REFERENCES supplier_purchase_orders(id);--> statement-breakpoint
ALTER TABLE `orders` ADD `workflow_stage` text DEFAULT 'PENDING' NOT NULL;