"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileUpload, type FileItem } from "@/components/ui/file-upload";
import { BlockEditor } from "@/components/ui/block-editor";
import { TurmaSelector } from "@/components/teacher/turma-selector";

interface ChallengeData {
  id: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  dueDate: Date | null;
  publishedAt: Date | null;
}

interface ChallengeFormProps {
  challenge?: ChallengeData;
  action: (formData: FormData) => Promise<void>;
  turmas?: { id: string; name: string; color: string | null }[];
  selectedTurmaIds?: string[];
}

const MB = 1024 * 1024;

function coverUrlToFileItems(url: string | null | undefined): FileItem[] {
  if (!url) return [];
  return [{ url, name: url.split("/").pop() ?? "cover", size: 0 }];
}

function formatDateForInput(date: Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function ChallengeForm({
  challenge,
  action,
  turmas = [],
  selectedTurmaIds = [],
}: ChallengeFormProps) {
  const isEdit = !!challenge;
  const [description, setDescription] = useState(challenge?.description ?? "");

  const existingCover = useMemo(
    () => coverUrlToFileItems(challenge?.coverImageUrl),
    [challenge?.coverImageUrl],
  );

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={action} className="space-y-5">
          <input type="hidden" name="description" value={description} />

          <Input
            label="Título"
            name="title"
            placeholder="Ex: My Daily Routine"
            defaultValue={challenge?.title ?? ""}
            required
          />

          <Input
            label="Prazo"
            name="dueDate"
            type="date"
            defaultValue={formatDateForInput(challenge?.dueDate)}
          />

          <div className="space-y-1.5">
            <Input
              label="Data de publicação"
              name="publishedAt"
              type="date"
              defaultValue={
                formatDateForInput(challenge?.publishedAt) ||
                new Date().toISOString().split("T")[0]
              }
            />
            <p className="text-xs text-text-muted">
              Pode agendar para o futuro — alunos só veem a partir dessa data.
            </p>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-sm font-semibold text-text-primary">
              Imagem de Capa
            </h3>
            <FileUpload
              name="coverImageFile"
              accept="image/jpeg,image/png,image/webp"
              maxSize={5 * MB}
              maxFiles={1}
              folder="challenges/covers"
              label="Imagem de Capa"
              description="JPG, PNG, WebP. Máximo 5MB"
              existingFiles={existingCover}
            />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-sm font-semibold text-text-primary">
              Descrição do Desafio
            </h3>
            <BlockEditor
              initialContent={challenge?.description || undefined}
              onChange={setDescription}
            />
          </div>

          {turmas.length > 0 && (
            <TurmaSelector turmas={turmas} selectedIds={selectedTurmaIds} />
          )}

          <div className="flex justify-end pt-4">
            <Button type="submit">
              {isEdit ? "Salvar Alterações" : "Criar Challenge"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
