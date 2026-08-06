/**
 * Deck 技能包生成器 —— 横版幻灯片（1280×720）
 * 产出封面 + 内容页 + 结束页，页间用「下一页」热区按钮连成 transition，
 * 在原型演示模式下可像真实 PPT 一样逐页翻页。
 */
import { useCanvasStore } from "@/store/canvasStore";
import { AURORA, type Theme } from "./esthetics";

type Custom = Record<string, unknown>;

function box(pageId: string, x: number, y: number, w: number, h: number, custom: Custom, z = 0) {
  return useCanvasStore.getState().addNode(pageId, "Container", { position: { x, y }, size: { width: w, height: h }, zIndex: z, props: { custom } });
}

function text(pageId: string, content: string, x: number, y: number, w: number, h: number, custom: Custom = {}, z = 2) {
  return useCanvasStore.getState().addNode(pageId, "Text", { position: { x, y }, size: { width: w, height: h }, zIndex: z, props: { text: content, custom } });
}

function badge(pageId: string, label: string, x: number, y: number, color: string, z = 3) {
  return useCanvasStore.getState().addNode(pageId, "Badge", { position: { x, y }, size: { width: 120, height: 28 }, zIndex: z, props: { text: label, custom: { color } } });
}

function backdrop(pageId: string, t: Theme) {
  if (t.gradFrom && t.gradTo) box(pageId, 0, 0, 1280, 720, { bgType: "gradient", gradFrom: t.gradFrom, gradTo: t.gradTo, gradAngle: 150 });
  else box(pageId, 0, 0, 1280, 720, { bgType: "solid", bgColor: t.bg });
}

/** 每页右下角的「下一页」热区按钮，返回节点 id 用于连线 */
function nextPageHotspot(pageId: string, t: Theme, label = "下一页 →"): string {
  box(pageId, 1080, 640, 152, 44, { bgType: "solid", bgColor: t.surface, radius: 22, borderWidth: 1, borderColor: t.surfaceBorder }, 3);
  const id = text(pageId, label, 1080, 652, 152, 20, { fontSize: 13, fontWeight: 600, color: t.text, align: "center" }, 4);
  return id ?? "";
}

function pageNum(pageId: string, t: Theme, current: number, total: number) {
  text(pageId, `${String(current).padStart(2, "0")} / ${String(total).padStart(2, "0")}`, 64, 648, 120, 24, { fontSize: 13, fontWeight: 700, color: t.subtext }, 2);
}

export interface DeckOutline {
  topic: string;
  subtitle: string;
  sections: Array<{ title: string; points: string[] }>;
  closing: string;
}

export const DEFAULT_OUTLINE: DeckOutline = {
  topic: "产品季度汇报",
  subtitle: "从原型到上线：本季度的设计交付复盘",
  sections: [
    { title: "关键成果", points: ["上线 3 条产品线，NPS 提升 18%", "设计系统覆盖率从 40% 到 92%", "平均交付周期缩短 5.5 天"] },
    { title: "数据洞察", points: ["首屏转化率 4.1% → 6.8%", "移动端跳出率下降 23%", "新用户引导完成率 81%"] },
    { title: "下季度计划", points: ["完成多端组件统一", "建设 AI 辅助评审流程", "沉淀 6 套行业模板"] },
  ],
  closing: "谢谢观看 · 欢迎提问",
};

/**
 * 只搭骨架：创建内容页/结束页 + 「下一页」热区连线，不绘制任何视觉节点。
 * 供 AI 直出布局路径使用：页面结构先行，视觉由 AI 逐页排版。
 */
export function scaffoldDeck(firstPageId: string, outline: DeckOutline = DEFAULT_OUTLINE, origin: { x: number; y: number } = { x: 120, y: 120 }, t: Theme = AURORA): { pageIds: string[] } {
  const store = useCanvasStore.getState();
  const pageIds = [firstPageId];
  const hotspots: Array<{ pageId: string; nodeId: string }> = [{ pageId: firstPageId, nodeId: nextPageHotspot(firstPageId, t) }];

  outline.sections.forEach((section, index) => {
    const pageId = store.addPage({
      name: `幻灯片 ${index + 2} · ${section.title}`,
      path: `/deck-${Date.now().toString(36)}-${index + 2}`,
      width: 1280, height: 720,
      x: origin.x + (index + 1) * 1360, y: origin.y,
    });
    pageIds.push(pageId);
    hotspots.push({ pageId, nodeId: nextPageHotspot(pageId, t, index === outline.sections.length - 1 ? "结束页 →" : "下一页 →") });
  });

  const endId = store.addPage({
    name: "幻灯片 · 结束",
    path: `/deck-${Date.now().toString(36)}-end`,
    width: 1280, height: 720,
    x: origin.x + (outline.sections.length + 1) * 1360, y: origin.y,
  });
  pageIds.push(endId);

  for (let i = 0; i < hotspots.length - 1; i += 1) {
    store.addTransition(
      { pageId: hotspots[i].pageId, nodeId: hotspots[i].nodeId, event: "click" },
      { pageId: pageIds[i + 1] },
    );
  }
  return { pageIds };
}

/**
 * 生成完整 Deck：封面 + N 个内容页 + 结束页，并自动连成翻页 transition。
 * @param firstPageId 已由调用方创建好的封面页 id（1280×720）
 * @param origin 铺排原点（封面页坐标），后续页向右依次排开，避免叠放
 */
export function buildDeck(firstPageId: string, t: Theme = AURORA, outline: DeckOutline = DEFAULT_OUTLINE, origin: { x: number; y: number } = { x: 120, y: 120 }): { pageIds: string[] } {
  const store = useCanvasStore.getState();
  const total = outline.sections.length + 2;
  /** 幽灵大字的低对比色：暗色主题微微亮一点，亮色主题微微暗一点 */
  const ghost = t.dark ? "#1a1d29" : "#e9e8ee";

  /* 封面 */
  backdrop(firstPageId, t);
  // 氛围光影：右上主光晕 + 左下辅光晕，让页面不再平坦
  box(firstPageId, 880, -160, 520, 520, { bgType: "gradient", gradFrom: t.accent, gradTo: t.bg, gradAngle: 150, radius: 260 }, 1);
  box(firstPageId, -110, 560, 300, 300, { bgType: "gradient", gradFrom: t.accent2, gradTo: t.bg, gradAngle: 135, radius: 150 }, 1);
  box(firstPageId, 64, 64, 52, 52, { bgType: "gradient", gradFrom: t.accent, gradTo: t.accent2, gradAngle: 135, radius: 14 }, 2);
  text(firstPageId, outline.subtitle ? "DECK · ROUTECANVAS" : "DECK", 132, 80, 400, 20, { fontSize: 12, fontWeight: 700, letterSpacing: 3, color: t.subtext }, 2);
  badge(firstPageId, "2026 · Q3", 64, 216, "purple", 2);
  text(firstPageId, outline.topic, 64, 272, 900, 120, { variant: "display", fontSize: 76, fontWeight: t.displayWeight ?? 800, letterSpacing: t.displayTracking, color: t.text, lineHeight: 1.08 }, 2);
  text(firstPageId, outline.subtitle, 66, 420, 700, 30, { fontSize: 18, color: t.subtext }, 2);
  box(firstPageId, 66, 500, 96, 6, { bgType: "gradient", gradFrom: t.accent, gradTo: t.accent2, gradAngle: 90, radius: 3 }, 2);
  text(firstPageId, "汇报人 · RouteCanvas 设计团队", 66, 540, 400, 22, { fontSize: 13, color: t.subtext }, 2);
  pageNum(firstPageId, t, 1, total);
  const hotspots: Array<{ pageId: string; nodeId: string }> = [{ pageId: firstPageId, nodeId: nextPageHotspot(firstPageId, t) }];

  /* 内容页 */
  const pageIds = [firstPageId];
  outline.sections.forEach((section, index) => {
    const pageId = store.addPage({
      name: `幻灯片 ${index + 2} · ${section.title}`,
      path: `/deck-${Date.now().toString(36)}-${index + 2}`,
      width: 1280, height: 720,
      x: origin.x + (index + 1) * 1360, y: origin.y,
    });
    pageIds.push(pageId);
    backdrop(pageId, t);
    // 内容页右上角氛围光，避免平坦
    box(pageId, 980, -140, 380, 380, { bgType: "gradient", gradFrom: t.accent, gradTo: t.bg, gradAngle: 150, radius: 190, opacity: t.dark ? 0.35 : 0.12 }, 1);
    // 幽灵大序号：右侧超大低对比数字，建立编辑感层级
    text(pageId, `0${index + 1}`, 820, 120, 400, 320, { fontSize: 260, fontWeight: 800, color: ghost, align: "right", lineHeight: 1 }, 1);
    text(pageId, `0${index + 1}`, 64, 80, 200, 88, { fontSize: 64, fontWeight: 800, color: t.accent }, 2);
    text(pageId, section.title, 64, 190, 800, 56, { variant: "h1", fontSize: 44, fontWeight: 800, letterSpacing: t.displayTracking, color: t.text }, 2);
    box(pageId, 66, 268, 96, 5, { bgType: "gradient", gradFrom: t.accent, gradTo: t.accent2, gradAngle: 90, radius: 3 }, 2);
    section.points.forEach((point, pi) => {
      const y = 330 + pi * 104;
      box(pageId, 64, y, 1152, 84, { bgType: t.id === "glass" ? "glass" : "solid", bgColor: t.id === "glass" ? "#FFFFFF" : t.surface, radius: t.radius, borderWidth: 1, borderColor: t.surfaceBorder }, 1);
      // 带序号的渐变圆片
      box(pageId, 92, y + 28, 28, 28, { bgType: "gradient", gradFrom: t.accent, gradTo: t.accent2, gradAngle: 135, radius: 14 }, 2);
      text(pageId, `${pi + 1}`, 92, y + 33, 28, 18, { fontSize: 13, fontWeight: 800, color: "#ffffff", align: "center" }, 3);
      text(pageId, point, 144, y + 30, 1000, 24, { fontSize: 17, fontWeight: 600, color: t.text }, 2);
    });
    pageNum(pageId, t, index + 2, total);
    if (index < outline.sections.length - 1) {
      hotspots.push({ pageId, nodeId: nextPageHotspot(pageId, t) });
    } else {
      hotspots.push({ pageId, nodeId: nextPageHotspot(pageId, t, "结束页 →") });
    }
  });

  /* 结束页 */
  const endId = store.addPage({
    name: "幻灯片 · 结束",
    path: `/deck-${Date.now().toString(36)}-end`,
    width: 1280, height: 720,
    x: origin.x + (outline.sections.length + 1) * 1360, y: origin.y,
  });
  pageIds.push(endId);
  backdrop(endId, t);
  // 结束页中央光晕，托住结束语
  box(endId, 440, 140, 400, 400, { bgType: "gradient", gradFrom: t.accent, gradTo: t.bg, gradAngle: 150, radius: 200 }, 1);
  text(endId, outline.closing, 190, 280, 900, 100, { variant: "display", fontSize: 64, fontWeight: t.displayWeight ?? 800, letterSpacing: t.displayTracking, color: t.text, align: "center" }, 2);
  box(endId, 592, 410, 96, 6, { bgType: "gradient", gradFrom: t.accent, gradTo: t.accent2, gradAngle: 90, radius: 3 }, 2);
  text(endId, "RouteCanvas · 用对话完成的设计演示", 390, 450, 500, 24, { fontSize: 14, color: t.subtext, align: "center" }, 2);
  pageNum(endId, t, total, total);

  /* 连成翻页 transition */
  for (let i = 0; i < hotspots.length - 1; i += 1) {
    store.addTransition(
      { pageId: hotspots[i].pageId, nodeId: hotspots[i].nodeId, event: "click" },
      { pageId: pageIds[i + 1] },
    );
  }

  return { pageIds };
}
