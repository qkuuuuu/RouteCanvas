import type { ComponentDef } from "@/types/schema";

const COLOR_OPTIONS = ["#6366f1", "#ec4899", "#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];
const colorField = { key: "color", label: "主题色", type: "select" as const, options: COLOR_OPTIONS, default: "#6366f1", bucket: "custom" as const };
const speedField = { key: "speed", label: "旋转速度", type: "number" as const, default: 1, bucket: "custom" as const };
const bgField = { key: "bg", label: "背景色", type: "select" as const, options: ["#0f0f23", "#1a1a2e", "#0f172a", "#fafafa", "#050510", "#0a0a1a"], default: "#0f0f23", bucket: "custom" as const };

export const r3fDefs: ComponentDef[] = [
  { source: "pack", id: "r3f-torus-knot", label: "旋转扭结", category: "3D场景", pack: "r3f-scenes", subCategory: "几何体", propsSchema: [colorField, speedField, bgField] },
  { source: "pack", id: "r3f-floating-shapes", label: "漂浮几何", category: "3D场景", pack: "r3f-scenes", subCategory: "几何体", propsSchema: [colorField, speedField, bgField] },
  { source: "pack", id: "r3f-particles", label: "粒子星空", category: "3D场景", pack: "r3f-scenes", subCategory: "粒子", propsSchema: [colorField, speedField, bgField] },
  { source: "pack", id: "r3f-product-stage", label: "产品展示台", category: "3D场景", pack: "r3f-scenes", subCategory: "展示", propsSchema: [colorField, speedField, bgField] },
  { source: "pack", id: "r3f-distort-sphere", label: "变形球体", category: "3D场景", pack: "r3f-scenes", subCategory: "几何体", propsSchema: [colorField, speedField, bgField] },
  { source: "pack", id: "r3f-wire-globe", label: "线框地球", category: "3D场景", pack: "r3f-scenes", subCategory: "线框", propsSchema: [colorField, speedField, bgField] },
];
