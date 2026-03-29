# Implementation Phases

## Scope

Rewrite of the Fluent platform from Rails 8 to Next.js on Cloudflare Workers. Target: **feature parity with the existing Rails app** (Phases 0-2 complete).

## Phase 0: Foundation

**Goal**: Project setup, infrastructure, auth working end-to-end.

- Initialize Next.js 15 project with App Router
- Configure @opennextjs/cloudflare + wrangler
- Set up Tailwind v4 with DS tokens (globals.css @theme)
- Configure Drizzle ORM + D1 schema + initial migration
- Set up better-auth (email/password, sessions, role-based)
- Implement middleware (auth check + role routing)
- Create root layout (fonts: Bricolage, Outfit, JetBrains Mono)
- Create 3 route group layouts: (auth), (student), (teacher)
- Auth pages: sign-in, sign-up (split screen layout from DS)
- Student invite flow: teacher sends email → student accepts
- R2 bucket setup + presigned URL endpoint
- Resend email integration (invites, password reset)
- Deploy to Cloudflare Workers (first deploy)

**Exit criteria**: Teacher can sign up, invite a student, student can accept and sign in. Deploys to Cloudflare.

## Phase 1: Teacher CMS

**Goal**: Teacher can manage all content.

- UI primitives: Button, Input, Card, Badge, Avatar, Select, Modal, Tabs
- Sidebar navigation component (desktop 240px + responsive)
- Dashboard: KPI cards, activity chart, recent submissions, alerts, quick actions
- Lessons CRUD: list, create/edit form, file uploads (cover, video URL, audio, docs), publish/unpublish
- Tasks CRUD: type selection, question editor (dynamic fields per type), preview, publish/unpublish
- Posts CRUD: markdown editor + preview, slug generation, publish/unpublish
- Turmas CRUD: create, detail with tabs (members, linked content, settings), invite code
- Students: list, invite, profile view
- "New Content" modal (Cmd+N shortcut)

**Exit criteria**: Teacher can create and manage lessons, tasks, posts, and classes. Can invite and manage students.

## Phase 2: Student Interface

**Goal**: Student can consume all content and complete exercises.

- Student sidebar + mobile bottom navigation
- Home dashboard: greeting, progress ring, channel cards, activity feed
- Lessons timeline: ordered cards, category filters, progress indicators
- Lesson detail/player: video embed, description, materials, progress tracking
- Tasks grid: active/pending/done states, type/level badges
- Quiz player: question-by-question, instant feedback, score
- Fill-the-gaps player: inline input, validation
- Writing submission: textarea, word counter, submit
- Listening player: audio playback, comprehension questions
- Blog: post list with filters, post detail with markdown rendering
- Turmas: my classes, join via invite code
- Submissions history per task

**Exit criteria**: Student can view lessons, complete all exercise types, read blog, join classes. Full exercise flow working.

## Phase 2.5: AI Integration

**Goal**: AI-powered content generation and correction.

- Groq integration: quiz generation, fill-gaps generation, writing prompt generation
- Groq integration: writing correction (auto-grade with structured feedback)
- Gemini Flash TTS: generate audio for listening exercises (Route Handler + R2 upload)
- AI generator panel in task creation UI
- Auto-grading: quiz/fill-gaps (local), writing (Groq), listening (STT comparison)
- Rate limiting per teacher plan

**Exit criteria**: Teacher can generate exercises with AI. Writing submissions are auto-corrected. TTS audio works for listening exercises.

## Phase 3: Polish (Post-Parity)

Features beyond Rails parity, to be planned separately:

- Challenges system (model exists, UI needed)
- XP/Streak system (fields exist, logic needed)
- Achievements/Badges
- AI Chat Assistant
- Notifications (in-app + email)
- Search (global full-text)
- Settings/Profile pages
- Payment integration (Asaas)
- Landing page
