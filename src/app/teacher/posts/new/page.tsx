import { getTeacher } from "@/lib/auth/get-teacher";
import { PageHeader } from "@/components/ui/page-header";
import { PostForm } from "@/components/teacher/post-form";
import { createPost } from "@/lib/actions/posts";

export default async function NewPostPage() {
  await getTeacher();

  return (
    <div className="animate-fade-in max-w-2xl pb-8">
      <PageHeader title="Novo Post" description="Preencha os dados do novo post." />
      <PostForm action={createPost} />
    </div>
  );
}
