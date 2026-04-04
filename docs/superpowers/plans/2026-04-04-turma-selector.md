# Turma Selector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow teachers to assign turmas when creating/editing lessons, tasks, and posts via a reusable checkbox component.

**Architecture:** New `TurmaSelector` client component with "select all" + individual checkboxes, serialized as JSON hidden input. Each server action (create/update for lessons, tasks, posts) parses `turmaIds` and batch-inserts into junction tables. New `turma_posts` junction table for posts. Queries feed the selector from pages (Server Components).

**Tech Stack:** React 19, Drizzle ORM, D1 (SQLite), Zod, Tailwind CSS v4

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/components/teacher/turma-selector.tsx` | Reusable checkbox UI for selecting turmas |
| Modify | `src/lib/db/schema.ts:438` | Add `turmaPosts` junction table after `turmaTasks` |
| Create | `drizzle/0003_*.sql` | Migration for `turma_posts` table (auto-generated) |
| Modify | `src/lib/queries/turmas.ts` | Add `getTurmasForSelector()` and `getLinkedTurmaIds()` |
| Modify | `src/lib/actions/lessons.ts` | Parse `turmaIds`, batch-insert into `turma_lessons` |
| Modify | `src/lib/actions/tasks.ts` | Parse `turmaIds`, batch-insert into `turma_tasks` |
| Modify | `src/lib/actions/posts.ts` | Parse `turmaIds`, batch-insert into `turma_posts` |
| Modify | `src/app/teacher/lessons/new/page.tsx` | Fetch turmas, pass to LessonForm |
| Modify | `src/app/teacher/lessons/[id]/edit/page.tsx` | Fetch turmas + linked IDs, pass to LessonForm |
| Modify | `src/components/teacher/lesson-form.tsx` | Accept turmas props, render TurmaSelector |
| Modify | `src/app/teacher/tasks/new/page.tsx` | Fetch turmas, pass to TaskForm |
| Modify | `src/app/teacher/tasks/[id]/edit/page.tsx` | Fetch turmas + linked IDs, pass to TaskForm |
| Modify | `src/components/teacher/task-form.tsx` | Accept turmas props, render TurmaSelector |
| Modify | `src/app/teacher/posts/new/page.tsx` | Fetch turmas, pass to PostForm |
| Modify | `src/app/teacher/posts/[id]/edit/page.tsx` | Fetch turmas + linked IDs, pass to PostForm |
| Modify | `src/components/teacher/post-form.tsx` | Accept turmas props, render TurmaSelector |
| Modify | `scripts/seed.ts` | Add turma_posts seed data, link posts to turma |

---

### Task 1: Add `turmaPosts` junction table to schema + generate migration

**Files:**
- Modify: `src/lib/db/schema.ts:438` (after `turmaTasks` closing)

- [ ] **Step 1: Add turmaPosts table to schema**

In `src/lib/db/schema.ts`, add after the `turmaTasks` table (after line 438):

```typescript
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
```

- [ ] **Step 2: Generate Drizzle migration**

Run: `npm run db:generate`
Expected: New migration file created in `drizzle/` (e.g., `0003_*.sql`) with `CREATE TABLE turma_posts`.

- [ ] **Step 3: Apply migration locally**

Run: `npm run db:migrate:local`
Expected: Migration applied successfully.

- [ ] **Step 4: Verify with type check**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/db/schema.ts drizzle/
git commit -m "feat(db): add turma_posts junction table"
```

---

### Task 2: Add turma selector queries

**Files:**
- Modify: `src/lib/queries/turmas.ts`

- [ ] **Step 1: Add getTurmasForSelector query**

Add to the end of `src/lib/queries/turmas.ts`:

```typescript
export async function getTurmasForSelector(teacherId: string) {
  const db = getDb();
  return db
    .select({ id: turmas.id, name: turmas.name, color: turmas.color })
    .from(turmas)
    .where(eq(turmas.teacherId, teacherId))
    .orderBy(desc(turmas.createdAt));
}
```

- [ ] **Step 2: Add getLinkedTurmaIds query for lessons**

Add below the previous function:

```typescript
export async function getLessonTurmaIds(lessonId: string) {
  const db = getDb();
  const rows = await db
    .select({ turmaId: turmaLessons.turmaId })
    .from(turmaLessons)
    .where(eq(turmaLessons.lessonId, lessonId));
  return rows.map((r) => r.turmaId);
}

export async function getTaskTurmaIds(taskId: string) {
  const db = getDb();
  const rows = await db
    .select({ turmaId: turmaTasks.turmaId })
    .from(turmaTasks)
    .where(eq(turmaTasks.taskId, taskId));
  return rows.map((r) => r.turmaId);
}

export async function getPostTurmaIds(postId: string) {
  const db = getDb();
  const rows = await db
    .select({ turmaId: turmaPosts.turmaId })
    .from(turmaPosts)
    .where(eq(turmaPosts.postId, postId));
  return rows.map((r) => r.turmaId);
}
```

- [ ] **Step 3: Add turmaPosts import at top of file**

Add `turmaPosts` to the import from `@/lib/db/schema`:

```typescript
import {
  turmas,
  turmaStudents,
  turmaLessons,
  turmaTasks,
  turmaPosts,
  students,
  user,
  lessons,
  tasks,
} from "@/lib/db/schema";
```

- [ ] **Step 4: Verify with type check**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/queries/turmas.ts
git commit -m "feat(queries): add turma selector and linked turma ID queries"
```

---

### Task 3: Create TurmaSelector component

**Files:**
- Create: `src/components/teacher/turma-selector.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/teacher/turma-selector.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";

interface TurmaOption {
  id: string;
  name: string;
  color: string | null;
}

interface TurmaSelectorProps {
  turmas: TurmaOption[];
  selectedIds?: string[];
  name?: string;
}

export function TurmaSelector({
  turmas,
  selectedIds = [],
  name = "turmaIds",
}: TurmaSelectorProps) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(selectedIds),
  );

  if (turmas.length === 0) return null;

  const allSelected = turmas.length > 0 && turmas.every((t) => selected.has(t.id));

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(turmas.map((t) => t.id)));
    }
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-3">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Users size={16} />
          Turmas
        </h3>

        <input type="hidden" name={name} value={JSON.stringify([...selected])} />

        <label className="flex items-center gap-2 cursor-pointer py-1.5 px-2 rounded-md hover:bg-bg-light transition-colors">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            className="rounded border-border text-aulas focus:ring-aulas"
          />
          <span className="text-sm font-medium text-text-primary">
            Todas as turmas
          </span>
        </label>

        <div className="border-t border-border pt-2 space-y-0.5">
          {turmas.map((turma) => (
            <label
              key={turma.id}
              className="flex items-center gap-2 cursor-pointer py-1.5 px-2 rounded-md hover:bg-bg-light transition-colors"
            >
              <input
                type="checkbox"
                checked={selected.has(turma.id)}
                onChange={() => toggle(turma.id)}
                className="rounded border-border text-aulas focus:ring-aulas"
              />
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: turma.color || "#6c5ce7" }}
              />
              <span className="text-sm text-text-secondary">{turma.name}</span>
            </label>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Verify with type check**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/teacher/turma-selector.tsx
git commit -m "feat(ui): create TurmaSelector checkbox component"
```

---

### Task 4: Integrate TurmaSelector into lesson form + action

**Files:**
- Modify: `src/components/teacher/lesson-form.tsx:26-29,274-279`
- Modify: `src/app/teacher/lessons/new/page.tsx`
- Modify: `src/app/teacher/lessons/[id]/edit/page.tsx`
- Modify: `src/lib/actions/lessons.ts:1-9,47-83,86-123`

- [ ] **Step 1: Update LessonForm to accept turma props and render selector**

In `src/components/teacher/lesson-form.tsx`, add import at top:

```typescript
import { TurmaSelector } from "@/components/teacher/turma-selector";
```

Update the `LessonFormProps` interface (line 26-29):

```typescript
interface LessonFormProps {
  lesson?: LessonData;
  action: (formData: FormData) => Promise<void>;
  turmas?: { id: string; name: string; color: string | null }[];
  selectedTurmaIds?: string[];
}
```

Update the component signature (line 71):

```typescript
export function LessonForm({ lesson, action, turmas = [], selectedTurmaIds = [] }: LessonFormProps) {
```

Add TurmaSelector before the submit button (before `{/* ── Submit ──`):

```tsx
      {/* ── Section 7: Turmas ────────────────────────────────────────── */}
      {turmas.length > 0 && (
        <TurmaSelector turmas={turmas} selectedIds={selectedTurmaIds} />
      )}
```

- [ ] **Step 2: Update lesson new page to fetch turmas**

Replace `src/app/teacher/lessons/new/page.tsx`:

```tsx
import { getTeacher } from "@/lib/auth/get-teacher";
import { PageHeader } from "@/components/ui/page-header";
import { LessonForm } from "@/components/teacher/lesson-form";
import { createLesson } from "@/lib/actions/lessons";
import { getTurmasForSelector } from "@/lib/queries/turmas";

export default async function NewLessonPage() {
  const { teacher } = await getTeacher();
  const turmas = await getTurmasForSelector(teacher.id);

  return (
    <div className="animate-fade-in max-w-2xl pb-8">
      <PageHeader title="Nova Aula" description="Preencha os dados da nova aula." />
      <LessonForm action={createLesson} turmas={turmas} />
    </div>
  );
}
```

- [ ] **Step 3: Update lesson edit page to fetch turmas + linked IDs**

Replace `src/app/teacher/lessons/[id]/edit/page.tsx`:

```tsx
import { redirect } from "next/navigation";
import { getTeacher } from "@/lib/auth/get-teacher";
import { getLesson } from "@/lib/queries/lessons";
import { updateLesson } from "@/lib/actions/lessons";
import { PageHeader } from "@/components/ui/page-header";
import { LessonForm } from "@/components/teacher/lesson-form";
import { getTurmasForSelector, getLessonTurmaIds } from "@/lib/queries/turmas";

interface EditLessonPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditLessonPage({ params }: EditLessonPageProps) {
  const { teacher } = await getTeacher();
  const { id } = await params;

  const lesson = await getLesson(id, teacher.id);
  if (!lesson) redirect("/teacher/lessons");

  const [turmas, selectedTurmaIds] = await Promise.all([
    getTurmasForSelector(teacher.id),
    getLessonTurmaIds(lesson.id),
  ]);

  const updateLessonWithId = updateLesson.bind(null, lesson.id);

  return (
    <div className="animate-fade-in max-w-2xl pb-8">
      <PageHeader
        title="Editar Aula"
        description={`Editando: ${lesson.title}`}
      />
      <LessonForm
        lesson={lesson}
        action={updateLessonWithId}
        turmas={turmas}
        selectedTurmaIds={selectedTurmaIds}
      />
    </div>
  );
}
```

- [ ] **Step 4: Update createLesson action to handle turmaIds**

In `src/lib/actions/lessons.ts`, add `turmaLessons` to the schema import:

```typescript
import { lessons, turmaLessons } from "@/lib/db/schema";
```

Add a helper function after `resolveVideoUrl` (after line 43):

```typescript
function parseTurmaIds(formData: FormData): string[] {
  const raw = formData.get("turmaIds") as string | null;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id: unknown) => typeof id === "string" && id.length > 0) : [];
  } catch {
    return [];
  }
}
```

Update `createLesson` — replace the `db.insert` through `redirect` (lines 68-83):

```typescript
  const db = getDb();
  const [inserted] = await db.insert(lessons).values({
    teacherId: teacher.id,
    title: parsed.title,
    description: parsed.description || null,
    category: parsed.category,
    videoUrl: parsed.videoUrl || null,
    coverImageUrl: parsed.coverImageUrl || null,
    audioUrls: parsed.audioUrls || null,
    documentUrls: parsed.documentUrls || null,
    durationMinutes: parsed.durationMinutes || null,
    status: "draft",
  }).returning({ id: lessons.id });

  const turmaIds = parseTurmaIds(formData);
  if (turmaIds.length > 0) {
    await db.batch(
      turmaIds.map((turmaId) =>
        db.insert(turmaLessons).values({ turmaId, lessonId: inserted.id }),
      ) as [typeof turmaIds[number] extends string ? ReturnType<typeof db.insert> : never, ...ReturnType<typeof db.insert>[]]
    );
  }

  revalidatePath("/teacher/lessons");
  redirect("/teacher/lessons");
```

- [ ] **Step 5: Update updateLesson action to handle turmaIds**

Update `updateLesson` — after the `db.update` call and before `revalidatePath` (between lines 119 and 121):

```typescript
  // Sync turma links: delete existing, re-insert selected
  const turmaIds = parseTurmaIds(formData);
  await db.delete(turmaLessons).where(eq(turmaLessons.lessonId, id));
  if (turmaIds.length > 0) {
    await db.batch(
      turmaIds.map((turmaId) =>
        db.insert(turmaLessons).values({ turmaId, lessonId: id }),
      ) as [typeof turmaIds[number] extends string ? ReturnType<typeof db.insert> : never, ...ReturnType<typeof db.insert>[]]
    );
  }
```

Add `eq` import if not already present (it is already imported on line 3).

- [ ] **Step 6: Verify with type check**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 7: Manual test**

Run: `npm run db:reset && npm run dev -- --port 3001`
Open: `http://localhost:3001/sign-in` → login as `fran@fluent.app` / `senha12345`
Go to: `/teacher/lessons/new` → verify TurmaSelector appears with "Turma Iniciante 2026"
Create a lesson → check turma detail page shows the new lesson linked.
Edit the lesson → verify turma checkboxes are pre-selected.

- [ ] **Step 8: Commit**

```bash
git add src/components/teacher/lesson-form.tsx src/app/teacher/lessons/ src/lib/actions/lessons.ts
git commit -m "feat(lessons): integrate turma selector in lesson create/edit"
```

---

### Task 5: Integrate TurmaSelector into task form + action

**Files:**
- Modify: `src/components/teacher/task-form.tsx:26-29,127-134`
- Modify: `src/app/teacher/tasks/new/page.tsx`
- Modify: `src/app/teacher/tasks/[id]/edit/page.tsx`
- Modify: `src/lib/actions/tasks.ts:1-9,11-43,46-81`

- [ ] **Step 1: Update TaskForm to accept turma props and render selector**

In `src/components/teacher/task-form.tsx`, add import at top:

```typescript
import { TurmaSelector } from "@/components/teacher/turma-selector";
```

Update the `TaskFormProps` interface:

```typescript
interface TaskFormProps {
  task?: TaskData;
  action: (formData: FormData) => Promise<void>;
  turmas?: { id: string; name: string; color: string | null }[];
  selectedTurmaIds?: string[];
}
```

Update the component signature:

```typescript
export function TaskForm({ task, action, turmas = [], selectedTurmaIds = [] }: TaskFormProps) {
```

Add TurmaSelector before the submit `<div>` (before `<div className="flex justify-end pt-4">`):

```tsx
          {turmas.length > 0 && (
            <TurmaSelector turmas={turmas} selectedIds={selectedTurmaIds} />
          )}
```

- [ ] **Step 2: Update task new page to fetch turmas**

Replace `src/app/teacher/tasks/new/page.tsx`:

```tsx
import { getTeacher } from "@/lib/auth/get-teacher";
import { PageHeader } from "@/components/ui/page-header";
import { TaskForm } from "@/components/teacher/task-form";
import { createTask } from "@/lib/actions/tasks";
import { getTurmasForSelector } from "@/lib/queries/turmas";

export default async function NewTaskPage() {
  const { teacher } = await getTeacher();
  const turmas = await getTurmasForSelector(teacher.id);

  return (
    <div className="animate-fade-in max-w-2xl pb-8">
      <PageHeader title="Nova Tarefa" description="Preencha os dados da nova tarefa." />
      <TaskForm action={createTask} turmas={turmas} />
    </div>
  );
}
```

- [ ] **Step 3: Update task edit page to fetch turmas + linked IDs**

Replace `src/app/teacher/tasks/[id]/edit/page.tsx`:

```tsx
import { redirect } from "next/navigation";
import { getTeacher } from "@/lib/auth/get-teacher";
import { getTask } from "@/lib/queries/tasks";
import { updateTask } from "@/lib/actions/tasks";
import { PageHeader } from "@/components/ui/page-header";
import { TaskForm } from "@/components/teacher/task-form";
import { getTurmasForSelector, getTaskTurmaIds } from "@/lib/queries/turmas";

interface EditTaskPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTaskPage({ params }: EditTaskPageProps) {
  const { teacher } = await getTeacher();
  const { id } = await params;

  const task = await getTask(id, teacher.id);
  if (!task) redirect("/teacher/tasks");

  const [turmas, selectedTurmaIds] = await Promise.all([
    getTurmasForSelector(teacher.id),
    getTaskTurmaIds(task.id),
  ]);

  const updateTaskWithId = updateTask.bind(null, task.id);

  return (
    <div className="animate-fade-in max-w-2xl pb-8">
      <PageHeader
        title="Editar Tarefa"
        description={`Editando: ${task.title}`}
      />
      <TaskForm
        task={task}
        action={updateTaskWithId}
        turmas={turmas}
        selectedTurmaIds={selectedTurmaIds}
      />
    </div>
  );
}
```

- [ ] **Step 4: Update createTask action to handle turmaIds**

In `src/lib/actions/tasks.ts`, update imports:

```typescript
import { eq, and, sql } from "drizzle-orm";
import { tasks, turmaTasks } from "@/lib/db/schema";
```

Add `parseTurmaIds` helper after imports (same as in lessons):

```typescript
function parseTurmaIds(formData: FormData): string[] {
  const raw = formData.get("turmaIds") as string | null;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id: unknown) => typeof id === "string" && id.length > 0) : [];
  } catch {
    return [];
  }
}
```

Update `createTask` — replace `db.insert(tasks)` through `redirect` (lines 29-43):

```typescript
  const db = getDb();
  const [inserted] = await db.insert(tasks).values({
    teacherId: teacher.id,
    title: parsed.title,
    description: parsed.description || null,
    taskType: parsed.taskType,
    level: parsed.level,
    lessonId: parsed.lessonId || null,
    questions: parsed.questions || null,
    status: "draft",
    aiGenerated: aiGenerated,
    aiPrompt: aiPrompt || null,
  }).returning({ id: tasks.id });

  const turmaIds = parseTurmaIds(formData);
  if (turmaIds.length > 0) {
    await db.batch(
      turmaIds.map((turmaId) =>
        db.insert(turmaTasks).values({ turmaId, taskId: inserted.id }),
      ) as [typeof turmaIds[number] extends string ? ReturnType<typeof db.insert> : never, ...ReturnType<typeof db.insert>[]]
    );
  }

  revalidatePath("/teacher/tasks");
  redirect("/teacher/tasks");
```

- [ ] **Step 5: Update updateTask action to handle turmaIds**

In `updateTask`, after the `db.update` call and before `revalidatePath`:

```typescript
  // Sync turma links
  const turmaIds = parseTurmaIds(formData);
  await db.delete(turmaTasks).where(eq(turmaTasks.taskId, id));
  if (turmaIds.length > 0) {
    await db.batch(
      turmaIds.map((turmaId) =>
        db.insert(turmaTasks).values({ turmaId, taskId: id }),
      ) as [typeof turmaIds[number] extends string ? ReturnType<typeof db.insert> : never, ...ReturnType<typeof db.insert>[]]
    );
  }
```

- [ ] **Step 6: Verify with type check**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/teacher/task-form.tsx src/app/teacher/tasks/ src/lib/actions/tasks.ts
git commit -m "feat(tasks): integrate turma selector in task create/edit"
```

---

### Task 6: Integrate TurmaSelector into post form + action

**Files:**
- Modify: `src/components/teacher/post-form.tsx:20-24,158-165`
- Modify: `src/app/teacher/posts/new/page.tsx`
- Modify: `src/app/teacher/posts/[id]/edit/page.tsx`
- Modify: `src/lib/actions/posts.ts:1-9,33-66,69-102`

- [ ] **Step 1: Update PostForm to accept turma props and render selector**

In `src/components/teacher/post-form.tsx`, add import at top:

```typescript
import { TurmaSelector } from "@/components/teacher/turma-selector";
```

Update the `PostFormProps` interface:

```typescript
interface PostFormProps {
  post?: PostData;
  action: (formData: FormData) => Promise<void>;
  turmas?: { id: string; name: string; color: string | null }[];
  selectedTurmaIds?: string[];
}
```

Update the component signature:

```typescript
export function PostForm({ post, action, turmas = [], selectedTurmaIds = [] }: PostFormProps) {
```

Add TurmaSelector before the submit `<div>` (before `<div className="flex justify-end pt-4">`):

```tsx
          {turmas.length > 0 && (
            <TurmaSelector turmas={turmas} selectedIds={selectedTurmaIds} />
          )}
```

- [ ] **Step 2: Update post new page to fetch turmas**

Replace `src/app/teacher/posts/new/page.tsx`:

```tsx
import { getTeacher } from "@/lib/auth/get-teacher";
import { PageHeader } from "@/components/ui/page-header";
import { PostForm } from "@/components/teacher/post-form";
import { createPost } from "@/lib/actions/posts";
import { getTurmasForSelector } from "@/lib/queries/turmas";

export default async function NewPostPage() {
  const { teacher } = await getTeacher();
  const turmas = await getTurmasForSelector(teacher.id);

  return (
    <div className="animate-fade-in max-w-2xl pb-8">
      <PageHeader title="Novo Post" description="Preencha os dados do novo post." />
      <PostForm action={createPost} turmas={turmas} />
    </div>
  );
}
```

- [ ] **Step 3: Update post edit page to fetch turmas + linked IDs**

Replace `src/app/teacher/posts/[id]/edit/page.tsx`:

```tsx
import { redirect } from "next/navigation";
import { getTeacher } from "@/lib/auth/get-teacher";
import { getPost } from "@/lib/queries/posts";
import { updatePost } from "@/lib/actions/posts";
import { PageHeader } from "@/components/ui/page-header";
import { PostForm } from "@/components/teacher/post-form";
import { getTurmasForSelector, getPostTurmaIds } from "@/lib/queries/turmas";

interface EditPostPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { teacher } = await getTeacher();
  const { id } = await params;

  const post = await getPost(id, teacher.id);
  if (!post) redirect("/teacher/posts");

  const [turmas, selectedTurmaIds] = await Promise.all([
    getTurmasForSelector(teacher.id),
    getPostTurmaIds(post.id),
  ]);

  const updatePostWithId = updatePost.bind(null, post.id);

  return (
    <div className="animate-fade-in max-w-2xl pb-8">
      <PageHeader
        title="Editar Post"
        description={`Editando: ${post.title}`}
      />
      <PostForm
        post={post}
        action={updatePostWithId}
        turmas={turmas}
        selectedTurmaIds={selectedTurmaIds}
      />
    </div>
  );
}
```

- [ ] **Step 4: Update createPost action to handle turmaIds**

In `src/lib/actions/posts.ts`, update imports:

```typescript
import { posts, turmaPosts } from "@/lib/db/schema";
```

Add `parseTurmaIds` helper after `extractSingleUrl`:

```typescript
function parseTurmaIds(formData: FormData): string[] {
  const raw = formData.get("turmaIds") as string | null;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id: unknown) => typeof id === "string" && id.length > 0) : [];
  } catch {
    return [];
  }
}
```

Update `createPost` — replace `db.insert(posts)` through `redirect` (lines 54-66):

```typescript
  const db = getDb();
  const [inserted] = await db.insert(posts).values({
    teacherId: teacher.id,
    title: parsed.title,
    slug: parsed.slug,
    content: parsed.content || null,
    coverImageUrl: parsed.coverImageUrl || null,
    category: parsed.category,
    featured: parsed.featured ?? false,
    status: "draft",
  }).returning({ id: posts.id });

  const turmaIds = parseTurmaIds(formData);
  if (turmaIds.length > 0) {
    await db.batch(
      turmaIds.map((turmaId) =>
        db.insert(turmaPosts).values({ turmaId, postId: inserted.id }),
      ) as [typeof turmaIds[number] extends string ? ReturnType<typeof db.insert> : never, ...ReturnType<typeof db.insert>[]]
    );
  }

  revalidatePath("/teacher/posts");
  redirect("/teacher/posts");
```

- [ ] **Step 5: Update updatePost action to handle turmaIds**

In `updatePost`, after the `db.update` call and before `revalidatePath`:

```typescript
  // Sync turma links
  const turmaIds = parseTurmaIds(formData);
  await db.delete(turmaPosts).where(eq(turmaPosts.postId, id));
  if (turmaIds.length > 0) {
    await db.batch(
      turmaIds.map((turmaId) =>
        db.insert(turmaPosts).values({ turmaId, postId: id }),
      ) as [typeof turmaIds[number] extends string ? ReturnType<typeof db.insert> : never, ...ReturnType<typeof db.insert>[]]
    );
  }
```

- [ ] **Step 6: Verify with type check**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/teacher/post-form.tsx src/app/teacher/posts/ src/lib/actions/posts.ts
git commit -m "feat(posts): integrate turma selector in post create/edit"
```

---

### Task 7: Update seed data + final verification

**Files:**
- Modify: `scripts/seed.ts`

- [ ] **Step 1: Add turma_posts seed data**

In `scripts/seed.ts`, after the `turmaTasks` linking section (around line 188), add:

```typescript
// Link posts to turma
postIds.forEach(pid => {
  sql(`INSERT INTO turma_posts (id, turma_id, post_id, created_at) VALUES ('${uuid()}', '${turmaId}', '${pid}', ${ts})`);
});
```

- [ ] **Step 2: Reset database and verify**

Run: `npm run db:reset`
Expected: Seed completes with no errors. Posts are now linked to the turma.

- [ ] **Step 3: Full type check**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Start dev server and smoke test all 3 forms**

Run: `npm run dev -- --port 3001`

Test each form:
1. `/teacher/lessons/new` — TurmaSelector visible, create with turma selected
2. Edit that lesson — turma pre-selected
3. `/teacher/tasks/new` — TurmaSelector visible, create with turma selected
4. Edit that task — turma pre-selected
5. `/teacher/posts/new` — TurmaSelector visible, create with turma selected
6. Edit that post — turma pre-selected
7. Check turma detail page — newly created content shows in linked lists

- [ ] **Step 5: Commit**

```bash
git add scripts/seed.ts
git commit -m "chore(seed): link posts to turma in seed data"
```
