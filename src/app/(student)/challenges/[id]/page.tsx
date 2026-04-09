import { redirect } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Calendar, CheckCircle } from "lucide-react";
import Link from "next/link";
import { getStudent } from "@/lib/auth/get-student";
import {
  getStudentChallenge,
  getChallengeResponse,
} from "@/lib/queries/student-challenges";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BlockContent } from "@/components/ui/block-content";
import { ChallengeResponseForm } from "@/components/student/challenge-response-form";

interface ChallengeDetailPageProps {
  params: Promise<{ id: string }>;
}

interface Attachment {
  type: string;
  url: string;
  name: string;
}

export default async function ChallengeDetailPage({
  params,
}: ChallengeDetailPageProps) {
  const { id } = await params;
  const { student } = await getStudent();

  const challenge = await getStudentChallenge(id, student.teacherId);
  if (!challenge) redirect("/challenges");

  const response = await getChallengeResponse(student.id, id);

  const isOverdue = challenge.dueDate && challenge.dueDate.getTime() < Date.now();

  return (
    <div className="animate-fade-in">
      <Link
        href="/challenges"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        Voltar para challenges
      </Link>

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
            {response && (
              <Badge variant="tarefas">
                <CheckCircle size={10} className="mr-1" />
                Respondido
              </Badge>
            )}
          </div>

          <h1 className="text-2xl font-bold text-text-primary font-display mb-4">
            {challenge.title}
          </h1>

          {challenge.description && <BlockContent content={challenge.description} />}
        </div>

        {/* Response section */}
        {response ? (
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-sm font-semibold text-text-primary mb-3">
                Sua Resposta
              </h3>
              {response.content && (
                <p className="text-sm text-text-secondary whitespace-pre-wrap mb-3">
                  {response.content}
                </p>
              )}
              {response.attachments && (
                <div className="flex flex-wrap gap-2">
                  {(JSON.parse(response.attachments) as Attachment[]).map((att, i) => (
                    <Badge key={i} variant="challenges">
                      {att.name}
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-xs text-text-muted mt-3">
                Enviado em {response.createdAt.toLocaleDateString("pt-BR", {
                  day: "numeric",
                  month: "long",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </CardContent>
          </Card>
        ) : isOverdue ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-text-muted">
                O prazo deste desafio já encerrou.
              </p>
            </CardContent>
          </Card>
        ) : (
          <ChallengeResponseForm challengeId={challenge.id} />
        )}
      </article>
    </div>
  );
}
