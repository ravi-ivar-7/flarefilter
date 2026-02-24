PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_add_ip_to_list_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text DEFAULT 'IP Mitigation Rule' NOT NULL,
	`zone_config_id` text NOT NULL,
	`tenant_id` text NOT NULL,
	`cf_list_id` text NOT NULL,
	`cf_list_name` text,
	`rate_limit_threshold` integer DEFAULT 10000,
	`window_seconds` integer DEFAULT 300,
	`is_active` integer DEFAULT true,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`zone_config_id`) REFERENCES `zone_configs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tenant_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_add_ip_to_list_rules`("id", "name", "zone_config_id", "tenant_id", "cf_list_id", "cf_list_name", "rate_limit_threshold", "window_seconds", "is_active", "created_at", "updated_at") SELECT "id", "name", "zone_config_id", "tenant_id", "cf_list_id", "cf_list_name", "rate_limit_threshold", "window_seconds", "is_active", "created_at", "updated_at" FROM `add_ip_to_list_rules`;--> statement-breakpoint
DROP TABLE `add_ip_to_list_rules`;--> statement-breakpoint
ALTER TABLE `__new_add_ip_to_list_rules` RENAME TO `add_ip_to_list_rules`;--> statement-breakpoint
PRAGMA foreign_keys=ON;