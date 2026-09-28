CREATE TABLE `hicare_admin_accounts` (
	`id` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`passwordHash` varchar(128) NOT NULL,
	`salt` varchar(32) NOT NULL,
	`createdAt` timestamp NOT NULL,
	CONSTRAINT `hicare_admin_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `hicare_admin_accounts_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `hicare_condition_audits` (
	`id` varchar(64) NOT NULL,
	`conditionId` varchar(64) NOT NULL,
	`adminEmail` varchar(320) NOT NULL,
	`action` varchar(16) NOT NULL,
	`isActive` boolean NOT NULL,
	`notice` varchar(160) NOT NULL DEFAULT '',
	`openDate` timestamp,
	`changedAt` timestamp NOT NULL,
	CONSTRAINT `hicare_condition_audits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hicare_condition_statuses` (
	`conditionId` varchar(64) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`notice` varchar(160) NOT NULL DEFAULT '',
	`openDate` timestamp,
	`updatedAt` timestamp,
	CONSTRAINT `hicare_condition_statuses_conditionId` PRIMARY KEY(`conditionId`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
