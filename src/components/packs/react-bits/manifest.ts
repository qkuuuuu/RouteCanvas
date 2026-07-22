import type { ComponentDef } from "@/types/schema";

/* ---- 共享字段 ---- */
const COLOR_OPTIONS = ["#6366f1", "#ec4899", "#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#14b8a6"];
const textField = { key: "text", label: "文本", type: "string" as const, bucket: "base" as const };
const colorField = { key: "color", label: "主题色", type: "select" as const, options: COLOR_OPTIONS, default: "#6366f1", bucket: "custom" as const };
const speedField = { key: "speed", label: "动画速度", type: "number" as const, default: 1, bucket: "custom" as const };

/** react-bits pack 的 curated 组件定义 */
export const reactBitsDefs: ComponentDef[] = [
  { source: "pack", id: "rb-shimmer-button", label: "Shimmer 按钮", category: "React Bits", pack: "react-bits", propsSchema: [textField, colorField, speedField] },
  { source: "pack", id: "rb-gradient-text", label: "渐变文字", category: "React Bits", pack: "react-bits", propsSchema: [textField, colorField, speedField] },
  { source: "pack", id: "rb-card-hover", label: "3D 悬停卡片", category: "React Bits", pack: "react-bits", propsSchema: [textField, colorField] },
  { source: "pack", id: "rb-loading-dots", label: "加载点动画", category: "React Bits", pack: "react-bits", propsSchema: [colorField, speedField] },
  { source: "pack", id: "rb-spotlight-card", label: "聚光灯卡片", category: "React Bits", pack: "react-bits", propsSchema: [textField, colorField] },
  { source: "pack", id: "rb-animated-text", label: "逐字动画文字", category: "React Bits", pack: "react-bits", propsSchema: [textField, colorField, speedField] },
  { source: "pack", id: "rb-typewriter", label: "打字机效果", category: "React Bits", pack: "react-bits", propsSchema: [textField, colorField, speedField] },
  { source: "pack", id: "rb-pulse-button", label: "脉冲按钮", category: "React Bits", pack: "react-bits", propsSchema: [textField, colorField, speedField] },
  { source: "pack", id: "rb-count-up", label: "数字滚动", category: "React Bits", pack: "react-bits", propsSchema: [textField, colorField, speedField] },
  { source: "pack", id: "rb-marquee", label: "跑马灯", category: "React Bits", pack: "react-bits", propsSchema: [textField, colorField, speedField] },
  { source: "pack", id: "rb-blur-text", label: "模糊揭示文字", category: "React Bits", pack: "react-bits", propsSchema: [textField, colorField, speedField] },
  { source: "pack", id: "rb-ripple-button", label: "涟漪按钮", category: "React Bits", pack: "react-bits", propsSchema: [textField, colorField] },
  { source: "pack", id: "rb-particles", label: "粒子背景", category: "React Bits", pack: "react-bits", propsSchema: [textField, colorField, speedField] },
  { source: "pack", id: "rb-flip-text", label: "翻转文字", category: "React Bits", pack: "react-bits", propsSchema: [textField, colorField, speedField] },
  { source: "pack", id: "rb-progress-ring", label: "环形进度", category: "React Bits", pack: "react-bits", propsSchema: [textField, colorField] },
  { source: "pack", id: "rb-wave-text", label: "波浪文字", category: "React Bits", pack: "react-bits", propsSchema: [textField, colorField, speedField] },
  { source: "pack", id: "rb-neon-button", label: "霓虹按钮", category: "React Bits", pack: "react-bits", propsSchema: [textField, colorField] },
  { source: "pack", id: "rb-slide-cards", label: "滑动卡片", category: "React Bits", pack: "react-bits", propsSchema: [textField, colorField] },
  { source: "pack", id: "rb-bounce-badge", label: "弹跳徽章", category: "React Bits", pack: "react-bits", propsSchema: [textField, colorField, speedField] },
  { source: "pack", id: "rb-glitch-text", label: "故障文字", category: "React Bits", pack: "react-bits", propsSchema: [textField, colorField, speedField] },
  { source: "pack", id: "rb-orbit", label: "轨道动画", category: "React Bits", pack: "react-bits", propsSchema: [textField, colorField, speedField] },
  { source: "pack", id: "rb-magnetic-btn", label: "磁性按钮", category: "React Bits", pack: "react-bits", propsSchema: [textField, colorField] },
  { source: "pack", id: "rb-border-beam", label: "边框光束", category: "React Bits", pack: "react-bits", propsSchema: [textField, colorField, speedField] },
  { source: "pack", id: "rb-breathing", label: "呼吸圆", category: "React Bits", pack: "react-bits", propsSchema: [colorField, speedField] },
  { source: "pack", id: "rb-typing-indicator", label: "输入指示器", category: "React Bits", pack: "react-bits", propsSchema: [colorField, speedField] },
  { source: "pack", id: "rb-rainbow-btn", label: "彩虹按钮", category: "React Bits", pack: "react-bits", propsSchema: [textField, speedField] },
  { source: "pack", id: "rb-float-card", label: "漂浮卡片", category: "React Bits", pack: "react-bits", propsSchema: [textField, colorField, speedField] },
  { source: "pack", id: "rb-shake-btn", label: "抖动按钮", category: "React Bits", pack: "react-bits", propsSchema: [textField, colorField] },
  { source: "pack", id: "rb-rotate-text", label: "旋转文字", category: "React Bits", pack: "react-bits", propsSchema: [textField, colorField, speedField] },
  { source: "pack", id: "rb-gradient-orb", label: "渐变球", category: "React Bits", pack: "react-bits", propsSchema: [colorField, speedField] },
  { source: "pack", id: "rb-split-text", label: "分裂文字", category: "React Bits", pack: "react-bits", propsSchema: [textField, colorField, speedField] },
  { source: "pack", id: "rb-hover-link", label: "悬停链接", category: "React Bits", pack: "react-bits", propsSchema: [textField, colorField] },
  { source: "pack", id: "rb-animated-divider", label: "动画分割线", category: "React Bits", pack: "react-bits", propsSchema: [colorField, speedField] },
  { source: "pack", id: "rb-confetti", label: "彩带", category: "React Bits", pack: "react-bits", propsSchema: [textField, speedField] },
  { source: "pack", id: "rb-pixel-reveal", label: "像素揭示", category: "React Bits", pack: "react-bits", propsSchema: [textField, colorField, speedField] },
  { source: "pack", id: "rb-swing-badge", label: "摇摆徽章", category: "React Bits", pack: "react-bits", propsSchema: [textField, colorField, speedField] },
  { source: "pack", id: "rb-slide-text", label: "滑入文字", category: "React Bits", pack: "react-bits", propsSchema: [textField, colorField, speedField] },
  { source: "pack", id: "rb-heart-beat", label: "心跳", category: "React Bits", pack: "react-bits", propsSchema: [textField, colorField, speedField] },
  { source: "pack", id: "rb-spinner-ring", label: "旋转环", category: "React Bits", pack: "react-bits", propsSchema: [colorField, speedField] },
  { source: "pack", id: "rb-tilt-card", label: "倾斜卡片", category: "React Bits", pack: "react-bits", propsSchema: [textField, colorField] },
  { source: "pack", id: "rb-morph-btn", label: "变形按钮", category: "React Bits", pack: "react-bits", propsSchema: [textField, colorField] },
  { source: "pack", id: "rb-stagger-list", label: "错列动画", category: "React Bits", pack: "react-bits", propsSchema: [textField, colorField, speedField] },
  { source: "pack", id: "rb-parallax-card", label: "视差卡片", category: "React Bits", pack: "react-bits", propsSchema: [textField, colorField] },
  { source: "pack", id: "rb-elastic-btn", label: "弹性按钮", category: "React Bits", pack: "react-bits", propsSchema: [textField, colorField] },
  { source: "pack", id: "rb-reveal-text", label: "揭示文字", category: "React Bits", pack: "react-bits", propsSchema: [textField, colorField, speedField] },
  { source: "pack", id: "rb-orbit-dots", label: "轨道点", category: "React Bits", pack: "react-bits", propsSchema: [colorField, speedField] },
  { source: "pack", id: "rb-wave-divider", label: "波浪分割", category: "React Bits", pack: "react-bits", propsSchema: [colorField, speedField] },
  { source: "pack", id: "rb-flip-card", label: "翻转卡片", category: "React Bits", pack: "react-bits", propsSchema: [textField, colorField] },
  { source: "pack", id: "rb-progress-wave", label: "波浪进度", category: "React Bits", pack: "react-bits", propsSchema: [textField, colorField, speedField] },
  { source: "pack", id: "rb-shake-input", label: "抖动输入", category: "React Bits", pack: "react-bits", propsSchema: [textField, colorField] },
  { source: "pack", id: "rb-glow-card", label: "发光卡片", category: "React Bits", pack: "react-bits", propsSchema: [textField, colorField, speedField] },
  /* ---- 新增组件 ---- */
  { source: "pack", id: "rb-text-scramble", label: "文字解密", category: "React Bits", pack: "react-bits", propsSchema: [textField, colorField, speedField] },
  { source: "pack", id: "rb-gradient-border-card", label: "渐变边框卡", category: "React Bits", pack: "react-bits", propsSchema: [textField, colorField, speedField] },
  { source: "pack", id: "rb-animated-counter", label: "动画计数器", category: "React Bits", pack: "react-bits", propsSchema: [textField, colorField, speedField] },
  { source: "pack", id: "rb-glow-pulse", label: "发光脉冲", category: "React Bits", pack: "react-bits", propsSchema: [colorField, speedField] },
  { source: "pack", id: "rb-bounce-text", label: "弹跳文字", category: "React Bits", pack: "react-bits", propsSchema: [textField, colorField, speedField] },
  { source: "pack", id: "rb-morphing-shape", label: "变形图形", category: "React Bits", pack: "react-bits", propsSchema: [colorField, speedField] },
  { source: "pack", id: "rb-spotlight-text", label: "聚光文字", category: "React Bits", pack: "react-bits", propsSchema: [textField, colorField, speedField] },
  { source: "pack", id: "rb-tilt-gallery", label: "倾斜画廊", category: "React Bits", pack: "react-bits", propsSchema: [textField, colorField] },
];

export { reactBitsComponents } from "./components";
