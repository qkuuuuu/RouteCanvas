"use client";

import * as React from "react";
import { Bot, CheckCircle2, KeyRound, Loader2, Server, X } from "lucide-react";
import { DEFAULT_AI_SETTINGS, getAiSettings, saveAiSettings, type AiSettings } from "@/lib/aiSettings";

export function AiAgentDialog({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved?: (settings: AiSettings) => void }) {
  const [settings, setSettings] = React.useState<AiSettings>(DEFAULT_AI_SETTINGS);
  const [testing, setTesting] = React.useState(false);
  const [testState, setTestState] = React.useState<"idle" | "ok" | "error">("idle");
  const [message, setMessage] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setSettings(getAiSettings());
      setTestState("idle");
      setMessage("");
    }
  }, [open]);

  if (!open) return null;

  const update = (patch: Partial<AiSettings>) => setSettings((current) => ({ ...current, ...patch }));
  const persist = () => {
    saveAiSettings(settings);
    onSaved?.(settings);
  };
  const testConnection = async () => {
    setTesting(true);
    setTestState("idle");
    setMessage("");
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: "Reply with OK only.", ...settings }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "连接失败");
      persist();
      setTestState("ok");
      setMessage("连接成功");
    } catch (error) {
      setTestState("error");
      setMessage((error as Error).message);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/30 p-4 backdrop-blur-[2px]" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="w-full max-w-md overflow-hidden rounded-lg border border-gray-200 bg-white shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
        <div className="flex h-14 items-center gap-3 border-b border-gray-100 px-4">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-gray-950 text-white"><Bot size={16} /></span>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-gray-900">连接 AI Agent</div>
            <div className="text-[10px] text-gray-400">OpenAI / OpenAI-compatible API</div>
          </div>
          <button className="grid h-8 w-8 place-items-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-700" onClick={onClose} title="关闭"><X size={16} /></button>
        </div>

        <div className="space-y-4 p-4">
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-gray-600"><Server size={12} /> API Base URL</span>
            <input className="h-9 w-full rounded-md border border-gray-200 bg-gray-50 px-3 font-mono text-xs text-gray-700 outline-none focus:border-indigo-400 focus:bg-white" value={settings.baseUrl} onChange={(event) => update({ baseUrl: event.target.value })} placeholder="https://api.openai.com/v1" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-medium text-gray-600">Model</span>
            <input className="h-9 w-full rounded-md border border-gray-200 bg-gray-50 px-3 font-mono text-xs text-gray-700 outline-none focus:border-indigo-400 focus:bg-white" value={settings.model} onChange={(event) => update({ model: event.target.value })} placeholder="gpt-4o-mini" />
          </label>
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-gray-600"><KeyRound size={12} /> API Key</span>
            <input type="password" className="h-9 w-full rounded-md border border-gray-200 bg-gray-50 px-3 font-mono text-xs text-gray-700 outline-none focus:border-indigo-400 focus:bg-white" value={settings.apiKey} onChange={(event) => update({ apiKey: event.target.value })} placeholder="sk-..." autoComplete="off" />
          </label>

          {message && (
            <div className={`flex items-start gap-2 rounded-md px-3 py-2 text-[11px] ${testState === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
              {testState === "ok" && <CheckCircle2 size={13} className="mt-0.5 shrink-0" />}
              <span className="line-clamp-3">{message}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-100 bg-gray-50/70 px-4 py-3">
          <button className="h-8 rounded-md border border-gray-200 bg-white px-3 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50" onClick={testConnection} disabled={testing || !settings.apiKey.trim()}>
            {testing ? <span className="inline-flex items-center gap-1.5"><Loader2 size={13} className="animate-spin" /> 正在测试</span> : "测试连接"}
          </button>
          <button className="h-8 rounded-md bg-gray-950 px-3 text-xs font-medium text-white hover:bg-gray-800" onClick={() => { persist(); onClose(); }}>保存接入</button>
        </div>
      </div>
    </div>
  );
}
