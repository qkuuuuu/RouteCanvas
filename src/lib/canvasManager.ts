/**
 * 多画布管理器 — 基于 localStorage 的画布列表 + 切换逻辑
 */
import { useCanvasStore } from "@/store/canvasStore";
import { genId } from "@/lib/id";

export interface CanvasMeta {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  pageCount: number;
}

const LIST_KEY = "routecanvas-canvas-list";
const ACTIVE_KEY = "routecanvas-active-canvas";
const docKey = (id: string) => `routecanvas-doc-${id}`;

/** 获取画布列表 */
export function getCanvasList(): CanvasMeta[] {
  try {
    const raw = localStorage.getItem(LIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCanvasList(list: CanvasMeta[]) {
  localStorage.setItem(LIST_KEY, JSON.stringify(list));
}

export function getActiveCanvasId(): string | null {
  return localStorage.getItem(ACTIVE_KEY);
}

function setActiveCanvasId(id: string) {
  localStorage.setItem(ACTIVE_KEY, id);
}

/** 保存当前 store 文档到指定画布 slot */
function saveCurrentDoc(canvasId: string) {
  const s = useCanvasStore.getState();
  const doc = {
    meta: s.meta,
    pages: s.pages,
    transitions: s.transitions,
    componentRegistry: s.componentRegistry,
  };
  localStorage.setItem(docKey(canvasId), JSON.stringify(doc));
}

/** 从指定画布 slot 加载文档到 store */
function loadDoc(canvasId: string): boolean {
  try {
    const raw = localStorage.getItem(docKey(canvasId));
    if (!raw) return false;
    const doc = JSON.parse(raw);
    useCanvasStore.getState().loadDocument(doc);
    return true;
  } catch {
    return false;
  }
}

/** 初始化：确保至少有一个画布，并同步 activeId */
export function initCanvasManager() {
  let list = getCanvasList();
  if (list.length === 0) {
    const id = genId("canvas");
    const meta: CanvasMeta = {
      id,
      name: "未命名画布 1",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pageCount: 0,
    };
    list = [meta];
    saveCanvasList(list);
    setActiveCanvasId(id);
  } else {
    const activeId = getActiveCanvasId();
    if (!activeId || !list.find((c) => c.id === activeId)) {
      setActiveCanvasId(list[0].id);
    }
  }
}

/** 创建新画布 */
export function createCanvas(name?: string): string {
  const list = getCanvasList();
  const id = genId("canvas");
  const meta: CanvasMeta = {
    id,
    name: name || `未命名画布 ${list.length + 1}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pageCount: 0,
  };
  list.push(meta);
  saveCanvasList(list);
  return id;
}

/** 切换到指定画布 */
export function switchCanvas(targetId: string) {
  const activeId = getActiveCanvasId();
  if (activeId === targetId) return;
  // 保存当前画布
  if (activeId) saveCurrentDoc(activeId);
  // 加载目标画布；若无存档（如新建画布）则清空残留内容并放一个起始页
  const loaded = loadDoc(targetId);
  if (!loaded) {
    const s = useCanvasStore.getState();
    s.clearAll();
    const meta = getCanvasList().find((c) => c.id === targetId);
    if (meta) s.setCanvasName(meta.name);
    s.addPage({ name: "首页", path: "/", isIndex: true, x: 80, y: 80 });
  }
  setActiveCanvasId(targetId);
}

/** 重命名画布 */
export function renameCanvas(id: string, name: string) {
  const list = getCanvasList();
  const item = list.find((c) => c.id === id);
  if (item) {
    item.name = name;
    item.updatedAt = new Date().toISOString();
    saveCanvasList(list);
  }
}

/** 删除画布 */
export function deleteCanvas(id: string) {
  let list = getCanvasList();
  list = list.filter((c) => c.id !== id);
  localStorage.removeItem(docKey(id));

  const activeId = getActiveCanvasId();
  if (id === activeId) {
    if (list.length === 0) {
      // 删除最后一个 → 自动新建
      const newId = createCanvas();
      list = getCanvasList();
      setActiveCanvasId(newId);
      // 清空 store 并放一个起始页，避免纯空白画布
      const s = useCanvasStore.getState();
      s.clearAll();
      const meta = list.find((c) => c.id === newId);
      if (meta) s.setCanvasName(meta.name);
      s.addPage({ name: "首页", path: "/", isIndex: true, x: 80, y: 80 });
    } else {
      // 切换到第一个
      switchCanvas(list[0].id);
    }
  }
  saveCanvasList(list);
}

/** 复制画布 */
export function duplicateCanvas(id: string): string {
  const list = getCanvasList();
  const src = list.find((c) => c.id === id);
  if (!src) return id;

  // 若复制的是当前活动画布，先把最新 store 内容落盘，避免复制到未保存的过期数据
  if (getActiveCanvasId() === id) saveCurrentDoc(id);

  const newId = genId("canvas");
  const newMeta: CanvasMeta = {
    ...src,
    id: newId,
    name: `${src.name} (副本)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  list.push(newMeta);
  saveCanvasList(list);

  // 复制文档数据
  const raw = localStorage.getItem(docKey(id));
  if (raw) localStorage.setItem(docKey(newId), raw);

  return newId;
}

/** 同步当前画布的 pageCount 到列表 */
export function syncPageCount() {
  const activeId = getActiveCanvasId();
  if (!activeId) return;
  const list = getCanvasList();
  const item = list.find((c) => c.id === activeId);
  if (item) {
    const count = useCanvasStore.getState().pages.length;
    if (item.pageCount !== count) {
      item.pageCount = count;
      item.updatedAt = new Date().toISOString();
      saveCanvasList(list);
    }
  }
}
