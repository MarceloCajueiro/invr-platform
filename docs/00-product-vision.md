# Product Vision

## What is Fluent?

Fluent is a modern, AI-powered English language learning platform that bridges the gap between private English teachers and EdTech platforms. Unlike generic language apps, Fluent empowers individual teachers with a unified CMS, gamified student experience, and AI-assisted content generation.

## Market Thesis

Private English teachers are squeezed between two forces:

- **Big EdTech** (Duolingo, Cambly, Busuu) — scale and gamification, but zero personalization
- **Conversational AI** (ChatGPT, etc.) — cheap and always available, but no human relationship

The surviving differentiator is the **human relationship** and real personalization only a teacher who knows the student can deliver. However, this alone isn't enough without proper tooling.

Fluent puts the same technological arsenal (AI, gamification, platform) in the hands of private teachers — combining human personalization with the digital experience the market now demands.

## Problems We Solve

**For Teachers:**
- Scattered tools (WhatsApp, Google Drive, spreadsheets)
- Lack of student engagement between classes
- Tedious, repetitive content creation
- Poor visibility into student progress

**For Students:**
- No structured practice outside class
- Low motivation without gamification
- No instant feedback on exercises
- Disconnected learning experience

## Value Propositions

**Teacher:**
- Complete CMS for lessons and exercises
- AI-generated exercises (quiz, listening, fill-the-gaps, writing)
- Dashboard with KPIs and inactivity alerts
- Class management with linked content
- AI-assisted correction of writing exercises

**Student:**
- Modern app-like experience with gamification
- AI-personalized tasks and feedback
- Daily progress with streaks and XP
- Challenges connecting English to real life
- Instant feedback on exercises

## Business Model

SaaS multi-tenant, charging per teacher:

| Plan | Limits | Price |
|------|--------|-------|
| **Free** | 1 class, 5 students, no AI | R$ 0 |
| **Pro** | Unlimited classes/students, full AI | R$ 49-99/month |
| **School** | Multi-teacher, analytics, admin | R$ 199-299/month |

Payment integration planned via Asaas.

## Personas

**Franciely (Teacher)**
- 30 years old, private English teacher
- 2 classes, 12 students
- Wants to automate exercise creation
- Needs better visibility into student progress
- First user and co-founder

**Marcelo (Student)**
- 28 years old, wants to improve English for work
- Needs quick practice sessions and motivation
- Likes gamification and competition
- Wants content tied to his lessons

## Success Metrics (Pilot)

- \>70% weekly platform access
- Student retention >3 months
- Teacher using it as primary tool (not supplementary)
- NPS >8

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Runtime | Cloudflare Workers (@opennextjs/cloudflare) |
| Auth | better-auth (self-hosted, D1) |
| Database | Cloudflare D1 (SQLite) |
| ORM | Drizzle ORM |
| Storage | Cloudflare R2 |
| CSS | Tailwind CSS v4 |
| Email | Resend |
| AI (LLM) | Groq |
| AI (TTS/STT) | Google Gemini Flash |
| Icons | Lucide React |
| Fonts | Bricolage Grotesque, Outfit, JetBrains Mono |

### Infrastructure Rationale

- **Cloudflare Workers + D1 + R2**: Zero cold start, globally distributed, generous free tiers, single ecosystem
- **better-auth**: Self-hosted auth on D1, no vendor lock-in, proven compatibility with Cloudflare Workers
- **Drizzle ORM**: Type-safe, lightweight, supports D1 and PostgreSQL (migration path if needed)
- **Groq + Gemini**: Free tiers sufficient for pilot (~$1.50/month for 12 students)
- **Resend**: Simple email API for invites and notifications
