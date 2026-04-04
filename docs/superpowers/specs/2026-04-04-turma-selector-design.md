# Turma Selector — Design Spec

Allow teachers to assign turmas when creating/editing lessons, tasks, and posts. Reusable component + server-side linking.

## Problem

Today, turma assignment is a separate step: create content, then navigate to turma detail to link it. This is inconvenient and means the `turma_lessons`/`turma_tasks` junction data is often missing. Additionally, posts have no turma relationship at all.

## Design

### 1. TurmaSelector Component

**File:** `src/components/teacher/turma-selector.tsx` (`"use client"`)

**Props:**
```typescript
interface TurmaSelectorProps {
  turmas: { id: string; name: string; color: string }[];
  selectedIds?: string[];
  name?: string; // hidden input name, defaults to "turmaIds"
}
```

**Behavior:**
- Checkbox "Todas as turmas" at top — toggles all on/off
- Individual checkbox per turma showing name + color dot
- If all individual checkboxes are checked, "Todas as turmas" auto-checks
- Hidden input `turmaIds` with JSON array of selected IDs
- Section is optional — 0 turmas selected is valid (content accessible only via turma detail page)
- Wrapped in a `<Card>` to match the form's visual pattern

**Position:** Last section before submit button in all 3 forms.

### 2. New Junction Table: turma_posts

Same structure as `turma_lessons` and `turma_tasks`:

```
turma_posts (
  id text PK,
  turma_id text FK -> turmas.id (cascade),
  post_id text FK -> posts.id (cascade),
  created_at integer timestamp,
  UNIQUE(turma_id, post_id)
)
```

### 3. Server Action Changes

**createLesson / updateLesson** (`src/lib/actions/lessons.ts`):
- Parse `turmaIds` from FormData (JSON array)
- After main insert: `db.batch()` to insert into `turma_lessons`
- On update: delete existing links for this lesson, then re-insert selected ones

**createTask / updateTask** (`src/lib/actions/tasks.ts`):
- Same pattern as lessons with `turma_tasks`

**createPost / updatePost** (`src/lib/actions/posts.ts`):
- Same pattern with new `turma_posts`

### 4. Queries

**New:** `getTurmasForSelector(teacherId)` in `src/lib/queries/turmas.ts`
- Returns `{ id, name, color }[]` — lightweight for form population

**New:** `getLinkedTurmaIds(table, entityId)` in `src/lib/queries/turmas.ts`
- Generic query: given a junction table reference and entity ID, return turma ID array
- Used to pre-select checkboxes in edit mode

### 5. Form Integration

Each form page (lesson new/edit, task new/edit, post new/edit) will:
1. Fetch `turmasForSelector` via `getTurmasForSelector(teacherId)`
2. For edit: also fetch `linkedTurmaIds` via `getLinkedTurmaIds()`
3. Pass both to the form component, which renders `<TurmaSelector>`

### 6. Validation

Add `turmaIds` as optional `z.array(z.string()).optional()` to the Zod schemas for lessons, tasks, and posts. Empty array or undefined = no turma assignment.

## Out of Scope

- Filtering student-visible content by turma (separate bug — this spec ensures the data exists)
- Notifications when content is linked to a turma
- Removing turma assignment from turma detail page (coexists with this feature)
