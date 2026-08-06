/**
 * 页面版本快照 —— 生成/重做覆盖前自动存档，改坏了可以一键回退
 * 持久化保存（每页最近 8 版），配合 zundo 的细粒度撤销形成双层安全网。
 */
import { useCanvasStore } from "@/store/canvasStore";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Layout, Transition, UINode } from "@/types/schema";

export interface PageSnapshot {
  pageId: string;
  name: string;
  layout: Layout;
  nodes: UINode[];
  transitions: Transition[];
  at: number;
  label: string;
}

const MAX_PER_PAGE = 8;

/** 对指定页面拍快照（覆盖性操作前调用） */
export function snapshotPage(pageId: string, label: string) {
  const page = useCanvasStore.getState().pages.find((p) => p.id === pageId);
  if (!page) return;
  useVersionStore.getState().push({
    pageId,
    name: page.name,
    layout: JSON.parse(JSON.stringify(page.layout)) as Layout,
    nodes: JSON.parse(JSON.stringify(page.nodes)) as UINode[],
    transitions: JSON.parse(JSON.stringify(useCanvasStore.getState().transitions.filter((t) => t.source.pageId === pageId))) as Transition[],
    at: Date.now(),
    label,
  });
}

/** 回退指定页面到最近一版快照；返回是否成功 */
export function restoreLatestSnapshot(pageId: string): boolean {
  const store = useVersionStore.getState();
  const snap = store.latestOf(pageId);
  if (!snap) return false;
  const canvas = useCanvasStore.getState();
  const page = canvas.pages.find((p) => p.id === pageId);
  if (!page) return false;
  // 直接恢复原节点 ID 和完整页面结构，避免组件实例与交互引用断裂。
  canvas.updatePage(pageId, { name: snap.name, layout: snap.layout, nodes: snap.nodes });
  canvas.replacePageTransitions(pageId, snap.transitions);
  store.consume(pageId, snap.at);
  return true;
}

/** 从历史列表恢复指定版本；恢复前会先保存当前页面，便于反向找回。 */
export function restorePageSnapshot(pageId: string, at: number): boolean {
  const versionStore = useVersionStore.getState();
  const snap = versionStore.snapshots.find((item) => item.pageId === pageId && item.at === at);
  if (!snap) return false;
  const canvas = useCanvasStore.getState();
  const current = canvas.pages.find((page) => page.id === pageId);
  if (!current) return false;
  snapshotPage(pageId, "恢复前");
  canvas.updatePage(pageId, {
    name: snap.name,
    layout: JSON.parse(JSON.stringify(snap.layout)) as Layout,
    nodes: JSON.parse(JSON.stringify(snap.nodes)) as UINode[],
  });
  canvas.replacePageTransitions(pageId, JSON.parse(JSON.stringify(snap.transitions)) as Transition[]);
  return true;
}

interface VersionStore {
  snapshots: PageSnapshot[];
  push: (snap: PageSnapshot) => void;
  latestOf: (pageId: string) => PageSnapshot | undefined;
  consume: (pageId: string, at: number) => void;
}

export const useVersionStore = create<VersionStore>()(persist((set, get) => ({
  snapshots: [],
  push: (snap) =>
    set((s) => {
      const samePage = s.snapshots.filter((item) => item.pageId === snap.pageId);
      const trimmed = samePage.length >= MAX_PER_PAGE ? samePage.slice(1) : samePage;
      return { snapshots: [...s.snapshots.filter((item) => item.pageId !== snap.pageId), ...trimmed, snap] };
    }),
  latestOf: (pageId) => {
    const list = get().snapshots.filter((item) => item.pageId === pageId);
    return list[list.length - 1];
  },
  consume: (pageId, at) =>
    set((s) => ({ snapshots: s.snapshots.filter((item) => !(item.pageId === pageId && item.at === at)) })),
}), {
  name: "routecanvas-page-versions",
  storage: createJSONStorage(() => localStorage),
  partialize: (state) => ({ snapshots: state.snapshots }),
}));
