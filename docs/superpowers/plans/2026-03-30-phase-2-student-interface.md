# Phase 2: Student Interface — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Student can view lessons, complete all exercise types (quiz, fill-gaps, writing, listening), read blog, join turmas, and track progress. Full student experience with parity to the Rails app.

**Architecture:** Server Components for data fetching, Server Actions for mutations (submit answers, update progress, join turma). Student sees only content from their teacher, scoped through turma membership or direct teacher link.

**Tech Stack:** Next.js 16 App Router, Drizzle ORM, Cloudflare D1, Tailwind CSS v4, Lucide React, Zod

---

### Task 1: Student Auth Helper + Queries

**Files:**
- Create: `src/lib/auth/get-student.ts`
- Create: `src/lib/queries/student-home.ts`
- Create: `src/lib/queries/student-lessons.ts`
- Create: `src/lib/queries/student-tasks.ts`
- Create: `src/lib/queries/student-blog.ts`
- Create: `src/lib/queries/student-turmas.ts`

Reusable `getStudent()` helper (same pattern as getTeacher) that returns `{ user, student }`.

All queries scope data to the student's teacher. A student sees published content from their teacher.

- [ ] Implement getStudent helper and all student query modules
- [ ] Commit

---

### Task 2: Student Home Dashboard

**Files:**
- Modify: `src/app/(student)/home/page.tsx`
- Create: `src/components/student/progress-ring.tsx`
- Create: `src/components/student/channel-card.tsx`
- Create: `src/components/student/activity-feed.tsx`

Home shows: greeting, progress ring (SVG), 4 channel cards with counters, recent activity feed.

- [ ] Create progress ring SVG component
- [ ] Create channel cards (Aulas/Tarefas/Blog/Challenges)
- [ ] Create activity feed (recent submissions, lessons watched)
- [ ] Update home page with real data
- [ ] Commit

---

### Task 3: Lessons Timeline + Detail

**Files:**
- Create: `src/app/(student)/lessons/page.tsx`
- Create: `src/app/(student)/lessons/[id]/page.tsx`
- Create: `src/components/student/lesson-card.tsx`
- Create: `src/components/student/lesson-player.tsx`
- Create: `src/lib/actions/student-progress.ts`

Timeline of published lessons with progress indicators. Detail page with video embed, description, materials, progress tracking.

- [ ] Create lesson card and timeline components
- [ ] Create lesson detail/player page
- [ ] Create updateLessonProgress server action
- [ ] Commit

---

### Task 4: Tasks Grid + Exercise Players

**Files:**
- Create: `src/app/(student)/tasks/page.tsx`
- Create: `src/app/(student)/tasks/[id]/page.tsx`
- Create: `src/components/student/task-card.tsx`
- Create: `src/components/student/quiz-player.tsx`
- Create: `src/components/student/fill-gaps-player.tsx`
- Create: `src/components/student/writing-player.tsx`
- Create: `src/components/student/listening-player.tsx`
- Create: `src/lib/actions/student-submissions.ts`

Task grid with status (available/done). Exercise players per type. Submit answers server action with auto-grading for quiz/fill-gaps.

- [ ] Create task card and grid components
- [ ] Create quiz player (question-by-question, instant feedback)
- [ ] Create fill-gaps, writing, and listening players
- [ ] Create submitAnswers server action with auto-grading
- [ ] Commit

---

### Task 5: Blog (Posts View)

**Files:**
- Create: `src/app/(student)/blog/page.tsx`
- Create: `src/app/(student)/blog/[slug]/page.tsx`
- Create: `src/components/student/post-card.tsx`
- Create: `src/lib/actions/student-posts.ts`

Published posts from teacher. Category filters. Detail with markdown rendered. View count increment.

- [ ] Create post card and list page
- [ ] Create post detail with markdown rendering
- [ ] Create incrementViewCount action
- [ ] Commit

---

### Task 6: Turmas (Join + View)

**Files:**
- Create: `src/app/(student)/turmas/page.tsx`
- Create: `src/app/(student)/turmas/join/page.tsx`
- Create: `src/components/student/turma-card.tsx`
- Create: `src/lib/actions/student-turmas.ts`

List enrolled turmas. Join via invite code. View linked lessons/tasks per turma.

- [ ] Create turma card and list page
- [ ] Create join page with invite code input
- [ ] Create joinTurma server action
- [ ] Commit

---

## Summary

| Task | What it delivers |
|------|-----------------|
| 1 | Student auth helper + all data queries |
| 2 | Home dashboard (progress ring, channel cards, activity) |
| 3 | Lessons timeline + detail/player + progress tracking |
| 4 | Tasks grid + quiz/fill-gaps/writing/listening players + auto-grading |
| 5 | Blog post list + detail with markdown |
| 6 | Turmas list + join via invite code |

**Exit criteria**: Student can view all teacher content, complete exercises with instant feedback, track progress, read blog, join classes.
