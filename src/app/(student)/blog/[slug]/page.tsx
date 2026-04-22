import { redirect } from "next/navigation";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getStudent } from "@/lib/auth/get-student";
import { getPublishedPost } from "@/lib/queries/student-blog";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { BlockContent } from "@/components/ui/block-content";

const categoryLabels: Record<string, string> = {
  tips: "Dicas",
  grammar: "Gramática",
  culture: "Cultura",
  vocabulary: "Vocabulário",
};

const categoryBadgeVariant: Record<string, BadgeVariant> = {
  tips: "tarefas",
  grammar: "aulas",
  culture: "fora",
  vocabulary: "challenges",
};

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { student } = await getStudent();

  const post = await getPublishedPost(slug, student.teacherId);
  if (!post) redirect("/blog");

  return (
    <div className="animate-fade-in">
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        Voltar para o blog
      </Link>

      <article className="max-w-2xl">
        {post.coverImageUrl && (
          <div className="relative w-full max-h-80 aspect-video mb-6 rounded-[var(--radius-md)] overflow-hidden">
            <Image
              src={post.coverImageUrl}
              alt={post.title}
              fill
              unoptimized
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 672px"
            />
          </div>
        )}

        <div className="flex items-center gap-2 mb-3">
          <Badge variant={categoryBadgeVariant[post.category]}>
            {categoryLabels[post.category]}
          </Badge>
          <span className="text-xs text-text-muted">
            {new Date(post.publishedAt ?? post.createdAt).toLocaleDateString("pt-BR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>

        <h1 className="text-2xl font-bold text-text-primary font-display mb-6">
          {post.title}
        </h1>

        {post.content && <BlockContent content={post.content} />}
      </article>
    </div>
  );
}
