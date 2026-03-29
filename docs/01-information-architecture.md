# Information Architecture

## Two Distinct Interfaces

Fluent has two separate interfaces for different roles, plus an auth flow:

### Auth (`/sign-in`, `/sign-up`, `/invite/[token]`)
- Split screen layout: brand panel (left) + form panel (right)
- Teacher sign-up and sign-in
- Student invite acceptance
- Password reset

### Student Interface (`/home`, `/lessons`, `/tasks`, `/blog`, `/turmas`)
- Modern app-like experience
- Focus on engagement and gamification
- Desktop: sidebar navigation
- Mobile: bottom navigation bar

### Teacher Interface (`/dashboard`, `/lessons`, `/tasks`, `/posts`, `/turmas`, `/students`)
- Full CMS for content management
- Dashboard with KPIs and analytics
- Desktop: sidebar navigation (240px)

## 4 Content Channels

Content is organized into 4 thematic channels, each with its own color identity:

| Channel | Purpose | Color | Hex |
|---------|---------|-------|-----|
| **Aulas** (Lessons) | Video lessons, materials | Purple | #6c5ce7 |
| **Tarefas** (Tasks) | Exercises, quizzes | Green | #00b894 |
| **Fora da Aula** (Blog) | Tips, culture, media | Coral | #e17055 |
| **Challenges** | Gamified missions | Gold | #fdcb6e |

Each channel appears in both student and teacher interfaces with different UX — students consume content, teachers create and manage it.

## Route Structure (Next.js App Router)

```
app/
├── layout.tsx                    → Root layout (fonts, providers)
│
├── (auth)/
│   ├── layout.tsx                → Split screen (brand panel + form)
│   ├── sign-in/                  → Teacher & Student sign-in
│   ├── sign-up/                  → Teacher sign-up
│   └── invite/[token]/           → Accept student invite
│
├── (student)/
│   ├── layout.tsx                → Student shell (sidebar + bottom nav)
│   ├── home/                     → Dashboard
│   ├── lessons/                  → Timeline + detail/player
│   ├── tasks/                    → Grid + quiz/exercise players
│   ├── blog/                     → Posts list + detail
│   └── turmas/                   → Classes + join flow
│
├── (teacher)/
│   ├── layout.tsx                → Teacher shell (sidebar + header)
│   ├── dashboard/                → KPIs, charts, alerts
│   ├── lessons/                  → CRUD + attachments
│   ├── tasks/                    → CRUD + question editor + AI gen
│   ├── posts/                    → CRUD + markdown editor
│   ├── turmas/                   → CRUD + member/content management
│   └── students/                 → List + profiles
│
└── api/
    ├── auth/[...all]/            → better-auth handler
    ├── ai/tts/                   → Text-to-speech (Gemini)
    ├── ai/stt/                   → Speech-to-text (Gemini)
    └── upload/                   → R2 presigned URLs
```

## Navigation

### Student Navigation
- **Desktop sidebar**: Home, Aulas, Tarefas, Blog, Challenges (future), Profile
- **Mobile bottom nav** (< 768px): 5 items with icons, 64px height
- **Keyboard shortcuts**: 1-5 to navigate between pages

### Teacher Navigation
- **Desktop sidebar** (240px): Dashboard, Aulas, Tarefas, Posts, Turmas, Alunos
- **Quick action**: "New Content" button (or Cmd+N) opens modal with 4 channel options
- **Keyboard shortcuts**: 1-8 to navigate, Cmd+N for new content, Escape to close modals

### Cross-Navigation
- Teacher sidebar has "View as Student" link
- Student sidebar has "Teacher Panel" link (if user is teacher)

## Middleware (Auth + Routing)

```
middleware.ts
  → better-auth session check
  → Not authenticated → redirect /sign-in
  → Teacher accessing (student)/ → redirect /dashboard
  → Student accessing (teacher)/ → redirect /home
  → No role defined → redirect /sign-up (edge case)
```
