"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  Users,
  GraduationCap,
  Home,
  FileText,
  User,
} from "lucide-react";

type MobileNavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number }>;
};

const teacherMobileNav: MobileNavItem[] = [
  { label: "Dashboard", href: "/teacher/dashboard", icon: LayoutDashboard },
  { label: "Aulas", href: "/teacher/lessons", icon: BookOpen },
  { label: "Tarefas", href: "/teacher/tasks", icon: ClipboardList },
  { label: "Turmas", href: "/teacher/turmas", icon: Users },
  { label: "Alunos", href: "/teacher/students", icon: GraduationCap },
];

const studentMobileNav: MobileNavItem[] = [
  { label: "Home", href: "/home", icon: Home },
  { label: "Aulas", href: "/lessons", icon: BookOpen },
  { label: "Tarefas", href: "/tasks", icon: ClipboardList },
  { label: "Blog", href: "/blog", icon: FileText },
  { label: "Perfil", href: "/profile", icon: User },
];

type MobileNavProps = {
  role: "teacher" | "student";
};

export function MobileNav({ role }: MobileNavProps) {
  const pathname = usePathname();
  const items = role === "teacher" ? teacherMobileNav : studentMobileNav;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-border flex items-center justify-around z-50">
      {items.map((item) => {
        const isActive = pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 ${
              isActive ? "text-aulas" : "text-text-muted"
            }`}
          >
            <Icon size={20} />
            <span className="text-[10px]">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
