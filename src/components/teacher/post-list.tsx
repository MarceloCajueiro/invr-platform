import Link from "next/link";
import { FileText, Pencil, Eye, Star, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { deletePost, togglePostStatus } from "@/lib/actions/posts";
import { DeleteButton } from "@/components/teacher/delete-button";
import { TurmaBadges } from "@/components/teacher/turma-badges";
import type { BadgeVariant } from "@/components/ui/badge";

interface Post {
  id: string;
  title: string;
  category: "tips" | "grammar" | "culture" | "vocabulary";
  status: "draft" | "published";
  publishedAt: Date | null;
  featured: boolean;
  viewCount: number;
  createdAt: Date;
  turmas: { id: string; name: string; color: string | null }[];
}

function isScheduled(publishedAt: Date | null | undefined): boolean {
  if (!publishedAt) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(publishedAt).getTime() > today.getTime();
}

function formatScheduledDate(date: Date): string {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

interface PostListProps {
  posts: Post[];
}

const categoryLabels: Record<Post["category"], string> = {
  tips: "Dicas",
  grammar: "Gramática",
  culture: "Cultura",
  vocabulary: "Vocabulário",
};

const categoryBadgeVariant: Record<Post["category"], BadgeVariant> = {
  tips: "tarefas",
  grammar: "aulas",
  culture: "fora",
  vocabulary: "challenges",
};

const statusLabels: Record<Post["status"], string> = {
  draft: "Rascunho",
  published: "Publicado",
};

export function PostList({ posts }: PostListProps) {
  if (posts.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="Nenhum post encontrado"
        description="Crie seu primeiro post para compartilhar conteúdo."
        action={
          <Link href="/teacher/posts/new">
            <Button>Novo Post</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <Card key={post.id} className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-semibold text-text-primary truncate">
                  {post.title}
                </h3>
                <Badge variant={categoryBadgeVariant[post.category]}>
                  {categoryLabels[post.category]}
                </Badge>
                {post.status === "published" && isScheduled(post.publishedAt) ? (
                  <Badge variant="scheduled">
                    <Clock size={10} className="mr-1" />
                    Agendado · {formatScheduledDate(post.publishedAt!)}
                  </Badge>
                ) : (
                  <Badge variant={post.status}>
                    {statusLabels[post.status]}
                  </Badge>
                )}
                {post.featured && (
                  <Badge variant="default">
                    <Star size={10} className="mr-1" />
                    Destaque
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-text-muted">
                <span className="flex items-center gap-1">
                  <Eye size={12} />
                  {post.viewCount} visualizações
                </span>
                <span>
                  {post.createdAt.toLocaleDateString("pt-BR")}
                </span>
                {post.turmas.length > 0 && (
                  <>
                    <span className="text-border">·</span>
                    <TurmaBadges turmas={post.turmas} />
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <form action={togglePostStatus}>
                <input type="hidden" name="id" value={post.id} />
                <Button variant="ghost" size="sm" type="submit">
                  {post.status === "draft" ? "Publicar" : "Despublicar"}
                </Button>
              </form>

              <Link href={`/teacher/posts/${post.id}/edit`}>
                <Button variant="secondary" size="sm">
                  <Pencil size={14} />
                  Editar
                </Button>
              </Link>

              <DeleteButton action={deletePost} id={post.id} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
