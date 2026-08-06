/**
 * 画布 → 代码导出
 * 1. HTML：单文件、零依赖、自带页面跳转（沿 transitions）
 * 2. React：单文件组件（useState 路由 + 内联样式）
 * 3. Vue：Vue 3 SFC（script setup + ref 路由）
 * 4. Android：Jetpack Compose（Box + offset 绝对布局）
 */
import type { CanvasState, UINode } from "@/types/schema";
import { resolveNodeFrame, resolvePageFrames, type ResolvedFrame } from "@/design/frame";

type Css = Record<string, string>;
type ClickInteraction = {
  mode: "navigate" | "scroll";
  pageId: string;
  anchorNodeId?: string;
};

function buildClickInteractions(state: CanvasState): Map<string, ClickInteraction> {
  const interactions = new Map<string, ClickInteraction>();
  state.transitions
    .filter((transition) => (transition.source.event ?? "onClick") === "onClick")
    .forEach((transition) => {
      const key = `${transition.source.pageId}:${transition.source.nodeId}`;
      if (interactions.has(key)) return;
      interactions.set(key, {
        mode: transition.mode === "scroll" ? "scroll" : "navigate",
        pageId: transition.target.pageId,
        anchorNodeId: transition.target.params?.anchorNodeId,
      });
    });
  return interactions;
}

function nodeDomId(pageId: string, nodeId: string): string {
  return `node-${pageId}-${nodeId}`;
}

function num(value: unknown): number | undefined {
  const n = Number(value);
  return Number.isFinite(n) && value !== undefined && value !== null && value !== "" ? n : undefined;
}

function hexToRgba(hex: string, alpha: number): string {
  const raw = hex.replace("#", "");
  const full = raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const TEXT_PRESETS: Record<string, { fontSize: number; fontWeight: number; color: string; lineHeight: number }> = {
  display: { fontSize: 48, fontWeight: 800, color: "#111827", lineHeight: 1.08 },
  h1: { fontSize: 32, fontWeight: 800, color: "#111827", lineHeight: 1.15 },
  h2: { fontSize: 24, fontWeight: 700, color: "#111827", lineHeight: 1.2 },
  h3: { fontSize: 17, fontWeight: 600, color: "#111827", lineHeight: 1.3 },
  body: { fontSize: 14, fontWeight: 400, color: "#374151", lineHeight: 1.5 },
  caption: { fontSize: 12, fontWeight: 400, color: "#6b7280", lineHeight: 1.4 },
};

function baseFrameCss(node: UINode, resolved?: ResolvedFrame, flowChild = false): Css {
  const frame = resolved ?? resolveNodeFrame(node, "desktop");
  if (flowChild) {
    return {
      position: "relative",
      width: `${frame.width}px`,
      height: `${frame.height}px`,
      "z-index": `${node.zIndex ?? 0}`,
      "flex-shrink": "0",
    };
  }
  return {
    position: "absolute",
    left: `${frame.x}px`,
    top: `${frame.y}px`,
    width: `${frame.width}px`,
    height: `${frame.height}px`,
    "z-index": `${node.zIndex ?? 0}`,
  };
}

function nodeCss(node: UINode, resolved?: ResolvedFrame, flowChild = false): Css | null {
  const c = node.props?.custom ?? {};
  const css = baseFrameCss(node, resolved, flowChild);
  switch (node.type) {
    case "Container":
    case "Section":
    case "Card":
    case "Navbar":
    case "Footer": {
      const bgType = (c.bgType as string) || "";
      if (bgType === "solid") css.background = (c.bgColor as string) || "#ffffff";
      else if (bgType === "gradient") css.background = `linear-gradient(${num(c.gradAngle) ?? 135}deg, ${(c.gradFrom as string) || "#6366f1"}, ${(c.gradTo as string) || "#ec4899"})`;
      else if (bgType === "glass") css.background = hexToRgba((c.bgColor as string) || "#ffffff", 0.55);
      else if (bgType === "image" && c.bgImage) css.background = `url(${c.bgImage}) center/cover no-repeat`;
      if (c.radius !== undefined) css["border-radius"] = `${num(c.radius)}px`;
      if (num(c.borderWidth)) css.border = `${num(c.borderWidth)}px solid ${(c.borderColor as string) || "#e5e7eb"}`;
      if (c.shadow && c.shadow !== "none") css["box-shadow"] = `0 12px 32px ${hexToRgba((c.shadowColor as string) || "#4f46e5", 0.18)}`;
      css.overflow = "hidden";
      if (node.layout?.mode === "stack") {
        css.display = "flex";
        css["flex-direction"] = node.layout.direction === "horizontal" ? "row" : "column";
        css.gap = `${node.layout.gap ?? 8}px`;
        css.padding = `${node.layout.padding ?? 0}px`;
        css["align-items"] = node.layout.align === "start" ? "flex-start" : node.layout.align === "end" ? "flex-end" : node.layout.align ?? "stretch";
        css["justify-content"] = node.layout.justify === "start" ? "flex-start" : node.layout.justify === "end" ? "flex-end" : node.layout.justify === "between" ? "space-between" : node.layout.justify ?? "flex-start";
      } else if (node.layout?.mode === "grid") {
        css.display = "grid";
        css["grid-template-columns"] = `repeat(${Math.max(1, node.layout.columns ?? 2)}, minmax(0, 1fr))`;
        css.gap = `${node.layout.gap ?? 8}px`;
        css.padding = `${node.layout.padding ?? 0}px`;
        css["align-items"] = node.layout.align === "start" ? "start" : node.layout.align === "end" ? "end" : node.layout.align ?? "stretch";
      }
      return css;
    }
    case "Text": {
      const preset = TEXT_PRESETS[(c.variant as string) ?? "body"] ?? TEXT_PRESETS.body;
      css["font-size"] = `${num(c.fontSize) ?? preset.fontSize}px`;
      css["font-weight"] = `${num(c.fontWeight) ?? preset.fontWeight}`;
      css.color = (c.color as string) ?? preset.color;
      css["line-height"] = `${num(c.lineHeight) ?? preset.lineHeight}`;
      css["white-space"] = "pre-wrap";
      css["font-family"] = '-apple-system, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
      if (c.align) css["text-align"] = c.align as string;
      if (c.letterSpacing !== undefined) css["letter-spacing"] = `${num(c.letterSpacing)}px`;
      if (c.gradText === true) {
        css.background = `linear-gradient(90deg, ${(c.gradFrom as string) || "#6366f1"}, ${(c.gradTo as string) || "#ec4899"})`;
        css["-webkit-background-clip"] = "text";
        css["background-clip"] = "text";
        css.color = "transparent";
      }
      return css;
    }
    case "Button": {
      const variant = (c.variant as string) ?? "primary";
      css.display = "flex";
      css["align-items"] = "center";
      css["justify-content"] = "center";
      css["border-radius"] = "8px";
      css["font-size"] = "14px";
      css["font-weight"] = "600";
      css.cursor = "pointer";
      css["font-family"] = '-apple-system, "Segoe UI", "PingFang SC", sans-serif';
      if (variant === "primary") {
        css.background = "linear-gradient(90deg, #6366f1, #4f46e5)";
        css.color = "#ffffff";
        css["box-shadow"] = "0 8px 24px rgba(99,102,241,0.25)";
      } else if (variant === "danger") {
        css.background = "linear-gradient(90deg, #ef4444, #e11d48)";
        css.color = "#ffffff";
      } else if (variant === "secondary") {
        css.background = "#ffffff";
        css.border = "1px solid #e5e7eb";
        css.color = "#374151";
      } else {
        css.background = "transparent";
        css.color = "#4f46e5";
      }
      return css;
    }
    case "Badge": {
      css["border-radius"] = "999px";
      css.display = "flex";
      css["align-items"] = "center";
      css["justify-content"] = "center";
      css["font-size"] = "11px";
      css["font-weight"] = "600";
      css.background = "#dbeafe";
      css.color = "#1d4ed8";
      css["font-family"] = '-apple-system, "Segoe UI", "PingFang SC", sans-serif';
      return css;
    }
    case "Image":
      return css;
    default: {
      css.background = "#f9fafb";
      css.border = "1px solid #e5e7eb";
      css["border-radius"] = "8px";
      css.display = "flex";
      css["align-items"] = "center";
      css["justify-content"] = "center";
      css["font-size"] = "12px";
      css.color = "#9ca3af";
      return css;
    }
  }
}

function cssToString(css: Css): string {
  return Object.entries(css)
    .map(([key, value]) => `${key}: ${value}`)
    .join("; ");
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** 节点 → HTML 片段 */
function nodeHtml(node: UINode, pageId: string, interactions: Map<string, ClickInteraction>, frames: Map<string, ResolvedFrame>, allNodes: UINode[], parent?: UINode): string {
  const exported = exportedFrame(node, frames, parent);
  const css = nodeCss(node, exported.frame, exported.flowChild);
  if (!css) return "";
  const interaction = interactions.get(`${pageId}:${node.id}`);
  const targetId = interaction?.mode === "scroll" && interaction.anchorNodeId
    ? nodeDomId(interaction.pageId, interaction.anchorNodeId)
    : `page-${interaction?.pageId ?? ""}`;
  const interactionAttr = interaction
    ? ` data-action="${interaction.mode}" data-target="${escapeHtml(targetId)}"`
    : "";
  const idAttr = ` id="${escapeHtml(nodeDomId(pageId, node.id))}"`;
  const text = escapeHtml(node.props?.text ?? "");
  const children = childNodes(allNodes, node.id).map((child) => nodeHtml(child, pageId, interactions, frames, allNodes, node)).join("\n");
  switch (node.type) {
    case "Image":
      return node.props?.imageSrc
        ? `<img${idAttr}${interactionAttr} src="${escapeHtml(node.props.imageSrc)}" alt="${text}" style="${cssToString(css)}; object-fit: cover;" />`
        : `<div${idAttr}${interactionAttr} style="${cssToString(css)}; background:#e5e7eb;"></div>`;
    case "Text":
      return `<div${idAttr}${interactionAttr} style="${cssToString(css)}">${text}${children}</div>`;
    default:
      return `<div${idAttr}${interactionAttr} style="${cssToString(css)}">${text}${children}</div>`;
  }
}

function exportedFrame(node: UINode, frames: Map<string, ResolvedFrame>, parent?: UINode): { frame: ResolvedFrame; flowChild: boolean } {
  const frame = frames.get(node.id) ?? resolveNodeFrame(node, "desktop");
  if (!parent) return { frame, flowChild: false };
  const flowChild = parent.layout?.mode === "stack" || parent.layout?.mode === "grid";
  if (flowChild) return { frame, flowChild: true };
  const parentFrame = frames.get(parent.id) ?? resolveNodeFrame(parent, "desktop");
  return { frame: { ...frame, x: frame.x - parentFrame.x, y: frame.y - parentFrame.y }, flowChild: false };
}

function rootNodes(nodes: UINode[]): UINode[] {
  const ids = new Set(nodes.map((node) => node.id));
  return nodes.filter((node) => !node.parentId || !ids.has(node.parentId));
}

function childNodes(nodes: UINode[], parentId: string): UINode[] {
  return nodes.filter((node) => node.parentId === parentId).sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
}

/** 导出完整 HTML（含页面跳转交互） */
export function exportHtmlDocument(state: CanvasState): string {
  const interactions = buildClickInteractions(state);

  const pagesHtml = state.pages
    .map((page) => {
      const frames = resolvePageFrames(page, "desktop");
      const visibleNodes = page.nodes.filter((node) => !node.hidden);
      const nodes = rootNodes(visibleNodes)
        .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
        .map((n) => nodeHtml(n, page.id, interactions, frames, visibleNodes))
        .join("\n      ");
      return `  <div class="page-name">${escapeHtml(page.name)} · ${escapeHtml(page.route.path)}</div>
  <section class="page" id="page-${page.id}" style="width:${page.layout.width}px; height:${page.layout.height}px;">
      ${nodes}
  </section>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(state.meta.canvasName ?? "RouteCanvas 导出")}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #f4f4f2; font-family: -apple-system, "Segoe UI", "PingFang SC", sans-serif; display: flex; flex-direction: column; align-items: center; padding: 32px 0; gap: 24px; }
  .page { position: relative; background: #ffffff; overflow: hidden; box-shadow: 0 16px 48px rgba(15,23,42,0.12); border-radius: 4px; flex-shrink: 0; }
  [data-action] { cursor: pointer; }
  .page-name { font-size: 12px; color: #9ca3af; align-self: flex-start; margin-left: max(32px, calc(50% - 600px)); }
</style>
</head>
<body>
${pagesHtml}
<script>
  // 点击交互元素：前往页面或滚动到指定区域。
  document.querySelectorAll('[data-action]').forEach(function (el) {
    el.addEventListener('click', function () {
      var target = document.getElementById(el.getAttribute('data-target'));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: el.getAttribute('data-action') === 'scroll' ? 'center' : 'start' });
    });
  });
</script>
</body>
</html>`;
}

/** 导出 React 单文件组件源码 */
export function exportReactCode(state: CanvasState): string {
  const interactions = buildClickInteractions(state);
  const indexPage = state.pages.find((p) => p.route.isIndex) ?? state.pages[0];

  const pageComponents = state.pages
    .map((page) => {
      const frames = resolvePageFrames(page, "desktop");
      const visibleNodes = page.nodes.filter((node) => !node.hidden);
      const renderNode = (node: UINode, parent?: UINode, indent = "      "): string => {
          const exported = exportedFrame(node, frames, parent);
          const css = nodeCss(node, exported.frame, exported.flowChild);
          if (!css) return "";
          const styleObj = `{ ${Object.entries(css)
            .map(([key, value]) => `"${key}": "${value.replace(/"/g, '\\"')}"`)
            .join(", ")} }`;
          const interaction = interactions.get(`${page.id}:${node.id}`);
          const targetDomId = interaction?.anchorNodeId ? nodeDomId(interaction.pageId, interaction.anchorNodeId) : "";
          const onClick = !interaction ? ""
            : interaction.mode === "scroll" && interaction.pageId === page.id
              ? targetDomId
                ? ` onClick={() => document.getElementById(${JSON.stringify(targetDomId)})?.scrollIntoView({ behavior: "smooth", block: "center" })}`
                : ` onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}`
              : ` onClick={() => setActivePage(${JSON.stringify(interaction.pageId)})}`;
          const idAttr = ` id=${JSON.stringify(nodeDomId(page.id, node.id))}`;
          const text = (node.props?.text ?? "").replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
          const children = childNodes(visibleNodes, node.id).map((child) => renderNode(child, node, `${indent}  `)).join("\n");
          if (node.type === "Image" && node.props?.imageSrc) {
            return `${indent}<img${idAttr}${onClick} src=${JSON.stringify(node.props.imageSrc)} alt="${text}" style={{ ...${styleObj}, objectFit: "cover" }} />`;
          }
          return children
            ? `${indent}<div${idAttr}${onClick} style={${styleObj}}>${text ? `"${text}"` : ""}\n${children}\n${indent}</div>`
            : `${indent}<div${idAttr}${onClick} style={${styleObj}}>${text ? `"${text}"` : ""}</div>`;
        };
      const nodes = rootNodes(visibleNodes)
        .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
        .map((node) => renderNode(node))
        .join("\n");
      return `function Page_${page.id.replace(/[^a-zA-Z0-9]/g, "_")}({ setActivePage }: { setActivePage: (id: string) => void }) {
  return (
    <div style={{ position: "relative", width: ${page.layout.width}, height: ${page.layout.height}, background: "#ffffff", overflow: "hidden", boxShadow: "0 16px 48px rgba(15,23,42,0.12)", margin: "24px auto" }}>
${nodes}
    </div>
  );
}`;
    })
    .join("\n\n");

  return `// 由 RouteCanvas 导出 — ${state.meta.canvasName ?? "未命名项目"}
import { useState } from "react";

${pageComponents}

export default function App() {
  const [activePage, setActivePage] = useState("${indexPage?.id ?? ""}");
  return (
    <div style={{ background: "#f4f4f2", minHeight: "100vh" }}>
${state.pages
  .map(
    (page) =>
      `      {activePage === "${page.id}" && <Page_${page.id.replace(/[^a-zA-Z0-9]/g, "_")} setActivePage={setActivePage} />}`,
  )
  .join("\n")}
    </div>
  );
}
`;
}

/** 触发浏览器下载 */
export function downloadText(filename: string, content: string, mime = "text/plain") {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** 导出 Vue 3 单文件组件 */
export function exportVueCode(state: CanvasState): string {
  const interactions = buildClickInteractions(state);
  const indexPage = state.pages.find((p) => p.route.isIndex) ?? state.pages[0];

  const pageTemplates = state.pages
    .map((page) => {
      const frames = resolvePageFrames(page, "desktop");
      const visibleNodes = page.nodes.filter((node) => !node.hidden);
      const renderNode = (node: UINode, parent?: UINode, indent = "      "): string => {
        const exported = exportedFrame(node, frames, parent);
        const css = nodeCss(node, exported.frame, exported.flowChild);
        if (!css) return "";
        const style = cssToString(css);
        const text = escapeHtml(node.props?.text ?? "");
        const interaction = interactions.get(`${page.id}:${node.id}`);
        const targetDomId = interaction?.anchorNodeId ? nodeDomId(interaction.pageId, interaction.anchorNodeId) : "";
        const click = !interaction ? ""
          : interaction.mode === "scroll" && interaction.pageId === page.id
            ? targetDomId
              ? ` @click=\"document.getElementById('${escapeHtml(targetDomId)}')?.scrollIntoView({ behavior: 'smooth', block: 'center' })\"`
              : ` @click=\"window.scrollTo({ top: 0, behavior: 'smooth' })\"`
            : ` @click=\"activePage = '${escapeHtml(interaction.pageId)}'\"`;
        const idAttr = ` id=\"${escapeHtml(nodeDomId(page.id, node.id))}\"`;
        if (node.type === "Image" && node.props?.imageSrc) return `${indent}<img${idAttr}${click} src=\"${escapeHtml(node.props.imageSrc)}\" alt=\"${text}\" style=\"${style}; object-fit: cover;\" />`;
        const children = childNodes(visibleNodes, node.id).map((child) => renderNode(child, node, `${indent}  `)).join("\n");
        return children
          ? `${indent}<div${idAttr}${click} style=\"${style}${interaction ? "; cursor: pointer;\"" : "\""}>${text}\n${children}\n${indent}</div>`
          : `${indent}<div${idAttr}${click} style=\"${style}${interaction ? "; cursor: pointer;\"" : "\""}>${text}</div>`;
      };
      const nodes = rootNodes(visibleNodes).sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0)).map((node) => renderNode(node)).join("\n");
      return `    <div v-if=\"activePage === '${page.id}'\" style=\"position: relative; width: ${page.layout.width}px; height: ${page.layout.height}px; background: #ffffff; overflow: hidden; box-shadow: 0 16px 48px rgba(15,23,42,0.12); margin: 24px auto;\">\n${nodes}\n    </div>`;
    })
    .join("\n");

  return `<!-- 由 RouteCanvas 导出 — ${escapeHtml(state.meta.canvasName ?? "未命名项目")} -->
<script setup>
import { ref } from "vue";
const activePage = ref("${indexPage?.id ?? ""}");
</script>

<template>
  <div style=\"background: #f4f4f2; min-height: 100vh;\">
${pageTemplates}
  </div>
</template>
`;
}

/** 导出 Android Jetpack Compose 代码（绝对布局还原画布） */
export function exportComposeCode(state: CanvasState): string {
  const page = state.pages.find((p) => p.route.isIndex) ?? state.pages[0];
  if (!page) return "";
  const frames = resolvePageFrames(page, "mobile");
  const interactions = buildClickInteractions(state);

  const visibleNodes = page.nodes.filter((node) => !node.hidden);
  const nodeCompose = (node: UINode, indent: string, parent?: UINode): string => {
    const absoluteFrame = frames.get(node.id) ?? resolveNodeFrame(node, "mobile");
    const parentFrame = parent ? frames.get(parent.id) ?? resolveNodeFrame(parent, "mobile") : undefined;
    const flowChild = parent?.layout?.mode === "stack" || parent?.layout?.mode === "grid";
    const frame = parentFrame && !flowChild ? { ...absoluteFrame, x: absoluteFrame.x - parentFrame.x, y: absoluteFrame.y - parentFrame.y } : absoluteFrame;
    const interaction = interactions.get(`${page.id}:${node.id}`);
    const interactionTarget = interaction?.mode === "scroll"
      ? interaction.anchorNodeId ?? interaction.pageId
      : interaction?.pageId;
    const interactionCall = !interaction || !interactionTarget
      ? ""
      : interaction.mode === "scroll"
        ? `onScrollTo(\"${interactionTarget}\")`
        : `onNavigate(\"${interactionTarget}\")`;
    const modifier = `${indent}Modifier${flowChild ? "" : `\n${indent}  .offset(x = ${frame.x}.dp, y = ${frame.y}.dp)`}\n${indent}  .size(width = ${frame.width}.dp, height = ${frame.height}.dp)${interactionCall && node.type !== "Button" ? `\n${indent}  .clickable { ${interactionCall} }` : ""}`;
    const c = node.props?.custom ?? {};
    const text = (node.props?.text ?? "").replace(/"/g, '\\"').replace(/\n/g, "\\n");
    switch (node.type) {
      case "Text":
        return `${indent}Text(\n${indent}  text = \"${text}\",\n${indent}  fontSize = ${num(c.fontSize) ?? 14}.sp,\n${indent}  color = Color(0xFF${((c.color as string) ?? "#374151").replace("#", "")}),\n${indent}  modifier = ${modifier.trim()}\n${indent})`;
      case "Container":
      case "Card":
      case "Section": {
        const bg = c.bgType === "solid" ? (c.bgColor as string) ?? "#FFFFFF" : "#FFFFFF";
        const children = childNodes(visibleNodes, node.id).map((child) => nodeCompose(child, `${indent}  `, node)).join("\n");
        return `${indent}Box(\n${indent}  modifier = ${modifier.trim()}\n${indent}    .background(Color(0xFF${bg.replace("#", "")}), shape = RoundedCornerShape(${num(c.radius) ?? 0}.dp))\n${indent}) {${children ? `\n${children}\n${indent}` : ""}}`;
      }
      case "Button":
        {
          const click = interactionCall ? `{ ${interactionCall} }` : "{}";
          return `${indent}Button(\n${indent}  onClick = ${click},\n${indent}  modifier = ${modifier.trim()}\n${indent}) { Text(\"${text}\") }`;
        }
      default:
        return `${indent}Box(modifier = ${modifier.trim()}) // ${node.type}`;
    }
  };

  const body = rootNodes(visibleNodes)
    .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
    .map((n) => nodeCompose(n, "    "))
    .join("\n");

  return `// 由 RouteCanvas 导出 — ${page.name}
package com.routecanvas.export

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun ${page.name.replace(/[^a-zA-Z0-9]/g, "")}Screen(
    onNavigate: (String) -> Unit = {},
    onScrollTo: (String) -> Unit = {},
) {
    Box(
        modifier = Modifier
            .size(width = ${page.layout.width}.dp, height = ${page.layout.height}.dp)
            .background(Color.White)
    ) {
${body}
    }
}
`;
}
