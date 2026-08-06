/**
 * Skill 实用工具 —— 直接作用于当前画布的技能
 * critique：五维自评（对齐 OpenDesign 的 critique skill，但直接产出可视化评审页）
 * darkMode：一键暗色模式
 * autoAlign：全节点 8px 网格对齐
 */
import { useCanvasStore } from "@/store/canvasStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import type { Page, UINode } from "@/types/schema";

export interface SkillResult {
  message: string;
  pageId?: string;
}

function activePage(): Page | null {
  const activePageId = useWorkspaceStore.getState().activePageId;
  const pages = useCanvasStore.getState().pages;
  return pages.find((p) => p.id === activePageId) ?? pages[0] ?? null;
}

/* ---------- 设计评审 critique ---------- */
interface Dimension {
  label: string;
  score: number; // 0-5
  tip: string;
}

function clampScore(value: number): number {
  return Math.max(1, Math.min(5, Math.round(value)));
}

export function runCritique(): SkillResult {
  const page = activePage();
  if (!page || page.nodes.length === 0) return { message: "当前没有可评审的页面内容" };

  const nodes = page.nodes.filter((n) => !n.hidden);
  const dims: Dimension[] = [];

  // 1. 网格秩序：节点坐标/尺寸对齐 8px 的比例
  const aligned = nodes.filter((n) => [n.position.x, n.position.y, n.size.width, n.size.height].every((v) => v % 8 === 0)).length;
  const alignRate = aligned / nodes.length;
  dims.push({
    label: "网格秩序",
    score: clampScore(1 + alignRate * 4),
    tip: alignRate > 0.8 ? "坐标高度对齐 8px 网格，工程感强" : `${Math.round((1 - alignRate) * 100)}% 的节点偏离 8px 网格，试试「自动对齐」技能`,
  });

  // 2. 文字层级：不同字号档位的数量
  const sizes = new Set<number>();
  nodes.filter((n) => n.type === "Text").forEach((n) => sizes.add(Number(n.props?.custom?.fontSize ?? 14)));
  dims.push({
    label: "文字层级",
    score: clampScore(sizes.size >= 4 ? 5 : sizes.size),
    tip: sizes.size >= 4 ? "字号层级丰富，阅读节奏好" : `仅 ${sizes.size} 档字号，建议拉开标题与正文的对比`,
  });

  // 3. 色彩克制：唯一颜色数量
  const colors = new Set<string>();
  nodes.forEach((n) => {
    const c = n.props?.custom ?? {};
    ["bgColor", "color", "gradFrom", "gradTo", "borderColor"].forEach((key) => {
      const value = c[key];
      if (typeof value === "string" && value.startsWith("#")) colors.add(value.toLowerCase());
    });
  });
  dims.push({
    label: "色彩克制",
    score: clampScore(colors.size <= 4 ? 5 : colors.size <= 7 ? 4 : colors.size <= 10 ? 3 : 2),
    tip: colors.size <= 7 ? "色板集中，品牌感统一" : `使用了 ${colors.size} 种颜色，建议收敛到 6 色以内`,
  });

  // 4. 交互完备：按钮与连线
  const btnCount = nodes.filter((n) => n.type === "Button").length;
  const transCount = useCanvasStore.getState().transitions.filter((t) => t.source.pageId === page.id).length;
  dims.push({
    label: "交互完备",
    score: clampScore(Math.min(5, btnCount + transCount)),
    tip: btnCount + transCount >= 3 ? "行动点充足，流程可走通" : "行动点偏少，补充按钮或页面连线让原型可演示",
  });

  // 5. 留白呼吸：节点是否贴死画板边缘
  const { width, height } = page.layout;
  const marginNodes = nodes.filter((n) => n.position.x >= 20 && n.position.y >= 20 && n.position.x + n.size.width <= width - 20 && n.position.y + n.size.height <= height - 20);
  const innerRate = nodes.length ? marginNodes.length / nodes.length : 0;
  dims.push({
    label: "留白呼吸",
    score: clampScore(innerRate > 0.5 ? 5 : innerRate > 0.2 ? 4 : innerRate > 0.05 ? 3 : 2),
    tip: innerRate > 0.3 ? "内容与边缘保持呼吸感" : "内容贴边过多，给四周留出安全边距",
  });

  const total = dims.reduce((sum, d) => sum + d.score, 0);
  const grade = total >= 22 ? "A · 惊艳" : total >= 18 ? "B · 专业" : total >= 13 ? "C · 合格" : "D · 待打磨";

  // 产出评审页（铺排到现有页面右侧，不叠放）
  const store = useCanvasStore.getState();
  const rightEdge = store.pages.reduce((max, p) => Math.max(max, p.layout.x + p.layout.width), 0);
  const topY = store.pages.length ? Math.min(...store.pages.map((p) => p.layout.y)) : 120;
  const reviewPageId = store.addPage({ name: "设计评审", path: `/critique-${Date.now().toString(36)}`, width: 900, height: 760, x: store.pages.length ? rightEdge + 240 : 120, y: topY });

  const addBox = (x: number, y: number, w: number, h: number, custom: Record<string, unknown>, z = 0) =>
    store.addNode(reviewPageId, "Container", { position: { x, y }, size: { width: w, height: h }, zIndex: z, props: { custom } });
  const addText = (content: string, x: number, y: number, w: number, h: number, custom: Record<string, unknown> = {}, z = 2) =>
    store.addNode(reviewPageId, "Text", { position: { x, y }, size: { width: w, height: h }, zIndex: z, props: { text: content, custom } });

  addBox(0, 0, 900, 760, { bgType: "solid", bgColor: "#0B0D14" });
  addText(`「${page.name}」五维评审`, 64, 56, 560, 40, { variant: "h1", fontSize: 30, fontWeight: 800, color: "#F3F5F9" });
  addText(`总分 ${total} / 25 · ${grade}`, 64, 112, 400, 22, { fontSize: 14, fontWeight: 600, color: "#A5B4FC" });
  addBox(680, 56, 156, 100, { bgType: "gradient", gradFrom: "#6366f1", gradTo: "#ec4899", gradAngle: 135, radius: 18 }, 1);
  addText(grade.slice(0, 1), 680, 68, 156, 76, { fontSize: 52, fontWeight: 800, color: "#FFFFFF", align: "center" }, 2);

  dims.forEach((dim, index) => {
    const y = 190 + index * 96;
    addText(dim.label, 64, y, 140, 24, { fontSize: 15, fontWeight: 700, color: "#F3F5F9" });
    addBox(220, y + 6, 360, 12, { bgType: "solid", bgColor: "#1C2130", radius: 6 }, 1);
    addBox(220, y + 6, (dim.score / 5) * 360, 12, { bgType: "gradient", gradFrom: "#6366f1", gradTo: "#ec4899", gradAngle: 90, radius: 6 }, 2);
    addText(`${dim.score}.0`, 596, y, 40, 24, { fontSize: 15, fontWeight: 800, color: "#F3F5F9" });
    addText(dim.tip, 220, y + 30, 460, 20, { fontSize: 11, color: "#7C8596" });
  });

  addText("由 RouteCanvas critique 技能自动生成 · 数据来自当前画布结构", 64, 700, 600, 18, { fontSize: 11, color: "#5F6878" });

  return { message: `评审完成：总分 ${total}/25（${grade}）`, pageId: reviewPageId };
}

/* ---------- 暗色模式 ---------- */
const LIGHT_TO_DARK: Record<string, string> = {
  "#ffffff": "#14161F", "#fff": "#14161F", "#fafafa": "#14161F", "#f9fafb": "#171A24",
  "#f7f7fb": "#14161F", "#f6f7f6": "#12151C", "#f5f5f4": "#171A24", "#f4f4f2": "#14161F",
  "#f4f0e8": "#16130E", "#fafaff": "#14161F", "#fff8f3": "#1A1410", "#f2efe6": "#15130E",
  "#ededf2": "#0E1116", "#f4f2ff": "#151327", "#f5f2ec": "#17140E", "#edeef3": "#14161F",
};
const DARK_TO_LIGHT_TEXT: Record<string, string> = {
  "#111827": "#F3F5F9", "#14161f": "#F3F5F9", "#171717": "#F3F5F9", "#1c1b17": "#F3F5F9",
  "#211b4b": "#E4E1FF", "#201a4c": "#E4E1FF", "#16211b": "#EBF3EC", "#302b5c": "#D8D1FF",
  "#372b28": "#F5EBE7", "#4d2e2b": "#F5DAD4", "#1d241c": "#EDF2EA", "#1f2937": "#F3F5F9",
  "#374151": "#C7CDDF", "#4b5563": "#A7B0C2", "#57534e": "#C9C4B8",
  "#6b7280": "#8A93AC", "#69667a": "#9A97AC", "#6a6779": "#9A97AC", "#64645e": "#A3A39A",
  "#6e6961": "#A6A095", "#748078": "#8E9A92", "#78756e": "#9C998F", "#78716c": "#A39E97",
  "#9ca3af": "#7C8596", "#927a72": "#A08A82", "#8e7770": "#9C8A83", "#a2756d": "#B08A82",
  "#4d4a45": "#B8B3A8", "#68746c": "#97A29A", "#77817a": "#8E978F", "#8a8a83": "#7C7C75",
};

export function runDarkMode(): SkillResult {
  const page = activePage();
  if (!page) return { message: "当前没有页面" };
  const store = useCanvasStore.getState();

  // 判断当前是否已是暗色：取面积最大的容器底色
  const root = [...page.nodes]
    .filter((n) => n.type === "Container" || n.type === "Section")
    .sort((a, b) => b.size.width * b.size.height - a.size.width * a.size.height)[0];
  const rootColor = String(root?.props?.custom?.bgColor ?? "#ffffff").toLowerCase();
  const toDark = !Object.keys(DARK_TO_LIGHT_TEXT).includes(rootColor) || rootColor === "#ffffff" || LIGHT_TO_DARK[rootColor] !== undefined;

  let changed = 0;
  page.nodes.forEach((node) => {
    const custom = { ...(node.props?.custom ?? {}) };
    let dirty = false;
    (["bgColor", "borderColor"] as const).forEach((key) => {
      const value = typeof custom[key] === "string" ? (custom[key] as string).toLowerCase() : undefined;
      if (!value) return;
      if (toDark && LIGHT_TO_DARK[value]) { custom[key] = LIGHT_TO_DARK[value]; dirty = true; }
      if (!toDark) {
        const back = Object.keys(LIGHT_TO_DARK).find((k) => LIGHT_TO_DARK[k] === value);
        if (back) { custom[key] = back; dirty = true; }
      }
    });
    if (typeof custom.color === "string") {
      const value = custom.color.toLowerCase();
      if (toDark && DARK_TO_LIGHT_TEXT[value]) { custom.color = DARK_TO_LIGHT_TEXT[value]; dirty = true; }
      if (!toDark) {
        const back = Object.keys(DARK_TO_LIGHT_TEXT).find((k) => DARK_TO_LIGHT_TEXT[k] === value);
        if (back) { custom.color = back; dirty = true; }
      }
    }
    if (dirty) {
      changed += 1;
      store.updateNodeProps(page.id, node.id, { custom });
    }
  });

  return { message: changed ? `已${toDark ? "切换暗色" : "还原亮色"}，调整 ${changed} 个节点` : "页面没有可切换的颜色（多为渐变或图片背景）" };
}

/* ---------- 自动对齐 ---------- */
export function runAutoAlign(): SkillResult {
  const page = activePage();
  if (!page) return { message: "当前没有页面" };
  const store = useCanvasStore.getState();
  const snap = (v: number) => Math.round(v / 8) * 8;
  let moved = 0;
  page.nodes.forEach((node) => {
    const frame = { x: snap(node.position.x), y: snap(node.position.y), width: Math.max(8, snap(node.size.width)), height: Math.max(8, snap(node.size.height)) };
    if (frame.x !== node.position.x || frame.y !== node.position.y || frame.width !== node.size.width || frame.height !== node.size.height) {
      moved += 1;
      store.updateNode(page.id, node.id, { position: { x: frame.x, y: frame.y }, size: { width: frame.width, height: frame.height } });
    }
  });
  return { message: moved ? `已对齐 ${moved} 个节点到 8px 网格` : "所有节点已在网格上，无需调整" };
}

/* ---------- 页面统计 ---------- */
export function runPageStats(): SkillResult {
  const page = activePage();
  if (!page) return { message: "当前没有页面" };
  const byType = new Map<string, number>();
  page.nodes.filter((n) => !n.hidden).forEach((n) => byType.set(n.type, (byType.get(n.type) ?? 0) + 1));
  const lines = [...byType.entries()].sort((a, b) => b[1] - a[1]).map(([type, count]) => `${type} × ${count}`).join("、");
  const transCount = useCanvasStore.getState().transitions.filter((t) => t.source.pageId === page.id).length;
  return { message: `「${page.name}」：${page.nodes.length} 个节点（${lines}）· ${transCount} 条跳转连线` };
}

export type { UINode };
