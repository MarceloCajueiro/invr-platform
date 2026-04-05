"use client";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import type { Block } from "@blocknote/core";
import dynamic from "next/dynamic";

function folderForFile(file: File): string {
  if (file.type.startsWith("image/")) return "content/images";
  if (file.type.startsWith("video/")) return "content/videos";
  if (file.type.startsWith("audio/")) return "content/audio";
  return "content/documents";
}

async function uploadToR2(file: File): Promise<string> {
  const folder = folderForFile(file);

  const res = await fetch("/api/upload/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type,
      folder,
    }),
  });

  if (!res.ok) throw new Error("Falha ao gerar URL de upload");

  const { uploadUrl, key } = (await res.json()) as { uploadUrl: string; key: string };

  const upload = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });

  if (!upload.ok) throw new Error("Falha no upload do arquivo");

  return `r2://${key}`;
}

async function resolveR2Url(url: string): Promise<string> {
  if (!url.startsWith("r2://")) return url;

  const key = url.slice(5);
  const res = await fetch(`/api/upload/presign?key=${encodeURIComponent(key)}`);

  if (!res.ok) return url;

  const { url: signedUrl } = (await res.json()) as { url: string };
  return signedUrl;
}

interface BlockEditorProps {
  initialContent?: string;
  onChange?: (json: string) => void;
  editable?: boolean;
}

function BlockEditorInner({ initialContent, onChange, editable = true }: BlockEditorProps) {
  let parsed: Block[] | undefined;
  if (initialContent) {
    try {
      parsed = JSON.parse(initialContent);
    } catch {
      parsed = undefined;
    }
  }

  const editor = useCreateBlockNote({
    initialContent: parsed,
    uploadFile: uploadToR2,
    resolveFileUrl: resolveR2Url,
  });

  return (
    <div className="border border-border rounded-[var(--radius-md)] bg-bg-card overflow-hidden focus-within:border-aulas transition-colors">
      <BlockNoteView
        editor={editor}
        editable={editable}
        theme="light"
        onChange={() => {
          onChange?.(JSON.stringify(editor.document));
        }}
      />
    </div>
  );
}

export const BlockEditor = dynamic(
  () => Promise.resolve(BlockEditorInner),
  {
    ssr: false,
    loading: () => (
      <div className="border border-border rounded-[var(--radius-md)] bg-bg-card p-8 text-center text-text-muted text-sm">
        Carregando editor...
      </div>
    ),
  }
);
