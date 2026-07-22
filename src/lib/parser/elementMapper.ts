/**
 * 元素分类映射器：DOM 元素 → RouteCanvas 组件类型
 */

export type MappedType = "Text" | "Image" | "Button" | "Input" | "Container" | "css" | null;

/** 纯文本标签 */
const TEXT_TAGS = new Set(["p", "span", "label", "small", "strong", "em", "b", "i", "u", "blockquote", "cite", "q", "abbr", "time", "mark", "sub", "sup"]);
/** 标题标签 */
const HEADING_TAGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);
/** 容器语义标签 */
const CONTAINER_TAGS = new Set(["nav", "header", "footer", "section", "article", "aside", "main", "figure", "figcaption", "details", "summary"]);
/** 兜底标签（复杂/不可编辑） */
const FALLBACK_TAGS = new Set(["video", "audio", "canvas", "svg", "iframe", "object", "embed", "table"]);
/** 跳过标签（不生成节点） */
const SKIP_TAGS = new Set(["script", "style", "link", "meta", "head", "title", "noscript", "template", "br", "hr", "wbr"]);

export interface MapResult {
  type: MappedType;
  /** 是否需要继续遍历子元素（Container 需要，Text/Button 不需要） */
  traverseChildren: boolean;
}

/**
 * 判断一个 DOM 元素应映射为什么组件类型。
 * 返回 null 表示跳过（不生成节点也不遍历子级）。
 */
export function classifyElement(el: Element, cs: CSSStyleDeclaration): MapResult | null {
  const tag = el.tagName.toLowerCase();

  // 跳过不可见 / 无意义标签
  if (SKIP_TAGS.has(tag)) return null;
  if (cs.display === "none" || cs.visibility === "hidden") return null;

  // 兜底：复杂元素
  if (FALLBACK_TAGS.has(tag)) return { type: "css", traverseChildren: false };

  // 图片
  if (tag === "img") return { type: "Image", traverseChildren: false };

  // 输入
  if (tag === "input" || tag === "textarea" || tag === "select") {
    return { type: "Input", traverseChildren: false };
  }

  // 按钮
  if (tag === "button" || el.getAttribute("role") === "button") {
    return { type: "Button", traverseChildren: false };
  }
  // a 标签带按钮特征
  if (tag === "a") {
    const cls = el.className?.toString() || "";
    const hasBtnStyle = /btn|button/i.test(cls) || cs.display === "inline-block" || cs.display === "flex";
    if (hasBtnStyle && getTextContent(el).length < 30) {
      return { type: "Button", traverseChildren: false };
    }
    // 普通链接当作文本
    return { type: "Text", traverseChildren: false };
  }

  // 标题
  if (HEADING_TAGS.has(tag)) return { type: "Text", traverseChildren: false };

  // 纯文本标签
  if (TEXT_TAGS.has(tag)) {
    const text = getTextContent(el);
    if (!text.trim()) return null; // 空文本跳过
    return { type: "Text", traverseChildren: false };
  }

  // 容器语义标签
  if (CONTAINER_TAGS.has(tag)) return { type: "Container", traverseChildren: true };

  // div / li / ul / ol / form 等通用块
  if (tag === "div" || tag === "li" || tag === "ul" || tag === "ol" || tag === "form" || tag === "dl" || tag === "dt" || tag === "dd") {
    return classifyGenericBlock(el, cs);
  }

  // 其他未知元素：尝试当容器
  return classifyGenericBlock(el, cs);
}

/**
 * 通用块元素分类：根据内容和样式判断是 Text / Container / css 兜底
 */
function classifyGenericBlock(el: Element, cs: CSSStyleDeclaration): MapResult | null {
  const children = el.children;
  const text = getTextContent(el);

  // 无子元素 + 有文本 → Text
  if (children.length === 0) {
    if (text.trim()) return { type: "Text", traverseChildren: false };
    // 空叶子：有视觉样式则当 Container，否则跳过
    if (hasVisualStyle(cs)) return { type: "Container", traverseChildren: false };
    return null;
  }

  // 子元素过多（> 12）→ css 兜底（避免生成过多碎片节点）
  if (children.length > 12) return { type: "css", traverseChildren: false };

  // 含 canvas/svg/video 子元素 → css 兜底
  if (el.querySelector("canvas, svg, video, iframe, object")) {
    return { type: "css", traverseChildren: false };
  }

  // 有视觉样式（背景/边框/阴影/圆角）→ Container，继续遍历子级
  if (hasVisualStyle(cs)) return { type: "Container", traverseChildren: true };

  // 无视觉样式的纯布局容器：不生成节点，但遍历子级
  return { type: null, traverseChildren: true };
}

/** 判断元素是否有可提取的视觉样式 */
function hasVisualStyle(cs: CSSStyleDeclaration): boolean {
  if (cs.backgroundColor && cs.backgroundColor !== "transparent" && cs.backgroundColor !== "rgba(0, 0, 0, 0)") return true;
  if (cs.backgroundImage && cs.backgroundImage !== "none") return true;
  if (cs.boxShadow && cs.boxShadow !== "none") return true;
  if (parseFloat(cs.borderRadius) > 0) return true;
  if (cs.borderStyle && cs.borderStyle !== "none" && parseFloat(cs.borderWidth) > 0) return true;
  if (cs.backdropFilter && cs.backdropFilter !== "none") return true;
  return false;
}

/** 获取元素的直接文本内容（不含子元素文本，但含所有后代文本用于 Text 映射） */
export function getTextContent(el: Element): string {
  return (el.textContent || "").replace(/\s+/g, " ").trim();
}

/** heading 标签 → variant 名 */
export function headingVariant(tag: string): string {
  if (tag === "h1") return "h1";
  if (tag === "h2") return "h2";
  if (tag === "h3") return "h3";
  return "body";
}
