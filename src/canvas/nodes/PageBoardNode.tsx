"use client";
import * as React from "react";
import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { useCanvasStore } from "@/store/canvasStore";
import type { PageNodeData } from "@/canvas/rfAdapter";

function PageBoardNodeInner({ id, data, selected }: NodeProps) {
  const d = data as PageNodeData;
  const page = d.page;
  const collapsed = page.layout.collapsed ?? false;
  const select = useCanvasStore((s) => s.select);
  const setPageCollapsed = useCanvasStore((s) => s.setPageCollapsed);
  const removePage = useCanvasStore((s) => s.removePage);
  const [confirmDel, setConfirmDel] = React.useState(false);

  const onPointer = (e: React.MouseEvent) => {
    e.stopPropagation();
    select({ type: "page", id });
  };

  return (
    <div
      onPointerDown={onPointer}
      className={cn(
        "relative rounded-lg border-2 bg-white/80 backdrop-blur shadow-sm select-none",
        selected ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-300",
      )}
      style={{ width: "100%", height: "100%" }}
    >
      {/* target handle：接收连线，位于左边缘中央 */}
      <Handle
        type="target"
        position={Position.Left}
        id="target"
        className="!h-3 !w-3 !bg-blue-500"
      />
      {/* 标题栏 */}
      <div className="flex items-center gap-2 px-3 h-11 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            setPageCollapsed(id, !collapsed);
          }}
          className="text-gray-400 hover:text-gray-700"
          title={collapsed ? "展开" : "折叠"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
        </button>
        <div className="font-medium text-sm text-gray-800 truncate flex-1">
          {page.name}
        </div>
        <code className="text-[11px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
          {page.route.path}
        </code>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            if (confirmDel) {
              removePage(id);
            } else {
              setConfirmDel(true);
              setTimeout(() => setConfirmDel(false), 2500);
            }
          }}
          className={cn(
            "text-xs px-1.5 py-0.5 rounded transition-colors",
            confirmDel ? "bg-red-500 text-white" : "text-gray-300 hover:text-red-500",
          )}
          title={confirmDel ? "再次点击确认删除" : "删除页面"}
        >
          {confirmDel ? "确认?" : <Trash2 size={14} />}
        </button>
      </div>
      {/* 页面内容区：仅展开时显示，子节点由 RF 渲染到此容器 */}
      {!collapsed && (
        <div className="relative w-full" style={{ height: "calc(100% - 44px)" }} />
      )}
    </div>
  );
}

export const PageBoardNode = memo(PageBoardNodeInner);
