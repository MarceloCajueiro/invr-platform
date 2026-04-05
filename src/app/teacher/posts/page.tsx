import Link from "next/link";
import { Plus } from "lucide-react";
import { getTeacher } from "@/lib/auth/get-teacher";
import { getPosts } from "@/lib/queries/posts";
import { getTurmasForSelector } from "@/lib/queries/turmas";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { PostFilters } from "@/components/teacher/post-filters";
import { PostList } from "@/components/teacher/post-list";

interface PostsPageProps {
  searchParams: Promise<{ status?: string; category?: string; turmaId?: string }>;
}

export default async function PostsPage({ searchParams }: PostsPageProps) {
  const { teacher } = await getTeacher();
  const filters = await searchParams;
  const [posts, turmasOptions] = await Promise.all([
    getPosts(teacher.id, filters),
    getTurmasForSelector(teacher.id),
  ]);

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
