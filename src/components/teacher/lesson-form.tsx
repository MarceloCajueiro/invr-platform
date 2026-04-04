"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileUpload, type FileItem } from "@/components/ui/file-upload";
import { RichEditor } from "@/components/ui/rich-editor/editor";

interface LessonData {
  id: string;
  title: string;
  content: string | null;
  category: "conversation" | "grammar" | "vocabulary" | "listening" | "culture";
  coverImageUrl: string | null;
  durationMinutes: number | null;
}

interface LessonFormProps {
  lesson?: LessonData;
  action: (formData: FormData) => Promise<void>;
}

const categoryOptions = [
  { value: "conversation", label: "Conversação" },
  { value: "grammar", label: "Gramática" },
  { value: "vocabulary", label: "Vocabulário" },
  { value: "listening", label: "Listening" },
  { value: "culture", label: "Cultura" },
];

const MB = 1024 * 1024;

function coverUrlToFileItems(url: string | null | undefined): FileItem[] {
  if (!url) return [];
  return [{ url, name: url.split("/").pop() ?? "cover", size: 0 }];
}

export function LessonForm({ lesson, action }: LessonFormProps) {
  const isEdit = !!lesson;
  const [content, setContent] = useState(lesson?.content ?? "");

  const existingCover = useMemo(
    () => coverUrlToFileItems(lesson?.coverImageUrl),
    [lesson?.coverImageUrl]
  );

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="content" value={content} />

      <Card>
        <CardContent className="pt-6 space-y-5">
          <Input
            label="Título"
            name="title"
            placeholder="Ex: Introdução a conversação"
            defaultValue={lesson?.title ?? ""}
            required
          />

          <Select
            label="Categoria"
            name="category"
            options={categoryOptions}
            defaultValue={lesson?.category ?? "conversation"}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-sm font-semibold text-text-primary">
            Imagem de Capa
          </h3>
          <FileUpload
            name="coverImageFile"
            accept="image/jpeg,image/png,image/webp"
            maxSize={5 * MB}
            maxFiles={1}
            folder="lessons/covers"
            label="Imagem de Capa"
            description="JPG, PNG, WebP. Máximo 5MB"
            existingFiles={existingCover}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Input
            label="Duração (minutos)"
            name="durationMinutes"
            type="number"
            min={0}
            placeholder="Ex: 30"
            defaultValue={lesson?.durationMinutes?.toString() ?? ""}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-sm font-semibold text-text-primary">
            Conteúdo
          </h3>
          <RichEditor
            content={lesson?.content || undefined}
            onChange={setContent}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end pt-4">
        <Button type="submit">
          {isEdit ? "Salvar Alterações" : "Criar Aula"}
        </Button>
      </div>
    </form>
  );
}
