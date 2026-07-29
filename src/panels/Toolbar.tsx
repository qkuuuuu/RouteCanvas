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
  Loader2,
  FolderOpen,
  RefreshCw,
  MessageSquare,
  Wand2,
  GitBranch,
  PenTool,
  MoreHorizontal,
  Bot,
} from "lucide-react";
import { MarketDialog } from "@/components/market/MarketDialog";
import { ImportDialog } from "@/components/import/ImportDialog";
import { CanvasManagerDialog } from "@/components/CanvasManagerDialog";
import { useCanvasStore, useTemporal } from "@/store/canvasStore";
import { exportDocument, importDocument } from "@/data/serializer";
import { wrapAsPrompt } from "@/data/promptTemplate";
import { toast } from "@/lib/toast";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { AiAgentDialog } from "@/components/AiAgentDialog";
import { getAiSettings } from "@/lib/aiSettings";

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
}: {
  onMcpSync?: () => void;
  mcpSyncState?: "idle" | "synced" | "external";
  chatOpen?: boolean;
  onToggleChat?: () => void;
}) {
  const { undo, redo, canUndo, canRedo } = useTemporal();
  const loadDocument = useCanvasStore((s) => s.loadDocument);
  const canvasName = useCanvasStore((s) => s.meta.canvasName ?? "未命名项目");
  const setCanvasName = useCanvasStore((s) => s.setCanvasName);
  const view = useWorkspaceStore((s) => s.view);
  const setView = useWorkspaceStore((s) => s.setView);
  const studioOpen = useWorkspaceStore((s) => s.studioOpen);

  const fileRef = React.useRef<HTMLInputElement>(null);
  const [aiOpen, setAiOpen] = React.useState(false);
  const [aiText, setAiText] = React.useState("");
  const [marketOpen, setMarketOpen] = React.useState(false);
  const [importOpen, setImportOpen] = React.useState(false);
  const [canvasMgrOpen, setCanvasMgrOpen] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);
  const [aiResult, setAiResult] = React.useState("");
  const [aiError, setAiError] = React.useState("");
  const [moreOpen, setMoreOpen] = React.useState(false);
  const [agentOpen, setAgentOpen] = React.useState(false);

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

  const onAiGenerate = () => {
    const text = wrapAsPrompt(useCanvasStore.getState());
    setAiText(text);
    setAiOpen(true);
  };

  const btn =
    "inline-flex items-center gap-1 px-2 py-1.5 rounded text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed";

  if (!studioOpen) {
    return (
      <header className="flex h-12 shrink-0 items-center border-b border-gray-200 bg-[#fbfbfa] px-4">
        <span className="text-sm font-semibold text-gray-900">RouteCanvas</span>
        <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-[9px] font-medium text-gray-500">AI DESIGN</span>
        <div className="flex-1" />
        <span className="text-[11px] text-gray-400">对话生成，画布接管</span>
      </header>
    );
  }

  return (
    <header className="relative h-12 shrink-0 border-b border-gray-200 bg-[#fbfbfa] flex items-center gap-1 px-3">
      <input
        value={canvasName}
        onChange={(e) => setCanvasName(e.target.value)}
        placeholder="项目名称"
        aria-label="项目名称"
        className="font-semibold text-sm text-gray-800 bg-transparent outline-none w-40 focus:bg-gray-50 rounded px-1"
      />
      <button
        className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50"
        onClick={() => setCanvasMgrOpen(true)}
        title="项目管理"
      >
        <FolderOpen size={14} />
      </button>
      <CanvasManagerDialog open={canvasMgrOpen} onClose={() => setCanvasMgrOpen(false)} />
      <div className="w-px h-5 bg-gray-200 mx-1" />
      <div className="flex items-center rounded-md border border-gray-200 bg-gray-50 p-0.5">
        <button
          className={`inline-flex h-7 items-center gap-1 rounded px-2 text-xs ${view === "design" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
          onClick={() => setView("design")}
          title="设计视图：画板、图层、变量和响应式布局"
        >
          <PenTool size={13} /> 页面设计
        </button>
        <button
          className={`inline-flex h-7 items-center gap-1 rounded px-2 text-xs ${view === "flow" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
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
      <button className="inline-flex h-8 items-center gap-1.5 rounded-md bg-gray-950 px-2.5 text-xs font-medium text-white hover:bg-gray-800" onClick={() => setAgentOpen(true)} title="连接全局 AI Agent">
        <Bot size={14} /> AI Agent
      </button>
      <button className={btn} onClick={() => setMoreOpen((value) => !value)} title="更多项目操作"><MoreHorizontal size={15} /></button>
      {moreOpen && (
        <div className="absolute right-3 top-10 z-50 w-44 rounded-md border border-gray-200 bg-white p-1 shadow-xl">
          <button className="flex h-8 w-full items-center gap-2 rounded px-2 text-xs text-gray-600 hover:bg-gray-50" onClick={() => { setImportOpen(true); setMoreOpen(false); }}><Wand2 size={14} /> 智能导入</button>
          <button className="flex h-8 w-full items-center gap-2 rounded px-2 text-xs text-gray-600 hover:bg-gray-50" onClick={() => { setMarketOpen(true); setMoreOpen(false); }}><Store size={14} /> 组件市场</button>
          {onMcpSync && <button className="flex h-8 w-full items-center gap-2 rounded px-2 text-xs text-gray-600 hover:bg-gray-50" onClick={() => { onMcpSync(); setMoreOpen(false); }}><RefreshCw size={14} /> 同步 MCP</button>}
          <button className="flex h-8 w-full items-center gap-2 rounded px-2 text-xs text-gray-600 hover:bg-gray-50" onClick={() => { onCopy(); setMoreOpen(false); }}><Copy size={14} /> 复制 JSON</button>
          <button className="flex h-8 w-full items-center gap-2 rounded px-2 text-xs text-gray-600 hover:bg-gray-50" onClick={() => { onExport(); setMoreOpen(false); }}><Download size={14} /> 导出文件</button>
          <button className="flex h-8 w-full items-center gap-2 rounded px-2 text-xs text-gray-600 hover:bg-gray-50" onClick={() => { fileRef.current?.click(); setMoreOpen(false); }}><Upload size={14} /> 导入文件</button>
          <button className="flex h-8 w-full items-center gap-2 rounded px-2 text-xs text-gray-600 hover:bg-gray-50" onClick={() => { onAiGenerate(); setMoreOpen(false); }}><Sparkles size={14} /> AI Prompt</button>
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
      <button
        className="hidden"
        onClick={onAiGenerate}
        title="包装为 AI Prompt"
      >
        <Sparkles size={14} /> AI Prompt
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
      <AiAgentDialog open={agentOpen} onClose={() => setAgentOpen(false)} />

      {aiOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col">
            {/* 头部 */}
            <div className="px-4 py-2 border-b flex items-center justify-between">
              <span className="text-sm font-semibold">AI Prompt</span>
              <div className="flex items-center gap-2">
                <button
                  className="text-gray-400 hover:text-gray-700"
                  onClick={() => {
                    setAiOpen(false);
                    setAiResult("");
                    setAiError("");
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* 结果区域（如有） */}
            {aiResult ? (
              <div className="flex-1 min-h-0 overflow-auto p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-600">AI 生成结果</span>
                  <button
                    className="text-xs text-blue-600 hover:text-blue-700"
                    onClick={() => { setAiResult(""); setAiError(""); }}
                  >
                    ← 返回 Prompt
                  </button>
                </div>
                {aiError && (
                  <div className="text-xs text-red-600 bg-red-50 rounded p-2 mb-2">
                    {aiError}
                  </div>
                )}
                <pre className="text-xs font-mono whitespace-pre-wrap bg-gray-50 rounded p-3">
                  {aiResult}
                </pre>
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    className={btn}
                    onClick={async () => {
                      await navigator.clipboard.writeText(aiResult);
                      toast.success("已复制到剪贴板");
                    }}
                  >
                    <Copy size={14} /> 复制结果
                  </button>
                </div>
              </div>
            ) : (
              <>
                <textarea
                  className="flex-1 m-3 rounded border border-gray-200 p-3 text-xs font-mono"
                  value={aiText}
                  onChange={(e) => setAiText(e.target.value)}
                />
                {aiError && (
                  <div className="mx-3 mb-2 text-xs text-red-600 bg-red-50 rounded p-2">
                    {aiError}
                  </div>
                )}
                <div className="px-3 pb-3 flex justify-end gap-2">
                  <button
                    className={btn}
                    onClick={async () => {
                      await navigator.clipboard.writeText(aiText);
                      toast.success("已复制到剪贴板");
                    }}
                  >
                    <Copy size={14} /> 复制 Prompt
                  </button>
                  <button
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={generating || !aiText}
                    onClick={async () => {
                      setGenerating(true);
                      setAiError("");
                      try {
                        const aiSettings = getAiSettings();
                        const resp = await fetch("/api/ai", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            prompt: aiText,
                            ...aiSettings,
                            apiKey: aiSettings.apiKey || undefined,
                          }),
                        });
                        const data = await resp.json();
                        if (!resp.ok) {
                          setAiError(data.error || `请求失败 (${resp.status})`);
                        } else if (data.content) {
                          setAiResult(data.content);
                        } else {
                          setAiError("AI 返回为空");
                        }
                      } catch (e) {
                        setAiError(`网络错误：${(e as Error).message}`);
                      } finally {
                        setGenerating(false);
                      }
                    }}
                  >
                    {generating ? (
                      <><Loader2 size={14} className="animate-spin" /> 生成中...</>
                    ) : (
                      <><Sparkles size={14} /> AI 生成</>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
