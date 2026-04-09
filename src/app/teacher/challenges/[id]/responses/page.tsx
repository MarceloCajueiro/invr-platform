import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { getTeacher } from "@/lib/auth/get-teacher";
import { getChallenge, getChallengeResponses } from "@/lib/queries/challenges";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { AttachmentRenderer } from "@/components/ui/attachment-renderer";

interface ResponsesPageProps {
  params: Promise<{ id: string }>;
}

interface Attachment {
  type: string;
  url: string;
  name: string;
}

export default async function ResponsesPage({ params }: ResponsesPageProps) {
  const { teacher } = await getTeacher();
  const { id } = await params;

  const challenge = await getChallenge(id, teacher.id);
  if (!challenge) redirect("/teacher/challenges");

  const responses = await getChallengeResponses(id, teacher.id);

  return (
    <div className="animate-fade-in">
      <Link
        href="/teacher/challenges"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        Voltar para challenges
      </Link>

      <PageHeader
        title={`Respostas: ${challenge.title}`}
        description={`${responses.length} ${responses.length === 1 ? "resposta" : "respostas"} recebida${responses.length === 1 ? "" : "s"}`}
      />

      {responses.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nenhuma resposta ainda"
          description="Os alunos ainda não responderam este desafio."
        />
      ) : (
        <div className="space-y-4">
          {responses.map((response) => {
            const attachments: Attachment[] = response.attachments
              ? JSON.parse(response.attachments)
              : [];

            return (
              <Card key={response.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-text-primary">
                      {response.studentName}
                    </span>
                    <span className="text-xs text-text-muted">
                      {response.createdAt.toLocaleDateString("pt-BR", {
                        day: "numeric",
                        month: "long",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {response.content && (
                    <p className="text-sm text-text-secondary whitespace-pre-wrap mb-3">
                      {response.content}
                    </p>
                  )}

                  {attachments.length > 0 && (
                    <AttachmentRenderer attachments={attachments} />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
