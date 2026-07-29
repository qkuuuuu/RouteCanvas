/**
 * AI Chat Prompt 构建器
 * 将 RouteCanvas Schema + 组件白名单 + 当前画布状态 + 用户指令组装为 AI 可理解的 Prompt。
 * AI 被约束为只返回结构化 operations，实现"受控生成"。
 */
import type { CanvasState } from "@/types/schema";
import { getMergedRegistry } from "@/components/registry";
import { DESIGN_RULES } from "@/data/designSystem";

/** 从真实 registry 生成组件白名单文本（始终与编辑器一致） */
function buildComponentList(state: CanvasState): string {
  const defs = getMergedRegistry(state.componentRegistry);
  const lines = defs.map((d) => {
    const props = d.propsSchema
      .map((f) => {
        if (f.type === "select" && f.options) return `${f.key}(${f.options.join("/")})`;
        return f.key;
      })
      .join(", ");
    return `- ${d.id}（${d.label}）[${d.category}${d.subCategory ? "/" + d.subCategory : ""}] props: ${props || "无"}`;
  });
  return lines.join("\n");
}

/** 当前画布的精简状态（供 AI 了解现状） */
function buildCanvasContext(state: CanvasState): string {
  const summary = {
    canvasName: state.meta.canvasName,
    pages: state.pages.map((p) => ({
      id: p.id,
      name: p.name,
      path: p.route.path,
      isIndex: p.route.isIndex,
      nodes: p.nodes.map((n) => ({
        id: n.id,
        type: n.type,
        text: n.props?.text,
        position: n.position,
        size: n.size,
        note: n.note,
      })),
    })),
    transitions: state.transitions.map((t) => ({
      id: t.id,
      from: `${t.source.pageId}/${t.source.nodeId}`,
      to: t.target.pageId,
      mode: t.mode ?? "navigate",
    })),
  };
  return JSON.stringify(summary, null, 2);
}

const SYSTEM_PROMPT = `你是 RouteCanvas 设计助手。RouteCanvas 是一个多页面可视化设计画布，用户通过自然语言指令让你修改画布。

## 你的输出格式（严格遵守）
只输出一个 JSON 对象，不要输出任何其他文字：
{
  "reply": "给用户的简短中文说明（一句话）",
  "operations": [ ...操作数组... ]
}

## 可用操作（operations 数组元素）
1. 新增页面：
   { "op": "add_page", "ref": "临时引用名", "name": "页面名", "path": "/路由", "width": 800, "height": 600, "isIndex": false }
2. 添加组件节点：
   { "op": "add_node", "pageRef": "页面ref或已有pageId", "ref": "节点临时引用名", "type": "组件类型", "x": 40, "y": 40, "width": 200, "height": 60, "props": { "text": "文字", "custom": { "color": "#6366f1" } } }
3. 更新节点：
   { "op": "update_node", "pageId": "...", "nodeId": "...", "props": { "text": "新文字" } }
4. 删除节点：
   { "op": "remove_node", "pageId": "...", "nodeId": "..." }
5. 创建连线：
   { "op": "connect", "sourcePageRef": "...", "sourceNodeRef": "...", "targetPageRef": "...", "mode": "navigate", "requireAuth": false }
   （mode: navigate=跳转 / scroll=滚动续页；也可用 sourcePageId/sourceNodeId/targetPageId 直接引用已有 id）
6. 删除页面：
   { "op": "remove_page", "pageId": "..." }

## 关键规则
- add_page 后要在同一批操作中给它加组件时，用 "ref" 命名该页面，后续用 "pageRef" 引用它。
- add_node 同理：用 "ref" 命名节点，connect 时用 "sourceNodeRef"/"targetPageRef" 引用。
- 引用已存在的页面/节点时，直接使用它们的真实 id（见下方当前画布）。
- type 必须从组件白名单中选择，不确定就用 Button/Text/Input/Card/Container。
- 组件的文字放 props.text，颜色等放 props.custom。
- 层级顺序：zIndex 按添加顺序自动递增——整页背景（abg- 或 Container 底）必须第一个添加，装饰层其次，内容节点最后，禁止内容被背景遮挡。
- 合理布局：节点 position 相对页面左上角，x/y/宽/高取 8 的倍数（或构图套路里的网格值如 226/21），同区块严格对齐，避免重叠。
- 移动端页面用 width:390 height:844；桌面页面用 width:800 height:600；落地页可用更高高度（如 720/960），多屏用 scroll 连线串成连续滚动页。
- 生成质量：严格执行下方设计系统中的「高级感铁律」「组件选型速查」与「构图套路」——页面必须有背景氛围、戏剧化大标题、带圆角阴影的卡片、唯一醒目的 CTA，而不是白底裸组件堆叠。
- 如果用户要求"重新设计/整体生成"，可以先 remove_page 清空再重建，或直接增量修改。
- 不要编造不存在的 nodeId/pageId。

## 组件白名单（type 只能从中选）
{{COMPONENTS}}

{{DESIGN}}
`;

/** 组装完整请求消息 */
export function buildChatMessages(
  state: CanvasState,
  history: { role: "user" | "assistant"; content: string }[],
  userInstruction: string,
): { role: "system" | "user" | "assistant"; content: string }[] {
  const system = SYSTEM_PROMPT
    .replace("{{COMPONENTS}}", buildComponentList(state))
    .replace("{{DESIGN}}", DESIGN_RULES);

  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: system },
  ];

  // 历史对话（最近 6 轮，避免超长）
  const recent = history.slice(-12);
  for (const h of recent) {
    messages.push({ role: h.role, content: h.content });
  }

  // 当前指令 + 画布现状
  messages.push({
    role: "user",
    content: `## 当前画布状态\n${buildCanvasContext(state)}\n\n## 用户指令\n${userInstruction}`,
  });

  return messages;
}
