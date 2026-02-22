PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_zone_configs` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`name` text NOT NULL,
	`cf_account_id` text NOT NULL,
	`cf_zone_id` text NOT NULL,
	`cf_api_token` text NOT NULL,
	`cron_interval` text DEFAULT '* * * * *',
	`rate_limit_threshold` integer DEFAULT 10000,
	`penalty_duration_seconds` integer DEFAULT 3600,
	`is_active` integer DEFAULT true,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_zone_configs`("id", "tenant_id", "name", "cf_account_id", "cf_zone_id", "cf_api_token", "cron_interval", "rate_limit_threshold", "penalty_duration_seconds", "is_active", "created_at", "updated_at") SELECT "id", "tenant_id", "name", "cf_account_id", "cf_zone_id", "cf_api_token", "cron_interval", "rate_limit_threshold", "penalty_duration_seconds", "is_active", "created_at", "updated_at" FROM `zone_configs`;--> statement-breakpoint
DROP TABLE `zone_configs`;--> statement-breakpoint
ALTER TABLE `__new_zone_configs` RENAME TO `zone_configs`;--> statement-breakpoint
PRAGMA foreign_keys=ON;