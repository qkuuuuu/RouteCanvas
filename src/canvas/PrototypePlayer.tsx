"use client";
/**
 * 原型演示模式 — 沿 transitions 真实跳转的全屏预览
 * 支持设备壳切换（桌面/手机）、页面过渡动画、点击热区高亮。
 */
import * as React from "react";
import { ChevronLeft, ChevronRight, Monitor, Smartphone, X } from "lucide-react";
import { renderComponent } from "@/components/renderer";
import { findComponentDef } from "@/components/registry";
import { useCanvasStore } from "@/store/canvasStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { resolveNodeFrame, resolvePageFrames } from "@/design/frame";

export function PrototypePlayer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pages = useCanvasStore((s) => s.pages);
  const transitions = useCanvasStore((s) => s.transitions);
  const registry = useCanvasStore((s) => s.componentRegistry);
  const setActivePageId = useWorkspaceStore((s) => s.setActivePageId);

  const [currentId, setCurrentId] = React.useState<string | null>(null);
  const [animKey, setAnimKey] = React.useState(0);
  const [device, setDevice] = React.useState<"desktop" | "mobile">("desktop");
  const [hoverNav, setHoverNav] = React.useState<string | null>(null);
  const stageRef = React.useRef<HTMLDivElement>(null);
  const artboardRef = React.useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = React.useState({ width: 0, height: 0 });

  const current = pages.find((p) => p.id === currentId) ?? pages.find((p) => p.route.isIndex) ?? pages[0];
  const currentIndex = current ? pages.findIndex((p) => p.id === current.id) : -1;

  React.useEffect(() => {
    if (open && !currentId && pages.length) {
      const start = pages.find((p) => p.route.isIndex) ?? pages[0];
      setCurrentId(start.id);
    }
    if (!open) setCurrentId(null);
  }, [open, currentId, pages]);

  React.useEffect(() => {
    const element = stageRef.current;
    if (!element || !open) return;
    const observer = new ResizeObserver(([entry]) => {
      setStageSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [open]);

  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!open) return;
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") gotoIndex(currentIndex + 1);
      if (event.key === "ArrowLeft") gotoIndex(currentIndex - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, currentIndex, pages]);

  if (!open || !current) return null;

  const artboardWidth = device === "mobile" ? Math.min(390, current.layout.width) : current.layout.width;
  const viewportHeight = Math.min(current.layout.height, device === "mobile" ? 844 : 800);
  const scale = stageSize.width && stageSize.height
    ? Math.min(1, (stageSize.width - 96) / artboardWidth, (stageSize.height - 96) / viewportHeight)
    : 0.5;

  const gotoPage = (pageId: string) => {
    if (pageId === currentId) return;
    setCurrentId(pageId);
    setActivePageId(pageId);
    setAnimKey((key) => key + 1);
  };

  const gotoIndex = (index: number) => {
    const target = pages[index];
    if (target) gotoPage(target.id);
  };

  const nodes = [...current.nodes].filter((n) => !n.hidden).sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
  const breakpoint: "desktop" | "mobile" = device === "mobile" ? "mobile" : "desktop";
  const frames = resolvePageFrames(current, breakpoint);
  const runTransition = (transition: (typeof transitions)[number] | undefined) => {
    if (!transition) return;
    if (transition.guard?.requireAuth) {
      window.alert(transition.guard.label ?? "该操作需要登录");
      return;
    }
    if (transition.mode === "scroll" && transition.target.pageId === current.id) {
      const anchorNodeId = transition.target.params?.anchorNodeId;
      if (!anchorNodeId) {
        artboardRef.current?.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      document.getElementById(`prototype-${current.id}-${anchorNodeId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    gotoPage(transition.target.pageId);
  };

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-[#0f1014]">
      {/* 顶栏 */}
      <div className="flex h-12 shrink-0 items-center gap-3 border-b border-white/10 px-4">
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-white">
          <span className="grid h-6 w-6 place-items-center rounded bg-gradient-to-br from-indigo-500 to-pink-500 text-[10px] font-bold">▶</span>
          原型演示
        </span>
        <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] text-white/70">{current.name} · {current.route.path}</span>
        <div className="mx-auto flex items-center gap-1 rounded-lg bg-white/5 p-0.5">
          {pages.map((page, index) => (
            <button
              key={page.id}
              className={`h-6 rounded-md px-2.5 text-[10px] font-medium transition-colors ${page.id === current.id ? "bg-white text-gray-900" : "text-white/50 hover:bg-white/10 hover:text-white"}`}
              onClick={() => gotoPage(page.id)}
              title={page.name}
            >
              {index + 1}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-0.5 rounded-lg bg-white/5 p-0.5">
          <button className={`grid h-7 w-8 place-items-center rounded-md ${device === "desktop" ? "bg-white text-gray-900" : "text-white/50 hover:text-white"}`} onClick={() => setDevice("desktop")} title="桌面设备"><Monitor size={14} /></button>
          <button className={`grid h-7 w-8 place-items-center rounded-md ${device === "mobile" ? "bg-white text-gray-900" : "text-white/50 hover:text-white"}`} onClick={() => setDevice("mobile")} title="手机设备"><Smartphone size={14} /></button>
        </div>
        <button className="grid h-7 w-7 place-items-center rounded-md text-white/50 hover:bg-white/10 hover:text-white" onClick={onClose} title="退出演示 (Esc)"><X size={16} /></button>
      </div>

      {/* 舞台 */}
      <div ref={stageRef} className="relative grid min-h-0 flex-1 place-items-center overflow-hidden">
        <button className="absolute left-4 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white/70 backdrop-blur transition hover:bg-white/20 hover:text-white disabled:opacity-20" disabled={currentIndex <= 0} onClick={() => gotoIndex(currentIndex - 1)}><ChevronLeft size={18} /></button>
        <button className="absolute right-4 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white/70 backdrop-blur transition hover:bg-white/20 hover:text-white disabled:opacity-20" disabled={currentIndex >= pages.length - 1} onClick={() => gotoIndex(currentIndex + 1)}><ChevronRight size={18} /></button>

        <div
          ref={artboardRef}
          key={animKey}
          className={`relative overflow-x-hidden overflow-y-auto bg-white ${device === "mobile" ? "rounded-[32px] border-[6px] border-gray-800 ring-1 ring-white/10" : "rounded-lg"} shadow-[0_32px_96px_rgba(0,0,0,0.55)]`}
          style={{
            width: artboardWidth,
            height: viewportHeight,
            transform: `scale(${scale})`,
            animation: "prototype-enter 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          <div className="relative" style={{ width: artboardWidth, height: current.layout.height }}>
          {nodes.map((node) => {
            const frame = frames.get(node.id) ?? resolveNodeFrame(node, breakpoint);
            const transition = transitions.find((t) => t.source.pageId === current.id && t.source.nodeId === node.id && (t.source.event ?? "onClick") === "onClick");
            const interactive = Boolean(transition);
            const def = findComponentDef(registry, node.type);
            return (
              <div
                key={node.id}
                id={`prototype-${current.id}-${node.id}`}
                className={`absolute ${interactive ? "cursor-pointer" : ""}`}
                style={{
                  left: frame.x,
                  top: frame.y,
                  width: frame.width,
                  height: frame.height,
                  zIndex: node.zIndex ?? 0,
                  outline: hoverNav === node.id && interactive ? "2px solid rgba(99,102,241,0.9)" : undefined,
                  outlineOffset: 2,
                  transition: "outline-color 0.15s",
                }}
                onMouseEnter={() => interactive && setHoverNav(node.id)}
                onMouseLeave={() => setHoverNav(null)}
                onClick={() => runTransition(transition)}
              >
                {renderComponent({ def, props: node.props ?? {}, interactive: true, onTrigger: interactive ? () => runTransition(transition) : undefined })}
              </div>
            );
          })}
          </div>
        </div>
        <style>{`@keyframes prototype-enter { from { opacity: 0; transform: scale(${scale * 0.97}) translateY(12px); } to { opacity: 1; transform: scale(${scale}) translateY(0); } }`}</style>
      </div>

      {/* 底部提示 */}
      <div className="flex h-9 shrink-0 items-center justify-center gap-4 text-[10px] text-white/30">
        <span>点击交互元素跳转页面或滚动到区域</span>
        <span>← → 切换页面</span>
        <span>Esc 退出</span>
      </div>
    </div>
  );
}
