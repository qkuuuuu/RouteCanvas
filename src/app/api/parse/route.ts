import { NextRequest, NextResponse } from "next/server";
import { normalizeCode, detectFormat, type CodeFormat } from "@/lib/parser/normalize";

/**
 * POST /api/parse — 服务端轻量解析（无 DOM，基于正则）
 * 客户端精确解析请使用 iframeRenderer（有 computedStyle + boundingBox）
 *
 * Body: { code: string, format?: "html"|"tsx"|"vue"|"svelte", pageWidth?: number }
 * Response: { nodes: ParsedNode[], format: string, stats: {...} }
 */
export async function POST(req: NextRequest) {
  try {
    const { code, format, pageWidth } = (await req.json()) as {
      code?: string;
      format?: CodeFormat;
      pageWidth?: number;
    };

    if (!code || !code.trim()) {
      return NextResponse.json({ error: "code 不能为空" }, { status: 400 });
    }

    const fmt = format ?? detectFormat(code);
    const width = pageWidth ?? 800;
    const normalized = normalizeCode(code, fmt);

    // 服务端轻量解析：基于 HTML 结构 + inline style
    const nodes = serverSideParse(normalized.html, normalized.css, width);
    const editable = nodes.filter((n) => n.type !== "css").length;

    return NextResponse.json({
      nodes,
      format: fmt,
      stats: { total: nodes.length, editable, fallback: nodes.length - editable },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "未知错误";
    return NextResponse.json({ error: `解析失败: ${msg}` }, { status: 500 });
  }
}

/* ===== 轻量服务端解析 ===== */

interface SNode {
  type: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  props: Record<string, unknown>;
  zIndex: number;
}

function serverSideParse(html: string, css: string, pageWidth: number): SNode[] {
  const nodes: SNode[] = [];
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;
  let z = 0;

  // 匹配顶层块元素
  const blockRe = /<(div|section|nav|header|footer|article|aside|main|form|h[1-6]|p|img|button|a|input|textarea|select|ul|ol|li|table|svg|canvas|video)\b([^>]*?)(\/?)>/gi;
  let match: RegExpExecArray | null;

  while ((match = blockRe.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    const attrs = match[2] || "";
    const selfClose = match[3] === "/" || ["img", "input", "br", "hr"].includes(tag);

    let content = "";
    if (!selfClose) {
      const startIdx = match.index + match[0].length;
      const closeIdx = html.indexOf(`</${tag}>`, startIdx);
      if (closeIdx >= 0) {
        content = html.slice(startIdx, closeIdx);
        blockRe.lastIndex = closeIdx + tag.length + 3;
      }
    }

    const node = mapEl(tag, attrs, content, margin, y, contentWidth, ++z);
    if (node) {
      nodes.push(node);
      y += node.size.height + 16;
    }
  }

  return nodes;
}

function mapEl(tag: string, attrs: string, content: string, x: number, y: number, w: number, z: number): SNode | null {
  const style = parseInlineStyle(attrs);
  const text = content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200);
  const h = style.height ? parseInt(style.height) || 60 : estimateH(tag, text);

  if (tag === "img") {
    const src = getA(attrs, "src");
    return { type: "Image", position: { x, y }, size: { width: w, height: h || 200 }, props: { imageSrc: src, text: getA(attrs, "alt") }, zIndex: z };
  }
  if (tag === "input" || tag === "textarea" || tag === "select") {
    return { type: "Input", position: { x, y }, size: { width: w, height: 48 }, props: { custom: { placeholder: getA(attrs, "placeholder") } }, zIndex: z };
  }
  if (tag === "button" || (tag === "a" && /btn|button/i.test(getA(attrs, "class")))) {
    return { type: "Button", position: { x, y }, size: { width: Math.min(w, 200), height: 48 }, props: { text: text || "按钮" }, zIndex: z };
  }
  if (/^h[1-6]$/.test(tag) || tag === "p" || tag === "span" || tag === "blockquote") {
    if (!text) return null;
    const fontSize = tag === "h1" ? 32 : tag === "h2" ? 26 : tag === "h3" ? 22 : 14;
    const custom: Record<string, unknown> = { fontSize, fontWeight: /^h/.test(tag) ? 700 : 400 };
    if (style.color) custom.color = style.color;
    return { type: "Text", position: { x, y }, size: { width: w, height: h }, props: { text, custom }, zIndex: z };
  }
  if (tag === "svg" || tag === "canvas" || tag === "video" || tag === "table") {
    return { type: "css", position: { x, y }, size: { width: w, height: h || 200 }, props: { code: `<${tag}>${content}</${tag}>` }, zIndex: z };
  }

  // Container
  const custom: Record<string, unknown> = {};
  if (style.background?.includes("gradient")) { custom.bgType = "gradient"; }
  else if (style.backgroundColor) { custom.bgType = "solid"; custom.bgColor = style.backgroundColor; }
  else if (style.background) { custom.bgType = "solid"; custom.bgColor = style.background; }
  if (style.borderRadius) custom.radius = parseInt(style.borderRadius) || undefined;
  if (style.boxShadow && style.boxShadow !== "none") custom.shadow = "md";
  if (style.padding) custom.padding = parseInt(style.padding) || undefined;

  if (!text && Object.keys(custom).length === 0) return null;
  if (text && Object.keys(custom).length === 0 && !content.includes("<")) {
    return { type: "Text", position: { x, y }, size: { width: w, height: h }, props: { text, custom: { fontSize: 14 } }, zIndex: z };
  }
  return { type: "Container", position: { x, y }, size: { width: w, height: h }, props: { custom }, zIndex: z };
}

function parseInlineStyle(attrs: string): Record<string, string> {
  const s = getA(attrs, "style");
  if (!s) return {};
  const r: Record<string, string> = {};
  s.split(";").forEach((d) => {
    const [p, ...v] = d.split(":");
    if (p && v.length) r[p.trim().replace(/-([a-z])/g, (_m, c) => c.toUpperCase())] = v.join(":").trim();
  });
  return r;
}

function getA(attrs: string, name: string): string {
  const m = attrs.match(new RegExp(`${name}=["']([^"']*)["']`, "i"));
  return m ? m[1] : "";
}

function estimateH(tag: string, text: string): number {
  if (/^h[1-6]$/.test(tag)) return 48;
  if (tag === "img") return 200;
  const lines = Math.max(1, Math.ceil(text.length / 60));
  return Math.max(32, lines * 24 + 16);
}
