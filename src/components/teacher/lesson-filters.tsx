"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Select } from "@/components/ui/select";

const statusOptions = [
  { value: "all", label: "Todos os status" },
  { value: "draft", label: "Rascunho" },
  { value: "published", label: "Publicada" },
];

const categoryOptions = [
  { value: "all", label: "Todas as categorias" },
  { value: "conversation", label: "Conversacao" },
  { value: "grammar", label: "Gramatica" },
  { value: "vocabulary", label: "Vocabulario" },
  { value: "listening", label: "Listening" },
  { value: "culture", label: "Cultura" },
];

export function LessonFilters() {
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
      router.push(`/lessons?${params.toString()}`);
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
        options={categoryOptions}
        defaultValue={searchParams.get("category") || "all"}
        onChange={(e) => updateFilter("category", e.target.value)}
      />
    </div>
  );
}
