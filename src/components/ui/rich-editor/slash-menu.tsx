"use client";

import { useState, useEffect, useRef } from "react";
import type { Editor } from "@tiptap/react";
import { Image, Film, Upload, Headphones, FileText, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { detectProvider } from "./extensions/video";

interface SlashMenuProps {
  editor: Editor;
  open: boolean;
  onClose: () => void;
}

async function uploadFile(file: File, folder: string): Promise<{ url: string; name: string; size: number }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);
  const res = await fetch("/api/upload", { method: "POST", body: formData });
  if (!res.ok) throw new Error("Upload failed");
  return res.json();
}

function FileMenuItem({
  icon,
  label,
  accept,
  folder,
  active,
  onInsert,
  onClose,
}: {
  icon: React.ReactNode;
  label: string;
  accept: string;
  folder: string;
  active: boolean;
  onInsert: (result: { url: string; name: string; size: number }, file: File) => void;
  onClose: () => void;
}) {
  const id = `slash-file-${label}`;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    onClose();
    uploadFile(file, folder).then((result) => onInsert(result, file));
  }

  return (
    <label
      htmlFor={id}
      className={cn(
        "flex items-center gap-2.5 w-full px-3 py-2 text-sm text-left transition-colors cursor-pointer",
        active
          ? "bg-aulas/10 text-aulas"
          : "text-text-primary hover:bg-bg-light"
      )}
    >
      {icon}
      {label}
      <input
        id={id}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleChange}
      />
    </label>
  );
}

function ActionMenuItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 w-full px-3 py-2 text-sm text-left transition-colors",
        active
          ? "bg-aulas/10 text-aulas"
          : "text-text-primary hover:bg-bg-light"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

export function SlashMenu({ editor, open, onClose }: SlashMenuProps) {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setSearch("");
      setSelectedIndex(0);
    }
  }, [open]);

  type MenuItem = {
    label: string;
    type: "file" | "action";
    icon: React.ReactNode;
    // file props
    accept?: string;
    folder?: string;
    onInsert?: (result: { url: string; name: string; size: number }, file: File) => void;
    // action props
    action?: () => void;
  };

  const items: MenuItem[] = [
    {
      label: "Imagem",
      type: "file",
      icon: <Image size={16} />,
      accept: "image/jpeg,image/png,image/webp",
      folder: "content/images",
      onInsert: (result, file) => {
        editor.chain().focus().setImage({ src: result.url, alt: file.name }).run();
      },
    },
    {
      label: "Vídeo (link)",
      type: "action",
      icon: <Film size={16} />,
      action: () => {
        onClose();
        const url = window.prompt("URL do vídeo (YouTube, Vimeo ou link direto):");
        if (!url) return;
        const provider = detectProvider(url);
        editor.chain().focus().insertContent({ type: "video", attrs: { src: url, provider } }).run();
      },
    },
    {
      label: "Vídeo (upload)",
      type: "file",
      icon: <Upload size={16} />,
      accept: "video/mp4,video/webm,video/quicktime",
      folder: "content/videos",
      onInsert: (result) => {
        editor.chain().focus().insertContent({ type: "video", attrs: { src: result.url, provider: "upload" } }).run();
      },
    },
    {
      label: "Áudio",
      type: "file",
      icon: <Headphones size={16} />,
      accept: "audio/mpeg,audio/wav,audio/ogg,audio/mp4",
      folder: "content/audio",
      onInsert: (result, file) => {
        editor.chain().focus().insertContent({ type: "audio", attrs: { src: result.url, name: file.name } }).run();
      },
    },
    {
      label: "Documento",
      type: "file",
      icon: <FileText size={16} />,
      accept: "application/pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx",
      folder: "content/documents",
      onInsert: (result, file) => {
        editor.chain().focus().insertContent({
          type: "document",
          attrs: { src: result.url, name: file.name, size: file.size },
        }).run();
      },
    },
    {
      label: "Embed",
      type: "action",
      icon: <Globe size={16} />,
      action: () => {
        onClose();
        const url = window.prompt("URL do embed:");
        if (!url) return;
        editor.chain().focus().insertContent({ type: "embed", attrs: { src: url } }).run();
      },
    },
  ];

  const filtered = items.filter((item) =>
    item.label.toLowerCase().includes(search.toLowerCase())
  );

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((i) => (i + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        const item = filtered[selectedIndex];
        if (item?.type === "action") {
          item.action?.();
        }
        // For file items, Enter won't trigger file picker — user must click
      } else if (e.key === "Backspace") {
        e.preventDefault();
        e.stopPropagation();
        if (search === "") {
          onClose();
        } else {
          setSearch((s) => s.slice(0, -1));
        }
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
        setSearch((s) => s + e.key);
        setSelectedIndex(0);
      }
    }

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [open, search, selectedIndex, filtered, onClose]);

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as HTMLElement)) {
        onClose();
      }
    }
    const timer = setTimeout(() => {
      document.addEventListener("click", handleClick);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handleClick);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={menuRef}
      className="absolute z-50 w-56 bg-bg-card border border-border rounded-[var(--radius-md)] shadow-lg py-1 animate-fade-in"
      style={{ left: 16, top: 8 }}
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
        filtered.map((item, i) =>
          item.type === "file" ? (
            <FileMenuItem
              key={item.label}
              icon={item.icon}
              label={item.label}
              accept={item.accept!}
              folder={item.folder!}
              active={i === selectedIndex}
              onInsert={item.onInsert!}
              onClose={onClose}
            />
          ) : (
            <ActionMenuItem
              key={item.label}
              icon={item.icon}
              label={item.label}
              active={i === selectedIndex}
              onClick={item.action!}
            />
          )
        )
      )}
    </div>
  );
}
