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

export function SlashMenu({ editor, open, onClose }: SlashMenuProps) {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  // Hidden file inputs — triggered synchronously on click for browser trust
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const videoUploadInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setSearch("");
      setSelectedIndex(0);
    }
  }, [open]);

  function handleFileSelected(input: HTMLInputElement, folder: string, insertFn: (result: { url: string; name: string; size: number }, file: File) => void) {
    const file = input.files?.[0];
    if (!file) return;
    input.value = "";
    uploadFile(file, folder).then((result) => insertFn(result, file));
  }

  const items = [
    {
      label: "Imagem",
      icon: <Image size={16} />,
      action: () => {
        imageInputRef.current?.click();
        onClose();
      },
    },
    {
      label: "Vídeo (link)",
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
      icon: <Upload size={16} />,
      action: () => {
        videoUploadInputRef.current?.click();
        onClose();
      },
    },
    {
      label: "Áudio",
      icon: <Headphones size={16} />,
      action: () => {
        audioInputRef.current?.click();
        onClose();
      },
    },
    {
      label: "Documento",
      icon: <FileText size={16} />,
      action: () => {
        documentInputRef.current?.click();
        onClose();
      },
    },
    {
      label: "Embed",
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

  // Keyboard navigation when menu is open
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
        filtered[selectedIndex]?.action();
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

  return (
    <>
      {/* Hidden file inputs — always mounted so they survive menu close */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) =>
          handleFileSelected(e.target, "content/images", (result, file) => {
            editor.chain().focus().setImage({ src: result.url, alt: file.name }).run();
          })
        }
      />
      <input
        ref={videoUploadInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        className="hidden"
        onChange={(e) =>
          handleFileSelected(e.target, "content/videos", (result) => {
            editor.chain().focus().insertContent({ type: "video", attrs: { src: result.url, provider: "upload" } }).run();
          })
        }
      />
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/mpeg,audio/wav,audio/ogg,audio/mp4"
        className="hidden"
        onChange={(e) =>
          handleFileSelected(e.target, "content/audio", (result, file) => {
            editor.chain().focus().insertContent({ type: "audio", attrs: { src: result.url, name: file.name } }).run();
          })
        }
      />
      <input
        ref={documentInputRef}
        type="file"
        accept="application/pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
        className="hidden"
        onChange={(e) =>
          handleFileSelected(e.target, "content/documents", (result, file) => {
            editor.chain().focus().insertContent({
              type: "document",
              attrs: { src: result.url, name: file.name, size: file.size },
            }).run();
          })
        }
      />

      {open && (
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
      )}
    </>
  );
}
