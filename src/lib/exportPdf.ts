/**
 * 项目导出为 PDF —— 逐页渲染后按各页原始尺寸拼入 PDF
 * Deck 幻灯片、混合尺寸页面都能正确分页输出。
 */
import type { jsPDF } from "jspdf";
import type { Page } from "@/types/schema";
import { renderPageToCanvas } from "./exportImage";

export async function exportProjectAsPdf(pages: Page[], name: string): Promise<void> {
  if (!pages.length) throw new Error("没有可导出的页面");
  // 动态导入，避免 jspdf 进入首屏包
  const { jsPDF } = await import("jspdf");
  let pdf: jsPDF | null = null;
  for (const page of pages) {
    const canvas = await renderPageToCanvas(page, "desktop");
    const w = page.layout.width;
    const h = page.layout.height;
    const orientation = w >= h ? "landscape" : "portrait";
    if (!pdf) {
      pdf = new jsPDF({ orientation, unit: "px", format: [w, h], compress: true });
    } else {
      pdf.addPage([w, h], orientation);
    }
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, w, h);
  }
  if (!pdf) throw new Error("PDF 生成失败");
  pdf.save(`${name.replace(/\s+/g, "-") || "routecanvas"}.pdf`);
}
