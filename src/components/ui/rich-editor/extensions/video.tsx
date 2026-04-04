import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer, type ReactNodeViewProps } from "@tiptap/react";

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

function VideoNodeView({
  node,
}: ReactNodeViewProps) {
  const { src, provider } = node.attrs;

  let embedSrc: string | null = null;
  if (provider === "youtube") {
    const id = extractYouTubeId(src);
    if (id) embedSrc = `https://www.youtube.com/embed/${id}`;
  } else if (provider === "vimeo") {
    const id = extractVimeoId(src);
    if (id) embedSrc = `https://player.vimeo.com/video/${id}`;
  }

  return (
    <NodeViewWrapper className="my-4">
      <div className="relative w-full aspect-video rounded-[var(--radius-md)] overflow-hidden bg-black">
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
    </NodeViewWrapper>
  );
}

function detectProvider(url: string): string {
  if (/youtube\.com|youtu\.be/.test(url)) return "youtube";
  if (/vimeo\.com/.test(url)) return "vimeo";
  return "upload";
}

export const VideoBlock = Node.create({
  name: "video",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      provider: { default: "upload" },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="video"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "video" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(VideoNodeView);
  },
});

export { detectProvider };
