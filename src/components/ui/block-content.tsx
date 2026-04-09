"use client";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import type { Block } from "@blocknote/core";
import dynamic from "next/dynamic";

async function resolveR2Url(url: string): Promise<string> {
  if (!url.startsWith("r2://")) return url;

  const key = url.slice(5);
  const res = await fetch(`/api/upload/presign?key=${encodeURIComponent(key)}`);

  if (!res.ok) return url;

  const { url: signedUrl } = (await res.json()) as { url: string };
  return signedUrl;
}

interface BlockContentProps {
  content: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Render ProseMirror/tiptap JSON ({ type: "doc", content: [...] }) as React elements.
 * Handles paragraphs, headings, bullet/ordered lists, blockquotes, and inline marks.
 */
function ProseMirrorContent({ doc }: { doc: any }) {
  function renderMarks(node: any): React.ReactNode {
    let el: React.ReactNode = node.text ?? "";
    if (!node.marks) return el;
    for (const mark of node.marks) {
      if (mark.type === "bold") el = <strong>{el}</strong>;
      else if (mark.type === "italic") el = <em>{el}</em>;
      else if (mark.type === "code") el = <code className="bg-gray-100 px-1 rounded text-sm">{el}</code>;
      else if (mark.type === "link") el = <a href={mark.attrs?.href} className="text-aulas underline">{el}</a>;
    }
    return el;
  }

  function renderNode(node: any, i: number): React.ReactNode {
    if (node.type === "text") return <span key={i}>{renderMarks(node)}</span>;

    const children = node.content?.map((child: any, j: number) => renderNode(child, j));

    switch (node.type) {
      case "paragraph":
        return <p key={i} className="mb-3 text-text-primary leading-relaxed">{children}</p>;
      case "heading": {
        const level = node.attrs?.level ?? 2;
        const cls = "font-display font-bold text-text-primary mb-3 mt-6";
        if (level === 1) return <h1 key={i} className={cls}>{children}</h1>;
        if (level === 3) return <h3 key={i} className={cls}>{children}</h3>;
        return <h2 key={i} className={cls}>{children}</h2>;
      }
      case "bulletList":
        return <ul key={i} className="list-disc pl-6 mb-3 space-y-1 text-text-primary">{children}</ul>;
      case "orderedList":
        return <ol key={i} className="list-decimal pl-6 mb-3 space-y-1 text-text-primary">{children}</ol>;
      case "listItem":
        return <li key={i}>{children}</li>;
      case "blockquote":
        return <blockquote key={i} className="border-l-4 border-aulas/30 pl-4 italic text-text-secondary mb-3">{children}</blockquote>;
      case "codeBlock":
        return <pre key={i} className="bg-gray-100 rounded-[var(--radius-sm)] p-4 mb-3 overflow-x-auto text-sm font-mono"><code>{children}</code></pre>;
      case "horizontalRule":
        return <hr key={i} className="border-border my-6" />;
      case "hardBreak":
        return <br key={i} />;
      case "doc":
        return <>{children}</>;
      default:
        return children ? <div key={i}>{children}</div> : null;
    }
  }

  return (
    <div className="rich-content max-w-2xl prose-sm">
      {renderNode(doc, 0)}
    </div>
  );
}

/* eslint-enable @typescript-eslint/no-explicit-any */

function BlockContentInner({ content }: BlockContentProps) {
  let parsed: Block[] | undefined;
  let proseMirrorDoc: any = undefined;

  try {
    const raw = JSON.parse(content);
    if (Array.isArray(raw)) {
      parsed = raw;
    } else if (raw?.type === "doc" && Array.isArray(raw.content)) {
      proseMirrorDoc = raw;
    }
  } catch {
    return <p className="text-text-secondary">{content}</p>;
  }

  // ProseMirror/tiptap format
  if (proseMirrorDoc) {
    return <ProseMirrorContent doc={proseMirrorDoc} />;
  }

  // BlockNote array format
  if (!parsed || parsed.length === 0) {
    return <p className="text-text-secondary">{content}</p>;
  }

  const editor = useCreateBlockNote({
    initialContent: parsed,
    resolveFileUrl: resolveR2Url,
  });

  return (
    <div className="rich-content max-w-2xl">
      <BlockNoteView editor={editor} editable={false} theme="light" />
    </div>
  );
}

export const BlockContent = dynamic(
  () => Promise.resolve(BlockContentInner),
  {
    ssr: false,
    loading: () => (
      <div className="max-w-2xl animate-pulse space-y-3">
        <div className="h-4 bg-bg-light rounded w-3/4" />
        <div className="h-4 bg-bg-light rounded w-full" />
        <div className="h-4 bg-bg-light rounded w-5/6" />
      </div>
    ),
  }
);
