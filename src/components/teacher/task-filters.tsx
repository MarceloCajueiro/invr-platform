"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Select } from "@/components/ui/select";

const statusOptions = [
  { value: "all", label: "Todos os status" },
  { value: "draft", label: "Rascunho" },
  { value: "published", label: "Publicada" },
];

const typeOptions = [
  { value: "all", label: "Todos os tipos" },
  { value: "quiz", label: "Quiz" },
  { value: "listening", label: "Listening" },
  { value: "fill_gaps", label: "Preencher Lacunas" },
  { value: "writing", label: "Escrita" },
];

export function TaskFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "all") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      router.push(`/teacher/tasks?${params.toString()}`);
    },
    [router, searchParams],
  );

  return (
    <div className="flex gap-3 mb-6">
      <Select
        options={statusOptions}
        defaultValue={searchParams.get("status") || "all"}
        onChange={(e) => updateFilter("status", e.target.value)}
      />
      <Select
        options={typeOptions}
        defaultValue={searchParams.get("taskType") || "all"}
        onChange={(e) => updateFilter("taskType", e.target.value)}
      />
    </div>
  );
}
