"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  FileText,
  Users,
  GraduationCap,
  Home,
  LogOut,
} from "lucide-react";
import { signOut } from "@/lib/auth/client";
import { NavLinkPending } from "@/components/shared/nav-progress";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number }>;
  color?: string;
};

const teacherNav: NavItem[] = [
  { label: "Dashboard", href: "/teacher/dashboard", icon: LayoutDashboard },
  { label: "Aulas", href: "/teacher/lessons", icon: BookOpen, color: "aulas" },
  { label: "Tarefas", href: "/teacher/tasks", icon: ClipboardList, color: "tarefas" },
  { label: "Posts", href: "/teacher/posts", icon: FileText, color: "fora" },
  { label: "Turmas", href: "/teacher/turmas", icon: Users },
  { label: "Alunos", href: "/teacher/students", icon: GraduationCap },
];

const studentNav: NavItem[] = [
  { label: "Home", href: "/home", icon: Home },
  { label: "Aulas", href: "/lessons", icon: BookOpen, color: "aulas" },
  { label: "Tarefas", href: "/tasks", icon: ClipboardList, color: "tarefas" },
  { label: "Blog", href: "/blog", icon: FileText, color: "fora" },
  { label: "Turmas", href: "/turmas", icon: Users },
];

const PREVIEW_PAGES = new Set(["/teacher/lessons", "/teacher/tasks", "/teacher/posts"]);

type SidebarProps = {
  role: "teacher" | "student";
  userName: string;
};

export function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPreview = searchParams.get("preview") === "student";
  const items = role === "teacher" ? teacherNav : studentNav;

  function getHref(item: NavItem): string {
    if (isPreview && PREVIEW_PAGES.has(item.href)) {
      return `${item.href}?preview=student`;
    }
    return item.href;
  }

  async function handleSignOut() {
    await signOut();
    router.push("/sign-in");
  }

  return (
    <aside className="hidden md:flex flex-col w-48 lg:w-60 bg-bg-dark text-white min-h-screen">
      {/* Logo */}
      <div className="px-6 py-6">
        <span className="text-xl font-bold font-display">Fluent</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {items.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={getHref(item)}
              prefetch={false}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-sm)] text-sm transition-colors relative ${
                isActive
                  ? "bg-white/10 text-white"
                  : "text-sidebar-muted hover:text-white hover:bg-white/5"
              }`}
            >
              {isActive && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                  style={{
                    backgroundColor: item.color
                      ? `var(--color-${item.color})`
                      : "#ffffff",
                  }}
                />
              )}
              <Icon size={18} />
              {item.label}
              <NavLinkPending />
            </Link>
          );
        })}
      </nav>

      {/* User / Sign Out */}
      <div className="border-t border-white/10 px-6 py-4 flex items-center gap-3">
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
        <button
          onClick={handleSignOut}
          className="text-sidebar-muted hover:text-white transition-colors cursor-pointer"
          aria-label="Sign out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}
