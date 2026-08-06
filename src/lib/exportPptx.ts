import type { Page } from "@/types/schema";
import { renderPageToCanvas } from "./exportImage";

type PptxConstructor = typeof import("pptxgenjs").default;
let pptxLoader: Promise<PptxConstructor> | null = null;

function loadScript(src: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`浏览器组件加载失败：${src}`));
    document.head.appendChild(script);
  });
}

function loadPptxGen(): Promise<PptxConstructor> {
  const existing = (window as unknown as { PptxGenJS?: PptxConstructor }).PptxGenJS;
  if (existing) return Promise.resolve(existing);
  if (pptxLoader) return pptxLoader;
  pptxLoader = (async () => {
    if (!(window as unknown as { JSZip?: unknown }).JSZip) await loadScript("/vendor/jszip.min.js");
    await loadScript("/vendor/pptxgen.min.js");
    const constructor = (window as unknown as { PptxGenJS?: PptxConstructor }).PptxGenJS;
    if (!constructor) throw new Error("PPTX 浏览器组件加载失败");
    return constructor;
  })();
  return pptxLoader;
}

/**
 * 将项目页面逐页写入 PowerPoint。页面先通过统一画布渲染器生成高清图，
 * 因此 PPTX 与 PNG/PDF/原型共享同一套响应式 frame 语义。
 */
export async function exportProjectAsPptx(pages: Page[], name: string): Promise<void> {
  if (!pages.length) throw new Error("没有可导出的页面");

  // 只在用户点击导出时加载浏览器 bundle，避免 Node API 与首屏包污染。
  const PptxGenJS = await loadPptxGen();
  const pptx = new PptxGenJS();
  const first = pages[0];
  const ratio = first.layout.width / Math.max(1, first.layout.height);
  const slideWidth = ratio >= 1 ? 13.333 : 7.5;
  const slideHeight = slideWidth / ratio;

  pptx.defineLayout({ name: "ROUTECANVAS", width: slideWidth, height: slideHeight });
  pptx.layout = "ROUTECANVAS";
  pptx.author = "RouteCanvas";
  pptx.company = "RouteCanvas";
  pptx.subject = "RouteCanvas design export";
  pptx.title = name || "RouteCanvas";

  for (const page of pages) {
    const canvas = await renderPageToCanvas(page, "desktop");
    const data = canvas.toDataURL("image/png");
    const pageRatio = page.layout.width / Math.max(1, page.layout.height);
    let width = slideWidth;
    let height = width / pageRatio;
    if (height > slideHeight) {
      height = slideHeight;
      width = height * pageRatio;
    }
    const slide = pptx.addSlide();
    slide.background = { color: "FFFFFF" };
    slide.addImage({
      data,
      x: (slideWidth - width) / 2,
      y: (slideHeight - height) / 2,
      w: width,
      h: height,
    });
    slide.addNotes(`RouteCanvas 页面：${page.name}\n路由：${page.route.path}`);
  }

  await pptx.writeFile({ fileName: `${name.replace(/\s+/g, "-") || "routecanvas"}.pptx` });
}
