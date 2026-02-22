PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_member` (
	`id` text PRIMARY KEY NOT NULL,
	`organizationId` text NOT NULL,
	`userId` text NOT NULL,
	`email` text,
	`role` text NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`organizationId`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_member`("id", "organizationId", "userId", "email", "role", "createdAt") SELECT "id", "organizationId", "userId", "email", "role", "createdAt" FROM `member`;--> statement-breakpoint
DROP TABLE `member`;--> statement-breakpoint
ALTER TABLE `__new_member` RENAME TO `member`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `session` ADD `activeOrganizationId` text;