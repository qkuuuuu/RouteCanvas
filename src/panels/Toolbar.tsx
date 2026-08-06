"use client";
import * as React from "react";
import {
  Undo2,
  Redo2,
  Download,
  Upload,
  Sparkles,
  Play,
  Copy,
  Store,
  FolderOpen,
  RefreshCw,
  MessageSquare,
  Wand2,
  GitBranch,
  PenTool,
  MoreHorizontal,
  Clapperboard,
  ImageIcon,
  Code2,
  FileCode2,
  FileDown,
  Share2,
  Presentation,
  Workflow,
} from "lucide-react";
import { MarketDialog } from "@/components/market/MarketDialog";
import { ImportDialog } from "@/components/import/ImportDialog";
import { CanvasManagerDialog } from "@/components/CanvasManagerDialog";
import { useCanvasStore, useTemporal } from "@/store/canvasStore";
import { exportDocument, importDocument } from "@/data/serializer";
import { toast } from "@/lib/toast";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { exportPageAsPng } from "@/lib/exportImage";
import { exportProjectAsPdf } from "@/lib/exportPdf";
import { exportHtmlDocument, exportReactCode, downloadText } from "@/lib/codeExport";
import { createShareLink } from "@/data/shareClient";

function download(filename: string, content: string) {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function Toolbar({
  onMcpSync,
  mcpSyncState,
  chatOpen,
  onToggleChat,
  onPrototype,
  onOpenAiAgent,
  onOpenAutomation,
}: {
  onMcpSync?: () => void;
  mcpSyncState?: "idle" | "synced" | "external";
  chatOpen?: boolean;
  onToggleChat?: () => void;
  onPrototype?: () => void;
  onOpenAiAgent?: () => void;
  onOpenAutomation?: () => void;
}) {
  const { undo, redo, canUndo, canRedo } = useTemporal();
  const loadDocument = useCanvasStore((s) => s.loadDocument);
  const canvasName = useCanvasStore((s) => s.meta.canvasName ?? "未命名项目");
  const setCanvasName = useCanvasStore((s) => s.setCanvasName);
  const view = useWorkspaceStore((s) => s.view);
  const setView = useWorkspaceStore((s) => s.setView);
  const studioOpen = useWorkspaceStore((s) => s.studioOpen);
  const activePageId = useWorkspaceStore((s) => s.activePageId);

  const fileRef = React.useRef<HTMLInputElement>(null);
  const [marketOpen, setMarketOpen] = React.useState(false);
  const [importOpen, setImportOpen] = React.useState(false);
  const [canvasMgrOpen, setCanvasMgrOpen] = React.useState(false);
  const [moreOpen, setMoreOpen] = React.useState(false);
  const [exportingPptx, setExportingPptx] = React.useState(false);
  const [sharing, setSharing] = React.useState(false);

  // 键盘快捷键 Ctrl/Cmd+Z / Shift+Z
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key === "z" || e.key === "Z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
      if (e.key === "y" || e.key === "Y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  const onExport = () => {
    const doc = exportDocument(useCanvasStore.getState());
    download(
      `${(canvasName || "routecanvas").replace(/\s+/g, "-")}.json`,
      JSON.stringify(doc, null, 2),
    );
  };

  const onCopy = async () => {
    const doc = exportDocument(useCanvasStore.getState());
    await navigator.clipboard.writeText(JSON.stringify(doc, null, 2));
    toast.success("JSON 已复制到剪贴板");
  };

  const onImportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = importDocument(String(reader.result));
      if (!res.ok || !res.state) {
        toast.error("导入失败：" + res.errors.join("，"));
        return;
      }
      loadDocument(res.state);
      toast.success("导入成功");
    };
    reader.readAsText(file);
  };

  const onExportPng = async () => {
    const s = useCanvasStore.getState();
    const page = s.pages.find((p) => p.id === activePageId) ?? s.pages[0];
    if (!page) {
      toast.error("没有可导出的页面");
      return;
    }
    try {
      await exportPageAsPng(page);
      toast.success(`已导出「${page.name}」PNG`);
    } catch (e) {
      toast.error(`导出失败：${(e as Error).message}`);
    }
  };

  const onExportHtml = () => {
    downloadText(`${(canvasName || "routecanvas").replace(/\s+/g, "-")}.html`, exportHtmlDocument(useCanvasStore.getState()), "text/html");
    toast.success("已导出 HTML（含页面跳转交互）");
  };

  const onExportReact = () => {
    downloadText(`${(canvasName || "routecanvas").replace(/\s+/g, "-")}.tsx`, exportReactCode(useCanvasStore.getState()), "text/plain");
    toast.success("已导出 React 组件源码");
  };

  const onExportPdf = async () => {
    const s = useCanvasStore.getState();
    if (!s.pages.length) {
      toast.error("没有可导出的页面");
      return;
    }
    try {
      await exportProjectAsPdf(s.pages, canvasName);
      toast.success(`已导出 ${s.pages.length} 页 PDF`);
    } catch (e) {
      toast.error(`导出失败：${(e as Error).message}`);
    }
  };

  const onShareDemo = () => {
    const s = useCanvasStore.getState();
    if (!s.pages.length) {
      toast.error("没有可分享的页面");
      return;
    }
    downloadText(`${(canvasName || "routecanvas").replace(/\s+/g, "-")}-demo.html`, exportHtmlDocument(s), "text/html");
    toast.success("已导出独立演示 HTML：单文件即完整原型，发给任何人浏览器打开即可看");
  };

  const onExportPptx = async () => {
    const s = useCanvasStore.getState();
    if (!s.pages.length) {
      toast.error("没有可导出的页面");
      return;
    }
    setExportingPptx(true);
    try {
      const { exportProjectAsPptx } = await import("@/lib/exportPptx");
      await exportProjectAsPptx(s.pages, canvasName);
      toast.success(`已导出 ${s.pages.length} 页 PPTX`);
    } catch (error) {
      toast.error(`PPTX 导出失败：${(error as Error).message}`);
    } finally {
      setExportingPptx(false);
    }
  };

  const onCreateShare = async () => {
    const s = useCanvasStore.getState();
    if (!s.pages.length) {
      toast.error("没有可分享的页面");
      return;
    }
    setSharing(true);
    try {
      const url = await createShareLink(s);
      await navigator.clipboard.writeText(url);
      toast.success("只读分享链接已创建并复制");
    } catch (error) {
      toast.error(`创建分享失败：${(error as Error).message}`);
    } finally {
      setSharing(false);
    }
  };

  const btn =
    "inline-flex items-center gap-1 px-2 py-1.5 rounded text-xs text-gray-600 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed";

  if (!studioOpen) {
    return (
      <header className="flex h-12 shrink-0 items-center border-b border-gray-200 bg-[#fbfbfa] px-4">
        <span className="grid h-6 w-6 place-items-center rounded-md brand-gradient text-[11px] font-bold text-white shadow-sm">R</span>
        <span className="ml-2 text-sm font-semibold text-gray-900">RouteCanvas</span>
        <span className="ml-2 rounded-full bg-indigo-50 px-2 py-0.5 text-[9px] font-semibold tracking-wide text-indigo-500">AI DESIGN</span>
        <div className="flex-1" />
        <span className="mr-3 hidden text-[11px] text-gray-400 sm:inline">对话生成，画布接管</span>
        {onOpenAiAgent && (
          <button
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-indigo-200 bg-white px-3 text-xs font-medium text-indigo-700 shadow-sm transition-colors hover:border-indigo-300 hover:bg-indigo-50"
            onClick={onOpenAiAgent}
            title="开始设计前配置全局 AI Agent"
          >
            <Sparkles size={14} /> AI Agent
          </button>
        )}
      </header>
    );
  }

  return (
    <header className="relative h-12 shrink-0 border-b border-gray-200 bg-[#fbfbfa] flex items-center gap-1 px-3">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md brand-gradient text-[11px] font-bold text-white shadow-sm" title="RouteCanvas">R</span>
      <input
        value={canvasName}
        onChange={(e) => setCanvasName(e.target.value)}
        placeholder="项目名称"
        aria-label="项目名称"
        className="ml-2 font-semibold text-sm text-gray-800 bg-transparent outline-none w-40 focus:bg-gray-50 rounded px-1 transition-colors"
      />
      <button
        className="p-1 rounded text-gray-400 transition-colors hover:text-indigo-600 hover:bg-indigo-50"
        onClick={() => setCanvasMgrOpen(true)}
        title="项目管理"
      >
        <FolderOpen size={14} />
      </button>
      <CanvasManagerDialog open={canvasMgrOpen} onClose={() => setCanvasMgrOpen(false)} />
      <div className="w-px h-5 bg-gray-200 mx-1" />
      <div className="flex items-center rounded-md border border-gray-200 bg-gray-50 p-0.5">
        <button
          className={`inline-flex h-7 items-center gap-1 rounded px-2 text-xs transition-all duration-150 ${view === "design" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
          onClick={() => setView("design")}
          title="设计视图：画板、图层、变量和响应式布局"
        >
          <PenTool size={13} /> 页面设计
        </button>
        <button
          className={`inline-flex h-7 items-center gap-1 rounded px-2 text-xs transition-all duration-150 ${view === "flow" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
          onClick={() => setView("flow")}
          title="流程视图：页面关系与交互跳转"
        >
          <GitBranch size={13} /> 交互流程
        </button>
      </div>
      <div className="w-px h-5 bg-gray-200 mx-1" />
      <button className={btn} onClick={undo} disabled={!canUndo} title="撤销 Ctrl+Z">
        <Undo2 size={14} />
      </button>
      <button className={btn} onClick={redo} disabled={!canRedo} title="重做 Ctrl+Shift+Z">
        <Redo2 size={14} />
      </button>
      <button
        className="hidden"
        onClick={() => setMarketOpen(true)}
        title="组件市场"
      >
        <Store size={14} /> 组件市场
      </button>
      <div className="flex-1" />

      <button className={btn} onClick={() => window.open("/preview", "_blank")} title="在线预览">
        <Play size={14} /> 预览
      </button>
      {onOpenAiAgent && (
        <button className="inline-flex items-center gap-1.5 rounded-md border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100" onClick={onOpenAiAgent} title="配置全局 AI Agent">
          <Sparkles size={14} /> AI Agent
        </button>
      )}
      {onPrototype && (
        <button className="inline-flex items-center gap-1.5 rounded-md btn-brand px-3 py-1.5 text-xs font-medium text-white" onClick={onPrototype} title="原型演示：沿连线真实跳转">
          <Clapperboard size={14} /> 演示
        </button>
      )}
      <button className={btn} onClick={() => setMoreOpen((value) => !value)} title="更多项目操作"><MoreHorizontal size={15} /></button>
      {moreOpen && (
        <div className="anim-scale-in absolute right-3 top-10 z-50 w-44 rounded-lg border border-gray-200 bg-white p-1 shadow-xl">
          <button className="flex h-8 w-full items-center gap-2 rounded px-2 text-xs text-gray-600 hover:bg-gray-50" onClick={() => { setImportOpen(true); setMoreOpen(false); }}><Wand2 size={14} /> 智能导入</button>
          <button className="flex h-8 w-full items-center gap-2 rounded px-2 text-xs text-gray-600 hover:bg-gray-50" onClick={() => { setMarketOpen(true); setMoreOpen(false); }}><Store size={14} /> 组件市场</button>
          {onOpenAutomation && <button className="flex h-8 w-full items-center gap-2 rounded px-2 text-xs text-gray-600 hover:bg-gray-50" onClick={() => { onOpenAutomation(); setMoreOpen(false); }}><Workflow size={14} /> 自动化编排</button>}
          {onMcpSync && <button className="flex h-8 w-full items-center gap-2 rounded px-2 text-xs text-gray-600 hover:bg-gray-50" onClick={() => { onMcpSync(); setMoreOpen(false); }}><RefreshCw size={14} /> 同步 MCP</button>}
          <button className="flex h-8 w-full items-center gap-2 rounded px-2 text-xs text-gray-600 hover:bg-gray-50" onClick={() => { onCopy(); setMoreOpen(false); }}><Copy size={14} /> 复制 JSON</button>
          <button className="flex h-8 w-full items-center gap-2 rounded px-2 text-xs text-gray-600 hover:bg-gray-50" onClick={() => { onExport(); setMoreOpen(false); }}><Download size={14} /> 导出文件</button>
          <button className="flex h-8 w-full items-center gap-2 rounded px-2 text-xs text-gray-600 hover:bg-gray-50" onClick={() => { void onExportPng(); setMoreOpen(false); }}><ImageIcon size={14} /> 导出 PNG</button>
          <button className="flex h-8 w-full items-center gap-2 rounded px-2 text-xs text-gray-600 hover:bg-gray-50" onClick={() => { void onExportPdf(); setMoreOpen(false); }}><FileDown size={14} /> 导出 PDF</button>
          <button disabled={exportingPptx} className="flex h-8 w-full items-center gap-2 rounded px-2 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40" onClick={() => { void onExportPptx(); setMoreOpen(false); }}><Presentation size={14} /> {exportingPptx ? "正在生成 PPTX" : "导出 PPTX"}</button>
          <button disabled={sharing} className="flex h-8 w-full items-center gap-2 rounded px-2 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40" onClick={() => { void onCreateShare(); setMoreOpen(false); }}><Share2 size={14} /> {sharing ? "正在创建链接" : "创建分享链接"}</button>
          <button className="flex h-8 w-full items-center gap-2 rounded px-2 text-xs text-gray-600 hover:bg-gray-50" onClick={() => { onShareDemo(); setMoreOpen(false); }}><Share2 size={14} /> 分享演示（HTML）</button>
          <button className="flex h-8 w-full items-center gap-2 rounded px-2 text-xs text-gray-600 hover:bg-gray-50" onClick={() => { onExportHtml(); setMoreOpen(false); }}><Code2 size={14} /> 导出 HTML</button>
          <button className="flex h-8 w-full items-center gap-2 rounded px-2 text-xs text-gray-600 hover:bg-gray-50" onClick={() => { onExportReact(); setMoreOpen(false); }}><FileCode2 size={14} /> 导出 React</button>
          <button className="flex h-8 w-full items-center gap-2 rounded px-2 text-xs text-gray-600 hover:bg-gray-50" onClick={() => { fileRef.current?.click(); setMoreOpen(false); }}><Upload size={14} /> 导入文件</button>
        </div>
      )}
      {onMcpSync && (
        <button
          className="hidden"
          onClick={onMcpSync}
          title="从 canvas.json 同步（MCP 修改后自动同步，也可手动点击）"
        >
          <RefreshCw size={14} className={mcpSyncState === "synced" ? "animate-spin" : ""} /> MCP
        </button>
      )}
      <button className="hidden" onClick={onCopy} title="复制 JSON">
        <Copy size={14} /> 复制
      </button>
      <button className="hidden" onClick={onExport} title="下载 .json">
        <Download size={14} /> 导出
      </button>
      <button className="hidden" onClick={() => fileRef.current?.click()} title="导入 JSON">
        <Upload size={14} /> 导入
      </button>
      {onToggleChat && (
        <button
          className={`inline-flex items-center gap-1 px-2 py-1.5 rounded text-xs ${chatOpen ? "bg-purple-600 text-white" : "text-purple-600 hover:bg-purple-50"}`}
          onClick={onToggleChat}
          title="AI 设计助手（对话式修改画布）"
        >
          <MessageSquare size={14} /> AI 助手
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onImportFile(f);
          e.target.value = "";
        }}
      />

      <MarketDialog open={marketOpen} onClose={() => setMarketOpen(false)} />
      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} />

    </header>
  );
}
