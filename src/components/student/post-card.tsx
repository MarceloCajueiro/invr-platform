import Link from "next/link";
import { Eye } from "lucide-react";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface PostCardProps {
  post: {
    id: string;
    title: string;
    slug: string;
    content: string | null;
    category: "tips" | "grammar" | "culture" | "vocabulary";
    viewCount: number;
    createdAt: Date;
  };
}

const categoryLabels: Record<PostCardProps["post"]["category"], string> = {
  tips: "Dicas",
  grammar: "Gramática",
  culture: "Cultura",
  vocabulary: "Vocabulário",
};

const categoryBadgeVariant: Record<
  PostCardProps["post"]["category"],
  BadgeVariant
> = {
  tips: "tarefas",
  grammar: "aulas",
  culture: "fora",
  vocabulary: "challenges",
};

function getExcerpt(content: string | null): string {
  if (!content) return "";
  const plain = content.replace(/[#*_~`>\[\]()!-]/g, "").trim();
  return plain.length > 120 ? `${plain.slice(0, 120)}...` : plain;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <Link href={`/blog/${post.slug}`}>
      <Card hoverable className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant={categoryBadgeVariant[post.category]}>
            {categoryLabels[post.category]}
          </Badge>
        </div>

        <h3 className="font-medium text-text-primary mb-1">{post.title}</h3>

        {post.content && (
          <p className="text-sm text-text-secondary line-clamp-2 mb-3">
            {getExcerpt(post.content)}
          </p>
        )}

        <div className="flex items-center gap-3 text-xs text-text-muted">
          <span className="flex items-center gap-1">
            <Eye size={12} />
            {post.viewCount}
          </span>
          <span>{post.createdAt.toLocaleDateString("pt-BR")}</span>
        </div>
      </Card>
    </Link>
  );
}
