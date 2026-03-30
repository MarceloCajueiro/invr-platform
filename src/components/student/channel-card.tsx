import Link from "next/link";
import type { LucideIcon } from "lucide-react";

type Channel = "aulas" | "tarefas" | "fora" | "challenges";

interface ChannelCardProps {
  channel: Channel;
  title: string;
  count: number | string;
  subtitle: string;
  href: string;
  icon: LucideIcon;
}

const channelGradients: Record<Channel, string> = {
  aulas:
    "radial-gradient(ellipse at 70% 30%, rgba(162,155,254,0.35) 0%, transparent 60%), linear-gradient(135deg, #6c5ce7, #a29bfe)",
  tarefas:
    "radial-gradient(ellipse at 70% 30%, rgba(85,239,196,0.35) 0%, transparent 60%), linear-gradient(135deg, #00b894, #55efc4)",
  fora:
    "radial-gradient(ellipse at 70% 30%, rgba(250,177,160,0.35) 0%, transparent 60%), linear-gradient(135deg, #e17055, #fab1a0)",
  challenges:
    "radial-gradient(ellipse at 70% 30%, rgba(255,234,167,0.35) 0%, transparent 60%), linear-gradient(135deg, #fdcb6e, #ffeaa7)",
};

export function ChannelCard({
  channel,
  title,
  count,
  subtitle,
  href,
  icon: Icon,
}: ChannelCardProps) {
  return (
    <Link href={href} className="block group">
      <div
        className="rounded-xl p-5 min-h-[140px] flex flex-col justify-between text-white transition-all duration-200 group-hover:scale-[1.02] group-hover:shadow-lg"
        style={{ background: channelGradients[channel] }}
      >
        <div className="flex items-start justify-between">
          <Icon size={32} className="opacity-90" />
        </div>
        <div className="mt-auto">
          <p className="text-xs font-medium opacity-80">{title}</p>
          <p className="text-2xl font-bold font-display">{count}</p>
          <p className="text-xs opacity-80">{subtitle}</p>
        </div>
      </div>
    </Link>
  );
}
