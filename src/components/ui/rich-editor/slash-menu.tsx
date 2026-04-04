"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Editor } from "@tiptap/react";
import { Image, Film, Headphones, FileText, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { detectProvider } from "./extensions/video";

interface SlashMenuProps {
  editor: Editor;
}

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  action: () => void;
}

async function uploadFile(file: File, folder: string): Promise<{ url: string; name: string; size: number }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);
  const res = await fetch("/api/upload", { method: "POST", body: formData });
  if (!res.ok) throw new Error("Upload failed");
  return res.json();
}

function openFilePicker(accept: string): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.onchange = () => resolve(input.files?.[0] ?? null);
    input.click();
  });
}

export function SlashMenu({ editor }: SlashMenuProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const insertImage = useCallback(async () => {
    setOpen(false);
    const file = await openFilePicker("image/jpeg,image/png,image/webp");
    if (!file) return;
    const result = await uploadFile(file, "content/images");
    editor.chain().focus().setImage({ src: result.url, alt: file.name }).run();
  }, [editor]);

  const insertVideo = useCallback(async () => {
    setOpen(false);
    const url = window.prompt("URL do vídeo (YouTube, Vimeo ou link direto):");
    if (!url) return;
    const provider = detectProvider(url);
    editor
      .chain()
      .focus()
      .insertContent({ type: "video", attrs: { src: url, provider } })
      .run();
  }, [editor]);

  const insertAudio = useCallback(async () => {
    setOpen(false);
    const file = await openFilePicker("audio/mpeg,audio/wav,audio/ogg,audio/mp4");
    if (!file) return;
    const result = await uploadFile(file, "content/audio");
    editor
      .chain()
      .focus()
      .insertContent({ type: "audio", attrs: { src: result.url, name: file.name } })
      .run();
  }, [editor]);

  const insertDocument = useCallback(async () => {
    setOpen(false);
    const file = await openFilePicker("application/pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx");
    if (!file) return;
    const result = await uploadFile(file, "content/documents");
    editor
      .chain()
      .focus()
      .insertContent({
        type: "document",
        attrs: { src: result.url, name: file.name, size: file.size },
      })
      .run();
  }, [editor]);

  const insertEmbed = useCallback(async () => {
    setOpen(false);
    const url = window.prompt("URL do embed:");
    if (!url) return;
    editor
      .chain()
      .focus()
      .insertContent({ type: "embed", attrs: { src: url } })
      .run();
  }, [editor]);

  const items: MenuItem[] = [
    { label: "Imagem", icon: <Image size={16} />, action: insertImage },
    { label: "Vídeo", icon: <Film size={16} />, action: insertVideo },
    { label: "Áudio", icon: <Headphones size={16} />, action: insertAudio },
    { label: "Documento", icon: <FileText size={16} />, action: insertDocument },
    { label: "Embed", icon: <Globe size={16} />, action: insertEmbed },
  ];

  const filtered = items.filter((item) =>
    item.label.toLowerCase().includes(search.toLowerCase())
  );

  // Listen for editor transactions to detect "/" typed on empty line
  useEffect(() => {
    function onTransaction() {
      if (open) return;
      const { state } = editor;
      const { $from } = state.selection;
      const text = $from.parent.textContent;
      if (text === "/") {
        // Delete the "/" character and open menu
        editor.chain().deleteRange({ from: $from.pos - 1, to: $from.pos }).run();
        setOpen(true);
        setSearch("");
        setSelectedIndex(0);
      }
    }

    editor.on("transaction", onTransaction);
    return () => {
      editor.off("transaction", onTransaction);
    };
  }, [editor, open]);

  // Keyboard navigation when menu is open
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        filtered[selectedIndex]?.action();
      } else if (e.key === "Backspace") {
        if (search === "") {
          setOpen(false);
        } else {
          setSearch((s) => s.slice(0, -1));
        }
        e.preventDefault();
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setSearch((s) => s + e.key);
        setSelectedIndex(0);
      }
    }

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [open, search, selectedIndex, filtered]);

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as HTMLElement)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={menuRef}
      className="absolute z-50 w-56 bg-bg-card border border-border rounded-[var(--radius-md)] shadow-lg py-1 animate-fade-in"
      style={{ top: "auto", left: 16, bottom: "auto" }}
    >
      {search && (
        <div className="px-3 py-1 text-xs text-text-muted border-b border-border mb-1">
          /{search}
        </div>
      )}
      {filtered.length === 0 ? (
        <div className="px-3 py-2 text-sm text-text-muted">
          Nenhum resultado
        </div>
      ) : (
        filtered.map((item, i) => (
          <button
            key={item.label}
            type="button"
            onClick={item.action}
            className={cn(
              "flex items-center gap-2.5 w-full px-3 py-2 text-sm text-left transition-colors",
              i === selectedIndex
                ? "bg-aulas/10 text-aulas"
                : "text-text-primary hover:bg-bg-light"
            )}
          >
            {item.icon}
            {item.label}
          </button>
        ))
      )}
    </div>
  );
}
