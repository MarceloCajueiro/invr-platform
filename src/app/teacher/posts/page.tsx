import Link from "next/link";
import { Plus, FileText } from "lucide-react";
import { getTeacher } from "@/lib/auth/get-teacher";
import { getPosts } from "@/lib/queries/posts";
import { getTurmasForSelector } from "@/lib/queries/turmas";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PostFilters } from "@/components/teacher/post-filters";
import { PostList } from "@/components/teacher/post-list";
import { PostCard } from "@/components/student/post-card";
import { DraftOverlay } from "@/components/teacher/draft-overlay";
import { isPreviewMode, previewHref } from "@/lib/utils/preview";

interface PostsPageProps {
  searchParams: Promise<{ status?: string; category?: string; turmaId?: string; preview?: string }>;
}

export default async function PostsPage({ searchParams }: PostsPageProps) {
  const { teacher } = await getTeacher();
  const filters = await searchParams;
  const preview = isPreviewMode(filters);
  const [posts, turmasOptions] = await Promise.all([
    getPosts(teacher.id, filters),
    getTurmasForSelector(teacher.id),
  ]);

  if (preview) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title="Blog"
          description="Dicas, gramática e cultura"
        />

        {posts.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Nenhum post disponível"
            description="Seu professor ainda não publicou posts. Volte em breve!"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {posts.map((post) => (
              <DraftOverlay key={post.id} isDraft={post.status === "draft"}>
                <PostCard
                  post={post}
                  href={previewHref(`/teacher/posts/${post.id}/edit`, filters)}
                />
              </DraftOverlay>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Posts"
        description="Gerencie seus posts e conteúdos do blog."
        action={
          <Link href="/teacher/posts/new">
            <Button>
              <Plus size={16} />
              Novo Post
            </Button>
          </Link>
        }
      />

      <PostFilters turmas={turmasOptions} />

      <PostList posts={posts} />
    </div>
  );
}
