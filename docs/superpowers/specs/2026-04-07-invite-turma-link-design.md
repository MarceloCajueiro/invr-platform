# Link Invitations to Turmas

## Summary

When a teacher invites a student, the invitation must be associated with a turma. When the student accepts, they automatically join that turma. Teachers can also see pending invitations per turma and add existing students to turmas directly.

## Decisions

- **Schema:** Add `turmaId` (required in app code) to `invitations` table. Migration adds as nullable for backwards compatibility with expired invitations.
- **Invite form:** Turma select is mandatory. If teacher has no turmas, show message with link to create one.
- **Accept flow:** `acceptInvitation` inserts into `turmaStudents` automatically.
- **Pending visibility:** Turma detail page shows pending invitations in the members tab.
- **Add existing students:** Button in turma members tab to add students who are already registered but not in that turma.

## Schema Change

Add `turmaId` column to `invitations` table:

```sql
ALTER TABLE invitations ADD COLUMN turma_id TEXT REFERENCES turmas(id);
```

In `schema.ts`, the column is defined with a reference to `turmas.id`. The migration adds it as nullable (existing rows have null), but the application code always requires it for new invitations.

```typescript
turmaId: text("turma_id").references(() => turmas.id),
```

No need to make it NOT NULL in the DB since old expired invitations exist without it.

## Invite Form Changes

### `InviteStudentForm`

Currently accepts only email. Changes:

- Add `turmas` prop: `Array<{ id: string; name: string }>` passed from the students page
- Add `<Select>` component before the email input, label "Turma", required
- If `turmas.length === 0`, render a message: "Crie uma turma antes de convidar alunos" with a link to `/teacher/turmas/new`. Hide the email input and submit button.
- Call `createInvitation(email, turmaId)` with both values

### `teacher/students/page.tsx`

Fetch teacher's turmas and pass to `InviteStudentForm`:

```typescript
const turmas = await getTeacherTurmas(teacher.id); // already exists in queries/turmas.ts
```

### `createInvitation(email, turmaId)`

- Add `turmaId: string` parameter
- Validate turma belongs to teacher
- Insert `turmaId` into invitations record
- Email template unchanged (student doesn't need to know which turma)

## Accept Invitation Changes

### `acceptInvitation`

After creating the student record, also insert into `turmaStudents`:

```typescript
// Existing: create student record
await db.insert(students).values({
  userId: signUpResult.user.id,
  teacherId: invitation.teacherId,
});

// New: add student to turma (if invitation has turmaId)
if (invitation.turmaId) {
  const student = await db.query.students.findFirst({
    where: (s, { eq }) => eq(s.userId, signUpResult.user.id),
  });
  if (student) {
    await db.insert(turmaStudents).values({
      turmaId: invitation.turmaId,
      studentId: student.id,
    });
  }
}
```

The `if (invitation.turmaId)` guard handles old invitations that don't have a turma. New invitations always have one.

Edge case: if the turma was deleted between invite and acceptance, the `turmaStudents` insert will fail (FK constraint). Wrap it in a try/catch and silently skip — the student still gets created and linked to the teacher, just not to the (now-deleted) turma.

## Pending Invitations in Turma Detail

### New query: `getPendingInvites(turmaId)`

Location: `src/lib/queries/turmas.ts`

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
      )
    )
    .orderBy(desc(invitations.createdAt));
}
```

### Turma detail page (`teacher/turmas/[id]/page.tsx`)

Add `getPendingInvites(turma.id)` to the `Promise.all`. Pass result to `TurmaDetail`.

### `TurmaMembers` component

Add a "Convites pendentes" section above the members table, only if there are pending invites:

- Each row: email + Badge variant="warning" text="Pendente" + expiration date
- Visually distinct from actual members (lighter background or different section)

## Add Existing Student to Turma

### New query: `getAvailableStudentsForTurma(turmaId, teacherId)`

Location: `src/lib/queries/turmas.ts`

Returns students belonging to the teacher who are NOT in the specified turma:

```typescript
export async function getAvailableStudentsForTurma(turmaId: string, teacherId: string) {
  const db = getDb();

  // Get students already in this turma
  const inTurma = await db
    .select({ studentId: turmaStudents.studentId })
    .from(turmaStudents)
    .where(eq(turmaStudents.turmaId, turmaId));

  const inTurmaIds = inTurma.map(r => r.studentId);

  // Get all teacher's students not in this turma
  const available = await db
    .select({
      id: students.id,
      name: user.name,
      email: user.email,
    })
    .from(students)
    .innerJoin(user, eq(students.userId, user.id))
    .where(
      and(
        eq(students.teacherId, teacherId),
        inTurmaIds.length > 0 ? notInArray(students.id, inTurmaIds) : undefined,
      )
    );

  return available;
}
```

### New action: `addStudentToTurma(turmaId, studentId)`

Location: `src/lib/actions/turmas.ts`

- Validate teacher owns the turma
- Validate student belongs to teacher
- Insert into `turmaStudents`
- `revalidatePath` for the turma detail page

### UI in `TurmaMembers`

Add a client component `AddStudentToTurma`:

- Button "Adicionar aluno" (visible only when `availableStudents.length > 0`)
- On click, shows a `<Select>` dropdown with available students (name + email)
- On select + confirm, calls `addStudentToTurma` server action
- After success, revalidates and select disappears

## Files to Create

1. Migration: `drizzle/0005_*.sql` (via `npm run db:generate`)

## Files to Modify

1. `src/lib/db/schema.ts` — add `turmaId` to `invitations`
2. `src/lib/actions/invitations.ts` — `createInvitation(email, turmaId)` + `acceptInvitation` inserts `turmaStudents`
3. `src/components/teacher/invite-student-form.tsx` — add turma select, require turma
4. `src/app/teacher/students/page.tsx` — fetch turmas, pass to form
5. `src/lib/queries/turmas.ts` — add `getPendingInvites`, `getAvailableStudentsForTurma`
6. `src/lib/actions/turmas.ts` — add `addStudentToTurma`
7. `src/app/teacher/turmas/[id]/page.tsx` — fetch pending invites + available students
8. `src/components/teacher/turma-members.tsx` — pending invites section + add student button
9. New: `src/components/teacher/add-student-to-turma.tsx` — client component for add student UI

## Out of Scope

- Inviting to multiple turmas at once
- Resending expired invitations
- Canceling pending invitations
- Changing turma after invitation is sent
- Notification when student joins turma
