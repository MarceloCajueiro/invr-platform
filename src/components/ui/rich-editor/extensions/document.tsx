import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer, type ReactNodeViewProps } from "@tiptap/react";
import { FileText, Download } from "lucide-react";

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DocumentNodeView({
  node,
}: ReactNodeViewProps) {
  return (
    <NodeViewWrapper className="my-4">
      <a
        href={node.attrs.src}
        download={node.attrs.name}
        className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] bg-[#f8f9fb] border border-border hover:border-aulas transition-colors"
      >
        <FileText size={20} className="text-text-muted shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">
            {node.attrs.name}
          </p>
          {node.attrs.size > 0 && (
            <p className="text-xs text-text-muted">
              {formatFileSize(node.attrs.size)}
            </p>
          )}
        </div>
        <Download size={16} className="text-text-muted shrink-0" />
      </a>
    </NodeViewWrapper>
  );
}

export const DocumentBlock = Node.create({
  name: "document",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      name: { default: "" },
      size: { default: 0 },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="document"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "document" }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(DocumentNodeView);
  },
});
