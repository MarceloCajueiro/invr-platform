"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Select } from "@/components/ui/select";

const statusOptions = [
  { value: "all", label: "Todos os status" },
  { value: "draft", label: "Rascunho" },
  { value: "published", label: "Publicado" },
];

const categoryOptions = [
  { value: "all", label: "Todas as categorias" },
  { value: "tips", label: "Dicas" },
  { value: "grammar", label: "Gramática" },
  { value: "culture", label: "Cultura" },
  { value: "vocabulary", label: "Vocabulário" },
];

export function PostFilters() {
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
      router.push(`/teacher/posts?${params.toString()}`);
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
