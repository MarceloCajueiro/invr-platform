import Image from "next/image";
import { FileText } from "lucide-react";

interface Attachment {
  type: string;
  url: string;
  name: string;
}

interface AttachmentRendererProps {
  attachments: Attachment[];
}

function SingleAttachment({ att }: { att: Attachment }) {
  if (att.type === "image") {
    return (
      <a href={att.url} target="_blank" rel="noopener noreferrer" className="block">
        <div className="relative w-full max-w-md aspect-video rounded-[var(--radius-sm)] overflow-hidden bg-bg-light">
          <Image
            src={att.url}
            alt={att.name}
            fill
            unoptimized
            className="object-cover hover:opacity-90 transition-opacity"
            sizes="(max-width: 768px) 100vw, 448px"
          />
        </div>
        <span className="text-xs text-text-muted mt-1 block">{att.name}</span>
      </a>
    );
  }

  if (att.type === "video") {
    return (
      <div className="max-w-md">
        <video
          controls
          preload="metadata"
          className="w-full rounded-[var(--radius-sm)] bg-black"
        >
          <source src={att.url} />
          Seu navegador não suporta a reprodução de vídeo.
        </video>
        <span className="text-xs text-text-muted mt-1 block">{att.name}</span>
      </div>
    );
  }

  if (att.type === "audio") {
    return (
      <div className="max-w-md">
        <audio controls preload="metadata" className="w-full">
          <source src={att.url} />
          Seu navegador não suporta a reprodução de áudio.
        </audio>
        <span className="text-xs text-text-muted mt-1 block">{att.name}</span>
      </div>
    );
  }

  // Generic file — download link
  return (
    <a
      href={att.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)] bg-bg-light text-sm text-text-secondary hover:text-text-primary transition-colors"
    >
      <FileText size={16} />
      {att.name}
    </a>
  );
}

export function AttachmentRenderer({ attachments }: AttachmentRendererProps) {
  if (attachments.length === 0) return null;

  return (
    <div className="space-y-3">
      {attachments.map((att, i) => (
        <SingleAttachment key={i} att={att} />
      ))}
    </div>
  );
}
