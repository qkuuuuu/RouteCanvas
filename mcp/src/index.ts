#!/usr/bin/env node
/**
 * RouteCanvas MCP Server
 * 让支持 MCP 的 IDE（Cursor / Claude Desktop / Qoder）直接读写画布。
 * 画布数据以 canvas.json 文件为共享介质，编辑器侧负责监听并实时渲染。
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "node:fs";
import path from "node:path";
import { componentListText, COMPONENTS } from "./components.js";
import { parseCode, detectFormat as detectCodeFormat, type CodeFormat } from "./htmlParser.js";

/* ---------- 画布文件路径（可通过环境变量覆盖） ---------- */
const CANVAS_FILE =
  process.env.ROUTECANVAS_FILE ??
  path.resolve(process.cwd(), "canvas.json");

/* ---------- 类型（与 src/types/schema.ts 对齐） ---------- */
interface UINode {
  id: string;
  type: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  props?: Record<string, unknown>;
  zIndex?: number;
}
interface Page {
  id: string;
  name: string;
  route: { path: string; name?: string; isIndex?: boolean };
  layout: { x: number; y: number; width: number; height: number; collapsed?: boolean };
  nodes: UINode[];
}
interface Transition {
  id: string;
  source: { pageId: string; nodeId: string; event?: string };
  target: { pageId: string; params?: Record<string, string> };
  mode?: "navigate" | "scroll";
  guard?: { requireAuth?: boolean; label?: string };
}
interface ComponentDefLite {
  source?: string;
  id?: string;
  label?: string;
  category?: string;
  subCategory?: string;
  propsSchema?: unknown[];
  tsxSource?: string;
  [k: string]: unknown;
}
interface CanvasDoc {
  meta: { schemaVersion: string; canvasName?: string; createdAt?: string; updatedAt?: string };
  pages: Page[];
  transitions: Transition[];
  componentRegistry?: ComponentDefLite[];
}

/* ---------- 文件读写 ---------- */
const nowISO = () => new Date().toISOString();
const genId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

function emptyDoc(): CanvasDoc {
  return {
    meta: { schemaVersion: "1.0.0", canvasName: "未命名画布", createdAt: nowISO(), updatedAt: nowISO() },
    pages: [],
    transitions: [],
  };
}

function loadDoc(): CanvasDoc {
  try {
    const raw = fs.readFileSync(CANVAS_FILE, "utf-8");
    const parsed = JSON.parse(raw) as CanvasDoc;
    if (!parsed.pages) parsed.pages = [];
    if (!parsed.transitions) parsed.transitions = [];
    if (!parsed.meta) parsed.meta = { schemaVersion: "1.0.0" };
    return parsed;
  } catch {
    return emptyDoc();
  }
}

function saveDoc(doc: CanvasDoc): void {
  doc.meta.updatedAt = nowISO();
  fs.writeFileSync(CANVAS_FILE, JSON.stringify(doc, null, 2), "utf-8");
}

const text = (s: string) => ({ content: [{ type: "text" as const, text: s }] });
const ok = (msg: string) => text(`✅ ${msg}`);
const err = (msg: string) => text(`❌ ${msg}`);

/* ---------- 校验辅助 ---------- */
const validTypes = new Set(COMPONENTS.map((c) => c.id));
/** pack 组件前缀：真实组件库远大于精选摘要（components.ts），校验按前缀放行，
 *  以编辑器注册表为准（未知类型会优雅降级为占位符），避免精选清单满后误杀合法组件 */
const PACK_PREFIXES = ["rb-", "ac-", "scn-", "mui-", "dash-", "abg-", "td-", "uv-", "r3f-", "Icon-"];
/** 组件类型白名单 = 内置组件 + 已注册自定义组件 + pack 前缀组件 */
function assertType(type: string, doc: CanvasDoc): string | null {
  if (validTypes.has(type)) return null;
  if ((doc.componentRegistry ?? []).some((c) => c.id === type)) return null;
  if (PACK_PREFIXES.some((p) => type.startsWith(p))) return null;
    return `未知组件类型 "${type}"。请先调用 list_components 查看可用组件；优先改用现有组件或富 Container/Text 可编辑样式，确需时才调用 register_component 创建画布临时组件。`;
}

/* ---------- MCP Server ---------- */
const server = new McpServer({
  name: "routecanvas",
  version: "1.0.0",
});

/* ===== 工具：get_canvas ===== */
server.tool(
  "get_canvas",
  "读取当前画布的完整 JSON（页面、节点、连线）。修改画布前建议先调用此工具了解现状。",
  {},
  () => {
    const doc = loadDoc();
    return text(JSON.stringify(doc, null, 2));
  },
);

/* ===== 工具：list_components ===== */
server.tool(
  "list_components",
  "列出所有可用的 UI 组件类型（type）及其可配置属性（含内置组件 + 本画布临时组件）。add_node 的 type 必须从中选择。设计时优先用现有组件 + 富 Container/Text 可编辑样式（背景渐变/玻璃拟态/字体戏剧性等）组合，尽量不注册；仅当现有组件确实无法表达时，才调用 register_component 创建『画布临时组件』。",
  {},
  () => {
    const doc = loadDoc();
    const registered = doc.componentRegistry ?? [];
    let extra = "";
    if (registered.length > 0) {
      const lines = registered.map(
        (c) => `- ${c.id}（${c.label}）[${c.category ?? "自定义"}] [临时·运行时渲染]`,
      );
      extra = `\n\n本画布临时组件（共 ${registered.length} 个，仅属当前画布、可一键清理、不进共享库）：\n${lines.join("\n")}`;
    }
    const note = `\n\n注：以上为精选摘要。pack 组件（rb-/ac-/scn-/mui-/dash-/abg-/td-/uv- 前缀）实际可用数量远多于此，直接使用前缀型 id 即可（如 rb-heart-beat）。`;
    return text(componentListText() + extra + note);
  },
);

/* ===== 工具：register_component ===== */
server.tool(
  "register_component",
  "创建『画布临时组件』（运行时渲染，TSX 源码）——仅属当前画布、在组件库单独『临时』分区展示、可一键清理、绝不进入共享组件库。创建后即可像内置组件一样在 add_node/set_canvas 中使用该 type。注意：这是最后手段——优先用现有组件 + 富 Container/Text 可编辑样式（背景渐变/玻璃/字体戏剧性等）组合实现设计；仅当现有组件确实无法表达（如强业务专属部件）时才创建临时组件。",
  {
    id: z.string().describe("组件唯一 id（即节点 type），建议小写短横线命名并加业务前缀，如 ice-flavor-card"),
    label: z.string().describe("组件显示名，如 口味展示卡"),
    tsxSource: z.string().describe("TSX 源码：必须 default export 一个 React 组件；推荐内联样式（也可用 Tailwind 类名）；可 import react / framer-motion / lucide-react；通过 props.text、props.imageSrc 及展开的 props.custom 接收属性"),
    category: z.string().optional().describe("分类名，如 冰激淋 / 自定义"),
    subCategory: z.string().optional().describe("二级分类"),
    props: z.array(z.string()).optional().describe("可配置的 prop key 列表（写入 propsSchema，供属性面板编辑）"),
  },
  ({ id, label, tsxSource, category, subCategory, props }) => {
    if (!id || !id.trim()) return err("id 不能为空");
    if (validTypes.has(id)) return err(`id "${id}" 与内置组件冲突，请换一个（建议加业务前缀，如 ice-xxx）`);
    const doc = loadDoc();
    if (!Array.isArray(doc.componentRegistry)) doc.componentRegistry = [];
    const def: ComponentDefLite = {
      source: "runtime",
      id,
      label,
      category: category ?? "自定义",
      subCategory,
      propsSchema: (props ?? []).map((key) => ({ key, label: key, type: "text", bucket: "custom" })),
      tsxSource,
    };
    const idx = doc.componentRegistry.findIndex((c) => c.id === id);
    if (idx >= 0) doc.componentRegistry[idx] = def;
    else doc.componentRegistry.push(def);
    saveDoc(doc);
    return ok(`已创建画布临时组件「${label}」(${id})（仅属当前画布，可在组件库『本画布·临时』分区查看与清理）。现在可在 add_node/set_canvas 中使用 type="${id}"`);
  },
);

/* ===== 工具：unregister_component ===== */
server.tool(
  "unregister_component",
  "删除一个画布临时组件（不删除已使用该组件的节点，但节点将显示为未知组件）。",
  { id: z.string().describe("要注销的组件 id") },
  ({ id }) => {
    const doc = loadDoc();
    const before = (doc.componentRegistry ?? []).length;
    doc.componentRegistry = (doc.componentRegistry ?? []).filter((c) => c.id !== id);
    if ((doc.componentRegistry ?? []).length === before) return err(`组件 ${id} 未注册`);
    saveDoc(doc);
    return ok(`已删除画布临时组件 ${id}`);
  },
);

/* ===== 工具：get_page ===== */
server.tool(
  "get_page",
  "获取指定页面的详细信息（含所有节点）。",
  { pageId: z.string().describe("页面 id，如 page_xxx") },
  ({ pageId }) => {
    const doc = loadDoc();
    const page = doc.pages.find((p) => p.id === pageId);
    if (!page) return err(`页面 ${pageId} 不存在。当前页面：${doc.pages.map((p) => `${p.id}(${p.name})`).join(", ") || "无"}`);
    return text(JSON.stringify(page, null, 2));
  },
);

/* ===== 工具：add_page ===== */
server.tool(
  "add_page",
  "新增一个页面画板。返回新页面的 id。",
  {
    name: z.string().describe("页面名称，如 首页 / 登录页"),
    path: z.string().describe("路由路径，如 / 或 /login"),
    width: z.number().optional().describe("页面宽度，默认 800"),
    height: z.number().optional().describe("页面高度，默认 600"),
    isIndex: z.boolean().optional().describe("是否为入口页（最多一个）"),
  },
  ({ name, path, width, height, isIndex }) => {
    const doc = loadDoc();
    const id = genId("page");
    const idx = doc.pages.length;
    if (isIndex) {
      for (const p of doc.pages) p.route.isIndex = false;
    }
    doc.pages.push({
      id,
      name,
      route: { path, isIndex: isIndex ?? idx === 0 },
      layout: {
        x: 100 + idx * 900,
        y: 100,
        width: width ?? 800,
        height: height ?? 600,
      },
      nodes: [],
    });
    saveDoc(doc);
    return ok(`已创建页面「${name}」，id=${id}，路由=${path}`);
  },
);

/* ===== 工具：add_node ===== */
server.tool(
  "add_node",
  "向指定页面添加一个 UI 组件节点。返回新节点 id。type 必须是 list_components 中列出的组件。",
  {
    pageId: z.string().describe("目标页面 id"),
    type: z.string().describe("组件类型（见 list_components）"),
    x: z.number().optional().describe("相对页面左上角的 x，默认 40"),
    y: z.number().optional().describe("相对页面左上角的 y，默认 40"),
    width: z.number().optional().describe("宽度，默认 200"),
    height: z.number().optional().describe("高度，默认 60"),
    props: z.record(z.unknown()).optional().describe("组件属性，如 { text: '登录', color: '#6366f1' }"),
  },
  ({ pageId, type, x, y, width, height, props }) => {
    const doc = loadDoc();
    const typeErr = assertType(type, doc);
    if (typeErr) return err(typeErr);
    const page = doc.pages.find((p) => p.id === pageId);
    if (!page) return err(`页面 ${pageId} 不存在`);
    const id = genId("node");
    const maxZ = page.nodes.reduce((m, n) => Math.max(m, n.zIndex ?? 0), 0);
    page.nodes.push({
      id,
      type,
      position: { x: x ?? 40, y: y ?? 40 },
      size: { width: width ?? 200, height: height ?? 60 },
      props: props ?? {},
      zIndex: maxZ + 1,
    });
    saveDoc(doc);
    return ok(`已在页面「${page.name}」添加 ${type} 节点，id=${id}`);
  },
);

/* ===== 工具：update_node ===== */
server.tool(
  "update_node",
  "修改指定节点的属性（合并更新）。只需传入要修改的字段。",
  {
    pageId: z.string().describe("节点所在页面 id"),
    nodeId: z.string().describe("节点 id"),
    props: z.record(z.unknown()).optional().describe("要合并更新的属性"),
    x: z.number().optional(),
    y: z.number().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
  },
  ({ pageId, nodeId, props, x, y, width, height }) => {
    const doc = loadDoc();
    const page = doc.pages.find((p) => p.id === pageId);
    if (!page) return err(`页面 ${pageId} 不存在`);
    const node = page.nodes.find((n) => n.id === nodeId);
    if (!node) return err(`节点 ${nodeId} 不存在于页面 ${pageId}`);
    if (props) node.props = { ...node.props, ...props };
    if (x !== undefined) node.position.x = x;
    if (y !== undefined) node.position.y = y;
    if (width !== undefined) node.size.width = width;
    if (height !== undefined) node.size.height = height;
    saveDoc(doc);
    return ok(`已更新节点 ${nodeId}`);
  },
);

/* ===== 工具：remove_node ===== */
server.tool(
  "remove_node",
  "删除指定节点（同时清理以它为起点的连线）。",
  {
    pageId: z.string(),
    nodeId: z.string(),
  },
  ({ pageId, nodeId }) => {
    const doc = loadDoc();
    const page = doc.pages.find((p) => p.id === pageId);
    if (!page) return err(`页面 ${pageId} 不存在`);
    const before = page.nodes.length;
    page.nodes = page.nodes.filter((n) => n.id !== nodeId);
    if (page.nodes.length === before) return err(`节点 ${nodeId} 不存在`);
    doc.transitions = doc.transitions.filter(
      (t) => !(t.source.pageId === pageId && t.source.nodeId === nodeId),
    );
    saveDoc(doc);
    return ok(`已删除节点 ${nodeId}`);
  },
);

/* ===== 工具：connect ===== */
server.tool(
  "connect",
  "创建页面间连线：某节点触发事件后跳转到目标页面。支持 navigate（跳转）和 scroll（滚动续页）两种模式。",
  {
    sourcePageId: z.string().describe("来源页面 id"),
    sourceNodeId: z.string().describe("触发节点 id（如按钮）"),
    targetPageId: z.string().describe("目标页面 id"),
    mode: z.enum(["navigate", "scroll"]).optional().describe("连线模式，默认 navigate"),
    event: z.string().optional().describe("触发事件，默认 onClick"),
    requireAuth: z.boolean().optional().describe("是否需要登录守卫"),
    params: z.record(z.string()).optional().describe("传递的路由参数"),
  },
  ({ sourcePageId, sourceNodeId, targetPageId, mode, event, requireAuth, params }) => {
    const doc = loadDoc();
    if (!doc.pages.some((p) => p.id === sourcePageId)) return err(`来源页面 ${sourcePageId} 不存在`);
    if (!doc.pages.some((p) => p.id === targetPageId)) return err(`目标页面 ${targetPageId} 不存在`);
    const srcPage = doc.pages.find((p) => p.id === sourcePageId)!;
    if (!srcPage.nodes.some((n) => n.id === sourceNodeId)) return err(`来源节点 ${sourceNodeId} 不存在于页面 ${sourcePageId}`);
    const dup = doc.transitions.some(
      (t) => t.source.pageId === sourcePageId && t.source.nodeId === sourceNodeId && t.target.pageId === targetPageId,
    );
    if (dup) return err("该连线已存在");
    const id = genId("trans");
    doc.transitions.push({
      id,
      source: { pageId: sourcePageId, nodeId: sourceNodeId, event: event ?? "onClick" },
      target: { pageId: targetPageId, params },
      mode: mode ?? "navigate",
      guard: requireAuth ? { requireAuth: true, label: "需要登录" } : undefined,
    });
    saveDoc(doc);
    return ok(`已创建连线 ${sourceNodeId} → ${targetPageId}（${mode ?? "navigate"}），id=${id}`);
  },
);

/* ===== 工具：remove_page ===== */
server.tool(
  "remove_page",
  "删除页面及其所有节点和相关连线。",
  { pageId: z.string() },
  ({ pageId }) => {
    const doc = loadDoc();
    const before = doc.pages.length;
    const page = doc.pages.find((p) => p.id === pageId);
    if (!page) return err(`页面 ${pageId} 不存在`);
    const nodeIds = new Set(page.nodes.map((n) => n.id));
    doc.pages = doc.pages.filter((p) => p.id !== pageId);
    if (doc.pages.length === before) return err(`页面 ${pageId} 不存在`);
    doc.transitions = doc.transitions.filter(
      (t) => t.source.pageId !== pageId && t.target.pageId !== pageId && !nodeIds.has(t.source.nodeId),
    );
    saveDoc(doc);
    return ok(`已删除页面「${page.name}」`);
  },
);

/* ===== 工具：set_canvas ===== */
server.tool(
  "set_canvas",
  "整体替换画布内容（用于从零生成完整设计）。传入完整的画布 JSON。",
  {
    canvasJson: z.string().describe("完整的 CanvasDocument JSON 字符串"),
  },
  ({ canvasJson }) => {
    try {
      const parsed = JSON.parse(canvasJson) as CanvasDoc;
      if (!Array.isArray(parsed.pages)) return err("canvasJson 必须包含 pages 数组");
      if (!Array.isArray(parsed.transitions)) parsed.transitions = [];
      if (!parsed.meta) parsed.meta = { schemaVersion: "1.0.0" };
      parsed.meta.schemaVersion = "1.0.0";
      // 合并画布临时组件：保留已有的临时组件（componentRegistry 属当前画布，不随设计被覆盖）+ 本次新声明的
      const existing = loadDoc();
      const incomingReg = Array.isArray(parsed.componentRegistry) ? parsed.componentRegistry : [];
      const mergedReg = [
        ...(existing.componentRegistry ?? []).filter((e) => !incomingReg.some((i) => i.id === e.id)),
        ...incomingReg,
      ];
      parsed.componentRegistry = mergedReg;
      // 校验组件类型（内置 + pack + 已注册自定义）
      for (const p of parsed.pages) {
        for (const n of p.nodes ?? []) {
          const e = assertType(n.type, parsed);
          if (e) return err(`页面「${p.name}」中：${e}`);
        }
      }
      saveDoc(parsed);
      return ok(`画布已更新：${parsed.pages.length} 个页面，${parsed.transitions.length} 条连线，自定义组件库 ${mergedReg.length} 个`);
    } catch (e) {
      return err(`JSON 解析失败：${(e as Error).message}`);
    }
  },
);

/* ===== 工具：import_code ===== */
server.tool(
  "import_code",
  "将前端代码（HTML/CSS/React TSX/Vue/Svelte）自动解析为可编辑画布节点并添加到指定页面。用户在对话中说'解析这个'/'导入项目'时调用此工具。支持整页拆解为 Container/Text/Button/Image 等可编辑节点。",
  {
    code: z.string().describe("前端源码（HTML/TSX/Vue/Svelte 均可）"),
    format: z.enum(["html", "tsx", "vue", "svelte"]).optional().describe("代码格式，不传则自动检测"),
    pageId: z.string().describe("目标页面 id（解析出的节点将添加到此页面）"),
    pageWidth: z.number().optional().describe("页面宽度，默认 800"),
  },
  ({ code, format, pageId, pageWidth }) => {
    if (!code || !code.trim()) return err("code 不能为空");
    const doc = loadDoc();
    const page = doc.pages.find((p) => p.id === pageId);
    if (!page) return err(`页面 ${pageId} 不存在，请先用 create_page 创建`);

    const fmt: CodeFormat = format ?? detectCodeFormat(code);
    const width = pageWidth ?? page.layout.width ?? 800;
    const result = parseCode(code, fmt, width);

    if (result.nodes.length === 0) return err("未能从代码中解析出任何节点");

    // 将解析出的节点添加到页面
    for (const n of result.nodes) {
      const id = genId("node");
      page.nodes.push({
        id,
        type: n.type,
        position: n.position,
        size: n.size,
        props: n.props as never,
        zIndex: n.zIndex,
      });
    }
    saveDoc(doc);

    const s = result.stats;
    return ok(
      `已从 ${fmt.toUpperCase()} 代码解析出 ${s.total} 个节点（${s.editable} 个可编辑 / ${s.fallback} 个兜底），已添加到页面「${page.name}」。可用 update_node 微调位置和样式。`,
    );
  },
);

/* ---------- 启动 ---------- */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`RouteCanvas MCP Server 已启动，画布文件：${CANVAS_FILE}`);
}

main().catch((e) => {
  console.error("启动失败：", e);
  process.exit(1);
});
