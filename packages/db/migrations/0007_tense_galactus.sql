ALTER TABLE `attack_logs` RENAME TO `action_logs`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_action_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`zone_config_id` text NOT NULL,
	`rule_id` text NOT NULL,
	`action_taken` text NOT NULL,
	`ip` text NOT NULL,
	`request_count` integer NOT NULL,
	`cf_list_item_id` text,
	`blocked_at` integer NOT NULL,
	FOREIGN KEY (`zone_config_id`) REFERENCES `zone_configs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_action_logs`("id", "tenant_id", "zone_config_id", "rule_id", "action_taken", "ip", "request_count", "cf_list_item_id", "blocked_at") SELECT "id", "tenant_id", "zone_config_id", "rule_id", "action_taken", "ip", "request_count", "cf_list_item_id", "blocked_at" FROM `action_logs`;--> statement-breakpoint
DROP TABLE `action_logs`;--> statement-breakpoint
ALTER TABLE `__new_action_logs` RENAME TO `action_logs`;--> statement-breakpoint
PRAGMA foreign_keys=ON;