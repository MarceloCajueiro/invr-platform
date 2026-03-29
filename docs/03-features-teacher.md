# Teacher Features

## TCH-001: Dashboard
- **4 KPI cards**: active students, engagement %, completed tasks, average grade
  - Animated count-up on load
  - Trend indicator (up/down arrow + % change)
- **Activity chart**: 7-day bar chart of submissions (barGrow animation)
- **Recent submissions**: list with student name, task, score, graded_by status
- **Alerts**: inactivity warnings, pending corrections, milestones
- **Quick actions**: create lesson, create task, invite student

## TCH-002: New Content Modal
- Accessible via button or Cmd+N shortcut
- 4 channel options: Aula, Tarefa, Post, Challenge
- Each with channel color and icon
- Redirects to the appropriate creation form

## TCH-003: Lessons CMS
- **List view**: table/list with columns: title, category, status, views, actions
- **Filters**: by status (draft/published), category
- **Create/Edit form**:
  - Title, category (select), description (markdown textarea + preview)
  - Video URL input
  - Cover image upload (R2 presigned URL)
  - Audio files upload (multiple, R2)
  - Document files upload (multiple, R2)
  - Position/ordering (drag-and-drop or manual)
- **Publish/Unpublish** toggle
- **Delete** with confirmation

## TCH-004: Tasks CMS
- **List view**: filterable by type (quiz/listening/fill_gaps/writing) and status
- **Create flow**:
  1. Select task type (4 toggle buttons)
  2. Fill: title, description, level (beginner/intermediate/advanced)
  3. **Question editor** (dynamic, type-specific):
     - Quiz: question text + 4 options (radio for correct) + explanation
     - Fill-gaps: sentence with blank + correct answer + explanation
     - Writing: prompt text + instructions
     - Listening: base text → generate TTS button → audio preview + questions
  4. Preview before publish
- **AI Generator panel**:
  - Inputs: prompt/theme, level, question count (3-30)
  - Generate button → loading → preview generated questions
  - Accept / Edit / Regenerate
  - Flag `ai_generated: true` saved
- **Pending corrections**: list of writing submissions awaiting teacher review
- **Publish/Unpublish** toggle

## TCH-005: Posts CMS
- **List view**: filterable by category (tips, grammar, culture, vocabulary)
- **Create/Edit form**:
  - Title, slug (auto-generated from title, editable)
  - Content (markdown textarea + preview)
  - Category select
  - Featured toggle
- **Publish/Unpublish** toggle

## TCH-006: Turmas (Class Management)
- **Class cards**: colored top bar (class color), level badge, student count, invite code
- **Create form**: name, description, color picker, level
- **Detail view** with tabs:
  - **Members**: student table with engagement bars, streak indicators, actions (remove)
  - **Linked Lessons**: add/remove lessons to this class
  - **Linked Tasks**: add/remove tasks to this class
  - **Settings**: notification toggles (new lesson, new task), danger zone (archive/delete)
- **Invite code**: auto-generated, copiable with click

## TCH-007: Students Management
- **Student list**: cards or table with avatar, name, level, XP, streak, last activity
- **Search** by name/email
- **Invite student**: email input → sends invite via Resend with link to `/invite/[token]`
- **Student profile**: XP, streak, submission history, lesson progress, enrolled classes
- **Inactivity alerts**: visual indicator for students inactive >7 days

## TCH-008: AI Assistant (Future)
- 6 suggestion cards (generate quiz, create challenge, analyze performance, etc.)
- Chat interface with streaming responses
- Rich content in responses (lists, audio previews)
- Access to teacher's data (turmas, students, content, metrics)
- Portuguese, friendly tone

## TCH-009: Keyboard Shortcuts
- 1-8: navigate to pages (Dashboard, Aulas, Tarefas, Posts, Turmas, Alunos, etc.)
- Cmd+N: open "New Content" modal
- Escape: close modal/drawer
