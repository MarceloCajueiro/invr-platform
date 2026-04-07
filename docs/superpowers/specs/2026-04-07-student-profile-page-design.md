# Student Profile Page

## Summary

Create a `/profile` page for the student interface showing their personal data, teacher, and turmas. This is currently the only place where the student can see who their teacher is and which turmas they belong to. The mobile nav already points to `/profile` but the page doesn't exist yet.

## Decisions

- **Schema:** No changes. Keep `students.teacherId` as 1-to-1 with teacher.
- **Architecture:** Single Server Component page, no client-side state needed.
- **Scope:** Read-only profile. No editing of personal data (YAGNI).

## Page Layout

### Route

`src/app/(student)/profile/page.tsx` — Server Component.

### Sections

**1. Page Header**
- `PageHeader` with title "Meu Perfil"

**2. Meus Dados (Card)**
- Avatar circle with user initials (first letter of first + last name), colored with `bg-aulas`
- User name (bold)
- User email (secondary text)
- "Sair" button (logout) — uses `signOut` from auth client. Important for mobile where sidebar is hidden, but visible on all breakpoints for consistency.
- This section requires `"use client"` for the logout button, so extract as `ProfileUserCard` client component.

**3. Meu Professor (Card)**
- Simple card showing teacher's name
- Label "Professor(a)" above the name

**4. Minhas Turmas**
- Reuse existing `TurmaCard` component in a 1-col (mobile) / 2-col (md+) grid
- If no turmas, show `EmptyState` with link to `/turmas/join`
- "Entrar em uma Turma" button linking to `/turmas/join`

### Responsive Behavior

- Single column on mobile, sections stack vertically
- 2-column grid for turma cards on md+
- Same padding/spacing as other student pages (inherited from layout)

## Data Fetching

### New query: `getStudentProfile(studentId: string)`

Location: `src/lib/queries/student-profile.ts`

Returns:
```typescript
{
  teacherName: string;
}
```

Implementation: Join `students` → `teachers` → `user` table to get the teacher's display name.

### Existing query: `getMyTurmas(studentId: string)`

Already exists in `src/lib/queries/student-turmas.ts`. Reuse as-is.

## New Component

### `ProfileUserCard`

Location: `src/components/student/profile-user-card.tsx`

Client component (`"use client"`) because it needs the `signOut` function.

Props:
```typescript
{
  userName: string;
  userEmail: string;
}
```

Renders: Card with avatar initials, name, email, and logout button.

## Navigation Changes

### Sidebar (desktop)

1. Make the `userName` text in the sidebar footer clickable — wrap in a `Link` to `/profile` for student role only. Teacher sidebar stays unchanged.

2. Add "Turmas" to the student nav items in the sidebar, between "Blog" and before the footer:
```typescript
{ label: "Turmas", href: "/turmas", icon: Users }
```

### Mobile Nav

Already has "Perfil" pointing to `/profile` — no changes needed.

Also add "Turmas" to mobile nav. Current items are Home, Aulas, Tarefas, Blog, Perfil (5 items). Adding Turmas makes 6, which is too many for a bottom nav. Solution: keep 5 items, replace "Blog" with "Turmas" in the mobile nav since turmas is more important for daily use. Blog remains accessible from the sidebar on desktop and from links elsewhere.

**Wait — actually, 5 items is already the max for bottom nav UX best practice.** Better approach: keep the mobile nav as-is (Home, Aulas, Tarefas, Blog, Perfil). Turmas is accessible from the Profile page (turma cards are shown there) and from the `/turmas` route directly. The sidebar on desktop will have Turmas.

## Files to Create

1. `src/app/(student)/profile/page.tsx` — Profile page (Server Component)
2. `src/components/student/profile-user-card.tsx` — User card with logout (Client Component)
3. `src/lib/queries/student-profile.ts` — Teacher name query

## Files to Modify

1. `src/components/shared/sidebar.tsx` — Add Turmas to student nav + make userName clickable for students
2. `src/components/shared/mobile-nav.tsx` — No changes (already has /profile)

## Out of Scope

- Editing profile data (name, email, photo)
- Multiple teachers per student
- Teacher avatar/photo display
- Notification preferences
