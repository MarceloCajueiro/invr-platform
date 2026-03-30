"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface LessonData {
  id: string;
  title: string;
  description: string | null;
  category: "conversation" | "grammar" | "vocabulary" | "listening" | "culture";
  videoUrl: string | null;
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

export function LessonForm({ lesson, action }: LessonFormProps) {
  const isEdit = !!lesson;

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={action} className="space-y-5">
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

          <Textarea
            label="Descrição"
            name="description"
            placeholder="Descreva o conteúdo da aula..."
            rows={6}
            defaultValue={lesson?.description ?? ""}
          />

          <Input
            label="URL do Vídeo"
            name="videoUrl"
            type="url"
            placeholder="https://youtube.com/..."
            defaultValue={lesson?.videoUrl ?? ""}
          />

          <Input
            label="Duração (minutos)"
            name="durationMinutes"
            type="number"
            min={0}
            placeholder="Ex: 30"
            defaultValue={lesson?.durationMinutes?.toString() ?? ""}
          />

          <Input
            label="URL da Imagem de Capa"
            name="coverImageUrl"
            type="url"
            placeholder="https://..."
            defaultValue={lesson?.coverImageUrl ?? ""}
          />

          <div className="flex justify-end pt-2">
            <Button type="submit">
              {isEdit ? "Salvar Alterações" : "Criar Aula"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
