import { BookOpenCheck } from "lucide-react";

export function HomeworkBadge() {
  return (
    <span
      data-testid="homework-badge"
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-challenges text-challenges-ink"
    >
      <BookOpenCheck size={10} />
      Homework
    </span>
  );
}
