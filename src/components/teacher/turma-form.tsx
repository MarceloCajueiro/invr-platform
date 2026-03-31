"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface TurmaData {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  level: "beginner" | "intermediate" | "advanced" | null;
}

interface TurmaFormProps {
  turma?: TurmaData;
  action: (formData: FormData) => Promise<void>;
}

const PRESET_COLORS = [
  { value: "#6c5ce7", label: "Aulas" },
  { value: "#00b894", label: "Tarefas" },
  { value: "#e17055", label: "Fora" },
  { value: "#fdcb6e", label: "Challenges" },
  { value: "#636e72", label: "Cinza" },
  { value: "#2d3436", label: "Escuro" },
];

const levelOptions = [
  { value: "", label: "Nenhum" },
  { value: "beginner", label: "Iniciante" },
  { value: "intermediate", label: "Intermediário" },
  { value: "advanced", label: "Avançado" },
];

export function TurmaForm({ turma, action }: TurmaFormProps) {
  const isEdit = !!turma;
  const [selectedColor, setSelectedColor] = useState(
    turma?.color || PRESET_COLORS[0].value,
  );

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={action} className="space-y-5">
          <Input
            label="Nome"
            name="name"
            placeholder="Ex: Turma A - Intermediário"
            defaultValue={turma?.name ?? ""}
            required
          />

          <Textarea
            label="Descrição"
            name="description"
            placeholder="Descreva o objetivo desta turma..."
            rows={4}
            defaultValue={turma?.description ?? ""}
          />

          <Select
            label="Nível"
            name="level"
            options={levelOptions}
            defaultValue={turma?.level ?? ""}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-text-primary">
              Cor
            </label>
            <input type="hidden" name="color" value={selectedColor} />
            <div className="flex items-center gap-3">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setSelectedColor(color.value)}
                  className={cn(
                    "w-8 h-8 rounded-full transition-all border-2",
                    selectedColor === color.value
                      ? "border-text-primary scale-110"
                      : "border-transparent hover:scale-105",
                  )}
                  style={{ backgroundColor: color.value }}
                  title={color.label}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit">
              {isEdit ? "Salvar Alterações" : "Criar Turma"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
