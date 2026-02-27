ALTER TABLE `action_logs` RENAME COLUMN "tenant_id" TO "user_id";--> statement-breakpoint
ALTER TABLE `request_activity` RENAME COLUMN "tenant_id" TO "user_id";--> statement-breakpoint
DROP TABLE `invitation`;--> statement-breakpoint
DROP TABLE `member`;--> statement-breakpoint
DROP TABLE `organization`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_add_ip_to_list_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text DEFAULT 'IP Mitigation Rule' NOT NULL,
	`zone_config_id` text NOT NULL,
	`user_id` text NOT NULL,
	`cf_list_id` text NOT NULL,
	`cf_list_name` text,
	`rate_limit_threshold` integer DEFAULT 10000 NOT NULL,
	`window_seconds` integer DEFAULT 300 NOT NULL,
	`is_active` integer DEFAULT true,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`zone_config_id`) REFERENCES `zone_configs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_add_ip_to_list_rules`("id", "name", "zone_config_id", "user_id", "cf_list_id", "cf_list_name", "rate_limit_threshold", "window_seconds", "is_active", "created_at", "updated_at") SELECT "id", "name", "zone_config_id", "user_id", "cf_list_id", "cf_list_name", "rate_limit_threshold", "window_seconds", "is_active", "created_at", "updated_at" FROM `add_ip_to_list_rules`;--> statement-breakpoint
DROP TABLE `add_ip_to_list_rules`;--> statement-breakpoint
ALTER TABLE `__new_add_ip_to_list_rules` RENAME TO `add_ip_to_list_rules`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_cloudflare_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`label` text NOT NULL,
	`cf_account_id` text NOT NULL,
	`cf_api_token` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_cloudflare_accounts`("id", "user_id", "label", "cf_account_id", "cf_api_token", "created_at", "updated_at") SELECT "id", "user_id", "label", "cf_account_id", "cf_api_token", "created_at", "updated_at" FROM `cloudflare_accounts`;--> statement-breakpoint
DROP TABLE `cloudflare_accounts`;--> statement-breakpoint
ALTER TABLE `__new_cloudflare_accounts` RENAME TO `cloudflare_accounts`;--> statement-breakpoint
CREATE TABLE `__new_zone_configs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`cf_account_ref` text NOT NULL,
	`name` text NOT NULL,
	`cf_zone_id` text NOT NULL,
	`is_active` integer DEFAULT true,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`cf_account_ref`) REFERENCES `cloudflare_accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_zone_configs`("id", "user_id", "cf_account_ref", "name", "cf_zone_id", "is_active", "created_at", "updated_at") SELECT "id", "user_id", "cf_account_ref", "name", "cf_zone_id", "is_active", "created_at", "updated_at" FROM `zone_configs`;--> statement-breakpoint
DROP TABLE `zone_configs`;--> statement-breakpoint
ALTER TABLE `__new_zone_configs` RENAME TO `zone_configs`;--> statement-breakpoint
ALTER TABLE `session` DROP COLUMN `activeOrganizationId`;