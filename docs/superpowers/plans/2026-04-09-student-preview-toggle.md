# Student Preview Toggle — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let teachers see their content (lessons, tasks, posts) rendered exactly as students see it, via a toggle in the teacher layout.

**Architecture:** A `?preview=student` query param controls the mode. Teacher pages read `searchParams` and conditionally render student-facing components (`LessonCard`, `TaskCard`, `PostCard`, `LessonPlayer`, task players) instead of management components. A `PreviewToggle` client component in the teacher layout manages the toggle state. Task players receive a `readOnly` prop to disable inputs.

**Tech Stack:** Next.js 16 (Server Components + searchParams), React 19, Tailwind CSS v4 tokens, existing DS components (Badge, Button, Card)

**Design Spec:** `docs/superpowers/specs/2026-04-09-student-preview-toggle-design.md`

---

### Task 1: Add `info` variant to Badge component

**Files:**
- Modify: `src/components/ui/badge.tsx:4-15`

This variant is needed for the "Não visível para alunos" draft indicator and the preview banner.

- [ ] **Step 1: Add the `info` variant to the Badge variantStyles map**

In `src/components/ui/badge.tsx`, add the `info` variant after `advanced`:

```typescript
const variantStyles = {
  aulas: "bg-aulas-bg text-aulas",
  tarefas: "bg-tarefas-bg text-tarefas",
  fora: "bg-fora-bg text-fora",
  challenges: "bg-challenges-bg text-challenges",
  draft: "bg-gray-100 text-text-muted",
  published: "bg-tarefas-bg text-tarefas",
  beginner: "bg-tarefas-bg text-tarefas",
  intermediate: "bg-aulas-bg text-aulas",
  advanced: "bg-fora-bg text-fora",
  info: "bg-info/10 text-info",
  default: "bg-gray-100 text-text-secondary",
} as const;
```

- [ ] **Step 2: Verify TypeScript is happy**

Run: `npx tsc --noEmit`
Expected: No errors (the `BadgeVariant` type is derived from `keyof typeof variantStyles`, so it auto-includes `info`).

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/badge.tsx
git commit -m "feat(ui): add info variant to Badge component"
```

---

### Task 2: Create preview helpers

**Files:**
- Create: `src/lib/utils/preview.ts`

Two small utility functions: one to check if preview mode is active, one to build hrefs that preserve the preview param.

- [ ] **Step 1: Create the preview utility file**

Create `src/lib/utils/preview.ts`:

```typescript
/**
 * Check if student preview mode is active.
 */
export function isPreviewMode(
  searchParams: Record<string, string | string[] | undefined>,
): boolean {
  return searchParams.preview === "student";
}

/**
 * Build an href that preserves ?preview=student when active.
 */
export function previewHref(
  path: string,
  searchParams: Record<string, string | string[] | undefined>,
): string {
  if (!isPreviewMode(searchParams)) return path;
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}preview=student`;
}
```

- [ ] **Step 2: Verify TypeScript is happy**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/utils/preview.ts
git commit -m "feat: add preview mode utility helpers"
```

---

### Task 3: Create PreviewToggle component

**Files:**
- Create: `src/components/teacher/preview-toggle.tsx`

A client component that renders a toggle button and, when active, a banner bar. Lives in the teacher layout.

- [ ] **Step 1: Create the PreviewToggle component**

Create `src/components/teacher/preview-toggle.tsx`:

```tsx
"use client";

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { Eye, EyeOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PREVIEW_PAGES = ["/teacher/lessons", "/teacher/tasks", "/teacher/posts"];

export function PreviewToggle() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const isActive = searchParams.get("preview") === "student";
  const isPreviewablePage = PREVIEW_PAGES.some((p) => pathname.startsWith(p));

  // Only show on pages that support preview
  if (!isPreviewablePage) return null;

  function toggle() {
    const params = new URLSearchParams(searchParams.toString());
    if (isActive) {
      params.delete("preview");
    } else {
      params.set("preview", "student");
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  if (isActive) {
    return (
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 mb-6 rounded-[var(--radius-md)] border border-info/20 bg-info/5">
        <div className="flex items-center gap-2 text-sm font-medium text-info">
          <Eye size={16} />
          <span>Visualizando como aluno</span>
        </div>
        <button
          onClick={toggle}
          className="flex items-center gap-1.5 text-sm text-info hover:text-info/80 transition-colors cursor-pointer"
        >
          <X size={14} />
          <span>Sair do preview</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex justify-end mb-4">
      <Button variant="ghost" size="sm" onClick={toggle}>
        <Eye size={16} />
        Ver como aluno
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript is happy**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/teacher/preview-toggle.tsx
git commit -m "feat(teacher): add PreviewToggle component with banner"
```

---

### Task 4: Add PreviewToggle to teacher layout

**Files:**
- Modify: `src/app/teacher/layout.tsx`

The layout needs to pass `searchParams` context to the toggle and wrap `{children}` with it.

- [ ] **Step 1: Import and add PreviewToggle to the teacher layout**

In `src/app/teacher/layout.tsx`, add the import and the `Suspense`-wrapped toggle inside `<main>` before `{children}`:

```typescript
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Suspense } from "react";
import { createAuth } from "@/lib/auth/server";
import { Sidebar } from "@/components/shared/sidebar";
import { MobileNav } from "@/components/shared/mobile-nav";
import { NewContentModal } from "@/components/teacher/new-content-modal";
import { PreviewToggle } from "@/components/teacher/preview-toggle";

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await createAuth();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  if (session.user.role !== "teacher") {
    redirect("/home");
  }

  return (
    <div className="flex min-h-screen">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-bg-card focus:text-text-primary focus:rounded-md focus:shadow-lg"
      >
        Ir para conteúdo principal
      </a>
      <Sidebar role="teacher" userName={session.user.name} />
      <main id="main-content" className="flex-1 px-4 md:px-8 lg:px-12 py-6 md:py-8 pb-16 md:pb-8">
        <Suspense>
          <PreviewToggle />
        </Suspense>
        {children}
      </main>
      <MobileNav role="teacher" />
      <NewContentModal />
    </div>
  );
}
```

Note: `PreviewToggle` uses `useSearchParams()` which requires a `<Suspense>` boundary in Next.js 16.

- [ ] **Step 2: Verify TypeScript is happy**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Test in browser**

Run: `npm run dev -- --port 3001`
1. Go to `http://localhost:3001/teacher/lessons` — should see "Ver como aluno" button
2. Click it — URL changes to `?preview=student`, banner appears
3. Go to `http://localhost:3001/teacher/dashboard` — toggle should NOT appear
4. Click "Sair do preview" — param removed, banner disappears

- [ ] **Step 4: Commit**

```bash
git add src/app/teacher/layout.tsx
git commit -m "feat(teacher): add PreviewToggle to teacher layout"
```

---

### Task 5: Create DraftOverlay wrapper component

**Files:**
- Create: `src/components/teacher/draft-overlay.tsx`

A wrapper that adds reduced opacity and "Não visível para alunos" badge to draft items in preview mode.

- [ ] **Step 1: Create the DraftOverlay component**

Create `src/components/teacher/draft-overlay.tsx`:

```tsx
import { Badge } from "@/components/ui/badge";

interface DraftOverlayProps {
  isDraft: boolean;
  children: React.ReactNode;
}

export function DraftOverlay({ isDraft, children }: DraftOverlayProps) {
  if (!isDraft) return <>{children}</>;

  return (
    <div className="relative">
      <div className="opacity-60">{children}</div>
      <div className="absolute top-2 right-2 z-10">
        <Badge variant="info">Não visível para alunos</Badge>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript is happy**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/teacher/draft-overlay.tsx
git commit -m "feat(teacher): add DraftOverlay component for preview mode"
```

---

### Task 6: Add preview mode to teacher lessons list page

**Files:**
- Modify: `src/app/teacher/lessons/page.tsx`

When `?preview=student` is active, render student `LessonCard` components instead of the teacher `LessonList`.

- [ ] **Step 1: Update the lessons page to support preview mode**

Replace `src/app/teacher/lessons/page.tsx` with:

```typescript
import Link from "next/link";
import { Plus, BookOpen } from "lucide-react";
import { getTeacher } from "@/lib/auth/get-teacher";
import { getLessons } from "@/lib/queries/lessons";
import { getTurmasForSelector } from "@/lib/queries/turmas";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LessonFilters } from "@/components/teacher/lesson-filters";
import { LessonList } from "@/components/teacher/lesson-list";
import { LessonCard } from "@/components/student/lesson-card";
import { DraftOverlay } from "@/components/teacher/draft-overlay";
import { isPreviewMode, previewHref } from "@/lib/utils/preview";

interface LessonsPageProps {
  searchParams: Promise<{ status?: string; category?: string; turmaId?: string; preview?: string }>;
}

export default async function LessonsPage({ searchParams }: LessonsPageProps) {
  const { teacher } = await getTeacher();
  const filters = await searchParams;
  const preview = isPreviewMode(filters);
  const [lessons, turmasOptions] = await Promise.all([
    getLessons(teacher.id, filters),
    getTurmasForSelector(teacher.id),
  ]);

  if (preview) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title="Aulas"
          description="Acompanhe suas aulas e progresso"
        />

        {lessons.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Nenhuma aula disponível"
            description="Seu professor ainda não publicou aulas. Volte em breve!"
          />
        ) : (
          <div className="flex flex-col gap-3">
            {lessons.map((lesson, i) => (
              <DraftOverlay key={lesson.id} isDraft={lesson.status === "draft"}>
                <Link href={previewHref(`/teacher/lessons/${lesson.id}/edit`, filters)}>
                  <LessonCard
                    lesson={lesson}
                    progress={0}
                    index={i}
                  />
                </Link>
              </DraftOverlay>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Aulas"
        description="Gerencie suas aulas e conteúdos."
        action={
          <Link href="/teacher/lessons/new">
            <Button>
              <Plus size={16} />
              Nova Aula
            </Button>
          </Link>
        }
      />

      <LessonFilters turmas={turmasOptions} />

      <LessonList lessons={lessons} />
    </div>
  );
}
```

Note: The `LessonCard` component's default `Link` wrapper points to `/lessons/${id}` (student route). We override it by wrapping in our own `Link` that points to the teacher edit route with preview param. The `LessonCard` is already wrapped in a `Link` internally — we need to handle this. Actually, looking at the `LessonCard` code, it wraps its content in `<Link href={/lessons/${lesson.id}}>`. We can't nest Links. So we need to make the card linkable externally.

Let me adjust the approach: instead of wrapping `LessonCard` in a `Link`, we should add an optional `href` prop to `LessonCard`.

- [ ] **Step 1 (revised): Add optional `href` prop to LessonCard**

In `src/components/student/lesson-card.tsx`, change the interface and component to accept an optional `href` override:

Add `href?: string;` to the `LessonCardProps` interface and use it:

```typescript
interface LessonCardProps {
  lesson: {
    id: string;
    title: string;
    category: string;
    coverImageUrl?: string | null;
    durationMinutes?: number | null;
  };
  progress?: number;
  index?: number;
  href?: string;
}

export function LessonCard({ lesson, progress = 0, index = 0, href }: LessonCardProps) {
  return (
    <Link href={href ?? `/lessons/${lesson.id}`}>
```

- [ ] **Step 2: Add optional `href` prop to TaskCard**

In `src/components/student/task-card.tsx`, same pattern:

```typescript
interface TaskCardProps {
  task: {
    id: string;
    title: string;
    taskType: string;
    level: string;
    description?: string | null;
  };
  submission?: {
    score: number | null;
    status: string;
  };
  index?: number;
  href?: string;
}

export function TaskCard({ task, submission, index = 0, href }: TaskCardProps) {
```

And change the Link:

```typescript
  return (
    <Link href={href ?? `/tasks/${task.id}`}>
```

- [ ] **Step 3: Add optional `href` prop to PostCard**

In `src/components/student/post-card.tsx`, same pattern:

```typescript
interface PostCardProps {
  post: {
    id: string;
    title: string;
    slug: string;
    content: string | null;
    coverImageUrl: string | null;
    category: PostCategory;
    featured: boolean;
    createdAt: Date;
  };
  href?: string;
}

export function PostCard({ post, href }: PostCardProps) {
  return (
    <Link href={href ?? `/blog/${post.slug}`}>
```

- [ ] **Step 4: Now update the lessons page with the corrected approach**

Replace `src/app/teacher/lessons/page.tsx` (preview section uses `href` prop instead of wrapper Link):

```typescript
import Link from "next/link";
import { Plus, BookOpen } from "lucide-react";
import { getTeacher } from "@/lib/auth/get-teacher";
import { getLessons } from "@/lib/queries/lessons";
import { getTurmasForSelector } from "@/lib/queries/turmas";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LessonFilters } from "@/components/teacher/lesson-filters";
import { LessonList } from "@/components/teacher/lesson-list";
import { LessonCard } from "@/components/student/lesson-card";
import { DraftOverlay } from "@/components/teacher/draft-overlay";
import { isPreviewMode, previewHref } from "@/lib/utils/preview";

interface LessonsPageProps {
  searchParams: Promise<{ status?: string; category?: string; turmaId?: string; preview?: string }>;
}

export default async function LessonsPage({ searchParams }: LessonsPageProps) {
  const { teacher } = await getTeacher();
  const filters = await searchParams;
  const preview = isPreviewMode(filters);
  const [lessons, turmasOptions] = await Promise.all([
    getLessons(teacher.id, filters),
    getTurmasForSelector(teacher.id),
  ]);

  if (preview) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title="Aulas"
          description="Acompanhe suas aulas e progresso"
        />

        {lessons.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Nenhuma aula disponível"
            description="Seu professor ainda não publicou aulas. Volte em breve!"
          />
        ) : (
          <div className="flex flex-col gap-3">
            {lessons.map((lesson, i) => (
              <DraftOverlay key={lesson.id} isDraft={lesson.status === "draft"}>
                <LessonCard
                  lesson={lesson}
                  progress={0}
                  index={i}
                  href={previewHref(`/teacher/lessons/${lesson.id}/edit`, filters)}
                />
              </DraftOverlay>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Aulas"
        description="Gerencie suas aulas e conteúdos."
        action={
          <Link href="/teacher/lessons/new">
            <Button>
              <Plus size={16} />
              Nova Aula
            </Button>
          </Link>
        }
      />

      <LessonFilters turmas={turmasOptions} />

      <LessonList lessons={lessons} />
    </div>
  );
}
```

- [ ] **Step 5: Verify TypeScript is happy**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 6: Test in browser**

1. Go to `http://localhost:3001/teacher/lessons?preview=student`
2. Should see student-style cards (with cover images, category badges) instead of the management list
3. Draft lessons should appear with reduced opacity and "Não visível para alunos" badge
4. Clicking a card should navigate to `/teacher/lessons/[id]/edit?preview=student`

- [ ] **Step 7: Commit**

```bash
git add src/components/student/lesson-card.tsx src/components/student/task-card.tsx src/components/student/post-card.tsx src/components/teacher/draft-overlay.tsx src/app/teacher/lessons/page.tsx
git commit -m "feat(teacher): add student preview mode to lessons list page"
```

---

### Task 7: Add preview mode to teacher lesson detail page

**Files:**
- Modify: `src/app/teacher/lessons/[id]/edit/page.tsx`

When `?preview=student` is active, render `LessonPlayer` in read-only mode instead of `LessonForm`.

- [ ] **Step 1: Update the lesson edit page to support preview mode**

Replace `src/app/teacher/lessons/[id]/edit/page.tsx` with:

```typescript
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTeacher } from "@/lib/auth/get-teacher";
import { getLesson } from "@/lib/queries/lessons";
import { updateLesson } from "@/lib/actions/lessons";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { LessonForm } from "@/components/teacher/lesson-form";
import { LessonPlayer } from "@/components/student/lesson-player";
import { getTurmasForSelector, getLessonTurmaIds } from "@/lib/queries/turmas";
import { isPreviewMode, previewHref } from "@/lib/utils/preview";

interface EditLessonPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ preview?: string }>;
}

export default async function EditLessonPage({ params, searchParams }: EditLessonPageProps) {
  const { teacher } = await getTeacher();
  const { id } = await params;
  const sp = await searchParams;

  const lesson = await getLesson(id, teacher.id);
  if (!lesson) redirect("/teacher/lessons");

  if (isPreviewMode(sp)) {
    return (
      <div className="animate-fade-in max-w-2xl">
        <Link
          href={previewHref("/teacher/lessons", sp)}
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          Voltar para aulas
        </Link>

        {lesson.status === "draft" && (
          <div className="mb-4">
            <Badge variant="info">Não visível para alunos</Badge>
          </div>
        )}

        <LessonPlayer
          lesson={lesson}
          initialProgress={0}
          readOnly
        />
      </div>
    );
  }

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

- [ ] **Step 2: Add `readOnly` prop to LessonPlayer**

In `src/components/student/lesson-player.tsx`, update the interface and component:

```typescript
interface LessonPlayerProps {
  lesson: {
    id: string;
    title: string;
    content?: string | null;
    category: string;
    durationMinutes?: number | null;
  };
  initialProgress: number;
  readOnly?: boolean;
}

export function LessonPlayer({ lesson, initialProgress, readOnly }: LessonPlayerProps) {
```

And conditionally hide the "Mark as watched" button when `readOnly` is true. Replace the Button section:

```tsx
        {!readOnly && (
          <Button
            onClick={handleToggleWatched}
            loading={isPending}
            variant={progress >= 100 ? "success" : "primary"}
            size="sm"
            className="shrink-0"
          >
            <Check size={14} />
            {progress >= 100 ? "Assistida" : "Marcar como assistida"}
          </Button>
        )}
```

- [ ] **Step 3: Verify TypeScript is happy**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Test in browser**

1. Go to `http://localhost:3001/teacher/lessons?preview=student`
2. Click on a lesson card
3. Should see the LessonPlayer (read-only) with content rendered via BlockContent
4. "Marcar como assistida" button should NOT appear
5. Back link should go to `/teacher/lessons?preview=student`

- [ ] **Step 5: Commit**

```bash
git add src/app/teacher/lessons/[id]/edit/page.tsx src/components/student/lesson-player.tsx
git commit -m "feat(teacher): add student preview mode to lesson detail page"
```

---

### Task 8: Add preview mode to teacher tasks list page

**Files:**
- Modify: `src/app/teacher/tasks/page.tsx`

When `?preview=student` is active, render student `TaskCard` components in a grid instead of the teacher `TaskList`.

- [ ] **Step 1: Update the tasks page to support preview mode**

Replace `src/app/teacher/tasks/page.tsx` with:

```typescript
import Link from "next/link";
import { Plus, ClipboardList } from "lucide-react";
import { getTeacher } from "@/lib/auth/get-teacher";
import { getTasks } from "@/lib/queries/tasks";
import { getTurmasForSelector } from "@/lib/queries/turmas";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { TaskFilters } from "@/components/teacher/task-filters";
import { TaskList } from "@/components/teacher/task-list";
import { TaskCard } from "@/components/student/task-card";
import { DraftOverlay } from "@/components/teacher/draft-overlay";
import { isPreviewMode, previewHref } from "@/lib/utils/preview";

interface TasksPageProps {
  searchParams: Promise<{ status?: string; taskType?: string; turmaId?: string; preview?: string }>;
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const { teacher } = await getTeacher();
  const filters = await searchParams;
  const preview = isPreviewMode(filters);
  const [tasks, turmasOptions] = await Promise.all([
    getTasks(teacher.id, filters),
    getTurmasForSelector(teacher.id),
  ]);

  if (preview) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title="Tarefas"
          description="Complete as atividades do seu professor"
        />

        {tasks.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="Nenhuma tarefa disponível"
            description="Seu professor ainda não publicou tarefas. Volte em breve!"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {tasks.map((task, i) => (
              <DraftOverlay key={task.id} isDraft={task.status === "draft"}>
                <TaskCard
                  task={task}
                  index={i}
                  href={previewHref(`/teacher/tasks/${task.id}/edit`, filters)}
                />
              </DraftOverlay>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Tarefas"
        description="Gerencie suas tarefas e exercicios."
        action={
          <Link href="/teacher/tasks/new">
            <Button>
              <Plus size={16} />
              Nova Tarefa
            </Button>
          </Link>
        }
      />

      <TaskFilters turmas={turmasOptions} />

      <TaskList tasks={tasks} />
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript is happy**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/teacher/tasks/page.tsx
git commit -m "feat(teacher): add student preview mode to tasks list page"
```

---

### Task 9: Add `readOnly` prop to task player components

**Files:**
- Modify: `src/components/student/quiz-player.tsx`
- Modify: `src/components/student/listening-player.tsx`
- Modify: `src/components/student/fill-gaps-player.tsx`
- Modify: `src/components/student/writing-player.tsx`

Add a `readOnly` prop to each player. When `true`, render the questions/prompts with all inputs disabled and no submit button — replaced by an info badge.

- [ ] **Step 1: Add `readOnly` to QuizPlayer**

In `src/components/student/quiz-player.tsx`, update the interface:

```typescript
interface QuizPlayerProps {
  questions: QuizQuestion[];
  taskId: string;
  existingSubmission?: {
    answers: string | null;
    score: number | null;
    feedback: string | null;
    status: string;
  };
  readOnly?: boolean;
}
```

Update the component signature:

```typescript
export function QuizPlayer({
  questions,
  taskId,
  existingSubmission,
  readOnly,
}: QuizPlayerProps) {
```

Add a read-only render path right after the `existingSubmission` block (after line 108, before the `if (finished)` block). Insert:

```typescript
  // Read-only preview mode for teachers
  if (readOnly) {
    return (
      <div className="space-y-4">
        {questions.map((q) => (
          <Card key={q.number}>
            <CardContent>
              <p className="font-medium text-text-primary mb-3">
                {q.number}. {q.text}
              </p>
              <div className="space-y-2">
                {q.options.map((opt) => (
                  <div
                    key={opt.letter}
                    className="px-4 py-2.5 rounded-[var(--radius-sm)] border border-border text-sm text-text-secondary"
                  >
                    <span className="font-medium mr-2">{opt.letter})</span>
                    {opt.text}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
        <div className="flex justify-center">
          <Badge variant="info" className="text-sm px-4 py-1.5">
            Modo preview — interação desabilitada
          </Badge>
        </div>
      </div>
    );
  }
```

Add the `Badge` import at the top of the file:

```typescript
import { Badge } from "@/components/ui/badge";
```

- [ ] **Step 2: Add `readOnly` to ListeningPlayer**

In `src/components/student/listening-player.tsx`, update the interface:

```typescript
interface ListeningPlayerProps {
  task: {
    id: string;
    questions?: string | null;
  };
  existingSubmission?: {
    answers: string | null;
    score: number | null;
    feedback: string | null;
    status: string;
  };
  readOnly?: boolean;
}
```

Update the component signature:

```typescript
export function ListeningPlayer({
  task,
  existingSubmission,
  readOnly,
}: ListeningPlayerProps) {
```

Add a read-only render path after the `existingSubmission` block (after line 138, before the "No audio and no questions" block). Insert:

```typescript
  // Read-only preview mode for teachers
  if (readOnly) {
    return (
      <div className="space-y-6">
        {audioUrl && (
          <Card>
            <CardContent>
              <AudioSection audioUrl={audioUrl} text={parsed.text} />
            </CardContent>
          </Card>
        )}
        {questions.length > 0 && (
          <div className="space-y-4">
            {questions.map((q) => (
              <Card key={q.number}>
                <CardContent>
                  <p className="font-medium text-text-primary mb-3">
                    {q.number}. {q.text}
                  </p>
                  <div className="space-y-2">
                    {q.options.map((opt) => (
                      <div
                        key={opt.letter}
                        className="px-4 py-2.5 rounded-[var(--radius-sm)] border border-border text-sm text-text-secondary"
                      >
                        <span className="font-medium mr-2">{opt.letter})</span>
                        {opt.text}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        <div className="flex justify-center">
          <Badge variant="info" className="text-sm px-4 py-1.5">
            Modo preview — interação desabilitada
          </Badge>
        </div>
      </div>
    );
  }
```

Add the `Badge` import:

```typescript
import { Badge } from "@/components/ui/badge";
```

- [ ] **Step 3: Add `readOnly` to FillGapsPlayer**

In `src/components/student/fill-gaps-player.tsx`, update the interface:

```typescript
interface FillGapsPlayerProps {
  questions: FillGapQuestion[];
  taskId: string;
  existingSubmission?: {
    answers: string | null;
    score: number | null;
    feedback: string | null;
    status: string;
  };
  readOnly?: boolean;
}
```

Update the component signature:

```typescript
export function FillGapsPlayer({
  questions,
  taskId,
  existingSubmission,
  readOnly,
}: FillGapsPlayerProps) {
```

Add a read-only render path after the `existingSubmission` block (after line 99, before the "Submitted screen" block). Insert:

```typescript
  // Read-only preview mode for teachers
  if (readOnly) {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          {questions.map((q) => (
            <Card key={q.number}>
              <CardContent>
                <div className="flex items-start gap-3">
                  <span className="text-xs font-medium text-text-muted mt-1 shrink-0">
                    {q.number}.
                  </span>
                  <div className="flex-1 space-y-2">
                    <p className="text-text-primary">{q.text}</p>
                    <input
                      type="text"
                      disabled
                      placeholder="Resposta do aluno..."
                      className="px-3 py-2 rounded-[var(--radius-sm)] bg-input-bg border border-border text-sm text-text-muted w-48 cursor-not-allowed"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex justify-center">
          <Badge variant="info" className="text-sm px-4 py-1.5">
            Modo preview — interação desabilitada
          </Badge>
        </div>
      </div>
    );
  }
```

Add the `Badge` import:

```typescript
import { Badge } from "@/components/ui/badge";
```

- [ ] **Step 4: Add `readOnly` to WritingPlayer**

In `src/components/student/writing-player.tsx`, update the interface:

```typescript
interface WritingPlayerProps {
  task: {
    id: string;
    title: string;
    description?: string | null;
    questions?: string | null;
  };
  existingSubmission?: {
    answers: string | null;
    score: number | null;
    feedback: string | null;
    status: string;
  };
  readOnly?: boolean;
}
```

Update the component signature:

```typescript
export function WritingPlayer({ task, existingSubmission, readOnly }: WritingPlayerProps) {
```

Add a read-only render path after the `existingSubmission` block (after line 115, before the "Submitted confirmation" block). Insert:

```typescript
  // Read-only preview mode for teachers
  if (readOnly) {
    const prompt = task.questions ? JSON.parse(task.questions) : null;

    return (
      <div className="space-y-6">
        {(prompt || task.description) && (
          <Card>
            <CardContent>
              <h3 className="font-medium text-text-primary mb-2">Instruções</h3>
              {prompt?.prompt && (
                <p className="text-sm text-text-primary whitespace-pre-wrap">
                  {prompt.prompt}
                </p>
              )}
              {prompt?.instructions && (
                <p className="text-sm text-text-secondary mt-2 whitespace-pre-wrap">
                  {prompt.instructions}
                </p>
              )}
              {!prompt && task.description && (
                <p className="text-sm text-text-primary whitespace-pre-wrap">
                  {task.description}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <Textarea
          label="Sua redação"
          rows={6}
          disabled
          placeholder="Área de escrita do aluno..."
        />

        <div className="flex justify-center">
          <Badge variant="info" className="text-sm px-4 py-1.5">
            Modo preview — interação desabilitada
          </Badge>
        </div>
      </div>
    );
  }
```

Add the `Badge` import:

```typescript
import { Badge } from "@/components/ui/badge";
```

Note: The `readOnly` block in WritingPlayer needs to be placed before the existing `const prompt` declaration on line 34, because it duplicates that logic. Move the read-only check to right after the `existingSubmission` early return (line 115), and include its own `prompt` parsing.

- [ ] **Step 5: Verify TypeScript is happy**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/student/quiz-player.tsx src/components/student/listening-player.tsx src/components/student/fill-gaps-player.tsx src/components/student/writing-player.tsx
git commit -m "feat(student): add readOnly prop to all task player components"
```

---

### Task 10: Add preview mode to teacher task detail page

**Files:**
- Modify: `src/app/teacher/tasks/[id]/edit/page.tsx`

When `?preview=student` is active, render the appropriate task player instead of `TaskForm`.

- [ ] **Step 1: Update the task edit page to support preview mode**

Replace `src/app/teacher/tasks/[id]/edit/page.tsx` with:

```typescript
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTeacher } from "@/lib/auth/get-teacher";
import { getTask } from "@/lib/queries/tasks";
import { updateTask } from "@/lib/actions/tasks";
import { PageHeader } from "@/components/ui/page-header";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { TaskForm } from "@/components/teacher/task-form";
import { QuizPlayer } from "@/components/student/quiz-player";
import { FillGapsPlayer } from "@/components/student/fill-gaps-player";
import { WritingPlayer } from "@/components/student/writing-player";
import { ListeningPlayer } from "@/components/student/listening-player";
import { getTurmasForSelector, getTaskTurmaIds } from "@/lib/queries/turmas";
import { isPreviewMode, previewHref } from "@/lib/utils/preview";
import type { QuizQuestion, FillGapQuestion } from "@/lib/validations/tasks";

const levelLabels: Record<string, string> = {
  beginner: "Iniciante",
  intermediate: "Intermediário",
  advanced: "Avançado",
};

const typeLabels: Record<string, string> = {
  quiz: "Quiz",
  listening: "Listening",
  fill_gaps: "Preencher Lacunas",
  writing: "Redação",
};

interface EditTaskPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ preview?: string }>;
}

export default async function EditTaskPage({ params, searchParams }: EditTaskPageProps) {
  const { teacher } = await getTeacher();
  const { id } = await params;
  const sp = await searchParams;

  const task = await getTask(id, teacher.id);
  if (!task) redirect("/teacher/tasks");

  if (isPreviewMode(sp)) {
    return (
      <div className="animate-fade-in max-w-2xl mx-auto">
        <Link
          href={previewHref("/teacher/tasks", sp)}
          className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-primary transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          Voltar para tarefas
        </Link>

        {task.status === "draft" && (
          <div className="mb-4">
            <Badge variant="info">Não visível para alunos</Badge>
          </div>
        )}

        {/* Task header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={(task.level as BadgeVariant) || "default"}>
              {levelLabels[task.level] || task.level}
            </Badge>
            <Badge variant="default">
              {typeLabels[task.taskType] || task.taskType}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold text-text-primary font-display">
            {task.title}
          </h1>
          {task.description && (
            <p className="text-text-secondary mt-1">{task.description}</p>
          )}
        </div>

        {/* Player based on task type */}
        {task.taskType === "quiz" && (
          <QuizPlayer
            questions={
              task.questions
                ? (JSON.parse(task.questions) as QuizQuestion[])
                : []
            }
            taskId={task.id}
            readOnly
          />
        )}

        {task.taskType === "fill_gaps" && (
          <FillGapsPlayer
            questions={
              task.questions
                ? (JSON.parse(task.questions) as FillGapQuestion[])
                : []
            }
            taskId={task.id}
            readOnly
          />
        )}

        {task.taskType === "writing" && (
          <WritingPlayer task={task} readOnly />
        )}

        {task.taskType === "listening" && (
          <ListeningPlayer task={task} readOnly />
        )}
      </div>
    );
  }

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

- [ ] **Step 2: Verify TypeScript is happy**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Test in browser**

1. Go to `http://localhost:3001/teacher/tasks?preview=student`
2. Click on a quiz task — should see questions with disabled option buttons and "Modo preview" badge
3. Click on a fill_gaps task — should see fill-in-the-blank inputs disabled
4. Back link should go to `/teacher/tasks?preview=student`

- [ ] **Step 4: Commit**

```bash
git add src/app/teacher/tasks/[id]/edit/page.tsx
git commit -m "feat(teacher): add student preview mode to task detail page"
```

---

### Task 11: Add preview mode to teacher posts list page

**Files:**
- Modify: `src/app/teacher/posts/page.tsx`

When `?preview=student` is active, render student `PostCard` components in a grid.

- [ ] **Step 1: Update the posts page to support preview mode**

Replace `src/app/teacher/posts/page.tsx` with:

```typescript
import Link from "next/link";
import { Plus, FileText } from "lucide-react";
import { getTeacher } from "@/lib/auth/get-teacher";
import { getPosts } from "@/lib/queries/posts";
import { getTurmasForSelector } from "@/lib/queries/turmas";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PostFilters } from "@/components/teacher/post-filters";
import { PostList } from "@/components/teacher/post-list";
import { PostCard } from "@/components/student/post-card";
import { DraftOverlay } from "@/components/teacher/draft-overlay";
import { isPreviewMode, previewHref } from "@/lib/utils/preview";

interface PostsPageProps {
  searchParams: Promise<{ status?: string; category?: string; turmaId?: string; preview?: string }>;
}

export default async function PostsPage({ searchParams }: PostsPageProps) {
  const { teacher } = await getTeacher();
  const filters = await searchParams;
  const preview = isPreviewMode(filters);
  const [posts, turmasOptions] = await Promise.all([
    getPosts(teacher.id, filters),
    getTurmasForSelector(teacher.id),
  ]);

  if (preview) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title="Blog"
          description="Dicas, gramática e cultura"
        />

        {posts.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Nenhum post disponível"
            description="Seu professor ainda não publicou posts. Volte em breve!"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {posts.map((post) => (
              <DraftOverlay key={post.id} isDraft={post.status === "draft"}>
                <PostCard
                  post={post}
                  href={previewHref(`/teacher/posts/${post.id}/edit`, filters)}
                />
              </DraftOverlay>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Posts"
        description="Gerencie seus posts e conteúdos do blog."
        action={
          <Link href="/teacher/posts/new">
            <Button>
              <Plus size={16} />
              Novo Post
            </Button>
          </Link>
        }
      />

      <PostFilters turmas={turmasOptions} />

      <PostList posts={posts} />
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript is happy**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/teacher/posts/page.tsx
git commit -m "feat(teacher): add student preview mode to posts list page"
```

---

### Task 12: Add preview mode to teacher post detail page

**Files:**
- Modify: `src/app/teacher/posts/[id]/edit/page.tsx`

When `?preview=student` is active, render the blog post as the student sees it.

- [ ] **Step 1: Update the post edit page to support preview mode**

Replace `src/app/teacher/posts/[id]/edit/page.tsx` with:

```typescript
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTeacher } from "@/lib/auth/get-teacher";
import { getPost } from "@/lib/queries/posts";
import { updatePost } from "@/lib/actions/posts";
import { PageHeader } from "@/components/ui/page-header";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { PostForm } from "@/components/teacher/post-form";
import { BlockContent } from "@/components/ui/block-content";
import { getTurmasForSelector, getPostTurmaIds } from "@/lib/queries/turmas";
import { isPreviewMode, previewHref } from "@/lib/utils/preview";

const categoryLabels: Record<string, string> = {
  tips: "Dicas",
  grammar: "Gramática",
  culture: "Cultura",
  vocabulary: "Vocabulário",
};

const categoryBadgeVariant: Record<string, BadgeVariant> = {
  tips: "tarefas",
  grammar: "aulas",
  culture: "fora",
  vocabulary: "challenges",
};

interface EditPostPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ preview?: string }>;
}

export default async function EditPostPage({ params, searchParams }: EditPostPageProps) {
  const { teacher } = await getTeacher();
  const { id } = await params;
  const sp = await searchParams;

  const post = await getPost(id, teacher.id);
  if (!post) redirect("/teacher/posts");

  if (isPreviewMode(sp)) {
    return (
      <div className="animate-fade-in">
        <Link
          href={previewHref("/teacher/posts", sp)}
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          Voltar para o blog
        </Link>

        {post.status === "draft" && (
          <div className="mb-4">
            <Badge variant="info">Não visível para alunos</Badge>
          </div>
        )}

        <article className="max-w-2xl">
          {post.coverImageUrl && (
            <div className="relative w-full max-h-80 aspect-video mb-6 rounded-[var(--radius-md)] overflow-hidden">
              <Image
                src={post.coverImageUrl}
                alt={post.title}
                fill
                unoptimized
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 672px"
              />
            </div>
          )}

          <div className="flex items-center gap-2 mb-3">
            <Badge variant={categoryBadgeVariant[post.category]}>
              {categoryLabels[post.category]}
            </Badge>
            <span className="text-xs text-text-muted">
              {post.createdAt.toLocaleDateString("pt-BR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>

          <h1 className="text-2xl font-bold text-text-primary font-display mb-6">
            {post.title}
          </h1>

          {post.content && <BlockContent content={post.content} />}
        </article>
      </div>
    );
  }

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

- [ ] **Step 2: Verify TypeScript is happy**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Test in browser**

1. Go to `http://localhost:3001/teacher/posts?preview=student`
2. Should see student-style post cards with cover images and excerpts
3. Click on a post — should see the full blog post rendered with cover, category badge, date, and content
4. Back link should go to `/teacher/posts?preview=student`

- [ ] **Step 4: Commit**

```bash
git add src/app/teacher/posts/[id]/edit/page.tsx
git commit -m "feat(teacher): add student preview mode to post detail page"
```

---

### Task 13: Propagate preview param in Sidebar navigation

**Files:**
- Modify: `src/components/shared/sidebar.tsx`

When the `?preview=student` param is active, the sidebar links for Aulas, Tarefas, and Posts should carry it. Other sections don't — clicking them exits preview.

- [ ] **Step 1: Update Sidebar to read and propagate preview param**

In `src/components/shared/sidebar.tsx`, import `useSearchParams` and add preview-aware href logic:

```typescript
"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  FileText,
  Users,
  GraduationCap,
  Home,
  LogOut,
} from "lucide-react";
import { signOut } from "@/lib/auth/client";
import { NavLinkPending } from "@/components/shared/nav-progress";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number }>;
  color?: string;
};

const teacherNav: NavItem[] = [
  { label: "Dashboard", href: "/teacher/dashboard", icon: LayoutDashboard },
  { label: "Aulas", href: "/teacher/lessons", icon: BookOpen, color: "aulas" },
  { label: "Tarefas", href: "/teacher/tasks", icon: ClipboardList, color: "tarefas" },
  { label: "Posts", href: "/teacher/posts", icon: FileText, color: "fora" },
  { label: "Turmas", href: "/teacher/turmas", icon: Users },
  { label: "Alunos", href: "/teacher/students", icon: GraduationCap },
];

const PREVIEW_PAGES = new Set(["/teacher/lessons", "/teacher/tasks", "/teacher/posts"]);

const studentNav: NavItem[] = [
  { label: "Home", href: "/home", icon: Home },
  { label: "Aulas", href: "/lessons", icon: BookOpen, color: "aulas" },
  { label: "Tarefas", href: "/tasks", icon: ClipboardList, color: "tarefas" },
  { label: "Blog", href: "/blog", icon: FileText, color: "fora" },
  { label: "Turmas", href: "/turmas", icon: Users },
];

type SidebarProps = {
  role: "teacher" | "student";
  userName: string;
};

export function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const items = role === "teacher" ? teacherNav : studentNav;
  const isPreview = searchParams.get("preview") === "student";

  function getHref(item: NavItem): string {
    if (isPreview && PREVIEW_PAGES.has(item.href)) {
      return `${item.href}?preview=student`;
    }
    return item.href;
  }

  async function handleSignOut() {
    await signOut();
    router.push("/sign-in");
  }

  return (
    <aside className="hidden md:flex flex-col w-48 lg:w-60 bg-bg-dark text-white min-h-screen">
      {/* Logo */}
      <div className="px-6 py-6">
        <span className="text-xl font-bold font-display">Fluent</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {items.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={getHref(item)}
              prefetch={false}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-sm)] text-sm transition-colors relative ${
                isActive
                  ? "bg-white/10 text-white"
                  : "text-sidebar-muted hover:text-white hover:bg-white/5"
              }`}
            >
              {isActive && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                  style={{
                    backgroundColor: item.color
                      ? `var(--color-${item.color})`
                      : "#ffffff",
                  }}
                />
              )}
              <Icon size={18} />
              {item.label}
              <NavLinkPending />
            </Link>
          );
        })}
      </nav>

      {/* User / Sign Out */}
      <div className="border-t border-white/10 px-6 py-4 flex items-center gap-3">
        {role === "student" ? (
          <Link
            href="/profile"
            className="text-sm text-white/80 truncate flex-1 min-w-0 hover:text-white transition-colors"
          >
            {userName}
          </Link>
        ) : (
          <span className="text-sm text-white/80 truncate flex-1 min-w-0">
            {userName}
          </span>
        )}
        <button
          onClick={handleSignOut}
          className="text-sidebar-muted hover:text-white transition-colors cursor-pointer"
          aria-label="Sign out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Verify TypeScript is happy**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Test in browser**

1. Activate preview: `http://localhost:3001/teacher/lessons?preview=student`
2. Click "Tarefas" in sidebar — should go to `/teacher/tasks?preview=student`
3. Click "Posts" in sidebar — should go to `/teacher/posts?preview=student`
4. Click "Dashboard" in sidebar — should go to `/teacher/dashboard` (no preview param)
5. Click "Turmas" — should go to `/teacher/turmas` (no preview param)

- [ ] **Step 4: Commit**

```bash
git add src/components/shared/sidebar.tsx
git commit -m "feat(shared): propagate preview param in sidebar navigation"
```

---

### Task 14: Final integration test

No new files. End-to-end walkthrough to verify everything works together.

- [ ] **Step 1: Full flow test**

1. Start dev server: `npm run dev -- --port 3001`
2. Sign in as teacher (`fran@fluent.app` / `senha12345`)
3. Go to `/teacher/lessons` — normal management view
4. Click "Ver como aluno" — URL changes to `?preview=student`, banner appears, cards switch to student style
5. Click a lesson card — opens lesson player (read-only, no "Marcar como assistida" button)
6. Click "Voltar para aulas" — returns to student-preview list
7. Click "Tarefas" in sidebar — goes to `/teacher/tasks?preview=student` with student-style grid
8. Click a task — opens appropriate player with disabled inputs and "Modo preview" badge
9. Click "Posts" in sidebar — goes to `/teacher/posts?preview=student` with student-style grid
10. Click a post — opens full blog post view with cover, content
11. Click "Dashboard" in sidebar — exits preview mode (no param)
12. Click "Sair do preview" from banner — exits preview mode

- [ ] **Step 2: Verify draft indicator**

1. Create or find a draft lesson
2. In preview mode, it should appear with reduced opacity and "Não visível para alunos" badge
3. Clicking it should show the lesson player with the same badge at the top

- [ ] **Step 3: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Final commit (merge commit)**

```bash
git add -A
git commit -m "feat(teacher): add student preview mode for lessons, tasks, and posts

Teachers can toggle a 'Ver como aluno' mode that renders their content
using the student-facing components (LessonCard, TaskCard, PostCard,
LessonPlayer, task players) within the teacher layout. Drafts appear
with reduced opacity and an indicator badge. Task players are read-only
with all inputs disabled. Preview param (?preview=student) propagates
through sidebar navigation."
```
