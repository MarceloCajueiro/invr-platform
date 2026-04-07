# Invite-Turma Link — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Link invitations to turmas so students auto-join a turma on invite acceptance, show pending invites in turma detail, and allow teachers to add existing students to turmas.

**Architecture:** Add `turmaId` column to `invitations` table. Modify invite form to require turma selection. Modify `acceptInvitation` to insert into `turmaStudents`. Add pending invites display and add-student UI to turma detail page.

**Tech Stack:** Next.js 16, Drizzle ORM, Cloudflare D1 (SQLite), Tailwind CSS v4

---

### Task 1: Schema — Add `turmaId` to invitations

**Files:**
- Modify: `src/lib/db/schema.ts`

- [ ] **Step 1: Add turmaId column to invitations table**

In `src/lib/db/schema.ts`, add `turmaId` to the `invitations` table definition. Add it after the `teacherId` field:

```typescript
turmaId: text("turma_id").references(() => turmas.id),
```

Note: This must be nullable in the DB because old invitation rows exist without it. The application code will require it for new invitations.

- [ ] **Step 2: Generate the migration**

Run: `npm run db:generate`
Expected: Creates a new migration file in `drizzle/` like `0005_*.sql` containing `ALTER TABLE invitations ADD COLUMN turma_id TEXT REFERENCES turmas(id)`

- [ ] **Step 3: Apply migration locally**

Run: `npm run db:migrate:local`
Expected: Migration applies successfully

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/lib/db/schema.ts drizzle/
git commit -m "feat(schema): add turmaId to invitations table"
```

---

### Task 2: Server Action — Update `createInvitation` to accept turmaId

**Files:**
- Modify: `src/lib/actions/invitations.ts`

- [ ] **Step 1: Add turmaId parameter and validation**

In `src/lib/actions/invitations.ts`, change the `createInvitation` function signature and add turma validation:

```typescript
export async function createInvitation(email: string, turmaId: string) {
```

After the teacher lookup (after line 33 `if (!teacher)`), add turma validation:

```typescript
  // Validate turma belongs to this teacher
  const turma = await db.query.turmas.findFirst({
    where: and(eq(turmasTable.id, turmaId), eq(turmasTable.teacherId, teacher.id)),
  });

  if (!turma) {
    throw new Error("Turma não encontrada");
  }
```

This requires importing `turmas as turmasTable` (to avoid name conflicts) and `and` from drizzle-orm. The existing imports already have `eq` from drizzle-orm. Update the import:

```typescript
import { eq, and } from "drizzle-orm";
```

And add `turmas` to the schema import:

```typescript
import { invitations, students, teachers, user, turmas as turmasTable } from "@/lib/db/schema";
```

Then add `turmaId` to the insert values (around line 38):

```typescript
  await db.insert(invitations).values({
    email,
    token,
    teacherId: teacher.id,
    turmaId,
    expiresAt,
  });
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: Errors in `invite-student-form.tsx` because it still calls `createInvitation(email)` with one arg — that's expected and will be fixed in Task 4.

- [ ] **Step 3: Commit**

```bash
git add src/lib/actions/invitations.ts
git commit -m "feat(invite): require turmaId when creating invitation"
```

---

### Task 3: Server Action — Update `acceptInvitation` to auto-join turma

**Files:**
- Modify: `src/lib/actions/invitations.ts`

- [ ] **Step 1: Add turmaStudents insert after student creation**

In `src/lib/actions/invitations.ts`, add `turmaStudents` to the schema import:

```typescript
import { invitations, students, teachers, user, turmas as turmasTable, turmaStudents } from "@/lib/db/schema";
```

In the `acceptInvitation` function, after the line that marks the invitation as accepted (around line 131 `await db.update(invitations).set({ acceptedAt: new Date() })`), add:

```typescript
  // Auto-join student to the invitation's turma
  if (invitation.turmaId) {
    const student = await db.query.students.findFirst({
      where: (s, { eq: e }) => e(s.userId, signUpResult.user.id),
    });
    if (student) {
      try {
        await db.insert(turmaStudents).values({
          turmaId: invitation.turmaId,
          studentId: student.id,
        });
      } catch {
        // Turma may have been deleted — student still gets created
      }
    }
  }
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: Same error as before in invite-student-form (expected, fixed in Task 4)

- [ ] **Step 3: Commit**

```bash
git add src/lib/actions/invitations.ts
git commit -m "feat(invite): auto-join student to turma on invite acceptance"
```

---

### Task 4: UI — Update invite form with turma select

**Files:**
- Modify: `src/components/teacher/invite-student-form.tsx`
- Modify: `src/app/teacher/students/page.tsx`

- [ ] **Step 1: Update the students page to fetch and pass turmas**

In `src/app/teacher/students/page.tsx`, add the turmas import and fetch:

```typescript
import { getTurmasForSelector } from "@/lib/queries/turmas";
```

After `const students = await getStudents(teacher.id);`, add:

```typescript
const turmas = await getTurmasForSelector(teacher.id);
```

Update the JSX to pass turmas:

```tsx
<InviteStudentForm turmas={turmas} />
```

- [ ] **Step 2: Update InviteStudentForm to include turma select**

Replace the entire content of `src/components/teacher/invite-student-form.tsx` with:

```typescript
"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Send, CheckCircle, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { createInvitation } from "@/lib/actions/invitations";

interface Turma {
  id: string;
  name: string;
  color: string | null;
}

interface InviteStudentFormProps {
  turmas: Turma[];
}

export function InviteStudentForm({ turmas }: InviteStudentFormProps) {
  const [email, setEmail] = useState("");
  const [turmaId, setTurmaId] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !turmaId) return;

    setLoading(true);
    setFeedback(null);

    try {
      await createInvitation(email.trim(), turmaId);
      setFeedback({
        type: "success",
        message: `Convite enviado para ${email}`,
      });
      setEmail("");
    } catch (err) {
      setFeedback({
        type: "error",
        message:
          err instanceof Error ? err.message : "Erro ao enviar convite",
      });
    } finally {
      setLoading(false);
    }
  }

  if (turmas.length === 0) {
    return (
      <div className="mb-6 rounded-[var(--radius-md)] bg-warning-bg border border-warning/20 px-4 py-3 text-sm text-text-secondary">
        Para convidar alunos, primeiro{" "}
        <Link href="/teacher/turmas/new" className="text-aulas font-medium underline">
          crie uma turma
        </Link>
        .
      </div>
    );
  }

  return (
    <div className="mb-6">
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        <div className="w-48">
          <Select
            label="Turma"
            options={turmas.map((t) => ({ value: t.id, label: t.name }))}
            placeholder="Selecione..."
            value={turmaId}
            onChange={(e) => setTurmaId(e.target.value)}
            required
          />
        </div>
        <div className="flex-1 max-w-sm">
          <Input
            label="Convidar aluno"
            type="email"
            placeholder="email@exemplo.com"
            icon={Mail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <Button type="submit" loading={loading} size="md">
          <Send size={14} />
          Convidar
        </Button>
      </form>

      {feedback && (
        <div
          className={`flex items-center gap-2 mt-3 text-sm ${
            feedback.type === "success" ? "text-tarefas" : "text-error"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle size={14} />
          ) : (
            <AlertCircle size={14} />
          )}
          {feedback.message}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/components/teacher/invite-student-form.tsx src/app/teacher/students/page.tsx
git commit -m "feat(invite): add turma select to invite student form"
```

---

### Task 5: Queries — Add pending invites and available students

**Files:**
- Modify: `src/lib/queries/turmas.ts`

- [ ] **Step 1: Add getPendingInvites query**

Add these imports to the top of `src/lib/queries/turmas.ts`:

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
  invitations,
} from "@/lib/db/schema";
import { eq, and, desc, count, notInArray, inArray, isNull, gt } from "drizzle-orm";
```

Add this function at the end of the file:

```typescript
export async function getPendingInvites(turmaId: string) {
  const db = getDb();
  const now = new Date();

  return db
    .select({
      id: invitations.id,
      email: invitations.email,
      expiresAt: invitations.expiresAt,
      createdAt: invitations.createdAt,
    })
    .from(invitations)
    .where(
      and(
        eq(invitations.turmaId, turmaId),
        isNull(invitations.acceptedAt),
        gt(invitations.expiresAt, now),
      ),
    )
    .orderBy(desc(invitations.createdAt));
}
```

- [ ] **Step 2: Add getAvailableStudentsForTurma query**

Add this function at the end of `src/lib/queries/turmas.ts`:

```typescript
export async function getAvailableStudentsForTurma(
  turmaId: string,
  teacherId: string,
) {
  const db = getDb();

  const inTurma = await db
    .select({ studentId: turmaStudents.studentId })
    .from(turmaStudents)
    .where(eq(turmaStudents.turmaId, turmaId));

  const inTurmaIds = inTurma.map((r) => r.studentId);

  const conditions = [eq(students.teacherId, teacherId)];
  if (inTurmaIds.length > 0) {
    conditions.push(notInArray(students.id, inTurmaIds));
  }

  return db
    .select({
      id: students.id,
      name: user.name,
      email: user.email,
    })
    .from(students)
    .innerJoin(user, eq(students.userId, user.id))
    .where(and(...conditions))
    .orderBy(user.name);
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/lib/queries/turmas.ts
git commit -m "feat(turma): add queries for pending invites and available students"
```

---

### Task 6: Server Action — Add `addStudentToTurma`

**Files:**
- Modify: `src/lib/actions/turmas.ts`

- [ ] **Step 1: Add addStudentToTurma action**

Add `students` to the schema import in `src/lib/actions/turmas.ts`:

```typescript
import {
  turmas,
  turmaStudents,
  turmaLessons,
  turmaTasks,
  students,
} from "@/lib/db/schema";
```

Add this function at the end of the file:

```typescript
export async function addStudentToTurma(formData: FormData) {
  const { teacher } = await getTeacher();
  const turmaId = formData.get("turmaId") as string;
  const studentId = formData.get("studentId") as string;

  if (!turmaId || !studentId)
    throw new Error("IDs da turma e aluno são obrigatórios");

  const db = getDb();

  // Validate turma belongs to teacher
  const turma = await db.query.turmas.findFirst({
    where: (t, { eq: e, and: a }) =>
      a(e(t.id, turmaId), e(t.teacherId, teacher.id)),
  });
  if (!turma) throw new Error("Turma não encontrada");

  // Validate student belongs to teacher
  const student = await db.query.students.findFirst({
    where: (s, { eq: e, and: a }) =>
      a(e(s.id, studentId), e(s.teacherId, teacher.id)),
  });
  if (!student) throw new Error("Aluno não encontrado");

  await db.insert(turmaStudents).values({ turmaId, studentId });

  revalidatePath(`/teacher/turmas/${turmaId}`);
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/actions/turmas.ts
git commit -m "feat(turma): add server action to add existing student to turma"
```

---

### Task 7: Component — `AddStudentToTurma` client component

**Files:**
- Create: `src/components/teacher/add-student-to-turma.tsx`

- [ ] **Step 1: Create the client component**

```typescript
// src/components/teacher/add-student-to-turma.tsx
"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { addStudentToTurma } from "@/lib/actions/turmas";

interface AvailableStudent {
  id: string;
  name: string;
  email: string;
}

interface AddStudentToTurmaProps {
  turmaId: string;
  availableStudents: AvailableStudent[];
}

export function AddStudentToTurma({
  turmaId,
  availableStudents,
}: AddStudentToTurmaProps) {
  const [showForm, setShowForm] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState(false);

  if (availableStudents.length === 0) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!studentId) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("turmaId", turmaId);
    formData.append("studentId", studentId);

    try {
      await addStudentToTurma(formData);
      setStudentId("");
      setShowForm(false);
    } catch {
      // Error handled by revalidation
    } finally {
      setLoading(false);
    }
  }

  if (!showForm) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setShowForm(true)}>
        <UserPlus size={14} />
        Adicionar aluno
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <div className="w-64">
        <Select
          options={availableStudents.map((s) => ({
            value: s.id,
            label: `${s.name} (${s.email})`,
          }))}
          placeholder="Selecione um aluno..."
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          required
        />
      </div>
      <Button type="submit" size="sm" loading={loading}>
        Adicionar
      </Button>
      <Button
        variant="ghost"
        size="sm"
        type="button"
        onClick={() => {
          setShowForm(false);
          setStudentId("");
        }}
      >
        Cancelar
      </Button>
    </form>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/teacher/add-student-to-turma.tsx
git commit -m "feat(turma): add client component to add existing student to turma"
```

---

### Task 8: UI — Pending invites + add student in turma members

**Files:**
- Modify: `src/components/teacher/turma-members.tsx`
- Modify: `src/components/teacher/turma-detail.tsx`
- Modify: `src/app/teacher/turmas/[id]/page.tsx`

- [ ] **Step 1: Update turma detail page to fetch pending invites and available students**

In `src/app/teacher/turmas/[id]/page.tsx`, add imports:

```typescript
import {
  getTurma,
  getTurmaMembers,
  getTurmaLessons,
  getTurmaTasks,
  getAvailableLessons,
  getAvailableTasks,
  getPendingInvites,
  getAvailableStudentsForTurma,
} from "@/lib/queries/turmas";
```

Update the `Promise.all` to include the new queries:

```typescript
const [members, linkedLessons, linkedTasks, availableLessons, availableTasks, pendingInvites, availableStudents] =
  await Promise.all([
    getTurmaMembers(turma.id),
    getTurmaLessons(turma.id, teacher.id),
    getTurmaTasks(turma.id, teacher.id),
    getAvailableLessons(teacher.id, turma.id),
    getAvailableTasks(teacher.id, turma.id),
    getPendingInvites(turma.id),
    getAvailableStudentsForTurma(turma.id, teacher.id),
  ]);
```

Pass the new data to `TurmaDetail`:

```tsx
<TurmaDetail
  turmaId={turma.id}
  members={members}
  pendingInvites={pendingInvites}
  availableStudents={availableStudents}
  linkedLessons={linkedLessons}
  linkedTasks={linkedTasks}
  availableLessons={availableLessons}
  availableTasks={availableTasks}
  settings={{
    id: turma.id,
    notifyNewLesson: turma.notifyNewLesson,
    notifyNewTask: turma.notifyNewTask,
  }}
/>
```

- [ ] **Step 2: Update TurmaDetail component to pass new props**

In `src/components/teacher/turma-detail.tsx`, add the new interfaces and props:

Add after the `Member` interface:

```typescript
interface PendingInvite {
  id: string;
  email: string;
  expiresAt: Date;
  createdAt: Date;
}

interface AvailableStudent {
  id: string;
  name: string;
  email: string;
}
```

Update `TurmaDetailProps`:

```typescript
interface TurmaDetailProps {
  turmaId: string;
  members: Member[];
  pendingInvites: PendingInvite[];
  availableStudents: AvailableStudent[];
  linkedLessons: LinkedLesson[];
  linkedTasks: LinkedTask[];
  availableLessons: AvailableItem[];
  availableTasks: AvailableItem[];
  settings: TurmaSettingsData;
}
```

Update the component destructuring and pass to TurmaMembers:

```tsx
export function TurmaDetail({
  turmaId,
  members,
  pendingInvites,
  availableStudents,
  linkedLessons,
  linkedTasks,
  availableLessons,
  availableTasks,
  settings,
}: TurmaDetailProps) {
```

Update the members tab rendering:

```tsx
{activeTab === "membros" && (
  <TurmaMembers
    turmaId={turmaId}
    members={members}
    pendingInvites={pendingInvites}
    availableStudents={availableStudents}
  />
)}
```

- [ ] **Step 3: Update TurmaMembers to show pending invites and add student button**

Replace the entire content of `src/components/teacher/turma-members.tsx` with:

```typescript
import { Users, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { removeStudentFromTurma } from "@/lib/actions/turmas";
import { AddStudentToTurma } from "@/components/teacher/add-student-to-turma";

interface Member {
  studentId: string;
  userName: string;
  userEmail: string;
  joinedAt: Date;
}

interface PendingInvite {
  id: string;
  email: string;
  expiresAt: Date;
  createdAt: Date;
}

interface AvailableStudent {
  id: string;
  name: string;
  email: string;
}

interface TurmaMembersProps {
  turmaId: string;
  members: Member[];
  pendingInvites: PendingInvite[];
  availableStudents: AvailableStudent[];
}

function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  if (diffHours <= 0) return "Expirado";
  if (diffHours < 24) return `Expira em ${diffHours}h`;
  const diffDays = Math.round(diffHours / 24);
  return `Expira em ${diffDays}d`;
}

export function TurmaMembers({
  turmaId,
  members,
  pendingInvites,
  availableStudents,
}: TurmaMembersProps) {
  return (
    <div className="space-y-6">
      {/* Add student button */}
      <div className="flex justify-end">
        <AddStudentToTurma
          turmaId={turmaId}
          availableStudents={availableStudents}
        />
      </div>

      {/* Pending invites */}
      {pendingInvites.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-text-muted mb-3 flex items-center gap-2">
            <Clock size={14} />
            Convites pendentes
          </h3>
          <div className="space-y-2">
            {pendingInvites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center gap-3 px-4 py-3 rounded-[var(--radius-sm)] bg-warning-bg/50 border border-warning/10"
              >
                <p className="text-sm text-text-secondary flex-1">
                  {invite.email}
                </p>
                <Badge variant="draft">{formatRelativeDate(invite.expiresAt)}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members table */}
      {members.length === 0 && pendingInvites.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum aluno na turma"
          description="Convide alunos na página de Alunos ou adicione alunos existentes."
        />
      ) : members.length === 0 ? null : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-xs font-medium text-text-muted">
                  Aluno
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-text-muted">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr
                  key={member.studentId}
                  className="border-b border-border last:border-0 hover:bg-bg-light transition-colors"
                >
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-text-primary">
                        {member.userName}
                      </p>
                      <p className="text-xs text-text-muted">
                        {member.userEmail}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <form action={removeStudentFromTurma}>
                      <input type="hidden" name="turmaId" value={turmaId} />
                      <input
                        type="hidden"
                        name="studentId"
                        value={member.studentId}
                      />
                      <Button variant="danger" size="sm" type="submit">
                        <Trash2 size={14} />
                        Remover
                      </Button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/app/teacher/turmas/\[id\]/page.tsx src/components/teacher/turma-detail.tsx src/components/teacher/turma-members.tsx
git commit -m "feat(turma): show pending invites and add-student in turma members tab"
```

---

### Task 9: Seed + Reset + Verify

- [ ] **Step 1: Reset database with new schema**

Run: `npm run db:reset`
Expected: Migrations apply, seed completes successfully

- [ ] **Step 2: Full type check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Run E2E tests**

Run: Kill dev server if running, restart, then: `npx playwright test --project=setup --project=teacher`
Expected: Existing teacher tests still pass (invite form tests may need updating if they exist)

- [ ] **Step 4: Manual browser verification**

Start dev server and verify in browser:
1. Sign in as teacher (fran@fluent.app / senha12345)
2. Go to `/teacher/students` — verify turma select appears in invite form
3. Go to `/teacher/turmas/{id}` — verify members tab shows "Adicionar aluno" button
4. Test inviting a student with turma selected
5. Test adding an existing student to a turma

- [ ] **Step 5: Final commit if any fixes needed**

Only if adjustments were made during verification.
