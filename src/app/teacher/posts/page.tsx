import Link from "next/link";
import { Plus } from "lucide-react";
import { getTeacher } from "@/lib/auth/get-teacher";
import { getPosts } from "@/lib/queries/posts";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { PostFilters } from "@/components/teacher/post-filters";
import { PostList } from "@/components/teacher/post-list";

interface PostsPageProps {
  searchParams: Promise<{ status?: string; category?: string }>;
}

export default async function PostsPage({ searchParams }: PostsPageProps) {
  const { teacher } = await getTeacher();
  const filters = await searchParams;
  const posts = await getPosts(teacher.id, filters);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Posts"
        description="Gerencie seus posts e conteudos do blog."
        action={
          <Link href="/teacher/posts/new">
            <Button>
              <Plus size={16} />
              Novo Post
            </Button>
          </Link>
        }
      />

      <PostFilters />

      <PostList posts={posts} />
    </div>
  );
}
