import type { ComponentDef } from "@/types/schema";
import { animBgComponents } from "./components";

export { animBgComponents };

const COLOR_OPTIONS = ["#6366f1", "#ec4899", "#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#14b8a6"];
const textField = { key: "text", label: "文本", type: "string" as const, bucket: "base" as const };
const colorField = { key: "color", label: "主题色", type: "select" as const, options: COLOR_OPTIONS, default: "#6366f1", bucket: "custom" as const };
const speedField = { key: "speed", label: "动画速度", type: "number" as const, default: 1, bucket: "custom" as const };

export const animBgDefs: ComponentDef[] = [
  { source: "pack", id: "abg-gradient-flow", label: "流动渐变", category: "动态背景", pack: "anim-bg", subCategory: "渐变", propsSchema: [textField, colorField, speedField] },
  { source: "pack", id: "abg-starfield", label: "星空", category: "动态背景", pack: "anim-bg", subCategory: "粒子", propsSchema: [textField, colorField, speedField] },
  { source: "pack", id: "abg-ocean-waves", label: "海浪", category: "动态背景", pack: "anim-bg", subCategory: "自然", propsSchema: [textField, colorField, speedField] },
  { source: "pack", id: "abg-fireflies", label: "萤火虫", category: "动态背景", pack: "anim-bg", subCategory: "粒子", propsSchema: [textField, colorField, speedField] },
  { source: "pack", id: "abg-northern-lights", label: "极光", category: "动态背景", pack: "anim-bg", subCategory: "自然", propsSchema: [textField, colorField, speedField] },
  { source: "pack", id: "abg-bubbles", label: "气泡", category: "动态背景", pack: "anim-bg", subCategory: "粒子", propsSchema: [textField, colorField, speedField] },
  { source: "pack", id: "abg-matrix-rain", label: "矩阵雨", category: "动态背景", pack: "anim-bg", subCategory: "科技", propsSchema: [textField, colorField, speedField] },
  { source: "pack", id: "abg-smoke", label: "烟雾", category: "动态背景", pack: "anim-bg", subCategory: "自然", propsSchema: [textField, colorField, speedField] },
  { source: "pack", id: "abg-rainbow-wave", label: "彩虹波浪", category: "动态背景", pack: "anim-bg", subCategory: "渐变", propsSchema: [textField, speedField] },
  { source: "pack", id: "abg-pulse-grid", label: "脉冲网格", category: "动态背景", pack: "anim-bg", subCategory: "科技", propsSchema: [textField, colorField, speedField] },
  { source: "pack", id: "abg-meteor-shower", label: "流星雨", category: "动态背景", pack: "anim-bg", subCategory: "粒子", propsSchema: [textField, colorField, speedField] },
  { source: "pack", id: "abg-lava-lamp", label: "熔岩灯", category: "动态背景", pack: "anim-bg", subCategory: "渐变", propsSchema: [textField, colorField, speedField] },
  { source: "pack", id: "abg-snowfall", label: "雪花飘落", category: "动态背景", pack: "anim-bg", subCategory: "自然", propsSchema: [textField, speedField] },
  { source: "pack", id: "abg-cyber-grid", label: "赛博网格", category: "动态背景", pack: "anim-bg", subCategory: "科技", propsSchema: [textField, colorField, speedField] },
  { source: "pack", id: "abg-sunset-gradient", label: "日落渐变", category: "动态背景", pack: "anim-bg", subCategory: "渐变", propsSchema: [textField, speedField] },
  /* ---- 新增 ---- */
  { source: "pack", id: "abg-nebula", label: "星云", category: "动态背景", pack: "anim-bg", subCategory: "粒子", propsSchema: [textField, colorField, speedField] },
  { source: "pack", id: "abg-geometric-flow", label: "几何流动", category: "动态背景", pack: "anim-bg", subCategory: "科技", propsSchema: [colorField, speedField] },
  { source: "pack", id: "abg-aurora-curtain", label: "极光帷幕", category: "动态背景", pack: "anim-bg", subCategory: "自然", propsSchema: [colorField, speedField] },
  { source: "pack", id: "abg-particle-network", label: "粒子网络", category: "动态背景", pack: "anim-bg", subCategory: "科技", propsSchema: [colorField, speedField] },
  { source: "pack", id: "abg-gradient-orbs", label: "渐变光球", category: "动态背景", pack: "anim-bg", subCategory: "渐变", propsSchema: [colorField, speedField] },
];
