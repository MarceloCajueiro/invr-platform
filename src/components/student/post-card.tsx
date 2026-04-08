import Link from "next/link";
import Image from "next/image";
import { FileText, Star } from "lucide-react";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type PostCategory = "tips" | "grammar" | "culture" | "vocabulary";

interface PostCardProps {
  post: {
    id: string;
    title: string;
    slug: string;
    content: string | null;
    coverImageUrl: string | null;
    category: PostCategory;
    featured: boolean;
    createdAt: Date;
  };
}

const categoryLabels: Record<PostCategory, string> = {
  tips: "Dicas",
  grammar: "Gramática",
  culture: "Cultura",
  vocabulary: "Vocabulário",
};

const categoryBadgeVariant: Record<PostCategory, BadgeVariant> = {
  tips: "tarefas",
  grammar: "aulas",
  culture: "fora",
  vocabulary: "challenges",
};

const categoryPlaceholderColors: Record<PostCategory, string> = {
  tips: "bg-gradient-to-br from-tarefas-light to-tarefas-bg",
  grammar: "bg-gradient-to-br from-aulas-light to-aulas-bg",
  culture: "bg-gradient-to-br from-fora-light to-fora-bg",
  vocabulary: "bg-gradient-to-br from-challenges-light to-challenges-bg",
};

function getExcerpt(content: string | null): string {
  if (!content) return "";
  try {
    const doc = JSON.parse(content);
    const texts: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function walk(node: any) {
      if (node.text) texts.push(node.text);
      if (Array.isArray(node.content)) node.content.forEach(walk);
    }
    walk(doc);
    const plain = texts.join(" ").trim();
    return plain.length > 120 ? `${plain.slice(0, 120)}...` : plain;
  } catch {
    return content.length > 120 ? `${content.slice(0, 120)}...` : content;
  }
}

export function PostCard({ post }: PostCardProps) {
  return (
    <Link href={`/blog/${post.slug}`}>
      <Card
        hoverable
        className={`overflow-hidden ${post.featured ? "ring-2 ring-fora/40 bg-fora-bg/30" : ""}`}
      >
        {/* Cover image — fixed 16:9 aspect ratio */}
        <div className="aspect-video relative">
          {post.coverImageUrl ? (
            <Image
              src={post.coverImageUrl}
              alt={post.title}
              fill
              unoptimized
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div
              className={`w-full h-full flex items-center justify-center ${categoryPlaceholderColors[post.category]}`}
            >
              <FileText size={32} className="text-text-muted opacity-50" />
            </div>
          )}
        </div>

        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={categoryBadgeVariant[post.category]}>
              {categoryLabels[post.category]}
            </Badge>
            {post.featured && (
              <span className="flex items-center gap-1 text-xs font-medium text-fora">
                <Star size={12} className="fill-fora" />
                Destaque
              </span>
            )}
          </div>

          <h3 className="font-medium text-text-primary mb-1">{post.title}</h3>

          {post.content && (
            <p className="text-sm text-text-secondary line-clamp-2 mb-3">
              {getExcerpt(post.content)}
            </p>
          )}

          <div className="text-xs text-text-muted">
            <span>{post.createdAt.toLocaleDateString("pt-BR")}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
