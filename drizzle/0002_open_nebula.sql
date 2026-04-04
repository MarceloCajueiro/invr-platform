ALTER TABLE `lessons` ADD `content` text;--> statement-breakpoint
UPDATE `lessons` SET `content` = `description` WHERE `description` IS NOT NULL;--> statement-breakpoint
ALTER TABLE `lessons` DROP COLUMN `description`;--> statement-breakpoint
ALTER TABLE `lessons` DROP COLUMN `video_url`;--> statement-breakpoint
ALTER TABLE `lessons` DROP COLUMN `audio_urls`;--> statement-breakpoint
ALTER TABLE `lessons` DROP COLUMN `document_urls`;--> statement-breakpoint
ALTER TABLE `posts` ADD `cover_image_url` text;