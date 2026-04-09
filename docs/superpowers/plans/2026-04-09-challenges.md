# Challenges Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Challenges as the 4th content channel — teacher creates challenges with rich content and deadline, student responds with text + file attachments.

**Architecture:** Follows existing content patterns exactly (lessons/posts CRUD). Three new DB tables (challenges, challenge_responses, turma_challenges). Teacher side: list/new/edit/responses pages. Student side: list + detail with response form. File attachments via existing R2 presigned URL flow.

**Tech Stack:** Next.js 16 App Router, Drizzle ORM on D1, Server Actions, Zod validation, BlockEditor/BlockContent, FileUpload component, Tailwind with DS tokens.

---

## File Structure

### New files to create:
- `src/lib/validations/challenges.ts` — Zod schemas
- `src/lib/actions/challenges.ts` — Server Actions (CRUD + student response)
- `src/lib/queries/challenges.ts` — Teacher queries
- `src/lib/queries/student-challenges.ts` — Student queries
- `src/components/teacher/challenge-form.tsx` — Create/edit form
- `src/components/teacher/challenge-list.tsx` — List with actions
- `src/components/student/challenge-card.tsx` — Student list card
- `src/components/student/challenge-response-form.tsx` — Student response form
- `src/app/teacher/challenges/page.tsx` — Teacher list page
- `src/app/teacher/challenges/new/page.tsx` — Teacher create page
- `src/app/teacher/challenges/[id]/edit/page.tsx` — Teacher edit page
- `src/app/teacher/challenges/[id]/responses/page.tsx` — Teacher view responses
- `src/app/(student)/challenges/page.tsx` — Student list page
- `src/app/(student)/challenges/[id]/page.tsx` — Student detail + response page

### Existing files to modify:
- `src/lib/db/schema.ts` — Add 3 new tables
- `src/components/teacher/new-content-modal.tsx` — Enable Challenge option
- `src/components/shared/sidebar.tsx` — Add Challenges nav items
- `src/components/shared/mobile-nav.tsx` — Add Challenges nav items
- `src/app/(student)/home/page.tsx` — Add Challenges channel card
- `src/lib/queries/student-home.ts` — Add challenge stats
- `src/lib/queries/turmas.ts` — Add `getChallengeTurmaIds` helper
- `scripts/seed.ts` — Add challenge seed data

---

### Task 1: Database Schema — Add 3 new tables

**Files:**
- Modify: `src/lib/db/schema.ts:436-458` (append after `turmaPosts`)

- [ ] **Step 1: Add `challenges`, `challengeResponses`, and `turmaChallenges` tables to schema.ts**

Add after the `turmaPosts` table definition (after line 457):

```typescript
export const challenges = sqliteTable(
  "challenges",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    teacherId: text("teacher_id")
      .notNull()
      .references(() => teachers.id),
    title: text("title").notNull(),
    description: text("description"), // BlockNote JSON
    coverImageUrl: text("cover_image_url"),
    dueDate: integer("due_date", { mode: "timestamp" }),
    status: text("status", { enum: ["draft", "published"] })
      .notNull()
      .default("draft"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("challenges_teacher_id_status_idx").on(table.teacherId, table.status),
  ],
);

export const challengeResponses = sqliteTable(
  "challenge_responses",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    challengeId: text("challenge_id")
      .notNull()
      .references(() => challenges.id, { onDelete: "cascade" }),
    studentId: text("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    content: text("content"),
    attachments: text("attachments"), // JSON: [{type, url, name}]
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    uniqueIndex("challenge_responses_challenge_student_idx").on(
      table.challengeId,
      table.studentId,
    ),
    index("challenge_responses_challenge_id_idx").on(table.challengeId),
    index("challenge_responses_student_id_idx").on(table.studentId),
  ],
);

export const turmaChallenges = sqliteTable(
  "turma_challenges",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    turmaId: text("turma_id")
      .notNull()
      .references(() => turmas.id, { onDelete: "cascade" }),
    challengeId: text("challenge_id")
      .notNull()
      .references(() => challenges.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    uniqueIndex("turma_challenges_turma_challenge_idx").on(
      table.turmaId,
      table.challengeId,
    ),
  ],
);
```

- [ ] **Step 2: Generate Drizzle migration**

Run: `npm run db:generate`
Expected: New migration file created in `drizzle/` with CREATE TABLE statements for challenges, challenge_responses, turma_challenges.

- [ ] **Step 3: Apply migration to local D1**

Run: `npm run db:migrate:local`
Expected: Migration applied successfully.

- [ ] **Step 4: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/db/schema.ts drizzle/
git commit -m "feat(db): add challenges, challenge_responses, turma_challenges tables"
```

---

### Task 2: Validation Schemas

**Files:**
- Create: `src/lib/validations/challenges.ts`

- [ ] **Step 1: Create Zod validation schemas**

Create `src/lib/validations/challenges.ts`:

```typescript
import { z } from "zod";

export const createChallengeSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  coverImageUrl: z.string().optional(),
  dueDate: z.coerce.date().optional(),
});

export const updateChallengeSchema = createChallengeSchema.partial();

export type CreateChallengeInput = z.infer<typeof createChallengeSchema>;
export type UpdateChallengeInput = z.infer<typeof updateChallengeSchema>;
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/validations/challenges.ts
git commit -m "feat(validation): add challenge Zod schemas"
```

---

### Task 3: Server Actions — Teacher CRUD

**Files:**
- Create: `src/lib/actions/challenges.ts`

- [ ] **Step 1: Create challenge server actions**

Create `src/lib/actions/challenges.ts`:

```typescript
"use server";

import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTeacher } from "@/lib/auth/get-teacher";
import { getStudent } from "@/lib/auth/get-student";
import { getDb } from "@/lib/db";
import { challenges, challengeResponses, turmaChallenges } from "@/lib/db/schema";
import { createChallengeSchema, updateChallengeSchema } from "@/lib/validations/challenges";

function extractSingleUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed[0].url ?? null;
    }
    return null;
  } catch {
    return value || null;
  }
}

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

export async function createChallenge(formData: FormData) {
  const { teacher } = await getTeacher();

  const coverImageUrl = extractSingleUrl(
    formData.get("coverImageFile") as string | null
  );

  const raw = {
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    coverImageUrl: coverImageUrl ?? undefined,
    dueDate: formData.get("dueDate") || undefined,
  };

  const parsed = createChallengeSchema.parse(raw);

  const db = getDb();
  const [inserted] = await db.insert(challenges).values({
    teacherId: teacher.id,
    title: parsed.title,
    description: parsed.description || null,
    coverImageUrl: parsed.coverImageUrl || null,
    dueDate: parsed.dueDate || null,
    status: "draft",
  }).returning({ id: challenges.id });

  const turmaIds = parseTurmaIds(formData);
  if (turmaIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.batch(turmaIds.map((turmaId) =>
      db.insert(turmaChallenges).values({ turmaId, challengeId: inserted.id }),
    ) as any);
  }

  revalidatePath("/teacher/challenges");
  redirect("/teacher/challenges");
}

export async function updateChallenge(id: string, formData: FormData) {
  const { teacher } = await getTeacher();

  const coverImageUrl = extractSingleUrl(
    formData.get("coverImageFile") as string | null
  );

  const raw = {
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    coverImageUrl: coverImageUrl ?? undefined,
    dueDate: formData.get("dueDate") || undefined,
  };

  const parsed = updateChallengeSchema.parse(raw);

  const db = getDb();
  await db
    .update(challenges)
    .set({
      ...parsed,
      coverImageUrl: parsed.coverImageUrl || null,
      dueDate: parsed.dueDate || null,
      updatedAt: new Date(),
    })
    .where(and(eq(challenges.id, id), eq(challenges.teacherId, teacher.id)));

  // Sync turma links
  const turmaIds = parseTurmaIds(formData);
  await db.delete(turmaChallenges).where(eq(turmaChallenges.challengeId, id));
  if (turmaIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.batch(turmaIds.map((turmaId) =>
      db.insert(turmaChallenges).values({ turmaId, challengeId: id }),
    ) as any);
  }

  revalidatePath("/teacher/challenges");
  redirect("/teacher/challenges");
}

export async function deleteChallenge(formData: FormData) {
  const { teacher } = await getTeacher();
  const id = formData.get("id") as string;

  if (!id) throw new Error("ID do desafio é obrigatório");

  const db = getDb();
  await db
    .delete(challenges)
    .where(and(eq(challenges.id, id), eq(challenges.teacherId, teacher.id)));

  revalidatePath("/teacher/challenges");
}

export async function toggleChallengeStatus(formData: FormData) {
  const { teacher } = await getTeacher();
  const id = formData.get("id") as string;

  if (!id) throw new Error("ID do desafio é obrigatório");

  const db = getDb();
  await db
    .update(challenges)
    .set({
      status: sql`CASE WHEN ${challenges.status} = 'draft' THEN 'published' ELSE 'draft' END`,
      updatedAt: new Date(),
    })
    .where(and(eq(challenges.id, id), eq(challenges.teacherId, teacher.id)));

  revalidatePath("/teacher/challenges");
}

export async function submitChallengeResponse(
  challengeId: string,
  content: string,
  attachments: string,
) {
  const { student } = await getStudent();
  const db = getDb();

  // Verify challenge exists, is published, belongs to student's teacher
  const challenge = await db.query.challenges.findFirst({
    where: (c, { eq: e, and: a }) =>
      a(
        e(c.id, challengeId),
        e(c.teacherId, student.teacherId),
        e(c.status, "published"),
      ),
  });

  if (!challenge) {
    throw new Error("Desafio não encontrado");
  }

  // Check if already responded
  const existing = await db.query.challengeResponses.findFirst({
    where: (r, { eq: e, and: a }) =>
      a(e(r.studentId, student.id), e(r.challengeId, challengeId)),
  });

  if (existing) {
    throw new Error("Você já respondeu este desafio");
  }

  await db.insert(challengeResponses).values({
    challengeId,
    studentId: student.id,
    content: content || null,
    attachments: attachments || null,
  });

  revalidatePath("/challenges");
  revalidatePath(`/challenges/${challengeId}`);
}
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/actions/challenges.ts
git commit -m "feat(actions): add challenge CRUD and student response actions"
```

---

### Task 4: Queries — Teacher + Student

**Files:**
- Create: `src/lib/queries/challenges.ts`
- Create: `src/lib/queries/student-challenges.ts`
- Modify: `src/lib/queries/turmas.ts:205` (add `getChallengeTurmaIds`)

- [ ] **Step 1: Create teacher challenge queries**

Create `src/lib/queries/challenges.ts`:

```typescript
import { getDb } from "@/lib/db";
import {
  challenges,
  challengeResponses,
  turmaChallenges,
  turmas,
  students,
  user,
} from "@/lib/db/schema";
import { eq, and, desc, inArray, count } from "drizzle-orm";

export async function getChallenges(teacherId: string) {
  const db = getDb();

  const challengeRows = await db
    .select()
    .from(challenges)
    .where(eq(challenges.teacherId, teacherId))
    .orderBy(desc(challenges.createdAt));

  if (challengeRows.length === 0) return [];

  const challengeIds = challengeRows.map((c) => c.id);

  // Get turma links
  const turmaLinks = await db
    .select({
      challengeId: turmaChallenges.challengeId,
      turmaId: turmas.id,
      turmaName: turmas.name,
      turmaColor: turmas.color,
    })
    .from(turmaChallenges)
    .innerJoin(turmas, eq(turmaChallenges.turmaId, turmas.id))
    .where(inArray(turmaChallenges.challengeId, challengeIds));

  const turmaMap = new Map<string, { id: string; name: string; color: string | null }[]>();
  for (const link of turmaLinks) {
    const arr = turmaMap.get(link.challengeId) ?? [];
    arr.push({ id: link.turmaId, name: link.turmaName, color: link.turmaColor });
    turmaMap.set(link.challengeId, arr);
  }

  // Get response counts
  const responseCounts = await db
    .select({
      challengeId: challengeResponses.challengeId,
      count: count(),
    })
    .from(challengeResponses)
    .where(inArray(challengeResponses.challengeId, challengeIds))
    .groupBy(challengeResponses.challengeId);

  const responseCountMap = new Map(responseCounts.map((r) => [r.challengeId, r.count]));

  return challengeRows.map((challenge) => ({
    ...challenge,
    turmas: turmaMap.get(challenge.id) ?? [],
    responseCount: responseCountMap.get(challenge.id) ?? 0,
  }));
}

export async function getChallenge(id: string, teacherId: string) {
  const db = getDb();
  return db.query.challenges.findFirst({
    where: (c, { eq: e, and: a }) =>
      a(e(c.id, id), e(c.teacherId, teacherId)),
  });
}

export async function getChallengeResponses(challengeId: string, teacherId: string) {
  const db = getDb();

  // Verify challenge belongs to teacher
  const challenge = await db.query.challenges.findFirst({
    where: (c, { eq: e, and: a }) =>
      a(e(c.id, challengeId), e(c.teacherId, teacherId)),
  });

  if (!challenge) return [];

  const responses = await db
    .select()
    .from(challengeResponses)
    .where(eq(challengeResponses.challengeId, challengeId))
    .orderBy(desc(challengeResponses.createdAt));

  if (responses.length === 0) return [];

  // Get student names
  const studentIds = [...new Set(responses.map((r) => r.studentId))];
  const studentRows = await db
    .select({ id: students.id, userId: students.userId })
    .from(students)
    .where(inArray(students.id, studentIds));

  const userIds = studentRows.map((s) => s.userId);
  const userRows = userIds.length > 0
    ? await db
        .select({ id: user.id, name: user.name })
        .from(user)
        .where(inArray(user.id, userIds))
    : [];

  const userNameMap = new Map(userRows.map((u) => [u.id, u.name]));
  const studentNameMap = new Map<string, string>();
  for (const sr of studentRows) {
    studentNameMap.set(sr.id, userNameMap.get(sr.userId) || "Aluno");
  }

  return responses.map((r) => ({
    ...r,
    studentName: studentNameMap.get(r.studentId) || "Aluno",
  }));
}
```

- [ ] **Step 2: Create student challenge queries**

Create `src/lib/queries/student-challenges.ts`:

```typescript
import { getDb } from "@/lib/db";
import {
  challenges,
  challengeResponses,
  turmaChallenges,
  turmaStudents,
} from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";

export async function getStudentChallenges(teacherId: string, studentId: string) {
  const db = getDb();

  // Get turma IDs the student belongs to
  const studentTurmas = await db
    .select({ turmaId: turmaStudents.turmaId })
    .from(turmaStudents)
    .where(eq(turmaStudents.studentId, studentId));

  const turmaIds = studentTurmas.map((t) => t.turmaId);
  if (turmaIds.length === 0) return [];

  // Get challenge IDs linked to those turmas
  const linkedChallenges = await db
    .select({ challengeId: turmaChallenges.challengeId })
    .from(turmaChallenges)
    .where(inArray(turmaChallenges.turmaId, turmaIds));

  const challengeIds = [...new Set(linkedChallenges.map((c) => c.challengeId))];
  if (challengeIds.length === 0) return [];

  // Get published challenges
  const publishedChallenges = await db
    .select()
    .from(challenges)
    .where(
      and(
        eq(challenges.teacherId, teacherId),
        eq(challenges.status, "published"),
        inArray(challenges.id, challengeIds),
      ),
    );

  if (publishedChallenges.length === 0) return [];

  // Get student's responses
  const responses = await db
    .select({
      challengeId: challengeResponses.challengeId,
      id: challengeResponses.id,
    })
    .from(challengeResponses)
    .where(eq(challengeResponses.studentId, studentId));

  const responseMap = new Map(responses.map((r) => [r.challengeId, r.id]));

  return publishedChallenges.map((challenge) => ({
    ...challenge,
    responded: responseMap.has(challenge.id),
  }));
}

export async function getStudentChallenge(challengeId: string, teacherId: string) {
  const db = getDb();

  return db.query.challenges.findFirst({
    where: (c, { eq: e, and: a }) =>
      a(e(c.id, challengeId), e(c.teacherId, teacherId), e(c.status, "published")),
  });
}

export async function getChallengeResponse(studentId: string, challengeId: string) {
  const db = getDb();

  return db.query.challengeResponses.findFirst({
    where: (r, { eq: e, and: a }) =>
      a(e(r.studentId, studentId), e(r.challengeId, challengeId)),
  });
}
```

- [ ] **Step 3: Add `getChallengeTurmaIds` to turmas queries**

In `src/lib/queries/turmas.ts`, add after `getPostTurmaIds` function (after line 205):

```typescript
export async function getChallengeTurmaIds(challengeId: string) {
  const db = getDb();
  const rows = await db
    .select({ turmaId: turmaChallenges.turmaId })
    .from(turmaChallenges)
    .where(eq(turmaChallenges.challengeId, challengeId));
  return rows.map((r) => r.turmaId);
}
```

Also add `turmaChallenges` to the imports at the top of the file. Find the existing import from `@/lib/db/schema` and add `turmaChallenges` to it.

- [ ] **Step 4: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/queries/challenges.ts src/lib/queries/student-challenges.ts src/lib/queries/turmas.ts
git commit -m "feat(queries): add teacher and student challenge queries"
```

---

### Task 5: Teacher Components — Form + List

**Files:**
- Create: `src/components/teacher/challenge-form.tsx`
- Create: `src/components/teacher/challenge-list.tsx`

- [ ] **Step 1: Create challenge form component**

Create `src/components/teacher/challenge-form.tsx`:

```typescript
"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileUpload, type FileItem } from "@/components/ui/file-upload";
import { BlockEditor } from "@/components/ui/block-editor";
import { TurmaSelector } from "@/components/teacher/turma-selector";

interface ChallengeData {
  id: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  dueDate: Date | null;
}

interface ChallengeFormProps {
  challenge?: ChallengeData;
  action: (formData: FormData) => Promise<void>;
  turmas?: { id: string; name: string; color: string | null }[];
  selectedTurmaIds?: string[];
}

const MB = 1024 * 1024;

function coverUrlToFileItems(url: string | null | undefined): FileItem[] {
  if (!url) return [];
  return [{ url, name: url.split("/").pop() ?? "cover", size: 0 }];
}

function formatDateForInput(date: Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function ChallengeForm({
  challenge,
  action,
  turmas = [],
  selectedTurmaIds = [],
}: ChallengeFormProps) {
  const isEdit = !!challenge;
  const [description, setDescription] = useState(challenge?.description ?? "");

  const existingCover = useMemo(
    () => coverUrlToFileItems(challenge?.coverImageUrl),
    [challenge?.coverImageUrl],
  );

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={action} className="space-y-5">
          <input type="hidden" name="description" value={description} />

          <Input
            label="Título"
            name="title"
            placeholder="Ex: My Daily Routine"
            defaultValue={challenge?.title ?? ""}
            required
          />

          <Input
            label="Prazo"
            name="dueDate"
            type="date"
            defaultValue={formatDateForInput(challenge?.dueDate)}
          />

          <div className="space-y-1.5">
            <h3 className="text-sm font-semibold text-text-primary">
              Imagem de Capa
            </h3>
            <FileUpload
              name="coverImageFile"
              accept="image/jpeg,image/png,image/webp"
              maxSize={5 * MB}
              maxFiles={1}
              folder="challenges/covers"
              label="Imagem de Capa"
              description="JPG, PNG, WebP. Máximo 5MB"
              existingFiles={existingCover}
            />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-sm font-semibold text-text-primary">
              Descrição do Desafio
            </h3>
            <BlockEditor
              initialContent={challenge?.description || undefined}
              onChange={setDescription}
            />
          </div>

          {turmas.length > 0 && (
            <TurmaSelector turmas={turmas} selectedIds={selectedTurmaIds} />
          )}

          <div className="flex justify-end pt-4">
            <Button type="submit">
              {isEdit ? "Salvar Alterações" : "Criar Challenge"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Create challenge list component**

Create `src/components/teacher/challenge-list.tsx`:

```typescript
import Link from "next/link";
import { Trophy, Pencil, MessageSquare, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { deleteChallenge, toggleChallengeStatus } from "@/lib/actions/challenges";
import { DeleteButton } from "@/components/teacher/delete-button";
import { TurmaBadges } from "@/components/teacher/turma-badges";

interface Challenge {
  id: string;
  title: string;
  status: "draft" | "published";
  dueDate: Date | null;
  responseCount: number;
  createdAt: Date;
  turmas: { id: string; name: string; color: string | null }[];
}

interface ChallengeListProps {
  challenges: Challenge[];
}

const statusLabels: Record<"draft" | "published", string> = {
  draft: "Rascunho",
  published: "Publicado",
};

function formatDueDate(date: Date | null): string | null {
  if (!date) return null;
  return date.toLocaleDateString("pt-BR");
}

function isDueSoon(date: Date | null): boolean {
  if (!date) return false;
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000; // 3 days
}

function isOverdue(date: Date | null): boolean {
  if (!date) return false;
  return date.getTime() < Date.now();
}

export function ChallengeList({ challenges }: ChallengeListProps) {
  if (challenges.length === 0) {
    return (
      <EmptyState
        icon={Trophy}
        title="Nenhum desafio encontrado"
        description="Crie seu primeiro desafio para seus alunos."
        action={
          <Link href="/teacher/challenges/new">
            <Button>Novo Challenge</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {challenges.map((challenge) => (
        <Card key={challenge.id} className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-semibold text-text-primary truncate">
                  {challenge.title}
                </h3>
                <Badge variant={challenge.status}>
                  {statusLabels[challenge.status]}
                </Badge>
                {challenge.dueDate && (
                  <Badge
                    variant={
                      isOverdue(challenge.dueDate)
                        ? "fora"
                        : isDueSoon(challenge.dueDate)
                          ? "challenges"
                          : "default"
                    }
                  >
                    <Calendar size={10} className="mr-1" />
                    {formatDueDate(challenge.dueDate)}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-text-muted">
                <span className="flex items-center gap-1">
                  <MessageSquare size={12} />
                  {challenge.responseCount} {challenge.responseCount === 1 ? "resposta" : "respostas"}
                </span>
                <span>
                  {challenge.createdAt.toLocaleDateString("pt-BR")}
                </span>
                {challenge.turmas.length > 0 && (
                  <>
                    <span className="text-border">·</span>
                    <TurmaBadges turmas={challenge.turmas} />
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <form action={toggleChallengeStatus}>
                <input type="hidden" name="id" value={challenge.id} />
                <Button variant="ghost" size="sm" type="submit">
                  {challenge.status === "draft" ? "Publicar" : "Despublicar"}
                </Button>
              </form>

              {challenge.responseCount > 0 && (
                <Link href={`/teacher/challenges/${challenge.id}/responses`}>
                  <Button variant="secondary" size="sm">
                    <MessageSquare size={14} />
                    Respostas
                  </Button>
                </Link>
              )}

              <Link href={`/teacher/challenges/${challenge.id}/edit`}>
                <Button variant="secondary" size="sm">
                  <Pencil size={14} />
                  Editar
                </Button>
              </Link>

              <DeleteButton action={deleteChallenge} id={challenge.id} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/teacher/challenge-form.tsx src/components/teacher/challenge-list.tsx
git commit -m "feat(teacher): add challenge form and list components"
```

---

### Task 6: Teacher Pages — List, New, Edit, Responses

**Files:**
- Create: `src/app/teacher/challenges/page.tsx`
- Create: `src/app/teacher/challenges/new/page.tsx`
- Create: `src/app/teacher/challenges/[id]/edit/page.tsx`
- Create: `src/app/teacher/challenges/[id]/responses/page.tsx`

- [ ] **Step 1: Create teacher challenges list page**

Create `src/app/teacher/challenges/page.tsx`:

```typescript
import Link from "next/link";
import { Plus } from "lucide-react";
import { getTeacher } from "@/lib/auth/get-teacher";
import { getChallenges } from "@/lib/queries/challenges";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ChallengeList } from "@/components/teacher/challenge-list";

export default async function ChallengesPage() {
  const { teacher } = await getTeacher();
  const challenges = await getChallenges(teacher.id);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Challenges"
        description="Crie desafios para seus alunos."
        action={
          <Link href="/teacher/challenges/new">
            <Button>
              <Plus size={16} />
              Novo Challenge
            </Button>
          </Link>
        }
      />

      <ChallengeList challenges={challenges} />
    </div>
  );
}
```

- [ ] **Step 2: Create new challenge page**

Create `src/app/teacher/challenges/new/page.tsx`:

```typescript
import { getTeacher } from "@/lib/auth/get-teacher";
import { PageHeader } from "@/components/ui/page-header";
import { ChallengeForm } from "@/components/teacher/challenge-form";
import { createChallenge } from "@/lib/actions/challenges";
import { getTurmasForSelector } from "@/lib/queries/turmas";

export default async function NewChallengePage() {
  const { teacher } = await getTeacher();
  const turmas = await getTurmasForSelector(teacher.id);

  return (
    <div className="animate-fade-in max-w-2xl pb-8">
      <PageHeader title="Novo Challenge" description="Crie um novo desafio para seus alunos." />
      <ChallengeForm action={createChallenge} turmas={turmas} />
    </div>
  );
}
```

- [ ] **Step 3: Create edit challenge page**

Create `src/app/teacher/challenges/[id]/edit/page.tsx`:

```typescript
import { redirect } from "next/navigation";
import { getTeacher } from "@/lib/auth/get-teacher";
import { getChallenge } from "@/lib/queries/challenges";
import { updateChallenge } from "@/lib/actions/challenges";
import { PageHeader } from "@/components/ui/page-header";
import { ChallengeForm } from "@/components/teacher/challenge-form";
import { getTurmasForSelector, getChallengeTurmaIds } from "@/lib/queries/turmas";

interface EditChallengePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditChallengePage({ params }: EditChallengePageProps) {
  const { teacher } = await getTeacher();
  const { id } = await params;

  const challenge = await getChallenge(id, teacher.id);
  if (!challenge) redirect("/teacher/challenges");

  const [turmas, selectedTurmaIds] = await Promise.all([
    getTurmasForSelector(teacher.id),
    getChallengeTurmaIds(challenge.id),
  ]);

  const updateChallengeWithId = updateChallenge.bind(null, challenge.id);

  return (
    <div className="animate-fade-in max-w-2xl pb-8">
      <PageHeader
        title="Editar Challenge"
        description={`Editando: ${challenge.title}`}
      />
      <ChallengeForm
        challenge={challenge}
        action={updateChallengeWithId}
        turmas={turmas}
        selectedTurmaIds={selectedTurmaIds}
      />
    </div>
  );
}
```

- [ ] **Step 4: Create responses page**

Create `src/app/teacher/challenges/[id]/responses/page.tsx`:

```typescript
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ImageIcon, Film, Music, FileText } from "lucide-react";
import { getTeacher } from "@/lib/auth/get-teacher";
import { getChallenge, getChallengeResponses } from "@/lib/queries/challenges";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";

interface ResponsesPageProps {
  params: Promise<{ id: string }>;
}

interface Attachment {
  type: string;
  url: string;
  name: string;
}

function AttachmentIcon({ type }: { type: string }) {
  if (type === "image") return <ImageIcon size={14} />;
  if (type === "video") return <Film size={14} />;
  if (type === "audio") return <Music size={14} />;
  return <FileText size={14} />;
}

export default async function ResponsesPage({ params }: ResponsesPageProps) {
  const { teacher } = await getTeacher();
  const { id } = await params;

  const challenge = await getChallenge(id, teacher.id);
  if (!challenge) redirect("/teacher/challenges");

  const responses = await getChallengeResponses(id, teacher.id);

  return (
    <div className="animate-fade-in">
      <Link
        href="/teacher/challenges"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        Voltar para challenges
      </Link>

      <PageHeader
        title={`Respostas: ${challenge.title}`}
        description={`${responses.length} ${responses.length === 1 ? "resposta" : "respostas"} recebida${responses.length === 1 ? "" : "s"}`}
      />

      {responses.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nenhuma resposta ainda"
          description="Os alunos ainda não responderam este desafio."
        />
      ) : (
        <div className="space-y-4">
          {responses.map((response) => {
            const attachments: Attachment[] = response.attachments
              ? JSON.parse(response.attachments)
              : [];

            return (
              <Card key={response.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-text-primary">
                      {response.studentName}
                    </span>
                    <span className="text-xs text-text-muted">
                      {response.createdAt.toLocaleDateString("pt-BR", {
                        day: "numeric",
                        month: "long",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {response.content && (
                    <p className="text-sm text-text-secondary whitespace-pre-wrap mb-3">
                      {response.content}
                    </p>
                  )}

                  {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {attachments.map((att, i) => (
                        <Badge key={i} variant="challenges">
                          <AttachmentIcon type={att.type} />
                          <span className="ml-1">{att.name}</span>
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/teacher/challenges/
git commit -m "feat(teacher): add challenges pages (list, new, edit, responses)"
```

---

### Task 7: Student Components — Card + Response Form

**Files:**
- Create: `src/components/student/challenge-card.tsx`
- Create: `src/components/student/challenge-response-form.tsx`

- [ ] **Step 1: Create student challenge card**

Create `src/components/student/challenge-card.tsx`:

```typescript
import Link from "next/link";
import { Trophy, Calendar, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ChallengeCardProps {
  challenge: {
    id: string;
    title: string;
    dueDate: Date | null;
    responded: boolean;
  };
  index: number;
}

function formatDueDate(date: Date | null): string | null {
  if (!date) return null;
  return date.toLocaleDateString("pt-BR");
}

function isOverdue(date: Date | null): boolean {
  if (!date) return false;
  return date.getTime() < Date.now();
}

export function ChallengeCard({ challenge, index }: ChallengeCardProps) {
  const overdue = isOverdue(challenge.dueDate);

  return (
    <Link href={`/challenges/${challenge.id}`}>
      <Card
        className="hover:shadow-md transition-shadow cursor-pointer"
        style={{ animationDelay: `${index * 60}ms` }}
      >
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-[var(--radius-sm)] bg-challenges/10 flex items-center justify-center shrink-0">
              <Trophy size={20} className="text-challenges" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-text-primary truncate">
                {challenge.title}
              </h3>
              <div className="flex items-center gap-2 mt-1.5">
                {challenge.responded ? (
                  <Badge variant="tarefas">
                    <CheckCircle size={10} className="mr-1" />
                    Respondido
                  </Badge>
                ) : overdue ? (
                  <Badge variant="fora">Encerrado</Badge>
                ) : (
                  <Badge variant="challenges">Pendente</Badge>
                )}
                {challenge.dueDate && (
                  <span className="text-xs text-text-muted flex items-center gap-1">
                    <Calendar size={12} />
                    {formatDueDate(challenge.dueDate)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
```

- [ ] **Step 2: Create student challenge response form**

Create `src/components/student/challenge-response-form.tsx`:

```typescript
"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileUpload, type FileItem } from "@/components/ui/file-upload";
import { submitChallengeResponse } from "@/lib/actions/challenges";

interface ChallengeResponseFormProps {
  challengeId: string;
}

const MB = 1024 * 1024;
const GB = 1024 * MB;

export function ChallengeResponseForm({ challengeId }: ChallengeResponseFormProps) {
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<FileItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!content.trim() && attachments.length === 0) {
      setError("Escreva uma resposta ou anexe um arquivo.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const attachmentData = attachments.map((f) => ({
        type: getFileType(f.name),
        url: f.url,
        name: f.name,
      }));

      await submitChallengeResponse(
        challengeId,
        content,
        JSON.stringify(attachmentData),
      );
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="text-sm font-semibold text-text-primary mb-4">
          Sua Resposta
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escreva sua resposta aqui..."
            rows={4}
            className="w-full px-3 py-2.5 rounded-[var(--radius-sm)] bg-input-bg border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-challenges transition-colors resize-y"
          />

          <div className="space-y-1.5">
            <h4 className="text-xs font-medium text-text-primary">Anexos</h4>
            <FileUpload
              name="attachments"
              accept="image/*,video/*,audio/*"
              maxSize={1 * GB}
              maxFiles={5}
              folder="challenge-responses"
              label="Anexos"
              description="Imagem, vídeo ou áudio. Máximo 5 arquivos."
              onChange={setAttachments}
            />
          </div>

          {error && (
            <p className="text-error text-sm">{error}</p>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={submitting}>
              <Send size={16} />
              {submitting ? "Enviando..." : "Enviar Resposta"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function getFileType(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return "image";
  if (["mp4", "webm", "mov", "avi"].includes(ext)) return "video";
  if (["mp3", "wav", "ogg", "m4a", "aac"].includes(ext)) return "audio";
  return "file";
}
```

- [ ] **Step 3: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/student/challenge-card.tsx src/components/student/challenge-response-form.tsx
git commit -m "feat(student): add challenge card and response form components"
```

---

### Task 8: Student Pages — List + Detail

**Files:**
- Create: `src/app/(student)/challenges/page.tsx`
- Create: `src/app/(student)/challenges/[id]/page.tsx`

- [ ] **Step 1: Create student challenges list page**

Create `src/app/(student)/challenges/page.tsx`:

```typescript
import { Trophy } from "lucide-react";
import { getStudent } from "@/lib/auth/get-student";
import { getStudentChallenges } from "@/lib/queries/student-challenges";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ChallengeCard } from "@/components/student/challenge-card";

export default async function ChallengesPage() {
  const { student } = await getStudent();
  const challenges = await getStudentChallenges(student.teacherId, student.id);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Challenges"
        description="Desafios do seu professor"
      />

      {challenges.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="Nenhum desafio disponível"
          description="Seu professor ainda não publicou desafios. Volte em breve!"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {challenges.map((challenge, i) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              index={i}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create student challenge detail page**

Create `src/app/(student)/challenges/[id]/page.tsx`:

```typescript
import { redirect } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Calendar, CheckCircle } from "lucide-react";
import Link from "next/link";
import { getStudent } from "@/lib/auth/get-student";
import {
  getStudentChallenge,
  getChallengeResponse,
} from "@/lib/queries/student-challenges";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BlockContent } from "@/components/ui/block-content";
import { ChallengeResponseForm } from "@/components/student/challenge-response-form";

interface ChallengeDetailPageProps {
  params: Promise<{ id: string }>;
}

interface Attachment {
  type: string;
  url: string;
  name: string;
}

export default async function ChallengeDetailPage({
  params,
}: ChallengeDetailPageProps) {
  const { id } = await params;
  const { student } = await getStudent();

  const challenge = await getStudentChallenge(id, student.teacherId);
  if (!challenge) redirect("/challenges");

  const response = await getChallengeResponse(student.id, id);

  const isOverdue = challenge.dueDate && challenge.dueDate.getTime() < Date.now();

  return (
    <div className="animate-fade-in">
      <Link
        href="/challenges"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        Voltar para challenges
      </Link>

      <article className="max-w-2xl space-y-6">
        {challenge.coverImageUrl && (
          <div className="relative w-full max-h-80 aspect-video rounded-[var(--radius-md)] overflow-hidden">
            <Image
              src={challenge.coverImageUrl}
              alt={challenge.title}
              fill
              unoptimized
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 672px"
            />
          </div>
        )}

        <div>
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="challenges">Challenge</Badge>
            {challenge.dueDate && (
              <span className="text-xs text-text-muted flex items-center gap-1">
                <Calendar size={12} />
                Prazo: {challenge.dueDate.toLocaleDateString("pt-BR")}
              </span>
            )}
            {response && (
              <Badge variant="tarefas">
                <CheckCircle size={10} className="mr-1" />
                Respondido
              </Badge>
            )}
          </div>

          <h1 className="text-2xl font-bold text-text-primary font-display mb-4">
            {challenge.title}
          </h1>

          {challenge.description && <BlockContent content={challenge.description} />}
        </div>

        {/* Response section */}
        {response ? (
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-sm font-semibold text-text-primary mb-3">
                Sua Resposta
              </h3>
              {response.content && (
                <p className="text-sm text-text-secondary whitespace-pre-wrap mb-3">
                  {response.content}
                </p>
              )}
              {response.attachments && (
                <div className="flex flex-wrap gap-2">
                  {(JSON.parse(response.attachments) as Attachment[]).map((att, i) => (
                    <Badge key={i} variant="challenges">
                      {att.name}
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-xs text-text-muted mt-3">
                Enviado em {response.createdAt.toLocaleDateString("pt-BR", {
                  day: "numeric",
                  month: "long",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </CardContent>
          </Card>
        ) : isOverdue ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-text-muted">
                O prazo deste desafio já encerrou.
              </p>
            </CardContent>
          </Card>
        ) : (
          <ChallengeResponseForm challengeId={challenge.id} />
        )}
      </article>
    </div>
  );
}
```

- [ ] **Step 3: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/'(student)'/challenges/
git commit -m "feat(student): add challenges list and detail pages"
```

---

### Task 9: Navigation Integration

**Files:**
- Modify: `src/components/shared/sidebar.tsx`
- Modify: `src/components/shared/mobile-nav.tsx`
- Modify: `src/components/teacher/new-content-modal.tsx`
- Modify: `src/app/(student)/home/page.tsx`
- Modify: `src/lib/queries/student-home.ts`

- [ ] **Step 1: Add Challenges to sidebar**

In `src/components/shared/sidebar.tsx`:

Add `Trophy` to the lucide-react import:
```typescript
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  FileText,
  Users,
  GraduationCap,
  Home,
  LogOut,
  Trophy,
} from "lucide-react";
```

Add to `teacherNav` array (after Posts, before Turmas):
```typescript
{ label: "Challenges", href: "/teacher/challenges", icon: Trophy, color: "challenges" },
```

Add to `studentNav` array (after Blog, before Turmas):
```typescript
{ label: "Challenges", href: "/challenges", icon: Trophy, color: "challenges" },
```

- [ ] **Step 2: Add Challenges to mobile nav**

In `src/components/shared/mobile-nav.tsx`:

Add `Trophy` to the lucide-react import:
```typescript
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  Users,
  GraduationCap,
  Home,
  FileText,
  User,
  Trophy,
} from "lucide-react";
```

Add to `teacherMobileNav` array (after Tarefas, before Turmas):
```typescript
{ label: "Challenges", href: "/teacher/challenges", icon: Trophy },
```

Add to `studentMobileNav` array (after Blog, before Perfil):
```typescript
{ label: "Challenges", href: "/challenges", icon: Trophy },
```

- [ ] **Step 3: Enable Challenge in new content modal**

In `src/components/teacher/new-content-modal.tsx`, change the Challenge channel entry (lines 48-56):

Replace:
```typescript
  {
    label: "Challenge",
    description: "Desafie seus alunos",
    icon: Trophy,
    bgClass: "bg-challenges/10",
    hoverClass: "hover:bg-challenges/20",
    iconColorClass: "text-challenges",
    href: null,
    disabled: true,
  },
```

With:
```typescript
  {
    label: "Challenge",
    description: "Desafie seus alunos",
    icon: Trophy,
    bgClass: "bg-challenges/10",
    hoverClass: "hover:bg-challenges/20",
    iconColorClass: "text-challenges",
    href: "/teacher/challenges/new",
  },
```

- [ ] **Step 4: Add challenge stats to student home**

In `src/lib/queries/student-home.ts`, add imports for `challenges` and `challengeResponses`:

```typescript
import {
  lessons,
  tasks,
  submissions,
  lessonProgresses,
  challenges,
  challengeResponses,
} from "@/lib/db/schema";
```

Add two more count queries inside `getHomeStats`, after `completedTasks` (before the return):

```typescript
  const [totalChallenges] = await db
    .select({ count: count() })
    .from(challenges)
    .where(
      and(eq(challenges.teacherId, teacherId), eq(challenges.status, "published")),
    );

  const [respondedChallenges] = await db
    .select({ count: count() })
    .from(challengeResponses)
    .where(eq(challengeResponses.studentId, studentId));
```

Add to the return object:
```typescript
  return {
    totalLessons: totalLessons.count,
    watchedLessons: watchedLessons.count,
    totalTasks: totalTasks.count,
    completedTasks: completedTasks.count,
    totalChallenges: totalChallenges.count,
    respondedChallenges: respondedChallenges.count,
  };
```

- [ ] **Step 5: Add Challenges channel card to student home**

In `src/app/(student)/home/page.tsx`:

Add `Trophy` to the lucide-react import:
```typescript
import { BookOpen, ClipboardList, FileText, Trophy } from "lucide-react";
```

Change the grid from `grid-cols-2 lg:grid-cols-3` to `grid-cols-2 lg:grid-cols-4`, and add the Challenges card after the Blog card:

```typescript
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ChannelCard
          channel="aulas"
          title="Aulas"
          count={stats.totalLessons}
          subtitle={`${stats.watchedLessons} assistidas`}
          href="/lessons"
          icon={BookOpen}
        />
        <ChannelCard
          channel="tarefas"
          title="Tarefas"
          count={stats.totalTasks}
          subtitle={`${stats.completedTasks} completas`}
          href="/tasks"
          icon={ClipboardList}
        />
        <ChannelCard
          channel="fora"
          title="Blog"
          count="Novo"
          subtitle="Dicas e conteúdo"
          href="/blog"
          icon={FileText}
        />
        <ChannelCard
          channel="challenges"
          title="Challenges"
          count={stats.totalChallenges}
          subtitle={`${stats.respondedChallenges} respondidos`}
          href="/challenges"
          icon={Trophy}
        />
      </div>
```

- [ ] **Step 6: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/shared/sidebar.tsx src/components/shared/mobile-nav.tsx src/components/teacher/new-content-modal.tsx src/app/'(student)'/home/page.tsx src/lib/queries/student-home.ts
git commit -m "feat(nav): integrate challenges into sidebar, mobile nav, modal, and home"
```

---

### Task 10: Seed Data

**Files:**
- Modify: `scripts/seed.ts`

- [ ] **Step 1: Add challenge seed data**

In `scripts/seed.ts`, add challenge IDs after `postIds` (around line 44):

```typescript
const challengeIds = [uuid(), uuid()];
const challengeResponseId = uuid();
```

Add challenge seed section before the Turma section (before line 348). Insert after the posts `forEach`:

```typescript
// ============================================================
// Challenges
// ============================================================
console.log("Creating challenges...");

const challengeDesc1 = JSON.stringify({
  type: "doc",
  content: [
    { type: "paragraph", content: [{ type: "text", text: "Escreva sobre a sua rotina diária em inglês e anexe uma foto do seu dia!" }] },
    { type: "paragraph", content: [{ type: "text", text: "Use Present Simple e inclua pelo menos 5 verbos diferentes." }] },
  ],
});

const challengeDesc2 = JSON.stringify({
  type: "doc",
  content: [
    { type: "paragraph", content: [{ type: "text", text: "Grave um áudio de 30 segundos desejando Feliz Natal em inglês para um amigo." }] },
    { type: "paragraph", content: [{ type: "text", text: "Tente usar expressões como: Merry Christmas, Happy Holidays, Season's Greetings." }] },
  ],
});

const futureDue = ts + 7 * 86400; // 7 days from now

sql(`INSERT INTO challenges (id, teacher_id, title, description, cover_image_url, due_date, status, created_at, updated_at) VALUES ('${challengeIds[0]}', '${teacherId}', 'My Daily Routine', '${challengeDesc1.replace(/'/g, "''")}', NULL, ${futureDue}, 'published', ${ts - 2 * 86400}, ${ts})`);
sql(`INSERT INTO challenges (id, teacher_id, title, description, cover_image_url, due_date, status, created_at, updated_at) VALUES ('${challengeIds[1]}', '${teacherId}', 'Merry Christmas Audio', '${challengeDesc2.replace(/'/g, "''")}', NULL, NULL, 'draft', ${ts - 86400}, ${ts})`);

// Challenge response from student
sql(`INSERT INTO challenge_responses (id, challenge_id, student_id, content, attachments, created_at, updated_at) VALUES ('${challengeResponseId}', '${challengeIds[0]}', '${studentId}', 'Every day I wake up at 7 AM. I have breakfast and then I go to work. I usually eat lunch at noon. In the evening I watch TV and go to bed at 11 PM.', NULL, ${ts - 86400}, ${ts - 86400})`);
```

In the Turma links section, add after `turmaPosts` links (after line ~367):

```typescript
// Link challenges to turma
sql(`INSERT INTO turma_challenges (id, turma_id, challenge_id, created_at) VALUES ('${uuid()}', '${turmaId}', '${challengeIds[0]}', ${ts})`);
```

- [ ] **Step 2: Test seed works**

Run: `npm run db:reset`
Expected: Seed completes without errors, including new challenge data.

- [ ] **Step 3: Commit**

```bash
git add scripts/seed.ts
git commit -m "feat(seed): add challenge and response seed data"
```

---

### Task 11: Manual Testing + Type Check

- [ ] **Step 1: Run full type check**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 2: Start dev server and test manually**

Run: `npm run dev -- --port 3001`

Test as teacher (fran@fluent.app):
1. Verify "Challenges" appears in sidebar
2. Click "Challenges" — see list with seed data
3. Click "Novo Challenge" — verify form works
4. Create a challenge, publish it, link to turma
5. Click "Respostas" on the seed challenge — see student response

Test as student (marcelo@fluent.app):
1. Verify "Challenges" appears in sidebar and home channel cards
2. Click "Challenges" — see published challenge
3. Click challenge — see content and existing response
4. Verify overdue/responded states display correctly

- [ ] **Step 3: Final commit if any fixes were needed**

Only if type/runtime errors required fixes.
