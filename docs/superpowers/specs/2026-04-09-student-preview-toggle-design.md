# Student Preview Toggle — Design Spec

**Date:** 2026-04-09
**Status:** Draft

## Problem

Teachers create lessons, tasks, and posts but have no way to see how students experience their content. They must publish and switch accounts (or ask a student) to verify how things look.

## Solution

A "preview as student" toggle on teacher pages that swaps the rendering from edit/management views to student-facing views, all within the teacher layout.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Layout | Teacher layout stays (sidebar, nav); only content area changes | Professor never "gets lost", can toggle off instantly |
| Scope | Lessons, Tasks, Posts (list + detail) | These are the 3 content types students consume. Dashboard/Turmas excluded — different contexts |
| State mechanism | Query param `?preview=student` | Works with Server Components, shareable URL, visible state indicator |
| Draft visibility | Shown with reduced opacity + "Não visível para alunos" badge | Lets teacher preview unpublished work without needing to publish first |
| Task interaction | Read-only (inputs disabled, no submit) | MVP scope — value is "see how it looks", not "test the mechanics" |

## Components

### 1. `PreviewToggle` (client component)

- **Location:** Teacher layout, top of content area (below header, above page content)
- **When off:** Subtle button with Eye icon + "Ver como aluno"
- **When on:** Active state with highlighted appearance
- **Behavior:** `router.push` adding/removing `?preview=student` to current URL, preserving other params
- **Reads:** `useSearchParams()` to determine current state
- **Uses:** DS `Button` component with `ghost` variant (off) / `info`-styled active state

### 2. `PreviewBanner` (client component)

- **Location:** Fixed bar at top of content area when preview is active
- **Content:** Eye icon + "Visualizando como aluno" + "Sair do preview" button
- **Style:** DS `info` color tokens (`bg-info/10`, `text-info`, `border-info/20`)
- **Escape:** Button removes `?preview=student` from URL

### 3. `previewHref(path, searchParams)` helper

- Utility function: if `searchParams` contains `preview=student`, appends it to the destination path
- Used in: card links, sidebar hrefs, back buttons

### 4. `readOnly` prop on student players

- Added to: `QuizPlayer`, `ListeningPlayer`, `FillGapsPlayer`, `WritingPlayer`
- When `true`: all inputs get `disabled`, submit button replaced with info `Badge` "Modo preview — interação desabilitada"
- Audio playback in `ListeningPlayer` stays functional (teacher can hear what student hears)

## Page Behavior Matrix

### Lists (toggle ON)

| Teacher Page | Renders Instead | Layout |
|-------------|----------------|--------|
| `/teacher/lessons?preview=student` | `LessonCard` components (student card with cover, progress bar, category) | Flex column (same as student lessons page) |
| `/teacher/tasks?preview=student` | `TaskCard` components (student grid with type icon, level, status) | 3-column grid (same as student tasks page) |
| `/teacher/posts?preview=student` | `PostCard` components (student grid with cover, excerpt, date) | 2-column grid (same as student blog page) |

### Detail Pages (toggle ON)

| Teacher Page | Renders Instead | Notes |
|-------------|----------------|-------|
| `/teacher/lessons/[id]?preview=student` | `LessonPlayer` (title, category badge, duration, BlockContent) | Read-only content viewer |
| `/teacher/tasks/[id]?preview=student` | Type-specific player (QuizPlayer/ListeningPlayer/etc.) | `readOnly={true}`, inputs disabled |
| `/teacher/posts/[id]?preview=student` | Student blog post view (cover, category, content via BlockContent) | Read-only |

### Draft Indicators

When a draft item appears in preview mode:
- List card: `opacity-60` + `Badge` variant `info` with text "Não visível para alunos"
- Detail page: Same badge at the top of the content, before the player/viewer

## Data Flow

No new queries needed. Teacher pages already fetch all content (including drafts). Only the rendering layer changes:

```
Teacher page (Server Component)
  → reads searchParams.preview
  → fetches data with existing teacher queries
  → if preview === "student": renders student components with teacher data
  → if draft: adds visual indicator
```

## Sidebar Integration

The `Sidebar` component receives the current `searchParams`. For the 3 affected sections (Aulas, Tarefas, Posts), hrefs include `?preview=student` when active. Other sections (Dashboard, Turmas, Alunos) don't — clicking them naturally exits preview mode.

## Files to Create

- `src/components/teacher/preview-toggle.tsx` — Toggle button + banner (single client component)
- `src/lib/utils/preview.ts` — `isPreview(searchParams)` + `previewHref(path, searchParams)` helpers

## Files to Modify

- `src/app/teacher/layout.tsx` — Add `PreviewToggle` to layout
- `src/app/teacher/lessons/page.tsx` — Branch rendering based on preview param
- `src/app/teacher/lessons/[id]/edit/page.tsx` — Branch to `LessonPlayer` in preview
- `src/app/teacher/tasks/page.tsx` — Branch rendering based on preview param
- `src/app/teacher/tasks/[id]/edit/page.tsx` — Branch to task player in preview
- `src/app/teacher/posts/page.tsx` — Branch rendering based on preview param
- `src/app/teacher/posts/[id]/edit/page.tsx` — Branch to post viewer in preview
- `src/components/shared/sidebar.tsx` — Propagate preview param in hrefs
- `src/components/student/quiz-player.tsx` — Add `readOnly` prop
- `src/components/student/listening-player.tsx` — Add `readOnly` prop
- `src/components/student/fill-gaps-player.tsx` — Add `readOnly` prop
- `src/components/student/writing-player.tsx` — Add `readOnly` prop

## Out of Scope

- Interactive task submission (dry-run mode) — can be added later
- Dashboard preview (student home)
- Turmas preview
- Preview for specific student (e.g., "see as Maria" with her progress data)
