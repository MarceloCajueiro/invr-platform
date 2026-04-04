import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer, type ReactNodeViewProps } from "@tiptap/react";

function EmbedNodeView({ node }: ReactNodeViewProps) {
  return (
    <NodeViewWrapper className="my-4">
      <div className="relative w-full aspect-video rounded-[var(--radius-md)] overflow-hidden border border-border">
        <iframe
          src={node.attrs.src}
          sandbox="allow-scripts allow-same-origin allow-popups"
          className="absolute inset-0 w-full h-full"
        />
      </div>
    </NodeViewWrapper>
  );
}

export const EmbedBlock = Node.create({
  name: "embed",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="embed"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "embed" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(EmbedNodeView);
  },
});
