"use client";

import * as React from "react";
import { Background, BackgroundVariant, MarkerType, Position, ReactFlow, type Connection, type Edge, type Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { FileText, GitBranch } from "lucide-react";
import { useCanvasStore } from "@/store/canvasStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import type { Page, Transition } from "@/types/schema";

interface PageSummaryData extends Record<string, unknown> {
  label: React.ReactNode;
}

function autoLayout(pages: Page[], transitions: Transition[]) {
  const positions = new Map<string, { x: number; y: number }>();
  if (!pages.length) return positions;

  const ids = new Set(pages.map((page) => page.id));
  const outgoing = new Map<string, string[]>();
  const incoming = new Map(pages.map((page) => [page.id, 0]));
  let hasEdges = false;

  transitions.forEach((transition) => {
    const source = transition.source.pageId;
    const target = transition.target.pageId;
    if (!ids.has(source) || !ids.has(target) || source === target) return;
    hasEdges = true;
    const targets = outgoing.get(source) ?? [];
    if (!targets.includes(target)) targets.push(target);
    outgoing.set(source, targets);
    incoming.set(target, (incoming.get(target) ?? 0) + 1);
  });

  if (!hasEdges) {
    pages.forEach((page, index) => positions.set(page.id, { x: (index % 4) * 240, y: Math.floor(index / 4) * 112 }));
    return positions;
  }

  const roots = pages
    .filter((page) => page.route.isIndex || incoming.get(page.id) === 0)
    .sort((a, b) => Number(b.route.isIndex) - Number(a.route.isIndex));
  const queue = roots.length ? roots.map((page) => page.id) : [pages[0].id];
  const depth = new Map(queue.map((id) => [id, 0]));

  for (let index = 0; index < queue.length; index += 1) {
    const source = queue[index];
    const nextDepth = (depth.get(source) ?? 0) + 1;
    for (const target of outgoing.get(source) ?? []) {
      if (depth.has(target)) continue;
      depth.set(target, nextDepth);
      queue.push(target);
    }
  }

  const overflowDepth = Math.max(0, ...depth.values()) + 1;
  const columns = new Map<number, Page[]>();
  pages.forEach((page) => {
    const column = depth.get(page.id) ?? overflowDepth;
    columns.set(column, [...(columns.get(column) ?? []), page]);
  });
  [...columns.entries()].sort(([a], [b]) => a - b).forEach(([column, items]) => {
    items.forEach((page, row) => positions.set(page.id, { x: column * 252, y: row * 112 }));
  });
  return positions;
}

export default function FlowOverview() {
  const pages = useCanvasStore((state) => state.pages);
  const transitions = useCanvasStore((state) => state.transitions);
  const select = useCanvasStore((state) => state.select);
  const addTransition = useCanvasStore((state) => state.addTransition);
  const removeTransition = useCanvasStore((state) => state.removeTransition);
  const setActivePageId = useWorkspaceStore((state) => state.setActivePageId);
  const setView = useWorkspaceStore((state) => state.setView);
  const [showDisconnected, setShowDisconnected] = React.useState(false);

  const connectedPageIds = React.useMemo(() => {
    const ids = new Set<string>();
    transitions.forEach((transition) => {
      ids.add(transition.source.pageId);
      ids.add(transition.target.pageId);
    });
    return ids;
  }, [transitions]);
  const disconnectedCount = pages.filter((page) => !connectedPageIds.has(page.id)).length;
  const visiblePages = React.useMemo(
    () => connectedPageIds.size > 0 && !showDisconnected ? pages.filter((page) => connectedPageIds.has(page.id)) : pages,
    [connectedPageIds, pages, showDisconnected],
  );
  const visiblePageIds = React.useMemo(() => new Set(visiblePages.map((page) => page.id)), [visiblePages]);
  const visibleTransitions = React.useMemo(
    () => transitions.filter((transition) => visiblePageIds.has(transition.source.pageId) && visiblePageIds.has(transition.target.pageId)),
    [transitions, visiblePageIds],
  );
  const positions = React.useMemo(() => autoLayout(visiblePages, visibleTransitions), [visiblePages, visibleTransitions]);

  const nodes = React.useMemo<Node<PageSummaryData>[]>(() => visiblePages.map((page, index) => ({
    id: page.id,
    position: positions.get(page.id) ?? { x: (index % 4) * 240, y: Math.floor(index / 4) * 112 },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    style: { width: 208, padding: 0, border: 0, borderRadius: 8, background: "transparent" },
    data: {
      label: (
        <div className="overflow-hidden rounded-md border border-gray-200 bg-white text-left shadow-[0_5px_18px_rgba(15,23,42,0.05)] transition hover:border-gray-300 hover:shadow-[0_9px_24px_rgba(15,23,42,0.08)]">
          <div className="flex h-10 items-center gap-2 px-2.5">
            <span className="grid h-6 w-6 place-items-center rounded bg-gray-950 text-white"><FileText size={12} /></span>
            <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-gray-800">{page.name}</span>
            {page.route.isIndex && <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[8px] font-medium text-emerald-700">入口</span>}
          </div>
          <div className="flex h-7 items-center border-t border-gray-100 px-2.5 text-[9px] text-gray-400">
            <span className="truncate font-mono">{page.route.path}</span>
            <span className="ml-auto shrink-0">{page.nodes.length} 图层</span>
          </div>
        </div>
      ),
    },
  })), [positions, visiblePages]);

  const edges = React.useMemo<Edge[]>(() => {
    const groups = new Map<string, { source: string; target: string; ids: string[] }>();
    visibleTransitions.forEach((transition) => {
      const key = `${transition.source.pageId}:${transition.target.pageId}`;
      const group = groups.get(key) ?? { source: transition.source.pageId, target: transition.target.pageId, ids: [] };
      group.ids.push(transition.id);
      groups.set(key, group);
    });
    return [...groups.entries()].map(([id, group]) => ({
      id: `flow-${id}`,
      source: group.source,
      target: group.target,
      type: "smoothstep",
      markerEnd: { type: MarkerType.ArrowClosed, color: "#64748b" },
      label: group.ids.length > 1 ? `${group.ids.length}` : undefined,
      data: { transitionIds: group.ids },
      labelStyle: { fill: "#64748b", fontSize: 9 },
      style: { stroke: "#94a3b8", strokeWidth: 1.35 },
    }));
  }, [visibleTransitions]);

  if (!pages.length) return <div className="grid h-full place-items-center bg-[#f5f5f3] text-xs text-gray-400">创建页面后，流程会在这里自动整理。</div>;

  return (
    <div className="flex h-full w-full flex-col bg-[#f5f5f3]">
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-gray-200 bg-white px-4">
        <span className="grid h-7 w-7 place-items-center rounded-md bg-gray-100 text-gray-600"><GitBranch size={14} /></span>
        <div>
          <div className="text-xs font-semibold text-gray-800">交互流程</div>
          <div className="text-[10px] text-gray-400">{visiblePages.length} 个页面 · {edges.length} 条连接</div>
        </div>
        {disconnectedCount > 0 && connectedPageIds.size > 0 && (
          <button className={`ml-auto h-7 rounded-md px-2.5 text-[11px] font-medium ${showDisconnected ? "bg-gray-900 text-white" : "border border-gray-200 bg-white text-gray-500 hover:text-gray-800"}`} onClick={() => setShowDisconnected((value) => !value)}>
            未连接 {disconnectedCount}
          </button>
        )}
      </div>
      <div className="min-h-0 flex-1">
        <ReactFlow<Node<PageSummaryData>, Edge>
          nodes={nodes}
          edges={edges}
          fitView
          fitViewOptions={{ padding: 0.18, maxZoom: 1 }}
          minZoom={0.35}
          maxZoom={1.35}
          nodesDraggable={false}
          nodesConnectable
          onConnect={(connection: Connection) => {
            if (!connection.source || !connection.target || connection.source === connection.target) return;
            const duplicate = transitions.some((transition) => transition.source.pageId === connection.source && transition.target.pageId === connection.target);
            if (duplicate) return;
            const sourcePage = pages.find((page) => page.id === connection.source);
            const sourceNode = sourcePage?.nodes.find((node) => node.type === "Button") ?? sourcePage?.nodes[0];
            const id = addTransition({ pageId: connection.source, nodeId: sourceNode?.id ?? `page:${connection.source}`, event: "onClick" }, { pageId: connection.target });
            if (id) select({ type: "transition", id });
          }}
          onEdgesDelete={(deletedEdges) => {
            deletedEdges.forEach((edge) => {
              const ids = (edge.data?.transitionIds as string[] | undefined) ?? [];
              ids.forEach(removeTransition);
            });
          }}
          onEdgeClick={(_event, edge) => {
            const id = (edge.data?.transitionIds as string[] | undefined)?.[0];
            if (id) select({ type: "transition", id });
          }}
          onNodeClick={(_event, node) => { select({ type: "page", id: node.id }); setActivePageId(node.id); }}
          onNodeDoubleClick={(_event, node) => { select({ type: "page", id: node.id }); setActivePageId(node.id); setView("design"); }}
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#d9d9d5" />
        </ReactFlow>
      </div>
    </div>
  );
}
