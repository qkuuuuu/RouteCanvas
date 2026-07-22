import type { CanvasState } from "@/types/schema";

export const DEFAULT_PROMPT_TEMPLATE = `你是一位资深前端工程师。下面是一个用「RouteCanvas」设计的多页面应用原型 JSON，包含 pages（页面与组件树）和 transitions（页面间跳转逻辑）。请基于此 JSON，使用 React + react-router-dom 实现一个完整可运行的多页面应用：
- 为每个 page 生成一个路由页面组件（route.path 作为路由路径，支持 :id 动态参数）。
- 按 transitions 实现跳转：源节点在 event 触发时跳转到目标页面，附带 target.params（值含 \${} 的为运行时占位符）。
- guard.requireAuth 为 true 的跳转需加路由守卫（未登录跳登录页）。
- 节点 props.text 为显示文本，imageSrc 为图片，apiUrl 为后端接口，code 为事件逻辑，custom 为扩展属性。
- 使用 Tailwind CSS 还原样式，组件类型按 node.type 渲染对应组件。

\`\`\`json
{{JSON}}
\`\`\`

请输出完整工程代码（含路由配置、各页面组件、入口文件）。`;

/** 将 JSON 嵌入模板，包装为 AI Prompt */
export function wrapAsPrompt(state: CanvasState, template?: string): string {
  const json = JSON.stringify(
    {
      meta: state.meta,
      pages: state.pages,
      transitions: state.transitions,
    },
    null,
    2,
  );
  const tpl = template && template.trim() ? template : DEFAULT_PROMPT_TEMPLATE;
  return tpl.replace("{{JSON}}", json);
}
