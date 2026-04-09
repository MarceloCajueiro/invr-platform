"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AttachmentRenderer } from "@/components/ui/attachment-renderer";
import { ChallengeResponseForm } from "@/components/student/challenge-response-form";
import type { FileItem } from "@/components/ui/file-upload";

interface Attachment {
  type: string;
  url: string;
  name: string;
}

interface ChallengeResponseSectionProps {
  response: {
    id: string;
    content: string | null;
    attachments: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  challengeId: string;
  isOverdue: boolean;
}

export function ChallengeResponseSection({
  response,
  challengeId,
  isOverdue,
}: ChallengeResponseSectionProps) {
  const [editing, setEditing] = useState(false);

  const attachments: Attachment[] = response.attachments
    ? JSON.parse(response.attachments)
    : [];

  const wasEdited =
    response.updatedAt.getTime() - response.createdAt.getTime() > 1000;

  if (editing) {
    const initialAttachments: FileItem[] = attachments.map((att) => ({
      url: att.url,
      name: att.name,
      size: 0,
    }));

    return (
      <ChallengeResponseForm
        challengeId={challengeId}
        initialContent={response.content ?? ""}
        initialAttachments={initialAttachments}
        responseId={response.id}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-text-primary">
            Sua Resposta
          </h3>
          {!isOverdue && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditing(true)}
            >
              <Pencil size={14} />
              Editar
            </Button>
          )}
        </div>

        {response.content && (
          <p className="text-sm text-text-secondary whitespace-pre-wrap mb-3">
            {response.content}
          </p>
        )}

        {attachments.length > 0 && (
          <div className="mb-3">
            <AttachmentRenderer attachments={attachments} />
          </div>
        )}

        <p className="text-xs text-text-muted">
          Enviado em{" "}
          {response.createdAt.toLocaleDateString("pt-BR", {
            day: "numeric",
            month: "long",
            hour: "2-digit",
            minute: "2-digit",
          })}
          {wasEdited && " (editado)"}
        </p>
      </CardContent>
    </Card>
  );
}
