"use client";
import * as React from "react";
import {
  BoxSelect,
  Check,
  FileText,
  GripHorizontal,
  MessageSquarePlus,
  Monitor,
  PanelRightClose,
  Plus,
  Smartphone,
  Sparkles,
  Tablet,
  Trash2,
  X,
  ZoomIn,
  ZoomOut,
  AlignLeft,
  AlignCenterHorizontal,
  AlignRight,
  ArrowUpToLine,
  AlignCenterVertical,
  ArrowDownToLine,
  Layers,
  RefreshCw,
  HelpCircle,
  Send,
} from "lucide-react";
import { renderComponent } from "@/components/renderer";
import { findComponentDef } from "@/components/registry";
import { defaultSizeForType } from "@/canvas/rfAdapter";
import { useCanvasStore } from "@/store/canvasStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { resolveNodeFrame, resolvePageFrames, type ResolvedFrame } from "./frame";
import { useProposalStore } from "@/data/chatOps";
import { dispatchCommentToAi } from "@/lib/events";
import { FOCUS_ACTIVE_PAGE_EVENT } from "@/lib/events";
import { toast } from "@/lib/toast";
import type { BreakpointKey, CanvasComment, Page } from "@/types/schema";

const PAGE_GAP = 160;
const VIEW_PADDING = 72;
const SNAP_DIST = 5; // 对齐吸附阈值（画布世界坐标 px）
const GRID = 8; // 网格吸附基数

const breakpointMeta: Array<{ id: BreakpointKey; label: string; icon: React.ElementType }> = [
  { id: "desktop", label: "Desktop", icon: Monitor },
  { id: "tablet", label: "Tablet", icon: Tablet },
  { id: "mobile", label: "Mobile", icon: Smartphone },
];

type HandleDir = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";
const HANDLES: Array<{ dir: HandleDir; cursor: string }> = [
  { dir: "nw", cursor: "nwse-resize" },
  { dir: "n", cursor: "ns-resize" },
  { dir: "ne", cursor: "nesw-resize" },
  { dir: "e", cursor: "ew-resize" },
  { dir: "se", cursor: "nwse-resize" },
  { dir: "s", cursor: "ns-resize" },
  { dir: "sw", cursor: "nesw-resize" },
  { dir: "w", cursor: "ew-resize" },
];

interface PanDrag {
  clientX: number;
  clientY: number;
  x: number;
  y: number;
}

interface NodeDrag {
  pageId: string;
  nodeId: string;
  startX: number;
  startY: number;
  frameX: number;
  frameY: number;
  width: number;
  height: number;
}

interface PageDrag {
  pageId: string;
  startX: number;
  clientY: number;
  x: number;
  y: number;
}

interface ResizeDrag {
  pageId: string;
  nodeId: string;
  dir: HandleDir;
  startX: number;
  startY: number;
  frame: ResolvedFrame;
}

interface MultiResizeDrag {
  pageId: string;
  dir: HandleDir;
  startX: number;
  startY: number;
  bounds: ResolvedFrame;
  frames: Record<string, ResolvedFrame>;
}

interface ActiveGuides {
  pageId: string;
  xs: number[];
  ys: number[];
}

/* ---------- 对齐吸附计算 ---------- */
function computeSnap(
  moving: { x: number; y: number; w: number; h: number },
  targetXs: number[],
  targetYs: number[],
): { dx: number; dy: number; gx: number[]; gy: number[] } {
  const candX = [moving.x, moving.x + moving.w / 2, moving.x + moving.w];
  const candY = [moving.y, moving.y + moving.h / 2, moving.y + moving.h];
  let bestX: { delta: number; target: number } | null = null;
  let bestY: { delta: number; target: number } | null = null;
  for (const cand of candX) {
    for (const target of targetXs) {
      const delta = target - cand;
      if (Math.abs(delta) <= SNAP_DIST && (!bestX || Math.abs(delta) < Math.abs(bestX.delta))) {
        bestX = { delta, target };
      }
    }
  }
  for (const cand of candY) {
    for (const target of targetYs) {
      const delta = target - cand;
      if (Math.abs(delta) <= SNAP_DIST && (!bestY || Math.abs(delta) < Math.abs(bestY.delta))) {
        bestY = { delta, target };
      }
    }
  }
  return {
    dx: bestX?.delta ?? 0,
    dy: bestY?.delta ?? 0,
    gx: bestX ? [bestX.target] : [],
    gy: bestY ? [bestY.target] : [],
  };
}

function snapToGrid(value: number): number {
  return Math.round(value / GRID) * GRID;
}

export function DesignCanvas() {
  const pages = useCanvasStore((s) => s.pages);
  const registry = useCanvasStore((s) => s.componentRegistry);
  const designSystem = useCanvasStore((s) => s.designSystem);
  const selection = useCanvasStore((s) => s.selection);
  const comments = useCanvasStore((s) => s.comments ?? []);
  const addPage = useCanvasStore((s) => s.addPage);
  const addNode = useCanvasStore((s) => s.addNode);
  const updatePage = useCanvasStore((s) => s.updatePage);
  const updateNode = useCanvasStore((s) => s.updateNode);
  const updateNodeProps = useCanvasStore((s) => s.updateNodeProps);
  const updateNodeResponsive = useCanvasStore((s) => s.updateNodeResponsive);
  const removeNode = useCanvasStore((s) => s.removeNode);
  const addComment = useCanvasStore((s) => s.addComment);
  const updateComment = useCanvasStore((s) => s.updateComment);
  const removeComment = useCanvasStore((s) => s.removeComment);
  const select = useCanvasStore((s) => s.select);
  const clearSelection = useCanvasStore((s) => s.clearSelection);
  const activePageId = useWorkspaceStore((s) => s.activePageId);
  const setActivePageId = useWorkspaceStore((s) => s.setActivePageId);
  const breakpoint = useWorkspaceStore((s) => s.breakpoint);
  const setBreakpoint = useWorkspaceStore((s) => s.setBreakpoint);
  const closeStudio = useWorkspaceStore((s) => s.closeStudio);
  const proposalNodeIds = useProposalStore((s) => s.nodeIds);

  const viewportRef = React.useRef<HTMLDivElement>(null);
  const fittedKeyRef = React.useRef("");
  const spacePressedRef = React.useRef(false);
  const [viewportSize, setViewportSize] = React.useState({ width: 0, height: 0 });
  const [zoom, setZoom] = React.useState(0.6);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const panRef = React.useRef(pan);
  const zoomRef = React.useRef(zoom);
  const [panDrag, setPanDrag] = React.useState<PanDrag | null>(null);
  const [nodeDrag, setNodeDrag] = React.useState<NodeDrag | null>(null);
  const [nodePreview, setNodePreview] = React.useState<{ pageId: string; nodeId: string; frame: ResolvedFrame } | null>(null);
  const nodePreviewRef = React.useRef<typeof nodePreview>(null);
  const [pageDrag, setPageDrag] = React.useState<PageDrag | null>(null);
  const [resizeDrag, setResizeDrag] = React.useState<ResizeDrag | null>(null);
  const [spacePressed, setSpacePressed] = React.useState(false);
  const [guides, setGuides] = React.useState<ActiveGuides | null>(null);
  const [editing, setEditing] = React.useState<{ pageId: string; nodeId: string; text: string } | null>(null);
  const [commentMode, setCommentMode] = React.useState(false);
  const [commentDraft, setCommentDraft] = React.useState<{ pageId: string; x: number; y: number; text: string } | null>(null);
  const [openCommentId, setOpenCommentId] = React.useState<string | null>(null);
  /** 区域标注模式：在画板上拖出一个框，圈住的元素交给 AI 涂画精修 */
  const [annotateMode, setAnnotateMode] = React.useState(false);
  const [regionDraft, setRegionDraft] = React.useState<{ pageId: string; x0: number; y0: number; x1: number; y1: number } | null>(null);
  const [regionPrompt, setRegionPrompt] = React.useState<{
    pageId: string;
    x: number;
    y: number;
    width: number;
    height: number;
    nodeIds: string[];
    text: string;
  } | null>(null);
  /** 多选：Shift+空白拖框选；支持批量移动/删除/对齐/分布/主组件同步 */
  const [multiSel, setMultiSel] = React.useState<string[]>([]);
  const [marquee, setMarquee] = React.useState<{ pageId: string; x0: number; y0: number; x1: number; y1: number } | null>(null);
  const [multiDrag, setMultiDrag] = React.useState<{ pageId: string; startX: number; startY: number; frames: Record<string, { x: number; y: number }> } | null>(null);
  const [multiResizeDrag, setMultiResizeDrag] = React.useState<MultiResizeDrag | null>(null);
  const [showHelp, setShowHelp] = React.useState(false);
  const [pendingMasterSync, setPendingMasterSync] = React.useState<{ masterId: string; count: number } | null>(null);
  const masterFingerprintsRef = React.useRef(new Map<string, string>());

  const activePage = pages.find((item) => item.id === activePageId) ?? pages[0];
  React.useEffect(() => {
    panRef.current = pan;
  }, [pan]);
  React.useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);
  // 切换页面时清除评论弹层/草稿/多选残留
  React.useEffect(() => {
    setOpenCommentId(null);
    setCommentDraft(null);
    setMultiSel([]);
    setRegionPrompt(null);
  }, [activePageId]);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = new Map<string, string>();
      let changedMaster: { masterId: string; count: number } | null = null;
      pages.forEach((page) => page.nodes.forEach((node) => {
        if (node.componentId !== `master-${node.id}`) return;
        const fingerprint = JSON.stringify({ props: node.props ?? {}, size: node.size, responsive: node.responsive ?? {} });
        next.set(node.id, fingerprint);
        const previous = masterFingerprintsRef.current.get(node.id);
        if (!previous || previous === fingerprint) return;
        const count = pages.reduce(
          (total, candidatePage) => total + candidatePage.nodes.filter((candidate) => candidate.id !== node.id && candidate.componentId === node.componentId).length,
          0,
        );
        if (count > 0) changedMaster = { masterId: node.id, count };
      }));
      masterFingerprintsRef.current = next;
      if (changedMaster) setPendingMasterSync(changedMaster);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [pages]);
  const pageIndex = activePage ? pages.findIndex((item) => item.id === activePage.id) : -1;
  const pageFrames = React.useMemo(
    () => new Map(pages.map((page) => [page.id, resolvePageFrames(page, breakpoint)])),
    [breakpoint, pages],
  );

  const getArtboardSize = React.useCallback((page: Page) => {
    const breakpointWidth = designSystem?.breakpoints[breakpoint]?.width ?? page.layout.width;
    return {
      width: breakpoint === "desktop" ? page.layout.width : breakpointWidth,
      height: page.layout.height,
    };
  }, [breakpoint, designSystem?.breakpoints]);

  const focusPage = React.useCallback((page: Page) => {
    if (!viewportSize.width || !viewportSize.height) return;
    const size = getArtboardSize(page);
    const nextZoom = Math.min(1, Math.max(0.12,
      Math.min((viewportSize.width - VIEW_PADDING * 2) / size.width, (viewportSize.height - VIEW_PADDING * 2) / size.height),
    ));
    setZoom(nextZoom);
    setPan({
      x: viewportSize.width / 2 - (page.layout.x + size.width / 2) * nextZoom,
      y: viewportSize.height / 2 - (page.layout.y + size.height / 2) * nextZoom,
    });
  }, [getArtboardSize, viewportSize]);

  const fitPages = React.useCallback((items: Page[]) => {
    if (!items.length || !viewportSize.width || !viewportSize.height) return;
    const minX = Math.min(...items.map((page) => page.layout.x));
    const minY = Math.min(...items.map((page) => page.layout.y - 30));
    const maxX = Math.max(...items.map((page) => page.layout.x + getArtboardSize(page).width));
    const maxY = Math.max(...items.map((page) => page.layout.y + getArtboardSize(page).height));
    const width = Math.max(1, maxX - minX);
    const height = Math.max(1, maxY - minY);
    const nextZoom = Math.min(1, Math.max(0.1,
      Math.min((viewportSize.width - VIEW_PADDING * 2) / width, (viewportSize.height - VIEW_PADDING * 2) / height),
    ));
    setZoom(nextZoom);
    setPan({
      x: (viewportSize.width - width * nextZoom) / 2 - minX * nextZoom,
      y: (viewportSize.height - height * nextZoom) / 2 - minY * nextZoom,
    });
  }, [getArtboardSize, viewportSize]);

  const fitAll = React.useCallback(() => fitPages(pages), [fitPages, pages]);

  /* 生成完成后聚焦活动页面：避免新建页面"看不到/以为堆叠" */
  React.useEffect(() => {
    const onFocus = () => {
      const activeId = useWorkspaceStore.getState().activePageId;
      const target = useCanvasStore.getState().pages.find((page) => page.id === activeId);
      if (target) fitPages([target]);
    };
    window.addEventListener(FOCUS_ACTIVE_PAGE_EVENT, onFocus);
    return () => window.removeEventListener(FOCUS_ACTIVE_PAGE_EVENT, onFocus);
  }, [fitPages]);

  React.useEffect(() => {
    if (activePage && activePage.id !== activePageId) setActivePageId(activePage.id);
  }, [activePage, activePageId, setActivePageId]);

  React.useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setViewportSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const projectViewKey = `${pages[0]?.id ?? "empty"}:${breakpoint}`;
  React.useEffect(() => {
    if (!viewportSize.width || fittedKeyRef.current === projectViewKey) return;
    fittedKeyRef.current = projectViewKey;
    fitAll();
  }, [fitAll, projectViewKey, viewportSize.width]);

  /* ---------- 空格平移 ---------- */
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (event.code !== "Space" || target?.matches("input, textarea, select, [contenteditable='true']")) return;
      event.preventDefault();
      spacePressedRef.current = true;
      setSpacePressed(true);
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code !== "Space") return;
      spacePressedRef.current = false;
      setSpacePressed(false);
      setPanDrag(null);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  /* ---------- 键盘快捷键：微移 / 复制 / 删除 ---------- */
  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select, [contenteditable='true']")) return;
      if (event.key === "Escape") {
        setCommentMode(false);
        setCommentDraft(null);
        setOpenCommentId(null);
        setAnnotateMode(false);
        setRegionDraft(null);
        setRegionPrompt(null);
        setMultiSel([]);
        return;
      }
      /* 多选态：批量删除/微移 */
      if (multiSel.length > 0 && activePage) {
        const multiPageId = activePage.id;
        if (event.key === "Delete" || event.key === "Backspace") {
          event.preventDefault();
          multiSel.forEach((id) => removeNode(multiPageId, id));
          setMultiSel([]);
          return;
        }
        if (event.key.startsWith("Arrow")) {
          event.preventDefault();
          const step = event.shiftKey ? GRID : 1;
          const dx = event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0;
          const dy = event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0;
          const state = useCanvasStore.getState();
          const page = state.pages.find((p) => p.id === multiPageId);
          page?.nodes.filter((n) => multiSel.includes(n.id)).forEach((n) => {
            if (breakpoint === "desktop") updateNode(multiPageId, n.id, { position: { x: n.position.x + dx, y: n.position.y + dy } });
            else updateNodeResponsive(multiPageId, n.id, breakpoint, { x: n.position.x + dx, y: n.position.y + dy });
          });
        }
        return;
      }
      if (selection.type !== "node" || !selection.id || !selection.pageId) return;
      const pageId = selection.pageId;
      const nodeId = selection.id;
      const state = useCanvasStore.getState();
      const node = state.pages.find((p) => p.id === pageId)?.nodes.find((n) => n.id === nodeId);
      if (!node) return;

      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        removeNode(pageId, nodeId);
        return;
      }
      if ((event.ctrlKey || event.metaKey) && (event.key === "d" || event.key === "D")) {
        event.preventDefault();
        duplicateNode(pageId, nodeId, 16, 16);
        return;
      }
      if (event.key.startsWith("Arrow")) {
        event.preventDefault();
        const step = event.shiftKey ? GRID : 1;
        const dx = event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0;
        const dy = event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0;
        const frame = resolveNodeFrame(node, breakpoint);
        if (breakpoint === "desktop") {
          updateNode(pageId, nodeId, { position: { x: frame.x + dx, y: frame.y + dy } });
        } else {
          updateNodeResponsive(pageId, nodeId, breakpoint, { x: frame.x + dx, y: frame.y + dy });
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection, breakpoint, removeNode, updateNode, updateNodeResponsive, multiSel, activePage]);

  if (!activePage) {
    return <div className="grid h-full place-items-center bg-slate-50 text-sm text-gray-400">新建页面后即可开始设计</div>;
  }

  /* ---------- 复制节点 ---------- */
  function duplicateNode(pageId: string, nodeId: string, dx = 16, dy = 16): string | null {
    const state = useCanvasStore.getState();
    const node = state.pages.find((p) => p.id === pageId)?.nodes.find((n) => n.id === nodeId);
    if (!node) return null;
    const id = addNode(pageId, node.type, {
      position: { x: node.position.x + dx, y: node.position.y + dy },
      size: { ...node.size },
      props: { ...node.props, custom: { ...node.props?.custom } },
    });
    if (id && node.responsive) {
      (Object.keys(node.responsive) as BreakpointKey[]).forEach((bp) => {
        const frame = node.responsive?.[bp];
        if (frame) updateNodeResponsive(pageId, id, bp, { ...frame, x: (frame.x ?? 0) + dx, y: (frame.y ?? 0) + dy });
      });
    }
    return id;
  }

  /* ---------- 吸附目标：同页其它节点 + 画板边界/中线 ---------- */
  function snapTargets(page: Page, excludeNodeId?: string) {
    const frames = pageFrames.get(page.id) ?? new Map<string, ResolvedFrame>();
    const xs: number[] = [];
    const ys: number[] = [];
    for (const node of page.nodes) {
      if (node.id === excludeNodeId || node.hidden) continue;
      const frame = frames.get(node.id) ?? resolveNodeFrame(node, breakpoint);
      xs.push(frame.x, frame.x + frame.width / 2, frame.x + frame.width);
      ys.push(frame.y, frame.y + frame.height / 2, frame.y + frame.height);
    }
    const size = getArtboardSize(page);
    xs.push(0, size.width / 2, size.width);
    ys.push(0, size.height / 2, size.height);
    return { xs, ys };
  }

  /* ---------- 提交节点 frame（按断点写入） ---------- */
  function commitFrame(pageId: string, nodeId: string, frame: ResolvedFrame) {
    if (breakpoint === "desktop") {
      updateNode(pageId, nodeId, { position: { x: frame.x, y: frame.y }, size: { width: frame.width, height: frame.height } });
    } else {
      updateNodeResponsive(pageId, nodeId, breakpoint, { x: frame.x, y: frame.y, width: frame.width, height: frame.height });
    }
  }

  const beginPan = (event: React.PointerEvent<HTMLElement>) => {
    setMultiSel([]);
    setPanDrag({ clientX: event.clientX, clientY: event.clientY, x: panRef.current.x, y: panRef.current.y });
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (panDrag) {
      const nextPan = { x: panDrag.x + event.clientX - panDrag.clientX, y: panDrag.y + event.clientY - panDrag.clientY };
      panRef.current = nextPan;
      setPan(nextPan);
      return;
    }
    if (pageDrag) {
      const page = pages.find((item) => item.id === pageDrag.pageId);
      if (!page) return;
      updatePage(page.id, {
        layout: {
          ...page.layout,
          x: Math.round(pageDrag.x + (event.clientX - pageDrag.startX) / zoom),
          y: Math.round(pageDrag.y + (event.clientY - pageDrag.clientY) / zoom),
        },
      });
      return;
    }
    if (resizeDrag) {
      const page = pages.find((item) => item.id === resizeDrag.pageId);
      if (!page) return;
      const dx = (event.clientX - resizeDrag.startX) / zoom;
      const dy = (event.clientY - resizeDrag.startY) / zoom;
      const start = resizeDrag.frame;
      let x = start.x;
      let y = start.y;
      let w = start.width;
      let h = start.height;
      if (resizeDrag.dir.includes("e")) w = start.width + dx;
      if (resizeDrag.dir.includes("w")) { x = start.x + dx; w = start.width - dx; }
      if (resizeDrag.dir.includes("s")) h = start.height + dy;
      if (resizeDrag.dir.includes("n")) { y = start.y + dy; h = start.height - dy; }
      // Shift 等比（仅角点）
      if (event.shiftKey && resizeDrag.dir.length === 2) {
        const scale = Math.max(w / start.width, h / start.height);
        w = start.width * scale;
        h = start.height * scale;
        if (resizeDrag.dir.includes("w")) x = start.x + start.width - w;
        if (resizeDrag.dir.includes("n")) y = start.y + start.height - h;
      }
      w = Math.max(8, w);
      h = Math.max(8, h);
      // 边缘吸附
      const targets = snapTargets(page, resizeDrag.nodeId);
      const snap = computeSnap({ x, y, w, h }, targets.xs, targets.ys);
      let nx = x + snap.dx;
      let ny = y + snap.dy;
      if (!snap.dx && !snap.dy) {
        nx = snapToGrid(x);
        ny = snapToGrid(y);
      }
      setGuides(snap.gx.length || snap.gy.length ? { pageId: page.id, xs: snap.gx, ys: snap.gy } : null);
      commitFrame(page.id, resizeDrag.nodeId, { x: Math.round(nx), y: Math.round(ny), width: Math.round(w), height: Math.round(h) });
      return;
    }
    if (multiResizeDrag) {
      const dx = (event.clientX - multiResizeDrag.startX) / zoom;
      const dy = (event.clientY - multiResizeDrag.startY) / zoom;
      const start = multiResizeDrag.bounds;
      let x = start.x;
      let y = start.y;
      let width = start.width;
      let height = start.height;
      if (multiResizeDrag.dir.includes("e")) width = Math.max(32, start.width + dx);
      if (multiResizeDrag.dir.includes("w")) { width = Math.max(32, start.width - dx); x = start.x + start.width - width; }
      if (multiResizeDrag.dir.includes("s")) height = Math.max(32, start.height + dy);
      if (multiResizeDrag.dir.includes("n")) { height = Math.max(32, start.height - dy); y = start.y + start.height - height; }
      const scaleX = width / Math.max(1, start.width);
      const scaleY = height / Math.max(1, start.height);
      Object.entries(multiResizeDrag.frames).forEach(([id, frame]) => {
        commitFrame(multiResizeDrag.pageId, id, {
          x: Math.round(x + (frame.x - start.x) * scaleX),
          y: Math.round(y + (frame.y - start.y) * scaleY),
          width: Math.max(8, Math.round(frame.width * scaleX)),
          height: Math.max(8, Math.round(frame.height * scaleY)),
        });
      });
      return;
    }
    if (multiDrag) {
      const dx = (event.clientX - multiDrag.startX) / zoom;
      const dy = (event.clientY - multiDrag.startY) / zoom;
      Object.entries(multiDrag.frames).forEach(([id, frame]) => {
        const nx = Math.round(frame.x + dx);
        const ny = Math.round(frame.y + dy);
        if (breakpoint === "desktop") updateNode(multiDrag.pageId, id, { position: { x: nx, y: ny } });
        else updateNodeResponsive(multiDrag.pageId, id, breakpoint, { x: nx, y: ny });
      });
      return;
    }
    if (!nodeDrag) return;
    const page = pages.find((item) => item.id === nodeDrag.pageId);
    if (!page) return;
    let x = nodeDrag.frameX + (event.clientX - nodeDrag.startX) / zoom;
    let y = nodeDrag.frameY + (event.clientY - nodeDrag.startY) / zoom;
    const targets = snapTargets(page, nodeDrag.nodeId);
    const snap = computeSnap({ x, y, w: nodeDrag.width, h: nodeDrag.height }, targets.xs, targets.ys);
    if (snap.dx || snap.dy) {
      x += snap.dx;
      y += snap.dy;
    }
    setGuides(snap.gx.length || snap.gy.length ? { pageId: page.id, xs: snap.gx, ys: snap.gy } : null);
    const preview = { pageId: page.id, nodeId: nodeDrag.nodeId, frame: { x, y, width: nodeDrag.width, height: nodeDrag.height } };
    nodePreviewRef.current = preview;
    setNodePreview(preview);
  };

  const stopDragging = () => {
    const preview = nodePreviewRef.current;
    if (preview) {
      commitFrame(preview.pageId, preview.nodeId, {
        ...preview.frame,
        x: Math.round(preview.frame.x),
        y: Math.round(preview.frame.y),
      });
    }
    setPanDrag(null);
    setNodeDrag(null);
    nodePreviewRef.current = null;
    setNodePreview(null);
    setPageDrag(null);
    setResizeDrag(null);
    setMultiDrag(null);
    setMultiResizeDrag(null);
    setMarquee(null);
    setGuides(null);
  };

  const selectAndFocusPage = (page: Page) => {
    setActivePageId(page.id);
    select({ type: "page", id: page.id });
    focusPage(page);
  };

  const createPage = () => {
    const rightEdge = Math.max(...pages.map((page) => page.layout.x + page.layout.width));
    const id = addPage({
      x: rightEdge + PAGE_GAP,
      y: activePage.layout.y,
      width: activePage.layout.width,
      height: activePage.layout.height,
    });
    const created = useCanvasStore.getState().pages.find((page) => page.id === id);
    if (!created) return;
    setActivePageId(id);
    select({ type: "page", id });
    fitPages(useCanvasStore.getState().pages);
  };

  const setZoomAtCenter = (nextZoom: number) => {
    const bounded = Math.min(2, Math.max(0.1, nextZoom));
    const centerX = viewportSize.width / 2;
    const centerY = viewportSize.height / 2;
    const currentPan = panRef.current;
    const currentZoom = zoomRef.current;
    const worldX = (centerX - currentPan.x) / currentZoom;
    const worldY = (centerY - currentPan.y) / currentZoom;
    const nextPan = { x: centerX - worldX * bounded, y: centerY - worldY * bounded };
    zoomRef.current = bounded;
    panRef.current = nextPan;
    setZoom(bounded);
    setPan(nextPan);
  };

  const dropComponent = (event: React.DragEvent<HTMLDivElement>, page: Page) => {
    event.preventDefault();
    event.stopPropagation();
    const type = event.dataTransfer.getData("application/routecanvas-component");
    if (!type) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const size = defaultSizeForType(type);
    const position = {
      x: Math.max(0, Math.round((event.clientX - rect.left) / zoom - size.width / 2)),
      y: Math.max(0, Math.round((event.clientY - rect.top) / zoom - size.height / 2)),
    };
    const id = addNode(page.id, type, { position, size });
    setActivePageId(page.id);
    if (id && breakpoint !== "desktop") updateNodeResponsive(page.id, id, breakpoint, { ...position, width: size.width, height: size.height });
  };

  const handleArtboardPointerDown = (event: React.PointerEvent<HTMLDivElement>, page: Page) => {
    if (event.button !== 0) return;
    if (annotateMode) {
      // 区域标注：从任意位置（含节点上方）开始拖框
      const rect = event.currentTarget.getBoundingClientRect();
      const x = (event.clientX - rect.left) / zoom;
      const y = (event.clientY - rect.top) / zoom;
      setActivePageId(page.id);
      setRegionPrompt(null);
      setRegionDraft({ pageId: page.id, x0: x, y0: y, x1: x, y1: y });
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }
    if (commentMode) {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = Math.round((event.clientX - rect.left) / zoom);
      const y = Math.round((event.clientY - rect.top) / zoom);
      setOpenCommentId(null);
      setCommentDraft({ pageId: page.id, x, y, text: "" });
      setActivePageId(page.id);
      return;
    }
    if (event.shiftKey && event.target === event.currentTarget) {
      // Shift+空白拖框 = 多选
      const rect = event.currentTarget.getBoundingClientRect();
      const x = (event.clientX - rect.left) / zoom;
      const y = (event.clientY - rect.top) / zoom;
      setActivePageId(page.id);
      setMarquee({ pageId: page.id, x0: x, y0: y, x1: x, y1: y });
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }
    if (event.target !== event.currentTarget) return;
    setActivePageId(page.id);
    select({ type: "page", id: page.id });
    if (spacePressedRef.current) {
      beginPan(event);
    } else {
      setPageDrag({ pageId: page.id, startX: event.clientX, clientY: event.clientY, x: page.layout.x, y: page.layout.y });
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  };

  /** 区域标注收尾：保留选区，并在右下角就地输入修改要求。 */
  const finalizeRegion = () => {
    if (!regionDraft) return;
    const { pageId, x0, y0, x1, y1 } = regionDraft;
    setRegionDraft(null);
    setAnnotateMode(false);
    const rx = Math.min(x0, x1);
    const ry = Math.min(y0, y1);
    const rw = Math.abs(x1 - x0);
    const rh = Math.abs(y1 - y0);
    if (rw < 12 || rh < 12) return; // 忽略误点
    const page = pages.find((p) => p.id === pageId);
    if (!page) return;
    const hit = page.nodes.filter((node) => {
      if (node.hidden) return false;
      const f = resolveNodeFrame(node, breakpoint);
      return f.x < rx + rw && f.x + f.width > rx && f.y < ry + rh && f.y + f.height > ry;
    });
    setRegionPrompt({
      pageId,
      x: Math.round(rx),
      y: Math.round(ry),
      width: Math.round(rw),
      height: Math.round(rh),
      nodeIds: hit.map((node) => node.id),
      text: "",
    });
  };

  const submitRegionPrompt = () => {
    if (!regionPrompt?.text.trim()) return;
    const page = pages.find((item) => item.id === regionPrompt.pageId);
    const scope = regionPrompt.nodeIds.length
      ? `选区内 ${regionPrompt.nodeIds.length} 个组件（${regionPrompt.nodeIds.join("、")}）`
      : `空白区域 x=${regionPrompt.x}, y=${regionPrompt.y}, width=${regionPrompt.width}, height=${regionPrompt.height}`;
    dispatchCommentToAi(`请修改页面「${page?.name ?? regionPrompt.pageId}」的${scope}。用户要求：${regionPrompt.text.trim()}。先给出可审核的变更清单，确认后再应用。`);
    setRegionPrompt(null);
    toast.success("区域修改要求已发送到 AI 设计会话");
  };

  /** 多选框选收尾：收集框内相交节点 */
  const finalizeMarquee = () => {
    if (!marquee) return;
    const { pageId, x0, y0, x1, y1 } = marquee;
    setMarquee(null);
    const rx = Math.min(x0, x1);
    const ry = Math.min(y0, y1);
    const rw = Math.abs(x1 - x0);
    const rh = Math.abs(y1 - y0);
    if (rw < 8 || rh < 8) {
      setMultiSel([]);
      return;
    }
    const page = pages.find((p) => p.id === pageId);
    if (!page) return;
    const framesMap = pageFrames.get(pageId) ?? new Map<string, ResolvedFrame>();
    const hit = page.nodes
      .filter((n) => {
        if (n.hidden) return false;
        const f = framesMap.get(n.id) ?? resolveNodeFrame(n, breakpoint);
        return f.x < rx + rw && f.x + f.width > rx && f.y < ry + rh && f.y + f.height > ry;
      })
      .map((n) => n.id);
    setMultiSel(hit);
    if (hit.length) clearSelection();
  };

  /* ---------- 多选对齐/分布 ---------- */
  const multiFrames = (): Array<{ id: string; f: ResolvedFrame }> => {
    if (!activePage || multiSel.length < 2) return [];
    const framesMap = pageFrames.get(activePage.id) ?? new Map<string, ResolvedFrame>();
    const items: Array<{ id: string; f: ResolvedFrame }> = [];
    multiSel.forEach((id) => {
      const node = activePage.nodes.find((n) => n.id === id);
      if (node) items.push({ id, f: framesMap.get(id) ?? resolveNodeFrame(node, breakpoint) });
    });
    return items;
  };

  const getMultiBounds = (pageId: string): { bounds: ResolvedFrame; frames: Record<string, ResolvedFrame> } | null => {
    if (!activePage || activePage.id !== pageId) return null;
    const items = multiFrames();
    if (items.length < 2) return null;
    const frames = Object.fromEntries(items.map((item) => [item.id, item.f]));
    const x = Math.min(...items.map((item) => item.f.x));
    const y = Math.min(...items.map((item) => item.f.y));
    const right = Math.max(...items.map((item) => item.f.x + item.f.width));
    const bottom = Math.max(...items.map((item) => item.f.y + item.f.height));
    return { bounds: { x, y, width: right - x, height: bottom - y }, frames };
  };

  const alignMulti = (kind: "left" | "cx" | "right" | "top" | "cy" | "bottom") => {
    if (!activePage) return;
    const items = multiFrames();
    if (items.length < 2) return;
    const minX = Math.min(...items.map((i) => i.f.x));
    const maxEdgeX = Math.max(...items.map((i) => i.f.x + i.f.width));
    const minY = Math.min(...items.map((i) => i.f.y));
    const maxEdgeY = Math.max(...items.map((i) => i.f.y + i.f.height));
    const centerX = (minX + maxEdgeX) / 2;
    const centerY = (minY + maxEdgeY) / 2;
    items.forEach(({ id, f }) => {
      let nx = f.x;
      let ny = f.y;
      if (kind === "left") nx = minX;
      if (kind === "cx") nx = centerX - f.width / 2;
      if (kind === "right") nx = maxEdgeX - f.width;
      if (kind === "top") ny = minY;
      if (kind === "cy") ny = centerY - f.height / 2;
      if (kind === "bottom") ny = maxEdgeY - f.height;
      commitFrame(activePage.id, id, { ...f, x: Math.round(nx), y: Math.round(ny) });
    });
  };

  const distributeMulti = (axis: "h" | "v") => {
    if (!activePage) return;
    const items = multiFrames();
    if (items.length < 3) {
      toast.warning("分布需要至少选中 3 个元素");
      return;
    }
    const sorted = axis === "h" ? [...items].sort((a, b) => a.f.x - b.f.x) : [...items].sort((a, b) => a.f.y - b.f.y);
    const centers = sorted.map((i) => (axis === "h" ? i.f.x + i.f.width / 2 : i.f.y + i.f.height / 2));
    const step = (centers[centers.length - 1] - centers[0]) / (sorted.length - 1);
    sorted.forEach((item, idx) => {
      if (axis === "h") commitFrame(activePage.id, item.id, { ...item.f, x: Math.round(centers[0] + step * idx - item.f.width / 2) });
      else commitFrame(activePage.id, item.id, { ...item.f, y: Math.round(centers[0] + step * idx - item.f.height / 2) });
    });
  };

  /* ---------- 主组件 / 实例同步 ---------- */
  const applyMasterSync = (masterId: string, showToast = true): number => {
    const state = useCanvasStore.getState();
    const master = state.pages.flatMap((page) => page.nodes).find((node) => node.id === masterId && node.componentId === `master-${masterId}`);
    if (!master) return 0;
    let count = 0;
    state.pages.forEach((page) => page.nodes.forEach((node) => {
      if (node.id === masterId || node.componentId !== master.componentId) return;
      updateNodeProps(page.id, node.id, JSON.parse(JSON.stringify(master.props ?? {})));
      updateNode(page.id, node.id, {
        size: { ...master.size },
        responsive: JSON.parse(JSON.stringify(master.responsive ?? {})),
      });
      count += 1;
    }));
    if (showToast) {
      if (count) toast.success(`已同步 ${count} 个实例`);
      else toast.warning("未找到该主组件的实例：先多选「主+实例」建立关联");
    }
    return count;
  };

  const makeMasterAndInstances = () => {
    if (!activePage || multiSel.length < 2) return;
    const [masterId, ...instanceIds] = multiSel;
    const master = activePage.nodes.find((n) => n.id === masterId);
    if (!master) return;
    updateNode(activePage.id, masterId, { componentId: `master-${masterId}` });
    instanceIds.forEach((id) => {
      updateNode(activePage.id, id, { componentId: `master-${masterId}` });
      updateNodeProps(activePage.id, id, JSON.parse(JSON.stringify(master.props ?? {})));
      updateNode(activePage.id, id, { size: { ...master.size } });
    });
    toast.success(`已将第一个元素设为主组件，${instanceIds.length} 个元素成为实例并同步样式`);
  };

  const syncInstances = () => {
    if (selection.type !== "node" || !selection.pageId || !selection.id) return;
    const state = useCanvasStore.getState();
    const page = state.pages.find((p) => p.id === selection.pageId);
    const node = page?.nodes.find((n) => n.id === selection.id);
    if (!node) return;
    const masterId = node.componentId?.startsWith("master-") ? node.componentId.slice(7) : node.id;
    applyMasterSync(masterId);
  };

  const submitCommentDraft = () => {
    if (!commentDraft) return;
    if (!commentDraft.text.trim()) {
      setCommentDraft(null);
      return;
    }
    addComment({ pageId: commentDraft.pageId, x: commentDraft.x, y: commentDraft.y, text: commentDraft.text.trim() });
    setCommentDraft(null);
    toast.success("评论已添加");
  };

  const sendCommentToAi = (comment: CanvasComment) => {
    const page = pages.find((p) => p.id === comment.pageId);
    const node = comment.nodeId ? page?.nodes.find((n) => n.id === comment.nodeId) : null;
    const scope = node ? `页面「${page?.name}」中 id=${node.id} 的 ${node.type} 组件` : `页面「${page?.name}」`;
    dispatchCommentToAi(`请针对${scope}处理这条设计评审意见并直接修改画布：“${comment.text}”`);
    setOpenCommentId(null);
    toast.success("已发送给 AI 处理");
  };

  const handleSize = 10 / zoom;
  const pinSize = 26 / zoom;

  return (
    <section className="relative flex h-full min-w-0 flex-1 flex-col bg-slate-100">
      {pendingMasterSync && (
        <div className="absolute inset-0 z-[99] grid place-items-center bg-black/30 px-4">
          <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-violet-50 text-violet-600"><RefreshCw size={15} /></div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-gray-900">主组件已修改</h3>
                <p className="mt-1 text-xs leading-5 text-gray-500">检测到属性、尺寸或响应式设置发生变化。是否同步到 {pendingMasterSync.count} 个实例？</p>
              </div>
              <button className="rounded p-1 text-gray-400 hover:bg-gray-100" title="保持实例不变" onClick={() => setPendingMasterSync(null)}><X size={14} /></button>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="h-8 rounded-md px-3 text-xs text-gray-600 hover:bg-gray-100" onClick={() => setPendingMasterSync(null)}>保持实例不变</button>
              <button
                className="h-8 rounded-md bg-violet-600 px-3 text-xs font-medium text-white hover:bg-violet-700"
                onClick={() => {
                  const count = applyMasterSync(pendingMasterSync.masterId, false);
                  setPendingMasterSync(null);
                  if (count) toast.success(`已采纳并同步 ${count} 个实例`);
                }}
              >
                采纳并同步
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 多选对齐/分布工具栏 */}
      {multiSel.length >= 2 && (
        <div className="anim-fade-in absolute left-1/2 top-[52px] z-[75] flex -translate-x-1/2 items-center gap-0.5 rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
          <span className="px-1.5 text-[10px] font-medium text-gray-400">{multiSel.length} 项</span>
          <button className="grid h-7 w-7 place-items-center rounded text-gray-500 hover:bg-gray-100 hover:text-indigo-600" title="左对齐" onClick={() => alignMulti("left")}><AlignLeft size={14} /></button>
          <button className="grid h-7 w-7 place-items-center rounded text-gray-500 hover:bg-gray-100 hover:text-indigo-600" title="水平居中对齐" onClick={() => alignMulti("cx")}><AlignCenterHorizontal size={14} /></button>
          <button className="grid h-7 w-7 place-items-center rounded text-gray-500 hover:bg-gray-100 hover:text-indigo-600" title="右对齐" onClick={() => alignMulti("right")}><AlignRight size={14} /></button>
          <span className="mx-0.5 h-4 w-px bg-gray-200" />
          <button className="grid h-7 w-7 place-items-center rounded text-gray-500 hover:bg-gray-100 hover:text-indigo-600" title="顶对齐" onClick={() => alignMulti("top")}><ArrowUpToLine size={14} /></button>
          <button className="grid h-7 w-7 place-items-center rounded text-gray-500 hover:bg-gray-100 hover:text-indigo-600" title="垂直居中对齐" onClick={() => alignMulti("cy")}><AlignCenterVertical size={14} /></button>
          <button className="grid h-7 w-7 place-items-center rounded text-gray-500 hover:bg-gray-100 hover:text-indigo-600" title="底对齐" onClick={() => alignMulti("bottom")}><ArrowDownToLine size={14} /></button>
          <span className="mx-0.5 h-4 w-px bg-gray-200" />
          <button className="h-7 rounded px-2 text-[10px] font-medium text-gray-500 hover:bg-gray-100 hover:text-indigo-600" title="水平等距分布（≥3 项）" onClick={() => distributeMulti("h")}>横向分布</button>
          <button className="h-7 rounded px-2 text-[10px] font-medium text-gray-500 hover:bg-gray-100 hover:text-indigo-600" title="垂直等距分布（≥3 项）" onClick={() => distributeMulti("v")}>纵向分布</button>
          <span className="mx-0.5 h-4 w-px bg-gray-200" />
          <button className="grid h-7 w-7 place-items-center rounded text-gray-500 hover:bg-gray-100 hover:text-violet-600" title="将第一个元素设为主组件，其余设为实例并同步" onClick={makeMasterAndInstances}><Layers size={14} /></button>
        </div>
      )}

      {/* 快捷键帮助 */}
      <button
        className="absolute bottom-3 right-3 z-[75] grid h-8 w-8 place-items-center rounded-full border border-gray-200 bg-white text-gray-400 shadow-sm transition-colors hover:text-indigo-600"
        title="快捷键清单"
        onClick={() => setShowHelp(true)}
      >
        <HelpCircle size={15} />
      </button>
      {showHelp && (
        <div className="fixed inset-0 z-[98] grid place-items-center bg-black/40" onClick={() => setShowHelp(false)}>
          <div className="anim-scale-in w-[440px] rounded-xl bg-white p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">快捷键清单</h3>
              <button className="rounded p-1 text-gray-400 hover:bg-gray-100" onClick={() => setShowHelp(false)}><X size={15} /></button>
            </div>
            <ul className="space-y-1.5 text-[11px] text-gray-600">
              {[
                ["Shift + 空白处拖拽", "框选多个元素"],
                ["Delete / Backspace", "删除选中（支持多选批量）"],
                ["方向键 / Shift+方向键", "微移 1px / 8px"],
                ["Alt + 拖拽", "复制元素并移动副本"],
                ["Ctrl/Cmd + D", "复制选中元素"],
                ["Ctrl/Cmd + Z / Shift+Z", "撤销 / 重做"],
                ["双击文本", "原地编辑文字"],
                ["空格 + 拖拽", "平移画布"],
                ["Esc", "退出模式 / 清除选择"],
                ["Shift 拖拽角点手柄", "等比缩放"],
              ].map(([key, desc]) => (
                <li key={key} className="flex items-center justify-between gap-3">
                  <kbd className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 font-mono text-[10px] text-gray-700">{key}</kbd>
                  <span className="text-gray-500">{desc}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-gray-200 bg-white px-3">
        <div className="flex items-center gap-0.5 rounded-md border border-gray-200 bg-gray-50 p-0.5">
          {breakpointMeta.map(({ id, label, icon: Icon }) => (
            <button key={id} className={`grid h-7 w-8 place-items-center rounded transition-colors ${breakpoint === id ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-800"}`} onClick={() => setBreakpoint(id)} title={`${label} 画板`} aria-label={`${label} 画板`}>
              <Icon size={14} />
            </button>
          ))}
        </div>
        <div className="h-4 w-px bg-gray-200" />
        <div className="flex items-center rounded-md border border-gray-200 bg-white">
          <span className="inline-flex h-7 items-center gap-1 border-r border-gray-100 px-2 text-[10px] font-semibold text-gray-400"><FileText size={12} /> 页面</span>
          <select className="h-7 w-28 bg-transparent px-2 text-xs font-medium text-gray-700 outline-none" value={activePage.id} onChange={(event) => { const target = pages.find((page) => page.id === event.target.value); if (target) selectAndFocusPage(target); }} aria-label="定位项目页面">
            {pages.map((item, index) => <option key={item.id} value={item.id}>{index + 1}. {item.name}</option>)}
          </select>
          <span className="border-l border-gray-100 px-1.5 text-[9px] tabular-nums text-gray-400">{pageIndex + 1}/{pages.length}</span>
          <button className="grid h-7 w-7 place-items-center border-l border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-700" title="在当前项目中新建页面" onClick={createPage}><Plus size={13} /></button>
        </div>
        <div className="h-4 w-px bg-gray-200" />
        <div className="flex items-center rounded-md border border-gray-200 bg-gray-50 p-0.5">
          <button className="grid h-6 w-6 place-items-center rounded text-gray-500 hover:bg-white hover:text-gray-800" title="缩小" onClick={() => setZoomAtCenter(zoom - 0.1)}><ZoomOut size={13} /></button>
          <button className="h-6 min-w-12 rounded px-1 text-[10px] font-medium text-gray-500 hover:bg-white hover:text-gray-800" title="适合所有页面" onClick={() => fitAll()}>{Math.round(zoom * 100)}%</button>
          <button className="grid h-6 w-6 place-items-center rounded text-gray-500 hover:bg-white hover:text-gray-800" title="放大" onClick={() => setZoomAtCenter(zoom + 0.1)}><ZoomIn size={13} /></button>
        </div>
        <div className="h-4 w-px bg-gray-200" />
        <button
          className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[11px] font-medium transition-colors ${commentMode ? "bg-amber-500 text-white shadow-sm" : "border border-gray-200 bg-white text-gray-500 hover:border-amber-300 hover:text-amber-600"}`}
          title="评论模式：点击画布任意位置留下评审意见"
          onClick={() => { setCommentMode((value) => !value); setCommentDraft(null); setOpenCommentId(null); setAnnotateMode(false); }}
        >
          <MessageSquarePlus size={13} /> 评论
        </button>
        <button
          className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[11px] font-medium transition-colors ${annotateMode ? "bg-violet-600 text-white shadow-sm" : "border border-gray-200 bg-white text-gray-500 hover:border-violet-300 hover:text-violet-600"}`}
          title="区域标注：在画板上拖出一个框，圈住一片区域涂画着交给 AI 修改"
          onClick={() => { setAnnotateMode((value) => !value); setRegionDraft(null); setRegionPrompt(null); setCommentMode(false); setCommentDraft(null); }}
        >
          <BoxSelect size={13} /> 标注
        </button>
        <button className="ml-auto grid h-7 w-7 place-items-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-700" onClick={closeStudio} title="收起编辑器"><PanelRightClose size={14} /></button>
      </div>

      <div
        ref={viewportRef}
        className={`relative min-h-0 flex-1 touch-none overflow-hidden ${panDrag ? "cursor-grabbing" : spacePressed ? "cursor-grab" : commentMode || annotateMode ? "cursor-crosshair" : "cursor-default"}`}
        style={{
          backgroundColor: "#eef0f2",
          backgroundImage: "radial-gradient(#c8ccd1 0.75px, transparent 0.75px)",
          backgroundSize: `${Math.max(8, 24 * zoom)}px ${Math.max(8, 24 * zoom)}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
        onWheel={(event) => {
          event.preventDefault();
          if (event.shiftKey) {
            const current = panRef.current;
            const nextPan = { x: current.x - event.deltaX, y: current.y - event.deltaY };
            panRef.current = nextPan;
            setPan(nextPan);
            return;
          }
          const rect = event.currentTarget.getBoundingClientRect();
          const cursorX = event.clientX - rect.left;
          const cursorY = event.clientY - rect.top;
          const currentPan = panRef.current;
          const currentZoom = zoomRef.current;
          const worldX = (cursorX - currentPan.x) / currentZoom;
          const worldY = (cursorY - currentPan.y) / currentZoom;
          const wheelScale = Math.exp(-event.deltaY * 0.0015);
          const nextZoom = Math.min(2, Math.max(0.1, currentZoom * wheelScale));
          const nextPan = { x: cursorX - worldX * nextZoom, y: cursorY - worldY * nextZoom };
          zoomRef.current = nextZoom;
          panRef.current = nextPan;
          setZoom(nextZoom);
          setPan(nextPan);
        }}
        onPointerDownCapture={(event) => {
          if (event.button !== 1 && !spacePressedRef.current) return;
          event.preventDefault();
          event.stopPropagation();
          beginPan(event);
        }}
        onPointerDown={(event) => {
          if (event.target !== event.currentTarget || event.button !== 0) return;
          clearSelection();
          setOpenCommentId(null);
          setCommentDraft(null);
          beginPan(event);
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
        onPointerLeave={() => { if (!panDrag && !nodeDrag && !pageDrag && !resizeDrag && !multiDrag && !multiResizeDrag) stopDragging(); }}
      >
        <div className="absolute left-0 top-0" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "0 0" }}>
          {pages.map((page) => {
            const size = getArtboardSize(page);
            const frames = pageFrames.get(page.id) ?? new Map();
            const pageSelected = selection.type === "page" && selection.id === page.id;
            const nodeSelected = selection.type === "node" && selection.pageId === page.id ? selection.id : null;
            const pageComments = comments.filter((comment) => comment.pageId === page.id && !comment.resolved);
            return (
              <div key={page.id} className="absolute" style={{ left: page.layout.x, top: page.layout.y, width: size.width, height: size.height }}>
                <button
                  className={`absolute -top-8 left-0 flex h-7 max-w-full items-center gap-1.5 rounded px-2 text-left text-xs font-medium transition-colors ${pageSelected ? "bg-gray-950 text-white shadow-lg" : "text-gray-600 hover:bg-white hover:text-gray-900"}`}
                  title="拖动画板"
                  onClick={() => { setActivePageId(page.id); select({ type: "page", id: page.id }); }}
                  onPointerDown={(event) => {
                    if (event.button !== 0) return;
                    event.stopPropagation();
                    setActivePageId(page.id);
                    select({ type: "page", id: page.id });
                    setPageDrag({ pageId: page.id, startX: event.clientX, clientY: event.clientY, x: page.layout.x, y: page.layout.y });
                    event.currentTarget.setPointerCapture(event.pointerId);
                  }}
                >
                  <GripHorizontal size={13} className="shrink-0 opacity-60" />
                  <span className="truncate">{page.name}</span>
                  <span className={`shrink-0 text-[9px] ${pageSelected ? "text-white/50" : "text-gray-400"}`}>{size.width} × {size.height}</span>
                </button>
                <div
                  className={`relative overflow-hidden bg-white shadow-[0_12px_44px_rgba(15,23,42,0.14)] transition-shadow ${pageSelected ? "ring-2 ring-indigo-500 ring-offset-4 ring-offset-[#eef0f2]" : "ring-1 ring-black/5"}`}
                  style={{ width: size.width, height: size.height, backgroundImage: "radial-gradient(#cbd5e1 0.65px, transparent 0.65px)", backgroundSize: "12px 12px" }}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => dropComponent(event, page)}
                  onPointerDown={(event) => handleArtboardPointerDown(event, page)}
                  onPointerMove={(event) => {
                    if (regionDraft && regionDraft.pageId === page.id) {
                      const rect = event.currentTarget.getBoundingClientRect();
                      setRegionDraft({ ...regionDraft, x1: (event.clientX - rect.left) / zoom, y1: (event.clientY - rect.top) / zoom });
                      return;
                    }
                    if (marquee && marquee.pageId === page.id) {
                      const rect = event.currentTarget.getBoundingClientRect();
                      setMarquee({ ...marquee, x1: (event.clientX - rect.left) / zoom, y1: (event.clientY - rect.top) / zoom });
                    }
                  }}
                  onPointerUp={() => {
                    if (regionDraft && regionDraft.pageId === page.id) { finalizeRegion(); return; }
                    if (marquee && marquee.pageId === page.id) finalizeMarquee();
                  }}
                >
                  {page.nodes.filter((node) => !node.hidden).sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0)).map((node) => {
                    const frame = nodePreview?.pageId === page.id && nodePreview.nodeId === node.id
                      ? nodePreview.frame
                      : frames.get(node.id) ?? resolveNodeFrame(node, breakpoint);
                    const selected = node.id === nodeSelected;
                    const isEditing = editing?.nodeId === node.id;
                    const proposed = proposalNodeIds.includes(node.id);
                    const def = findComponentDef(registry, node.type);
                    return (
                      <div
                        key={node.id}
                        className={`absolute ${selected ? "ring-2 ring-indigo-500 ring-offset-1" : multiSel.includes(node.id) ? "ring-2 ring-violet-500 ring-offset-1" : proposed ? "" : "hover:ring-1 hover:ring-indigo-300"} ${node.locked ? "cursor-not-allowed" : "cursor-move"}`}
                        style={{
                          left: 0,
                          top: 0,
                          width: frame.width,
                          height: frame.height,
                          zIndex: node.zIndex ?? 0,
                          transform: `translate3d(${frame.x}px, ${frame.y}px, 0)`,
                          willChange: nodeDrag?.pageId === page.id && nodeDrag.nodeId === node.id ? "transform" : undefined,
                          contain: "layout paint",
                        }}
                        onPointerDown={(event) => {
                          if (event.button !== 0 || commentMode || annotateMode || isEditing) return;
                          event.stopPropagation();
                          setOpenCommentId(null);
                          setActivePageId(page.id);
                          // 多选态拖动：整体移动
                          if (multiSel.includes(node.id) && multiSel.length > 1 && !event.altKey && !node.locked) {
                            const startFrames: Record<string, { x: number; y: number }> = {};
                            multiSel.forEach((id) => {
                              const n = page.nodes.find((item) => item.id === id);
                              if (n) startFrames[id] = { x: n.position.x, y: n.position.y };
                            });
                            setMultiDrag({ pageId: page.id, startX: event.clientX, startY: event.clientY, frames: startFrames });
                            return;
                          }
                          setMultiSel([]);
                          // Alt + 拖拽 = 复制并移动副本
                          let dragNodeId = node.id;
                          let dragFrame = frame;
                          if (event.altKey && !node.locked) {
                            const copyId = duplicateNode(page.id, node.id, 0, 0);
                            if (copyId) {
                              dragNodeId = copyId;
                              select({ type: "node", id: copyId, pageId: page.id });
                            }
                          } else {
                            select({ type: "node", id: node.id, pageId: page.id });
                          }
                          if (!node.locked) {
                            event.preventDefault();
                            setNodePreview(null);
                            nodePreviewRef.current = null;
                            setNodeDrag({ pageId: page.id, nodeId: dragNodeId, startX: event.clientX, startY: event.clientY, frameX: dragFrame.x, frameY: dragFrame.y, width: dragFrame.width, height: dragFrame.height });
                            event.currentTarget.setPointerCapture(event.pointerId);
                          }
                        }}
                        onDoubleClick={(event) => {
                          event.stopPropagation();
                          if (node.props?.text !== undefined || node.type === "Text") {
                            setEditing({ pageId: page.id, nodeId: node.id, text: node.props?.text ?? "" });
                          }
                        }}
                      >
                        {renderComponent({ def, props: node.props ?? {} })}
                        {proposed && !selected && <div className="pointer-events-none absolute inset-0 rounded ring-2 ring-dashed ring-amber-400" />}
                        {isEditing && (
                          <textarea
                            autoFocus
                            className="absolute inset-0 z-50 w-full resize-none rounded border-2 border-indigo-500 bg-white/95 p-2 text-sm text-gray-800 shadow-xl outline-none"
                            value={editing.text}
                            onChange={(event) => setEditing({ ...editing, text: event.target.value })}
                            onPointerDown={(event) => event.stopPropagation()}
                            onKeyDown={(event) => {
                              event.stopPropagation();
                              if (event.key === "Enter" && !event.shiftKey) {
                                event.preventDefault();
                                updateNodeProps(page.id, node.id, { text: editing.text });
                                setEditing(null);
                              }
                              if (event.key === "Escape") setEditing(null);
                            }}
                            onBlur={() => {
                              updateNodeProps(page.id, node.id, { text: editing.text });
                              setEditing(null);
                            }}
                          />
                        )}
                        {selected && (
                          <>
                            <div className="absolute -top-7 left-0 flex h-6 items-center overflow-hidden rounded bg-gray-950 text-white shadow-lg">
                              <span className="px-2 text-[10px] font-medium">{node.type}</span>
                              <span className="border-l border-white/15 px-1.5 text-[9px] tabular-nums text-white/60">{Math.round(frame.width)} × {Math.round(frame.height)}</span>
                              <button
                                className="grid h-6 w-7 place-items-center border-l border-white/15 text-amber-300 hover:bg-white/10"
                                title="截图标记并交给 AI 修改"
                                onPointerDown={(event) => event.stopPropagation()}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setActivePageId(page.id);
                                  setAnnotateMode(false);
                                  setRegionPrompt({
                                    pageId: page.id,
                                    x: Math.round(frame.x),
                                    y: Math.round(frame.y),
                                    width: Math.round(frame.width),
                                    height: Math.round(frame.height),
                                    nodeIds: [node.id],
                                    text: "",
                                  });
                                }}
                              >
                                <Sparkles size={12} />
                              </button>
                              <button
                                className="grid h-6 w-7 place-items-center border-l border-white/15 text-white/70 hover:bg-white/10"
                                title="设为主组件：多选「主+其它元素」后点此建立实例关联"
                                onPointerDown={(event) => event.stopPropagation()}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  if (multiSel.length >= 2) makeMasterAndInstances();
                                  else {
                                    updateNode(page.id, node.id, { componentId: `master-${node.id}` });
                                    toast.success("已设为主组件；改完它后点旁「同步」按钮可批量更新实例");
                                  }
                                }}
                              >
                                <Layers size={12} />
                              </button>
                              <button
                                className="grid h-6 w-7 place-items-center border-l border-white/15 text-white/70 hover:bg-white/10"
                                title="同步该主组件的所有实例"
                                onPointerDown={(event) => event.stopPropagation()}
                                onClick={(event) => { event.stopPropagation(); syncInstances(); }}
                              >
                                <RefreshCw size={12} />
                              </button>
                            </div>
                            {!node.locked && HANDLES.map(({ dir, cursor }) => {
                              const isCorner = dir.length === 2;
                              const style: React.CSSProperties = {
                                width: handleSize,
                                height: handleSize,
                                cursor,
                                position: "absolute",
                                background: "#ffffff",
                                border: `${Math.max(1, 1.5 / zoom)}px solid #6366f1`,
                                borderRadius: isCorner ? "2px" : "50%",
                                zIndex: 90,
                              };
                              if (dir.includes("n")) style.top = -handleSize / 2;
                              if (dir.includes("s")) style.bottom = -handleSize / 2;
                              if (dir === "e" || dir === "w") style.top = `calc(50% - ${handleSize / 2}px)`;
                              if (dir.includes("w")) style.left = -handleSize / 2;
                              if (dir.includes("e")) style.right = -handleSize / 2;
                              if (dir === "n" || dir === "s") style.left = `calc(50% - ${handleSize / 2}px)`;
                              return (
                                <div
                                  key={dir}
                                  style={style}
                                  onPointerDown={(event) => {
                                    if (event.button !== 0) return;
                                    event.stopPropagation();
                                    setResizeDrag({ pageId: page.id, nodeId: node.id, dir, startX: event.clientX, startY: event.clientY, frame });
                                  }}
                                />
                              );
                            })}
                          </>
                        )}
                      </div>
                    );
                  })}

                  {page.id === activePage.id && (() => {
                    const group = getMultiBounds(page.id);
                    if (!group) return null;
                    return (
                      <div className="pointer-events-none absolute z-[88] border-2 border-violet-500" style={{ left: group.bounds.x, top: group.bounds.y, width: group.bounds.width, height: group.bounds.height }}>
                        <div className="absolute -top-7 left-0 rounded bg-violet-600 px-2 py-1 text-[10px] font-medium text-white shadow">{multiSel.length} 项 · {Math.round(group.bounds.width)} × {Math.round(group.bounds.height)}</div>
                        {HANDLES.map(({ dir, cursor }) => {
                          const isCorner = dir.length === 2;
                          const sizePx = handleSize;
                          const style: React.CSSProperties = { position: "absolute", width: sizePx, height: sizePx, cursor, background: "white", border: `${Math.max(1, 1.5 / zoom)}px solid #7c3aed`, borderRadius: isCorner ? 2 : "50%", pointerEvents: "auto" };
                          if (dir.includes("n")) style.top = -sizePx / 2;
                          if (dir.includes("s")) style.bottom = -sizePx / 2;
                          if (dir === "e" || dir === "w") style.top = `calc(50% - ${sizePx / 2}px)`;
                          if (dir.includes("w")) style.left = -sizePx / 2;
                          if (dir.includes("e")) style.right = -sizePx / 2;
                          if (dir === "n" || dir === "s") style.left = `calc(50% - ${sizePx / 2}px)`;
                          return (
                            <div
                              key={dir}
                              style={style}
                              onPointerDown={(event) => {
                                if (event.button !== 0) return;
                                event.preventDefault();
                                event.stopPropagation();
                                setMultiResizeDrag({ pageId: page.id, dir, startX: event.clientX, startY: event.clientY, bounds: group.bounds, frames: group.frames });
                                event.currentTarget.setPointerCapture(event.pointerId);
                              }}
                            />
                          );
                        })}
                      </div>
                    );
                  })()}

                  {/* 对齐参考线 */}
                  {guides && guides.pageId === page.id && (
                    <>
                      {guides.xs.map((x) => (
                        <div key={`gx-${x}`} className="pointer-events-none absolute bg-rose-400" style={{ left: x - 0.5 / zoom, top: -24 / zoom, width: 1 / zoom, height: size.height + 48 / zoom, zIndex: 95 }} />
                      ))}
                      {guides.ys.map((y) => (
                        <div key={`gy-${y}`} className="pointer-events-none absolute bg-rose-400" style={{ top: y - 0.5 / zoom, left: -24 / zoom, height: 1 / zoom, width: size.width + 48 / zoom, zIndex: 95 }} />
                      ))}
                    </>
                  )}

                  {/* 多选框选矩形 */}
                  {marquee && marquee.pageId === page.id && (
                    <div
                      className="pointer-events-none absolute z-[70] border border-violet-500 bg-violet-400/10"
                      style={{
                        left: Math.min(marquee.x0, marquee.x1),
                        top: Math.min(marquee.y0, marquee.y1),
                        width: Math.abs(marquee.x1 - marquee.x0),
                        height: Math.abs(marquee.y1 - marquee.y0),
                      }}
                    />
                  )}

                  {/* 区域标注拖拽框 */}
                  {regionDraft && regionDraft.pageId === page.id && (
                    <div
                      className="pointer-events-none absolute z-[70] rounded-sm border-2 border-dashed border-violet-500 bg-violet-400/10 shadow-[0_0_0_1px_rgba(139,92,246,0.15)]"
                      style={{
                        left: Math.min(regionDraft.x0, regionDraft.x1),
                        top: Math.min(regionDraft.y0, regionDraft.y1),
                        width: Math.abs(regionDraft.x1 - regionDraft.x0),
                        height: Math.abs(regionDraft.y1 - regionDraft.y0),
                      }}
                    >
                      <span className="absolute -top-6 left-0 rounded bg-violet-600 px-1.5 py-0.5 text-[9px] font-medium text-white shadow">松开圈住这片区域</span>
                    </div>
                  )}

                  {/* 区域标注完成后：保留虚线选区，并在右下角就地描述修改。 */}
                  {regionPrompt && regionPrompt.pageId === page.id && (() => {
                    // 气泡保持屏幕尺寸，同时在页面边缘内自动翻转/收敛，避免遮住整张画布。
                    const textLength = [...regionPrompt.text].length;
                    const bubbleWidth = Math.min(420, Math.max(220, 210 + Math.min(textLength, 34) * 5));
                    const estimatedLines = Math.max(1, Math.ceil(Math.max(textLength, 18) / Math.max(18, Math.floor(bubbleWidth / 8))));
                    const bubbleHeight = Math.min(220, 92 + estimatedLines * 18);
                    const worldWidth = bubbleWidth / zoom;
                    const worldHeight = bubbleHeight / zoom;
                    const anchorX = regionPrompt.x + regionPrompt.width + 12 / zoom;
                    const anchorY = regionPrompt.y + regionPrompt.height + 12 / zoom;
                    const left = Math.max(8 / zoom, Math.min(size.width - worldWidth - 8 / zoom, anchorX));
                    const top = Math.max(8 / zoom, Math.min(size.height - worldHeight - 8 / zoom, anchorY));
                    return (
                    <>
                      <div
                        className="pointer-events-none absolute z-[70] border-2 border-dashed border-violet-500 bg-violet-400/10"
                        style={{ left: regionPrompt.x, top: regionPrompt.y, width: regionPrompt.width, height: regionPrompt.height }}
                      />
                      <div
                        className="absolute z-[99] origin-top-left rounded-md border border-dashed border-violet-400 bg-white p-2.5 shadow-xl"
                        style={{
                          left,
                          top,
                          width: bubbleWidth,
                          minHeight: 88,
                          maxHeight: bubbleHeight,
                          transform: `scale(${1 / zoom})`,
                          transformOrigin: "top left",
                        }}
                        onPointerDown={(event) => event.stopPropagation()}
                      >
                        <div className="mb-1.5 flex items-center justify-between gap-3">
                          <span className="text-[11px] font-semibold text-violet-700">怎么修改这片区域？</span>
                          <button className="rounded p-0.5 text-gray-400 hover:bg-gray-100" title="取消区域标注" onClick={() => setRegionPrompt(null)}><X size={12} /></button>
                        </div>
                        <textarea
                          autoFocus
                          rows={1}
                          value={regionPrompt.text}
                          placeholder={regionPrompt.nodeIds.length ? "例如：让这里更有层次，主按钮更突出" : "例如：在这里生成一个三列功能区"}
                          className="min-h-10 max-h-40 w-full resize-none overflow-y-auto rounded border border-gray-200 bg-gray-50 px-2.5 py-2 text-xs leading-5 text-gray-700 outline-none transition-colors focus:border-violet-400 focus:bg-white"
                          onChange={(event) => setRegionPrompt({ ...regionPrompt, text: event.target.value })}
                          onInput={(event) => {
                            const target = event.currentTarget;
                            target.style.height = "0px";
                            target.style.height = `${Math.min(160, target.scrollHeight)}px`;
                          }}
                          onKeyDown={(event) => {
                            event.stopPropagation();
                            if (event.key === "Enter" && !event.shiftKey) {
                              event.preventDefault();
                              submitRegionPrompt();
                            }
                            if (event.key === "Escape") setRegionPrompt(null);
                          }}
                        />
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className="text-[9px] text-gray-400">{regionPrompt.nodeIds.length ? `已圈选 ${regionPrompt.nodeIds.length} 个组件` : "将在空白区域生成内容"}</span>
                          <button
                            className="inline-flex h-7 items-center gap-1 rounded bg-violet-600 px-2.5 text-[10px] font-medium text-white hover:bg-violet-700 disabled:opacity-40"
                            disabled={!regionPrompt.text.trim()}
                            onClick={submitRegionPrompt}
                          >
                            <Send size={11} /> 交给 AI
                          </button>
                        </div>
                      </div>
                    </>
                    );
                  })()}

                  {/* 评论钉 */}
                  {pageComments.map((comment, commentIndex) => (
                    <button
                      key={comment.id}
                      className="absolute z-[96] grid place-items-center rounded-full rounded-tl-none bg-amber-500 text-white shadow-[0_3px_10px_rgba(217,119,6,0.45)] transition-transform hover:scale-110"
                      style={{ left: comment.x, top: comment.y, width: pinSize, height: pinSize, fontSize: 12 / zoom }}
                      title={comment.text}
                      onPointerDown={(event) => { event.stopPropagation(); setOpenCommentId(openCommentId === comment.id ? null : comment.id); setCommentDraft(null); }}
                    >
                      {commentIndex + 1}
                    </button>
                  ))}

                  {/* 评论详情弹层 */}
                  {openCommentId && (() => {
                    const comment = comments.find((c) => c.id === openCommentId && c.pageId === page.id);
                    if (!comment) return null;
                    return (
                      <div
                        className="absolute z-[97] w-64 origin-top-left rounded-lg border border-gray-200 bg-white p-3 shadow-2xl"
                        style={{ left: comment.x + 12, top: comment.y + 8, transform: `scale(${1 / zoom})` }}
                        onPointerDown={(event) => event.stopPropagation()}
                      >
                        <div className="mb-1.5 flex items-center justify-between text-[10px] text-gray-400">
                          <span>{comment.author} · {new Date(comment.createdAt).toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                          <button className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700" onClick={() => setOpenCommentId(null)}><X size={12} /></button>
                        </div>
                        <textarea
                          className="h-14 w-full resize-none rounded border border-gray-200 bg-gray-50 p-2 text-xs text-gray-700 outline-none focus:border-amber-400 focus:bg-white"
                          value={comment.text}
                          onChange={(event) => updateComment(comment.id, { text: event.target.value })}
                        />
                        <div className="mt-2 flex items-center gap-1.5">
                          <button className="inline-flex h-6 items-center gap-1 rounded bg-amber-500 px-2 text-[10px] font-medium text-white hover:bg-amber-600" onClick={() => sendCommentToAi(comment)}>
                            <Sparkles size={11} /> 交给 AI
                          </button>
                          <button className="inline-flex h-6 items-center gap-1 rounded border border-gray-200 px-2 text-[10px] text-gray-500 hover:bg-gray-50" onClick={() => { updateComment(comment.id, { resolved: true }); setOpenCommentId(null); }}>
                            <Check size={11} /> 解决
                          </button>
                          <button className="ml-auto inline-flex h-6 items-center gap-1 rounded px-2 text-[10px] text-rose-500 hover:bg-rose-50" onClick={() => { removeComment(comment.id); setOpenCommentId(null); }}>
                            <Trash2 size={11} /> 删除
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* 新建评论输入弹层 */}
                  {commentDraft && commentDraft.pageId === page.id && (
                    <div
                      className="absolute z-[98] w-60 origin-top-left rounded-lg border border-amber-200 bg-white p-2.5 shadow-2xl"
                      style={{ left: commentDraft.x + 12, top: commentDraft.y + 8, transform: `scale(${1 / zoom})` }}
                      onPointerDown={(event) => event.stopPropagation()}
                    >
                      <textarea
                        autoFocus
                        placeholder="写下评审意见，回车提交…"
                        className="h-16 w-full resize-none rounded border border-gray-200 bg-gray-50 p-2 text-xs text-gray-700 outline-none focus:border-amber-400 focus:bg-white"
                        value={commentDraft.text}
                        onChange={(event) => setCommentDraft({ ...commentDraft, text: event.target.value })}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); submitCommentDraft(); }
                          if (event.key === "Escape") setCommentDraft(null);
                        }}
                      />
                      <div className="mt-1.5 flex justify-end gap-1.5">
                        <button className="h-6 rounded px-2 text-[10px] text-gray-500 hover:bg-gray-50" onClick={() => setCommentDraft(null)}>取消</button>
                        <button className="h-6 rounded bg-amber-500 px-2.5 text-[10px] font-medium text-white hover:bg-amber-600 disabled:opacity-40" disabled={!commentDraft.text.trim()} onClick={submitCommentDraft}>添加评论</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
