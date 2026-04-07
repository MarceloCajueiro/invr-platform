# Student Profile Page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a `/profile` page for students showing their personal data, teacher name, and turmas — plus add Turmas to the desktop sidebar and make the username clickable to profile.

**Architecture:** Server Component page (`profile/page.tsx`) with one client component for logout (`ProfileUserCard`). New query function to fetch teacher name via join. Reuses existing `getMyTurmas`, `TurmaCard`, `Card`, `PageHeader`, `EmptyState`, and `Button` components.

**Tech Stack:** Next.js 16 App Router, Drizzle ORM, Tailwind CSS v4, Playwright E2E

---

### Task 1: Query — `getStudentProfile`

**Files:**
- Create: `src/lib/queries/student-profile.ts`

- [ ] **Step 1: Create the query function**

```typescript
// src/lib/queries/student-profile.ts
import { getDb } from "@/lib/db";
import { students, teachers, user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getStudentProfile(studentId: string) {
  const db = getDb();

  const [result] = await db
    .select({
      teacherName: user.name,
    })
    .from(students)
    .innerJoin(teachers, eq(students.teacherId, teachers.id))
    .innerJoin(user, eq(teachers.userId, user.id))
    .where(eq(students.id, studentId))
    .limit(1);

  return {
    teacherName: result?.teacherName ?? "Professor",
  };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors related to `student-profile.ts`

- [ ] **Step 3: Commit**

```bash
git add src/lib/queries/student-profile.ts
git commit -m "feat(profile): add getStudentProfile query for teacher name lookup"
```

---

### Task 2: Client Component — `ProfileUserCard`

**Files:**
- Create: `src/components/student/profile-user-card.tsx`

- [ ] **Step 1: Create the client component**

```typescript
// src/components/student/profile-user-card.tsx
"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ProfileUserCardProps {
  userName: string;
  userEmail: string;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function ProfileUserCard({ userName, userEmail }: ProfileUserCardProps) {
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/sign-in");
  }

  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        {/* Avatar with initials */}
        <div className="w-14 h-14 rounded-full bg-aulas flex items-center justify-center text-white font-bold text-lg shrink-0">
          {getInitials(userName)}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-text-primary truncate">{userName}</p>
          <p className="text-sm text-text-secondary truncate">{userEmail}</p>
        </div>

        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          <LogOut size={18} />
          Sair
        </Button>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors related to `profile-user-card.tsx`

- [ ] **Step 3: Commit**

```bash
git add src/components/student/profile-user-card.tsx
git commit -m "feat(profile): add ProfileUserCard client component with logout"
```

---

### Task 3: Profile Page

**Files:**
- Create: `src/app/(student)/profile/page.tsx`

- [ ] **Step 1: Create the profile page**

```typescript
// src/app/(student)/profile/page.tsx
import Link from "next/link";
import { GraduationCap, Users } from "lucide-react";
import { getStudent } from "@/lib/auth/get-student";
import { getStudentProfile } from "@/lib/queries/student-profile";
import { getMyTurmas } from "@/lib/queries/student-turmas";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { TurmaCard } from "@/components/student/turma-card";
import { ProfileUserCard } from "@/components/student/profile-user-card";

export default async function ProfilePage() {
  const { user, student } = await getStudent();
  const [profile, turmas] = await Promise.all([
    getStudentProfile(student.id),
    getMyTurmas(student.id),
  ]);

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Meu Perfil" />

      {/* User data + logout */}
      <ProfileUserCard userName={user.name} userEmail={user.email} />

      {/* Teacher */}
      <Card>
        <CardContent className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-aulas-bg flex items-center justify-center shrink-0">
            <GraduationCap size={20} className="text-aulas" />
          </div>
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wide">Professor(a)</p>
            <p className="font-medium text-text-primary">{profile.teacherName}</p>
          </div>
        </CardContent>
      </Card>

      {/* Turmas */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold font-display text-text-primary">
            Minhas Turmas
          </h2>
          <Link href="/turmas/join">
            <Button variant="ghost" size="sm">
              Entrar em uma Turma
            </Button>
          </Link>
        </div>

        {turmas.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Nenhuma turma"
            description="Você ainda não faz parte de nenhuma turma. Peça o código de convite ao seu professor!"
            action={
              <Link href="/turmas/join">
                <Button>Entrar em uma Turma</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {turmas.map((turma) => (
              <TurmaCard key={turma.id} turma={turma} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors related to `profile/page.tsx`

- [ ] **Step 3: Commit**

```bash
git add src/app/\(student\)/profile/page.tsx
git commit -m "feat(profile): add student profile page with teacher and turmas"
```

---

### Task 4: Sidebar Navigation Updates

**Files:**
- Modify: `src/components/shared/sidebar.tsx`

- [ ] **Step 1: Add Turmas to student nav and make username clickable**

In `src/components/shared/sidebar.tsx`, make these changes:

1. Add `Users` to the existing import from lucide-react (it's already imported).
2. Add `Link` component import (already imported).
3. Add Turmas item to `studentNav` array after Blog:

```typescript
const studentNav: NavItem[] = [
  { label: "Home", href: "/home", icon: Home },
  { label: "Aulas", href: "/lessons", icon: BookOpen, color: "aulas" },
  { label: "Tarefas", href: "/tasks", icon: ClipboardList, color: "tarefas" },
  { label: "Blog", href: "/blog", icon: FileText, color: "fora" },
  { label: "Turmas", href: "/turmas", icon: Users },
];
```

4. Update the `SidebarProps` to include `role` so we can conditionally link the username:

The `role` prop is already available. Wrap the username in the footer with a `Link` to `/profile` when role is `student`:

Replace the user name `<span>` in the footer:

```tsx
{role === "student" ? (
  <Link
    href="/profile"
    className="text-sm text-white/80 truncate flex-1 min-w-0 hover:text-white transition-colors"
  >
    {userName}
  </Link>
) : (
  <span className="text-sm text-white/80 truncate flex-1 min-w-0">
    {userName}
  </span>
)}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/shared/sidebar.tsx
git commit -m "feat(nav): add Turmas to student sidebar and link username to profile"
```

---

### Task 5: E2E Test — Profile Page

**Files:**
- Modify: `e2e/student.spec.ts`

- [ ] **Step 1: Add profile E2E tests**

Add these test blocks at the end of the `test.describe.serial("Student Interface")` block in `e2e/student.spec.ts`, before the closing `});`:

```typescript
// ---- Profile ----
test.describe("CT-49: Profile page", () => {
  test("deve mostrar dados do aluno, professor e turma", async ({ page }) => {
    await page.goto("/profile");
    // Student name and email
    await expect(page.getByText("Marcelo Cajueiro")).toBeVisible();
    await expect(page.getByText("marcelo@fluent.app")).toBeVisible();
    // Teacher name
    await expect(page.getByText("Franciely Silva")).toBeVisible();
    // Turma
    await expect(page.getByText("Turma Iniciante 2026")).toBeVisible();
    // Logout button
    await expect(page.getByRole("button", { name: /sair/i })).toBeVisible();
  });
});

test.describe("CT-50: Sidebar has Turmas link", () => {
  test("deve mostrar link de Turmas na sidebar do aluno", async ({ page }) => {
    await page.goto("/home");
    const sidebar = page.locator("aside");
    const turmasLink = sidebar.getByRole("link", { name: /^turmas$/i });
    await expect(turmasLink).toBeVisible();
    await turmasLink.click();
    await page.waitForURL("**/turmas", { timeout: 5000 });
  });
});

test.describe("CT-51: Sidebar username links to profile", () => {
  test("deve navegar para perfil ao clicar no nome na sidebar", async ({ page }) => {
    await page.goto("/home");
    const sidebar = page.locator("aside");
    await sidebar.getByRole("link", { name: /marcelo/i }).click();
    await page.waitForURL("**/profile", { timeout: 5000 });
    await expect(page.getByText("Meu Perfil")).toBeVisible();
  });
});
```

- [ ] **Step 2: Run E2E tests to verify**

Run: `npx playwright test --project=student --grep "CT-49|CT-50|CT-51"`
Expected: All 3 tests pass

- [ ] **Step 3: Also update the CT-40 sidebar navigation test**

The existing CT-40 test checks sidebar nav links. Add Turmas to the list:

In the `navLinks` array inside CT-40, add after the blog entry:

```typescript
const navLinks = [
  { name: /^aulas$/i, url: "/lessons" },
  { name: /^tarefas$/i, url: "/tasks" },
  { name: /^blog$/i, url: "/blog" },
  { name: /^turmas$/i, url: "/turmas" },
  { name: /^home$/i, url: "/home" },
];
```

- [ ] **Step 4: Run full student E2E suite**

Run: `npx playwright test --project=student`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add e2e/student.spec.ts
git commit -m "test(profile): add E2E tests for student profile page and sidebar navigation"
```

---

### Task 6: TypeScript Check + Manual Verification

- [ ] **Step 1: Full type check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 2: Run all E2E tests**

Run: `npx playwright test`
Expected: All tests pass (student, teacher, auth projects)

- [ ] **Step 3: Manual browser verification**

Navigate in the browser to validate:
1. Go to `/profile` — check user data card, teacher name, turma card render correctly
2. Check sidebar on desktop — "Turmas" link visible, username clickable to `/profile`
3. Check mobile nav — "Perfil" tab navigates to `/profile`
4. Test logout button works from profile page

- [ ] **Step 4: Final commit if any fixes needed**

Only if adjustments were made during manual verification.
