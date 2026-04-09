import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTeacher } from "@/lib/auth/get-teacher";
import { getPost } from "@/lib/queries/posts";
import { updatePost } from "@/lib/actions/posts";
import { PageHeader } from "@/components/ui/page-header";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { PostForm } from "@/components/teacher/post-form";
import { BlockContent } from "@/components/ui/block-content";
import { getTurmasForSelector, getPostTurmaIds } from "@/lib/queries/turmas";
import { isPreviewMode, previewHref } from "@/lib/utils/preview";

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

interface EditPostPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ preview?: string }>;
}

export default async function EditPostPage({ params, searchParams }: EditPostPageProps) {
  const { teacher } = await getTeacher();
  const { id } = await params;
  const sp = await searchParams;

  const post = await getPost(id, teacher.id);
  if (!post) redirect("/teacher/posts");

  if (isPreviewMode(sp)) {
    return (
      <div className="animate-fade-in">
        <Link
          href={previewHref("/teacher/posts", sp)}
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          Voltar para o blog
        </Link>

        {post.status === "draft" && (
          <div className="mb-4">
            <Badge variant="info">Não visível para alunos</Badge>
          </div>
        )}

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

          {post.content && <BlockContent content={post.content} />}
        </article>
      </div>
    );
  }

  const [turmas, selectedTurmaIds] = await Promise.all([
    getTurmasForSelector(teacher.id),
    getPostTurmaIds(post.id),
  ]);

  const updatePostWithId = updatePost.bind(null, post.id);

  return (
    <div className="animate-fade-in max-w-2xl pb-8">
      <PageHeader
        title="Editar Post"
        description={`Editando: ${post.title}`}
      />
      <PostForm
        post={post}
        action={updatePostWithId}
        turmas={turmas}
        selectedTurmaIds={selectedTurmaIds}
      />
    </div>
  );
}
