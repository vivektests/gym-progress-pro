ALTER TABLE `trainingBlocks` ADD `currentWeek` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `workouts` ADD `trainingBlockWeekId` int;