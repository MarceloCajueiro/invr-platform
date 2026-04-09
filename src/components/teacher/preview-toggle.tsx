"use client";

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const PREVIEW_PAGES = ["/teacher/lessons", "/teacher/tasks", "/teacher/posts", "/teacher/challenges"];

export function PreviewToggle() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const isActive = searchParams.get("preview") === "student";
  const isPreviewablePage = PREVIEW_PAGES.some((p) => pathname.startsWith(p));

  if (!isPreviewablePage) return null;

  function toggle() {
    const params = new URLSearchParams(searchParams.toString());
    if (isActive) {
      params.delete("preview");
    } else {
      params.set("preview", "student");
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  if (isActive) {
    return (
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 mb-6 rounded-[var(--radius-md)] border border-info/20 bg-info/5">
        <div className="flex items-center gap-2 text-sm font-medium text-info">
          <Eye size={16} />
          <span>Visualizando como aluno</span>
        </div>
        <button
          onClick={toggle}
          className="flex items-center gap-1.5 text-sm text-info hover:text-info/80 transition-colors cursor-pointer"
        >
          <X size={14} />
          <span>Sair do preview</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex justify-end mb-4">
      <Button variant="ghost" size="sm" onClick={toggle}>
        <Eye size={16} />
        Ver como aluno
      </Button>
    </div>
  );
}
