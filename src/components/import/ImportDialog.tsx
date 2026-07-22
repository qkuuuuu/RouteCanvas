"use client";
/**
 * 智能导入对话框：粘贴/上传前端代码 → iframe 精确解析 → 导入为可编辑画布节点
 * 支持 HTML/CSS、React TSX、Vue SFC、Svelte
 */
import * as React from "react";
import { FileCode2, Upload, Loader2, CheckCircle2, X, Wand2 } from "lucide-react";
import { useCanvasStore } from "@/store/canvasStore";
import { renderAndParse, type RenderParseResult } from "@/lib/parser/iframeRenderer";
import { detectFormat, type CodeFormat } from "@/lib/parser/normalize";
import { toast } from "@/lib/toast";

const FORMAT_LABELS: Record<CodeFormat, string> = {
  html: "HTML/CSS",
  tsx: "React TSX",
  vue: "Vue SFC",
  svelte: "Svelte",
};

export function ImportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [code, setCode] = React.useState("");
  const [parsing, setParsing] = React.useState(false);
  const [result, setResult] = React.useState<RenderParseResult | null>(null);
  const [error, setError] = React.useState("");
  const [targetPageId, setTargetPageId] = React.useState("");
  const fileRef = React.useRef<HTMLInputElement>(null);

  const pages = useCanvasStore((s) => s.pages);
  const addParsedNodes = useCanvasStore((s) => s.addParsedNodes);
  const addPage = useCanvasStore((s) => s.addPage);

  // 默认选中当前选中的页面或第一个页面
  React.useEffect(() => {
    if (open && !targetPageId && pages.length > 0) {
      const sel = useCanvasStore.getState().selection;
      if (sel.type === "page" && sel.id) setTargetPageId(sel.id);
      else if (sel.type === "node" && sel.pageId) setTargetPageId(sel.pageId);
      else setTargetPageId(pages[0].id);
    }
  }, [open, pages, targetPageId]);

  if (!open) return null;

  const detectedFormat = code.trim() ? detectFormat(code) : null;

  const onParse = async () => {
    if (!code.trim()) return;
    setParsing(true);
    setError("");
    setResult(null);
    try {
      const res = await renderAndParse(code);
      if (res.nodes.length === 0) {
        setError("未能从代码中解析出任何可见元素，请检查代码内容");
      } else {
        setResult(res);
      }
    } catch (e) {
      setError(`解析失败：${(e as Error).message}`);
    } finally {
      setParsing(false);
    }
  };

  const onImport = () => {
    if (!result || result.nodes.length === 0) return;
    let pageId = targetPageId;
    // 如果没有目标页面，自动创建
    if (!pageId || !pages.some((p) => p.id === pageId)) {
      pageId = addPage({ name: "导入页面", path: "/imported" });
    }
    const count = addParsedNodes(pageId, result.nodes);
    toast.success(`已导入 ${count} 个可编辑节点`);
    onClose();
    // 重置
    setCode("");
    setResult(null);
    setError("");
  };

  const onFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setCode(String(reader.result));
      setResult(null);
      setError("");
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* 头部 */}
        <div className="px-4 py-3 border-b flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Wand2 size={16} className="text-blue-600" />
            <span className="text-sm font-semibold text-gray-800">智能导入</span>
            <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
              HTML / TSX / Vue / Svelte → 可编辑节点
            </span>
          </div>
          <button className="text-gray-400 hover:text-gray-700" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* 左栏：代码输入 */}
          <div className="w-1/2 border-r flex flex-col">
            <div className="px-3 py-2 border-b flex items-center gap-2">
              <button
                className="inline-flex items-center gap-1 text-xs text-gray-600 px-2 py-1 rounded border border-gray-200 hover:bg-gray-50"
                onClick={() => fileRef.current?.click()}
              >
                <Upload size={12} /> 上传文件
              </button>
              {detectedFormat && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium">
                  <FileCode2 size={10} className="inline mr-0.5" />
                  检测到：{FORMAT_LABELS[detectedFormat]}
                </span>
              )}
              <input
                ref={fileRef}
                type="file"
                accept=".html,.htm,.tsx,.jsx,.vue,.svelte,.css,.txt"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onFile(f);
                  e.target.value = "";
                }}
              />
            </div>
            <textarea
              className="flex-1 m-2 rounded-lg border border-gray-200 p-3 text-xs font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder={"粘贴前端代码…\n\n支持：\n• HTML + CSS（完整页面或片段）\n• React TSX 组件\n• Vue 单文件组件 (.vue)\n• Svelte 组件"}
              value={code}
              onChange={(e) => { setCode(e.target.value); setResult(null); setError(""); }}
              spellCheck={false}
            />
            <div className="px-3 pb-3">
              <button
                className="w-full h-9 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                onClick={onParse}
                disabled={parsing || !code.trim()}
              >
                {parsing ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                {parsing ? "解析中…" : "解析为节点"}
              </button>
            </div>
          </div>

          {/* 右栏：解析结果 */}
          <div className="w-1/2 flex flex-col">
            {error && (
              <div className="m-3 text-xs text-red-600 bg-red-50 rounded-lg p-3">{error}</div>
            )}
            {!result && !error && (
              <div className="flex-1 flex items-center justify-center text-xs text-gray-400">
                <div className="text-center space-y-2">
                  <FileCode2 size={32} className="mx-auto text-gray-300" />
                  <p>粘贴代码并点击「解析为节点」</p>
                  <p className="text-[10px]">解析结果将在此预览</p>
                </div>
              </div>
            )}
            {result && (
              <>
                {/* 统计 */}
                <div className="px-3 py-2 border-b flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle2 size={13} /> 解析完成
                  </span>
                  <span className="text-[11px] text-gray-500">
                    共 {result.stats.total} 个节点 · {result.stats.editable} 可编辑 · {result.stats.fallback} 兜底
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                    {FORMAT_LABELS[result.format]}
                  </span>
                </div>
                {/* 节点列表预览 */}
                <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                  {result.nodes.map((n, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-md border border-gray-100 bg-gray-50 px-2.5 py-1.5"
                    >
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                        n.type === "css" ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-700"
                      }`}>
                        {n.type}
                      </span>
                      <span className="text-[11px] text-gray-600 truncate">
                        {(n.props.text as string) ?? (n.props.custom?.variant as string) ?? `${Math.round(n.size.width)}×${Math.round(n.size.height)}`}
                      </span>
                      <span className="ml-auto text-[10px] text-gray-400 shrink-0">
                        {Math.round(n.position.x)},{Math.round(n.position.y)}
                      </span>
                    </div>
                  ))}
                </div>
                {/* 导入操作 */}
                <div className="px-3 py-3 border-t space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] text-gray-500 shrink-0">目标页面</label>
                    <select
                      className="flex-1 h-8 rounded border border-gray-300 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                      value={targetPageId}
                      onChange={(e) => setTargetPageId(e.target.value)}
                    >
                      {pages.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                      <option value="">+ 新建页面</option>
                    </select>
                  </div>
                  <button
                    className="w-full h-9 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 flex items-center justify-center gap-1.5"
                    onClick={onImport}
                  >
                    <CheckCircle2 size={14} />
                    导入 {result.nodes.length} 个节点到画布
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
