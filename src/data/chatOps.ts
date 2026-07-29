/**
 * AI Chat 操作执行器
 * AI 返回结构化 operations，本模块将其应用到 canvasStore，实现实时画布更新。
 * 支持 ref 前向引用：add_page/add_node 可用临时 ref 名，后续操作通过 pageRef/nodeRef 引用。
 */
import { useCanvasStore } from "@/store/canvasStore";

/* ---------- 操作类型 ---------- */
export type ChatOp =
  | { op: "add_page"; ref?: string; name: string; path: string; width?: number; height?: number; isIndex?: boolean }
  | { op: "add_node"; pageId?: string; pageRef?: string; ref?: string; type: string; x?: number; y?: number; width?: number; height?: number; props?: Record<string, unknown> }
  | { op: "update_node"; pageId?: string; pageRef?: string; nodeId?: string; nodeRef?: string; props?: Record<string, unknown>; x?: number; y?: number; width?: number; height?: number }
  | { op: "remove_node"; pageId?: string; pageRef?: string; nodeId?: string; nodeRef?: string }
  | { op: "connect"; sourcePageId?: string; sourcePageRef?: string; sourceNodeId?: string; sourceNodeRef?: string; targetPageId?: string; targetPageRef?: string; mode?: "navigate" | "scroll"; event?: string; requireAuth?: boolean; params?: Record<string, string> }
  | { op: "remove_page"; pageId?: string; pageRef?: string }
  | { op: "set_canvas"; canvas: { pages: unknown[]; transitions: unknown[] } };

export interface ChatAiResponse {
  reply?: string;
  operations?: ChatOp[];
}

export function describeOperation(op: ChatOp): string {
  switch (op.op) {
    case "add_page": return `新增页面：${op.name} (${op.path})`;
    case "add_node": return `添加 ${op.type} 到 ${op.pageRef ?? op.pageId ?? "目标页面"}`;
    case "update_node": return `更新节点 ${op.nodeRef ?? op.nodeId ?? "未知节点"}`;
    case "remove_node": return `删除节点 ${op.nodeRef ?? op.nodeId ?? "未知节点"}`;
    case "connect": return `创建 ${op.mode ?? "navigate"} 交互连线`;
    case "remove_page": return `删除页面 ${op.pageRef ?? op.pageId ?? "未知页面"}`;
    case "set_canvas": return "整体替换画布";
  }
}

/* ---------- ref 解析上下文 ---------- */
interface RefCtx {
  pages: Map<string, string>; // ref -> pageId
  nodes: Map<string, string>; // ref -> nodeId
}

function resolvePageId(op: { pageId?: string; pageRef?: string }, ctx: RefCtx): string | null {
  if (op.pageId) return op.pageId;
  if (op.pageRef && ctx.pages.has(op.pageRef)) return ctx.pages.get(op.pageRef)!;
  return null;
}

function resolveNodeId(
  op: { nodeId?: string; nodeRef?: string; pageId?: string; pageRef?: string },
  ctx: RefCtx,
): string | null {
  if (op.nodeId) return op.nodeId;
  if (op.nodeRef && ctx.nodes.has(op.nodeRef)) return ctx.nodes.get(op.nodeRef)!;
  return null;
}

/* ---------- 执行单条操作 ---------- */
function execOp(op: ChatOp, ctx: RefCtx): string | null {
  const s = useCanvasStore.getState();

  switch (op.op) {
    case "add_page": {
      const id = s.addPage({
        name: op.name,
        path: op.path,
        isIndex: op.isIndex,
        width: op.width,
        height: op.height,
      });
      if (op.ref) ctx.pages.set(op.ref, id);
      return `新增页面「${op.name}」`;
    }

    case "add_node": {
      const pageId = resolvePageId(op, ctx);
      if (!pageId) return `⚠️ add_node 找不到目标页面（pageRef=${op.pageRef ?? "-"}）`;
      const id = s.addNode(pageId, op.type, {
        position: { x: op.x ?? 40, y: op.y ?? 40 },
        size: { width: op.width ?? 200, height: op.height ?? 60 },
        props: (op.props ?? {}) as never,
      });
      if (id && op.ref) ctx.nodes.set(op.ref, id);
      return id ? `添加组件 ${op.type}` : `⚠️ 添加组件失败（页面 ${pageId} 不存在）`;
    }

    case "update_node": {
      const pageId = resolvePageId(op, ctx);
      const nodeId = resolveNodeId(op, ctx);
      if (!pageId || !nodeId) return "⚠️ update_node 找不到目标节点";
      const patch: Record<string, unknown> = {};
      if (op.x !== undefined || op.y !== undefined) {
        const node = findNode(pageId, nodeId);
        patch.position = {
          x: op.x ?? node?.position.x ?? 0,
          y: op.y ?? node?.position.y ?? 0,
        };
      }
      if (op.width !== undefined || op.height !== undefined) {
        const node = findNode(pageId, nodeId);
        patch.size = {
          width: op.width ?? node?.size.width ?? 100,
          height: op.height ?? node?.size.height ?? 40,
        };
      }
      s.updateNode(pageId, nodeId, patch as never);
      if (op.props) s.updateNodeProps(pageId, nodeId, op.props as never);
      return "更新节点属性";
    }

    case "remove_node": {
      const pageId = resolvePageId(op, ctx);
      const nodeId = resolveNodeId(op, ctx);
      if (!pageId || !nodeId) return "⚠️ remove_node 找不到目标节点";
      s.removeNode(pageId, nodeId);
      return "删除节点";
    }

    case "connect": {
      const srcPage = op.sourcePageId ?? (op.sourcePageRef ? ctx.pages.get(op.sourcePageRef) : undefined);
      const srcNode = op.sourceNodeId ?? (op.sourceNodeRef ? ctx.nodes.get(op.sourceNodeRef) : undefined);
      const tgtPage = op.targetPageId ?? (op.targetPageRef ? ctx.pages.get(op.targetPageRef) : undefined);
      if (!srcPage || !srcNode || !tgtPage) return "⚠️ connect 缺少来源/目标";
      const id = s.addTransition(
        { pageId: srcPage, nodeId: srcNode, event: op.event ?? "onClick" },
        { pageId: tgtPage, params: op.params },
      );
      if (id && (op.mode || op.requireAuth)) {
        s.updateTransition(id, {
          mode: op.mode,
          guard: op.requireAuth ? { requireAuth: true, label: "需要登录" } : undefined,
        });
      }
      return id ? "创建页面连线" : "⚠️ 连线已存在或创建失败";
    }

    case "remove_page": {
      const pageId = op.pageId ?? (op.pageRef ? ctx.pages.get(op.pageRef) : undefined);
      if (!pageId) return "⚠️ remove_page 找不到目标页面";
      s.removePage(pageId);
      return "删除页面";
    }

    case "set_canvas": {
      // 整体替换（保留 componentRegistry）
      const canvas = op.canvas as { pages: never[]; transitions: never[] };
      s.loadDocument({
        meta: { ...s.meta, canvasName: s.meta.canvasName },
        pages: canvas.pages,
        transitions: canvas.transitions,
        componentRegistry: s.componentRegistry,
      });
      return "整体更新画布";
    }

    default:
      return `⚠️ 未知操作`;
  }
}

function findNode(pageId: string, nodeId: string) {
  return useCanvasStore
    .getState()
    .pages.find((p) => p.id === pageId)
    ?.nodes.find((n) => n.id === nodeId);
}

/* ---------- 执行全部操作 ---------- */
export function executeOperations(ops: ChatOp[]): string[] {
  const ctx: RefCtx = { pages: new Map(), nodes: new Map() };
  const results: string[] = [];
  for (const op of ops) {
    try {
      const r = execOp(op, ctx);
      if (r) results.push(r);
    } catch (e) {
      results.push(`⚠️ 操作执行出错：${(e as Error).message}`);
    }
  }
  return results;
}

/* ---------- 从 AI 文本中解析出 JSON 响应 ---------- */
export function parseAiResponse(text: string): ChatAiResponse | null {
  // 尝试直接解析
  const tryParse = (s: string): ChatAiResponse | null => {
    try {
      const obj = JSON.parse(s) as ChatAiResponse;
      if (obj && typeof obj === "object") return obj;
    } catch {
      /* ignore */
    }
    return null;
  };

  // 1. 整体就是 JSON
  const direct = tryParse(text.trim());
  if (direct) return direct;

  // 2. 提取 ```json ... ``` 代码块
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) {
    const parsed = tryParse(fence[1].trim());
    if (parsed) return parsed;
  }

  // 3. 提取第一个 { ... } 对象
  const brace = text.match(/\{[\s\S]*\}/);
  if (brace) {
    const parsed = tryParse(brace[0]);
    if (parsed) return parsed;
  }

  return null;
}
