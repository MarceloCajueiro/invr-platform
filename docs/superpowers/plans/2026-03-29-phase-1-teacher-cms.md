# Phase 1: Teacher CMS — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Teacher can manage all content: dashboard with KPIs, lessons CRUD, tasks CRUD with question editor, posts CRUD, turmas CRUD with member/content management, student management with invites.

**Architecture:** Server Components for data fetching, Server Actions for mutations, Zod for validation. UI primitives built from scratch with Tailwind DS tokens. All queries scoped to the authenticated teacher.

**Tech Stack:** Next.js 16 App Router, Drizzle ORM, Cloudflare D1, Tailwind CSS v4, Lucide React, Zod, react-markdown

---

### Task 1: UI Primitives

**Files:**
- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/input.tsx`
- Create: `src/components/ui/textarea.tsx`
- Create: `src/components/ui/select.tsx`
- Create: `src/components/ui/badge.tsx`
- Create: `src/components/ui/card.tsx`
- Create: `src/components/ui/modal.tsx`
- Create: `src/components/ui/tabs.tsx`
- Create: `src/components/ui/empty-state.tsx`
- Create: `src/components/ui/page-header.tsx`

All components use DS tokens from globals.css. No external UI library.

**Button** variants: primary (bg-aulas), secondary (border-aulas), danger (bg-error), ghost. Sizes: sm, md, lg. Supports `asChild` pattern for Link wrapping. 3D press effect (active:translate-y-[2px]).

**Input** with label, error message, optional icon. Background: #f8f9fb, border-border, focus:border-aulas.

**Textarea** same styling as Input but multi-line. Optional `rows` prop.

**Select** native select with same styling. Accepts `options: {value, label}[]`.

**Badge** with channel variants (aulas, tarefas, fora, challenges) + status variants (draft=text-muted bg-gray-100, published=text-tarefas bg-tarefas-bg) + level variants (beginner=tarefas, intermediate=aulas, advanced=fora).

**Card** with white bg, border-border, rounded-md, shadow-sm. Hover state optional (shadow-md + translateY(-2px)).

**Modal** with backdrop blur, centered content, close button, title. Uses React portal or dialog element.

**Tabs** simple tab component with active state (border-bottom color).

**EmptyState** centered icon + title + description + optional action button.

**PageHeader** title (Bricolage Grotesque) + optional description + optional action button (right aligned).

- [ ] Implement all 10 UI components following DS tokens
- [ ] Commit: `feat: add UI primitive components`

---

### Task 2: Shared Teacher Helpers

**Files:**
- Create: `src/lib/auth/get-teacher.ts`
- Create: `src/lib/validations/lessons.ts`
- Create: `src/lib/validations/tasks.ts`
- Create: `src/lib/validations/posts.ts`
- Create: `src/lib/validations/turmas.ts`

**get-teacher.ts**: Helper that gets the current session and teacher profile in one call. Returns `{ user, teacher }` or redirects to /sign-in. Used by all teacher pages.

```typescript
import { createAuth } from "@/lib/auth/server";
import { getDb } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function getTeacher() {
  const auth = await createAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || session.user.role !== "teacher") redirect("/sign-in");
  const db = getDb();
  const teacher = await db.query.teachers.findFirst({
    where: (t, { eq }) => eq(t.userId, session.user.id),
  });
  if (!teacher) redirect("/sign-in");
  return { user: session.user, teacher };
}
```

**Validation schemas** (Zod) for each entity's create/update operations.

- [ ] Implement helpers and all validation schemas
- [ ] Commit: `feat: add teacher auth helper and validation schemas`

---

### Task 3: Teacher Dashboard

**Files:**
- Create: `src/lib/queries/dashboard.ts`
- Modify: `src/app/(teacher)/dashboard/page.tsx`
- Create: `src/components/teacher/kpi-card.tsx`
- Create: `src/components/teacher/activity-chart.tsx`
- Create: `src/components/teacher/recent-submissions.tsx`

**KPI Cards** (4): Total students, Published lessons, Active tasks, Pending submissions. Each shows count + icon + optional trend. Uses Card component with channel color accent.

**Activity Chart**: Simple bar chart (CSS-only, no chart library) showing submissions per day for last 7 days. Uses barGrow animation.

**Recent Submissions**: Table/list of latest 5 submissions with student name, task title, score, status badge, date.

**Dashboard queries** in `src/lib/queries/dashboard.ts`:
- `getDashboardKPIs(teacherId)` — counts from students, lessons, tasks, submissions tables
- `getRecentSubmissions(teacherId, limit)` — join submissions with students and tasks
- `getActivityData(teacherId, days)` — group submissions by day

- [ ] Create dashboard query functions
- [ ] Create KPI card, activity chart, recent submissions components
- [ ] Update dashboard page to use real data
- [ ] Commit: `feat: add teacher dashboard with KPIs and activity`

---

### Task 4: Lessons CRUD

**Files:**
- Create: `src/lib/actions/lessons.ts`
- Create: `src/lib/queries/lessons.ts`
- Modify: `src/app/(teacher)/lessons/page.tsx`
- Create: `src/app/(teacher)/lessons/new/page.tsx`
- Create: `src/app/(teacher)/lessons/[id]/edit/page.tsx`
- Create: `src/components/teacher/lesson-form.tsx`
- Create: `src/components/teacher/lesson-list.tsx`

**List page**: Table/list with title, category badge, status badge, duration, actions (edit/delete). Filters by status and category. PageHeader with "Nova Aula" button.

**Form** (create/edit): Title input, category select, description textarea (markdown), video URL input, cover image upload (presigned URL), duration input, position input. Publish/unpublish toggle.

**Server Actions**: createLesson, updateLesson, deleteLesson, publishLesson, unpublishLesson. All validate with Zod, scope to teacher.

**Queries**: getLessons(teacherId, filters), getLesson(id).

- [ ] Create lesson queries and server actions
- [ ] Create lesson list component with filters
- [ ] Create lesson form component (create/edit)
- [ ] Create list page, new page, edit page
- [ ] Commit: `feat: add lessons CRUD for teacher CMS`

---

### Task 5: Tasks CRUD with Question Editor

**Files:**
- Create: `src/lib/actions/tasks.ts`
- Create: `src/lib/queries/tasks.ts`
- Modify: `src/app/(teacher)/tasks/page.tsx`
- Create: `src/app/(teacher)/tasks/new/page.tsx`
- Create: `src/app/(teacher)/tasks/[id]/edit/page.tsx`
- Create: `src/components/teacher/task-form.tsx`
- Create: `src/components/teacher/task-list.tsx`
- Create: `src/components/teacher/question-editor.tsx`

**List page**: Similar to lessons. Filters by task_type and status. Shows type icon, title, level badge, question count, status.

**Form**: Title, description, type select (quiz/listening/fill_gaps/writing), level select. Dynamic **question editor** based on type:
- **Quiz**: question text + 4 option inputs (radio for correct) + explanation textarea
- **Fill-gaps**: sentence with blank input + answer + explanation
- **Writing**: prompt textarea + instructions
- **Listening**: text input (for TTS generation later)

Question editor is a client component with React Hook Form for dynamic field arrays.

**Server Actions**: createTask, updateTask, deleteTask, publishTask.

- [ ] Create task queries and server actions
- [ ] Create question editor component (client, RHF)
- [ ] Create task list and form components
- [ ] Create list page, new page, edit page
- [ ] Commit: `feat: add tasks CRUD with question editor for teacher CMS`

---

### Task 6: Posts CRUD

**Files:**
- Create: `src/lib/actions/posts.ts`
- Create: `src/lib/queries/posts.ts`
- Modify: `src/app/(teacher)/posts/page.tsx`
- Create: `src/app/(teacher)/posts/new/page.tsx`
- Create: `src/app/(teacher)/posts/[id]/edit/page.tsx`
- Create: `src/components/teacher/post-form.tsx`
- Create: `src/components/teacher/post-list.tsx`

**List page**: Posts with title, category badge, status, view count, date. Filter by category.

**Form**: Title, slug (auto-generated, editable), content textarea (markdown with preview), category select, featured toggle. Publish/unpublish.

Install `react-markdown` for preview.

**Server Actions**: createPost, updatePost, deletePost, publishPost.

- [ ] Install react-markdown
- [ ] Create post queries and server actions
- [ ] Create post list and form with markdown preview
- [ ] Create list page, new page, edit page
- [ ] Commit: `feat: add posts CRUD with markdown preview for teacher CMS`

---

### Task 7: Turmas CRUD

**Files:**
- Create: `src/lib/actions/turmas.ts`
- Create: `src/lib/queries/turmas.ts`
- Modify: `src/app/(teacher)/turmas/page.tsx`
- Create: `src/app/(teacher)/turmas/new/page.tsx`
- Create: `src/app/(teacher)/turmas/[id]/page.tsx`
- Create: `src/components/teacher/turma-form.tsx`
- Create: `src/components/teacher/turma-card.tsx`
- Create: `src/components/teacher/turma-detail.tsx`
- Create: `src/components/teacher/turma-members.tsx`
- Create: `src/components/teacher/turma-content.tsx`

**List page**: Cards grid with colored top bar, name, level badge, student count, invite code (copiable). PageHeader with "Nova Turma" button.

**Form** (create/edit): Name, description, color picker (preset palette), level select.

**Detail page** with tabs:
- **Membros**: Student list with name, XP, streak. Remove button.
- **Aulas vinculadas**: List of lessons with add/remove. Select from teacher's published lessons.
- **Tarefas vinculadas**: Same but for tasks.
- **Configurações**: Notification toggles, invite code display, danger zone (delete).

**Server Actions**: createTurma, updateTurma, deleteTurma, addStudentToTurma, removeStudentFromTurma, linkLesson, unlinkLesson, linkTask, unlinkTask.

- [ ] Create turma queries and server actions
- [ ] Create turma card, form, detail, members, content components
- [ ] Create list page, new page, detail page
- [ ] Commit: `feat: add turmas CRUD with member and content management`

---

### Task 8: Students Management

**Files:**
- Create: `src/lib/queries/students.ts`
- Modify: `src/app/(teacher)/students/page.tsx`
- Create: `src/app/(teacher)/students/[id]/page.tsx`
- Create: `src/components/teacher/student-list.tsx`
- Create: `src/components/teacher/student-profile.tsx`
- Create: `src/components/teacher/invite-student-form.tsx`

**List page**: Student cards/table with avatar (initials), name, XP, streak, last activity, enrolled turmas count. "Convidar Aluno" button that opens inline form or modal.

**Invite form**: Email input → calls existing `createInvitation` action.

**Profile page**: Student info, XP, streak, submission history (list), lesson progress (list), enrolled turmas.

**Queries**: getStudents(teacherId), getStudentProfile(studentId), getStudentSubmissions(studentId), getStudentProgress(studentId).

- [ ] Create student queries
- [ ] Create student list, profile, invite form components
- [ ] Create list page and profile page
- [ ] Commit: `feat: add students management with profiles and invites`

---

### Task 9: New Content Modal + Keyboard Shortcuts

**Files:**
- Create: `src/components/teacher/new-content-modal.tsx`
- Modify: `src/app/(teacher)/layout.tsx`

**Modal**: Triggered by Cmd+N (or a button in sidebar). Shows 4 channel cards:
- Aula (purple) → /lessons/new
- Tarefa (green) → /tasks/new
- Post (coral) → /posts/new
- Challenge (gold) → disabled/coming soon

Each card has channel color gradient, icon, and label. Click navigates to creation page.

**Keyboard shortcuts**: useEffect with keydown listener for Cmd+N → open modal, Escape → close.

- [ ] Create new content modal component
- [ ] Add to teacher layout with keyboard shortcut
- [ ] Commit: `feat: add new content modal with Cmd+N shortcut`

---

## Summary

| Task | What it delivers |
|------|-----------------|
| 1 | 10 UI primitive components |
| 2 | Teacher auth helper + Zod validation schemas |
| 3 | Dashboard with KPIs, activity chart, recent submissions |
| 4 | Lessons CRUD (list, create, edit, publish, delete) |
| 5 | Tasks CRUD with dynamic question editor |
| 6 | Posts CRUD with markdown preview |
| 7 | Turmas CRUD with member/content management |
| 8 | Students management with profiles and invites |
| 9 | New content modal with Cmd+N shortcut |

**Exit criteria**: Teacher can create and manage all content types. Dashboard shows real KPIs. Can invite students, manage classes, link content.
