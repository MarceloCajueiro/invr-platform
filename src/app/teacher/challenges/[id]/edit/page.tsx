import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Calendar } from "lucide-react";
import { getTeacher } from "@/lib/auth/get-teacher";
import { getChallenge } from "@/lib/queries/challenges";
import { updateChallenge } from "@/lib/actions/challenges";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ChallengeForm } from "@/components/teacher/challenge-form";
import { BlockContent } from "@/components/ui/block-content";
import { getTurmasForSelector, getChallengeTurmaIds } from "@/lib/queries/turmas";
import { isPreviewMode, previewHref } from "@/lib/utils/preview";

interface EditChallengePageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ preview?: string }>;
}

export default async function EditChallengePage({ params, searchParams }: EditChallengePageProps) {
  const { teacher } = await getTeacher();
  const { id } = await params;
  const sp = await searchParams;

  const challenge = await getChallenge(id, teacher.id);
  if (!challenge) redirect("/teacher/challenges");

  if (isPreviewMode(sp)) {
    return (
      <div className="animate-fade-in">
        <Link
          href={previewHref("/teacher/challenges", sp)}
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          Voltar para challenges
        </Link>

        {challenge.status === "draft" && (
          <div className="mb-4">
            <Badge variant="info">Não visível para alunos</Badge>
          </div>
        )}

        <article className="max-w-2xl space-y-6">
          {challenge.coverImageUrl && (
            <div className="relative w-full max-h-80 aspect-video rounded-[var(--radius-md)] overflow-hidden">
              <Image
                src={challenge.coverImageUrl}
                alt={challenge.title}
                fill
                unoptimized
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 672px"
              />
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="challenges">Challenge</Badge>
              {challenge.dueDate && (
                <span className="text-xs text-text-muted flex items-center gap-1">
                  <Calendar size={12} />
                  Prazo: {challenge.dueDate.toLocaleDateString("pt-BR")}
                </span>
              )}
            </div>

            <h1 className="text-2xl font-bold text-text-primary font-display mb-4">
              {challenge.title}
            </h1>

            {challenge.description && <BlockContent content={challenge.description} />}
          </div>

          {/* Read-only response area placeholder */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-sm font-semibold text-text-primary mb-3">
                Sua Resposta
              </h3>
              <textarea
                disabled
                placeholder="Área de resposta do aluno..."
                rows={4}
                className="w-full px-3 py-2.5 rounded-[var(--radius-sm)] bg-input-bg border border-border text-text-muted cursor-not-allowed resize-y"
              />
              <div className="flex justify-center mt-4">
                <Badge variant="info" className="text-sm px-4 py-1.5">
                  Modo preview — interação desabilitada
                </Badge>
              </div>
            </CardContent>
          </Card>
        </article>
      </div>
    );
  }

  const [turmas, selectedTurmaIds] = await Promise.all([
    getTurmasForSelector(teacher.id),
    getChallengeTurmaIds(challenge.id),
  ]);

  const updateChallengeWithId = updateChallenge.bind(null, challenge.id);

  return (
    <div className="animate-fade-in max-w-2xl pb-8">
      <PageHeader
        title="Editar Challenge"
        description={`Editando: ${challenge.title}`}
      />
      <ChallengeForm
        challenge={challenge}
        action={updateChallengeWithId}
        turmas={turmas}
        selectedTurmaIds={selectedTurmaIds}
      />
    </div>
  );
}
