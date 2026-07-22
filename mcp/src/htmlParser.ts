/**
 * MCP 服务端 HTML 解析器（Node.js 环境，无 DOM API）
 * 基于正则的轻量解析：提取块级元素 → 映射为画布节点
 * 精度不如客户端 iframe，但 AI 可用 update_node 微调
 */

export interface ServerParsedNode {
  type: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  props: Record<string, unknown>;
  zIndex: number;
}

export interface ServerParseResult {
  nodes: ServerParsedNode[];
  stats: { total: number; editable: number; fallback: number };
}

/* ===== 格式检测 ===== */
export type CodeFormat = "html" | "tsx" | "vue" | "svelte";

export function detectFormat(code: string): CodeFormat {
  const t = code.trim();
  if (/<template[\s>]/i.test(t) && /<script[\s>]/i.test(t)) return "vue";
  if (/export\s+default\s+function/i.test(t) || /import\s+React/i.test(t)) return "tsx";
  if (/<script[\s>]/i.test(t) && /\{[a-zA-Z_$]/.test(t) && !/<template[\s>]/i.test(t)) return "svelte";
  return "html";
}

/* ===== 归一化 ===== */
function normalize(code: string, format: CodeFormat): { html: string; css: string } {
  if (format === "vue") {
    const tpl = code.match(/<template[^>]*>([\s\S]*?)<\/template>/i);
    const styles = [...code.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)];
    let html = tpl ? tpl[1] : "";
    html = html
      .replace(/v-if="[^"]*"|v-else-if="[^"]*"|v-else|v-for="[^"]*"|v-show="[^"]*"/g, "")
      .replace(/@[\w.]+="[^"]*"/g, "")
      .replace(/:[\w-]+="([^"]*)"/g, "$1")
      .replace(/\{\{\s*([^}]+)\s*\}\}/g, "$1");
    return { html, css: styles.map((m) => m[1]).join("\n") };
  }
  if (format === "svelte") {
    let html = code.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
    const styles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)];
    html = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/\{#if[^}]*\}|\{:else[^}]*\}|\{\/if\}|\{#each[^}]*\}|\{\/each\}/g, "")
      .replace(/on:[\w]+={[^}]*}|bind:[\w]+={[^}]*}/g, "")
      .replace(/\{([^}]+)\}/g, "$1");
    return { html, css: styles.map((m) => m[1]).join("\n") };
  }
  if (format === "tsx") {
    // TSX: 提取 return 后的 JSX 块
    let html = code;
    const returnIdx = code.search(/return\s*[\s(]/);
    if (returnIdx >= 0) {
      html = code.slice(returnIdx).replace(/^return\s*\(?/, "");
      // 去掉末尾的 ); 或 ) 和 }
      html = html.replace(/\)\s*;?\s*\}?\s*$/, "");
    }
    // 简化 JSX → HTML
    html = html
      .replace(/className=/g, "class=")
      .replace(/style=\{\{([\s\S]*?)\}\}/g, (_m, inner) => `style="${jsxStyleToCss(inner)}"`)
      .replace(/\{[^}]*\}/g, "") // 移除表达式
      .replace(/<\/?[A-Z]\w*[^>]*>/g, "") // 移除自定义组件标签
      .replace(/\/>/g, ">"); // 自闭合 → 普通
    return { html, css: "" };
  }
  // HTML
  const styles = [...code.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)];
  let html = code;
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) html = bodyMatch[1];
  html = html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "");
  return { html, css: styles.map((m) => m[1]).join("\n") };
}

function jsxStyleToCss(jsxStyle: string): string {
  return jsxStyle
    .replace(/(\w+):/g, (_m, prop) => `${prop.replace(/([A-Z])/g, "-$1").toLowerCase()}:`)
    .replace(/,\s*/g, "; ");
}

/* ===== 核心解析 ===== */
const BLOCK_RE = /<(div|section|nav|header|footer|article|aside|main|form|ul|ol|li|h[1-6]|p|span|img|button|a|input|textarea|select|table|svg|canvas|video)\b([^>]*)(?:\/>|>([\s\S]*?)<\/\1>)/gi;

export function parseCode(code: string, format?: CodeFormat, pageWidth = 800): ServerParseResult {
  const fmt = format ?? detectFormat(code);
  const { html } = normalize(code, fmt);

  const nodes: ServerParsedNode[] = [];
  let z = 0;
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;

  // 提取顶层块元素
  const elements = extractTopLevelElements(html);
  let y = 20;

  for (const el of elements) {
    const result = mapElementRecursive(el, margin, y, contentWidth, () => ++z);
    for (const n of result) {
      nodes.push(n);
    }
    if (result.length > 0) {
      const last = result[result.length - 1];
      y = last.position.y + last.size.height + 16;
    }
  }

  const editable = nodes.filter((n) => n.type !== "css").length;
  return { nodes, stats: { total: nodes.length, editable, fallback: nodes.length - editable } };
}

/** 递归映射：容器拆解为自身 + 子节点 */
function mapElementRecursive(el: RawElement, x: number, y: number, width: number, nextZ: () => number): ServerParsedNode[] {
  const { tag, attrs, content } = el;
  const style = extractInlineStyle(attrs);
  const isContainer = ["div", "section", "nav", "header", "footer", "article", "aside", "main", "form", "ul", "ol", "li"].includes(tag);

  // 非容器元素直接映射
  if (!isContainer) {
    const node = mapElement(el, x, y, width, nextZ());
    return node ? [node] : [];
  }

  // 容器：提取子元素
  const children = extractTopLevelElements(content);
  const hasVisualStyle = !!(style.background || style.backgroundColor || style.borderRadius || style.boxShadow);
  const padding = parseInt(style.padding) || 20;

  // 如果容器没有子块元素
  if (children.length === 0 || (children.length === 1 && children[0].tag === "div" && children[0].content === content)) {
    const node = mapElement(el, x, y, width, nextZ());
    return node ? [node] : [];
  }

  const results: ServerParsedNode[] = [];

  // 有视觉样式的容器：先输出容器本身（作为背景层）
  if (hasVisualStyle) {
    const totalChildH = estimateChildrenHeight(children, width - padding * 2);
    const containerH = totalChildH + padding * 2;
    const custom: Record<string, unknown> = {};
    if (style.background) {
      if (style.background.includes("gradient")) {
        custom.bgType = "gradient";
        const colors = style.background.match(/#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)/g);
        if (colors && colors.length >= 2) { custom.gradFrom = colors[0]; custom.gradTo = colors[1]; }
      } else if (style.background.includes("url(")) {
        custom.bgType = "image";
      } else {
        custom.bgType = "solid";
        custom.bgColor = style.background;
      }
    }
    if (style.backgroundColor && !custom.bgType) { custom.bgType = "solid"; custom.bgColor = style.backgroundColor; }
    if (style.borderRadius) custom.radius = parseInt(style.borderRadius) || undefined;
    if (style.boxShadow && style.boxShadow !== "none") custom.shadow = "md";
    if (style.padding) custom.padding = padding;
    results.push({ type: "Container", position: { x, y }, size: { width, height: containerH }, props: { custom }, zIndex: nextZ() });
  }

  // 递归处理子元素（偏移 padding）
  let childY = y + (hasVisualStyle ? padding : 0);
  const childX = x + (hasVisualStyle ? padding : 0);
  const childW = width - (hasVisualStyle ? padding * 2 : 0);

  for (const child of children) {
    const childNodes = mapElementRecursive(child, childX, childY, childW, nextZ);
    for (const cn of childNodes) {
      results.push(cn);
    }
    if (childNodes.length > 0) {
      const last = childNodes[childNodes.length - 1];
      childY = last.position.y + last.size.height + 12;
    }
  }

  // 如果既没有视觉样式也没有子节点结果，尝试当作文本
  if (results.length === 0) {
    const node = mapElement(el, x, y, width, nextZ());
    return node ? [node] : [];
  }

  return results;
}

function estimateChildrenHeight(children: RawElement[], width: number): number {
  let h = 0;
  for (const c of children) {
    const text = stripTags(c.content).slice(0, 200);
    h += estimateHeight(c.tag, text, extractInlineStyle(c.attrs)) + 12;
  }
  return h;
}

interface RawElement {
  tag: string;
  attrs: string;
  content: string;
}

/** 提取顶层元素（简化：匹配第一层标签） */
function extractTopLevelElements(html: string): RawElement[] {
  const results: RawElement[] = [];
  const re = /<(div|section|nav|header|footer|article|aside|main|form|ul|ol|li|h[1-6]|p|span|img|button|a|input|textarea|select|table|svg|canvas|video|blockquote)\b([^>]*?)(\/?)>/gi;
  let match: RegExpExecArray | null;
  let lastIndex = 0;

  while ((match = re.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    const attrs = match[2] || "";
    const selfClose = match[3] === "/" || ["img", "input", "br", "hr"].includes(tag);

    let content = "";
    if (!selfClose) {
      // 找到对应的闭合标签
      const closeTag = `</${tag}>`;
      const startIdx = match.index + match[0].length;
      const closeIdx = findClosingTag(html, tag, startIdx);
      if (closeIdx >= 0) {
        content = html.slice(startIdx, closeIdx);
        re.lastIndex = closeIdx + closeTag.length;
      }
    }

    results.push({ tag, attrs, content: content.trim() });
    lastIndex = re.lastIndex;
  }

  // 如果没有匹配到任何块元素，把整段当一个容器
  if (results.length === 0 && html.trim()) {
    results.push({ tag: "div", attrs: "", content: html.trim() });
  }

  return results;
}

/** 找到嵌套感知的闭合标签位置 */
function findClosingTag(html: string, tag: string, startIdx: number): number {
  const openRe = new RegExp(`<${tag}[\\s>]`, "gi");
  const closeRe = new RegExp(`</${tag}>`, "gi");
  let depth = 1;
  let pos = startIdx;

  while (depth > 0 && pos < html.length) {
    openRe.lastIndex = pos;
    closeRe.lastIndex = pos;
    const nextOpen = openRe.exec(html);
    const nextClose = closeRe.exec(html);

    if (!nextClose) return -1;

    if (nextOpen && nextOpen.index < nextClose.index) {
      depth++;
      pos = nextOpen.index + 1;
    } else {
      depth--;
      if (depth === 0) return nextClose.index;
      pos = nextClose.index + 1;
    }
  }
  return -1;
}

/** 映射单个元素为节点 */
function mapElement(el: RawElement, x: number, y: number, width: number, z: number): ServerParsedNode | null {
  const { tag, attrs, content } = el;
  const style = extractInlineStyle(attrs);
  const text = stripTags(content).slice(0, 200);
  const height = estimateHeight(tag, text, style);

  // 图片
  if (tag === "img") {
    const src = getAttr(attrs, "src") || "";
    return { type: "Image", position: { x, y }, size: { width, height: height || 200 }, props: { imageSrc: src, text: getAttr(attrs, "alt") || "" }, zIndex: z };
  }

  // 输入
  if (tag === "input" || tag === "textarea" || tag === "select") {
    return { type: "Input", position: { x, y }, size: { width, height: 48 }, props: { custom: { placeholder: getAttr(attrs, "placeholder") || "" } }, zIndex: z };
  }

  // 按钮
  if (tag === "button" || (tag === "a" && /btn|button/i.test(getAttr(attrs, "class") || ""))) {
    return { type: "Button", position: { x, y }, size: { width: Math.min(width, 200), height: 48 }, props: { text: text || "按钮" }, zIndex: z };
  }

  // 标题 / 文本
  if (/^h[1-6]$/.test(tag) || tag === "p" || tag === "span" || tag === "blockquote") {
    if (!text) return null;
    const fontSize = tag === "h1" ? 32 : tag === "h2" ? 26 : tag === "h3" ? 22 : 14;
    const fontWeight = /^h[1-6]$/.test(tag) ? 700 : 400;
    const custom: Record<string, unknown> = { fontSize, fontWeight };
    if (/^h[1-3]$/.test(tag)) custom.variant = tag;
    if (style.color) custom.color = style.color;
    if (style.textAlign) custom.align = style.textAlign;
    return { type: "Text", position: { x, y }, size: { width, height }, props: { text, custom }, zIndex: z };
  }

  // 复杂元素兜底
  if (tag === "svg" || tag === "canvas" || tag === "video" || tag === "table") {
    return { type: "css", position: { x, y }, size: { width, height: height || 200 }, props: { code: `<${tag} ${attrs}>${content}</${tag}>` }, zIndex: z };
  }

  // 容器（div/section/nav/header/footer 等）
  const custom: Record<string, unknown> = {};
  if (style.background) {
    if (style.background.includes("gradient")) {
      custom.bgType = "gradient";
      const colors = style.background.match(/#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)/g);
      if (colors && colors.length >= 2) { custom.gradFrom = colors[0]; custom.gradTo = colors[1]; }
    } else if (style.background.includes("url(")) {
      custom.bgType = "image";
    } else {
      custom.bgType = "solid";
      custom.bgColor = style.background;
    }
  }
  if (style.backgroundColor && !custom.bgType) {
    custom.bgType = "solid";
    custom.bgColor = style.backgroundColor;
  }
  if (style.borderRadius) custom.radius = parseInt(style.borderRadius) || undefined;
  if (style.boxShadow && style.boxShadow !== "none") custom.shadow = "md";
  if (style.padding) custom.padding = parseInt(style.padding) || undefined;

  // 有子内容的容器：递归提取子节点（简化：只取直接文本子元素）
  const childText = stripTags(content).trim();
  if (!childText && Object.keys(custom).length === 0) return null; // 空容器跳过

  // 如果容器内有文本但没有视觉样式，当作文本
  if (childText && Object.keys(custom).length === 0 && !content.includes("<")) {
    return { type: "Text", position: { x, y }, size: { width, height }, props: { text: childText.slice(0, 200), custom: { fontSize: 14 } }, zIndex: z };
  }

  return { type: "Container", position: { x, y }, size: { width, height }, props: { custom }, zIndex: z };
}

/* ===== 工具函数 ===== */

function extractInlineStyle(attrs: string): Record<string, string> {
  const styleAttr = getAttr(attrs, "style");
  if (!styleAttr) return {};
  const result: Record<string, string> = {};
  styleAttr.split(";").forEach((decl) => {
    const [prop, ...valParts] = decl.split(":");
    if (prop && valParts.length) {
      const key = prop.trim().replace(/-([a-z])/g, (_m, c) => c.toUpperCase());
      result[key] = valParts.join(":").trim();
    }
  });
  return result;
}

function getAttr(attrs: string, name: string): string {
  const m = attrs.match(new RegExp(`${name}=["']([^"']*)["']`, "i"));
  return m ? m[1] : "";
}

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function estimateHeight(tag: string, text: string, style: Record<string, string>): number {
  if (style.height) return parseInt(style.height) || 60;
  if (/^h[1-6]$/.test(tag)) return 48;
  if (tag === "img") return 200;
  if (tag === "input" || tag === "textarea" || tag === "select") return 48;
  if (tag === "button") return 48;
  // 根据文本长度估算
  const lines = Math.max(1, Math.ceil(text.length / 60));
  return Math.max(32, lines * 24 + 16);
}
