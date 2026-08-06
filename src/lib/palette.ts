/**
 * 调色板提取工具
 * 1. 从用户上传的图片中提取主色（频率量化法，零依赖）
 * 2. 从当前画布节点中扫描已使用的颜色
 */
import { useCanvasStore } from "@/store/canvasStore";

/** 频率量化取色：降采样 → 4bit 通道分桶 → 取 top N */
export function extractPaletteFromImage(file: File, maxColors = 6): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(1, 96 / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas 上下文不可用");
        ctx.drawImage(img, 0, 0, w, h);
        const data = ctx.getImageData(0, 0, w, h).data;
        const buckets = new Map<number, { count: number; r: number; g: number; b: number }>();
        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3];
          if (a < 128) continue;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
          const bucket = buckets.get(key);
          if (bucket) {
            bucket.count += 1;
            bucket.r += r;
            bucket.g += g;
            bucket.b += b;
          } else {
            buckets.set(key, { count: 1, r, g, b });
          }
        }
        const colors = [...buckets.values()]
          .sort((a, b) => b.count - a.count)
          .slice(0, maxColors * 3)
          .map((bucket) => ({
            hex: rgbToHex(Math.round(bucket.r / bucket.count), Math.round(bucket.g / bucket.count), Math.round(bucket.b / bucket.count)),
            count: bucket.count,
          }));
        // 去重近似色
        const picked: string[] = [];
        for (const color of colors) {
          if (picked.length >= maxColors) break;
          if (!picked.some((existing) => colorDistance(existing, color.hex) < 60)) picked.push(color.hex);
        }
        resolve(picked);
      } catch (e) {
        reject(e);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("图片加载失败"));
    };
    img.src = url;
  });
}

/** 扫描当前画布所有节点，收集已使用的颜色（去重、按出现频率排序） */
export function extractPaletteFromCanvas(maxColors = 10): string[] {
  const pages = useCanvasStore.getState().pages;
  const counts = new Map<string, number>();
  const record = (value: unknown) => {
    if (typeof value !== "string") return;
    const match = value.match(/^#[0-9a-fA-F]{3,8}$/);
    if (!match) return;
    const hex = value.toLowerCase();
    counts.set(hex, (counts.get(hex) ?? 0) + 1);
  };
  const scanCustom = (custom: Record<string, unknown> | undefined) => {
    if (!custom) return;
    for (const [key, value] of Object.entries(custom)) {
      if (/color|bg|border|shadow/i.test(key)) record(value);
    }
  };
  for (const page of pages) {
    for (const node of page.nodes) {
      scanCustom(node.props?.custom);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxColors)
    .map(([hex]) => hex);
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function colorDistance(hexA: string, hexB: string): number {
  const parse = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const [r1, g1, b1] = parse(normalizeHex(hexA));
  const [r2, g2, b2] = parse(normalizeHex(hexB));
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

function normalizeHex(hex: string): string {
  const raw = hex.replace("#", "");
  if (raw.length === 3) return raw.split("").map((c) => c + c).join("");
  return raw.slice(0, 6);
}
