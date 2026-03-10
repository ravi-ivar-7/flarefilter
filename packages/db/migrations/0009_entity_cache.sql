CREATE TABLE `entity_cache` (
	`namespace` text NOT NULL,
	`key` text NOT NULL,
	`synced_at` integer NOT NULL,
	PRIMARY KEY(`namespace`, `key`)
);
