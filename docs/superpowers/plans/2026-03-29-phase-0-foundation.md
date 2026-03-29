# Phase 0: Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up the Next.js project on Cloudflare Workers with auth, database, storage, email, and all 3 layouts (auth/student/teacher) working end-to-end.

**Architecture:** Monolith Next.js 15 App Router deployed to Cloudflare Workers via @opennextjs/cloudflare. D1 for database (Drizzle ORM), R2 for file storage, better-auth for authentication, Resend for email. Three route groups with independent layouts.

**Tech Stack:** Next.js 15, @opennextjs/cloudflare, Drizzle ORM, Cloudflare D1, Cloudflare R2, better-auth, Resend, Tailwind CSS v4, Lucide React, React Email

---

### Task 1: Initialize Next.js Project with Cloudflare

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `open-next.config.ts`
- Create: `wrangler.jsonc`
- Create: `cloudflare-env.d.ts`
- Create: `tsconfig.json`
- Create: `.gitignore`
- Create: `.dev.vars`
- Create: `.env.example`

- [ ] **Step 1: Create Next.js project from Cloudflare template**

```bash
cd /Users/marcelo/Code/empreendimentos
npm create cloudflare@latest -- inr-platform --framework=next --platform=workers
```

Follow the prompts: select App Router, TypeScript, Tailwind CSS, ESLint, `src/` directory, no import alias customization.

- [ ] **Step 2: Verify the project was created and enter directory**

```bash
cd /Users/marcelo/Code/empreendimentos/inr-platform
ls -la
```

Expected: `package.json`, `next.config.ts`, `wrangler.jsonc`, `open-next.config.ts`, `src/` directory, etc.

- [ ] **Step 3: Install core dependencies**

```bash
npm install drizzle-orm better-auth @react-email/components resend lucide-react aws4fetch
npm install --save-dev drizzle-kit @types/node
```

- [ ] **Step 4: Configure wrangler.jsonc with D1 and R2 bindings**

Create the D1 database first:

```bash
npx wrangler d1 create fluent-db
```

Note the `database_id` from the output.

Create the R2 bucket:

```bash
npx wrangler r2 bucket create fluent-storage
```

Then update `wrangler.jsonc`:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "fluent",
  "main": ".open-next/worker.js",
  "compatibility_date": "2024-12-30",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "directory": ".open-next/assets",
    "binding": "ASSETS"
  },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "fluent-db",
      "database_id": "<PASTE_ID_HERE>",
      "migrations_dir": "drizzle"
    }
  ],
  "r2_buckets": [
    {
      "binding": "BUCKET",
      "bucket_name": "fluent-storage"
    }
  ]
}
```

- [ ] **Step 5: Create .dev.vars with local secrets**

```
BETTER_AUTH_SECRET=dev-secret-change-me-in-production-min-32-chars
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
RESEND_API_KEY=re_PLACEHOLDER
GROQ_API_KEY=gsk_PLACEHOLDER
GEMINI_API_KEY=AIza_PLACEHOLDER
R2_ACCOUNT_ID=PLACEHOLDER
R2_ACCESS_KEY_ID=PLACEHOLDER
R2_SECRET_ACCESS_KEY=PLACEHOLDER
```

- [ ] **Step 6: Update next.config.ts with OpenNext dev init**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
```

- [ ] **Step 7: Generate Cloudflare types**

```bash
npx wrangler types --env-interface CloudflareEnv cloudflare-env.d.ts
```

- [ ] **Step 8: Update .gitignore**

Add these lines to the existing `.gitignore`:

```
.open-next
.dev.vars
.wrangler
```

- [ ] **Step 9: Verify dev server starts**

```bash
npm run dev
```

Expected: Next.js dev server starts on http://localhost:3000 without errors.

- [ ] **Step 10: Commit**

```bash
git init
git add .
git commit -m "chore: initialize Next.js 15 project with Cloudflare Workers setup"
```

---

### Task 2: Tailwind v4 Design System Tokens

**Files:**
- Create: `src/styles/globals.css`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Install Google Fonts (Bricolage Grotesque, Outfit, JetBrains Mono)**

```bash
npm install @fontsource-variable/bricolage-grotesque @fontsource-variable/outfit @fontsource/jetbrains-mono
```

- [ ] **Step 2: Create globals.css with all DS tokens**

Create `src/styles/globals.css`:

```css
@import "tailwindcss";

@theme {
  /* Colors — Base */
  --color-bg-dark: #1a1a2e;
  --color-bg-light: #fafafa;
  --color-bg-card: #ffffff;
  --color-text-primary: #2d3436;
  --color-text-secondary: #636e72;
  --color-text-muted: #9aa3b8;
  --color-border: #e8ecf4;

  /* Colors — Channels */
  --color-aulas: #6c5ce7;
  --color-aulas-light: #a29bfe;
  --color-aulas-bg: #f0eeff;

  --color-tarefas: #00b894;
  --color-tarefas-light: #55efc4;
  --color-tarefas-bg: #eafff7;

  --color-fora: #e17055;
  --color-fora-light: #fab1a0;
  --color-fora-bg: #fff3f0;

  --color-challenges: #fdcb6e;
  --color-challenges-light: #ffeaa7;
  --color-challenges-bg: #fffcf0;

  /* Colors — Semantic */
  --color-success: #00b894;
  --color-warning: #fdcb6e;
  --color-error: #e17055;
  --color-info: #0984e3;

  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);
  --shadow-xl: 0 12px 48px rgba(0, 0, 0, 0.16);

  /* Border Radius */
  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;

  /* Font Sizes */
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;
  --font-size-4xl: 2.25rem;

  /* Animations */
  --animate-fade-in: fade-in 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  --animate-slide-up: slide-up 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  --animate-pop-in: pop-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  --animate-bar-grow: bar-grow 0.5s cubic-bezier(0.22, 1, 0.36, 1);
  --animate-splash-bounce: splash-bounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);

  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slide-up {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes pop-in {
    from { opacity: 0; transform: scale(0); }
    60% { transform: scale(1.15); }
    to { opacity: 1; transform: scale(1); }
  }

  @keyframes bar-grow {
    from { transform: scaleY(0); }
    to { transform: scaleY(1); }
  }

  @keyframes splash-bounce {
    from { transform: scale(0); }
    70% { transform: scale(1.2); }
    to { transform: scale(1); }
  }

  @keyframes glow-pulse {
    0%, 100% { box-shadow: 0 0 12px var(--glow-color, rgba(108, 92, 231, 0.3)); }
    50% { box-shadow: 0 0 28px var(--glow-color, rgba(108, 92, 231, 0.5)); }
  }
}

/* Noise texture on body */
body {
  background-color: var(--color-bg-light);
  color: var(--color-text-primary);
  font-family: 'Outfit Variable', 'Outfit', sans-serif;
}

body::after {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  opacity: 0.025;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  background-size: 200px 200px;
  z-index: 9999;
}
```

- [ ] **Step 3: Update root layout.tsx with fonts and globals.css**

Replace `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/outfit";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Fluent",
  description: "AI-powered English learning platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 4: Verify Tailwind tokens work**

Create a temporary test in `src/app/page.tsx`:

```tsx
export default function Home() {
  return (
    <div className="min-h-screen bg-bg-light flex items-center justify-center">
      <div className="bg-bg-card p-8 rounded-[var(--radius-md)] shadow-md">
        <h1 className="text-2xl font-bold text-text-primary" style={{ fontFamily: "'Bricolage Grotesque Variable', serif" }}>
          Fluent
        </h1>
        <p className="text-text-secondary mt-2">Design system tokens working</p>
        <div className="flex gap-2 mt-4">
          <div className="w-8 h-8 rounded-full bg-aulas" />
          <div className="w-8 h-8 rounded-full bg-tarefas" />
          <div className="w-8 h-8 rounded-full bg-fora" />
          <div className="w-8 h-8 rounded-full bg-challenges" />
        </div>
      </div>
    </div>
  );
}
```

Run `npm run dev` and verify at http://localhost:3000:
- Card with white bg, rounded corners, shadow
- "Fluent" in Bricolage Grotesque
- Body text in Outfit
- 4 colored circles (purple, green, coral, gold)

- [ ] **Step 5: Commit**

```bash
git add src/styles/globals.css src/app/layout.tsx src/app/page.tsx package.json package-lock.json
git commit -m "feat: add Tailwind v4 design system tokens and fonts"
```

---

### Task 3: Database Schema with Drizzle ORM

**Files:**
- Create: `drizzle.config.ts`
- Create: `src/lib/db/schema.ts`
- Create: `src/lib/db/index.ts`

- [ ] **Step 1: Create drizzle.config.ts**

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/lib/db/schema.ts",
  dialect: "sqlite",
});
```

- [ ] **Step 2: Create the full database schema**

Create `src/lib/db/schema.ts`:

```typescript
import { sql } from "drizzle-orm";
import { text, integer, sqliteTable, uniqueIndex, index } from "drizzle-orm/sqlite-core";

// ============================================================
// Auth Tables (better-auth managed)
// ============================================================

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("emailVerified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  role: text("role", { enum: ["teacher", "student"] }).notNull().default("teacher"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: integer("accessTokenExpiresAt", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refreshTokenExpiresAt", { mode: "timestamp" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }),
  updatedAt: integer("updatedAt", { mode: "timestamp" }),
});

// ============================================================
// Application Tables
// ============================================================

export const teachers = sqliteTable("teachers", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().unique().references(() => user.id, { onDelete: "cascade" }),
  plan: text("plan", { enum: ["free", "pro", "school"] }).notNull().default("free"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const students = sqliteTable("students", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().unique().references(() => user.id, { onDelete: "cascade" }),
  teacherId: text("teacher_id").notNull().references(() => teachers.id),
  xp: integer("xp").notNull().default(0),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastActivityAt: integer("last_activity_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}, (table) => [
  index("idx_students_teacher").on(table.teacherId),
]);

export const invitations = sqliteTable("invitations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  teacherId: text("teacher_id").notNull().references(() => teachers.id),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  acceptedAt: integer("accepted_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const lessons = sqliteTable("lessons", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  teacherId: text("teacher_id").notNull().references(() => teachers.id),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category", { enum: ["conversation", "grammar", "vocabulary", "listening", "culture"] }).notNull(),
  videoUrl: text("video_url"),
  coverImageUrl: text("cover_image_url"),
  durationMinutes: integer("duration_minutes"),
  status: text("status", { enum: ["draft", "published"] }).notNull().default("draft"),
  position: integer("position").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}, (table) => [
  index("idx_lessons_teacher_status").on(table.teacherId, table.status),
]);

export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  teacherId: text("teacher_id").notNull().references(() => teachers.id),
  lessonId: text("lesson_id").references(() => lessons.id),
  title: text("title").notNull(),
  description: text("description"),
  taskType: text("task_type", { enum: ["quiz", "listening", "fill_gaps", "writing"] }).notNull(),
  questions: text("questions"), // JSON string
  level: text("level", { enum: ["beginner", "intermediate", "advanced"] }).notNull().default("beginner"),
  status: text("status", { enum: ["draft", "published"] }).notNull().default("draft"),
  aiGenerated: integer("ai_generated", { mode: "boolean" }).notNull().default(false),
  aiPrompt: text("ai_prompt"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}, (table) => [
  index("idx_tasks_teacher_status").on(table.teacherId, table.status),
]);

export const submissions = sqliteTable("submissions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  studentId: text("student_id").notNull().references(() => students.id),
  taskId: text("task_id").notNull().references(() => tasks.id),
  answers: text("answers"), // JSON string
  score: integer("score"),
  feedback: text("feedback"),
  gradedBy: text("graded_by", { enum: ["auto", "ai", "teacher"] }),
  status: text("status", { enum: ["in_progress", "submitted", "graded"] }).notNull().default("submitted"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}, (table) => [
  index("idx_submissions_student").on(table.studentId),
  index("idx_submissions_task").on(table.taskId),
  index("idx_submissions_status").on(table.status),
]);

export const lessonProgresses = sqliteTable("lesson_progresses", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  studentId: text("student_id").notNull().references(() => students.id),
  lessonId: text("lesson_id").notNull().references(() => lessons.id),
  progress: integer("progress").notNull().default(0),
  watchedAt: integer("watched_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}, (table) => [
  uniqueIndex("idx_lesson_progress_unique").on(table.studentId, table.lessonId),
  index("idx_lesson_progresses_student").on(table.studentId),
]);

export const posts = sqliteTable("posts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  teacherId: text("teacher_id").notNull().references(() => teachers.id),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content"),
  category: text("category", { enum: ["tips", "grammar", "culture", "vocabulary"] }).notNull(),
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  status: text("status", { enum: ["draft", "published"] }).notNull().default("draft"),
  viewCount: integer("view_count").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}, (table) => [
  index("idx_posts_teacher_status").on(table.teacherId, table.status),
]);

export const turmas = sqliteTable("turmas", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  teacherId: text("teacher_id").notNull().references(() => teachers.id),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color"),
  level: text("level", { enum: ["beginner", "intermediate", "advanced"] }),
  inviteCode: text("invite_code").notNull().unique().$defaultFn(() => Math.random().toString(36).substring(2, 8).toUpperCase()),
  notifyNewLesson: integer("notify_new_lesson", { mode: "boolean" }).notNull().default(true),
  notifyNewTask: integer("notify_new_task", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}, (table) => [
  index("idx_turmas_teacher").on(table.teacherId),
]);

export const turmaStudents = sqliteTable("turma_students", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  turmaId: text("turma_id").notNull().references(() => turmas.id, { onDelete: "cascade" }),
  studentId: text("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}, (table) => [
  uniqueIndex("idx_turma_students_unique").on(table.turmaId, table.studentId),
]);

export const turmaLessons = sqliteTable("turma_lessons", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  turmaId: text("turma_id").notNull().references(() => turmas.id, { onDelete: "cascade" }),
  lessonId: text("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}, (table) => [
  uniqueIndex("idx_turma_lessons_unique").on(table.turmaId, table.lessonId),
]);

export const turmaTasks = sqliteTable("turma_tasks", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  turmaId: text("turma_id").notNull().references(() => turmas.id, { onDelete: "cascade" }),
  taskId: text("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}, (table) => [
  uniqueIndex("idx_turma_tasks_unique").on(table.turmaId, table.taskId),
]);

export const challenges = sqliteTable("challenges", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  teacherId: text("teacher_id").notNull().references(() => teachers.id),
  title: text("title").notNull(),
  description: text("description"),
  difficulty: text("difficulty", { enum: ["easy", "medium", "hard"] }).notNull(),
  xpReward: integer("xp_reward").notNull().default(10),
  badgeEmoji: text("badge_emoji"),
  status: text("status", { enum: ["draft", "published"] }).notNull().default("draft"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});
```

- [ ] **Step 3: Create database client helper**

Create `src/lib/db/index.ts`:

```typescript
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function getDb() {
  const { env } = getCloudflareContext();
  return drizzle(env.DB, { schema });
}

export { schema };
```

- [ ] **Step 4: Generate initial migration**

```bash
npx drizzle-kit generate
```

Expected: creates `drizzle/0000_*.sql` with CREATE TABLE statements for all tables.

- [ ] **Step 5: Apply migration locally**

```bash
npx wrangler d1 migrations apply fluent-db --local
```

Expected: all tables created in local D1 SQLite.

- [ ] **Step 6: Commit**

```bash
git add drizzle.config.ts src/lib/db/ drizzle/
git commit -m "feat: add Drizzle ORM schema with all application tables"
```

---

### Task 4: better-auth Configuration

**Files:**
- Create: `src/lib/auth/server.ts`
- Create: `src/lib/auth/client.ts`
- Create: `src/app/api/auth/[...all]/route.ts`

- [ ] **Step 1: Create auth server configuration**

Create `src/lib/auth/server.ts`:

```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@/lib/db/schema";

export async function createAuth() {
  const { env } = await getCloudflareContext({ async: true });
  const db = drizzle(env.DB, { schema });

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",
      usePlural: false,
    }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
    },
    user: {
      additionalFields: {
        role: {
          type: "string",
          defaultValue: "teacher",
          input: false,
        },
      },
    },
    plugins: [
      nextCookies(),
    ],
  });
}
```

- [ ] **Step 2: Create auth client configuration**

Create `src/lib/auth/client.ts`:

```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
});

export const { signIn, signUp, signOut, useSession } = authClient;
```

- [ ] **Step 3: Create API route handler**

Create `src/app/api/auth/[...all]/route.ts`:

```typescript
import { createAuth } from "@/lib/auth/server";

export async function GET(req: Request) {
  const auth = await createAuth();
  return auth.handler(req);
}

export async function POST(req: Request) {
  const auth = await createAuth();
  return auth.handler(req);
}
```

- [ ] **Step 4: Verify auth endpoints respond**

Run `npm run dev`, then test:

```bash
curl -s http://localhost:3000/api/auth/ok | head -20
```

Expected: a JSON response (not a 404 or error page).

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth/ src/app/api/auth/
git commit -m "feat: configure better-auth with D1 adapter and API route handler"
```

---

### Task 5: Auth Middleware

**Files:**
- Create: `src/middleware.ts`

- [ ] **Step 1: Create middleware with role-based routing**

Create `src/middleware.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const publicPaths = ["/sign-in", "/sign-up", "/invite", "/api/auth"];

function isPublicPath(pathname: string) {
  return publicPaths.some((path) => pathname.startsWith(path));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = getSessionCookie(request);

  // Allow public paths
  if (isPublicPath(pathname)) {
    // Redirect authenticated users away from auth pages (not API or invite)
    if (sessionCookie && (pathname === "/sign-in" || pathname === "/sign-up")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Allow static assets and Next.js internals
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return NextResponse.next();
  }

  // Require authentication for all other routes
  if (!sessionCookie) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

- [ ] **Step 2: Verify middleware redirects unauthenticated users**

Run `npm run dev`, open http://localhost:3000/dashboard in a browser.

Expected: redirected to `/sign-in?callbackUrl=/dashboard`.

- [ ] **Step 3: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: add auth middleware with role-based routing"
```

---

### Task 6: Auth Layout (Split Screen)

**Files:**
- Create: `src/app/(auth)/layout.tsx`
- Create: `src/components/auth/brand-panel.tsx`

- [ ] **Step 1: Create the brand panel component**

Create `src/components/auth/brand-panel.tsx`:

```tsx
export function BrandPanel() {
  return (
    <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-bg-dark items-center justify-center">
      {/* Mesh gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 70% 30%, rgba(108, 92, 231, 0.35) 0%, transparent 60%),
            radial-gradient(ellipse at 30% 70%, rgba(0, 184, 148, 0.25) 0%, transparent 60%),
            linear-gradient(135deg, #1a1a2e 0%, #2d2b55 100%)
          `,
        }}
      />

      {/* Noise overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-md px-8 text-center">
        <h1
          className="text-4xl font-extrabold text-white mb-4"
          style={{ fontFamily: "'Bricolage Grotesque Variable', serif" }}
        >
          Fluent
        </h1>
        <p className="text-white/60 text-lg">
          Plataforma inteligente de ensino de inglês
        </p>

        {/* Glass pills */}
        <div className="flex gap-3 justify-center mt-8">
          {["Aulas", "Tarefas", "Blog", "Challenges"].map((label, i) => {
            const colors = ["bg-aulas/20 text-aulas-light", "bg-tarefas/20 text-tarefas-light", "bg-fora/20 text-fora-light", "bg-challenges/20 text-challenges-light"];
            return (
              <span
                key={label}
                className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm border border-white/[0.06] ${colors[i]}`}
              >
                {label}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create the auth layout**

Create `src/app/(auth)/layout.tsx`:

```tsx
import { BrandPanel } from "@/components/auth/brand-panel";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      <BrandPanel />

      {/* Form panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-8 bg-bg-light">
        <div className="w-full max-w-[420px]">{children}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(auth\)/layout.tsx src/components/auth/brand-panel.tsx
git commit -m "feat: add auth layout with split screen brand panel"
```

---

### Task 7: Sign-In and Sign-Up Pages

**Files:**
- Create: `src/app/(auth)/sign-in/page.tsx`
- Create: `src/app/(auth)/sign-up/page.tsx`

- [ ] **Step 1: Create sign-in page**

Create `src/app/(auth)/sign-in/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth/client";
import { Eye, EyeOff, LogIn } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: authError } = await authClient.signIn.email({
      email,
      password,
    }, {
      onSuccess: () => {
        router.push("/dashboard");
      },
      onError: (ctx) => {
        setError(ctx.error.message || "Email ou senha incorretos");
      },
    });

    setLoading(false);
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2
          className="text-3xl font-bold text-text-primary"
          style={{ fontFamily: "'Bricolage Grotesque Variable', serif" }}
        >
          Welcome back
        </h2>
        <p className="text-text-secondary mt-2">
          Entre na sua conta para continuar
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-[var(--radius-sm)] bg-fora-bg text-fora text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-xs font-medium text-text-primary mb-1.5">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2.5 rounded-[var(--radius-sm)] bg-[#f8f9fb] border border-border text-text-primary placeholder-text-muted focus:outline-none focus:border-aulas transition-colors"
            placeholder="seu@email.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-xs font-medium text-text-primary mb-1.5">
            Senha
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-[var(--radius-sm)] bg-[#f8f9fb] border border-border text-text-primary placeholder-text-muted focus:outline-none focus:border-aulas transition-colors pr-10"
              placeholder="Sua senha"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-[var(--radius-sm)] bg-aulas text-white font-medium hover:brightness-110 active:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <LogIn size={18} />
              Entrar
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        Não tem uma conta?{" "}
        <Link href="/sign-up" className="text-aulas font-medium hover:underline">
          Criar conta
        </Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Create sign-up page**

Create `src/app/(auth)/sign-up/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth/client";
import { Eye, EyeOff, UserPlus } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    await authClient.signUp.email({
      name,
      email,
      password,
    }, {
      onSuccess: async () => {
        // After signup, create teacher profile via server action
        const res = await fetch("/api/auth/setup-teacher", { method: "POST" });
        if (res.ok) {
          router.push("/dashboard");
        } else {
          setError("Erro ao configurar perfil. Tente novamente.");
        }
      },
      onError: (ctx) => {
        setError(ctx.error.message || "Erro ao criar conta");
      },
    });

    setLoading(false);
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2
          className="text-3xl font-bold text-text-primary"
          style={{ fontFamily: "'Bricolage Grotesque Variable', serif" }}
        >
          Criar conta
        </h2>
        <p className="text-text-secondary mt-2">
          Comece a usar o Fluent gratuitamente
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-[var(--radius-sm)] bg-fora-bg text-fora text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-xs font-medium text-text-primary mb-1.5">
            Nome
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2.5 rounded-[var(--radius-sm)] bg-[#f8f9fb] border border-border text-text-primary placeholder-text-muted focus:outline-none focus:border-aulas transition-colors"
            placeholder="Seu nome completo"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-xs font-medium text-text-primary mb-1.5">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2.5 rounded-[var(--radius-sm)] bg-[#f8f9fb] border border-border text-text-primary placeholder-text-muted focus:outline-none focus:border-aulas transition-colors"
            placeholder="seu@email.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-xs font-medium text-text-primary mb-1.5">
            Senha
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-3 py-2.5 rounded-[var(--radius-sm)] bg-[#f8f9fb] border border-border text-text-primary placeholder-text-muted focus:outline-none focus:border-aulas transition-colors pr-10"
              placeholder="Mínimo 8 caracteres"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-[var(--radius-sm)] bg-aulas text-white font-medium hover:brightness-110 active:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <UserPlus size={18} />
              Criar conta
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        Já tem uma conta?{" "}
        <Link href="/sign-in" className="text-aulas font-medium hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Create the setup-teacher API route**

Create `src/app/api/auth/setup-teacher/route.ts`:

```typescript
import { createAuth } from "@/lib/auth/server";
import { getDb } from "@/lib/db";
import { teachers } from "@/lib/db/schema";
import { headers } from "next/headers";

export async function POST() {
  const auth = await createAuth();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();

  // Check if teacher profile already exists
  const existing = await db.query.teachers.findFirst({
    where: (t, { eq }) => eq(t.userId, session.user.id),
  });

  if (existing) {
    return Response.json({ ok: true });
  }

  await db.insert(teachers).values({
    userId: session.user.id,
    plan: "free",
  });

  return Response.json({ ok: true });
}
```

- [ ] **Step 4: Verify sign-in page renders**

Run `npm run dev`, open http://localhost:3000/sign-in.

Expected: split screen layout — brand panel on left, sign-in form on right with email/password fields.

- [ ] **Step 5: Verify sign-up flow works end-to-end**

1. Go to http://localhost:3000/sign-up
2. Fill in name, email, password (min 8 chars)
3. Submit
4. Should redirect to /dashboard (which will show 404 for now — that's fine)

Verify in local D1:

```bash
npx wrangler d1 execute fluent-db --local --command "SELECT * FROM user;"
```

Expected: one row with the registered user.

```bash
npx wrangler d1 execute fluent-db --local --command "SELECT * FROM teachers;"
```

Expected: one row linked to the user.

- [ ] **Step 6: Commit**

```bash
git add src/app/\(auth\)/ src/app/api/auth/setup-teacher/
git commit -m "feat: add sign-in and sign-up pages with teacher profile creation"
```

---

### Task 8: Student Invitation Flow

**Files:**
- Create: `src/app/(auth)/invite/[token]/page.tsx`
- Create: `src/lib/actions/invitations.ts`
- Create: `src/components/emails/invite-email.tsx`

- [ ] **Step 1: Create invitation server actions**

Create `src/lib/actions/invitations.ts`:

```typescript
"use server";

import { createAuth } from "@/lib/auth/server";
import { getDb } from "@/lib/db";
import { invitations, students, user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Resend } from "resend";
import { headers } from "next/headers";

export async function createInvitation(email: string) {
  const auth = await createAuth();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user || session.user.role !== "teacher") {
    throw new Error("Unauthorized");
  }

  const db = getDb();

  // Find teacher profile
  const teacher = await db.query.teachers.findFirst({
    where: (t, { eq: e }) => e(t.userId, session.user.id),
  });

  if (!teacher) {
    throw new Error("Teacher profile not found");
  }

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h

  await db.insert(invitations).values({
    email,
    token,
    teacherId: teacher.id,
    expiresAt,
  });

  // Send email
  const resend = new Resend(process.env.RESEND_API_KEY);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  await resend.emails.send({
    from: "Fluent <noreply@fluent.app>",
    to: email,
    subject: `${session.user.name} convidou você para o Fluent`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h1 style="font-size: 24px; color: #2d3436;">Você foi convidado!</h1>
        <p style="color: #636e72; font-size: 16px;">
          ${session.user.name} convidou você para estudar inglês no Fluent.
        </p>
        <a href="${appUrl}/invite/${token}"
           style="display: inline-block; padding: 12px 24px; background: #6c5ce7; color: white; border-radius: 6px; text-decoration: none; font-weight: 500; margin-top: 16px;">
          Aceitar convite
        </a>
        <p style="color: #9aa3b8; font-size: 12px; margin-top: 24px;">
          Este convite expira em 48 horas.
        </p>
      </div>
    `,
  });

  return { success: true };
}

export async function getInvitationByToken(token: string) {
  const db = getDb();

  const invitation = await db.query.invitations.findFirst({
    where: (i, { eq: e }) => e(i.token, token),
  });

  if (!invitation) return null;
  if (invitation.acceptedAt) return null;
  if (new Date(invitation.expiresAt) < new Date()) return null;

  return invitation;
}

export async function acceptInvitation(token: string, name: string, password: string) {
  const db = getDb();

  const invitation = await db.query.invitations.findFirst({
    where: (i, { eq: e }) => e(i.token, token),
  });

  if (!invitation || invitation.acceptedAt || new Date(invitation.expiresAt) < new Date()) {
    throw new Error("Invalid or expired invitation");
  }

  // Create user via better-auth
  const auth = await createAuth();

  const signUpResult = await auth.api.signUpEmail({
    body: {
      name,
      email: invitation.email,
      password,
    },
  });

  if (!signUpResult?.user) {
    throw new Error("Failed to create user account");
  }

  // Update user role to student
  await db.update(user).set({ role: "student" }).where(eq(user.id, signUpResult.user.id));

  // Create student profile
  await db.insert(students).values({
    userId: signUpResult.user.id,
    teacherId: invitation.teacherId,
  });

  // Mark invitation as accepted
  await db.update(invitations).set({ acceptedAt: new Date() }).where(eq(invitations.id, invitation.id));

  // Sign in the student
  const signInResult = await auth.api.signInEmail({
    body: {
      email: invitation.email,
      password,
    },
  });

  return { success: true, session: signInResult };
}
```

- [ ] **Step 2: Create the invite acceptance page**

Create `src/app/(auth)/invite/[token]/page.tsx`:

```tsx
"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { getInvitationByToken, acceptInvitation } from "@/lib/actions/invitations";
import { Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [valid, setValid] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    async function validate() {
      const invitation = await getInvitationByToken(token);
      if (invitation) {
        setValid(true);
        setEmail(invitation.email);
      }
      setValidating(false);
    }
    validate();
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await acceptInvitation(token, name, password);
      router.push("/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao aceitar convite");
    }

    setLoading(false);
  }

  if (validating) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-aulas/30 border-t-aulas rounded-full animate-spin" />
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="text-center animate-fade-in">
        <XCircle size={48} className="text-fora mx-auto mb-4" />
        <h2
          className="text-2xl font-bold text-text-primary"
          style={{ fontFamily: "'Bricolage Grotesque Variable', serif" }}
        >
          Convite inválido
        </h2>
        <p className="text-text-secondary mt-2">
          Este convite expirou ou já foi utilizado.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2
          className="text-3xl font-bold text-text-primary"
          style={{ fontFamily: "'Bricolage Grotesque Variable', serif" }}
        >
          Aceitar convite
        </h2>
        <p className="text-text-secondary mt-2">
          Complete seu cadastro para começar a estudar
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-[var(--radius-sm)] bg-fora-bg text-fora text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-text-primary mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full px-3 py-2.5 rounded-[var(--radius-sm)] bg-[#f0f1f3] border border-border text-text-muted cursor-not-allowed"
          />
        </div>

        <div>
          <label htmlFor="name" className="block text-xs font-medium text-text-primary mb-1.5">
            Nome
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2.5 rounded-[var(--radius-sm)] bg-[#f8f9fb] border border-border text-text-primary placeholder-text-muted focus:outline-none focus:border-tarefas transition-colors"
            placeholder="Seu nome"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-xs font-medium text-text-primary mb-1.5">
            Senha
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-3 py-2.5 rounded-[var(--radius-sm)] bg-[#f8f9fb] border border-border text-text-primary placeholder-text-muted focus:outline-none focus:border-tarefas transition-colors pr-10"
              placeholder="Mínimo 8 caracteres"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-[var(--radius-sm)] bg-tarefas text-white font-medium hover:brightness-110 active:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <CheckCircle size={18} />
              Aceitar e começar
            </>
          )}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/actions/invitations.ts src/app/\(auth\)/invite/
git commit -m "feat: add student invitation flow with email and accept page"
```

---

### Task 9: Teacher & Student Shell Layouts

**Files:**
- Create: `src/components/shared/sidebar.tsx`
- Create: `src/components/shared/mobile-nav.tsx`
- Create: `src/app/(teacher)/layout.tsx`
- Create: `src/app/(student)/layout.tsx`
- Create: `src/app/(teacher)/dashboard/page.tsx`
- Create: `src/app/(student)/home/page.tsx`

- [ ] **Step 1: Create the sidebar component**

Create `src/components/shared/sidebar.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/auth/client";
import {
  LayoutDashboard, BookOpen, ClipboardList, FileText,
  Users, GraduationCap, LogOut, Home,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  color?: string;
}

const teacherNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Aulas", href: "/lessons", icon: BookOpen, color: "aulas" },
  { label: "Tarefas", href: "/tasks", icon: ClipboardList, color: "tarefas" },
  { label: "Posts", href: "/posts", icon: FileText, color: "fora" },
  { label: "Turmas", href: "/turmas", icon: Users },
  { label: "Alunos", href: "/students", icon: GraduationCap },
];

const studentNav: NavItem[] = [
  { label: "Home", href: "/home", icon: Home },
  { label: "Aulas", href: "/lessons", icon: BookOpen, color: "aulas" },
  { label: "Tarefas", href: "/tasks", icon: ClipboardList, color: "tarefas" },
  { label: "Blog", href: "/blog", icon: FileText, color: "fora" },
];

interface SidebarProps {
  role: "teacher" | "student";
  userName: string;
}

export function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname();
  const items = role === "teacher" ? teacherNav : studentNav;

  return (
    <aside className="hidden md:flex flex-col w-60 bg-bg-dark text-white min-h-screen">
      {/* Logo */}
      <div className="px-6 py-6">
        <h1
          className="text-xl font-bold"
          style={{ fontFamily: "'Bricolage Grotesque Variable', serif" }}
        >
          Fluent
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {items.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-sm)] text-sm transition-colors relative ${
                isActive
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              {isActive && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                  style={{
                    backgroundColor: item.color
                      ? `var(--color-${item.color})`
                      : "#ffffff",
                  }}
                />
              )}
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User & Sign Out */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="px-3 py-2 text-sm text-white/60 truncate">{userName}</div>
        <button
          onClick={() => signOut({ fetchOptions: { onSuccess: () => window.location.href = "/sign-in" } })}
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-white/40 hover:text-white/80 transition-colors w-full"
        >
          <LogOut size={18} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Create the mobile bottom navigation**

Create `src/components/shared/mobile-nav.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, BookOpen, ClipboardList, FileText, User,
  LayoutDashboard, Users, GraduationCap,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const teacherMobileNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Aulas", href: "/lessons", icon: BookOpen },
  { label: "Tarefas", href: "/tasks", icon: ClipboardList },
  { label: "Turmas", href: "/turmas", icon: Users },
  { label: "Alunos", href: "/students", icon: GraduationCap },
];

const studentMobileNav: NavItem[] = [
  { label: "Home", href: "/home", icon: Home },
  { label: "Aulas", href: "/lessons", icon: BookOpen },
  { label: "Tarefas", href: "/tasks", icon: ClipboardList },
  { label: "Blog", href: "/blog", icon: FileText },
  { label: "Perfil", href: "/profile", icon: User },
];

interface MobileNavProps {
  role: "teacher" | "student";
}

export function MobileNav({ role }: MobileNavProps) {
  const pathname = usePathname();
  const items = role === "teacher" ? teacherMobileNav : studentMobileNav;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-border flex items-center justify-around z-50">
      {items.map((item) => {
        const isActive = pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 text-[10px] transition-colors ${
              isActive ? "text-aulas" : "text-text-muted"
            }`}
          >
            <Icon size={20} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 3: Create teacher layout**

Create `src/app/(teacher)/layout.tsx`:

```tsx
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createAuth } from "@/lib/auth/server";
import { Sidebar } from "@/components/shared/sidebar";
import { MobileNav } from "@/components/shared/mobile-nav";

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await createAuth();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/sign-in");
  }

  if (session.user.role !== "teacher") {
    redirect("/home");
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar role="teacher" userName={session.user.name} />
      <main className="flex-1 bg-bg-light pb-16 md:pb-0">
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-6 md:py-8">
          {children}
        </div>
      </main>
      <MobileNav role="teacher" />
    </div>
  );
}
```

- [ ] **Step 4: Create student layout**

Create `src/app/(student)/layout.tsx`:

```tsx
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createAuth } from "@/lib/auth/server";
import { Sidebar } from "@/components/shared/sidebar";
import { MobileNav } from "@/components/shared/mobile-nav";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await createAuth();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/sign-in");
  }

  if (session.user.role !== "student") {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar role="student" userName={session.user.name} />
      <main className="flex-1 bg-bg-light pb-16 md:pb-0">
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-6 md:py-8">
          {children}
        </div>
      </main>
      <MobileNav role="student" />
    </div>
  );
}
```

- [ ] **Step 5: Create placeholder dashboard page (teacher)**

Create `src/app/(teacher)/dashboard/page.tsx`:

```tsx
export default function DashboardPage() {
  return (
    <div className="animate-fade-in">
      <h1
        className="text-2xl font-bold text-text-primary"
        style={{ fontFamily: "'Bricolage Grotesque Variable', serif" }}
      >
        Dashboard
      </h1>
      <p className="text-text-secondary mt-2">
        Bem-vindo ao painel do professor.
      </p>
    </div>
  );
}
```

- [ ] **Step 6: Create placeholder home page (student)**

Create `src/app/(student)/home/page.tsx`:

```tsx
export default function HomePage() {
  return (
    <div className="animate-fade-in">
      <h1
        className="text-2xl font-bold text-text-primary"
        style={{ fontFamily: "'Bricolage Grotesque Variable', serif" }}
      >
        Home
      </h1>
      <p className="text-text-secondary mt-2">
        Bem-vindo ao Fluent!
      </p>
    </div>
  );
}
```

- [ ] **Step 7: Update middleware for role-based routing**

Update `src/middleware.ts` — add root redirect logic:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const publicPaths = ["/sign-in", "/sign-up", "/invite", "/api/auth"];

function isPublicPath(pathname: string) {
  return publicPaths.some((path) => pathname.startsWith(path));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = getSessionCookie(request);

  // Allow public paths
  if (isPublicPath(pathname)) {
    if (sessionCookie && (pathname === "/sign-in" || pathname === "/sign-up")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Allow static assets and Next.js internals
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return NextResponse.next();
  }

  // Require authentication for all other routes
  if (!sessionCookie) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Root redirect — authenticated users go to dashboard
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

- [ ] **Step 8: Verify the full flow**

1. Run `npm run dev`
2. Go to http://localhost:3000 → should redirect to `/sign-in`
3. Sign up as teacher → should redirect to `/dashboard` with sidebar
4. Verify sidebar shows: Dashboard, Aulas, Tarefas, Posts, Turmas, Alunos
5. Verify mobile nav appears when resizing to < 768px

- [ ] **Step 9: Commit**

```bash
git add src/components/shared/ src/app/\(teacher\)/ src/app/\(student\)/ src/middleware.ts
git commit -m "feat: add teacher and student shell layouts with sidebar and mobile nav"
```

---

### Task 10: R2 Presigned URL Endpoint

**Files:**
- Create: `src/lib/services/storage/r2.ts`
- Create: `src/app/api/upload/presign/route.ts`

- [ ] **Step 1: Create R2 presigned URL helper**

Create `src/lib/services/storage/r2.ts`:

```typescript
import { AwsClient } from "aws4fetch";

interface PresignOptions {
  fileName: string;
  contentType: string;
  folder: string;
  expiresIn?: number;
}

export async function generatePresignedUrl({
  fileName,
  contentType,
  folder,
  expiresIn = 3600,
}: PresignOptions) {
  const accountId = process.env.R2_ACCOUNT_ID!;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID!;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY!;
  const bucketName = "fluent-storage";

  const client = new AwsClient({
    service: "s3",
    region: "auto",
    accessKeyId,
    secretAccessKey,
  });

  const key = `${folder}/${Date.now()}-${fileName}`;
  const r2Url = `https://${accountId}.r2.cloudflarestorage.com/${bucketName}/${key}`;

  const signed = await client.sign(
    new Request(`${r2Url}?X-Amz-Expires=${expiresIn}`, {
      method: "PUT",
      headers: { "Content-Type": contentType },
    }),
    { aws: { signQuery: true } }
  );

  return {
    uploadUrl: signed.url.toString(),
    key,
    publicUrl: `https://pub-${accountId}.r2.dev/${key}`,
  };
}
```

- [ ] **Step 2: Create the presign API route**

Create `src/app/api/upload/presign/route.ts`:

```typescript
import { createAuth } from "@/lib/auth/server";
import { generatePresignedUrl } from "@/lib/services/storage/r2";
import { headers } from "next/headers";

export async function POST(req: Request) {
  const auth = await createAuth();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { fileName, contentType, folder } = await req.json();

  if (!fileName || !contentType || !folder) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const result = await generatePresignedUrl({ fileName, contentType, folder });

  return Response.json(result);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/services/storage/ src/app/api/upload/
git commit -m "feat: add R2 presigned URL generation for file uploads"
```

---

### Task 11: Resend Email Service

**Files:**
- Create: `src/lib/services/email/resend.ts`

- [ ] **Step 1: Create Resend email service**

Create `src/lib/services/email/resend.ts`:

```typescript
import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  const resend = getResend();

  const { data, error } = await resend.emails.send({
    from: "Fluent <noreply@fluent.app>",
    to: [to],
    subject,
    html,
  });

  if (error) {
    console.error("Failed to send email:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return data;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/services/email/
git commit -m "feat: add Resend email service"
```

---

### Task 12: Zod Validation Schemas

**Files:**
- Create: `src/lib/validations/auth.ts`

- [ ] **Step 1: Create auth validation schemas**

Install Zod:

```bash
npm install zod
```

Create `src/lib/validations/auth.ts`:

```typescript
import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export const signUpSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
});

export const acceptInviteSchema = z.object({
  token: z.string().min(1),
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
});

export const inviteStudentSchema = z.object({
  email: z.string().email("Email inválido"),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;
export type InviteStudentInput = z.infer<typeof inviteStudentSchema>;
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/validations/ package.json package-lock.json
git commit -m "feat: add Zod validation schemas for auth flows"
```

---

### Task 13: First Deploy to Cloudflare

- [ ] **Step 1: Build and preview locally**

```bash
npm run preview
```

Expected: application builds successfully and runs in Wrangler local preview.

- [ ] **Step 2: Deploy to Cloudflare Workers**

```bash
npm run deploy
```

Expected: deploys successfully, outputs a URL (e.g., `https://fluent.workers.dev`).

- [ ] **Step 3: Apply migrations to production D1**

```bash
npx wrangler d1 migrations apply fluent-db --remote
```

- [ ] **Step 4: Set production secrets**

```bash
npx wrangler secret put BETTER_AUTH_SECRET
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put GROQ_API_KEY
npx wrangler secret put GEMINI_API_KEY
npx wrangler secret put R2_ACCOUNT_ID
npx wrangler secret put R2_ACCESS_KEY_ID
npx wrangler secret put R2_SECRET_ACCESS_KEY
```

- [ ] **Step 5: Verify production**

Open the deployed URL in browser:
- Should redirect to `/sign-in`
- Sign up should work
- Dashboard should render with sidebar

- [ ] **Step 6: Commit any deployment config changes**

```bash
git add .
git commit -m "chore: first production deploy configuration"
```

---

## Summary

| Task | What it delivers |
|------|-----------------|
| 1 | Next.js project with Cloudflare Workers, D1, R2 bindings |
| 2 | Tailwind v4 with full design system tokens and fonts |
| 3 | Drizzle schema with all 16 tables + migrations |
| 4 | better-auth configured with email/password + role field |
| 5 | Auth middleware with session check and role routing |
| 6 | Auth layout (split screen with brand panel) |
| 7 | Sign-in and sign-up pages |
| 8 | Student invitation flow (email + accept page) |
| 9 | Teacher and student shell layouts (sidebar + mobile nav) |
| 10 | R2 presigned URL endpoint for file uploads |
| 11 | Resend email service |
| 12 | Zod validation schemas |
| 13 | First deploy to Cloudflare Workers |

**Exit criteria**: Teacher can sign up → see dashboard with sidebar. Teacher can invite student via email. Student accepts invite → sees home with sidebar. App deployed to Cloudflare.
