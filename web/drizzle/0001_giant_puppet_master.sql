CREATE TABLE `exercises` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`name` varchar(120) NOT NULL,
	`muscleGroup` varchar(80) NOT NULL,
	`equipment` varchar(80) NOT NULL,
	`isStandard` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `exercises_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `splitDayExercises` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`splitDayId` int NOT NULL,
	`exerciseId` int NOT NULL,
	`orderIndex` int NOT NULL DEFAULT 0,
	`targetSets` int NOT NULL DEFAULT 3,
	`targetReps` varchar(30) NOT NULL DEFAULT '8-12',
	`restSeconds` int NOT NULL DEFAULT 90,
	`notes` text,
	CONSTRAINT `splitDayExercises_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `splitDays` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`splitId` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`focus` varchar(120) NOT NULL,
	`dayOrder` int NOT NULL DEFAULT 0,
	CONSTRAINT `splitDays_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `splits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `splits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workoutExercises` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`workoutId` int NOT NULL,
	`exerciseId` int NOT NULL,
	`orderIndex` int NOT NULL DEFAULT 0,
	`targetSets` int NOT NULL DEFAULT 3,
	`targetReps` varchar(30) NOT NULL DEFAULT '8-12',
	CONSTRAINT `workoutExercises_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workoutSets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`workoutId` int NOT NULL,
	`workoutExerciseId` int NOT NULL,
	`setNumber` int NOT NULL,
	`weightTenth` int NOT NULL DEFAULT 0,
	`reps` int NOT NULL DEFAULT 0,
	`rpeTenth` int,
	`notes` text,
	`completed` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workoutSets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workouts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`splitDayId` int,
	`name` varchar(160) NOT NULL,
	`status` enum('in_progress','completed') NOT NULL DEFAULT 'in_progress',
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`notes` text,
	CONSTRAINT `workouts_id` PRIMARY KEY(`id`)
);
