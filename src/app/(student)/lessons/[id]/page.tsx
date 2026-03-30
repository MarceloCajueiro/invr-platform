import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getStudent } from "@/lib/auth/get-student";
import {
  getStudentLesson,
  getLessonProgress,
} from "@/lib/queries/student-lessons";
import { LessonPlayer } from "@/components/student/lesson-player";

export default async function LessonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { student } = await getStudent();

  const lesson = await getStudentLesson(id, student.teacherId);
  if (!lesson) redirect("/lessons");

  const progress = await getLessonProgress(student.id, id);

  return (
    <div>
      <Link
        href="/lessons"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        Voltar para aulas
      </Link>

      <LessonPlayer
        lesson={lesson}
        initialProgress={progress?.progress ?? 0}
      />
    </div>
  );
}
