"use client";
import * as React from "react";
import { memo } from "react";
import { Handle, Position, NodeResizer, type NodeProps } from "@xyflow/react";
import { Trash2, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";
import { useCanvasStore } from "@/store/canvasStore";
import { findComponentDef } from "@/components/registry";
import { renderComponent } from "@/components/renderer";
import { useAnnotateStore } from "@/store/annotateStore";
import type { UINodeData } from "@/canvas/rfAdapter";

function UINodeInner({ id, data, selected }: NodeProps) {
  const d = data as UINodeData;
  const { node, pageId } = d;
  const select = useCanvasStore((s) => s.select);
  const removeNode = useCanvasStore((s) => s.removeNode);
  const registry = useCanvasStore((s) => s.componentRegistry);
  const def = findComponentDef(registry, node.type);

  return (
    <div
      onPointerDown={(e) => {
        e.stopPropagation();
        select({ type: "node", id, pageId });
      }}
      className={cn(
        "relative rounded-md p-0",
        selected ? "ring-2 ring-blue-500 ring-offset-1" : "",
      )}
      style={{ width: "100%", height: "100%" }}
    >
      {/* 缩放手柄：选中时显示 */}
      {selected && (
        <NodeResizer
          minWidth={40}
          minHeight={28}
          lineClassName="!border-blue-400"
          handleClassName="!h-2.5 !w-2.5 !rounded-sm !border-2 !border-blue-500 !bg-white !shadow"
        />
      )}
      {/* source handle：从右边缘拉出连线到目标页面 */}
      <Handle
        type="source"
        position={Position.Right}
        id="source"
        className="!h-2.5 !w-2.5 !bg-emerald-500"
      />
      <div className="w-full h-full overflow-hidden">
        {renderComponent({ def, props: node.props ?? {} })}
      </div>
      {selected && (
        <>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              useAnnotateStore.getState().open({ mode: "edit", pageId, nodes: [node] });
            }}
            className="absolute -top-3 -left-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-full p-1 shadow hover:scale-110 transition-transform"
            title="AI 局部精修（涂画标注 + 指令）"
          >
            <Sparkles size={12} />
          </button>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              removeNode(pageId, id);
            }}
            className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1 shadow"
            title="删除节点"
          >
            <Trash2 size={12} />
          </button>
        </>
      )}
    </div>
  );
}

export const UINode = memo(UINodeInner);
