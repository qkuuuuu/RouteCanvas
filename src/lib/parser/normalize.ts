/**
 * 多格式归一化器：将各种前端格式统一为 { html, css }
 * 支持：HTML/CSS、React TSX/JSX、Vue SFC、Svelte
 */

export type CodeFormat = "html" | "tsx" | "vue" | "svelte";

export interface NormalizedCode {
  html: string;
  css: string;
  format: CodeFormat;
}

/**
 * 自动检测代码格式
 */
export function detectFormat(code: string, filename?: string): CodeFormat {
  // 按文件名后缀
  if (filename) {
    const ext = filename.split(".").pop()?.toLowerCase();
    if (ext === "vue") return "vue";
    if (ext === "svelte") return "svelte";
    if (ext === "tsx" || ext === "jsx") return "tsx";
    if (ext === "html" || ext === "htm" || ext === "css") return "html";
  }

  // 按内容特征
  const trimmed = code.trim();

  // Vue SFC: 有 <template> 标签
  if (/<template[\s>]/i.test(trimmed) && /<script[\s>]/i.test(trimmed)) return "vue";

  // Svelte: 有 <script> + <style> 但无 <template>，且有 {变量} 插值
  if (/<script[\s>]/i.test(trimmed) && !/<template[\s>]/i.test(trimmed)) {
    if (/\{[a-zA-Z_$]/.test(trimmed) || /<style[\s>]/i.test(trimmed)) return "svelte";
  }

  // TSX/JSX: export default / import React / JSX 语法
  if (/export\s+default\s+function/i.test(trimmed)) return "tsx";
  if (/import\s+React/i.test(trimmed)) return "tsx";
  if (/import\s+\{[^}]+\}\s+from\s+["']react["']/i.test(trimmed)) return "tsx";
  if (/const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*\{?\s*</.test(trimmed)) return "tsx";
  if (/<[A-Z]\w+[\s/>]/.test(trimmed)) return "tsx"; // 大写开头的 JSX 组件

  // 默认 HTML
  return "html";
}

/**
 * 归一化入口
 */
export function normalizeCode(code: string, format?: CodeFormat, filename?: string): NormalizedCode {
  const fmt = format ?? detectFormat(code, filename);

  switch (fmt) {
    case "vue":
      return normalizeVue(code);
    case "svelte":
      return normalizeSvelte(code);
    case "tsx":
      // TSX 需要 iframe 渲染，归一化阶段只返回标记
      return { html: "", css: "", format: "tsx" };
    case "html":
    default:
      return normalizeHtml(code);
  }
}

/**
 * HTML 归一化：提取 body 内容 + style 标签中的 CSS
 */
function normalizeHtml(code: string): NormalizedCode {
  // 提取所有 <style> 内容
  const styleMatches = [...code.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)];
  const css = styleMatches.map((m) => m[1]).join("\n").trim();

  // 提取 body 内容
  let html = "";
  const bodyMatch = code.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    html = bodyMatch[1].trim();
  } else {
    // 无 body 标签：去除 head/style/script 后取剩余
    html = code
      .replace(/<head[\s\S]*?<\/head>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<\/?html[^>]*>/gi, "")
      .replace(/<\/?body[^>]*>/gi, "")
      .replace(/<!DOCTYPE[^>]*>/gi, "")
      .trim();
  }

  // 移除 script 标签
  html = html.replace(/<script[\s\S]*?<\/script>/gi, "").trim();

  return { html, css, format: "html" };
}

/**
 * Vue SFC 归一化：提取 <template> 作 HTML、<style> 作 CSS
 */
function normalizeVue(code: string): NormalizedCode {
  // 提取 <template> 内容
  const templateMatch = code.match(/<template[^>]*>([\s\S]*?)<\/template>/i);
  const html = templateMatch ? templateMatch[1].trim() : "";

  // 提取所有 <style> 内容（可能有 scoped）
  const styleMatches = [...code.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)];
  let css = styleMatches.map((m) => m[1]).join("\n").trim();

  // 去除 Vue scoped 属性选择器 [data-v-xxx]
  css = css.replace(/\[data-v-[a-f0-9]+\]/g, "");

  // 简化 Vue 指令：v-bind:class → class, :src → src, v-if/v-for 移除
  const cleanHtml = html
    .replace(/v-if="[^"]*"/g, "")
    .replace(/v-else-if="[^"]*"/g, "")
    .replace(/v-else/g, "")
    .replace(/v-for="[^"]*"/g, "")
    .replace(/v-show="[^"]*"/g, "")
    .replace(/@[\w.]+="[^"]*"/g, "")  // 事件绑定
    .replace(/:[\w-]+="([^"]*)"/g, '$1') // 动态绑定 → 静态值
    .replace(/\{\{\s*([^}]+)\s*\}\}/g, "$1"); // 插值 → 文本

  return { html: cleanHtml, css, format: "vue" };
}

/**
 * Svelte 归一化：提取 HTML 模板 + <style> 段
 */
function normalizeSvelte(code: string): NormalizedCode {
  // 去除 <script> 段
  let html = code.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "").trim();

  // 提取 <style> 内容
  const styleMatches = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)];
  const css = styleMatches.map((m) => m[1]).join("\n").trim();

  // 去除 style 标签
  html = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "").trim();

  // 简化 Svelte 语法
  html = html
    .replace(/\{#if[^}]*\}/g, "")
    .replace(/\{:else if[^}]*\}/g, "")
    .replace(/\{:else\}/g, "")
    .replace(/\{\/if\}/g, "")
    .replace(/\{#each[^}]*\}/g, "")
    .replace(/\{\/each\}/g, "")
    .replace(/\{#await[^}]*\}/g, "")
    .replace(/\{\/await\}/g, "")
    .replace(/on:[\w]+={[^}]*}/g, "")  // 事件
    .replace(/bind:[\w]+={[^}]*}/g, "") // 绑定
    .replace(/\{([^}]+)\}/g, "$1"); // 表达式 → 文本

  return { html, css, format: "svelte" };
}

/**
 * 构建 TSX 渲染用的完整 HTML（用于 iframe 渲染）
 */
export function buildTsxRenderHtml(tsxCode: string): string {
  // 处理 export default：转为变量赋值
  let code = tsxCode
    .replace(/import\s+.*?from\s+["'][^"']+["'];?\s*/g, "") // 移除 import
    .replace(/export\s+default\s+function\s+(\w+)/, "function $1") // export default function → function
    .replace(/export\s+default\s+/, "const __Component = "); // export default expr

  // 找到组件名
  const fnMatch = code.match(/function\s+(\w+)\s*\(/);
  const componentName = fnMatch ? fnMatch[1] : "__Component";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>* { margin: 0; padding: 0; box-sizing: border-box; }</style>
</head>
<body>
<div id="root"></div>
<script src="https://unpkg.com/react@18/umd/react.production.min.js"><\/script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"><\/script>
<script src="https://unpkg.com/@babel/standalone@7/babel.min.js"><\/script>
<script type="text/babel" data-type="module">
${code}

// 渲染组件
const __el = document.getElementById("root");
const __root = ReactDOM.createRoot(__el);
__root.render(React.createElement(${componentName}, { text: "Preview" }));

// 通知父窗口渲染完成
setTimeout(() => { window.__RENDER_DONE__ = true; }, 300);
<\/script>
</body>
</html>`;
}
