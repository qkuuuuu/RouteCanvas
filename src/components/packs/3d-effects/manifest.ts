import type { ComponentDef } from "@/types/schema";
import { threeDComponents } from "./components";

export { threeDComponents };

const COLOR_OPTIONS = ["#6366f1", "#ec4899", "#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#14b8a6"];
const textField = { key: "text", label: "文本", type: "string" as const, bucket: "base" as const };
const colorField = { key: "color", label: "主题色", type: "select" as const, options: COLOR_OPTIONS, default: "#6366f1", bucket: "custom" as const };
const speedField = { key: "speed", label: "动画速度", type: "number" as const, default: 1, bucket: "custom" as const };

export const threeDDefs: ComponentDef[] = [
  { source: "pack", id: "3d-carousel", label: "3D轮播", category: "3D特效", pack: "3d-effects", subCategory: "旋转", propsSchema: [textField, colorField, speedField] },
  { source: "pack", id: "3d-cube", label: "旋转立方体", category: "3D特效", pack: "3d-effects", subCategory: "旋转", propsSchema: [colorField, speedField] },
  { source: "pack", id: "3d-flip-card", label: "3D翻转卡片", category: "3D特效", pack: "3d-effects", subCategory: "卡片", propsSchema: [textField, colorField] },
  { source: "pack", id: "3d-tilt-card", label: "倾斜卡片", category: "3D特效", pack: "3d-effects", subCategory: "卡片", propsSchema: [textField, colorField] },
  { source: "pack", id: "3d-parallax-layers", label: "多层视差", category: "3D特效", pack: "3d-effects", subCategory: "视差", propsSchema: [colorField, speedField] },
  { source: "pack", id: "3d-perspective-grid", label: "透视网格", category: "3D特效", pack: "3d-effects", subCategory: "背景", propsSchema: [colorField, speedField] },
  { source: "pack", id: "3d-rotating-ring", label: "3D旋转环", category: "3D特效", pack: "3d-effects", subCategory: "旋转", propsSchema: [colorField, speedField] },
  { source: "pack", id: "3d-card-stack", label: "3D卡片堆叠", category: "3D特效", pack: "3d-effects", subCategory: "卡片", propsSchema: [textField, colorField] },
  { source: "pack", id: "3d-text", label: "3D立体文字", category: "3D特效", pack: "3d-effects", subCategory: "文字", propsSchema: [textField, colorField] },
  { source: "pack", id: "3d-wire-sphere", label: "线框球体", category: "3D特效", pack: "3d-effects", subCategory: "几何", propsSchema: [colorField, speedField] },
  { source: "pack", id: "3d-pyramid", label: "旋转金字塔", category: "3D特效", pack: "3d-effects", subCategory: "几何", propsSchema: [colorField, speedField] },
  { source: "pack", id: "3d-wave-cards", label: "波浪卡片", category: "3D特效", pack: "3d-effects", subCategory: "动画", propsSchema: [colorField, speedField] },
  { source: "pack", id: "3d-depth-layers", label: "深度层叠", category: "3D特效", pack: "3d-effects", subCategory: "视差", propsSchema: [textField, colorField] },
  { source: "pack", id: "3d-swing-card", label: "摇摆卡片", category: "3D特效", pack: "3d-effects", subCategory: "卡片", propsSchema: [textField, colorField, speedField] },
  { source: "pack", id: "3d-helix-list", label: "螺旋列表", category: "3D特效", pack: "3d-effects", subCategory: "旋转", propsSchema: [colorField, speedField] },
  /* ---- 新增 ---- */
  { source: "pack", id: "3d-flip-tile", label: "翻转方块", category: "3D特效", pack: "3d-effects", subCategory: "旋转", propsSchema: [colorField, speedField] },
  { source: "pack", id: "3d-zoom-card", label: "缩放卡片", category: "3D特效", pack: "3d-effects", subCategory: "卡片", propsSchema: [textField, colorField] },
  { source: "pack", id: "3d-rotate-text", label: "旋转文字", category: "3D特效", pack: "3d-effects", subCategory: "文字", propsSchema: [textField, colorField, speedField] },
  { source: "pack", id: "3d-layered-bg", label: "层叠背景", category: "3D特效", pack: "3d-effects", subCategory: "背景", propsSchema: [colorField, speedField] },
  { source: "pack", id: "3d-orbit-ring", label: "轨道环", category: "3D特效", pack: "3d-effects", subCategory: "几何", propsSchema: [colorField, speedField] },
];
