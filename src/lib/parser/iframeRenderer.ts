"use client";
/**
 * 客户端 iframe 渲染器：在隐藏 iframe 中渲染代码 → 调用 parseDomToNodes
 * 支持 HTML/CSS、TSX（React 渲染）、Vue/Svelte（归一化后当 HTML 渲染）
 */
import { normalizeCode, buildTsxRenderHtml, type CodeFormat } from "./normalize";
import { parseDomToNodes, type ParsedNode, type ParseStats } from "./parseEngine";

export interface RenderParseResult {
  nodes: ParsedNode[];
  stats: ParseStats;
  format: CodeFormat;
}

/**
 * 主入口：渲染代码并解析为可编辑节点
 */
export async function renderAndParse(
  code: string,
  format?: CodeFormat,
  pageWidth = 800,
): Promise<RenderParseResult> {
  const normalized = normalizeCode(code, format);
  const fmt = normalized.format;

  if (fmt === "tsx") {
    // TSX 需要完整 iframe 渲染（含 React + Babel）
    const renderHtml = buildTsxRenderHtml(code);
    const { nodes, stats } = await renderInIframe(renderHtml, pageWidth, true);
    return { nodes, stats, format: "tsx" };
  }

  // HTML / Vue / Svelte：构建简单 HTML 页面渲染
  const pageHtml = buildSimpleHtml(normalized.html, normalized.css);
  const { nodes, stats } = await renderInIframe(pageHtml, pageWidth, false);
  return { nodes, stats, format: fmt };
}

/**
 * 在隐藏 iframe 中渲染 HTML 并解析
 */
function renderInIframe(
  html: string,
  pageWidth: number,
  waitForReact: boolean,
): Promise<{ nodes: ParsedNode[]; stats: ParseStats }> {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement("iframe");
    iframe.style.cssText = `position:fixed;left:-9999px;top:0;width:${pageWidth}px;height:600px;border:none;visibility:hidden;`;
    document.body.appendChild(iframe);

    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("渲染超时（10s）"));
    }, 10000);

    function cleanup() {
      clearTimeout(timeout);
      iframe.remove();
    }

    iframe.onload = () => {
      if (waitForReact) {
        // 等待 React 渲染完成
        waitForRender(iframe, 0, () => {
          const result = doParse(iframe, pageWidth);
          cleanup();
          resolve(result);
        });
      } else {
        // 普通 HTML：等待一帧确保样式计算完成
        requestAnimationFrame(() => {
          const result = doParse(iframe, pageWidth);
          cleanup();
          resolve(result);
        });
      }
    };

    iframe.onerror = () => {
      cleanup();
      reject(new Error("iframe 加载失败"));
    };

    // 写入 HTML
    const doc = iframe.contentDocument;
    if (!doc) {
      cleanup();
      reject(new Error("无法访问 iframe document"));
      return;
    }
    doc.open();
    doc.write(html);
    doc.close();
  });
}

/** 等待 React 渲染完成（轮询 __RENDER_DONE__ 标志） */
function waitForRender(iframe: HTMLIFrameElement, attempt: number, done: () => void) {
  const win = iframe.contentWindow as unknown as { __RENDER_DONE__?: boolean };
  if (win?.__RENDER_DONE__ || attempt > 20) {
    done();
    return;
  }
  setTimeout(() => waitForRender(iframe, attempt + 1, done), 200);
}

/** 执行 DOM 解析 */
function doParse(iframe: HTMLIFrameElement, pageWidth: number): { nodes: ParsedNode[]; stats: ParseStats } {
  const body = iframe.contentDocument?.body;
  if (!body) return { nodes: [], stats: { total: 0, editable: 0, fallback: 0 } };

  // 移除 script 标签避免干扰
  body.querySelectorAll("script").forEach((s) => s.remove());

  return parseDomToNodes(body, pageWidth);
}

/** 构建简单 HTML 页面（用于 HTML/Vue/Svelte 归一化结果） */
function buildSimpleHtml(html: string, css: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: system-ui, -apple-system, sans-serif; }
</style>
${css ? `<style>${css}</style>` : ""}
</head>
<body>
${html}
</body>
</html>`;
}
