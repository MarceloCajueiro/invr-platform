"use client";

import { FileText, Download } from "lucide-react";

interface TiptapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  text?: string;
}

interface RichContentProps {
  content: string;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
  );
  return match?.[1] ?? null;
}

function extractVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match?.[1] ?? null;
}

function renderText(node: TiptapNode, key: number): React.ReactNode {
  if (!node.text) return null;

  let el: React.ReactNode = node.text;
  for (const mark of node.marks ?? []) {
    switch (mark.type) {
      case "bold":
        el = <strong key={key}>{el}</strong>;
        break;
      case "italic":
        el = <em key={key}>{el}</em>;
        break;
      case "underline":
        el = <u key={key}>{el}</u>;
        break;
      case "link":
        el = (
          <a
            key={key}
            href={mark.attrs?.href as string}
            target="_blank"
            rel="noopener noreferrer"
            className="text-aulas underline underline-offset-2 hover:brightness-110"
          >
            {el}
          </a>
        );
        break;
    }
  }
  return el;
}

function renderChildren(nodes?: TiptapNode[]): React.ReactNode[] {
  if (!nodes) return [];
  return nodes.map((node, i) => renderNode(node, i));
}

function renderNode(node: TiptapNode, key: number): React.ReactNode {
  switch (node.type) {
    case "text":
      return renderText(node, key);

    case "paragraph":
      return (
        <p key={key} className="mb-3 text-text-secondary leading-relaxed">
          {renderChildren(node.content)}
        </p>
      );

    case "heading": {
      const level = (node.attrs?.level as number) ?? 2;
      const Tag = level === 2 ? "h2" : "h3";
      const classes =
        level === 2
          ? "text-lg font-semibold text-text-primary mt-6 mb-2"
          : "text-base font-semibold text-text-primary mt-4 mb-2";
      return (
        <Tag key={key} className={classes}>
          {renderChildren(node.content)}
        </Tag>
      );
    }

    case "bulletList":
      return (
        <ul key={key} className="list-disc pl-6 space-y-1 mb-3">
          {renderChildren(node.content)}
        </ul>
      );

    case "orderedList":
      return (
        <ol key={key} className="list-decimal pl-6 space-y-1 mb-3">
          {renderChildren(node.content)}
        </ol>
      );

    case "listItem":
      return (
        <li key={key} className="text-text-secondary">
          {renderChildren(node.content)}
        </li>
      );

    case "blockquote":
      return (
        <blockquote
          key={key}
          className="border-l-4 border-fora pl-4 italic text-text-muted mb-3"
        >
          {renderChildren(node.content)}
        </blockquote>
      );

    case "horizontalRule":
      return <hr key={key} className="my-6 border-border" />;

    case "image":
      return (
        <figure key={key} className="my-4">
          <img
            src={node.attrs?.src as string}
            alt={(node.attrs?.alt as string) ?? ""}
            className="rounded-[var(--radius-md)] max-w-full"
            loading="lazy"
          />
        </figure>
      );

    case "video": {
      const src = node.attrs?.src as string;
      const provider = node.attrs?.provider as string;
      let embedSrc: string | null = null;

      if (provider === "youtube") {
        const id = extractYouTubeId(src);
        if (id) embedSrc = `https://www.youtube.com/embed/${id}`;
      } else if (provider === "vimeo") {
        const id = extractVimeoId(src);
        if (id) embedSrc = `https://player.vimeo.com/video/${id}`;
      }

      return (
        <div
          key={key}
          className="relative w-full aspect-video rounded-[var(--radius-md)] overflow-hidden bg-black my-4"
        >
          {embedSrc ? (
            <iframe
              src={embedSrc}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          ) : (
            <video src={src} controls className="w-full h-full" />
          )}
        </div>
      );
    }

    case "audio":
      return (
        <div
          key={key}
          className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] bg-[#f8f9fb] border border-border my-4"
        >
          <audio controls className="flex-1 h-10" preload="metadata">
            <source src={node.attrs?.src as string} />
          </audio>
          {typeof node.attrs?.name === "string" && (
            <span className="text-xs text-text-muted truncate max-w-40">
              {node.attrs.name}
            </span>
          )}
        </div>
      );

    case "document":
      return (
        <a
          key={key}
          href={node.attrs?.src as string}
          download={node.attrs?.name as string}
          className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] bg-[#f8f9fb] border border-border hover:border-aulas transition-colors my-4"
        >
          <FileText size={20} className="text-text-muted shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">
              {node.attrs?.name as string}
            </p>
            {(node.attrs?.size as number) > 0 && (
              <p className="text-xs text-text-muted">
                {formatFileSize(node.attrs?.size as number)}
              </p>
            )}
          </div>
          <Download size={16} className="text-text-muted shrink-0" />
        </a>
      );

    case "embed":
      return (
        <div
          key={key}
          className="relative w-full aspect-video rounded-[var(--radius-md)] overflow-hidden border border-border my-4"
        >
          <iframe
            src={node.attrs?.src as string}
            sandbox="allow-scripts allow-same-origin allow-popups"
            className="absolute inset-0 w-full h-full"
          />
        </div>
      );

    case "doc":
      return <>{renderChildren(node.content)}</>;

    default:
      return null;
  }
}

export function RichContent({ content }: RichContentProps) {
  let doc: TiptapNode;
  try {
    doc = JSON.parse(content);
  } catch {
    return <p className="text-text-secondary">{content}</p>;
  }

  return <div className="rich-content">{renderNode(doc, 0)}</div>;
}
