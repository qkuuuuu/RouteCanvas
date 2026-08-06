"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { exportDocument, validateDocument } from "@/data/serializer";
import { dispatchCommentToAi, dispatchFocusActivePage } from "@/lib/events";
import { snapshotPage } from "@/lib/pageVersions";
import { toast } from "@/lib/toast";
import { useCanvasStore } from "@/store/canvasStore";
import { useWorkspaceStore } from "@/store/workspaceStore";

export type AutomationTrigger = "manual" | "page_created" | "ai_complete";
export type AutomationActionType = "focus_page" | "validate_flow" | "snapshot_page" | "run_ai" | "open_preview" | "export_json";

export interface AutomationAction {
  id: string;
  type: AutomationActionType;
  pageId?: string;
  prompt?: string;
}

export interface AutomationWorkflow {
  id: string;
  name: string;
  enabled: boolean;
  trigger: AutomationTrigger;
  actions: AutomationAction[];
}

export interface AutomationRun {
  id: string;
  workflowId: string;
  workflowName: string;
  status: "running" | "success" | "failed";
  attempt: number;
  startedAt: number;
  finishedAt?: number;
  logs: string[];
  error?: string;
}

const makeId = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

interface AutomationStore {
  workflows: AutomationWorkflow[];
  runs: AutomationRun[];
  addWorkflow: () => string;
  updateWorkflow: (id: string, patch: Partial<AutomationWorkflow>) => void;
  removeWorkflow: (id: string) => void;
  addAction: (workflowId: string, type?: AutomationActionType) => void;
  updateAction: (workflowId: string, actionId: string, patch: Partial<AutomationAction>) => void;
  removeAction: (workflowId: string, actionId: string) => void;
  moveAction: (workflowId: string, actionId: string, direction: -1 | 1) => void;
  pushRun: (run: AutomationRun) => void;
  patchRun: (id: string, patch: Partial<AutomationRun>) => void;
}

export const useAutomationStore = create<AutomationStore>()(persist((set, get) => ({
  workflows: [],
  runs: [],
  addWorkflow: () => {
    const id = makeId("flow");
    set((state) => ({ workflows: [...state.workflows, { id, name: `自动化 ${state.workflows.length + 1}`, enabled: true, trigger: "manual", actions: [{ id: makeId("action"), type: "validate_flow" }] }] }));
    return id;
  },
  updateWorkflow: (id, patch) => set((state) => ({ workflows: state.workflows.map((item) => item.id === id ? { ...item, ...patch } : item) })),
  removeWorkflow: (id) => set((state) => ({ workflows: state.workflows.filter((item) => item.id !== id) })),
  addAction: (workflowId, type = "focus_page") => set((state) => ({ workflows: state.workflows.map((item) => item.id === workflowId ? { ...item, actions: [...item.actions, { id: makeId("action"), type }] } : item) })),
  updateAction: (workflowId, actionId, patch) => set((state) => ({ workflows: state.workflows.map((item) => item.id === workflowId ? { ...item, actions: item.actions.map((action) => action.id === actionId ? { ...action, ...patch } : action) } : item) })),
  removeAction: (workflowId, actionId) => set((state) => ({ workflows: state.workflows.map((item) => item.id === workflowId ? { ...item, actions: item.actions.filter((action) => action.id !== actionId) } : item) })),
  moveAction: (workflowId, actionId, direction) => set((state) => ({ workflows: state.workflows.map((item) => {
    if (item.id !== workflowId) return item;
    const index = item.actions.findIndex((action) => action.id === actionId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= item.actions.length) return item;
    const actions = [...item.actions];
    [actions[index], actions[target]] = [actions[target], actions[index]];
    return { ...item, actions };
  }) })),
  pushRun: (run) => set((state) => ({ runs: [run, ...state.runs].slice(0, 40) })),
  patchRun: (id, patch) => set((state) => ({ runs: state.runs.map((run) => run.id === id ? { ...run, ...patch } : run) })),
}), {
  name: "routecanvas-automations",
  storage: createJSONStorage(() => localStorage),
  partialize: (state) => ({ workflows: state.workflows, runs: state.runs }),
}));

const actionLabels: Record<AutomationActionType, string> = {
  focus_page: "定位页面",
  validate_flow: "检查交互流程",
  snapshot_page: "保存页面版本",
  run_ai: "交给 AI 执行",
  open_preview: "打开预览",
  export_json: "导出项目 JSON",
};

export const AUTOMATION_ACTION_LABELS = actionLabels;

async function executeAction(action: AutomationAction, contextPageId?: string): Promise<string> {
  const canvas = useCanvasStore.getState();
  const pageId = action.pageId || contextPageId || useWorkspaceStore.getState().activePageId || canvas.pages[0]?.id;
  switch (action.type) {
    case "focus_page":
      if (!pageId || !canvas.pages.some((page) => page.id === pageId)) throw new Error("找不到要定位的页面");
      useWorkspaceStore.getState().setActivePageId(pageId);
      useWorkspaceStore.getState().openStudio();
      dispatchFocusActivePage();
      return `已定位「${canvas.pages.find((page) => page.id === pageId)?.name}」`;
    case "validate_flow": {
      const errors = validateDocument(canvas);
      if (errors.length) throw new Error(errors.slice(0, 3).join("；"));
      return `流程检查通过：${canvas.pages.length} 个页面，${canvas.transitions.length} 条交互`;
    }
    case "snapshot_page":
      if (!pageId) throw new Error("没有可保存版本的页面");
      snapshotPage(pageId, "自动化快照");
      return "已保存页面版本";
    case "run_ai":
      if (!action.prompt?.trim()) throw new Error("AI 动作缺少指令");
      dispatchCommentToAi(action.prompt.trim());
      return "AI 指令已进入设计会话，等待用户审核提案";
    case "open_preview":
      window.open("/preview", "_blank", "noopener,noreferrer");
      return "已打开预览";
    case "export_json": {
      const blob = new Blob([JSON.stringify(exportDocument(canvas), null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${canvas.meta.canvasName?.replace(/\s+/g, "-") || "routecanvas"}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      return "项目 JSON 已导出";
    }
  }
}

export async function runAutomation(workflowId: string, options?: { attempt?: number; pageId?: string; silent?: boolean }): Promise<boolean> {
  const workflow = useAutomationStore.getState().workflows.find((item) => item.id === workflowId);
  if (!workflow) return false;
  const runId = makeId("run");
  const attempt = options?.attempt ?? 1;
  const logs = [`开始执行 · ${workflow.actions.length} 个动作`];
  useAutomationStore.getState().pushRun({ id: runId, workflowId, workflowName: workflow.name, status: "running", attempt, startedAt: Date.now(), logs });
  try {
    for (let index = 0; index < workflow.actions.length; index += 1) {
      const action = workflow.actions[index];
      const result = await executeAction(action, options?.pageId);
      logs.push(`${index + 1}. ${actionLabels[action.type]}：${result}`);
      useAutomationStore.getState().patchRun(runId, { logs: [...logs] });
    }
    useAutomationStore.getState().patchRun(runId, { status: "success", logs, finishedAt: Date.now() });
    if (!options?.silent) toast.success(`自动化「${workflow.name}」执行完成`);
    return true;
  } catch (error) {
    const message = (error as Error).message;
    logs.push(`失败：${message}`);
    useAutomationStore.getState().patchRun(runId, { status: "failed", logs, error: message, finishedAt: Date.now() });
    if (!options?.silent) toast.error(`自动化失败：${message}`);
    return false;
  }
}

export async function triggerAutomations(trigger: AutomationTrigger, pageId?: string): Promise<void> {
  const workflows = useAutomationStore.getState().workflows.filter((item) => item.enabled && item.trigger === trigger);
  for (const workflow of workflows) await runAutomation(workflow.id, { pageId, silent: true });
  if (workflows.length) toast.info(`已触发 ${workflows.length} 条自动化`);
}
