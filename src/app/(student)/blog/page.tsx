import { FileText } from "lucide-react";
import Link from "next/link";
import { getStudent } from "@/lib/auth/get-student";
import { getPublishedPosts } from "@/lib/queries/student-blog";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { PostCard } from "@/components/student/post-card";
import { cn } from "@/lib/utils";

const categories = [
  { value: "all", label: "Todos" },
  { value: "tips", label: "Dicas", variant: "tarefas" as BadgeVariant },
  { value: "grammar", label: "Gramática", variant: "aulas" as BadgeVariant },
  { value: "culture", label: "Cultura", variant: "fora" as BadgeVariant },
  {
    value: "vocabulary",
    label: "Vocabulário",
    variant: "challenges" as BadgeVariant,
  },
];

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { student } = await getStudent();
  const params = await searchParams;
  const activeCategory = params.category || "all";

  const posts = await getPublishedPosts(student.teacherId, {
    category: activeCategory,
  });

  return (
    <div className="animate-fade-in">
      <PageHeader title="Blog" description="Dicas, gramática e cultura" />

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.value;
          return (
            <Link
              key={cat.value}
              href={
                cat.value === "all" ? "/blog" : `/blog?category=${cat.value}`
              }
            >
              <Badge
                variant={isActive ? (cat.variant || "fora") : "default"}
                className={cn(
                  "cursor-pointer transition-all text-sm px-3 py-1",
                  isActive && "ring-1 ring-fora/30",
                )}
              >
                {cat.label}
              </Badge>
            </Link>
          );
        })}
      </div>

      {posts.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nenhum post disponível"
          description={
            activeCategory !== "all"
              ? "Não há posts nesta categoria ainda."
              : "Seu professor ainda não publicou posts. Volte em breve!"
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
