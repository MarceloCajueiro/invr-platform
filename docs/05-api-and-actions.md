# API & Server Actions

## Architecture

Fluent uses **Server Actions** for all mutations (create, update, delete) and **Server Components** for data fetching. **Route Handlers** (API routes) are used only for:

- better-auth handler (`/api/auth/[...all]`)
- Binary data endpoints (TTS/STT)
- Presigned URL generation for R2 uploads
- External webhooks (future: Asaas payments)

## Server Actions

All actions validate input with Zod schemas, check auth/role via better-auth session, and return typed results.

### Auth Actions

| Action | Description |
|--------|-------------|
| `inviteStudent(email)` | Teacher sends invite email via Resend |
| `acceptInvite(token, name, password)` | Student accepts invite, creates account |

### Lesson Actions

| Action | Description |
|--------|-------------|
| `createLesson(data)` | Create draft lesson |
| `updateLesson(id, data)` | Update lesson fields |
| `deleteLesson(id)` | Delete lesson + attachments |
| `publishLesson(id)` | Set status to published |
| `unpublishLesson(id)` | Set status to draft |
| `updateLessonProgress(lessonId, progress)` | Student updates watch % |

### Task Actions

| Action | Description |
|--------|-------------|
| `createTask(data)` | Create task with questions JSON |
| `updateTask(id, data)` | Update task fields/questions |
| `deleteTask(id)` | Delete task + submissions |
| `publishTask(id)` | Set status to published |
| `submitAnswers(taskId, answers)` | Student submits exercise answers |
| `gradeSubmission(submissionId, score, feedback)` | Teacher manually grades |
| `generateTask(prompt, type, level, count)` | AI generates questions via Groq |

### Post Actions

| Action | Description |
|--------|-------------|
| `createPost(data)` | Create draft post |
| `updatePost(id, data)` | Update post |
| `deletePost(id)` | Delete post |
| `publishPost(id)` | Publish post |
| `incrementViewCount(postId)` | Increment on student view |

### Turma Actions

| Action | Description |
|--------|-------------|
| `createTurma(data)` | Create class (auto-generates invite code) |
| `updateTurma(id, data)` | Update class details |
| `deleteTurma(id)` | Delete class |
| `addStudentToTurma(turmaId, studentId)` | Link student |
| `removeStudentFromTurma(turmaId, studentId)` | Unlink student |
| `linkLessonToTurma(turmaId, lessonId)` | Link lesson to class |
| `unlinkLessonFromTurma(turmaId, lessonId)` | Unlink lesson |
| `linkTaskToTurma(turmaId, taskId)` | Link task to class |
| `unlinkTaskFromTurma(turmaId, taskId)` | Unlink task |
| `joinTurma(inviteCode)` | Student joins via code |

### Student Actions

| Action | Description |
|--------|-------------|
| `inviteStudent(email)` | Send invite email |
| `removeStudent(studentId)` | Remove student from teacher |

## Route Handlers (API Routes)

### Auth
```
GET|POST /api/auth/[...all]   → better-auth handler (all auth flows)
```

### AI
```
POST /api/ai/tts              → Generate TTS audio (Gemini Flash)
  Body: { text, voices?, speed? }
  Response: { audioUrl } (uploaded to R2)

POST /api/ai/stt              → Transcribe audio (Gemini Flash)
  Body: FormData with audio file
  Response: { transcription }
```

### Upload
```
POST /api/upload/presign       → Generate R2 presigned URL
  Body: { filename, contentType, folder }
  Response: { uploadUrl, publicUrl }
```

## Data Fetching (Server Components)

Data is fetched directly in Server Components using Drizzle queries. No separate API layer needed.

### Teacher Queries

| Query | Used In |
|-------|---------|
| `getDashboardKPIs(teacherId)` | Dashboard |
| `getActivityChart(teacherId, days)` | Dashboard chart |
| `getRecentSubmissions(teacherId, limit)` | Dashboard |
| `getAlerts(teacherId)` | Dashboard |
| `getLessons(teacherId, filters)` | Lessons list |
| `getLesson(lessonId)` | Lesson edit |
| `getTasks(teacherId, filters)` | Tasks list |
| `getTask(taskId)` | Task edit |
| `getPosts(teacherId, filters)` | Posts list |
| `getTurmas(teacherId)` | Turmas list |
| `getTurma(turmaId)` | Turma detail |
| `getStudents(teacherId)` | Students list |
| `getStudentProfile(studentId)` | Student detail |
| `getPendingSubmissions(teacherId)` | Corrections queue |

### Student Queries

| Query | Used In |
|-------|---------|
| `getHomeData(studentId)` | Home dashboard |
| `getStudentLessons(studentId)` | Lessons timeline |
| `getLesson(lessonId)` | Lesson detail |
| `getStudentTasks(studentId)` | Tasks grid |
| `getTask(taskId)` | Task/exercise player |
| `getSubmissions(studentId, taskId)` | Submission history |
| `getPublishedPosts(teacherId)` | Blog list |
| `getPost(slug)` | Post detail |
| `getStudentTurmas(studentId)` | My classes |
| `getStudentProgress(studentId)` | Progress ring data |

## Authorization

- **Teacher actions/queries**: verify `session.user.role === 'teacher'` and `resource.teacherId === teacher.id`
- **Student actions/queries**: verify `session.user.role === 'student'` and student belongs to the teacher who owns the resource
- **Middleware**: redirects unauthenticated users and enforces role-based routing
