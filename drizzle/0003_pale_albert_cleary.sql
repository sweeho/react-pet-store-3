CREATE TABLE `orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`account_id` integer NOT NULL,
	`customer_name` text NOT NULL,
	`order_date` integer NOT NULL,
	`total_cents` integer NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `accounts` ADD `role` text DEFAULT 'customer' NOT NULL;