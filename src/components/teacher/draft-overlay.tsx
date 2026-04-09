import { Badge } from "@/components/ui/badge";

interface DraftOverlayProps {
  isDraft: boolean;
  children: React.ReactNode;
}

export function DraftOverlay({ isDraft, children }: DraftOverlayProps) {
  if (!isDraft) return <>{children}</>;

  return (
    <div className="relative">
      <div className="opacity-60">{children}</div>
      <div className="absolute top-2 right-2 z-10">
        <Badge variant="info">Não visível para alunos</Badge>
      </div>
    </div>
  );
}
