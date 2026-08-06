/**
 * 应用内事件总线 — 解耦模块间通信（评论 → AI、提案高亮等）
 */

/** 评论钉"交给 AI 修改"时派发，detail 为要发送给 AI 的指令文本 */
export const COMMENT_AI_EVENT = "routecanvas-comment-to-ai";

export function dispatchCommentToAi(text: string) {
  window.dispatchEvent(new CustomEvent<string>(COMMENT_AI_EVENT, { detail: text }));
}

/** 生成完成后派发：让画布视口聚焦到当前活动页面，避免新页面"看不到/以为堆叠" */
export const FOCUS_ACTIVE_PAGE_EVENT = "routecanvas-focus-active-page";

export function dispatchFocusActivePage() {
  window.dispatchEvent(new CustomEvent(FOCUS_ACTIVE_PAGE_EVENT));
}
