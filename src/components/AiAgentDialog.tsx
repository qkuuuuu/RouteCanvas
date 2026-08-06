"use client";

import * as React from "react";
import { Bot, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { getAiSettings, saveAiSettings, type AiSettings } from "@/lib/aiSettings";
import { toast } from "@/lib/toast";

export function AiAgentDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [draft, setDraft] = React.useState<AiSettings>(() => getAiSettings());
  const [testing, setTesting] = React.useState(false);
  const [testState, setTestState] = React.useState<"idle" | "ok" | "error">("idle");

  React.useEffect(() => {
    if (open) {
      setDraft(getAiSettings());
      setTestState("idle");
    }
  }, [open]);

  if (!open) return null;

  const update = (patch: Partial<AiSettings>) => setDraft((current) => ({ ...current, ...patch }));
  const save = () => {
    saveAiSettings(draft);
    toast.success("AI Agent 配置已保存");
    onClose();
  };
  const test = async () => {
    if (!draft.apiKey.trim()) {
      toast.warning("请先填写 API Key");
      return;
    }
    setTesting(true);
    setTestState("idle");
    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draft,
          apiKey: draft.apiKey.trim(),
          messages: [{ role: "user", content: "只返回 JSON：{\"ok\":true}" }],
        }),
      });
      if (!response.ok) throw new Error((await response.json()).error ?? `请求失败 (${response.status})`);
      setTestState("ok");
      toast.success("AI Agent 连接成功");
    } catch (error) {
      setTestState("error");
      toast.error(`连接失败：${(error as Error).message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/35 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="ai-agent-title">
        <header className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-white"><Bot size={16} /></span>
            <div><h2 id="ai-agent-title" className="text-sm font-semibold text-gray-900">AI Agent</h2><p className="text-[11px] text-gray-400">全局设计生成与修改引擎</p></div>
          </div>
          <button className="grid h-7 w-7 place-items-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-700" onClick={onClose} aria-label="关闭">×</button>
        </header>
        <div className="space-y-3 p-4">
          <label className="block text-[11px] font-medium text-gray-600">API Key<input type="password" value={draft.apiKey} onChange={(event) => update({ apiKey: event.target.value })} placeholder="sk-..." className="mt-1 h-9 w-full rounded-md border border-gray-200 px-2.5 text-xs outline-none focus:border-indigo-500" autoComplete="off" /></label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-[11px] font-medium text-gray-600">模型<input value={draft.model} onChange={(event) => update({ model: event.target.value })} placeholder="gpt-4o-mini" className="mt-1 h-9 w-full rounded-md border border-gray-200 px-2.5 text-xs outline-none focus:border-indigo-500" /></label>
            <label className="block text-[11px] font-medium text-gray-600">Base URL<input value={draft.baseUrl} onChange={(event) => update({ baseUrl: event.target.value })} placeholder="https://api.openai.com/v1" className="mt-1 h-9 w-full rounded-md border border-gray-200 px-2.5 text-xs outline-none focus:border-indigo-500" /></label>
          </div>
          <div className="flex items-center justify-between rounded-md bg-gray-50 px-2.5 py-2 text-[10px] text-gray-500">
            <span>配置仅保存在当前浏览器</span>
            {testState === "ok" && <span className="inline-flex items-center gap-1 text-emerald-600"><CheckCircle2 size={12} /> 已连接</span>}
            {testState === "error" && <span className="inline-flex items-center gap-1 text-red-600"><XCircle size={12} /> 连接失败</span>}
          </div>
        </div>
        <footer className="flex justify-end gap-2 border-t border-gray-100 px-4 py-3">
          <button className="h-8 rounded-md border border-gray-200 px-3 text-xs text-gray-600 hover:bg-gray-50" onClick={test} disabled={testing || !draft.apiKey.trim()}>{testing ? <Loader2 size={13} className="animate-spin" /> : "测试连接"}</button>
          <button className="h-8 rounded-md bg-indigo-600 px-3 text-xs font-medium text-white hover:bg-indigo-700" onClick={save}>保存配置</button>
        </footer>
      </section>
    </div>
  );
}
