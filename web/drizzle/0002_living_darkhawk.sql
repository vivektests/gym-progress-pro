CREATE TABLE `trainingBlockWeeks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`blockId` int NOT NULL,
	`weekNumber` int NOT NULL,
	`label` varchar(120) NOT NULL DEFAULT 'Build',
	`intent` text,
	`deload` int NOT NULL DEFAULT 0,
	`volumeMultiplierTenth` int NOT NULL DEFAULT 10,
	`splitId` int,
	CONSTRAINT `trainingBlockWeeks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trainingBlocks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`goal` varchar(120) NOT NULL DEFAULT 'Progressive overload',
	`durationWeeks` int NOT NULL DEFAULT 4,
	`startDate` timestamp,
	`status` enum('draft','active','completed','archived') NOT NULL DEFAULT 'draft',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `trainingBlocks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `splitDayExercises` ADD `targetRpeTenth` int;--> statement-breakpoint
ALTER TABLE `splitDayExercises` ADD `targetRirTenth` int;--> statement-breakpoint
ALTER TABLE `splitDayExercises` ADD `repMin` int DEFAULT 8 NOT NULL;--> statement-breakpoint
ALTER TABLE `splitDayExercises` ADD `repMax` int DEFAULT 12 NOT NULL;--> statement-breakpoint
ALTER TABLE `splitDayExercises` ADD `loadIncrementTenth` int DEFAULT 25 NOT NULL;--> statement-breakpoint
ALTER TABLE `splitDayExercises` ADD `progressionStrategy` enum('double_progression','rpe_autoregulation','fixed_load') DEFAULT 'double_progression' NOT NULL;--> statement-breakpoint
ALTER TABLE `workoutExercises` ADD `targetRpeTenth` int;--> statement-breakpoint
ALTER TABLE `workoutExercises` ADD `targetRirTenth` int;--> statement-breakpoint
ALTER TABLE `workoutExercises` ADD `repMin` int DEFAULT 8 NOT NULL;--> statement-breakpoint
ALTER TABLE `workoutExercises` ADD `repMax` int DEFAULT 12 NOT NULL;--> statement-breakpoint
ALTER TABLE `workoutExercises` ADD `loadIncrementTenth` int DEFAULT 25 NOT NULL;--> statement-breakpoint
ALTER TABLE `workoutExercises` ADD `progressionStrategy` enum('double_progression','rpe_autoregulation','fixed_load') DEFAULT 'double_progression' NOT NULL;--> statement-breakpoint
ALTER TABLE `workoutExercises` ADD `restSeconds` int DEFAULT 90 NOT NULL;--> statement-breakpoint
ALTER TABLE `workoutSets` ADD `rirTenth` int;