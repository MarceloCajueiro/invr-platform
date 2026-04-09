CREATE TABLE `challenge_responses` (
	`id` text PRIMARY KEY NOT NULL,
	`challenge_id` text NOT NULL,
	`student_id` text NOT NULL,
	`content` text,
	`attachments` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`challenge_id`) REFERENCES `challenges`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `challenge_responses_challenge_student_idx` ON `challenge_responses` (`challenge_id`,`student_id`);--> statement-breakpoint
CREATE INDEX `challenge_responses_challenge_id_idx` ON `challenge_responses` (`challenge_id`);--> statement-breakpoint
CREATE INDEX `challenge_responses_student_id_idx` ON `challenge_responses` (`student_id`);--> statement-breakpoint
CREATE TABLE `challenges` (
	`id` text PRIMARY KEY NOT NULL,
	`teacher_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`cover_image_url` text,
	`due_date` integer,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `challenges_teacher_id_status_idx` ON `challenges` (`teacher_id`,`status`);--> statement-breakpoint
CREATE TABLE `turma_challenges` (
	`id` text PRIMARY KEY NOT NULL,
	`turma_id` text NOT NULL,
	`challenge_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`turma_id`) REFERENCES `turmas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`challenge_id`) REFERENCES `challenges`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `turma_challenges_turma_challenge_idx` ON `turma_challenges` (`turma_id`,`challenge_id`);