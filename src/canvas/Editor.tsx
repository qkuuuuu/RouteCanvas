"use client";
import * as React from "react";
import { useEffect, useState } from "react";
import { useCanvasStore, useTemporal } from "@/store/canvasStore";
import { Toolbar } from "@/panels/Toolbar";
import { PropertyPanel } from "@/panels/PropertyPanel";
import FlowOverview from "@/canvas/FlowOverview";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ToastContainer } from "@/lib/toast";
import { initCanvasManager, syncPageCount } from "@/lib/canvasManager";
import { useMcpSync } from "@/lib/mcpSync";
import { ChatPanel } from "@/panels/ChatPanel";
import { DesignCanvas } from "@/design/DesignCanvas";
import { DesignSidebar } from "@/design/DesignSidebar";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { WorkspaceSidebar } from "@/panels/WorkspaceSidebar";
import { createProject } from "@/lib/canvasManager";
import { PrototypePlayer } from "@/canvas/PrototypePlayer";
import { AiAgentDialog } from "@/components/AiAgentDialog";
import { AutomationDialog } from "@/components/AutomationDialog";
import { triggerAutomations } from "@/data/automation";
import { AiDiffDialog } from "@/components/AiDiffDialog";

export default function Editor() {
  const { clear } = useTemporal();
  const [hydrated, setHydrated] = useState(false);
  const view = useWorkspaceStore((s) => s.view);
  const setActivePageId = useWorkspaceStore((s) => s.setActivePageId);
  const studioOpen = useWorkspaceStore((s) => s.studioOpen);
  const openStudio = useWorkspaceStore((s) => s.openStudio);
  const [prototypeOpen, setPrototypeOpen] = useState(false);
  const [aiAgentOpen, setAiAgentOpen] = useState(false);
  const [automationOpen, setAutomationOpen] = useState(false);

  // MCP 双向同步（编辑器 ↔ canvas.json）
  const { syncNow, syncState } = useMcpSync(true);

  // persist 异步 rehydrate 后，清掉 rehydration 产生的撤销历史，避免一打开就 undo 到空白
  useEffect(() => {
    clear();
    initCanvasManager();
    // 页面数量变化时自动同步到画布列表
    let prevLen = useCanvasStore.getState().pages.length;
    let knownPageIds = new Set(useCanvasStore.getState().pages.map((page) => page.id));
    const unsub = useCanvasStore.subscribe((s) => {
      if (s.pages.length !== prevLen) {
        prevLen = s.pages.length;
        syncPageCount();
      }
      const newPages = s.pages.filter((page) => !knownPageIds.has(page.id));
      knownPageIds = new Set(s.pages.map((page) => page.id));
      newPages.forEach((page) => { void triggerAutomations("page_created", page.id); });
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

  // 仅恢复已有项目；新用户从 AI 起始页或模板库主动创建内容。
  useEffect(() => {
    if (!hydrated) return;
    const s = useCanvasStore.getState();
    if (s.pages[0]) setActivePageId(s.pages[0].id);
  }, [hydrated, setActivePageId]);

  if (!hydrated) {
    return (
      <div className="h-screen w-screen grid place-items-center bg-[#f4f4f2]">
        <div className="anim-fade-in flex flex-col items-center gap-4">
          <span className="grid h-10 w-10 place-items-center rounded-xl brand-gradient text-sm font-bold text-white shadow-lg">R</span>
          <div className="loader-ring" />
          <span className="text-xs text-gray-400">正在加载画布…</span>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#f4f4f2]">
        <Toolbar
          onMcpSync={syncNow}
          mcpSyncState={syncState}
          onPrototype={() => setPrototypeOpen(true)}
          onOpenAiAgent={() => setAiAgentOpen(true)}
          onOpenAutomation={() => setAutomationOpen(true)}
        />
        <div className="flex flex-1 min-h-0">
          <WorkspaceSidebar />
          <section className={`${studioOpen ? "w-80 shrink-0 border-r" : "min-w-0 flex-1"} border-gray-200 bg-white`}>
            <ChatPanel
              open
              onClose={() => undefined}
              docked
              onStartProject={openStudio}
              onCreateCanvas={() => {
                const id = createProject();
                const page = useCanvasStore.getState().pages.find((item) => item.id === id);
                if (page) useCanvasStore.getState().updatePage(id, { name: "首页", layout: { ...page.layout, width: 960, height: 720 } });
                setActivePageId(id);
                openStudio();
              }}
              onOpenAiAgent={() => setAiAgentOpen(true)}
            />
          </section>
          {studioOpen && <section className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
            {view === "design" && <DesignSidebar />}
            <main className="flex-1 min-w-0 relative">
              {view === "design" ? <DesignCanvas /> : <FlowOverview />}
            </main>
            <PropertyPanel />
          </section>}
        </div>
      </div>
      <PrototypePlayer open={prototypeOpen} onClose={() => setPrototypeOpen(false)} />
      <AiAgentDialog open={aiAgentOpen} onClose={() => setAiAgentOpen(false)} />
      <AutomationDialog open={automationOpen} onClose={() => setAutomationOpen(false)} />
      <AiDiffDialog />
      <ToastContainer />
    </ErrorBoundary>
  );
}
