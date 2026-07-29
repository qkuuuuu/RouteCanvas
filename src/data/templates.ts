import { useCanvasStore } from "@/store/canvasStore";
import { createCanvas, switchCanvas } from "@/lib/canvasManager";

export type TemplateCategory = "品牌官网" | "产品发布" | "SaaS" | "数据工作台" | "移动应用";
export type TemplateKind = "editorial" | "product" | "dashboard" | "mobile";

export interface CanvasTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  accent: string;
  kind: TemplateKind;
  preview: "studio" | "launch" | "saas" | "commerce" | "dashboard" | "mobile";
}

// These are deliberate starting points, not variations of the same wireframe.
export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  { id: "atelier-noir", name: "Atelier Noir", category: "品牌官网", description: "为设计工作室准备的暗调编辑式主页", accent: "#D8FF5E", kind: "editorial", preview: "studio" },
  { id: "orbit-launch", name: "Orbit One", category: "产品发布", description: "高端硬件与数字产品的发布叙事", accent: "#FF4D2E", kind: "product", preview: "launch" },
  { id: "muse-ai", name: "Muse AI", category: "SaaS", description: "克制、清晰的 AI 协作产品首页", accent: "#6D5DFB", kind: "product", preview: "saas" },
  { id: "form-market", name: "Form / Market", category: "产品发布", description: "以产品质感和转化为核心的商业页面", accent: "#E8502A", kind: "product", preview: "commerce" },
  { id: "signal-ops", name: "Signal Ops", category: "数据工作台", description: "面向运营团队的高密度业务工作台", accent: "#22C55E", kind: "dashboard", preview: "dashboard" },
  { id: "pace-mobile", name: "Pace", category: "移动应用", description: "一款运动恢复应用的欢迎与今日计划页", accent: "#FE5E50", kind: "mobile", preview: "mobile" },
];

type Custom = Record<string, unknown>;

function addContainer(pageId: string, x: number, y: number, width: number, height: number, custom: Custom, zIndex = 0) {
  return useCanvasStore.getState().addNode(pageId, "Container", { position: { x, y }, size: { width, height }, zIndex, props: { custom } });
}

function addText(pageId: string, text: string, x: number, y: number, width: number, height: number, custom: Custom = {}, zIndex = 2) {
  return useCanvasStore.getState().addNode(pageId, "Text", { position: { x, y }, size: { width, height }, zIndex, props: { text, custom } });
}

function addButton(pageId: string, text: string, x: number, y: number, width: number, height: number, variant: string = "primary", zIndex = 3) {
  return useCanvasStore.getState().addNode(pageId, "Button", { position: { x, y }, size: { width, height }, zIndex, props: { text, custom: { variant } } });
}

function addImage(pageId: string, src: string, x: number, y: number, width: number, height: number, zIndex = 1) {
  return useCanvasStore.getState().addNode(pageId, "Image", { position: { x, y }, size: { width, height }, zIndex, props: { imageSrc: src, text: "模板图片" } });
}

function addMark(pageId: string, text: string, x: number, y: number, color: string, zIndex = 3) {
  return useCanvasStore.getState().addNode(pageId, "Badge", { position: { x, y }, size: { width: 108, height: 24 }, zIndex, props: { text, custom: { color } } });
}

function createEditorial(pageId: string) {
  addContainer(pageId, 0, 0, 1200, 820, { bgType: "solid", bgColor: "#11110F" });
  addContainer(pageId, 806, 0, 394, 820, { bgType: "solid", bgColor: "#D8FF5E" }, 1);
  addText(pageId, "ATELIER / NOIR", 52, 38, 250, 24, { color: "#F4F4EE", fontWeight: 700, fontSize: 13, letterSpacing: 1.2 });
  addText(pageId, "Independent\ndigital practice", 52, 146, 670, 196, { variant: "display", color: "#F4F4EE", fontSize: 68, fontWeight: 700, lineHeight: 0.98 });
  addText(pageId, "We shape identities and interfaces for cultural companies with an appetite for detail.", 56, 386, 438, 72, { color: "#B5B5AD", fontSize: 17, lineHeight: 1.55 });
  addButton(pageId, "查看案例", 56, 510, 132, 46, "secondary");
  addText(pageId, "Selected work\n2026 / 01", 842, 74, 282, 72, { variant: "h2", color: "#11110F", fontSize: 29, lineHeight: 1.05 });
  addContainer(pageId, 842, 218, 286, 386, { bgType: "solid", bgColor: "#151515", radius: 3, shadow: "lg", shadowColor: "#202020" }, 2);
  addImage(pageId, "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=800&q=85", 858, 234, 254, 270, 3);
  addText(pageId, "Morrow House\nIdentity & space", 858, 526, 222, 48, { color: "#F4F4EE", fontSize: 15, fontWeight: 600, lineHeight: 1.35 }, 3);
  addText(pageId, "Scroll to explore", 56, 756, 180, 20, { color: "#8A8A83", fontSize: 12 }, 3);
  addText(pageId, "01", 1086, 742, 44, 36, { color: "#11110F", fontSize: 28, fontWeight: 700, align: "right" }, 3);
}

function createLaunch(pageId: string) {
  addContainer(pageId, 0, 0, 1200, 820, { bgType: "solid", bgColor: "#F5F2EC" });
  addContainer(pageId, 0, 0, 1200, 92, { bgType: "solid", bgColor: "#F5F2EC", borderWidth: 1, borderColor: "#DED9D0" }, 1);
  addText(pageId, "ORBIT", 52, 34, 120, 26, { fontSize: 18, fontWeight: 800, letterSpacing: 1.5, color: "#171717" });
  addText(pageId, "Objects   Story   Support", 768, 38, 248, 20, { fontSize: 13, color: "#4D4A45", align: "right" });
  addText(pageId, "A calmer way\nto listen.", 54, 176, 550, 144, { variant: "display", fontSize: 64, fontWeight: 800, lineHeight: 0.98, color: "#171717" });
  addText(pageId, "Orbit One turns an ordinary room into a generous, spatial sound experience.", 58, 356, 370, 56, { fontSize: 16, color: "#6E6961", lineHeight: 1.5 });
  addButton(pageId, "预约体验", 58, 458, 138, 46, "primary");
  addMark(pageId, "NEW / 2026", 58, 126, "red");
  addContainer(pageId, 652, 124, 472, 586, { bgType: "solid", bgColor: "#FF4D2E", radius: 2 }, 1);
  addImage(pageId, "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=1000&q=85", 680, 150, 416, 512, 2);
  addText(pageId, "One object.\nEndless detail.", 816, 736, 300, 42, { fontSize: 16, fontWeight: 600, color: "#171717", align: "right", lineHeight: 1.15 });
}

function createSaas(pageId: string) {
  addContainer(pageId, 0, 0, 1200, 820, { bgType: "solid", bgColor: "#FAFAFF" });
  addText(pageId, "muse", 52, 35, 100, 26, { fontSize: 22, fontWeight: 800, color: "#211B4B" });
  addText(pageId, "Product  ·  Changelog  ·  Customers", 388, 39, 356, 18, { fontSize: 13, color: "#69667A", align: "center" });
  addButton(pageId, "开始使用", 1018, 28, 126, 38, "primary");
  addMark(pageId, "AI FOR TEAMS", 548, 136, "purple");
  addText(pageId, "Work in context.\nMove with clarity.", 190, 184, 820, 140, { variant: "display", fontSize: 62, fontWeight: 800, color: "#201A4C", align: "center", lineHeight: 1.02 });
  addText(pageId, "Muse connects the thinking, decisions and work your team needs to move forward.", 332, 350, 536, 54, { color: "#6A6779", fontSize: 16, align: "center", lineHeight: 1.5 });
  addButton(pageId, "创建你的空间", 512, 436, 176, 48, "primary");
  addContainer(pageId, 184, 568, 832, 192, { bgType: "solid", bgColor: "#FFFFFF", radius: 18, shadow: "lg", shadowColor: "#6D5DFB", borderWidth: 1, borderColor: "#E8E5FF" }, 1);
  addContainer(pageId, 212, 594, 206, 138, { bgType: "solid", bgColor: "#F1EFFF", radius: 12 }, 2);
  addText(pageId, "Launch plan", 230, 614, 150, 20, { fontSize: 13, fontWeight: 700, color: "#302B5C" }, 3);
  addText(pageId, "12 ideas aligned\nthis week", 230, 650, 150, 42, { fontSize: 21, fontWeight: 700, color: "#302B5C", lineHeight: 1.1 }, 3);
  addContainer(pageId, 444, 594, 260, 138, { bgType: "solid", bgColor: "#211B4B", radius: 12 }, 2);
  addText(pageId, "Project signal", 466, 614, 180, 20, { fontSize: 13, fontWeight: 600, color: "#D8D1FF" }, 3);
  addText(pageId, "On track", 466, 654, 180, 28, { fontSize: 26, fontWeight: 700, color: "#FFFFFF" }, 3);
  addContainer(pageId, 730, 594, 260, 138, { bgType: "solid", bgColor: "#F7F7FB", radius: 12 }, 2);
  addText(pageId, "Next review\nThursday, 10:30", 752, 620, 188, 50, { fontSize: 16, fontWeight: 650, color: "#302B5C", lineHeight: 1.35 }, 3);
}

function createCommerce(pageId: string) {
  addContainer(pageId, 0, 0, 1200, 820, { bgType: "solid", bgColor: "#F4F0E8" });
  addText(pageId, "FORM", 54, 39, 120, 22, { fontSize: 17, fontWeight: 800, letterSpacing: 2, color: "#1D241C" });
  addText(pageId, "Objects for slower rituals", 54, 82, 300, 20, { fontSize: 12, color: "#78756E" });
  addText(pageId, "Made to be\nheld every day.", 54, 214, 472, 118, { variant: "display", fontSize: 57, fontWeight: 750, color: "#1D241C", lineHeight: 1.02 });
  addText(pageId, "A collection of considered objects for the home, designed in small batches.", 58, 366, 380, 52, { fontSize: 16, color: "#64645E", lineHeight: 1.5 });
  addButton(pageId, "探索系列", 58, 466, 128, 44, "primary");
  addContainer(pageId, 590, 72, 554, 676, { bgType: "solid", bgColor: "#D7D0C3", radius: 2 }, 1);
  addImage(pageId, "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=1100&q=85", 618, 100, 498, 620, 2);
  addText(pageId, "No. 04 / Ceramic series", 58, 720, 290, 20, { fontSize: 13, fontWeight: 650, color: "#1D241C" });
  addText(pageId, "SHOP  +", 1040, 39, 104, 20, { fontSize: 12, fontWeight: 700, color: "#1D241C", align: "right" });
}

function createDashboard(pageId: string) {
  addContainer(pageId, 0, 0, 1200, 820, { bgType: "solid", bgColor: "#F6F7F6" });
  addContainer(pageId, 0, 0, 220, 820, { bgType: "solid", bgColor: "#10241D" }, 1);
  addText(pageId, "signal", 28, 34, 130, 24, { fontSize: 20, fontWeight: 800, color: "#F4FBF5" }, 2);
  addText(pageId, "OVERVIEW\nACTIVITY\nCUSTOMERS\nREPORTS", 30, 128, 132, 132, { fontSize: 12, fontWeight: 600, color: "#A4B6AA", lineHeight: 2.55 }, 2);
  addContainer(pageId, 28, 712, 164, 72, { bgType: "solid", bgColor: "#1D362C", radius: 8 }, 2);
  addText(pageId, "Live workspace\nAll systems normal", 42, 728, 132, 36, { fontSize: 11, color: "#D8E7DB", lineHeight: 1.5 }, 3);
  addText(pageId, "Good morning, Yara", 260, 44, 400, 36, { variant: "h1", fontSize: 28, fontWeight: 750, color: "#16211B" });
  addText(pageId, "Tue, 28 July  ·  Last updated just now", 262, 88, 360, 18, { fontSize: 12, color: "#77817A" });
  const stats = [["Active revenue", "$284,120", "#E6F7EB"], ["Conversion", "5.8%", "#EEF0FF"], ["At risk", "18", "#FFF1E9"]];
  stats.forEach(([label, value, bg], index) => {
    const x = 260 + index * 294;
    addContainer(pageId, x, 142, 266, 126, { bgType: "solid", bgColor: "#FFFFFF", radius: 10, borderWidth: 1, borderColor: "#E3E7E4" }, 1);
    addText(pageId, label, x + 18, 162, 190, 18, { fontSize: 12, color: "#748078" }, 2);
    addText(pageId, value, x + 18, 194, 180, 34, { fontSize: 27, fontWeight: 750, color: "#16211B" }, 2);
    addContainer(pageId, x + 218, 164, 28, 28, { bgType: "solid", bgColor: bg, radius: 14 }, 2);
  });
  addContainer(pageId, 260, 302, 854, 280, { bgType: "solid", bgColor: "#FFFFFF", radius: 10, borderWidth: 1, borderColor: "#E3E7E4" }, 1);
  addText(pageId, "Revenue momentum", 282, 326, 280, 22, { fontSize: 15, fontWeight: 700, color: "#16211B" }, 2);
  [0, 1, 2, 3, 4, 5, 6].forEach((index) => addContainer(pageId, 304 + index * 102, 470 - [40, 76, 34, 112, 94, 148, 176][index], 34, [40, 76, 34, 112, 94, 148, 176][index], { bgType: "solid", bgColor: index === 6 ? "#22C55E" : "#D9E4DC", radius: 5 }, 2));
  addContainer(pageId, 260, 610, 854, 144, { bgType: "solid", bgColor: "#FFFFFF", radius: 10, borderWidth: 1, borderColor: "#E3E7E4" }, 1);
  addText(pageId, "Needs attention", 282, 632, 250, 20, { fontSize: 15, fontWeight: 700, color: "#16211B" }, 2);
  addText(pageId, "Apollo renewal     ·     Enterprise plan     ·     2h ago", 282, 682, 650, 20, { fontSize: 13, color: "#68746C" }, 2);
  addMark(pageId, "REVIEW", 970, 675, "yellow", 2);
}

function createMobile(pageId: string) {
  addContainer(pageId, 0, 0, 390, 844, { bgType: "solid", bgColor: "#FFF8F3" });
  addContainer(pageId, 0, 0, 390, 294, { bgType: "solid", bgColor: "#FE5E50" }, 1);
  addText(pageId, "pace", 28, 48, 86, 22, { fontSize: 20, fontWeight: 800, color: "#FFF8F3" }, 2);
  addText(pageId, "Wednesday\n08:42", 28, 98, 200, 60, { fontSize: 29, fontWeight: 750, color: "#FFF8F3", lineHeight: 1.05 }, 2);
  addContainer(pageId, 28, 214, 334, 134, { bgType: "solid", bgColor: "#FFFFFF", radius: 18, shadow: "lg", shadowColor: "#FE5E50" }, 2);
  addText(pageId, "Today’s recovery", 48, 236, 160, 18, { fontSize: 13, fontWeight: 650, color: "#4D2E2B" }, 3);
  addText(pageId, "82", 48, 266, 86, 42, { fontSize: 37, fontWeight: 800, color: "#4D2E2B" }, 3);
  addText(pageId, "ready to move", 48, 310, 124, 16, { fontSize: 11, color: "#A2756D" }, 3);
  addContainer(pageId, 270, 246, 60, 60, { bgType: "solid", bgColor: "#FFE2DD", radius: 30 }, 3);
  addText(pageId, "8.2", 280, 266, 42, 18, { fontSize: 14, fontWeight: 750, color: "#FE5E50", align: "center" }, 4);
  addText(pageId, "Your plan", 28, 396, 160, 28, { fontSize: 21, fontWeight: 750, color: "#372B28" }, 2);
  addContainer(pageId, 28, 442, 334, 154, { bgType: "solid", bgColor: "#FFFFFF", radius: 16, borderWidth: 1, borderColor: "#F2E7DF" }, 1);
  addText(pageId, "01   Mobility reset", 48, 468, 238, 22, { fontSize: 15, fontWeight: 700, color: "#372B28" }, 2);
  addText(pageId, "12 min · Low intensity", 48, 502, 190, 18, { fontSize: 12, color: "#927A72" }, 2);
  addContainer(pageId, 48, 542, 244, 8, { bgType: "solid", bgColor: "#F1E6E0", radius: 4 }, 2);
  addContainer(pageId, 48, 542, 130, 8, { bgType: "solid", bgColor: "#FE5E50", radius: 4 }, 3);
  addButton(pageId, "开始今天的计划", 28, 672, 334, 50, "primary");
  addText(pageId, "Home        Plan        Profile", 52, 786, 286, 18, { fontSize: 11, fontWeight: 650, color: "#8E7770", align: "center" }, 2);
}

export function instantiateTemplate(template: CanvasTemplate): string {
  const canvasId = createCanvas(template.name);
  switchCanvas(canvasId);
  const store = useCanvasStore.getState();
  store.clearAll();
  store.setCanvasName(template.name);
  const mobile = template.kind === "mobile";
  const width = mobile ? 390 : 1200;
  const height = mobile ? 844 : 820;
  const pageId = store.addPage({ name: template.name, path: `/${template.id}-${Date.now().toString(36)}`, width, height });

  switch (template.id) {
    case "atelier-noir": createEditorial(pageId); break;
    case "orbit-launch": createLaunch(pageId); break;
    case "muse-ai": createSaas(pageId); break;
    case "form-market": createCommerce(pageId); break;
    case "signal-ops": createDashboard(pageId); break;
    case "pace-mobile": createMobile(pageId); break;
    default: createSaas(pageId);
  }
  store.select({ type: "page", id: pageId });
  return pageId;
}
