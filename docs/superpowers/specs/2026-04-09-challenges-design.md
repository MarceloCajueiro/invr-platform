# Challenges Feature Design

## Overview

Challenges are the 4th content channel (alongside Aulas, Tarefas, Blog). A teacher posts a challenge with rich content (title, description via BlockEditor, optional cover image, due date). Students respond with a text message and file attachments (image, video, audio). No feedback/grading in this iteration.

## Data Model

### `challenges` table

Follows the same pattern as `lessons` and `posts`.

| Column | Type | Notes |
|--------|------|-------|
| `id` | text PK | UUID via `$defaultFn` |
| `teacher_id` | text NOT NULL | FK → teachers.id |
| `title` | text NOT NULL | Challenge title |
| `description` | text | BlockNote JSON (same format as lessons.content / posts.content) |
| `cover_image_url` | text | Optional cover image URL |
| `due_date` | integer (timestamp) | Deadline for responses |
| `status` | text NOT NULL DEFAULT 'draft' | Enum: 'draft' \| 'published' |
| `created_at` | integer (timestamp) | Default: unixepoch() |
| `updated_at` | integer (timestamp) | Default: unixepoch() |

Index: `(teacher_id, status)` — same pattern as lessons/posts.

### `challenge_responses` table

Student's answer to a challenge. One response per student per challenge.

| Column | Type | Notes |
|--------|------|-------|
| `id` | text PK | UUID |
| `challenge_id` | text NOT NULL | FK → challenges.id, onDelete cascade |
| `student_id` | text NOT NULL | FK → students.id, onDelete cascade |
| `content` | text | Student's text response |
| `attachments` | text | JSON array: `[{type: "image"|"video"|"audio", key: string, name: string}]` |
| `created_at` | integer (timestamp) | Default: unixepoch() |
| `updated_at` | integer (timestamp) | Default: unixepoch() |

Indexes:
- Unique: `(challenge_id, student_id)` — one response per student
- Index: `(challenge_id)` — for listing responses
- Index: `(student_id)` — for student's own responses

### `turma_challenges` junction table

Follows `turmaLessons` / `turmaTasks` / `turmaPosts` pattern exactly.

| Column | Type | Notes |
|--------|------|-------|
| `id` | text PK | UUID |
| `turma_id` | text NOT NULL | FK → turmas.id, onDelete cascade |
| `challenge_id` | text NOT NULL | FK → challenges.id, onDelete cascade |
| `created_at` | integer (timestamp) | Default: unixepoch() |

Unique index: `(turma_id, challenge_id)`.

## Routes

### Teacher Routes

| Route | Purpose |
|-------|---------|
| `/teacher/challenges` | List all challenges (draft/published tabs) |
| `/teacher/challenges/new` | Create challenge form |
| `/teacher/challenges/[id]/edit` | Edit challenge form |
| `/teacher/challenges/[id]/responses` | View student responses |

### Student Routes

| Route | Purpose |
|-------|---------|
| `/challenges` | List published challenges with due date info |
| `/challenges/[id]` | View challenge + submit response |

## Server Actions

File: `src/lib/actions/challenges.ts`

- `createChallenge(formData)` — teacher creates challenge, links turmas
- `updateChallenge(id, formData)` — teacher updates challenge, syncs turma links
- `deleteChallenge(formData)` — teacher deletes challenge
- `toggleChallengeStatus(formData)` — toggle draft/published
- `submitChallengeResponse(challengeId, content, attachments)` — student submits response

## Queries

File: `src/lib/queries/challenges.ts` (teacher side)

- `getChallenges(teacherId)` — all challenges for teacher with response count
- `getChallengeById(id, teacherId)` — single challenge with turma links
- `getChallengeResponses(challengeId, teacherId)` — all responses for a challenge with student names

File: `src/lib/queries/student-challenges.ts` (student side)

- `getStudentChallenges(studentId, teacherId)` — published challenges with student's response status
- `getStudentChallengeById(challengeId, studentId, teacherId)` — single challenge + student's response if exists

## Validations

File: `src/lib/validations/challenges.ts`

```typescript
createChallengeSchema = z.object({
  title: z.string().min(1, "Titulo e obrigatorio"),
  description: z.string().optional(),
  coverImageUrl: z.string().optional(),
  dueDate: z.coerce.date(),
})

updateChallengeSchema = createChallengeSchema.partial()
```

## Components

### Teacher Components

**`challenge-form.tsx`** — Create/edit form:
- Title input
- BlockEditor for rich description (reuse existing dynamic import pattern)
- Cover image upload (reuse existing `FileUploadField` pattern from lesson-form)
- Due date input (native date/datetime picker)
- Turma selector (reuse `TurmaSelector` component)
- Save button

**`challenge-card.tsx`** — List item card:
- Title, status badge (draft/published), due date
- Response count badge
- Edit/delete/toggle actions (same dropdown pattern as lesson-card)

### Student Components

**`challenge-response-form.tsx`** — Response submission:
- Textarea for text content
- Attachment upload buttons (image, video, audio) using R2 presigned URLs
- Attachment preview thumbnails (image preview, video/audio filename with icon)
- Submit button
- Disabled state if already responded (show existing response instead)

## Navigation Integration

### Sidebar (`sidebar.tsx`)

Add to both teacher and student nav arrays:

```
Teacher: { label: "Challenges", href: "/teacher/challenges", icon: Trophy, color: "challenges" }
Student: { label: "Challenges", href: "/challenges", icon: Trophy, color: "challenges" }
```

### New Content Modal (`new-content-modal.tsx`)

Enable the existing Challenge option: set `href: "/teacher/challenges/new"` and remove `disabled: true`.

### Student Home (`home/page.tsx`)

Add 4th ChannelCard for Challenges in the grid (make it 2x2 on mobile, 4-col on desktop).

## File Upload for Student Responses

Reuses existing R2 presigned URL flow:

1. Student selects file (image/video/audio)
2. Client calls `POST /api/upload/presign` with `{ fileName, contentType, folder: "challenge-responses" }`
3. Browser PUTs file directly to R2
4. Stores `{ type, key, name }` in attachments array
5. On view, calls `GET /api/upload/presign?key=...` to get presigned GET URL

## Seed Data

Add to `scripts/seed.ts`:
- 2 sample challenges (1 published with dueDate in future, 1 draft)
- 1 sample response from seed student
- Link published challenge to seed turma

## Design System

Uses existing `challenges` channel tokens:
- `bg-challenges` (#fdcb6e gold)
- `bg-challenges-light`, `bg-challenges-bg`
- `glow-challenges` hover effect
- Badge variant: `challenges` (already exists in Badge component)

## Out of Scope (Future)

- XP/streak/gamification
- Difficulty levels
- Teacher feedback on responses
- AI-assisted grading
- Badge/achievement system
