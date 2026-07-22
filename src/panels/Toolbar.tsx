"use client";
import * as React from "react";
import {
  Undo2,
  Redo2,
  Plus,
  Download,
  Upload,
  Sparkles,
  Play,
  Copy,
  Store,
  Settings,
  Loader2,
  FolderOpen,
  RefreshCw,
  MessageSquare,
  Wand2,
} from "lucide-react";
import { MarketDialog } from "@/components/market/MarketDialog";
import { ImportDialog } from "@/components/import/ImportDialog";
import { CanvasManagerDialog } from "@/components/CanvasManagerDialog";
import { useCanvasStore, useTemporal } from "@/store/canvasStore";
import { exportDocument, importDocument } from "@/data/serializer";
import { wrapAsPrompt } from "@/data/promptTemplate";
import { toast } from "@/lib/toast";

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
  const addPage = useCanvasStore((s) => s.addPage);
  const loadDocument = useCanvasStore((s) => s.loadDocument);
  const canvasName = useCanvasStore((s) => s.meta.canvasName ?? "未命名画布");
  const setCanvasName = useCanvasStore((s) => s.setCanvasName);

  const fileRef = React.useRef<HTMLInputElement>(null);
  const [aiOpen, setAiOpen] = React.useState(false);
  const [aiText, setAiText] = React.useState("");
  const [marketOpen, setMarketOpen] = React.useState(false);
  const [importOpen, setImportOpen] = React.useState(false);
  const [canvasMgrOpen, setCanvasMgrOpen] = React.useState(false);
  const [apiKey, setApiKey] = React.useState("");
  const [showAiSettings, setShowAiSettings] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);
  const [aiResult, setAiResult] = React.useState("");
  const [aiError, setAiError] = React.useState("");

  // 加载已保存的 API Key
  React.useEffect(() => {
    const saved = localStorage.getItem("routecanvas-openai-key");
    if (saved) setApiKey(saved);
  }, []);

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem("routecanvas-openai-key", key);
  };

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

  return (
    <header className="h-12 shrink-0 border-b border-gray-200 bg-white flex items-center gap-1 px-3">
      <input
        value={canvasName}
        onChange={(e) => setCanvasName(e.target.value)}
        className="font-semibold text-sm text-gray-800 bg-transparent outline-none w-40 focus:bg-gray-50 rounded px-1"
      />
      <button
        className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50"
        onClick={() => setCanvasMgrOpen(true)}
        title="画布管理"
      >
        <FolderOpen size={14} />
      </button>
      <CanvasManagerDialog open={canvasMgrOpen} onClose={() => setCanvasMgrOpen(false)} />
      <div className="w-px h-5 bg-gray-200 mx-1" />
      <button className={btn} onClick={undo} disabled={!canUndo} title="撤销 Ctrl+Z">
        <Undo2 size={14} />
      </button>
      <button className={btn} onClick={redo} disabled={!canRedo} title="重做 Ctrl+Shift+Z">
        <Redo2 size={14} />
      </button>
      <div className="w-px h-5 bg-gray-200 mx-1" />
      <button className={btn} onClick={() => addPage()} title="新建页面">
        <Plus size={14} /> 页面
      </button>
      <button
        className="inline-flex items-center gap-1 px-2 py-1.5 rounded text-xs text-purple-600 hover:bg-purple-50"
        onClick={() => setMarketOpen(true)}
        title="组件市场"
      >
        <Store size={14} /> 组件市场
      </button>
      <button
        className="inline-flex items-center gap-1 px-2 py-1.5 rounded text-xs text-blue-600 hover:bg-blue-50"
        onClick={() => setImportOpen(true)}
        title="智能导入：粘贴 HTML/TSX/Vue/Svelte 代码，自动拆解为可编辑节点"
      >
        <Wand2 size={14} /> 智能导入
      </button>

      <div className="flex-1" />

      <button className={btn} onClick={() => window.open("/preview", "_blank")} title="在线预览">
        <Play size={14} /> 预览
      </button>
      {onMcpSync && (
        <button
          className={`${btn} ${mcpSyncState === "external" ? "text-green-600" : ""}`}
          onClick={onMcpSync}
          title="从 canvas.json 同步（MCP 修改后自动同步，也可手动点击）"
        >
          <RefreshCw size={14} className={mcpSyncState === "synced" ? "animate-spin" : ""} /> MCP
        </button>
      )}
      <button className={btn} onClick={onCopy} title="复制 JSON">
        <Copy size={14} /> 复制
      </button>
      <button className={btn} onClick={onExport} title="下载 .json">
        <Download size={14} /> 导出
      </button>
      <button className={btn} onClick={() => fileRef.current?.click()} title="导入 JSON">
        <Upload size={14} /> 导入
      </button>
      <button
        className="inline-flex items-center gap-1 px-2 py-1.5 rounded text-xs text-purple-600 hover:bg-purple-50"
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

      {aiOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col">
            {/* 头部 */}
            <div className="px-4 py-2 border-b flex items-center justify-between">
              <span className="text-sm font-semibold">AI Prompt</span>
              <div className="flex items-center gap-2">
                <button
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${showAiSettings ? "bg-purple-50 text-purple-600" : "text-gray-500 hover:bg-gray-100"}`}
                  onClick={() => setShowAiSettings((v) => !v)}
                  title="API Key 设置"
                >
                  <Settings size={14} /> 设置
                </button>
                <button
                  className="text-gray-400 hover:text-gray-700"
                  onClick={() => {
                    setAiOpen(false);
                    setShowAiSettings(false);
                    setAiResult("");
                    setAiError("");
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* 设置面板 */}
            {showAiSettings && (
              <div className="px-4 py-3 border-b bg-gray-50">
                <label className="text-[11px] text-gray-500 mb-1 block">OpenAI API Key（存浏览器 localStorage，不会上传到服务器）</label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    className="flex-1 h-8 rounded border border-gray-300 px-2 text-xs font-mono"
                    placeholder="sk-..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                  <button
                    className="px-3 py-1.5 rounded text-xs bg-blue-600 text-white hover:bg-blue-700"
                    onClick={() => {
                      saveApiKey(apiKey);
                      toast.success("API Key 已保存");
                    }}
                  >
                    保存
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  Key 仅存于本机浏览器，调用 AI 时随请求发送给后端代理。也可由部署方设置 OPENAI_API_KEY 环境变量，无需用户输入。
                </p>
              </div>
            )}

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
                        const resp = await fetch("/api/ai", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            prompt: aiText,
                            apiKey: apiKey || undefined,
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
