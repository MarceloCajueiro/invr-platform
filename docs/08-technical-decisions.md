# Technical Decisions

## Architecture

**Monolith Next.js Full-Stack** — single project with App Router. Server Actions for mutations, Route Handlers for binary/webhook endpoints, Server Components for data fetching.

Three route groups with independent layouts:
- `(auth)` — split screen auth
- `(student)` — app-like with sidebar/bottom nav
- `(teacher)` — CMS with sidebar

## Stack Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Runtime | Cloudflare Workers | Zero cold start, global distribution, generous free tier |
| Adapter | @opennextjs/cloudflare | Officially recommended, v1 stable, full App Router support |
| Database | Cloudflare D1 (SQLite) | Native to ecosystem, zero network latency, free tier |
| ORM | Drizzle | Type-safe, lightweight, D1 + PostgreSQL support (migration path) |
| Auth | better-auth | Self-hosted on D1, no vendor lock-in, proven Cloudflare compatibility |
| Storage | Cloudflare R2 | S3-compatible, zero egress cost, same ecosystem |
| CSS | Tailwind v4 | Consistent with existing DS, config via CSS @theme |
| Forms | Server Actions + Zod + React Hook Form | Zod shared schemas, RHF only for complex forms |
| Email | Resend | Simple API, React Email templates |
| AI (LLM) | Groq | Free tier generous, fast inference |
| AI (TTS/STT) | Google Gemini Flash | Quality TTS, low cost |

## Database Conventions

| Convention | Implementation |
|-----------|---------------|
| Primary keys | UUID v4 as `text` (generated with `crypto.randomUUID()`) |
| JSON fields | `text` column, parse/validate with Zod in app code |
| Booleans | `integer` (0/1) |
| Timestamps | `text` (ISO 8601) |
| Atomic operations | `db.batch()` (D1 has no transaction support) |
| Bulk inserts | Manual chunking (D1 limit: 100 bound params per query) |

## Upload Strategy

**Presigned URLs** for all client-side uploads:

1. Client requests presigned URL via Server Action (filename, content type, folder)
2. Server generates presigned PUT URL using `@aws-sdk/s3-request-presigner`
3. Client uploads directly to R2 (bypasses Worker body size limits)
4. Client sends back the public URL, saved in D1

**Key organization**: `teachers/{teacherId}/lessons/{lessonId}/cover.jpg`

## Auth Flow

**better-auth** manages core auth tables (`user`, `session`, `account`, `verification`).

User roles stored in `user.role` field (`teacher` | `student`).

Extended profile data in `teachers` and `students` tables (linked via `user_id`).

**Teacher flow**: Sign-up → creates user (role: teacher) + teachers record
**Student flow**: Teacher sends invite → student accepts → creates user (role: student) + students record with teacher_id

## Middleware

```typescript
// middleware.ts
// 1. better-auth session check
// 2. Unauthenticated → /sign-in
// 3. Teacher on (student) routes → /dashboard
// 4. Student on (teacher) routes → /home
```

## State Management

- **Server Components** for data fetching (no client-side cache layer)
- **URL search params** for filters, pagination, sorting
- **React Hook Form** for complex form state (question editor)
- No Redux/Zustand — not needed for this architecture

## Image Optimization

Cloudflare Images via custom Next.js image loader. Configured in `next.config.ts`.

## Development

- Local dev: `wrangler dev` with D1 local (SQLite file)
- Migrations: `drizzle-kit generate` → `wrangler d1 migrations apply`
- Environment: secrets via `wrangler secret put` (prod) / `.dev.vars` (local)

## Cloudflare Configuration (wrangler.jsonc)

```jsonc
{
  "name": "fluent",
  "compatibility_flags": ["nodejs_compat"],
  "d1_databases": [
    { "binding": "FLUENT_DB", "database_name": "fluent-db", "database_id": "<id>" }
  ],
  "r2_buckets": [
    { "binding": "FLUENT_STORAGE", "bucket_name": "fluent-storage" }
  ]
}
```

**Secrets** (via `wrangler secret put`):
- `BETTER_AUTH_SECRET`
- `RESEND_API_KEY`
- `GROQ_API_KEY`
- `GEMINI_API_KEY`

## Code Organization

```
src/
├── app/                          → Next.js App Router
│   ├── (auth)/                   → Auth pages + layout
│   ├── (student)/                → Student interface
│   ├── (teacher)/                → Teacher CMS
│   └── api/                      → Route Handlers
├── components/
│   ├── ui/                       → Primitives (Button, Input, Card, etc.)
│   ├── auth/                     → Brand panel, form components
│   ├── student/                  → Channel cards, progress ring, quiz player
│   ├── teacher/                  → KPI cards, lesson editor, question editor
│   └── shared/                   → Sidebar, nav, empty states
├── lib/
│   ├── db/
│   │   ├── schema.ts             → Drizzle schema
│   │   ├── index.ts              → DB client
│   │   └── migrations/           → Generated SQL
│   ├── auth/
│   │   ├── server.ts             → better-auth config
│   │   └── client.ts             → Client hooks
│   ├── services/
│   │   ├── ai/groq.ts            → LLM services
│   │   ├── ai/gemini.ts          → TTS/STT
│   │   ├── grading/              → Auto-grade logic
│   │   ├── email/resend.ts       → Email sending
│   │   └── storage/r2.ts         → Presigned URLs
│   ├── validations/              → Zod schemas
│   └── utils/                    → Helpers
├── styles/
│   └── globals.css               → Tailwind v4 @theme tokens
└── middleware.ts                  → Auth + routing
```

## Markdown Rendering

- **Editor**: Textarea + live preview (no heavy WYSIWYG)
- **Rendering**: `react-markdown` + `rehype-highlight` for code blocks
- Used in: lesson descriptions, post content, writing feedback
