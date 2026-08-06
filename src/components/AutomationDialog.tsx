"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, CheckCircle2, CircleAlert, Clock3, Play, Plus, RotateCcw, Trash2, Workflow, X } from "lucide-react";
import { AUTOMATION_ACTION_LABELS, runAutomation, useAutomationStore, type AutomationActionType, type AutomationTrigger } from "@/data/automation";
import { useCanvasStore } from "@/store/canvasStore";

const triggerLabels: Record<AutomationTrigger, string> = { manual: "手动运行", page_created: "新页面创建后", ai_complete: "AI 修改采纳后" };

export function AutomationDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const workflows = useAutomationStore((state) => state.workflows);
  const runs = useAutomationStore((state) => state.runs);
  const store = useAutomationStore();
  const pages = useCanvasStore((state) => state.pages);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [tab, setTab] = React.useState<"build" | "logs">("build");

  React.useEffect(() => {
    if (open && !selectedId && workflows[0]) setSelectedId(workflows[0].id);
  }, [open, selectedId, workflows]);
  if (!open) return null;
  const selected = workflows.find((item) => item.id === selectedId) ?? workflows[0];

  const addWorkflow = () => {
    const id = store.addWorkflow();
    setSelectedId(id);
    setTab("build");
  };

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-gray-950/35 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="flex h-[min(720px,88vh)] w-[min(980px,94vw)] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-2xl">
        <aside className="flex w-56 shrink-0 flex-col border-r border-gray-200 bg-[#fafafa]">
          <div className="flex h-12 items-center gap-2 border-b border-gray-200 px-3 text-sm font-semibold text-gray-800"><Workflow size={16} className="text-indigo-600" /> 自动化</div>
          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
            {workflows.map((workflow) => (
              <button key={workflow.id} className={`w-full rounded px-2.5 py-2 text-left ${workflow.id === selected?.id ? "bg-white text-gray-900 shadow-sm ring-1 ring-gray-200" : "text-gray-600 hover:bg-white"}`} onClick={() => { setSelectedId(workflow.id); setTab("build"); }}>
                <div className="truncate text-xs font-medium">{workflow.name}</div>
                <div className="mt-0.5 text-[10px] text-gray-400">{triggerLabels[workflow.trigger]} · {workflow.actions.length} 个动作</div>
              </button>
            ))}
            {!workflows.length && <div className="px-2 py-8 text-center text-[11px] leading-5 text-gray-400">还没有自动化<br />创建后按顺序编排动作</div>}
          </div>
          <button className="m-2 flex h-8 items-center justify-center gap-1 rounded border border-gray-200 bg-white text-xs font-medium text-indigo-600 hover:border-indigo-300" onClick={addWorkflow}><Plus size={13} /> 新建自动化</button>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-12 items-center border-b border-gray-200 px-4">
            <div className="flex rounded bg-gray-100 p-0.5">
              <button className={`h-7 rounded px-3 text-xs ${tab === "build" ? "bg-white font-medium text-gray-900 shadow-sm" : "text-gray-500"}`} onClick={() => setTab("build")}>编排</button>
              <button className={`h-7 rounded px-3 text-xs ${tab === "logs" ? "bg-white font-medium text-gray-900 shadow-sm" : "text-gray-500"}`} onClick={() => setTab("logs")}>运行日志</button>
            </div>
            <div className="flex-1" />
            <button className="grid h-8 w-8 place-items-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-700" title="关闭" onClick={onClose}><X size={16} /></button>
          </header>

          {tab === "build" && selected ? (
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <input value={selected.name} onChange={(event) => store.updateWorkflow(selected.id, { name: event.target.value })} className="w-full border-0 bg-transparent text-lg font-semibold text-gray-900 outline-none" aria-label="自动化名称" />
                  <div className="mt-1 text-xs text-gray-400">动作会自上而下执行，失败后停止并保留完整日志。</div>
                </div>
                <label className="flex items-center gap-2 text-xs text-gray-600"><input type="checkbox" checked={selected.enabled} onChange={(event) => store.updateWorkflow(selected.id, { enabled: event.target.checked })} className="accent-indigo-600" /> 已启用</label>
                <button className="grid h-8 w-8 place-items-center rounded text-gray-400 hover:bg-red-50 hover:text-red-600" title="删除自动化" onClick={() => { store.removeWorkflow(selected.id); setSelectedId(null); }}><Trash2 size={14} /></button>
              </div>

              <div className="mt-5 flex items-center gap-3 rounded border border-indigo-100 bg-indigo-50/60 p-3">
                <div className="grid h-8 w-8 place-items-center rounded bg-indigo-600 text-white"><Workflow size={14} /></div>
                <div><div className="text-[10px] font-semibold uppercase text-indigo-400">触发器</div><div className="text-xs font-medium text-indigo-900">什么时候开始</div></div>
                <select value={selected.trigger} onChange={(event) => store.updateWorkflow(selected.id, { trigger: event.target.value as AutomationTrigger })} className="ml-auto h-8 rounded border border-indigo-200 bg-white px-2 text-xs text-indigo-800 outline-none">
                  {Object.entries(triggerLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>

              <div className="relative mt-4 space-y-2 pl-5 before:absolute before:bottom-5 before:left-[35px] before:top-0 before:w-px before:bg-gray-200">
                {selected.actions.map((action, index) => (
                  <div key={action.id} className="relative flex items-center gap-2 rounded border border-gray-200 bg-white p-3 shadow-sm">
                    <span className="relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-gray-200 bg-white text-[10px] font-semibold text-gray-500">{index + 1}</span>
                    <select value={action.type} onChange={(event) => store.updateAction(selected.id, action.id, { type: event.target.value as AutomationActionType })} className="h-8 w-40 rounded border border-gray-200 bg-gray-50 px-2 text-xs font-medium text-gray-700 outline-none">
                      {Object.entries(AUTOMATION_ACTION_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                    {(action.type === "focus_page" || action.type === "snapshot_page") && <select value={action.pageId ?? ""} onChange={(event) => store.updateAction(selected.id, action.id, { pageId: event.target.value || undefined })} className="h-8 min-w-0 flex-1 rounded border border-gray-200 px-2 text-xs text-gray-600 outline-none"><option value="">使用触发页面 / 当前页面</option>{pages.map((page) => <option key={page.id} value={page.id}>{page.name}</option>)}</select>}
                    {action.type === "run_ai" && <input value={action.prompt ?? ""} onChange={(event) => store.updateAction(selected.id, action.id, { prompt: event.target.value })} placeholder="例如：检查当前页面并优化信息层级" className="h-8 min-w-0 flex-1 rounded border border-gray-200 px-2 text-xs outline-none focus:border-indigo-300" />}
                    {!(["focus_page", "snapshot_page", "run_ai"] as string[]).includes(action.type) && <span className="min-w-0 flex-1 text-[11px] text-gray-400">{AUTOMATION_ACTION_LABELS[action.type]}</span>}
                    <button disabled={index === 0} title="上移" className="grid h-7 w-7 place-items-center rounded text-gray-400 hover:bg-gray-100 disabled:opacity-20" onClick={() => store.moveAction(selected.id, action.id, -1)}><ArrowUp size={13} /></button>
                    <button disabled={index === selected.actions.length - 1} title="下移" className="grid h-7 w-7 place-items-center rounded text-gray-400 hover:bg-gray-100 disabled:opacity-20" onClick={() => store.moveAction(selected.id, action.id, 1)}><ArrowDown size={13} /></button>
                    <button title="删除动作" className="grid h-7 w-7 place-items-center rounded text-gray-400 hover:bg-red-50 hover:text-red-600" onClick={() => store.removeAction(selected.id, action.id)}><Trash2 size={13} /></button>
                  </div>
                ))}
              </div>
              <button className="mt-3 ml-5 flex h-8 items-center gap-1 rounded border border-dashed border-gray-300 px-3 text-xs text-gray-500 hover:border-indigo-300 hover:text-indigo-600" onClick={() => store.addAction(selected.id)}><Plus size={13} /> 添加动作</button>
              <div className="mt-6 flex justify-end"><button disabled={!selected.actions.length} className="inline-flex h-9 items-center gap-1.5 rounded bg-indigo-600 px-4 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-40" onClick={() => void runAutomation(selected.id)}><Play size={14} /> 立即运行</button></div>
            </div>
          ) : tab === "build" ? (
            <div className="grid flex-1 place-items-center text-center"><div><Workflow size={28} className="mx-auto text-gray-300" /><div className="mt-3 text-sm font-medium text-gray-700">编排重复工作</div><div className="mt-1 text-xs text-gray-400">从一个触发器和一组动作开始</div><button className="mt-4 rounded bg-indigo-600 px-3 py-2 text-xs font-medium text-white" onClick={addWorkflow}>新建自动化</button></div></div>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {!runs.length && <div className="py-20 text-center text-xs text-gray-400">运行后会在这里看到每一步结果和失败原因</div>}
              <div className="space-y-2">{runs.map((run) => (
                <details key={run.id} className="rounded border border-gray-200 bg-white p-3" open={run.status === "failed"}>
                  <summary className="flex cursor-pointer list-none items-center gap-2 text-xs">
                    {run.status === "success" ? <CheckCircle2 size={14} className="text-emerald-500" /> : run.status === "failed" ? <CircleAlert size={14} className="text-red-500" /> : <Clock3 size={14} className="animate-pulse text-indigo-500" />}
                    <span className="font-medium text-gray-800">{run.workflowName}</span><span className="text-gray-400">第 {run.attempt} 次</span><span className="ml-auto text-[10px] text-gray-400">{new Date(run.startedAt).toLocaleString()}</span>
                    {run.status === "failed" && <button className="ml-2 inline-flex h-7 items-center gap-1 rounded bg-red-50 px-2 text-[10px] text-red-600 hover:bg-red-100" onClick={(event) => { event.preventDefault(); void runAutomation(run.workflowId, { attempt: run.attempt + 1 }); }}><RotateCcw size={11} /> 重试</button>}
                  </summary>
                  <div className="mt-2 space-y-1 border-t border-gray-100 pt-2">{run.logs.map((log, index) => <div key={index} className="font-mono text-[10px] leading-4 text-gray-500">{log}</div>)}</div>
                </details>
              ))}</div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
