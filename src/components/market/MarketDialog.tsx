"use client";
import * as React from "react";
import { X, Package, Code2, FileCode, Eye, Link2, Loader2 } from "lucide-react";
import type { ComponentDef, ComponentSource } from "@/types/schema";
import { useCanvasStore } from "@/store/canvasStore";
import { renderComponent } from "@/components/renderer";
import { findComponentDef } from "@/components/registry";

type TabType = "tsx" | "css" | "url";

const SAMPLE_TSX = `export default function MyButton({ text, interactive, onTrigger }) {
  return (
    <button
      onClick={interactive ? onTrigger : undefined}
      className="w-full h-full rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium text-sm hover:opacity-90 transition-opacity"
    >
      {text || "Click Me"}
    </button>
  );
}`;

const SAMPLE_CSS_HTML = `<button class="uv-btn">Click Me</button>`;
const SAMPLE_CSS_CSS = `.uv-btn {
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 8px;
  background: #6366f1;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
}
.uv-btn:hover { background: #4f46e5; }`;

export function MarketDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [tab, setTab] = React.useState<TabType>("tsx");
  const [id, setId] = React.useState("");
  const [label, setLabel] = React.useState("");
  const [category, setCategory] = React.useState("自定义");
  const [tsxSource, setTsxSource] = React.useState(SAMPLE_TSX);
  const [cssHtml, setCssHtml] = React.useState(SAMPLE_CSS_HTML);
  const [cssCss, setCssCss] = React.useState(SAMPLE_CSS_CSS);
  const [error, setError] = React.useState<string | null>(null);
  const [previewKey, setPreviewKey] = React.useState(0);
  const [importUrl, setImportUrl] = React.useState("");
  const [importing, setImporting] = React.useState(false);

  const registerComponent = useCanvasStore((s) => s.registerComponent);

  if (!open) return null;

  const source: ComponentSource = tab === "tsx" ? "runtime" : "css";

  // URL 导入
  const onImportUrl = async () => {
    if (!importUrl.trim()) { setError("请输入 URL"); return; }
    setImporting(true);
    setError(null);
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: importUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "导入失败"); return; }
      if (data.type === "runtime") {
        setTab("tsx");
        setTsxSource(data.tsxSource);
      } else {
        setTab("css");
        setCssHtml(data.html || "");
        setCssCss(data.css || "");
      }
      setPreviewKey((k) => k + 1);
    } catch {
      setError("网络请求失败");
    } finally {
      setImporting(false);
    }
  };

  // 构建预览用的 ComponentDef
  const previewDef: ComponentDef =
    tab === "tsx"
      ? {
          source: "runtime",
          id: id || "preview-runtime",
          label: label || "预览",
          category,
          propsSchema: [{ key: "text", label: "文本", type: "string", bucket: "base" }],
          tsxSource,
        }
      : {
          source: "css",
          id: id || "preview-css",
          label: label || "预览",
          category,
          propsSchema: [],
          html: cssHtml,
          css: cssCss,
        };

  const onRegister = () => {
    const finalId = id.trim() || `custom-${Date.now().toString(36)}`;
    const def: ComponentDef =
      tab === "tsx"
        ? {
            source: "runtime",
            id: finalId,
            label: label.trim() || "自定义组件",
            category: category.trim() || "自定义",
            propsSchema: [
              { key: "text", label: "文本", type: "string", bucket: "base" },
            ],
            tsxSource,
          }
        : {
            source: "css",
            id: finalId,
            label: label.trim() || "自定义CSS组件",
            category: category.trim() || "自定义",
            propsSchema: [],
            html: cssHtml,
            css: cssCss,
          };

    // 检查 id 冲突（builtin/pack 不允许覆盖）
    const store = useCanvasStore.getState();
    const existing = findComponentDef(store.componentRegistry, finalId);
    if (existing && (existing.source === "builtin" || existing.source === "pack")) {
      setError(`ID "${finalId}" 与内置/预打包组件冲突，请换一个 ID`);
      return;
    }

    registerComponent(def);
    setError(null);
    setId("");
    setLabel("");
    setTsxSource(SAMPLE_TSX);
    setCssHtml(SAMPLE_CSS_HTML);
    setCssCss(SAMPLE_CSS_CSS);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col">
        {/* 头部 */}
        <div className="px-4 py-2.5 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package size={16} className="text-blue-600" />
            <span className="text-sm font-semibold">组件市场</span>
          </div>
          <button
            className="text-gray-400 hover:text-gray-700"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab 切换 */}
        <div className="flex border-b">
          <button
            className={`px-4 py-2 text-xs font-medium flex items-center gap-1.5 border-b-2 ${
              tab === "tsx" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500"
            }`}
            onClick={() => setTab("tsx")}
          >
            <Code2 size={14} /> TSX 组件（运行时沙箱）
          </button>
          <button
            className={`px-4 py-2 text-xs font-medium flex items-center gap-1.5 border-b-2 ${
              tab === "css" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500"
            }`}
            onClick={() => setTab("css")}
          >
            <FileCode size={14} /> CSS 片段（uiverse 风格）
          </button>
          <button
            className={`px-4 py-2 text-xs font-medium flex items-center gap-1.5 border-b-2 ${
              tab === "url" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500"
            }`}
            onClick={() => setTab("url")}
          >
            <Link2 size={14} /> URL 导入
          </button>
        </div>

        {/* 主体 */}
        {tab === "url" ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
            <div className="w-full max-w-md">
              <label className="text-xs text-gray-500 mb-1 block">输入组件 URL（支持 GitHub raw 链接、.tsx/.jsx 文件、HTML 页面）</label>
              <div className="flex gap-2">
                <input
                  className="flex-1 h-9 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://raw.githubusercontent.com/..."
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onImportUrl()}
                />
                <button
                  className="px-4 h-9 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 flex items-center gap-1.5 disabled:opacity-50"
                  onClick={onImportUrl}
                  disabled={importing}
                >
                  {importing ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
                  导入
                </button>
              </div>
              {error && <div className="mt-2 text-xs text-red-600">{error}</div>}
              <p className="mt-3 text-[11px] text-gray-400">导入后自动填充到对应 Tab（TSX 或 CSS），可继续编辑后注册。</p>
            </div>
          </div>
        ) : (
        <div className="flex flex-1 min-h-0">
          {/* 左：源码编辑 */}
          <div className="w-1/2 border-r flex flex-col">
            <div className="px-3 py-2 space-y-2 border-b">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-gray-500">组件 ID</label>
                  <input
                    className="w-full h-8 rounded border border-gray-300 px-2 text-xs font-mono"
                    placeholder="my-button"
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500">显示名</label>
                  <input
                    className="w-full h-8 rounded border border-gray-300 px-2 text-xs"
                    placeholder="我的按钮"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500">分类</label>
                  <input
                    className="w-full h-8 rounded border border-gray-300 px-2 text-xs"
                    placeholder="自定义"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {tab === "tsx" ? (
              <textarea
                className="flex-1 m-2 rounded border border-gray-200 p-2 text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={tsxSource}
                onChange={(e) => setTsxSource(e.target.value)}
                placeholder="粘贴 tsx 源码，default export 为 React 组件。支持 import react / framer-motion / clsx 等（经 esm.sh 加载）。"
                spellCheck={false}
              />
            ) : (
              <div className="flex-1 flex flex-col m-2 gap-2">
                <div className="flex-1 flex flex-col">
                  <label className="text-[10px] text-gray-500 mb-0.5">HTML</label>
                  <textarea
                    className="flex-1 rounded border border-gray-200 p-2 text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={cssHtml}
                    onChange={(e) => setCssHtml(e.target.value)}
                    spellCheck={false}
                  />
                </div>
                <div className="flex-1 flex flex-col">
                  <label className="text-[10px] text-gray-500 mb-0.5">CSS</label>
                  <textarea
                    className="flex-1 rounded border border-gray-200 p-2 text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={cssCss}
                    onChange={(e) => setCssCss(e.target.value)}
                    spellCheck={false}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 右：预览 */}
          <div className="w-1/2 flex flex-col">
            <div className="px-3 py-2 border-b flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wide text-gray-400 flex items-center gap-1">
                <Eye size={12} /> 实时预览
              </span>
              <button
                className="text-[10px] text-blue-600 hover:text-blue-700"
                onClick={() => setPreviewKey((k) => k + 1)}
              >
                刷新
              </button>
            </div>
            <div className="flex-1 p-4 bg-gray-50 overflow-auto grid place-items-center">
              <div
                key={previewKey}
                className="bg-white rounded-md border border-gray-200 shadow-sm"
                style={{ width: 200, height: 60 }}
              >
                {renderComponent({
                  def: previewDef,
                  props: { text: label || (tab === "tsx" ? "Click Me" : "") },
                  interactive: false,
                })}
              </div>
            </div>
            {error && (
              <div className="px-3 py-2 text-[11px] text-red-600 bg-red-50 border-t">
                {error}
              </div>
            )}
          </div>
        </div>
        )}

        {/* 底部 */}
        <div className="px-4 py-2.5 border-t flex items-center justify-between">
          <div className="text-[11px] text-gray-400">
            {tab === "tsx"
              ? "运行时组件经 babel 转译 + esm.sh 动态加载，请勿使用 next/link 等构建期特性"
              : "CSS 片段自动 scoped，选择器会加上唯一前缀避免全局污染"}
          </div>
          <div className="flex gap-2">
            <button
              className="px-3 py-1.5 rounded text-xs text-gray-600 hover:bg-gray-100"
              onClick={onClose}
            >
              取消
            </button>
            <button
              className="px-3 py-1.5 rounded text-xs bg-blue-600 text-white hover:bg-blue-700"
              onClick={onRegister}
            >
              注册到组件库
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
