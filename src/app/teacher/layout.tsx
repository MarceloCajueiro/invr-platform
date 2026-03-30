import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createAuth } from "@/lib/auth/server";
import { Sidebar } from "@/components/shared/sidebar";
import { MobileNav } from "@/components/shared/mobile-nav";
import { NewContentModal } from "@/components/teacher/new-content-modal";

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
      <Sidebar role="teacher" userName={session.user.name} />
      <main className="flex-1 max-w-[1200px] px-4 md:px-8 py-6 md:py-8 pb-16 md:pb-0">
        {children}
      </main>
      <MobileNav role="teacher" />
      <NewContentModal />
    </div>
  );
}
