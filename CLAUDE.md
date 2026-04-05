@AGENTS.md

# Fluent — CLAUDE.md

AI-powered English learning platform for private teachers. Next.js 16 on Cloudflare Workers.

## Quick Reference

```bash
npm run dev -- --port 3001   # Dev server (Turbopack)
npm run db:reset             # Reset local D1 + seed (must restart dev server after)
npm run db:generate          # Generate Drizzle migration from schema changes
npm run db:migrate:local     # Apply migrations to local D1
npm run db:seed              # Seed sample data (teacher + student + content)
npx tsc --noEmit             # Type check
npx playwright test          # E2E tests (kills dev server first if stale DB)
npm run deploy               # Build + deploy to Cloudflare Workers (manual)
```

## Deploy

**Production URL:** `https://fluent.marcelocajueiro.workers.dev`
**GitHub repo:** `https://github.com/MarceloCajueiro/invr-platform`

Deploy automático via GitHub Actions (`.github/workflows/deploy.yml`) a cada push em `main`:
1. `npm ci`
2. `opennextjs-cloudflare build && opennextjs-cloudflare deploy`

Requer secret `CLOUDFLARE_API_TOKEN` no repositório GitHub (Workers:Edit permission).

**Seed credentials:** `fran@fluent.app` / `marcelo@fluent.app` — password: `senha12345`

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, React 19, Turbopack) |
| Runtime | Cloudflare Workers via @opennextjs/cloudflare |
| Database | Cloudflare D1 (SQLite) via Drizzle ORM |
| Auth | better-auth (self-hosted on D1, email/password, scrypt) |
| Storage | Cloudflare R2 (presigned URLs via aws4fetch) |
| CSS | Tailwind CSS v4 (@theme tokens in globals.css) |
| AI (LLM) | Groq (llama-3.3-70b-versatile) |
| AI (TTS) | Google Gemini Flash (@google/genai) |
| Email | Resend |
| Validation | Zod |
| Testing | Playwright |
| Icons | Lucide React |

## Architecture

Monolith Next.js with 3 route groups:

- `(auth)/` — Sign-in, sign-up, invite accept. Split-screen layout.
- `(student)/` — Student interface at root URLs (`/home`, `/lessons`, `/tasks`, `/blog`, `/turmas`)
- `teacher/` — Teacher CMS at `/teacher/*` (`/teacher/dashboard`, `/teacher/lessons`, etc.)

**Data flow:** Server Components fetch data → Server Actions mutate → `revalidatePath()` for cache.

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Auth pages (sign-in, sign-up, invite)
│   ├── (student)/        # Student pages (home, lessons, tasks, blog, turmas)
│   ├── teacher/          # Teacher pages (dashboard, lessons, tasks, posts, turmas, students)
│   └── api/              # Route handlers (auth, ai/tts, upload, files)
├── components/
│   ├── ui/               # Primitives (Button, Input, Card, Badge, Modal, Tabs, etc.)
│   ├── auth/             # Brand panel
│   ├── shared/           # Sidebar, MobileNav
│   ├── student/          # Student-specific (quiz-player, lesson-card, progress-ring, etc.)
│   └── teacher/          # Teacher-specific (lesson-form, question-editor, kpi-card, etc.)
├── lib/
│   ├── actions/          # Server Actions ("use server") per domain
│   ├── auth/             # server.ts (createAuth), client.ts, get-teacher.ts, get-student.ts
│   ├── db/               # schema.ts (Drizzle), index.ts (getDb)
│   ├── queries/          # Read-only query functions per domain
│   ├── services/ai/      # groq.ts (LLM), gemini.ts (TTS)
│   ├── services/email/   # resend.ts
│   ├── services/storage/ # r2.ts (presigned URLs)
│   └── validations/      # Zod schemas per domain
└── middleware.ts          # Auth check + role-based routing
```

## Key Patterns

### Environment Variables

**NEVER use `process.env` for server-side env vars.** Cloudflare Workers requires:

```typescript
import { getCloudflareContext } from "@opennextjs/cloudflare";
const { env } = await getCloudflareContext({ async: true });
// or synchronous: const { env } = getCloudflareContext();
```

Exception: `process.env.NEXT_PUBLIC_*` works client-side (build-time inlined).

### Database Access

```typescript
import { getDb } from "@/lib/db";
const db = getDb(); // returns Drizzle instance with D1 binding
```

**D1 limitations:**
- No transactions — use `db.batch()` for atomic operations
- Max 100 bound parameters per query — chunk bulk inserts
- JSON stored as `text` — parse in app code
- Booleans as `integer` (0/1) with `{ mode: "boolean" }`
- Timestamps as `integer` with `{ mode: "timestamp" }` and `default(sql\`(unixepoch())\`)`
- UUIDs as `text` with `$defaultFn(() => crypto.randomUUID())`

### Auth

```typescript
// Server-side: factory pattern (D1 binding only available per-request)
import { createAuth } from "@/lib/auth/server";
const auth = await createAuth();
const session = await auth.api.getSession({ headers: await headers() });

// Shorthand for pages:
import { getTeacher } from "@/lib/auth/get-teacher"; // returns { user, teacher }
import { getStudent } from "@/lib/auth/get-student"; // returns { user, student }

// Client-side:
import { authClient, signIn, signUp, signOut, useSession } from "@/lib/auth/client";
```

better-auth uses **scrypt** (not bcrypt). Password hash format: `salt:hex_key`.

### Server Actions

```typescript
"use server";
import { getTeacher } from "@/lib/auth/get-teacher";
import { getDb } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createLesson(formData: FormData) {
  const { teacher } = await getTeacher();
  const db = getDb();
  // validate with Zod, insert, revalidatePath, redirect
}
```

### UI Components

All in `src/components/ui/`. Use `cn()` from `@/lib/utils` for class merging.

```typescript
import { Button } from "@/components/ui/button";    // variants: primary, secondary, success, danger, ghost
import { Badge } from "@/components/ui/badge";       // variants: aulas, tarefas, fora, challenges, draft, published, beginner, intermediate, advanced
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";       // with label, error, icon
import { Select } from "@/components/ui/select";     // with options array
import { Modal } from "@/components/ui/modal";       // backdrop + escape + animate
import { Tabs } from "@/components/ui/tabs";         // tab bar with active state
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
```

## Design System

**IMPORTANT — Design System First:**
- **NEVER** use raw `<button>`, `<input>`, `<span>` with ad-hoc Tailwind classes when a DS component exists. Always use `Button`, `Badge`, `Input`, `Card`, etc.
- **NEVER** use arbitrary color values (e.g. `text-red-500`, `bg-green-400`). Only use DS tokens: `text-success`, `bg-aulas`, `text-error`, `bg-fora-bg`, etc.
- **Before creating any visual element**, check if an existing DS component or variant covers the need.
- **If no existing component/variant fits**, extend the DS — add a new variant to the existing component following the same patterns (variant map, shadow map, glow class). Do NOT create one-off inline styles.
- **After extending the DS**, update this CLAUDE.md to reflect the new variant/component so future work stays consistent.

**Sources of truth:** `src/components/ui/` (components), `src/app/globals.css` (tokens/animations), `docs/06-design-system.md` (spec).

Tokens defined in `src/app/globals.css` via Tailwind `@theme`.

**Channel colors** (4 content pillars):
- Aulas (lessons): `bg-aulas` (#6c5ce7 purple), `bg-aulas-light`, `bg-aulas-bg`
- Tarefas (tasks): `bg-tarefas` (#00b894 green), `bg-tarefas-light`, `bg-tarefas-bg`
- Fora da Aula (blog): `bg-fora` (#e17055 coral), `bg-fora-light`, `bg-fora-bg`
- Challenges: `bg-challenges` (#fdcb6e gold), `bg-challenges-light`, `bg-challenges-bg`

**Semantic colors:** `success` (#00b894), `warning` (#fdcb6e), `error` (#e17055), `info` (#0984e3)

**Fonts:** Bricolage Grotesque (display/headings), Outfit (body), JetBrains Mono (code)

**Animations:** `animate-fade-in`, `animate-slide-up`, `animate-pop-in`, `animate-bar-grow`

**Radius:** `--radius-sm` (6px), `--radius-md` (12px), `--radius-lg` (16px), `--radius-xl` (20px)

## Database Schema

17 tables. Auth tables (user, session, account, verification) managed by better-auth. App tables:

- `teachers` — user profile extension (plan: free/pro/school)
- `students` — linked to teacher, tracks xp/streak
- `invitations` — email invites with token/expiry
- `lessons` — category enum (conversation/grammar/vocabulary/listening/culture), status (draft/published)
- `tasks` — taskType enum (quiz/listening/fill_gaps/writing), questions as JSON text, aiGenerated flag
- `submissions` — answers JSON, score, feedback, gradedBy (auto/ai/teacher), status (in_progress/submitted/graded)
- `lessonProgresses` — progress 0-100, unique per student+lesson
- `posts` — slug unique, category (tips/grammar/culture/vocabulary), viewCount
- `turmas` — inviteCode (6-char), color, notification toggles
- `turmaStudents`, `turmaLessons`, `turmaTasks` — junction tables with cascade delete
- `challenges` — difficulty (easy/medium/hard), xpReward, badgeEmoji

## Cloudflare Bindings

Defined in `wrangler.jsonc`:
- `DB` — D1 database (fluent-db)
- `BUCKET` — R2 storage (fluent-storage)

Secrets (via `wrangler secret put`): `BETTER_AUTH_SECRET`, `RESEND_API_KEY`, `GROQ_API_KEY`, `GEMINI_API_KEY`, `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`

## Testing

Playwright E2E tests in `e2e/`. Config has 4 projects:
- `setup` — creates auth state files
- `teacher` — tests with teacher session (storageState)
- `student` — tests with student session (storageState)
- `auth` — tests without auth (sign-in, sign-up, middleware)

```bash
npx playwright test                    # All tests
npx playwright test --project=auth     # Auth tests only
npx playwright test --grep "CT-01"     # Specific scenario
```

**Important:** After `npm run db:reset`, kill and restart the dev server before running tests (D1 handle goes stale).

## Conventions

- **Language:** Portuguese for UI text and error messages. English for code, commits, and variable names.
- **Commits:** Conventional Commits (feat/fix/docs/refactor/test/chore)
- **Server vs Client:** Server Components by default. `"use client"` only for interactive UI.
- **Imports:** Use `@/` path alias (maps to `src/`)
- **Forms:** FormData-based with Server Actions. Zod validation on server side.
- **Routing:** Next.js 16 — `params` and `searchParams` are Promises (use `await`).
- **Middleware:** Next.js 16 deprecated `middleware.ts` in favor of `proxy.ts` (warning shown but still works).

## Documentation

Full specs in `docs/`:
- `00-product-vision.md` — Business model, personas, success metrics
- `01-information-architecture.md` — Route structure, navigation
- `02-features-student.md` — 14 student features with IDs (STU-001 to STU-014)
- `03-features-teacher.md` — 9 teacher features with IDs (TCH-001 to TCH-009)
- `04-data-model.md` — Full schema with ER relationships
- `05-api-and-actions.md` — Server Actions catalog + Route Handlers
- `06-design-system.md` — Complete DS: colors, typography, spacing, animations, components
- `07-ai-specifications.md` — AI features (AI-001 to AI-007), prompts, rate limits
- `08-technical-decisions.md` — ADRs, stack rationale, code organization
- `09-implementation-phases.md` — Phase 0-3 roadmap

Design system reference (interactive): `docs/design-system.html`
