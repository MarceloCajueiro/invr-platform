"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { addStudentToTurma } from "@/lib/actions/turmas";

interface AvailableStudent {
  id: string;
  name: string;
  email: string;
}

interface AddStudentToTurmaProps {
  turmaId: string;
  availableStudents: AvailableStudent[];
}

export function AddStudentToTurma({
  turmaId,
  availableStudents,
}: AddStudentToTurmaProps) {
  const [showForm, setShowForm] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState(false);

  if (availableStudents.length === 0) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!studentId) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("turmaId", turmaId);
    formData.append("studentId", studentId);

    try {
      await addStudentToTurma(formData);
      setStudentId("");
      setShowForm(false);
    } catch {
      // Error handled by revalidation
    } finally {
      setLoading(false);
    }
  }

  if (!showForm) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setShowForm(true)}>
        <UserPlus size={14} />
        Adicionar aluno
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <div className="w-64">
        <Select
          options={availableStudents.map((s) => ({
            value: s.id,
            label: `${s.name} (${s.email})`,
          }))}
          placeholder="Selecione um aluno..."
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          required
        />
      </div>
      <Button type="submit" size="sm" loading={loading}>
        Adicionar
      </Button>
      <Button
        variant="ghost"
        size="sm"
        type="button"
        onClick={() => {
          setShowForm(false);
          setStudentId("");
        }}
      >
        Cancelar
      </Button>
    </form>
  );
}
