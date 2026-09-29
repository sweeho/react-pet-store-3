CREATE TABLE `order_contacts` (
	`order_id` integer NOT NULL,
	`role` text NOT NULL,
	`family_name` text NOT NULL,
	`given_name` text NOT NULL,
	`address1` text NOT NULL,
	`address2` text,
	`city` text NOT NULL,
	`state_or_province` text NOT NULL,
	`postal_code` text NOT NULL,
	`country` text NOT NULL,
	`telephone_number` text NOT NULL,
	`email` text NOT NULL,
	PRIMARY KEY(`order_id`, `role`),
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `orders` ADD `email` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `card_type` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `card_number` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `card_expiry` text;