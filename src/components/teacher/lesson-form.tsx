"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileUpload, type FileItem } from "@/components/ui/file-upload";
import { Film, ImageIcon, Music, FileText, Link, Upload } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface LessonData {
  id: string;
  title: string;
  description: string | null;
  category: "conversation" | "grammar" | "vocabulary" | "listening" | "culture";
  videoUrl: string | null;
  coverImageUrl: string | null;
  durationMinutes: number | null;
  audioUrls: string | null;
  documentUrls: string | null;
}

interface LessonFormProps {
  lesson?: LessonData;
  action: (formData: FormData) => Promise<void>;
}

// ── Constants ────────────────────────────────────────────────────────────────

const categoryOptions = [
  { value: "conversation", label: "Conversação" },
  { value: "grammar", label: "Gramática" },
  { value: "vocabulary", label: "Vocabulário" },
  { value: "listening", label: "Listening" },
  { value: "culture", label: "Cultura" },
];

const MB = 1024 * 1024;

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseFileItems(json: string | null | undefined): FileItem[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function coverUrlToFileItems(url: string | null | undefined): FileItem[] {
  if (!url) return [];
  return [{ url, name: url.split("/").pop() ?? "cover", size: 0 }];
}

function videoUrlToFileItems(url: string | null | undefined): FileItem[] {
  if (!url || url.startsWith("http")) return [];
  // Only treat as uploaded file if it's an internal /api/files/ path
  if (url.startsWith("/api/files/")) {
    return [{ url, name: url.split("/").pop() ?? "video", size: 0 }];
  }
  return [];
}

// ── Component ────────────────────────────────────────────────────────────────

export function LessonForm({ lesson, action }: LessonFormProps) {
  const isEdit = !!lesson;

  // Determine initial video mode based on existing data
  const initialVideoMode =
    lesson?.videoUrl && !lesson.videoUrl.startsWith("/api/files/")
      ? "link"
      : lesson?.videoUrl?.startsWith("/api/files/")
        ? "upload"
        : "link";

  const [videoMode, setVideoMode] = useState<"link" | "upload">(
    initialVideoMode
  );

  // Parse existing files for edit mode
  const existingCover = useMemo(
    () => coverUrlToFileItems(lesson?.coverImageUrl),
    [lesson?.coverImageUrl]
  );
  const existingAudios = useMemo(
    () => parseFileItems(lesson?.audioUrls),
    [lesson?.audioUrls]
  );
  const existingDocs = useMemo(
    () => parseFileItems(lesson?.documentUrls),
    [lesson?.documentUrls]
  );
  const existingVideo = useMemo(
    () => videoUrlToFileItems(lesson?.videoUrl),
    [lesson?.videoUrl]
  );

  return (
    <form action={action} className="space-y-6">
      {/* Hidden field for video source mode */}
      <input type="hidden" name="videoSource" value={videoMode} />

      {/* ── Section 1: Informacoes basicas ─────────────────────────────── */}
      <Card>
        <CardContent className="pt-6 space-y-5">
          <Input
            label="Título"
            name="title"
            placeholder="Ex: Introdução a conversação"
            defaultValue={lesson?.title ?? ""}
            required
          />

          <Select
            label="Categoria"
            name="category"
            options={categoryOptions}
            defaultValue={lesson?.category ?? "conversation"}
          />

          <Textarea
            label="Descrição"
            name="description"
            placeholder="Descreva o conteúdo da aula..."
            rows={4}
            defaultValue={lesson?.description ?? ""}
          />
        </CardContent>
      </Card>

      {/* ── Section 2: Video ──────────────────────────────────────────── */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Film size={16} />
            Video
          </h3>

          {/* Tab toggle */}
          <div className="flex gap-1 p-1 bg-bg-light rounded-md w-fit">
            <button
              type="button"
              onClick={() => setVideoMode("link")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                videoMode === "link"
                  ? "bg-bg-card text-aulas shadow-sm"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              <Link size={14} />
              Link
            </button>
            <button
              type="button"
              onClick={() => setVideoMode("upload")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                videoMode === "upload"
                  ? "bg-bg-card text-aulas shadow-sm"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              <Upload size={14} />
              Upload
            </button>
          </div>

          {videoMode === "link" ? (
            <Input
              label="URL do Vídeo"
              name="videoUrl"
              type="url"
              placeholder="https://youtube.com/..."
              defaultValue={
                lesson?.videoUrl && !lesson.videoUrl.startsWith("/api/files/")
                  ? lesson.videoUrl
                  : ""
              }
            />
          ) : (
            <FileUpload
              name="videoFile"
              accept="video/mp4,video/webm,video/quicktime"
              maxSize={500 * MB}
              maxFiles={1}
              folder="lessons/videos"
              label="Upload de Vídeo"
              description="MP4, WebM, QuickTime. Máximo 500MB"
              existingFiles={existingVideo}
            />
          )}
        </CardContent>
      </Card>

      {/* ── Section 3: Imagem de capa ─────────────────────────────────── */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <ImageIcon size={16} />
            Imagem de Capa
          </h3>
          <FileUpload
            name="coverImageFile"
            accept="image/jpeg,image/png,image/webp"
            maxSize={5 * MB}
            maxFiles={1}
            folder="lessons/covers"
            label="Imagem de Capa"
            description="JPG, PNG, WebP. Máximo 5MB"
            existingFiles={existingCover}
          />
        </CardContent>
      </Card>

      {/* ── Section 4: Audios ─────────────────────────────────────────── */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Music size={16} />
            Audios da Aula
          </h3>
          <FileUpload
            name="audioUrls"
            accept="audio/mpeg,audio/wav,audio/ogg,audio/mp4"
            maxSize={50 * MB}
            maxFiles={10}
            folder="lessons/audios"
            label="Audios da Aula"
            description="MP3, WAV, OGG. Máximo 50MB por arquivo, até 10 arquivos"
            existingFiles={existingAudios}
          />
        </CardContent>
      </Card>

      {/* ── Section 5: Materiais ──────────────────────────────────────── */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <FileText size={16} />
            Materiais de Apoio
          </h3>
          <FileUpload
            name="documentUrls"
            accept="application/pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
            maxSize={20 * MB}
            maxFiles={10}
            folder="lessons/documents"
            label="Materiais de Apoio"
            description="PDF, DOC, PPT, XLS. Máximo 20MB por arquivo, até 10 arquivos"
            existingFiles={existingDocs}
          />
        </CardContent>
      </Card>

      {/* ── Section 6: Duracao ────────────────────────────────────────── */}
      <Card>
        <CardContent className="pt-6">
          <Input
            label="Duração (minutos)"
            name="durationMinutes"
            type="number"
            min={0}
            placeholder="Ex: 30"
            defaultValue={lesson?.durationMinutes?.toString() ?? ""}
          />
        </CardContent>
      </Card>

      {/* ── Submit ────────────────────────────────────────────────────── */}
      <div className="flex justify-end">
        <Button type="submit">
          {isEdit ? "Salvar Alterações" : "Criar Aula"}
        </Button>
      </div>
    </form>
  );
}
