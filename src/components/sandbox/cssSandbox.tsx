"use client";
import * as React from "react";

/**
 * uiverse 纯 CSS 片段渲染器。
 * 将 HTML + CSS 注入到一个带唯一 data-scope 属性的容器中，
 * CSS 选择器被加前缀以实现 scope 隔离，避免污染全局样式。
 */

let idCounter = 0;

/** 简单 CSS scoper：将非 @规则选择器加上 scope 前缀 */
function scopeCss(css: string, scope: string): string {
  const result: string[] = [];
  // 按 } 分割为规则块
  const blocks = css.split(/(?<=\})/);
  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    // 匹配 selector { body }
    const m = trimmed.match(/^([^{}]*)\{([\s\S]*)\}$/);
    if (!m) {
      result.push(trimmed);
      continue;
    }
    const [, selectorPart, body] = m;
    const selector = selectorPart.trim();

    if (selector.startsWith("@keyframes") || selector.startsWith("@-webkit-keyframes") || selector.startsWith("@font-face")) {
      // keyframes / font-face 保持原样
      result.push(`${selector} {${body}}`);
    } else if (selector.startsWith("@media") || selector.startsWith("@supports") || selector.startsWith("@container")) {
      // 嵌套 at-rule：递归 scope 内部
      result.push(`${selector} {\n${scopeCss(body, scope)}\n}`);
    } else if (selector.startsWith("@")) {
      // 其他 at-rules 原样保留
      result.push(`${selector} {${body}}`);
    } else {
      // 普通选择器：用逗号分割后逐个加前缀
      const scoped = selector
        .split(",")
        .map((s) => {
          const t = s.trim();
          if (!t || t.includes(scope)) return t;
          return `${scope} ${t}`;
        })
        .join(", ");
      result.push(`${scoped} {${body}}`);
    }
  }
  return result.join("\n");
}

export interface CssSandboxProps {
  html: string;
  css?: string;
  /** CSS 变量注入（如 { "--uv-color": "#ec4899" }） */
  vars?: Record<string, string>;
}

export function CssSandbox({ html, css, vars }: CssSandboxProps) {
  const scopeRef = React.useRef(`rc-css-scope-${++idCounter}`);
  const scope = scopeRef.current;
  const style = vars ? Object.fromEntries(Object.entries(vars).map(([k, v]) => [k, v])) as React.CSSProperties : undefined;

  React.useEffect(() => {
    if (!css) return;
    const styleId = `style-${scope}`;
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = scopeCss(css, `[data-scope="${scope}"]`);
    return () => {
      // 组件卸载时清理 style 标签
      styleEl?.remove();
    };
  }, [css, scope]);

  return (
    <div
      data-scope={scope}
      className="w-full h-full overflow-hidden"
      style={style}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
