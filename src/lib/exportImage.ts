/**
 * 页面导出为 PNG — 纯 Canvas 2D 绘制，零依赖
 * 按 zIndex 顺序绘制节点：Container/Text/Button/Badge/Image 等常见组件高保真还原，
 * 其余组件以带标签的占位块呈现。
 */
import type { Page, UINode } from "@/types/schema";
import { resolveNodeFrame } from "@/design/frame";

const SCALE = 2;

const TEXT_PRESETS: Record<string, { fontSize: number; fontWeight: number; color: string; lineHeight: number }> = {
  display: { fontSize: 48, fontWeight: 800, color: "#111827", lineHeight: 1.08 },
  h1: { fontSize: 32, fontWeight: 800, color: "#111827", lineHeight: 1.15 },
  h2: { fontSize: 24, fontWeight: 700, color: "#111827", lineHeight: 1.2 },
  h3: { fontSize: 17, fontWeight: 600, color: "#111827", lineHeight: 1.3 },
  body: { fontSize: 14, fontWeight: 400, color: "#374151", lineHeight: 1.5 },
  caption: { fontSize: 12, fontWeight: 400, color: "#6b7280", lineHeight: 1.4 },
};

const BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  blue: { bg: "#dbeafe", text: "#1d4ed8" },
  green: { bg: "#dcfce7", text: "#15803d" },
  red: { bg: "#fee2e2", text: "#b91c1c" },
  yellow: { bg: "#fef9c3", text: "#a16207" },
  purple: { bg: "#f3e8ff", text: "#7e22ce" },
  gray: { bg: "#f3f4f6", text: "#4b5563" },
};

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

async function loadImages(urls: string[]): Promise<Map<string, HTMLImageElement>> {
  const map = new Map<string, HTMLImageElement>();
  await Promise.all(
    urls.map(async (url) => {
      if (!url || map.has(url)) return;
      try {
        const resp = await fetch(url, { mode: "cors" });
        if (!resp.ok) return;
        const blob = await resp.blob();
        const objectUrl = URL.createObjectURL(blob);
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.onerror = reject;
          image.src = objectUrl;
        });
        map.set(url, img);
      } catch {
        /* 跳过加载失败的图片 */
      }
    }),
  );
  return map;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

/** 简单文本折行：优先按空白断词，超长则按字符 */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const result: string[] = [];
  for (const rawLine of text.split("\n")) {
    let line = "";
    for (const ch of rawLine) {
      const test = line + ch;
      if (ctx.measureText(test).width > maxWidth && line) {
        result.push(line);
        line = ch;
      } else {
        line = test;
      }
    }
    result.push(line);
  }
  return result;
}

function drawText(ctx: CanvasRenderingContext2D, node: UINode, x: number, y: number, w: number, h: number) {
  const c = node.props?.custom ?? {};
  const preset = TEXT_PRESETS[(c.variant as string) ?? "body"] ?? TEXT_PRESETS.body;
  const fontSize = num(c.fontSize) ?? preset.fontSize;
  const fontWeight = num(c.fontWeight) ?? preset.fontWeight;
  const color = (c.color as string) ?? preset.color;
  const lineHeight = num(c.lineHeight) ?? preset.lineHeight;
  const align = ((c.align as string) ?? "left") as CanvasTextAlign;
  const text = node.props?.text ?? "";
  ctx.save();
  ctx.font = `${fontWeight} ${fontSize}px -apple-system, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif`;
  ctx.textBaseline = "top";
  ctx.textAlign = align === "right" ? "right" : align === "center" ? "center" : "left";
  const lines = wrapText(ctx, text, w);
  const step = fontSize * lineHeight;
  lines.forEach((line, index) => {
    if (y + index * step > y + h + fontSize) return;
    if (c.gradText === true) {
      const grad = ctx.createLinearGradient(x, 0, x + w, 0);
      grad.addColorStop(0, (c.gradFrom as string) || "#6366f1");
      grad.addColorStop(1, (c.gradTo as string) || "#ec4899");
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = color;
    }
    const tx = align === "right" ? x + w : align === "center" ? x + w / 2 : x;
    ctx.fillText(line, tx, y + index * step);
  });
  ctx.restore();
}

function drawButton(ctx: CanvasRenderingContext2D, node: UINode, x: number, y: number, w: number, h: number) {
  const variant = (node.props?.custom?.variant as string) ?? "primary";
  ctx.save();
  roundRect(ctx, x, y, w, h, 8);
  if (variant === "primary") {
    const grad = ctx.createLinearGradient(x, y, x + w, y);
    grad.addColorStop(0, "#6366f1");
    grad.addColorStop(1, "#4f46e5");
    ctx.fillStyle = grad;
  } else if (variant === "danger") {
    const grad = ctx.createLinearGradient(x, y, x + w, y);
    grad.addColorStop(0, "#ef4444");
    grad.addColorStop(1, "#e11d48");
    ctx.fillStyle = grad;
  } else if (variant === "secondary") {
    ctx.fillStyle = "#ffffff";
  } else {
    ctx.fillStyle = "rgba(0,0,0,0)";
  }
  ctx.fill();
  if (variant === "secondary") {
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  const fontSize = 14;
  ctx.font = `600 ${fontSize}px -apple-system, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = variant === "secondary" ? "#374151" : variant === "ghost" ? "#4f46e5" : "#ffffff";
  ctx.fillText(node.props?.text ?? "按钮", x + w / 2, y + h / 2);
  ctx.restore();
}

function drawContainer(ctx: CanvasRenderingContext2D, node: UINode, x: number, y: number, w: number, h: number, images: Map<string, HTMLImageElement>) {
  const c = node.props?.custom ?? {};
  const bgType = (c.bgType as string) || "";
  const radius = num(c.radius) ?? 0;
  const borderWidth = num(c.borderWidth) ?? 0;
  const borderColor = (c.borderColor as string) || "#e5e7eb";
  ctx.save();
  roundRect(ctx, x, y, w, h, radius);
  if (bgType === "solid") {
    ctx.fillStyle = (c.bgColor as string) || "#ffffff";
    ctx.fill();
  } else if (bgType === "gradient") {
    const angle = ((num(c.gradAngle) ?? 135) * Math.PI) / 180;
    const cx = x + w / 2;
    const cy = y + h / 2;
    const len = (Math.abs(w * Math.cos(angle)) + Math.abs(h * Math.sin(angle))) / 2;
    const grad = ctx.createLinearGradient(cx - Math.cos(angle) * len, cy - Math.sin(angle) * len, cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
    grad.addColorStop(0, (c.gradFrom as string) || "#6366f1");
    grad.addColorStop(1, (c.gradTo as string) || "#ec4899");
    ctx.fillStyle = grad;
    ctx.fill();
  } else if (bgType === "glass") {
    ctx.fillStyle = hexToRgba((c.bgColor as string) || "#ffffff", 0.55);
    ctx.fill();
  } else if (bgType === "image" && c.bgImage) {
    const img = images.get(c.bgImage as string);
    if (img) {
      ctx.clip();
      drawCover(ctx, img, x, y, w, h);
    }
  } else {
    // 无样式容器：导出时画浅色占位
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = "#d1d5db";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    return;
  }
  if (borderWidth > 0) {
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;
    ctx.stroke();
  }
  ctx.restore();
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const scale = Math.max(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

function drawPlaceholder(ctx: CanvasRenderingContext2D, node: UINode, x: number, y: number, w: number, h: number) {
  ctx.save();
  roundRect(ctx, x, y, w, h, 8);
  // 交互组件（3D 场景/动效等）在静态导出中以带质感的占位块呈现
  const grad = ctx.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, "#f1f2f6");
  grad.addColorStop(1, "#e4e6ee");
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = "#d3d6e0";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = "#8a90a3";
  ctx.font = '11px -apple-system, "Segoe UI", "PingFang SC", sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`${node.props?.text || node.type} · 交互组件见预览`, x + w / 2, y + h / 2);
  ctx.restore();
}

export async function renderPageToCanvas(page: Page, breakpoint: "desktop" | "tablet" | "mobile" = "desktop"): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = page.layout.width * SCALE;
  canvas.height = page.layout.height * SCALE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 上下文不可用");
  ctx.scale(SCALE, SCALE);

  // 白底
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, page.layout.width, page.layout.height);

  // 预加载图片
  const urls = page.nodes
    .map((node) => [node.props?.imageSrc, node.props?.custom?.bgImage as string | undefined])
    .flat()
    .filter((url): url is string => Boolean(url));
  const images = await loadImages(urls);

  const sorted = [...page.nodes].filter((node) => !node.hidden).sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
  for (const node of sorted) {
    const frame = resolveNodeFrame(node, breakpoint);
    const { x, y, width, height } = frame;
    switch (node.type) {
      case "Container":
      case "Section":
      case "Card":
      case "Navbar":
      case "Footer":
        drawContainer(ctx, node, x, y, width, height, images);
        break;
      case "Text":
        drawText(ctx, node, x, y, width, height);
        break;
      case "Button":
        drawButton(ctx, node, x, y, width, height);
        break;
      case "Badge": {
        const palette = BADGE_COLORS[(node.props?.custom?.color as string) ?? "blue"] ?? BADGE_COLORS.blue;
        ctx.save();
        roundRect(ctx, x, y, width, height, height / 2);
        ctx.fillStyle = palette.bg;
        ctx.fill();
        ctx.fillStyle = palette.text;
        ctx.font = '600 11px -apple-system, "Segoe UI", "PingFang SC", sans-serif';
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(node.props?.text ?? "", x + width / 2, y + height / 2);
        ctx.restore();
        break;
      }
      case "Image": {
        const img = node.props?.imageSrc ? images.get(node.props.imageSrc) : undefined;
        ctx.save();
        roundRect(ctx, x, y, width, height, num(node.props?.custom?.radius) ?? 4);
        if (img) {
          ctx.clip();
          drawCover(ctx, img, x, y, width, height);
        } else {
          ctx.fillStyle = "#e5e7eb";
          ctx.fill();
          ctx.fillStyle = "#9ca3af";
          ctx.font = '11px -apple-system, "Segoe UI", sans-serif';
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("图片", x + width / 2, y + height / 2);
        }
        ctx.restore();
        break;
      }
      default:
        drawPlaceholder(ctx, node, x, y, width, height);
    }
  }

  return canvas;
}

export async function exportPageAsPng(page: Page, breakpoint: "desktop" | "tablet" | "mobile" = "desktop"): Promise<void> {
  const canvas = await renderPageToCanvas(page, breakpoint);
  await new Promise<void>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("导出失败"));
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${page.name.replace(/\s+/g, "-")}.png`;
      a.click();
      URL.revokeObjectURL(url);
      resolve();
    }, "image/png");
  });
}
