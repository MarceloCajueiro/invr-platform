import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

// ============================================================================
// Auth tables (better-auth managed)
// ============================================================================

export const user = sqliteTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("emailVerified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  role: text("role", { enum: ["teacher", "student"] })
    .notNull()
    .default("teacher"),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const session = sqliteTable("session", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const account = sqliteTable("account", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: integer("accessTokenExpiresAt", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refreshTokenExpiresAt", { mode: "timestamp" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const verification = sqliteTable("verification", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ============================================================================
// App tables
// ============================================================================

export const teachers = sqliteTable("teachers", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  plan: text("plan", { enum: ["free", "pro", "school"] })
    .notNull()
    .default("free"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const students = sqliteTable(
  "students",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    teacherId: text("teacher_id")
      .notNull()
      .references(() => teachers.id),
    lastActivityAt: integer("last_activity_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [index("students_teacher_id_idx").on(table.teacherId)],
);

export const invitations = sqliteTable("invitations", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  teacherId: text("teacher_id")
    .notNull()
    .references(() => teachers.id),
  turmaId: text("turma_id").references(() => turmas.id),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  acceptedAt: integer("accepted_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const lessons = sqliteTable(
  "lessons",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    teacherId: text("teacher_id")
      .notNull()
      .references(() => teachers.id),
    title: text("title").notNull(),
    content: text("content"), // Tiptap JSON
    category: text("category", {
      enum: ["conversation", "grammar", "vocabulary", "listening", "culture"],
    }).notNull(),
    coverImageUrl: text("cover_image_url"),
    durationMinutes: integer("duration_minutes"),
    status: text("status", { enum: ["draft", "published"] })
      .notNull()
      .default("draft"),
    position: integer("position").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("lessons_teacher_id_status_idx").on(table.teacherId, table.status),
  ],
);

export const tasks = sqliteTable(
  "tasks",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    teacherId: text("teacher_id")
      .notNull()
      .references(() => teachers.id),
    lessonId: text("lesson_id").references(() => lessons.id),
    title: text("title").notNull(),
    description: text("description"),
    taskType: text("task_type", {
      enum: ["quiz", "listening", "fill_gaps", "writing"],
    }).notNull(),
    questions: text("questions"),
    level: text("level", {
      enum: ["beginner", "intermediate", "advanced"],
    })
      .notNull()
      .default("beginner"),
    status: text("status", { enum: ["draft", "published"] })
      .notNull()
      .default("draft"),
    aiGenerated: integer("ai_generated", { mode: "boolean" })
      .notNull()
      .default(false),
    aiPrompt: text("ai_prompt"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("tasks_teacher_id_status_idx").on(table.teacherId, table.status),
  ],
);

export const submissions = sqliteTable(
  "submissions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id),
    taskId: text("task_id")
      .notNull()
      .references(() => tasks.id),
    answers: text("answers"),
    score: integer("score"),
    feedback: text("feedback"),
    gradedBy: text("graded_by", { enum: ["auto", "ai", "teacher"] }),
    status: text("status", {
      enum: ["in_progress", "submitted", "graded"],
    })
      .notNull()
      .default("submitted"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("submissions_student_id_idx").on(table.studentId),
    index("submissions_task_id_idx").on(table.taskId),
    index("submissions_status_idx").on(table.status),
  ],
);

export const lessonProgresses = sqliteTable(
  "lesson_progresses",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id),
    lessonId: text("lesson_id")
      .notNull()
      .references(() => lessons.id),
    progress: integer("progress").notNull().default(0),
    watchedAt: integer("watched_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    uniqueIndex("lesson_progresses_student_lesson_idx").on(
      table.studentId,
      table.lessonId,
    ),
    index("lesson_progresses_student_id_idx").on(table.studentId),
  ],
);

export const posts = sqliteTable(
  "posts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    teacherId: text("teacher_id")
      .notNull()
      .references(() => teachers.id),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    content: text("content"), // Tiptap JSON (was Markdown)
    coverImageUrl: text("cover_image_url"),
    category: text("category", {
      enum: ["tips", "grammar", "culture", "vocabulary"],
    }).notNull(),
    featured: integer("featured", { mode: "boolean" }).notNull().default(false),
    status: text("status", { enum: ["draft", "published"] })
      .notNull()
      .default("draft"),
    viewCount: integer("view_count").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("posts_teacher_id_status_idx").on(table.teacherId, table.status),
  ],
);

function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const turmas = sqliteTable(
  "turmas",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    teacherId: text("teacher_id")
      .notNull()
      .references(() => teachers.id),
    name: text("name").notNull(),
    description: text("description"),
    color: text("color"),
    level: text("level", {
      enum: ["beginner", "intermediate", "advanced"],
    }),
    inviteCode: text("invite_code")
      .notNull()
      .unique()
      .$defaultFn(() => generateInviteCode()),
    notifyNewLesson: integer("notify_new_lesson", { mode: "boolean" })
      .notNull()
      .default(true),
    notifyNewTask: integer("notify_new_task", { mode: "boolean" })
      .notNull()
      .default(true),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [index("turmas_teacher_id_idx").on(table.teacherId)],
);

export const turmaStudents = sqliteTable(
  "turma_students",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    turmaId: text("turma_id")
      .notNull()
      .references(() => turmas.id, { onDelete: "cascade" }),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    uniqueIndex("turma_students_turma_student_idx").on(
      table.turmaId,
      table.studentId,
    ),
  ],
);

export const turmaLessons = sqliteTable(
  "turma_lessons",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    turmaId: text("turma_id")
      .notNull()
      .references(() => turmas.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    uniqueIndex("turma_lessons_turma_lesson_idx").on(
      table.turmaId,
      table.lessonId,
    ),
  ],
);

export const turmaTasks = sqliteTable(
  "turma_tasks",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    turmaId: text("turma_id")
      .notNull()
      .references(() => turmas.id, { onDelete: "cascade" }),
    taskId: text("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    uniqueIndex("turma_tasks_turma_task_idx").on(table.turmaId, table.taskId),
  ],
);

export const turmaPosts = sqliteTable(
  "turma_posts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    turmaId: text("turma_id")
      .notNull()
      .references(() => turmas.id, { onDelete: "cascade" }),
    postId: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    uniqueIndex("turma_posts_turma_post_idx").on(table.turmaId, table.postId),
  ],
);

