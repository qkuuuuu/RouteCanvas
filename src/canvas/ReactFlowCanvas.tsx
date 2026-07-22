"use client";
import * as React from "react";
import { useCallback } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  MiniMap,
  Controls,
  Panel,
  useReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Edge,
  type Node,
  type NodeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCanvasStore } from "@/store/canvasStore";
import {
  toRFNodes,
  toRFEdges,
  PAGE_NODE_TYPE,
  UI_NODE_TYPE,
  TRANSITION_EDGE_TYPE,
  defaultSizeForType,
  type RFNode,
  type RFEdge,
  type RFNodeData,
  type UINodeData,
} from "./rfAdapter";
import { PageBoardNode } from "./nodes/PageBoardNode";
import { UINode } from "./nodes/UINode";
import { TransitionEdge } from "./edges/TransitionEdge";
import { locateNode } from "./rfAdapter";
import { toast } from "@/lib/toast";
import { exportDocument } from "@/data/serializer";
import { useAnnotateStore } from "@/store/annotateStore";
import { Pen, Minus, Square, Circle, MoveUpRight, Triangle, Sparkles } from "lucide-react";

const nodeTypes = {
  [PAGE_NODE_TYPE]: PageBoardNode,
  [UI_NODE_TYPE]: UINode,
};
const edgeTypes = {
  [TRANSITION_EDGE_TYPE]: TransitionEdge,
};

type DrawMode = "free" | "line" | "rect" | "ellipse" | "arrow" | "triangle";

/** 生成形状预览 path（屏幕坐标） */
function buildShapePreview(mode: DrawMode, p0: { x: number; y: number }, p1: { x: number; y: number }): string {
  const { x: x0, y: y0 } = p0;
  const { x: x1, y: y1 } = p1;
  switch (mode) {
    case "line":
    case "arrow":
      return `M${x0},${y0} L${x1},${y1}`;
    case "rect":
      return `M${x0},${y0} L${x1},${y0} L${x1},${y1} L${x0},${y1} Z`;
    case "ellipse": {
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      const rx = Math.abs(x1 - x0) / 2, ry = Math.abs(y1 - y0) / 2;
      return `M${cx - rx},${cy} A${rx},${ry} 0 1,0 ${cx + rx},${cy} A${rx},${ry} 0 1,0 ${cx - rx},${cy}`;
    }
    case "triangle": {
      const mx = (x0 + x1) / 2;
      return `M${mx},${y0} L${x1},${y1} L${x0},${y1} Z`;
    }
    default:
      return `M${x0},${y0} L${x1},${y1}`;
  }
}

/** 生成形状 pathData（归一化到 200x150 viewBox） */
function buildShapePath(mode: DrawMode, p0: { x: number; y: number }, p1: { x: number; y: number }, w: number, h: number, minX: number, minY: number): string {
  const nx = (x: number) => ((x - minX) / w) * 200;
  const ny = (y: number) => ((y - minY) / h) * 150;
  const x0 = nx(p0.x), y0 = ny(p0.y), x1 = nx(p1.x), y1 = ny(p1.y);
  switch (mode) {
    case "line":
      return `M${x0.toFixed(1)},${y0.toFixed(1)} L${x1.toFixed(1)},${y1.toFixed(1)}`;
    case "arrow": {
      const angle = Math.atan2(y1 - y0, x1 - x0);
      const headLen = 15;
      const a1x = x1 - headLen * Math.cos(angle - 0.4);
      const a1y = y1 - headLen * Math.sin(angle - 0.4);
      const a2x = x1 - headLen * Math.cos(angle + 0.4);
      const a2y = y1 - headLen * Math.sin(angle + 0.4);
      return `M${x0.toFixed(1)},${y0.toFixed(1)} L${x1.toFixed(1)},${y1.toFixed(1)} M${x1.toFixed(1)},${y1.toFixed(1)} L${a1x.toFixed(1)},${a1y.toFixed(1)} M${x1.toFixed(1)},${y1.toFixed(1)} L${a2x.toFixed(1)},${a2y.toFixed(1)}`;
    }
    case "rect":
      return `M${x0.toFixed(1)},${y0.toFixed(1)} L${x1.toFixed(1)},${y0.toFixed(1)} L${x1.toFixed(1)},${y1.toFixed(1)} L${x0.toFixed(1)},${y1.toFixed(1)} Z`;
    case "ellipse": {
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      const rx = Math.abs(x1 - x0) / 2, ry = Math.abs(y1 - y0) / 2;
      return `M${(cx - rx).toFixed(1)},${cy.toFixed(1)} A${rx.toFixed(1)},${ry.toFixed(1)} 0 1,0 ${(cx + rx).toFixed(1)},${cy.toFixed(1)} A${rx.toFixed(1)},${ry.toFixed(1)} 0 1,0 ${(cx - rx).toFixed(1)},${cy.toFixed(1)}`;
    }
    case "triangle": {
      const mx = (x0 + x1) / 2;
      return `M${mx.toFixed(1)},${y0.toFixed(1)} L${x1.toFixed(1)},${y1.toFixed(1)} L${x0.toFixed(1)},${y1.toFixed(1)} Z`;
    }
    default:
      return `M${x0.toFixed(1)},${y0.toFixed(1)} L${x1.toFixed(1)},${y1.toFixed(1)}`;
  }
}

function Flow() {
  const { screenToFlowPosition, flowToScreenPosition } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState<RFNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<RFEdge>([]);
  const clipboardRef = React.useRef<{ type: string; props: import("@/types/schema").NodeProps; size: { width: number; height: number } } | null>(null);

  // 画笔模式状态
  const [penActive, setPenActive] = React.useState(false);
  const [penColor, setPenColor] = React.useState("#000000");
  const [penWidth, setPenWidth] = React.useState(2);
  const [drawMode, setDrawMode] = React.useState<DrawMode>("free");
  const [aiGenerate, setAiGenerate] = React.useState(false);
  const drawingRef = React.useRef<{ points: { x: number; y: number }[]; pageId: string; startX: number; startY: number } | null>(null);
  const [drawPreview, setDrawPreview] = React.useState<string | null>(null);
  // 多选区域（同页多个 UI 节点）→ 供“区域精修”使用
  const [regionSel, setRegionSel] = React.useState<{ pageId: string; nodes: import("@/types/schema").UINode[] } | null>(null);

  const pages = useCanvasStore((s) => s.pages);
  const transitions = useCanvasStore((s) => s.transitions);
  const registry = useCanvasStore((s) => s.componentRegistry);
  const viewport = useCanvasStore((s) => s.meta.viewport) ?? { x: 0, y: 0, zoom: 1 };

  const updatePage = useCanvasStore((s) => s.updatePage);
  const updateNode = useCanvasStore((s) => s.updateNode);
  const removePage = useCanvasStore((s) => s.removePage);
  const removeNode = useCanvasStore((s) => s.removeNode);
  const removeTransition = useCanvasStore((s) => s.removeTransition);
  const addTransition = useCanvasStore((s) => s.addTransition);
  const addNode = useCanvasStore((s) => s.addNode);
  const select = useCanvasStore((s) => s.select);
  const clearSelection = useCanvasStore((s) => s.clearSelection);
  const setViewport = useCanvasStore((s) => s.setViewport);

  // 从规范 store 派生 RF 节点/边（store 变更时同步；拖拽时不写 store 故不抖动）
  // 注意：不依赖 meta（updatedAt 高频变化会导致无意义重渲染）
  const state = React.useMemo(
    () => ({ meta: { schemaVersion: "1.0.0" }, pages, transitions, componentRegistry: registry }),
    [pages, transitions, registry],
  );
  React.useEffect(() => {
    setNodes(toRFNodes(state));
  }, [state, setNodes]);
  React.useEffect(() => {
    setEdges(toRFEdges(state));
  }, [state, setEdges]);

  /* ---------- 回写 store：拖拽位置 ---------- */
  const onNodeDragStop = useCallback(
    (_e: MouseEvent | TouchEvent, node: Node) => {
      const d = node.data as RFNodeData;
      if (d.kind === "page") {
        updatePage(node.id, {
          layout: { ...d.page.layout, x: node.position.x, y: node.position.y },
        });
      } else {
        updateNode(d.pageId, node.id, {
          position: { x: node.position.x, y: node.position.y },
        });
      }
    },
    [updatePage, updateNode],
  );

  /* ---------- 回写 store：缩放尺寸 ---------- */
  const onNodesChangeWrapped = useCallback(
    (changes: NodeChange<RFNode>[]) => {
      onNodesChange(changes);
      // 检测 dimension 变化（缩放结束时 resizing=false）回写到 store
      for (const change of changes) {
        if (
          change.type === "dimensions" &&
          change.resizing === false &&
          change.dimensions
        ) {
          const store = useCanvasStore.getState();
          for (const page of store.pages) {
            const n = page.nodes.find((x) => x.id === change.id);
            if (n) {
              updateNode(page.id, change.id, {
                size: {
                  width: change.dimensions.width,
                  height: change.dimensions.height,
                },
              });
              break;
            }
          }
        }
      }
    },
    [onNodesChange, updateNode],
  );

  const onNodesDelete = useCallback(
    (deleted: Node[]) => {
      for (const node of deleted) {
        const d = node.data as RFNodeData;
        if (d.kind === "page") removePage(node.id);
        else removeNode(d.pageId, node.id);
      }
    },
    [removePage, removeNode],
  );

  const onEdgesDelete = useCallback(
    (deleted: Edge[]) => {
      for (const edge of deleted) removeTransition(edge.id);
    },
    [removeTransition],
  );

  const onConnect = useCallback(
    (conn: Connection) => {
      if (!conn.source || !conn.target) return;
      const store = useCanvasStore.getState();
      const loc = locateNode(store, conn.source);
      if (!loc) return;
      addTransition(
        { pageId: loc.page.id, nodeId: conn.source },
        { pageId: conn.target },
      );
      // 同时把边加入 RF 本地状态以即时显示
      setEdges((eds) =>
        addEdge(
          {
            ...conn,
            type: TRANSITION_EDGE_TYPE,
            markerEnd: "arrowclosed",
          },
          eds,
        ),
      );
    },
    [addTransition, setEdges],
  );

  const onSelectionChange = useCallback(
    ({ nodes: selNodes, edges: selEdges }: { nodes: Node[]; edges: Edge[] }) => {
      if (selEdges.length === 1) {
        select({ type: "transition", id: selEdges[0].id });
      } else if (selNodes.length === 1) {
        const d = selNodes[0].data as RFNodeData;
        if (d.kind === "page") select({ type: "page", id: selNodes[0].id });
        else select({ type: "node", id: selNodes[0].id, pageId: d.pageId });
      } else if (selNodes.length === 0 && selEdges.length === 0) {
        clearSelection();
      }
      // 检测多选 UI 节点（须同页）→ 记录区域供“区域精修”使用
      const uiSel = selNodes
        .map((n) => n.data as RFNodeData)
        .filter((d): d is UINodeData => d.kind === "ui");
      if (uiSel.length >= 2) {
        const firstPage = uiSel[0].pageId;
        if (uiSel.every((d) => d.pageId === firstPage)) {
          setRegionSel({ pageId: firstPage, nodes: uiSel.map((d) => d.node) });
        } else {
          setRegionSel(null);
        }
      } else {
        setRegionSel(null);
      }
    },
    [select, clearSelection],
  );

  /* ---------- 从左侧组件库拖入 + 图片文件拖入 ---------- */
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();

      // 图片文件拖入
      const files = e.dataTransfer.files;
      if (files.length > 0 && files[0].type.startsWith("image/")) {
        const file = files[0];
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
          const store = useCanvasStore.getState();
          const page = store.pages.find((p) => {
            const L = p.layout;
            if (L.collapsed) return false;
            return pos.x >= L.x && pos.x <= L.x + L.width && pos.y >= L.y && pos.y <= L.y + L.height;
          }) ?? store.pages[0];
          if (!page) { toast.warning("请先创建一个页面"); return; }
          addNode(page.id, "Image", {
            position: { x: Math.round(pos.x - page.layout.x - 100), y: Math.round(pos.y - page.layout.y - 75) },
            size: { width: 200, height: 150 },
            props: { imageSrc: dataUrl, text: file.name },
          });
          toast.success(`已导入图片：${file.name}`);
        };
        reader.readAsDataURL(files[0]);
        return;
      }

      const typeId = e.dataTransfer.getData("application/routecanvas-component");
      if (!typeId) return;
      const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const store = useCanvasStore.getState();
      const page = store.pages.find((p) => {
        const L = p.layout;
        const collapsed = L.collapsed ?? false;
        if (collapsed) return false;
        return (
          pos.x >= L.x &&
          pos.x <= L.x + L.width &&
          pos.y >= L.y &&
          pos.y <= L.y + L.height
        );
      });
      if (!page) {
        toast.warning("请将组件拖入某个（展开的）页面画板内");
        return;
      }
      const size = defaultSizeForType(typeId);
      addNode(page.id, typeId, {
        position: {
          x: Math.round(pos.x - page.layout.x - size.width / 2),
          y: Math.round(pos.y - page.layout.y - size.height / 2),
        },
        size,
      });
    },
    [screenToFlowPosition, addNode],
  );

  /* ---------- 画笔模式：鼠标事件 ---------- */
  const onCanvasPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!penActive) return;
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const store = useCanvasStore.getState();
      const page = store.pages.find((p) => {
        const L = p.layout;
        if (L.collapsed) return false;
        return pos.x >= L.x && pos.x <= L.x + L.width && pos.y >= L.y && pos.y <= L.y + L.height;
      });
      if (!page) return;
      drawingRef.current = {
        points: [{ x: pos.x - page.layout.x, y: pos.y - page.layout.y }],
        pageId: page.id,
        startX: page.layout.x,
        startY: page.layout.y,
      };
    },
    [penActive, screenToFlowPosition],
  );

  const onCanvasPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!penActive || !drawingRef.current) return;
      e.stopPropagation();
      const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const d = drawingRef.current;
      const curPt = { x: pos.x - d.startX, y: pos.y - d.startY };

      if (drawMode === "free") {
        d.points.push(curPt);
        const pathStr = d.points
          .map((p, i) => {
            const sp = flowToScreenPosition({ x: p.x + d.startX, y: p.y + d.startY });
            return `${i === 0 ? "M" : "L"}${sp.x.toFixed(1)},${sp.y.toFixed(1)}`;
          })
          .join(" ");
        setDrawPreview(pathStr);
      } else {
        // 形状模式：保存当前点作为终点
        d.points = [d.points[0], curPt];
        const sp0 = flowToScreenPosition({ x: d.points[0].x + d.startX, y: d.points[0].y + d.startY });
        const sp1 = flowToScreenPosition({ x: curPt.x + d.startX, y: curPt.y + d.startY });
        setDrawPreview(buildShapePreview(drawMode, sp0, sp1));
      }
    },
    [penActive, drawMode, screenToFlowPosition, flowToScreenPosition],
  );

  const onCanvasPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!penActive || !drawingRef.current) return;
      e.stopPropagation();
      const d = drawingRef.current;
      drawingRef.current = null;
      setDrawPreview(null);

      // 统一计算 pathData / 位置 / 尺寸
      let pathData: string;
      let pos: { x: number; y: number };
      let size: { width: number; height: number };

      if (drawMode === "free") {
        if (d.points.length < 3) return;
        const xs = d.points.map((p) => p.x);
        const ys = d.points.map((p) => p.y);
        const minX = Math.min(...xs), maxX = Math.max(...xs);
        const minY = Math.min(...ys), maxY = Math.max(...ys);
        const w = Math.max(maxX - minX, 40);
        const h = Math.max(maxY - minY, 30);
        const norm = d.points.map((p) => ({
          x: ((p.x - minX) / w) * 200,
          y: ((p.y - minY) / h) * 150,
        }));
        pathData = norm.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
        pos = { x: Math.round(minX + d.startX), y: Math.round(minY + d.startY) };
        size = { width: Math.round(w), height: Math.round(h) };
      } else {
        if (d.points.length < 2) return;
        const p0 = d.points[0], p1 = d.points[1];
        const minX = Math.min(p0.x, p1.x), maxX = Math.max(p0.x, p1.x);
        const minY = Math.min(p0.y, p1.y), maxY = Math.max(p0.y, p1.y);
        const w = Math.max(maxX - minX, 20);
        const h = Math.max(maxY - minY, 20);
        pathData = buildShapePath(drawMode, p0, p1, w, h, minX, minY);
        pos = { x: Math.round(minX + d.startX), y: Math.round(minY + d.startY) };
        size = { width: Math.round(w), height: Math.round(h) };
      }

      // AI 生成模式：打开标注层，让 AI 识别草图生成真实组件
      if (aiGenerate) {
        useAnnotateStore.getState().open({
          mode: "generate",
          pageId: d.pageId,
          sketchPath: pathData,
          sketchPos: pos,
          sketchSize: size,
        });
        setAiGenerate(false);
        setPenActive(false);
        return;
      }

      addNode(d.pageId, "Freehand", {
        position: pos,
        size,
        props: { custom: { pathData, strokeColor: penColor, strokeWidth: penWidth } },
      });
      toast.success(drawMode === "free" ? "手绘已创建" : "形状已创建");
    },
    [penActive, drawMode, penColor, penWidth, addNode, aiGenerate],
  );

  const onMoveEnd = useCallback(
    (_e: unknown, vp: { x: number; y: number; zoom: number }) => {
      setViewport(vp);
    },
    [setViewport],
  );

  /* ---------- 键盘快捷键：复制/粘贴/导出 ---------- */
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      // Ctrl+S 导出
      if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        const doc = exportDocument(useCanvasStore.getState());
        const blob = new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "routecanvas-export.json";
        a.click();
        URL.revokeObjectURL(url);
        toast.success("已导出 JSON");
        return;
      }

      if (isInput) return;

      // Ctrl+C 复制选中节点
      if (e.key === "c" || e.key === "C") {
        const sel = useCanvasStore.getState().selection;
        if (sel.type === "node" && sel.id) {
          const store = useCanvasStore.getState();
          for (const page of store.pages) {
            const n = page.nodes.find((x) => x.id === sel.id);
            if (n) {
              clipboardRef.current = { type: n.type, props: n.props ?? {}, size: n.size };
              toast.info("已复制组件");
              break;
            }
          }
        }
      }

      // Ctrl+V 粘贴
      if (e.key === "v" || e.key === "V") {
        const clip = clipboardRef.current;
        const sel = useCanvasStore.getState().selection;
        if (clip && sel.type === "page" && sel.id) {
          const pageId = sel.id;
          addNode(pageId, clip.type, {
            position: { x: 60 + Math.random() * 40, y: 60 + Math.random() * 40 },
            size: clip.size,
            props: clip.props,
          });
          toast.success("已粘贴组件");
        } else if (clip && sel.type === "node" && sel.pageId) {
          addNode(sel.pageId, clip.type, {
            position: { x: 60 + Math.random() * 40, y: 60 + Math.random() * 40 },
            size: clip.size,
            props: clip.props,
          });
          toast.success("已粘贴组件");
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [addNode]);

  return (
    <div
      className="w-full h-full relative"
      onDrop={onDrop}
      onDragOver={onDragOver}
      onPointerDown={onCanvasPointerDown}
      onPointerMove={onCanvasPointerMove}
      onPointerUp={onCanvasPointerUp}
      style={penActive ? { cursor: "crosshair" } : undefined}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChangeWrapped}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        onNodesDelete={onNodesDelete}
        onEdgesDelete={onEdgesDelete}
        onConnect={onConnect}
        onSelectionChange={onSelectionChange}
        onMoveEnd={onMoveEnd}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultViewport={viewport}
        proOptions={{ hideAttribution: true }}
        fitView={!pages.length}
        deleteKeyCode={penActive ? null : ["Backspace", "Delete"]}
        multiSelectionKeyCode={["Meta", "Shift"]}
        minZoom={0.2}
        maxZoom={2.5}
        className="bg-gray-50"
        nodesDraggable={!penActive}
        nodesConnectable={!penActive}
        elementsSelectable={!penActive}
        panOnDrag={!penActive}
        zoomOnScroll={!penActive}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#d1d5db" />
        <MiniMap
          pannable
          zoomable
          className="!bg-white"
          nodeColor={(n) =>
            (n.data as RFNodeData)?.kind === "page" ? "#bfdbfe" : "#bbf7d0"
          }
        />
        <Controls />
        <Panel position="bottom-left">
          <span className="text-[10px] text-gray-400 bg-white/70 px-1.5 py-0.5 rounded shadow-sm">
            拖拽框选 · Del 删除 · Ctrl+C/V 复制粘贴 · Ctrl+S 导出 · 滚轮缩放
          </span>
        </Panel>
        {/* 画笔工具栏 */}
        <Panel position="top-center">
          <div className="flex items-center gap-2 bg-white rounded-lg shadow-md border border-gray-200 px-3 py-1.5">
            <button
              onClick={() => setPenActive(!penActive)}
              className={`inline-flex items-center gap-1 text-xs font-medium rounded-md px-2 py-1 transition-colors ${
                penActive ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              title="画笔模式 (激活后在画布上拖拽绘制)"
            >
              <Pen size={13} /> 画笔
            </button>
            <button
              onClick={() => {
                const next = !aiGenerate;
                setAiGenerate(next);
                if (next) setPenActive(true);
              }}
              className={`inline-flex items-center gap-1 text-xs font-medium rounded-md px-2 py-1 transition-colors ${
                aiGenerate ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white" : "bg-gray-100 text-orange-600 hover:bg-orange-50"
              }`}
              title="AI 草图生成：画一个草图，AI 自动生成真实组件"
            >
              <Sparkles size={13} /> AI 生成
            </button>
            {penActive && (
              <>
                <div className="h-4 w-px bg-gray-200" />
                {/* 形状选择 */}
                <div className="flex items-center gap-0.5">
                  {([
                    { mode: "free" as const, icon: <Pen size={12} />, label: "自由" },
                    { mode: "line" as const, icon: <Minus size={12} />, label: "直线" },
                    { mode: "rect" as const, icon: <Square size={12} />, label: "矩形" },
                    { mode: "ellipse" as const, icon: <Circle size={12} />, label: "椭圆" },
                    { mode: "arrow" as const, icon: <MoveUpRight size={12} />, label: "箭头" },
                    { mode: "triangle" as const, icon: <Triangle size={12} />, label: "三角" },
                  ]).map(({ mode, icon, label }) => (
                    <button
                      key={mode}
                      onClick={() => setDrawMode(mode)}
                      className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded ${
                        drawMode === mode ? "bg-blue-100 text-blue-700 font-medium" : "text-gray-500 hover:bg-gray-100"
                      }`}
                      title={label}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  {["#000000", "#ef4444", "#3b82f6", "#22c55e", "#a855f7"].map((c) => (
                    <button
                      key={c}
                      onClick={() => setPenColor(c)}
                      className={`w-4 h-4 rounded-full border-2 transition-transform ${
                        penColor === c ? "border-blue-500 scale-125" : "border-gray-300"
                      }`}
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
                <div className="h-4 w-px bg-gray-200" />
                <div className="flex items-center gap-1">
                  {[{ w: 1, label: "细" }, { w: 2, label: "中" }, { w: 4, label: "粗" }].map(({ w, label }) => (
                    <button
                      key={w}
                      onClick={() => setPenWidth(w)}
                      className={`text-[10px] px-1.5 py-0.5 rounded ${
                        penWidth === w ? "bg-blue-100 text-blue-700 font-medium" : "text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </Panel>
        {/* 多选区域精修按钮 */}
        {regionSel && (
          <Panel position="bottom-center">
            <button
              onClick={() => {
                useAnnotateStore.getState().open({
                  mode: "edit",
                  pageId: regionSel.pageId,
                  nodes: regionSel.nodes,
                });
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg hover:scale-105 transition-transform"
              title="对框选的多个组件进行 AI 区域精修"
            >
              <Sparkles size={14} /> AI 区域精修（{regionSel.nodes.length} 个组件）
            </button>
          </Panel>
        )}
      </ReactFlow>
      {/* 画笔绘制预览覆盖层 */}
      {penActive && drawPreview && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-50">
          <path
            d={drawPreview}
            fill="none"
            stroke={penColor}
            strokeWidth={penWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}
    </div>
  );
}

export default function ReactFlowCanvas() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  );
}
