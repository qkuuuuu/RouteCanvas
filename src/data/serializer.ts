import type { CanvasState, CanvasDocument } from "@/types/schema";
import { SCHEMA_VERSION } from "@/store/canvasStore";

const nowISO = () => new Date().toISOString();

/** 导出为 JSON 文档（含 componentRegistry 扩展字段，便于跨设备恢复运行时组件） */
export function exportDocument(state: CanvasState): CanvasState {
  return {
    meta: {
      ...state.meta,
      schemaVersion: SCHEMA_VERSION,
      updatedAt: nowISO(),
      createdAt: state.meta.createdAt ?? nowISO(),
    },
    pages: state.pages,
    transitions: state.transitions,
    componentRegistry: state.componentRegistry,
  };
}

/** 完整性校验，返回错误列表（空数组表示通过） */
export function validateDocument(doc: CanvasDocument): string[] {
  const errors: string[] = [];
  const pageIds = new Set<string>();
  const nodeIds = new Set<string>();
  let indexCount = 0;

  for (const p of doc.pages ?? []) {
    if (pageIds.has(p.id)) errors.push(`页面 id 重复：${p.id}`);
    pageIds.add(p.id);
    if (p.route.isIndex) indexCount++;
    if (!p.route.path) errors.push(`页面「${p.name}」缺少路由 path`);
    const localNodeIds = new Set<string>();
    for (const n of p.nodes ?? []) {
      if (nodeIds.has(n.id)) errors.push(`节点 id 重复（需页面内唯一）：${n.id}`);
      nodeIds.add(n.id);
      localNodeIds.add(n.id);
    }
  }
  if (indexCount > 1) errors.push(`isIndex 为 true 的页面超过 1 个（共 ${indexCount} 个）`);

  for (const t of doc.transitions ?? []) {
    if (!pageIds.has(t.source.pageId))
      errors.push(`连线 ${t.id} 来源页面不存在：${t.source.pageId}`);
    if (!nodeIds.has(t.source.nodeId))
      errors.push(`连线 ${t.id} 来源节点不存在：${t.source.nodeId}`);
    if (!pageIds.has(t.target.pageId))
      errors.push(`连线 ${t.id} 目标页面不存在：${t.target.pageId}`);
  }
  return errors;
}

export interface ImportResult {
  ok: boolean;
  state?: CanvasState;
  errors: string[];
}

/** 从 JSON 字符串导入并校验 */
export function importDocument(json: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (e) {
    return { ok: false, errors: [`JSON 解析失败：${(e as Error).message}`] };
  }
  if (typeof parsed !== "object" || parsed === null) {
    return { ok: false, errors: ["JSON 根对象必须是对象"] };
  }
  const doc = parsed as Partial<CanvasDocument>;
  const errors = validateDocument({
    meta: doc.meta ?? { schemaVersion: SCHEMA_VERSION },
    pages: doc.pages ?? [],
    transitions: doc.transitions ?? [],
  });
  if (errors.length) return { ok: false, errors };

  const state: CanvasState = {
    meta: {
      schemaVersion: SCHEMA_VERSION,
      canvasName: doc.meta?.canvasName ?? "未命名画布",
      createdAt: doc.meta?.createdAt ?? nowISO(),
      updatedAt: nowISO(),
      viewport: doc.meta?.viewport ?? { x: 0, y: 0, zoom: 1 },
    },
    pages: doc.pages ?? [],
    transitions: doc.transitions ?? [],
    componentRegistry:
      (parsed as { componentRegistry?: CanvasState["componentRegistry"] })
        .componentRegistry ?? [],
  };
  return { ok: true, state, errors: [] };
}
