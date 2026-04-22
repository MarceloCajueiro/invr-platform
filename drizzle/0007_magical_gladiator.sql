ALTER TABLE `challenges` ADD `published_at` integer;--> statement-breakpoint
ALTER TABLE `lessons` ADD `published_at` integer;--> statement-breakpoint
ALTER TABLE `posts` ADD `published_at` integer;--> statement-breakpoint
ALTER TABLE `tasks` ADD `published_at` integer;--> statement-breakpoint
UPDATE `lessons` SET `published_at` = `created_at` WHERE `published_at` IS NULL;--> statement-breakpoint
UPDATE `posts` SET `published_at` = `created_at` WHERE `published_at` IS NULL;--> statement-breakpoint
UPDATE `tasks` SET `published_at` = `created_at` WHERE `published_at` IS NULL;--> statement-breakpoint
UPDATE `challenges` SET `published_at` = `created_at` WHERE `published_at` IS NULL;
