"use client";
import * as React from "react";
import { Box, Component, Eye, EyeOff, GripVertical, ImagePlus, Layers3, Lock, Palette, Plus, ScanLine, Unlock } from "lucide-react";
import { ComponentLibrary } from "@/panels/ComponentLibrary";
import { useCanvasStore } from "@/store/canvasStore";
import { useWorkspaceStore, type SidebarTab } from "@/store/workspaceStore";
import { extractPaletteFromCanvas, extractPaletteFromImage } from "@/lib/palette";
import { toast } from "@/lib/toast";
import type { DesignToken, UINode } from "@/types/schema";

const tabs: Array<{ id: SidebarTab; label: string; icon: React.ElementType }> = [
  { id: "layers", label: "图层", icon: Layers3 },
  { id: "components", label: "组件", icon: Component },
  { id: "tokens", label: "变量", icon: Palette },
];

function LayerItem({ node, depth, nodes, pageId, draggingId, onDragStart, onDrop }: { node: UINode; depth: number; nodes: UINode[]; pageId: string; draggingId: string | null; onDragStart: (id: string | null) => void; onDrop: (targetId: string) => void }) {
  const selection = useCanvasStore((s) => s.selection);
  const select = useCanvasStore((s) => s.select);
  const updateNode = useCanvasStore((s) => s.updateNode);
  const setActivePageId = useWorkspaceStore((s) => s.setActivePageId);
  const children = nodes.filter((child) => child.parentId === node.id);
  const selected = selection.type === "node" && selection.id === node.id;

  return (
    <li>
      <div
        draggable
        onDragStart={(event) => { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/routecanvas-layer", node.id); onDragStart(node.id); }}
        onDragEnd={() => onDragStart(null)}
        onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; }}
        onDrop={(event) => { event.preventDefault(); event.stopPropagation(); onDrop(node.id); }}
        className={`group flex h-8 items-center gap-1 rounded px-1.5 text-xs ${draggingId === node.id ? "opacity-35" : ""} ${selected ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-50"}`}
        style={{ paddingLeft: 6 + depth * 12 }}
      >
        <GripVertical size={11} className="shrink-0 cursor-grab text-gray-300 opacity-0 group-hover:opacity-100" />
        <button
          className="min-w-0 flex flex-1 items-center gap-1.5 text-left"
          onClick={() => {
            setActivePageId(pageId);
            select({ type: "node", id: node.id, pageId });
          }}
        >
          <Box size={13} className="shrink-0 text-gray-400" />
          <span className="truncate">{node.props?.text || node.type}</span>
          {node.layout?.mode && node.layout.mode !== "absolute" && <span className="text-[9px] text-indigo-400">{node.layout.mode}</span>}
        </button>
        <button
          className="hidden rounded p-0.5 text-gray-400 hover:bg-white hover:text-gray-700 group-hover:inline-flex"
          onClick={() => updateNode(pageId, node.id, { hidden: !node.hidden })}
          title={node.hidden ? "显示" : "隐藏"}
        >
          {node.hidden ? <EyeOff size={12} /> : <Eye size={12} />}
        </button>
        <button
          className="hidden rounded p-0.5 text-gray-400 hover:bg-white hover:text-gray-700 group-hover:inline-flex"
          onClick={() => updateNode(pageId, node.id, { locked: !node.locked })}
          title={node.locked ? "解锁" : "锁定"}
        >
          {node.locked ? <Lock size={12} /> : <Unlock size={12} />}
        </button>
      </div>
      {children.length > 0 && <ul>{children.sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0)).map((child) => <LayerItem key={child.id} node={child} depth={depth + 1} nodes={nodes} pageId={pageId} draggingId={draggingId} onDragStart={onDragStart} onDrop={onDrop} />)}</ul>}
    </li>
  );
}

function LayersPanel() {
  const pages = useCanvasStore((s) => s.pages);
  const activePageId = useWorkspaceStore((s) => s.activePageId);
  const page = pages.find((item) => item.id === activePageId) ?? pages[0];
  const reorderNodes = useCanvasStore((s) => s.reorderNodes);
  const [draggingId, setDraggingId] = React.useState<string | null>(null);

  const reorder = (targetId: string) => {
    if (!page || !draggingId || draggingId === targetId) return;
    const ordered = [...page.nodes].sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0)).map((node) => node.id);
    const sourceIndex = ordered.indexOf(draggingId);
    const targetIndex = ordered.indexOf(targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;
    ordered.splice(sourceIndex, 1);
    ordered.splice(targetIndex, 0, draggingId);
    reorderNodes(page.id, ordered);
    setDraggingId(null);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-2">
        {page ? (
          <ul className="space-y-0.5">
            {page.nodes.filter((node) => !node.parentId).sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0)).map((node) => (
              <LayerItem key={node.id} node={node} depth={0} nodes={page.nodes} pageId={page.id} draggingId={draggingId} onDragStart={setDraggingId} onDrop={reorder} />
            ))}
          </ul>
        ) : <div className="p-4 text-center text-xs text-gray-400">创建页面后开始设计</div>}
      </div>
    </div>
  );
}

function TokensPanel() {
  const designSystem = useCanvasStore((s) => s.designSystem);
  const updateDesignSystem = useCanvasStore((s) => s.updateDesignSystem);
  const tokens = designSystem?.tokens ?? [];
  const fileRef = React.useRef<HTMLInputElement>(null);

  const updateToken = (id: string, patch: Partial<DesignToken>) => {
    updateDesignSystem({ tokens: tokens.map((token) => token.id === id ? { ...token, ...patch } : token) });
  };

  /** 把提取到的颜色写入为 token（跳过已存在的色值） */
  const importColors = (colors: string[], source: string) => {
    const existing = new Set(tokens.filter((t) => t.type === "color").map((t) => String(t.value).toLowerCase()));
    const fresh = colors.filter((hex) => !existing.has(hex.toLowerCase()));
    if (!fresh.length) {
      toast.success("没有发现新颜色");
      return;
    }
    updateDesignSystem({
      tokens: [
        ...tokens,
        ...fresh.map((hex, index) => ({
          id: `token_${Date.now().toString(36)}_${index}`,
          name: `color.${source}.${index + 1}`,
          type: "color" as const,
          value: hex,
        })),
      ],
    });
    toast.success(`已提取 ${fresh.length} 个颜色变量`);
  };

  const onPickImage = async (file: File) => {
    try {
      const colors = await extractPaletteFromImage(file, 6);
      importColors(colors, "brand");
    } catch (e) {
      toast.error(`取色失败：${(e as Error).message}`);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2">
        <span className="text-xs font-semibold text-gray-600">设计变量</span>
        <button
          className="rounded p-1 text-indigo-600 hover:bg-indigo-50"
          title="新增变量"
          onClick={() => updateDesignSystem({ tokens: [...tokens, { id: `token_${Date.now().toString(36)}`, name: "color.new", type: "color", value: "#64748b" }] })}
        >
          <Plus size={14} />
        </button>
      </div>
      <div className="flex gap-1.5 border-b border-gray-100 p-2">
        <button
          className="flex h-7 flex-1 items-center justify-center gap-1 rounded border border-gray-200 text-[10px] font-medium text-gray-600 hover:border-indigo-300 hover:text-indigo-600"
          title="上传参考图，自动提取品牌色板"
          onClick={() => fileRef.current?.click()}
        >
          <ImagePlus size={12} /> 图片取色
        </button>
        <button
          className="flex h-7 flex-1 items-center justify-center gap-1 rounded border border-gray-200 text-[10px] font-medium text-gray-600 hover:border-indigo-300 hover:text-indigo-600"
          title="扫描当前画布已使用的颜色"
          onClick={() => importColors(extractPaletteFromCanvas(10), "canvas")}
        >
          <ScanLine size={12} /> 画布扫描
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void onPickImage(file); event.target.value = ""; }} />
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {tokens.map((token) => (
          <div key={token.id} className="rounded border border-gray-200 p-2">
            <input
              className="w-full bg-transparent text-xs font-medium text-gray-700 outline-none"
              value={token.name}
              onChange={(event) => updateToken(token.id, { name: event.target.value })}
            />
            <div className="mt-1 flex items-center gap-1.5">
              {token.type === "color" && <input type="color" className="h-6 w-7 rounded border border-gray-200 p-0.5" value={String(token.value)} onChange={(event) => updateToken(token.id, { value: event.target.value })} />}
              <input
                className="min-w-0 flex-1 bg-transparent text-[11px] text-gray-500 outline-none"
                value={String(token.value)}
                onChange={(event) => updateToken(token.id, { value: token.type === "number" ? Number(event.target.value) : event.target.value })}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComponentsPanel() {
  const components = useCanvasStore((s) => s.designSystem?.components ?? []);
  const pages = useCanvasStore((s) => s.pages);
  const createInstance = useCanvasStore((s) => s.createComponentInstance);
  const activePageId = useWorkspaceStore((s) => s.activePageId);
  const pageId = activePageId ?? pages[0]?.id;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {components.length > 0 && (
        <div className="shrink-0 border-b border-gray-200 p-2">
          <div className="mb-1.5 px-1 text-[10px] font-semibold uppercase text-gray-400">本地组件</div>
          <div className="max-h-32 space-y-1 overflow-y-auto">
            {components.map((component) => (
              <div key={component.id} className="flex items-center gap-2 rounded border border-gray-200 px-2 py-1.5">
                <Component size={13} className="shrink-0 text-indigo-500" />
                <div className="min-w-0 flex-1"><div className="truncate text-[11px] font-medium text-gray-700">{component.name}</div><div className="text-[9px] text-gray-400">{component.variants.length} variants</div></div>
                <button className="rounded p-1 text-indigo-600 hover:bg-indigo-50 disabled:opacity-40" title="插入实例" disabled={!pageId} onClick={() => pageId && createInstance(pageId, component.id)}><Plus size={13} /></button>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="min-h-0 flex-1"><ComponentLibrary embedded /></div>
    </div>
  );
}

export function DesignSidebar() {
  const tab = useWorkspaceStore((s) => s.sidebarTab);
  const expanded = useWorkspaceStore((s) => s.designPanelExpanded);
  const togglePanel = useWorkspaceStore((s) => s.toggleDesignPanel);
  return (
    <aside className={`flex h-full min-h-0 shrink-0 overflow-hidden border-r border-gray-200 bg-white ${expanded ? "w-52" : "w-11"}`}>
      <nav className="flex w-11 flex-col items-center gap-1 border-r border-gray-100 py-2">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} className={`grid h-8 w-8 place-items-center rounded ${tab === id && expanded ? "bg-indigo-50 text-indigo-600" : "text-gray-400 hover:bg-gray-50 hover:text-gray-700"}`} title={label} onClick={() => togglePanel(id)}>
            <Icon size={16} />
          </button>
        ))}
      </nav>
      {expanded && <div className="h-full min-h-0 min-w-0 flex-1 overflow-hidden">
        {tab === "layers" && <LayersPanel />}
        {tab === "components" && <ComponentsPanel />}
        {tab === "tokens" && <TokensPanel />}
      </div>}
    </aside>
  );
}
