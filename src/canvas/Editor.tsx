"use client";
import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { useCanvasStore, useTemporal } from "@/store/canvasStore";
import { Toolbar } from "@/panels/Toolbar";
import { ComponentLibrary } from "@/panels/ComponentLibrary";
import { PropertyPanel } from "@/panels/PropertyPanel";
import ReactFlowCanvas from "@/canvas/ReactFlowCanvas";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ToastContainer } from "@/lib/toast";
import { initCanvasManager, syncPageCount } from "@/lib/canvasManager";
import { useMcpSync } from "@/lib/mcpSync";
import { ChatPanel } from "@/panels/ChatPanel";
import { AiAnnotateOverlay } from "@/canvas/AiAnnotateOverlay";
import { useAnnotateStore } from "@/store/annotateStore";

export default function Editor() {
  const addPage = useCanvasStore((s) => s.addPage);
  const { clear } = useTemporal();
  const seeded = useRef(false);
  const [hydrated, setHydrated] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const annotateTarget = useAnnotateStore((s) => s.target);
  const closeAnnotate = useAnnotateStore((s) => s.close);

  // MCP 双向同步（编辑器 ↔ canvas.json）
  const { syncNow, syncState } = useMcpSync(true);

  // persist 异步 rehydrate 后，清掉 rehydration 产生的撤销历史，避免一打开就 undo 到空白
  useEffect(() => {
    clear();
    initCanvasManager();
    // 页面数量变化时自动同步到画布列表
    let prevLen = useCanvasStore.getState().pages.length;
    const unsub = useCanvasStore.subscribe((s) => {
      if (s.pages.length !== prevLen) {
        prevLen = s.pages.length;
        syncPageCount();
      }
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 检测 store 是否已完成 rehydrate
  useEffect(() => {
    const unsub = useCanvasStore.subscribe(() => {
      setHydrated(true);
      unsub();
    });
    // 如果已经有数据说明已 hydrate
    if (useCanvasStore.getState().pages.length > 0) setHydrated(true);
    // 超时兜底
    const t = setTimeout(() => setHydrated(true), 1000);
    return () => { unsub(); clearTimeout(t); };
  }, []);

  // 首次无数据时 seed 一个示范首页，避免空画布
  useEffect(() => {
    if (seeded.current || !hydrated) return;
    seeded.current = true;
    const s = useCanvasStore.getState();
    if (s.pages.length === 0) {
      const homeId = addPage({ name: "首页", path: "/home", isIndex: true, x: 80, y: 80 });
      const searchId = addPage({ name: "搜索结果页", path: "/search", x: 1040, y: 80 });
      useCanvasStore.getState().addNode(homeId, "Button", {
        position: { x: 40, y: 40 },
        size: { width: 120, height: 40 },
        props: { text: "搜索", custom: { variant: "primary" } },
      });
      const btnId = useCanvasStore.getState().pages
        .find((p) => p.id === homeId)
        ?.nodes[0]?.id;
      if (btnId) {
        useCanvasStore.getState().addTransition(
          { pageId: homeId, nodeId: btnId, event: "onClick" },
          { pageId: searchId, params: { keyword: "${searchValue}" } },
        );
      }
      clear();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  if (!hydrated) {
    return (
      <div className="h-screen w-screen grid place-items-center bg-gray-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500">加载画布...</span>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-100">
        <Toolbar
          onMcpSync={syncNow}
          mcpSyncState={syncState}
          chatOpen={chatOpen}
          onToggleChat={() => setChatOpen((v) => !v)}
        />
        <div className="flex flex-1 min-h-0">
          <ComponentLibrary />
          <main className="flex-1 min-w-0 relative">
            <ReactFlowCanvas />
          </main>
          <PropertyPanel />
        </div>
      </div>
      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
      {annotateTarget && (
        <AiAnnotateOverlay target={annotateTarget} onClose={closeAnnotate} />
      )}
      <ToastContainer />
    </ErrorBoundary>
  );
}
