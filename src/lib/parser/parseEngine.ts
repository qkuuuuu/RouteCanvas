/**
 * 解析引擎核心：遍历渲染后的 DOM → 生成 ParsedNode[]
 */
import type { NodeProps } from "@/types/schema";
import { classifyElement, getTextContent, headingVariant } from "./elementMapper";
import { extractTextStyle, extractContainerStyle, isTransparent } from "./styleExtractor";

export interface ParsedNode {
  type: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  props: NodeProps;
  zIndex: number;
}

export interface ParseStats {
  total: number;
  editable: number; // Text + Container + Image + Button + Input
  fallback: number; // css 兜底
}

let nodeCounter = 0;
function nextId(): string {
  return `pn_${Date.now().toString(36)}_${(++nodeCounter).toString(36)}`;
}

/**
 * 核心函数：遍历 DOM 树，将可见元素映射为画布节点。
 * @param root 渲染后的根元素（通常是 iframe 的 body）
 * @param pageWidth 画布页面宽度（用于坐标归一化）
 */
export function parseDomToNodes(root: HTMLElement, pageWidth = 800): { nodes: ParsedNode[]; stats: ParseStats } {
  nodeCounter = 0;
  const rootRect = root.getBoundingClientRect();
  const nodes: ParsedNode[] = [];
  const stats: ParseStats = { total: 0, editable: 0, fallback: 0 };
  let zCounter = 0;

  function walk(el: Element, parentX: number, parentY: number) {
    const cs = getWindow(el).getComputedStyle(el);
    const result = classifyElement(el, cs);

    if (!result) return; // 跳过

    const rect = el.getBoundingClientRect();
    // 相对根容器的坐标
    const x = Math.round(rect.left - rootRect.left);
    const y = Math.round(rect.top - rootRect.top);
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);

    // 过滤不可见 / 过小元素
    if (w < 4 || h < 4) {
      if (result.traverseChildren) walkChildren(el, x, y);
      return;
    }

    const { type, traverseChildren } = result;

    // type 为 null 表示纯布局容器：不生成节点但遍历子级
    if (type === null) {
      walkChildren(el, x, y);
      return;
    }

    // 生成节点
    const node = buildNode(type, el, cs, x, y, w, h, ++zCounter);
    if (node) {
      nodes.push(node);
      stats.total++;
      if (type === "css") stats.fallback++;
      else stats.editable++;
    }

    // Container 继续遍历子级
    if (traverseChildren && type === "Container") {
      walkChildren(el, x, y);
    }
  }

  function walkChildren(el: Element, _px: number, _py: number) {
    for (let i = 0; i < el.children.length; i++) {
      walk(el.children[i], _px, _py);
    }
  }

  // 从根的 children 开始（不映射根本体）
  walkChildren(root, 0, 0);

  return { nodes, stats };
}

/** 构建单个 ParsedNode */
function buildNode(
  type: string,
  el: Element,
  cs: CSSStyleDeclaration,
  x: number,
  y: number,
  w: number,
  h: number,
  zIndex: number,
): ParsedNode | null {
  const props: NodeProps = {};

  switch (type) {
    case "Text": {
      const text = getTextContent(el);
      if (!text) return null;
      props.text = text.slice(0, 500); // 限制长度
      const ts = extractTextStyle(cs);
      const tag = el.tagName.toLowerCase();
      const custom: Record<string, unknown> = {};
      // heading 预设
      if (/^h[1-6]$/.test(tag)) custom.variant = headingVariant(tag);
      custom.fontSize = ts.fontSize;
      custom.fontWeight = ts.fontWeight;
      if (ts.color) custom.color = ts.color;
      if (ts.align && ts.align !== "left") custom.align = ts.align;
      if (ts.letterSpacing) custom.letterSpacing = ts.letterSpacing;
      if (ts.lineHeight) custom.lineHeight = ts.lineHeight;
      if (ts.italic) custom.italic = true;
      if (ts.uppercase) custom.uppercase = true;
      if (ts.textShadow) custom.textShadow = ts.textShadow;
      if (ts.gradText) {
        custom.gradText = true;
        custom.gradFrom = ts.gradFrom;
        custom.gradTo = ts.gradTo;
      }
      props.custom = custom;
      break;
    }

    case "Image": {
      const img = el as HTMLImageElement;
      props.imageSrc = img.src || "";
      props.text = img.alt || "";
      break;
    }

    case "Button": {
      props.text = getTextContent(el).slice(0, 50) || "按钮";
      break;
    }

    case "Input": {
      const input = el as HTMLInputElement;
      props.custom = { placeholder: input.placeholder || "" };
      break;
    }

    case "Container": {
      const cStyle = extractContainerStyle(cs);
      const custom: Record<string, unknown> = {};
      if (cStyle.bgType) custom.bgType = cStyle.bgType;
      if (cStyle.bgColor) custom.bgColor = cStyle.bgColor;
      if (cStyle.gradFrom) custom.gradFrom = cStyle.gradFrom;
      if (cStyle.gradTo) custom.gradTo = cStyle.gradTo;
      if (cStyle.gradAngle != null) custom.gradAngle = cStyle.gradAngle;
      if (cStyle.bgImage) custom.bgImage = cStyle.bgImage;
      if (cStyle.radius) custom.radius = cStyle.radius;
      if (cStyle.padding) custom.padding = cStyle.padding;
      if (cStyle.opacity != null) custom.opacity = cStyle.opacity;
      if (cStyle.shadow && cStyle.shadow !== "none") custom.shadow = cStyle.shadow;
      if (cStyle.shadowColor) custom.shadowColor = cStyle.shadowColor;
      if (cStyle.borderWidth) custom.borderWidth = cStyle.borderWidth;
      if (cStyle.borderColor) custom.borderColor = cStyle.borderColor;
      if (cStyle.blur) custom.blur = cStyle.blur;
      props.custom = custom;
      break;
    }

    case "css": {
      // 兜底：保存 outerHTML 作为 css 组件
      const html = el.outerHTML;
      // 截取关联的 <style> 内容（简化：取所有 style 标签）
      const doc = el.ownerDocument;
      let css = "";
      if (doc) {
        const styles = doc.querySelectorAll("style");
        styles.forEach((s) => { css += s.textContent + "\n"; });
      }
      props.code = html.length > 5000 ? html.slice(0, 5000) : html;
      props.custom = { css: css.slice(0, 3000), html };
      break;
    }

    default:
      return null;
  }

  return {
    type,
    position: { x, y },
    size: { width: w, height: h },
    props,
    zIndex,
  };
}

/** 获取元素所属 window（兼容 iframe） */
function getWindow(el: Element): Window {
  return el.ownerDocument?.defaultView ?? window;
}
