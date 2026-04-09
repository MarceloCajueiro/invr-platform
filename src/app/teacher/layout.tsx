import { Suspense } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createAuth } from "@/lib/auth/server";
import { Sidebar } from "@/components/shared/sidebar";
import { MobileNav } from "@/components/shared/mobile-nav";
import { NewContentModal } from "@/components/teacher/new-content-modal";
import { PreviewToggle } from "@/components/teacher/preview-toggle";

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await createAuth();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  if (session.user.role !== "teacher") {
    redirect("/home");
  }

  return (
    <div className="flex min-h-screen">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-bg-card focus:text-text-primary focus:rounded-md focus:shadow-lg"
      >
        Ir para conteúdo principal
      </a>
      <Sidebar role="teacher" userName={session.user.name} />
      <main id="main-content" className="flex-1 px-4 md:px-8 lg:px-12 py-6 md:py-8 pb-16 md:pb-8">
        <Suspense>
          <PreviewToggle />
        </Suspense>
        {children}
      </main>
      <MobileNav role="teacher" />
      <NewContentModal />
    </div>
  );
}
