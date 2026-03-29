"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface TurmaInviteCodeProps {
  code: string;
}

export function TurmaInviteCode({ code }: TurmaInviteCodeProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-sm)] bg-bg-light hover:bg-border transition-colors"
      title="Copiar código de convite"
    >
      <span className="text-sm font-mono font-medium text-text-secondary">
        {code}
      </span>
      {copied ? (
        <Check size={14} className="text-tarefas" />
      ) : (
        <Copy size={14} className="text-text-muted" />
      )}
    </button>
  );
}
