"use client";

import { Button } from "@/components/ui/button";

interface DeleteButtonProps {
  action: (formData: FormData) => Promise<void>;
  id: string;
  label?: string;
}

export function DeleteButton({ action, id, label = "Excluir" }: DeleteButtonProps) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Tem certeza que deseja excluir?")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button
        variant="ghost"
        size="sm"
        type="submit"
        className="text-red-500 hover:text-red-700 hover:bg-red-50"
      >
        {label}
      </Button>
    </form>
  );
}
