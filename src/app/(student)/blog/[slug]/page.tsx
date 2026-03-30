import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import Markdown from "react-markdown";
import { getStudent } from "@/lib/auth/get-student";
import { getPublishedPost } from "@/lib/queries/student-blog";
import { incrementViewCount } from "@/lib/actions/student-posts";
import { Badge, type BadgeVariant } from "@/components/ui/badge";

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

  // Fire and forget — don't block rendering
  incrementViewCount(post.id);

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
        <div className="flex items-center gap-2 mb-3">
          <Badge variant={categoryBadgeVariant[post.category]}>
            {categoryLabels[post.category]}
          </Badge>
          <span className="text-xs text-text-muted">
            {post.createdAt.toLocaleDateString("pt-BR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>

        <h1 className="text-2xl font-bold text-text-primary font-display mb-6">
          {post.title}
        </h1>

        {post.content && (
          <div className="prose-like space-y-4 text-text-secondary leading-relaxed [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-text-primary [&_h1]:mt-8 [&_h1]:mb-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-text-primary [&_h2]:mt-6 [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-text-primary [&_h3]:mt-4 [&_h3]:mb-2 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-1 [&_li]:text-text-secondary [&_strong]:text-text-primary [&_strong]:font-semibold [&_em]:italic [&_blockquote]:border-l-4 [&_blockquote]:border-fora [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-text-muted [&_code]:bg-bg-light [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono [&_pre]:bg-bg-light [&_pre]:p-4 [&_pre]:rounded-[var(--radius-md)] [&_pre]:overflow-x-auto [&_a]:text-aulas [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:brightness-110">
            <Markdown>{post.content}</Markdown>
          </div>
        )}
      </article>
    </div>
  );
}
