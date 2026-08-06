import type { ComponentDef } from "@/types/schema";

const COLOR_OPTIONS = ["#6366f1", "#ec4899", "#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];
const colorField = { key: "color", label: "颜色", type: "select" as const, options: COLOR_OPTIONS, default: "#6366f1", bucket: "custom" as const };
const textField = { key: "text", label: "文本", type: "string" as const, bucket: "base" as const };

export const magicUIDefs: ComponentDef[] = [
  { source: "pack", id: "mu-animated-beam", label: "动画光束", category: "Magic UI", pack: "magic-ui", propsSchema: [textField, colorField] },
  { source: "pack", id: "mu-border-beam", label: "边框光束", category: "Magic UI", pack: "magic-ui", propsSchema: [textField, colorField] },
  { source: "pack", id: "mu-shine-border", label: "闪光边框", category: "Magic UI", pack: "magic-ui", propsSchema: [textField, colorField] },
  { source: "pack", id: "mu-magic-card", label: "魔法卡片", category: "Magic UI", pack: "magic-ui", propsSchema: [textField, colorField] },
  { source: "pack", id: "mu-number-ticker", label: "数字滚动", category: "Magic UI", pack: "magic-ui", propsSchema: [textField] },
  { source: "pack", id: "mu-word-rotate", label: "文字轮转", category: "Magic UI", pack: "magic-ui", propsSchema: [textField] },
  { source: "pack", id: "mu-letter-pullup", label: "字母上拉", category: "Magic UI", pack: "magic-ui", propsSchema: [textField] },
  { source: "pack", id: "mu-blur-fade", label: "模糊渐入", category: "Magic UI", pack: "magic-ui", propsSchema: [textField] },
  { source: "pack", id: "mu-gradual-spacing", label: "渐进间距", category: "Magic UI", pack: "magic-ui", propsSchema: [textField] },
  { source: "pack", id: "mu-shimmer-button", label: "微光按钮", category: "Magic UI", pack: "magic-ui", propsSchema: [textField, colorField] },
  { source: "pack", id: "mu-ripple", label: "涟漪效果", category: "Magic UI", pack: "magic-ui", propsSchema: [colorField] },
  { source: "pack", id: "mu-dot-pattern", label: "点阵背景", category: "Magic UI", pack: "magic-ui", propsSchema: [textField, colorField] },
  { source: "pack", id: "mu-grid-pattern", label: "网格背景", category: "Magic UI", pack: "magic-ui", propsSchema: [textField, colorField] },
  { source: "pack", id: "mu-retro-grid", label: "复古网格", category: "Magic UI", pack: "magic-ui", propsSchema: [textField, colorField] },
  { source: "pack", id: "mu-sparkles", label: "星火效果", category: "Magic UI", pack: "magic-ui", propsSchema: [textField, colorField] },
  { source: "pack", id: "mu-text-reveal", label: "文字揭示", category: "Magic UI", pack: "magic-ui", propsSchema: [textField] },
  { source: "pack", id: "mu-orbit", label: "轨道动画", category: "Magic UI", pack: "magic-ui", propsSchema: [colorField] },
  { source: "pack", id: "mu-pulsating-button", label: "脉冲按钮", category: "Magic UI", pack: "magic-ui", propsSchema: [textField, colorField] },
  { source: "pack", id: "mu-aurora", label: "极光背景", category: "Magic UI", pack: "magic-ui", propsSchema: [textField, colorField] },
  { source: "pack", id: "mu-flip-button", label: "翻转按钮", category: "Magic UI", pack: "magic-ui", propsSchema: [textField, colorField] },
  { source: "pack", id: "mu-typing-animation", label: "打字动画", category: "Magic UI", pack: "magic-ui", propsSchema: [textField] },
  { source: "pack", id: "mu-word-fade-in", label: "文字淡入", category: "Magic UI", pack: "magic-ui", propsSchema: [textField] },
  { source: "pack", id: "mu-scroll-progress", label: "滚动进度", category: "Magic UI", pack: "magic-ui", propsSchema: [textField, colorField] },
  { source: "pack", id: "mu-gradient-border", label: "渐变边框", category: "Magic UI", pack: "magic-ui", propsSchema: [textField, colorField] },
  { source: "pack", id: "mu-bounce-badge", label: "弹跳徽章", category: "Magic UI", pack: "magic-ui", propsSchema: [textField, colorField] },
  { source: "pack", id: "mu-particle-text", label: "粒子文字", category: "Magic UI", pack: "magic-ui", propsSchema: [textField, colorField] },
  { source: "pack", id: "mu-meteor-shower", label: "流星雨", category: "Magic UI", pack: "magic-ui", propsSchema: [textField, colorField] },
  { source: "pack", id: "mu-breathing-glow", label: "呼吸光环", category: "Magic UI", pack: "magic-ui", propsSchema: [colorField] },
  { source: "pack", id: "mu-card-stack", label: "卡片堆叠", category: "Magic UI", pack: "magic-ui", propsSchema: [textField, colorField] },
  { source: "pack", id: "mu-wave-progress", label: "波浪进度", category: "Magic UI", pack: "magic-ui", propsSchema: [colorField] },
];
