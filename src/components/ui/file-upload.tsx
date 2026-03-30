"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  File,
  ImageIcon,
  Film,
  Music,
  FileText,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

export interface FileItem {
  url: string;
  name: string;
  size: number;
}

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: "uploading" | "done" | "error";
  error?: string;
  result?: FileItem;
  xhr?: XMLHttpRequest;
}

interface FileUploadProps {
  name: string;
  accept: string;
  maxSize: number;
  maxFiles?: number;
  folder: string;
  label: string;
  description?: string;
  existingFiles?: FileItem[];
  onChange?: (files: FileItem[]) => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatMaxSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (mb >= 1024) return `${(mb / 1024).toFixed(0)}GB`;
  return `${mb.toFixed(0)}MB`;
}

function getFileIcon(name: string, type: string) {
  if (type.startsWith("image/")) return ImageIcon;
  if (type.startsWith("video/")) return Film;
  if (type.startsWith("audio/")) return Music;
  if (type === "application/pdf") return FileText;
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["doc", "docx"].includes(ext)) return FileText;
  if (["ppt", "pptx"].includes(ext)) return FileText;
  if (["xls", "xlsx"].includes(ext)) return FileText;
  return File;
}

function fileMatchesAccept(file: File, accept: string): boolean {
  const acceptParts = accept.split(",").map((a) => a.trim());
  for (const part of acceptParts) {
    if (part.startsWith(".")) {
      if (file.name.toLowerCase().endsWith(part.toLowerCase())) return true;
    } else if (part.endsWith("/*")) {
      const prefix = part.replace("/*", "/");
      if (file.type.startsWith(prefix)) return true;
    } else {
      if (file.type === part) return true;
    }
  }
  return false;
}

let idCounter = 0;
function uniqueId(): string {
  return `upload-${Date.now()}-${++idCounter}`;
}

// ── Upload function ──────────────────────────────────────────────────────────

function uploadFileToR2(
  file: File,
  folder: string,
  onProgress: (progress: number) => void
): { promise: Promise<FileItem>; xhr: XMLHttpRequest } {
  const xhr = new XMLHttpRequest();

  const promise = new Promise<FileItem>(async (resolve, reject) => {
    try {
      const presignRes = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          folder,
        }),
      });

      if (!presignRes.ok) {
        reject(new Error("Falha ao gerar URL de upload"));
        return;
      }

      const { uploadUrl, key } = (await presignRes.json()) as {
        uploadUrl: string;
        key: string;
      };

      xhr.open("PUT", uploadUrl);
      xhr.setRequestHeader("Content-Type", file.type);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({
            url: `/api/files/${key}`,
            name: file.name,
            size: file.size,
          });
        } else {
          reject(new Error(`Upload falhou: ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error("Erro de rede no upload"));
      xhr.onabort = () => reject(new Error("Upload cancelado"));
      xhr.send(file);
    } catch (err) {
      reject(err);
    }
  });

  return { promise, xhr };
}

// ── Component ────────────────────────────────────────────────────────────────

export function FileUpload({
  name,
  accept,
  maxSize,
  maxFiles = 1,
  folder,
  label,
  description,
  existingFiles,
  onChange,
}: FileUploadProps) {
  const [files, setFiles] = useState<FileItem[]>(existingFiles ?? []);
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync existingFiles on mount / change
  useEffect(() => {
    if (existingFiles) setFiles(existingFiles);
  }, [existingFiles]);

  // Notify parent
  useEffect(() => {
    onChange?.(files);
  }, [files, onChange]);

  const totalCount = files.length + uploading.filter((u) => u.status === "uploading").length;

  const processFiles = useCallback(
    (incoming: FileList | File[]) => {
      const newErrors: string[] = [];
      const validFiles: File[] = [];

      const remaining = maxFiles - totalCount;
      const fileArray = Array.from(incoming);

      if (fileArray.length > remaining) {
        newErrors.push(`Máximo de ${maxFiles} arquivo(s)`);
      }

      const toProcess = fileArray.slice(0, Math.max(0, remaining));

      for (const file of toProcess) {
        if (!fileMatchesAccept(file, accept)) {
          newErrors.push(`"${file.name}" - Tipo de arquivo não aceito`);
          continue;
        }
        if (file.size > maxSize) {
          newErrors.push(
            `"${file.name}" - Arquivo muito grande. Máximo: ${formatMaxSize(maxSize)}`
          );
          continue;
        }
        validFiles.push(file);
      }

      setErrors(newErrors);
      if (newErrors.length > 0) {
        setTimeout(() => setErrors([]), 5000);
      }

      // Start uploads
      for (const file of validFiles) {
        const id = uniqueId();
        const entry: UploadingFile = {
          id,
          file,
          progress: 0,
          status: "uploading",
        };

        setUploading((prev) => [...prev, entry]);

        const { promise, xhr } = uploadFileToR2(file, folder, (progress) => {
          setUploading((prev) =>
            prev.map((u) => (u.id === id ? { ...u, progress } : u))
          );
        });

        // Store xhr for cancel
        setUploading((prev) =>
          prev.map((u) => (u.id === id ? { ...u, xhr } : u))
        );

        promise
          .then((result) => {
            setUploading((prev) =>
              prev.map((u) =>
                u.id === id ? { ...u, status: "done", progress: 100, result } : u
              )
            );
            setFiles((prev) => {
              const next = [...prev, result];
              return next;
            });
            // Remove from uploading list after a brief delay
            setTimeout(() => {
              setUploading((prev) => prev.filter((u) => u.id !== id));
            }, 1500);
          })
          .catch((err) => {
            if ((err as Error).message === "Upload cancelado") {
              setUploading((prev) => prev.filter((u) => u.id !== id));
            } else {
              setUploading((prev) =>
                prev.map((u) =>
                  u.id === id
                    ? {
                        ...u,
                        status: "error",
                        error: `Erro ao enviar ${file.name}. Tente novamente.`,
                      }
                    : u
                )
              );
            }
          });
      }
    },
    [accept, maxSize, maxFiles, folder, totalCount]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        processFiles(e.target.files);
        e.target.value = "";
      }
    },
    [processFiles]
  );

  const cancelUpload = useCallback((id: string) => {
    setUploading((prev) => {
      const entry = prev.find((u) => u.id === id);
      entry?.xhr?.abort();
      return prev.filter((u) => u.id !== id);
    });
  }, []);

  const removeFile = useCallback((url: string) => {
    setFiles((prev) => prev.filter((f) => f.url !== url));
  }, []);

  const removeError = useCallback((id: string) => {
    setUploading((prev) => prev.filter((u) => u.id !== id));
  }, []);

  const canAddMore = totalCount < maxFiles;

  return (
    <div className="space-y-3">
      {/* Hidden input for form serialization */}
      <input
        type="hidden"
        name={name}
        value={JSON.stringify(files)}
      />

      {/* Drop zone */}
      {canAddMore && (
        <div
          role="button"
          tabIndex={0}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          className={cn(
            "border-dashed border-2 border-border rounded-md p-8 text-center cursor-pointer transition-all",
            dragOver && "border-aulas bg-aulas-bg/30"
          )}
        >
          <Upload
            className="mx-auto mb-3 text-text-muted"
            size={32}
          />
          <p className="text-sm text-text-secondary">
            Arraste arquivos aqui ou clique para selecionar
          </p>
          {description && (
            <p className="text-xs text-text-muted mt-1">{description}</p>
          )}
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple={maxFiles > 1}
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((err, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-error text-xs animate-[shake_0.3s_ease-in-out]"
            >
              <AlertCircle size={14} className="shrink-0" />
              <span>{err}</span>
            </div>
          ))}
        </div>
      )}

      {/* Uploading files */}
      {uploading.length > 0 && (
        <div className="space-y-2">
          {uploading.map((u) => {
            const Icon = getFileIcon(u.file.name, u.file.type);
            return (
              <div
                key={u.id}
                className="flex items-center gap-3 p-3 bg-bg-light rounded-[var(--radius-sm)]"
              >
                <Icon size={18} className="text-text-muted shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-text-primary truncate">
                      {u.file.name}
                    </span>
                    <span className="text-xs text-text-muted shrink-0">
                      {formatBytes(u.file.size)}
                    </span>
                  </div>
                  {u.status === "uploading" && (
                    <div className="mt-1.5 h-1.5 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-aulas rounded-full transition-all duration-300"
                        style={{ width: `${u.progress}%` }}
                      />
                    </div>
                  )}
                  {u.status === "error" && (
                    <p className="text-error text-xs mt-1">{u.error}</p>
                  )}
                </div>
                {u.status === "uploading" && (
                  <button
                    type="button"
                    onClick={() => cancelUpload(u.id)}
                    className="text-text-muted hover:text-error transition-colors shrink-0"
                    aria-label="Cancelar upload"
                  >
                    <X size={16} />
                  </button>
                )}
                {u.status === "done" && (
                  <CheckCircle size={16} className="text-tarefas shrink-0" />
                )}
                {u.status === "error" && (
                  <button
                    type="button"
                    onClick={() => removeError(u.id)}
                    className="text-text-muted hover:text-error transition-colors shrink-0"
                    aria-label="Remover erro"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Uploaded files list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f) => {
            const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
            const type = ext.match(/^(jpg|jpeg|png|gif|webp|svg)$/)
              ? "image/"
              : ext.match(/^(mp4|webm|mov)$/)
                ? "video/"
                : ext.match(/^(mp3|wav|ogg|m4a)$/)
                  ? "audio/"
                  : ext === "pdf"
                    ? "application/pdf"
                    : "";
            const Icon = getFileIcon(f.name, type);

            return (
              <div
                key={f.url}
                className="flex items-center gap-3 p-3 bg-bg-light rounded-[var(--radius-sm)]"
              >
                <Icon size={18} className="text-text-muted shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-text-primary truncate block">
                    {f.name}
                  </span>
                  <span className="text-xs text-text-muted">
                    {formatBytes(f.size)}
                  </span>
                </div>
                <CheckCircle size={14} className="text-tarefas shrink-0" />
                <button
                  type="button"
                  onClick={() => removeFile(f.url)}
                  className="text-text-muted hover:text-error transition-colors shrink-0"
                  aria-label={`Remover ${f.name}`}
                >
                  <X size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
