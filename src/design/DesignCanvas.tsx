"use client";
import * as React from "react";
import { FileText, GripHorizontal, Monitor, PanelRightClose, Plus, Smartphone, Sparkles, Tablet, ZoomIn, ZoomOut } from "lucide-react";
import { renderComponent } from "@/components/renderer";
import { findComponentDef } from "@/components/registry";
import { defaultSizeForType } from "@/canvas/rfAdapter";
import { useCanvasStore } from "@/store/canvasStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { resolveNodeFrame, resolvePageFrames } from "./frame";
import type { BreakpointKey, Page } from "@/types/schema";
import { useAnnotateStore } from "@/store/annotateStore";

const PAGE_GAP = 160;
const VIEW_PADDING = 72;

const breakpointMeta: Array<{ id: BreakpointKey; label: string; icon: React.ElementType }> = [
  { id: "desktop", label: "Desktop", icon: Monitor },
  { id: "tablet", label: "Tablet", icon: Tablet },
  { id: "mobile", label: "Mobile", icon: Smartphone },
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
}

interface PageDrag {
  pageId: string;
  startX: number;
  startY: number;
  x: number;
  y: number;
}

export function DesignCanvas() {
  const pages = useCanvasStore((s) => s.pages);
  const registry = useCanvasStore((s) => s.componentRegistry);
  const designSystem = useCanvasStore((s) => s.designSystem);
  const selection = useCanvasStore((s) => s.selection);
  const addPage = useCanvasStore((s) => s.addPage);
  const addNode = useCanvasStore((s) => s.addNode);
  const updatePage = useCanvasStore((s) => s.updatePage);
  const updateNode = useCanvasStore((s) => s.updateNode);
  const updateNodeResponsive = useCanvasStore((s) => s.updateNodeResponsive);
  const select = useCanvasStore((s) => s.select);
  const clearSelection = useCanvasStore((s) => s.clearSelection);
  const activePageId = useWorkspaceStore((s) => s.activePageId);
  const setActivePageId = useWorkspaceStore((s) => s.setActivePageId);
  const breakpoint = useWorkspaceStore((s) => s.breakpoint);
  const setBreakpoint = useWorkspaceStore((s) => s.setBreakpoint);
  const closeStudio = useWorkspaceStore((s) => s.closeStudio);

  const viewportRef = React.useRef<HTMLDivElement>(null);
  const fittedKeyRef = React.useRef("");
  const spacePressedRef = React.useRef(false);
  const [viewportSize, setViewportSize] = React.useState({ width: 0, height: 0 });
  const [zoom, setZoom] = React.useState(0.6);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const [panDrag, setPanDrag] = React.useState<PanDrag | null>(null);
  const [nodeDrag, setNodeDrag] = React.useState<NodeDrag | null>(null);
  const [pageDrag, setPageDrag] = React.useState<PageDrag | null>(null);
  const [spacePressed, setSpacePressed] = React.useState(false);

  const activePage = pages.find((item) => item.id === activePageId) ?? pages[0];
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

  if (!activePage) {
    return <div className="grid h-full place-items-center bg-slate-50 text-sm text-gray-400">新建页面后即可开始设计</div>;
  }

  const beginPan = (event: React.PointerEvent<HTMLElement>) => {
    setPanDrag({ clientX: event.clientX, clientY: event.clientY, x: pan.x, y: pan.y });
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (panDrag) {
      setPan({ x: panDrag.x + event.clientX - panDrag.clientX, y: panDrag.y + event.clientY - panDrag.clientY });
      return;
    }
    if (pageDrag) {
      const page = pages.find((item) => item.id === pageDrag.pageId);
      if (!page) return;
      updatePage(page.id, {
        layout: {
          ...page.layout,
          x: Math.round(pageDrag.x + (event.clientX - pageDrag.startX) / zoom),
          y: Math.round(pageDrag.y + (event.clientY - pageDrag.startY) / zoom),
        },
      });
      return;
    }
    if (!nodeDrag) return;
    const page = pages.find((item) => item.id === nodeDrag.pageId);
    if (!page) return;
    const next = {
      x: Math.round(nodeDrag.frameX + (event.clientX - nodeDrag.startX) / zoom),
      y: Math.round(nodeDrag.frameY + (event.clientY - nodeDrag.startY) / zoom),
    };
    if (breakpoint === "desktop") updateNode(page.id, nodeDrag.nodeId, { position: next });
    else updateNodeResponsive(page.id, nodeDrag.nodeId, breakpoint, next);
  };

  const stopDragging = () => {
    setPanDrag(null);
    setNodeDrag(null);
    setPageDrag(null);
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
    const worldX = (centerX - pan.x) / zoom;
    const worldY = (centerY - pan.y) / zoom;
    setZoom(bounded);
    setPan({ x: centerX - worldX * bounded, y: centerY - worldY * bounded });
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

  return (
    <section className="flex h-full min-w-0 flex-1 flex-col bg-slate-100">
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-gray-200 bg-white px-3">
        <div className="flex items-center gap-0.5 rounded-md border border-gray-200 bg-gray-50 p-0.5">
          {breakpointMeta.map(({ id, label, icon: Icon }) => (
            <button key={id} className={`grid h-7 w-8 place-items-center rounded ${breakpoint === id ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-800"}`} onClick={() => setBreakpoint(id)} title={`${label} 画板`} aria-label={`${label} 画板`}>
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
        <button className="ml-auto grid h-7 w-7 place-items-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-700" onClick={closeStudio} title="收起编辑器"><PanelRightClose size={14} /></button>
      </div>

      <div
        ref={viewportRef}
        className={`relative min-h-0 flex-1 touch-none overflow-hidden ${panDrag ? "cursor-grabbing" : spacePressed ? "cursor-grab" : "cursor-default"}`}
        style={{
          backgroundColor: "#eef0f2",
          backgroundImage: "radial-gradient(#c8ccd1 0.75px, transparent 0.75px)",
          backgroundSize: `${Math.max(8, 24 * zoom)}px ${Math.max(8, 24 * zoom)}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
        onWheel={(event) => {
          if (event.ctrlKey || event.metaKey) {
            const rect = event.currentTarget.getBoundingClientRect();
            const cursorX = event.clientX - rect.left;
            const cursorY = event.clientY - rect.top;
            const worldX = (cursorX - pan.x) / zoom;
            const worldY = (cursorY - pan.y) / zoom;
            const nextZoom = Math.min(2, Math.max(0.1, zoom * (event.deltaY > 0 ? 0.9 : 1.1)));
            setZoom(nextZoom);
            setPan({ x: cursorX - worldX * nextZoom, y: cursorY - worldY * nextZoom });
          } else {
            setPan((current) => ({ x: current.x - event.deltaX, y: current.y - event.deltaY }));
          }
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
          beginPan(event);
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
        onPointerLeave={() => { if (!panDrag && !nodeDrag && !pageDrag) stopDragging(); }}
      >
        <div className="absolute left-0 top-0" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "0 0" }}>
          {pages.map((page) => {
            const size = getArtboardSize(page);
            const frames = pageFrames.get(page.id) ?? new Map();
            const pageSelected = selection.type === "page" && selection.id === page.id;
            const nodeSelected = selection.type === "node" && selection.pageId === page.id ? selection.id : null;
            return (
              <div key={page.id} className="absolute" style={{ left: page.layout.x, top: page.layout.y, width: size.width, height: size.height }}>
                <button
                  className={`absolute -top-8 left-0 flex h-7 max-w-full items-center gap-1.5 rounded px-2 text-left text-xs font-medium ${pageSelected ? "bg-gray-950 text-white shadow-lg" : "text-gray-600 hover:bg-white hover:text-gray-900"}`}
                  title="拖动画板"
                  onClick={() => { setActivePageId(page.id); select({ type: "page", id: page.id }); }}
                  onPointerDown={(event) => {
                    if (event.button !== 0) return;
                    event.stopPropagation();
                    setActivePageId(page.id);
                    select({ type: "page", id: page.id });
                    setPageDrag({ pageId: page.id, startX: event.clientX, startY: event.clientY, x: page.layout.x, y: page.layout.y });
                    event.currentTarget.setPointerCapture(event.pointerId);
                  }}
                >
                  <GripHorizontal size={13} className="shrink-0 opacity-60" />
                  <span className="truncate">{page.name}</span>
                  <span className={`shrink-0 text-[9px] ${pageSelected ? "text-white/50" : "text-gray-400"}`}>{size.width} × {size.height}</span>
                </button>
                <div
                  className={`relative overflow-hidden bg-white shadow-[0_12px_44px_rgba(15,23,42,0.14)] ${pageSelected ? "ring-2 ring-indigo-500 ring-offset-4 ring-offset-[#eef0f2]" : "ring-1 ring-black/5"}`}
                  style={{ width: size.width, height: size.height, backgroundImage: "radial-gradient(#cbd5e1 0.65px, transparent 0.65px)", backgroundSize: "12px 12px" }}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => dropComponent(event, page)}
                  onPointerDown={(event) => {
                    if (event.target !== event.currentTarget || event.button !== 0) return;
                    setActivePageId(page.id);
                    select({ type: "page", id: page.id });
                    beginPan(event);
                  }}
                >
                  {page.nodes.filter((node) => !node.hidden).sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0)).map((node) => {
                    const frame = frames.get(node.id) ?? resolveNodeFrame(node, breakpoint);
                    const selected = node.id === nodeSelected;
                    const def = findComponentDef(registry, node.type);
                    return (
                      <div
                        key={node.id}
                        className={`absolute ${selected ? "ring-2 ring-indigo-500 ring-offset-1" : "hover:ring-1 hover:ring-indigo-300"} ${node.locked ? "cursor-not-allowed" : "cursor-move"}`}
                        style={{ left: frame.x, top: frame.y, width: frame.width, height: frame.height, zIndex: node.zIndex ?? 0 }}
                        onPointerDown={(event) => {
                          if (event.button !== 0) return;
                          event.stopPropagation();
                          setActivePageId(page.id);
                          select({ type: "node", id: node.id, pageId: page.id });
                          if (!node.locked) {
                            setNodeDrag({ pageId: page.id, nodeId: node.id, startX: event.clientX, startY: event.clientY, frameX: frame.x, frameY: frame.y });
                            event.currentTarget.setPointerCapture(event.pointerId);
                          }
                        }}
                      >
                        {renderComponent({ def, props: node.props ?? {} })}
                        {selected && (
                          <div className="absolute -top-7 left-0 flex h-6 items-center overflow-hidden rounded bg-gray-950 text-white shadow-lg">
                            <span className="px-2 text-[10px] font-medium">{node.type}</span>
                            <button
                              className="grid h-6 w-7 place-items-center border-l border-white/15 text-amber-300 hover:bg-white/10"
                              title="截图标记并交给 AI 修改"
                              onPointerDown={(event) => event.stopPropagation()}
                              onClick={(event) => { event.stopPropagation(); useAnnotateStore.getState().open({ mode: "edit", pageId: page.id, nodes: [node] }); }}
                            >
                              <Sparkles size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
