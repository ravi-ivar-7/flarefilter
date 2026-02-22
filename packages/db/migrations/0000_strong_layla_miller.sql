CREATE TABLE `attack_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`zone_config_id` text NOT NULL,
	`ip` text NOT NULL,
	`request_count` integer NOT NULL,
	`blocked_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`zone_config_id`) REFERENCES `zone_configs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `request_activity` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`zone_config_id` text NOT NULL,
	`ip` text NOT NULL,
	`request_count` integer NOT NULL,
	`timestamp` integer NOT NULL,
	FOREIGN KEY (`zone_config_id`) REFERENCES `zone_configs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `zone_configs` (
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
	`updated_at` integer NOT NULL
);
