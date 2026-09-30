CREATE TABLE `hicare_activity_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`eventType` varchar(64) NOT NULL,
	`conditionId` varchar(64),
	`keywordId` varchar(128),
	`metadata` text,
	`createdAt` timestamp NOT NULL,
	CONSTRAINT `hicare_activity_logs_id` PRIMARY KEY(`id`)
);
