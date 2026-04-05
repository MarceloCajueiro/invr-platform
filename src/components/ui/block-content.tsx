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

function BlockContentInner({ content }: BlockContentProps) {
  let parsed: Block[] | undefined;
  try {
    parsed = JSON.parse(content);
  } catch {
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
