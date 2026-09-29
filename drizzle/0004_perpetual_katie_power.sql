CREATE TABLE `cart_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_token` text NOT NULL,
	`item_id` text NOT NULL,
	`quantity` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cart_items_session_token_item_id_unique` ON `cart_items` (`session_token`,`item_id`);--> statement-breakpoint
CREATE TABLE `catalog_item_details` (
	`item_id` text NOT NULL,
	`locale` text NOT NULL,
	`name` text NOT NULL,
	`attribute` text NOT NULL,
	PRIMARY KEY(`item_id`, `locale`),
	FOREIGN KEY (`item_id`) REFERENCES `catalog_items`(`item_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `catalog_items` (
	`item_id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`category` text NOT NULL,
	`unit_cost_cents` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `line_items` (
	`order_id` integer NOT NULL,
	`line_number` integer NOT NULL,
	`category_id` text NOT NULL,
	`product_id` text NOT NULL,
	`item_id` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit_price_cents` integer NOT NULL,
	`quantity_shipped` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`order_id`, `line_number`),
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action
);
