import { redirect } from "next/navigation";
import { getTeacher } from "@/lib/auth/get-teacher";
import { getPost } from "@/lib/queries/posts";
import { updatePost } from "@/lib/actions/posts";
import { PageHeader } from "@/components/ui/page-header";
import { PostForm } from "@/components/teacher/post-form";
import { getTurmasForSelector, getPostTurmaIds } from "@/lib/queries/turmas";

interface EditPostPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { teacher } = await getTeacher();
  const { id } = await params;

  const post = await getPost(id, teacher.id);
  if (!post) redirect("/teacher/posts");

  const [turmas, selectedTurmaIds] = await Promise.all([
    getTurmasForSelector(teacher.id),
    getPostTurmaIds(post.id),
  ]);

  const updatePostWithId = updatePost.bind(null, post.id);

  return (
    <div className="animate-fade-in max-w-2xl pb-8">
      <PageHeader
        title="Editar Post"
        description={`Editando: ${post.title}`}
      />
      <PostForm
        post={post}
        action={updatePostWithId}
        turmas={turmas}
        selectedTurmaIds={selectedTurmaIds}
      />
    </div>
  );
}
