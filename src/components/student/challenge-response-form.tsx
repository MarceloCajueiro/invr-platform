"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileUpload, type FileItem } from "@/components/ui/file-upload";
import { submitChallengeResponse } from "@/lib/actions/challenges";

interface ChallengeResponseFormProps {
  challengeId: string;
}

const MB = 1024 * 1024;
const GB = 1024 * MB;

export function ChallengeResponseForm({ challengeId }: ChallengeResponseFormProps) {
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<FileItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!content.trim() && attachments.length === 0) {
      setError("Escreva uma resposta ou anexe um arquivo.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const attachmentData = attachments.map((f) => ({
        type: getFileType(f.name),
        url: f.url,
        name: f.name,
      }));

      await submitChallengeResponse(
        challengeId,
        content,
        JSON.stringify(attachmentData),
      );
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="text-sm font-semibold text-text-primary mb-4">
          Sua Resposta
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escreva sua resposta aqui..."
            rows={4}
            className="w-full px-3 py-2.5 rounded-[var(--radius-sm)] bg-input-bg border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-challenges transition-colors resize-y"
          />

          <div className="space-y-1.5">
            <h4 className="text-xs font-medium text-text-primary">Anexos</h4>
            <FileUpload
              name="attachments"
              accept="image/*,video/*,audio/*"
              maxSize={1 * GB}
              maxFiles={5}
              folder="challenge-responses"
              label="Anexos"
              description="Imagem, vídeo ou áudio. Máximo 5 arquivos."
              onChange={setAttachments}
            />
          </div>

          {error && (
            <p className="text-error text-sm">{error}</p>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={submitting}>
              <Send size={16} />
              {submitting ? "Enviando..." : "Enviar Resposta"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function getFileType(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return "image";
  if (["mp4", "webm", "mov", "avi"].includes(ext)) return "video";
  if (["mp3", "wav", "ogg", "m4a", "aac"].includes(ext)) return "audio";
  return "file";
}
