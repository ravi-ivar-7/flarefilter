CREATE TABLE `add_to_list_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`zone_config_id` text NOT NULL,
	`tenant_id` text NOT NULL,
	`cf_list_id` text NOT NULL,
	`rate_limit_threshold` integer DEFAULT 10000,
	`window_seconds` integer DEFAULT 300,
	`is_active` integer DEFAULT true,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`zone_config_id`) REFERENCES `zone_configs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tenant_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `cloudflare_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`label` text NOT NULL,
	`cf_account_id` text NOT NULL,
	`cf_api_token` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `attack_logs` ADD `rule_id` text NOT NULL REFERENCES add_to_list_rules(id);--> statement-breakpoint
ALTER TABLE `attack_logs` ADD `cf_list_item_id` text;--> statement-breakpoint
ALTER TABLE `attack_logs` DROP COLUMN `expires_at`;--> statement-breakpoint
ALTER TABLE `request_activity` ADD `window_start` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `zone_configs` ADD `cf_account_ref` text NOT NULL REFERENCES cloudflare_accounts(id);--> statement-breakpoint
ALTER TABLE `zone_configs` ADD `polling_interval_minutes` integer DEFAULT 5;--> statement-breakpoint
ALTER TABLE `zone_configs` DROP COLUMN `cf_account_id`;--> statement-breakpoint
ALTER TABLE `zone_configs` DROP COLUMN `cf_api_token`;--> statement-breakpoint
ALTER TABLE `zone_configs` DROP COLUMN `cron_interval`;--> statement-breakpoint
ALTER TABLE `zone_configs` DROP COLUMN `rate_limit_threshold`;--> statement-breakpoint
ALTER TABLE `zone_configs` DROP COLUMN `penalty_duration_seconds`;