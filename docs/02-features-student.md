# Student Features

## STU-001: Splash Screen
- Animated logo on first load (splashBounce animation)
- Brief display before redirecting to home
- Only shows once per session

## STU-002: Home Dashboard
- Personalized greeting (bom dia/tarde/noite + student name)
- **Progress ring** (SVG animated): daily completion % of assigned tasks
- **4 channel cards**: Aulas, Tarefas, Fora da Aula, Challenges — each with channel color, icon, and dynamic counter (e.g., "3 novas aulas", "2 tarefas pendentes")
- **Activity feed**: recent submissions, lessons watched, achievements

## STU-003: Global Search
- Search box in top bar
- Full-text search across lessons, tasks, posts
- Results grouped by content type

## STU-004: Notifications
- Types: new lesson, new task, new challenge, new post, submission graded, streak warning, achievement earned
- Bell icon with unread count badge
- Dropdown list with mark-as-read
- (Future) Email notifications via Resend

## STU-005: Aulas (Lessons) Timeline
- Chronological/ordered list of lessons
- Cards with: thumbnail (cover image), category badge, duration, progress indicator
- Staggered entry animation (fadeIn + slideUp, 80ms delay per item)
- Filter by category (conversation, grammar, vocabulary, listening, culture)

## STU-006: Aulas Player
- Video embed (external URL — YouTube, Vimeo, etc.)
- Lesson description (markdown rendered)
- Attached materials: audio player, document downloads
- Linked exercises (tasks associated to this lesson)
- Progress tracking: updates `lesson_progresses` with watch %

## STU-007: Tarefas (Tasks) Grid
- 3 visual states: **active** (available), **pending** (not started), **done** (completed with score)
- Each card: type icon, title, level badge, score if completed
- Progress bar for partially completed tasks
- AI generation badge when task was AI-created

## STU-008: Quiz Player
- One question at a time, full-screen focus
- 4 option buttons per question
- Instant feedback: green highlight for correct, red for wrong + explanation text
- Progress bar showing question X of Y
- Final score screen with confetti animation if >80%

## STU-009: Exercise Types

### Quiz (Multiple Choice)
- Question text + 4 options + instant feedback + explanation

### Fill-the-Gaps
- Sentence with `___` blank inline
- Text input to fill the gap
- Validation on submit with correct answer shown

### Writing
- Prompt/instructions displayed
- Textarea with word counter
- Submit for AI correction (Groq)
- Receives: score (0-10), feedback, error list with corrections, improvement tips

### Listening
- Audio player (TTS-generated audio from R2)
- Comprehension questions below (quiz-style)
- Speed controls (normal/slow) if available

## STU-010: Fora da Aula (Blog)
- Post list with category filters (tips, grammar, culture, vocabulary)
- Featured post at top (if marked)
- Post cards with: title, category tag, excerpt, view count
- Post detail: full markdown content rendered, view count incremented

## STU-011: Challenges (Future — DB Ready)
- Mission cards with: title, difficulty dots, XP reward, badge emoji
- XP progress bar toward next level
- Confetti animation on completion (confettiPop keyframe)
- Achievements section: earned badges vs locked (greyed out)

## STU-012: Streak System (Future — DB Ready)
- Consecutive days indicator in sidebar/profile
- Visual streak counter with fire emoji
- Resets after 1 inactive day
- Streak warning notification before reset

## STU-013: Mobile Bottom Navigation
- Fixed at bottom, 64px height
- 5 items equally distributed: Home, Aulas, Tarefas, Blog, Profile
- Active item highlighted with channel color
- Appears only on screens < 768px (sidebar hidden)

## STU-014: Turmas (Classes)
- List of enrolled classes
- Join flow: input invite code → confirm → join turma
- Turma view shows linked lessons and tasks
