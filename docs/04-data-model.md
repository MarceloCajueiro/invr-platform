# Data Model

## Overview

All tables use UUID (`text`) primary keys. JSON is stored as `text` and parsed in JavaScript. Booleans are `integer` (0/1). Timestamps are `text` (ISO 8601). ORM: Drizzle with SQLite dialect (Cloudflare D1).

## Entity Relationships

```
Teacher (1) ──── (N) Lesson
Teacher (1) ──── (N) Task
Teacher (1) ──── (N) Post
Teacher (1) ──── (N) Turma
Teacher (1) ──── (N) Challenge
Teacher (1) ──── (N) Student (invited by)

Turma (N) ──── (N) Student    (via turma_students)
Turma (N) ──── (N) Lesson     (via turma_lessons)
Turma (N) ──── (N) Task       (via turma_tasks)

Student (1) ──── (N) Submission
Student (1) ──── (N) LessonProgress

Task (1) ──── (N) Submission
Lesson (1) ──── (N) LessonProgress
```

## Tables

### Auth Tables (managed by better-auth)

```sql
user
  id            text PRIMARY KEY
  name          text NOT NULL
  email         text NOT NULL UNIQUE
  emailVerified integer NOT NULL DEFAULT 0
  image         text
  role          text NOT NULL DEFAULT 'teacher'  -- 'teacher' | 'student'
  createdAt     text NOT NULL
  updatedAt     text NOT NULL

session
  id            text PRIMARY KEY
  expiresAt     text NOT NULL
  token         text NOT NULL UNIQUE
  ipAddress     text
  userAgent     text
  userId        text NOT NULL REFERENCES user(id)
  createdAt     text NOT NULL
  updatedAt     text NOT NULL

account
  id            text PRIMARY KEY
  accountId     text NOT NULL
  providerId    text NOT NULL  -- 'credential' | 'google' (future)
  userId        text NOT NULL REFERENCES user(id)
  accessToken   text
  refreshToken  text
  expiresAt     text
  createdAt     text NOT NULL
  updatedAt     text NOT NULL

verification
  id            text PRIMARY KEY
  identifier    text NOT NULL  -- email
  value         text NOT NULL  -- token
  expiresAt     text NOT NULL
  createdAt     text
  updatedAt     text
```

### Application Tables

```sql
teachers
  id            text PRIMARY KEY
  user_id       text NOT NULL UNIQUE REFERENCES user(id)
  plan          text NOT NULL DEFAULT 'free'  -- 'free' | 'pro' | 'school'
  created_at    text NOT NULL
  updated_at    text NOT NULL

students
  id            text PRIMARY KEY
  user_id       text NOT NULL UNIQUE REFERENCES user(id)
  teacher_id    text NOT NULL REFERENCES teachers(id)
  xp            integer NOT NULL DEFAULT 0
  current_streak integer NOT NULL DEFAULT 0
  longest_streak integer NOT NULL DEFAULT 0
  last_activity_at text
  created_at    text NOT NULL
  updated_at    text NOT NULL

lessons
  id            text PRIMARY KEY
  teacher_id    text NOT NULL REFERENCES teachers(id)
  title         text NOT NULL
  description   text  -- markdown
  category      text NOT NULL  -- 'conversation' | 'grammar' | 'vocabulary' | 'listening' | 'culture'
  video_url     text
  cover_image_url text
  duration_minutes integer
  status        text NOT NULL DEFAULT 'draft'  -- 'draft' | 'published'
  position      integer NOT NULL DEFAULT 0
  created_at    text NOT NULL
  updated_at    text NOT NULL

tasks
  id            text PRIMARY KEY
  teacher_id    text NOT NULL REFERENCES teachers(id)
  lesson_id     text REFERENCES lessons(id)  -- optional link
  title         text NOT NULL
  description   text
  task_type     text NOT NULL  -- 'quiz' | 'listening' | 'fill_gaps' | 'writing'
  questions     text  -- JSON: [{number, text, type, options[], correct, explanation}]
  level         text NOT NULL DEFAULT 'beginner'  -- 'beginner' | 'intermediate' | 'advanced'
  status        text NOT NULL DEFAULT 'draft'  -- 'draft' | 'published'
  ai_generated  integer NOT NULL DEFAULT 0
  ai_prompt     text
  created_at    text NOT NULL
  updated_at    text NOT NULL

submissions
  id            text PRIMARY KEY
  student_id    text NOT NULL REFERENCES students(id)
  task_id       text NOT NULL REFERENCES tasks(id)
  answers       text  -- JSON: [{question_number, answer, correct}]
  score         integer  -- 0-100
  feedback      text  -- AI or teacher feedback
  graded_by     text  -- 'auto' | 'ai' | 'teacher'
  status        text NOT NULL DEFAULT 'submitted'  -- 'in_progress' | 'submitted' | 'graded'
  created_at    text NOT NULL
  updated_at    text NOT NULL

lesson_progresses
  id            text PRIMARY KEY
  student_id    text NOT NULL REFERENCES students(id)
  lesson_id     text NOT NULL REFERENCES lessons(id)
  progress      integer NOT NULL DEFAULT 0  -- 0-100
  watched_at    text
  created_at    text NOT NULL
  updated_at    text NOT NULL

posts
  id            text PRIMARY KEY
  teacher_id    text NOT NULL REFERENCES teachers(id)
  title         text NOT NULL
  slug          text NOT NULL UNIQUE
  content       text  -- markdown
  category      text NOT NULL  -- 'tips' | 'grammar' | 'culture' | 'vocabulary'
  featured      integer NOT NULL DEFAULT 0
  status        text NOT NULL DEFAULT 'draft'  -- 'draft' | 'published'
  view_count    integer NOT NULL DEFAULT 0
  created_at    text NOT NULL
  updated_at    text NOT NULL

turmas
  id            text PRIMARY KEY
  teacher_id    text NOT NULL REFERENCES teachers(id)
  name          text NOT NULL
  description   text
  color         text  -- hex color
  level         text  -- 'beginner' | 'intermediate' | 'advanced'
  invite_code   text NOT NULL UNIQUE
  notify_new_lesson integer NOT NULL DEFAULT 1
  notify_new_task   integer NOT NULL DEFAULT 1
  created_at    text NOT NULL
  updated_at    text NOT NULL

turma_students
  id            text PRIMARY KEY
  turma_id      text NOT NULL REFERENCES turmas(id)
  student_id    text NOT NULL REFERENCES students(id)
  created_at    text NOT NULL

turma_lessons
  id            text PRIMARY KEY
  turma_id      text NOT NULL REFERENCES turmas(id)
  lesson_id     text NOT NULL REFERENCES lessons(id)
  created_at    text NOT NULL

turma_tasks
  id            text PRIMARY KEY
  turma_id      text NOT NULL REFERENCES turmas(id)
  task_id       text NOT NULL REFERENCES tasks(id)
  created_at    text NOT NULL

challenges  -- future, DB ready
  id            text PRIMARY KEY
  teacher_id    text NOT NULL REFERENCES teachers(id)
  title         text NOT NULL
  description   text
  difficulty    text NOT NULL  -- 'easy' | 'medium' | 'hard'
  xp_reward     integer NOT NULL DEFAULT 10
  badge_emoji   text
  status        text NOT NULL DEFAULT 'draft'  -- 'draft' | 'published'
  created_at    text NOT NULL
  updated_at    text NOT NULL
```

## Indexes

```sql
-- Frequent lookups
CREATE INDEX idx_students_teacher ON students(teacher_id);
CREATE INDEX idx_lessons_teacher_status ON lessons(teacher_id, status);
CREATE INDEX idx_tasks_teacher_status ON tasks(teacher_id, status);
CREATE INDEX idx_submissions_student ON submissions(student_id);
CREATE INDEX idx_submissions_task ON submissions(task_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_lesson_progresses_student ON lesson_progresses(student_id);
CREATE INDEX idx_posts_teacher_status ON posts(teacher_id, status);
CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_turmas_teacher ON turmas(teacher_id);
CREATE INDEX idx_turmas_invite_code ON turmas(invite_code);
CREATE UNIQUE INDEX idx_turma_students_unique ON turma_students(turma_id, student_id);
CREATE UNIQUE INDEX idx_turma_lessons_unique ON turma_lessons(turma_id, lesson_id);
CREATE UNIQUE INDEX idx_turma_tasks_unique ON turma_tasks(turma_id, task_id);
CREATE UNIQUE INDEX idx_lesson_progress_unique ON lesson_progresses(student_id, lesson_id);
```

## D1-Specific Notes

- **No transactions**: use `db.batch()` for atomic multi-statement operations
- **100 parameter limit**: chunk bulk inserts so `rows × columns < 100`
- **No JSONB**: store JSON as `text`, parse/validate in application code with Zod
- **No UUID type**: UUIDs stored as `text`, generated with `crypto.randomUUID()`
- **FK constraints**: active by default in D1, cannot be disabled during migrations — be careful with table recreation
