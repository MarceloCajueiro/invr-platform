import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer, type ReactNodeViewProps } from "@tiptap/react";

function AudioNodeView({ node }: ReactNodeViewProps) {
  return (
    <NodeViewWrapper className="my-4">
      <div className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] bg-[#f8f9fb] border border-border">
        <audio controls className="flex-1 h-10" preload="metadata">
          <source src={node.attrs.src} />
        </audio>
        {node.attrs.name && (
          <span className="text-xs text-text-muted truncate max-w-40">
            {node.attrs.name}
          </span>
        )}
      </div>
    </NodeViewWrapper>
  );
}

export const AudioBlock = Node.create({
  name: "audio",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      name: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="audio"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "audio" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(AudioNodeView);
  },
});
