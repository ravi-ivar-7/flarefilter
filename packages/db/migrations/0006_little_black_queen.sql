PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_action_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`zone_config_id` text NOT NULL,
	`rule_id` text NOT NULL,
	`action_taken` text NOT NULL,
	`target_type` text DEFAULT 'IP' NOT NULL,
	`target_value` text NOT NULL,
	`request_count` integer,
	`metadata` text,
	`timestamp` integer NOT NULL,
	FOREIGN KEY (`zone_config_id`) REFERENCES `zone_configs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_action_logs`("id", "tenant_id", "zone_config_id", "rule_id", "action_taken", "target_type", "target_value", "request_count", "metadata", "timestamp") SELECT "id", "tenant_id", "zone_config_id", "rule_id", "action_taken", "target_type", "target_value", "request_count", "metadata", "timestamp" FROM `action_logs`;--> statement-breakpoint
DROP TABLE `action_logs`;--> statement-breakpoint
ALTER TABLE `__new_action_logs` RENAME TO `action_logs`;--> statement-breakpoint
PRAGMA foreign_keys=ON;