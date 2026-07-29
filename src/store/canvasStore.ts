import { create, useStore } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { temporal } from "zundo";
import type {
  CanvasState,
  Page,
  UINode,
  Transition,
  ComponentDef,
  DesignSystem,
  BreakpointKey,
  ResponsiveFrame,
  DesignComponent,
  NodeProps,
  Viewport,
  Meta,
} from "@/types/schema";
import { genId } from "@/lib/id";

export const SCHEMA_VERSION = "2.0.0";
const nowISO = () => new Date().toISOString();

/* ---------- 防抖 localStorage 写入 ---------- */
function createDebouncedStorage() {
  const base = createJSONStorage(() => localStorage)!;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const originalSetItem = base.setItem.bind(base);
  return {
    ...base,
    setItem: (name: string, value: unknown) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        originalSetItem(name, value as never);
      }, 400);
    },
  };
}

export interface Selection {
  type: "page" | "node" | "transition" | null;
  id: string | null;
  pageId?: string | null; // 当 type=node 时，所属页面
}

export interface CanvasStore extends CanvasState {
  selection: Selection;
  // meta
  setCanvasName: (name: string) => void;
  setViewport: (vp: Viewport) => void;
  touchUpdated: () => void;
  // pages
  addPage: (input?: Partial<PageInput>) => string;
  updatePage: (id: string, patch: Partial<Page>) => void;
  removePage: (id: string) => void;
  setPageCollapsed: (id: string, collapsed: boolean) => void;
  // nodes
  addNode: (
    pageId: string,
    type: string,
    input?: Partial<NodeInput>,
  ) => string | null;
  updateNode: (pageId: string, nodeId: string, patch: Partial<UINode>) => void;
  updateNodeProps: (
    pageId: string,
    nodeId: string,
    propsPatch: Partial<NodeProps>,
  ) => void;
  updateNodeResponsive: (
    pageId: string,
    nodeId: string,
    breakpoint: BreakpointKey,
    patch: ResponsiveFrame,
  ) => void;
  updateDesignSystem: (patch: Partial<DesignSystem>) => void;
  createComponentFromNode: (pageId: string, nodeId: string) => string | null;
  createComponentInstance: (pageId: string, componentId: string) => string | null;
  addComponentVariant: (componentId: string, sourcePageId: string, sourceNodeId: string) => void;
  applyComponentVariant: (pageId: string, nodeId: string, componentId: string, variantId: string) => void;
  removeNode: (pageId: string, nodeId: string) => void;
  addParsedNodes: (
    pageId: string,
    nodes: Array<{ type: string; position: { x: number; y: number }; size: { width: number; height: number }; props: NodeProps; zIndex?: number }>,
  ) => number;
  // transitions
  addTransition: (
    source: { pageId: string; nodeId: string; event?: string },
    target: { pageId: string; params?: Record<string, string> },
  ) => string | null;
  updateTransition: (id: string, patch: Partial<Transition>) => void;
  removeTransition: (id: string) => void;
  // selection
  select: (selection: Selection) => void;
  clearSelection: () => void;
  // registry
  registerComponent: (def: ComponentDef) => void;
  unregisterComponent: (id: string) => void;
  clearTempComponents: () => void;
  // bulk
  loadDocument: (doc: CanvasState) => void;
  clearAll: () => void;
}

export interface PageInput {
  name: string;
  path: string;
  routeName?: string;
  isIndex?: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface NodeInput {
  position: { x: number; y: number };
  size: { width: number; height: number };
  props: NodeProps;
  zIndex?: number;
}

const emptyState = (): CanvasState => ({
  meta: {
    schemaVersion: SCHEMA_VERSION,
    canvasName: "未命名项目",
    createdAt: nowISO(),
    updatedAt: nowISO(),
    viewport: { x: 0, y: 0, zoom: 1 },
  },
  pages: [],
  transitions: [],
  designSystem: {
    tokens: [
      { id: "color-primary", name: "color.primary", type: "color", value: "#4f46e5" },
      { id: "color-surface", name: "color.surface", type: "color", value: "#ffffff" },
      { id: "space-md", name: "space.md", type: "number", value: 16 },
    ],
    breakpoints: {
      desktop: { label: "Desktop", width: 1440 },
      tablet: { label: "Tablet", width: 768 },
      mobile: { label: "Mobile", width: 390 },
    },
  },
  componentRegistry: [],
});

// persist 与 zundo 都只关注文档子集（排除 selection 等瞬态）
const docSubset = (s: CanvasStore) => ({
  meta: s.meta,
  pages: s.pages,
  transitions: s.transitions,
  designSystem: s.designSystem,
  componentRegistry: s.componentRegistry,
});

export const useCanvasStore = create<CanvasStore>()(
  temporal(
    persist(
      (set, get) => ({
        ...emptyState(),
        selection: { type: null, id: null },

        setCanvasName: (name) =>
          set((s) => ({ meta: { ...s.meta, canvasName: name } })),
        setViewport: (vp) =>
          set((s) => ({ meta: { ...s.meta, viewport: vp } })),
        touchUpdated: () =>
          set((s) => ({ meta: { ...s.meta, updatedAt: nowISO() } })),

        /* ---------- pages ---------- */
        addPage: (input) => {
          const id = genId("page");
          const page: Page = {
            id,
            name: input?.name ?? "新页面",
            route: {
              path: input?.path ?? `/${id.slice(0, 8)}`,
              name: input?.routeName,
              isIndex: input?.isIndex ?? get().pages.length === 0,
            },
            layout: {
              x: input?.x ?? 120 + get().pages.length * 40,
              y: input?.y ?? 120 + get().pages.length * 40,
              width: input?.width ?? 800,
              height: input?.height ?? 600,
              collapsed: false,
            },
            nodes: [],
          };
          set((s) => ({
            pages: [...s.pages, page],
            meta: { ...s.meta, updatedAt: nowISO() },
            selection: { type: "page", id },
          }));
          return id;
        },

        updatePage: (id, patch) =>
          set((s) => ({
            pages: s.pages.map((p) => (p.id === id ? { ...p, ...patch } : p)),
            meta: { ...s.meta, updatedAt: nowISO() },
          })),

        removePage: (id) =>
          set((s) => {
            // 收集该页所有节点 id
            const page = s.pages.find((p) => p.id === id);
            const nodeIds = new Set(page?.nodes.map((n) => n.id) ?? []);
            return {
              pages: s.pages.filter((p) => p.id !== id),
              transitions: s.transitions.filter(
                (t) =>
                  t.source.pageId !== id &&
                  t.target.pageId !== id &&
                  !nodeIds.has(t.source.nodeId),
              ),
              selection: { type: null, id: null },
              meta: { ...s.meta, updatedAt: nowISO() },
            };
          }),

        setPageCollapsed: (id, collapsed) =>
          set((s) => ({
            pages: s.pages.map((p) =>
              p.id === id
                ? { ...p, layout: { ...p.layout, collapsed } }
                : p,
            ),
          })),

        /* ---------- nodes ---------- */
        addNode: (pageId, type, input) => {
          const page = get().pages.find((p) => p.id === pageId);
          if (!page) return null;
          const id = genId("node");
          // 自动分配 zIndex：当前页面最大 zIndex + 1，确保新节点在最上层
          const maxZ = page.nodes.reduce((m, n) => Math.max(m, n.zIndex ?? 0), 0);
          const node: UINode = {
            id,
            type,
            position: input?.position ?? { x: 40, y: 40 },
            size: input?.size ?? { width: 140, height: 44 },
            props: input?.props ?? {},
            zIndex: input?.zIndex ?? maxZ + 1,
          };
          set((s) => ({
            pages: s.pages.map((p) =>
              p.id === pageId ? { ...p, nodes: [...p.nodes, node] } : p,
            ),
            meta: { ...s.meta, updatedAt: nowISO() },
            selection: { type: "node", id, pageId },
          }));
          return id;
        },

        updateNode: (pageId, nodeId, patch) =>
          set((s) => ({
            pages: s.pages.map((p) =>
              p.id === pageId
                ? {
                    ...p,
                    nodes: p.nodes.map((n) =>
                      n.id === nodeId ? { ...n, ...patch } : n,
                    ),
                  }
                : p,
            ),
            meta: { ...s.meta, updatedAt: nowISO() },
          })),

        updateNodeProps: (pageId, nodeId, propsPatch) =>
          set((s) => ({
            pages: s.pages.map((p) =>
              p.id === pageId
                ? {
                    ...p,
                    nodes: p.nodes.map((n) =>
                      n.id === nodeId
                        ? { ...n, props: { ...n.props, ...propsPatch } }
                        : n,
                    ),
                  }
                : p,
            ),
            meta: { ...s.meta, updatedAt: nowISO() },
          })),

        updateNodeResponsive: (pageId, nodeId, breakpoint, patch) =>
          set((s) => ({
            pages: s.pages.map((p) =>
              p.id === pageId
                ? {
                    ...p,
                    nodes: p.nodes.map((n) =>
                      n.id === nodeId
                        ? {
                            ...n,
                            responsive: {
                              ...n.responsive,
                              [breakpoint]: {
                                ...n.responsive?.[breakpoint],
                                ...patch,
                              },
                            },
                          }
                        : n,
                    ),
                  }
                : p,
            ),
            meta: { ...s.meta, updatedAt: nowISO() },
          })),

        updateDesignSystem: (patch) =>
          set((s) => ({
            designSystem: {
              ...(s.designSystem ?? emptyState().designSystem!),
              ...patch,
            },
            meta: { ...s.meta, updatedAt: nowISO() },
          })),

        createComponentFromNode: (pageId, nodeId) => {
          const node = get().pages.find((p) => p.id === pageId)?.nodes.find((n) => n.id === nodeId);
          if (!node) return null;
          const id = `component_${Date.now().toString(36)}`;
          const component: DesignComponent = {
            id,
            name: node.props?.text || node.type,
            type: node.type,
            size: { ...node.size },
            variants: [{ id: "default", name: "Default", props: { ...node.props, custom: { ...node.props?.custom } } }],
          };
          set((s) => ({
            designSystem: {
              ...(s.designSystem ?? emptyState().designSystem!),
              components: [...(s.designSystem?.components ?? []), component],
            },
            pages: s.pages.map((p) => p.id === pageId ? { ...p, nodes: p.nodes.map((n) => n.id === nodeId ? { ...n, componentId: id, variant: "default" } : n) } : p),
          }));
          return id;
        },

        createComponentInstance: (pageId, componentId) => {
          const component = get().designSystem?.components?.find((item) => item.id === componentId);
          const page = get().pages.find((item) => item.id === pageId);
          if (!component || !page) return null;
          const variant = component.variants[0];
          const id = get().addNode(pageId, component.type, {
            position: { x: 48 + (page.nodes.length % 5) * 24, y: 48 + (page.nodes.length % 5) * 24 },
            size: { ...component.size },
            props: { ...variant.props, custom: { ...variant.props.custom } },
          });
          if (id) get().updateNode(pageId, id, { componentId, variant: variant.id });
          return id;
        },

        addComponentVariant: (componentId, sourcePageId, sourceNodeId) => {
          const node = get().pages.find((p) => p.id === sourcePageId)?.nodes.find((n) => n.id === sourceNodeId);
          if (!node) return;
          set((s) => ({
            designSystem: {
              ...(s.designSystem ?? emptyState().designSystem!),
              components: (s.designSystem?.components ?? []).map((component) => component.id === componentId ? {
                ...component,
                variants: [...component.variants, { id: `variant_${Date.now().toString(36)}`, name: `Variant ${component.variants.length + 1}`, props: { ...node.props, custom: { ...node.props?.custom } } }],
              } : component),
            },
          }));
        },

        applyComponentVariant: (pageId, nodeId, componentId, variantId) => {
          const component = get().designSystem?.components?.find((item) => item.id === componentId);
          const variant = component?.variants.find((item) => item.id === variantId);
          if (!component || !variant) return;
          get().updateNode(pageId, nodeId, { type: component.type, size: { ...component.size }, props: { ...variant.props, custom: { ...variant.props.custom } }, componentId, variant: variantId });
        },

        removeNode: (pageId, nodeId) =>
          set((s) => ({
            pages: s.pages.map((p) =>
              p.id === pageId
                ? { ...p, nodes: p.nodes.filter((n) => n.id !== nodeId) }
                : p,
            ),
            transitions: s.transitions.filter(
              (t) => !(t.source.pageId === pageId && t.source.nodeId === nodeId),
            ),
            selection: { type: null, id: null },
            meta: { ...s.meta, updatedAt: nowISO() },
          })),

        addParsedNodes: (pageId, parsedNodes) => {
          const page = get().pages.find((p) => p.id === pageId);
          if (!page || !parsedNodes.length) return 0;
          const baseZ = page.nodes.reduce((m, n) => Math.max(m, n.zIndex ?? 0), 0);
          const newNodes: UINode[] = parsedNodes.map((pn, i) => ({
            id: genId("node"),
            type: pn.type,
            position: pn.position,
            size: pn.size,
            props: pn.props,
            zIndex: baseZ + (pn.zIndex ?? i) + 1,
          }));
          set((s) => ({
            pages: s.pages.map((p) =>
              p.id === pageId ? { ...p, nodes: [...p.nodes, ...newNodes] } : p,
            ),
            meta: { ...s.meta, updatedAt: nowISO() },
            selection: { type: "page", id: pageId },
          }));
          return newNodes.length;
        },

        /* ---------- transitions ---------- */
        addTransition: (source, target) => {
          // 避免重复连线
          const exists = get().transitions.some(
            (t) =>
              t.source.pageId === source.pageId &&
              t.source.nodeId === source.nodeId &&
              t.target.pageId === target.pageId,
          );
          if (exists) return null;
          const id = genId("trans");
          const tr: Transition = {
            id,
            source: {
              pageId: source.pageId,
              nodeId: source.nodeId,
              event: source.event ?? "onClick",
            },
            target: { pageId: target.pageId, params: target.params },
          };
          set((s) => ({
            transitions: [...s.transitions, tr],
            meta: { ...s.meta, updatedAt: nowISO() },
            selection: { type: "transition", id },
          }));
          return id;
        },

        updateTransition: (id, patch) =>
          set((s) => ({
            transitions: s.transitions.map((t) =>
              t.id === id ? { ...t, ...patch } : t,
            ),
            meta: { ...s.meta, updatedAt: nowISO() },
          })),

        removeTransition: (id) =>
          set((s) => ({
            transitions: s.transitions.filter((t) => t.id !== id),
            selection: { type: null, id: null },
            meta: { ...s.meta, updatedAt: nowISO() },
          })),

        /* ---------- selection ---------- */
        select: (selection) => set({ selection }),
        clearSelection: () =>
          set({ selection: { type: null, id: null } }),

        /* ---------- registry ---------- */
        registerComponent: (def) =>
          set((s) => ({
            componentRegistry: [
              ...s.componentRegistry.filter((d) => d.id !== def.id),
              def,
            ],
          })),
        unregisterComponent: (id) =>
          set((s) => ({
            componentRegistry: s.componentRegistry.filter((d) => d.id !== id),
          })),
        clearTempComponents: () =>
          set((s) => ({
            componentRegistry: s.componentRegistry.filter((d) => d.source !== "runtime"),
          })),

        /* ---------- bulk ---------- */
        loadDocument: (doc) =>
          set({
            meta: doc.meta,
            pages: doc.pages,
            transitions: doc.transitions,
            designSystem: doc.designSystem ?? emptyState().designSystem,
            componentRegistry: doc.componentRegistry ?? [],
            selection: { type: null, id: null },
          }),

        clearAll: () =>
          set({
            ...emptyState(),
            componentRegistry: get().componentRegistry,
            selection: { type: null, id: null },
          }),
      }),
      {
        name: "routecanvas-doc",
        storage: createDebouncedStorage(),
        partialize: docSubset as (s: CanvasStore) => Partial<CanvasStore>,
      },
    ),
    {
      limit: 80,
      partialize: docSubset as (s: CanvasStore) => Partial<CanvasStore>,
      equality: (a, b) =>
        a.pages === b.pages &&
        a.transitions === b.transitions &&
        a.componentRegistry === b.componentRegistry &&
        a.meta === b.meta,
    },
  ),
);

/** 撤销/重做快捷访问；temporal store 由 zundo 挂载到主 store 的 .temporal 字段 */
export const useTemporal = () => {
  const pastLen = useStore(useCanvasStore.temporal, (s) => s.pastStates.length);
  const futureLen = useStore(useCanvasStore.temporal, (s) => s.futureStates.length);
  return {
    undo: () => useCanvasStore.temporal.getState().undo(),
    redo: () => useCanvasStore.temporal.getState().redo(),
    clear: () => useCanvasStore.temporal.getState().clear(),
    canUndo: pastLen > 0,
    canRedo: futureLen > 0,
  };
};

/* ---------- BroadcastChannel 通知预览页刷新 ---------- */
if (typeof window !== "undefined") {
  try {
    const bc = new BroadcastChannel("routecanvas-sync");
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    useCanvasStore.subscribe(() => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => bc.postMessage("update"), 300);
    });
  } catch { /* BroadcastChannel 不可用时静默失败 */ }
}

export type { Meta };
