import type { ComponentDef } from "@/types/schema";

const COLOR_OPTIONS = ["#6366f1", "#ec4899", "#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#14b8a6"];
const colorField = { key: "color", label: "主题色", type: "select" as const, options: COLOR_OPTIONS, default: "#6366f1", bucket: "custom" as const };
const textField = { key: "text", label: "文本", type: "string" as const, bucket: "base" as const };

/**
 * uiverse.io 纯 CSS 组件 pack。
 * 每个组件用 html（HTML 片段）+ css（scoped CSS）定义，
 * 渲染时走 cssSandbox 路径（无 babel，无 React 组件）。
 */
export const uiverseDefs: ComponentDef[] = [
  {
    source: "css",
    id: "uv-button-glow",
    label: "发光按钮",
    category: "uiverse",
    pack: "uiverse",
    propsSchema: [textField, colorField],
    html: `<button class="uv-btn-glow"><span class="uv-btn-glow-text">Glow Button</span></button>`,
    css: `.uv-btn-glow {
  position: relative;
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 12px;
  background: #1a1a2e;
  color: #fff;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s ease;
}
.uv-btn-glow::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 12px;
  background: linear-gradient(45deg, var(--uv-color, #6366f1), #ec4899, var(--uv-color, #6366f1));
  background-size: 200%;
  z-index: -1;
  opacity: 0;
  transition: opacity 0.3s;
  animation: uv-glow-rotate 3s linear infinite;
}
.uv-btn-glow:hover::before { opacity: 1; }
.uv-btn-glow:hover { transform: scale(1.03); }
.uv-btn-glow-text { font-size: 14px; font-weight: 600; }
@keyframes uv-glow-rotate {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}`,
  },
  {
    source: "css",
    id: "uv-loader-spinner",
    label: "旋转加载器",
    category: "uiverse",
    pack: "uiverse",
    propsSchema: [colorField],
    html: `<div class="uv-loader"><div class="uv-loader-ring"></div></div>`,
    css: `.uv-loader {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.uv-loader-ring {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top-color: var(--uv-color, #6366f1);
  border-radius: 50%;
  animation: uv-spin 0.8s linear infinite;
}
@keyframes uv-spin {
  to { transform: rotate(360deg); }
}`,
  },
  {
    source: "css",
    id: "uv-card-flip",
    label: "翻转卡片",
    category: "uiverse",
    pack: "uiverse",
    propsSchema: [textField, colorField],
    html: `<div class="uv-flip-card">
  <div class="uv-flip-inner">
    <div class="uv-flip-front">Hover to flip</div>
    <div class="uv-flip-back">Back side!</div>
  </div>
</div>`,
    css: `.uv-flip-card {
  width: 100%;
  height: 100%;
  perspective: 600px;
}
.uv-flip-inner {
  width: 100%;
  height: 100%;
  position: relative;
  transition: transform 0.6s;
  transform-style: preserve-3d;
}
.uv-flip-card:hover .uv-flip-inner { transform: rotateY(180deg); }
.uv-flip-front, .uv-flip-back {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  backface-visibility: hidden;
}
.uv-flip-front { background: linear-gradient(135deg, var(--uv-color, #6366f1), #8b5cf6); color: #fff; }
.uv-flip-back { background: linear-gradient(135deg, #ec4899, #f97316); color: #fff; transform: rotateY(180deg); }`,
  },
  {
    source: "css",
    id: "uv-toggle-switch",
    label: "切换开关",
    category: "uiverse",
    pack: "uiverse",
    propsSchema: [colorField],
    html: `<label class="uv-toggle">
  <input type="checkbox" />
  <span class="uv-toggle-slider"></span>
</label>`,
    css: `.uv-toggle {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.uv-toggle input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}
.uv-toggle-slider {
  position: relative;
  width: 56px;
  height: 30px;
  border-radius: 15px;
  background: #d1d5db;
  cursor: pointer;
  transition: background 0.3s;
}
.uv-toggle-slider::before {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  transition: transform 0.3s;
}
.uv-toggle input:checked + .uv-toggle-slider { background: var(--uv-color, #6366f1); }
.uv-toggle input:checked + .uv-toggle-slider::before { transform: translateX(26px); }`,
  },
  {
    source: "css",
    id: "uv-checkbox-glow",
    label: "发光复选框",
    category: "uiverse",
    pack: "uiverse",
    propsSchema: [colorField],
    html: `<label class="uv-check">
  <input type="checkbox" />
  <span class="uv-check-box"><span class="uv-check-mark"></span></span>
</label>`,
    css: `.uv-check {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.uv-check input { position: absolute; opacity: 0; }
.uv-check-box {
  width: 28px;
  height: 28px;
  border: 2px solid #d1d5db;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}
.uv-check-mark {
  width: 6px;
  height: 12px;
  border: solid #fff;
  border-width: 0 3px 3px 0;
  transform: rotate(45deg) scale(0);
  transition: transform 0.2s;
}
.uv-check input:checked + .uv-check-box {
  background: var(--uv-color, #6366f1);
  border-color: var(--uv-color, #6366f1);
  box-shadow: 0 0 12px rgba(99,102,241,0.5);
}
.uv-check input:checked + .uv-check-box .uv-check-mark {
  transform: rotate(45deg) scale(1);
}`,
  },
  {
    source: "css",
    id: "uv-button-3d",
    label: "3D 按钮",
    category: "uiverse",
    pack: "uiverse",
    propsSchema: [textField, colorField],
    html: `<button class="uv-btn-3d">3D Button</button>`,
    css: `.uv-btn-3d {
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 10px;
  background: linear-gradient(180deg, #818cf8, var(--uv-color, #6366f1));
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 6px 0 #4338ca, 0 8px 12px rgba(0,0,0,0.2);
  transition: all 0.1s;
}
.uv-btn-3d:hover { background: linear-gradient(180deg, #a5b4fc, var(--uv-color, #6366f1)); }
.uv-btn-3d:active {
  transform: translateY(4px);
  box-shadow: 0 2px 0 #4338ca, 0 4px 6px rgba(0,0,0,0.2);
}`,
  },
  { source: "css", id: "uv-neon-btn", label: "霓虹按钮", category: "uiverse", pack: "uiverse", propsSchema: [{ key: "text", label: "文本", type: "string", bucket: "base" }], html: `<button class="uv-neon">Neon</button>`, css: `.uv-neon { width: 100%; height: 100%; border: 2px solid #0ff; border-radius: 8px; background: transparent; color: #0ff; font-size: 14px; font-weight: 600; cursor: pointer; text-shadow: 0 0 8px #0ff; box-shadow: 0 0 10px rgba(0,255,255,0.3), inset 0 0 10px rgba(0,255,255,0.1); transition: all 0.3s; } .uv-neon:hover { background: rgba(0,255,255,0.1); box-shadow: 0 0 20px rgba(0,255,255,0.6), inset 0 0 20px rgba(0,255,255,0.2); }` },
  { source: "css", id: "uv-gradient-border", label: "渐变边框卡", category: "uiverse", pack: "uiverse", propsSchema: [{ key: "text", label: "文本", type: "string", bucket: "base" }], html: `<div class="uv-gborder"><div class="uv-gborder-inner">Gradient Border</div></div>`, css: `.uv-gborder { width: 100%; height: 100%; padding: 2px; border-radius: 12px; background: linear-gradient(135deg, var(--uv-color, #6366f1), #ec4899, #06b6d4); } .uv-gborder-inner { width: 100%; height: 100%; border-radius: 10px; background: #fff; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; color: #374151; }` },
  { source: "css", id: "uv-skeleton", label: "骨架加载", category: "uiverse", pack: "uiverse", propsSchema: [], html: `<div class="uv-skel"><div class="uv-skel-line uv-skel-w80"></div><div class="uv-skel-line uv-skel-w60"></div><div class="uv-skel-line uv-skel-w90"></div></div>`, css: `.uv-skel { width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; gap: 8px; padding: 12px; } .uv-skel-line { height: 10px; border-radius: 5px; background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%); background-size: 200% 100%; animation: uv-shimmer 1.5s infinite; } .uv-skel-w80 { width: 80%; } .uv-skel-w60 { width: 60%; } .uv-skel-w90 { width: 90%; } @keyframes uv-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }` },
  { source: "css", id: "uv-tooltip-css", label: "提示框", category: "uiverse", pack: "uiverse", propsSchema: [{ key: "text", label: "提示文本", type: "string", bucket: "base" }], html: `<div class="uv-tip-wrap"><span class="uv-tip-trigger">Hover</span><span class="uv-tip-box">Tooltip text</span></div>`, css: `.uv-tip-wrap { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; position: relative; } .uv-tip-trigger { font-size: 13px; font-weight: 500; color: #374151; cursor: pointer; } .uv-tip-box { position: absolute; bottom: 70%; left: 50%; transform: translateX(-50%) scale(0.8); background: #1f2937; color: #fff; font-size: 11px; padding: 4px 10px; border-radius: 6px; white-space: nowrap; opacity: 0; pointer-events: none; transition: all 0.2s; } .uv-tip-wrap:hover .uv-tip-box { opacity: 1; transform: translateX(-50%) scale(1); }` },
  { source: "css", id: "uv-badge-pulse", label: "脉冲徽章", category: "uiverse", pack: "uiverse", propsSchema: [{ key: "text", label: "文本", type: "string", bucket: "base" }], html: `<div class="uv-bpulse"><span class="uv-bpulse-dot"></span><span class="uv-bpulse-text">Active</span></div>`, css: `.uv-bpulse { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; gap: 6px; } .uv-bpulse-dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; animation: uv-pulse-dot 1.5s infinite; } .uv-bpulse-text { font-size: 12px; font-weight: 600; color: #374151; } @keyframes uv-pulse-dot { 0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.4); } 50% { box-shadow: 0 0 0 6px rgba(34,197,94,0); } }` },
  { source: "css", id: "uv-input-animated", label: "动画输入框", category: "uiverse", pack: "uiverse", propsSchema: [{ key: "text", label: "占位符", type: "string", bucket: "base" }], html: `<div class="uv-input-wrap"><input class="uv-input-a" placeholder="Type here..." /><span class="uv-input-line"></span></div>`, css: `.uv-input-wrap { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; position: relative; } .uv-input-a { width: 80%; border: none; border-bottom: 2px solid #d1d5db; padding: 6px 2px; font-size: 13px; outline: none; background: transparent; transition: border-color 0.3s; } .uv-input-a:focus { border-color: var(--uv-color, #6366f1); } .uv-input-line { position: absolute; bottom: calc(50% - 12px); left: 10%; width: 0; height: 2px; background: var(--uv-color, #6366f1); transition: width 0.3s; } .uv-input-a:focus ~ .uv-input-line { width: 80%; }` },
  { source: "css", id: "uv-progress", label: "进度条", category: "uiverse", pack: "uiverse", propsSchema: [], html: `<div class="uv-prog"><div class="uv-prog-bar"></div></div>`, css: `.uv-prog { width: 100%; height: 100%; display: flex; align-items: center; padding: 0 12px; } .uv-prog-bar { height: 8px; border-radius: 4px; background: linear-gradient(90deg, var(--uv-color, #6366f1), #ec4899); animation: uv-prog-anim 2s ease-in-out infinite; } @keyframes uv-prog-anim { 0% { width: 10%; } 50% { width: 80%; } 100% { width: 10%; } }` },
  { source: "css", id: "uv-glass-card", label: "玻璃卡片", category: "uiverse", pack: "uiverse", propsSchema: [{ key: "text", label: "文本", type: "string", bucket: "base" }], html: `<div class="uv-glass">Glass Card</div>`, css: `.uv-glass { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.3); border-radius: 16px; font-size: 14px; font-weight: 600; color: #374151; box-shadow: 0 8px 32px rgba(0,0,0,0.1); background-image: linear-gradient(135deg, rgba(99,102,241,0.1), rgba(236,72,153,0.1)); }` },
  { source: "css", id: "uv-star-rating", label: "星级评分", category: "uiverse", pack: "uiverse", propsSchema: [], html: `<div class="uv-stars"><span>★</span><span>★</span><span>★</span><span>★</span><span class="uv-star-empty">★</span></div>`, css: `.uv-stars { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; gap: 2px; font-size: 20px; } .uv-stars span { color: #f59e0b; } .uv-star-empty { color: #d1d5db !important; }` },
  { source: "css", id: "uv-animated-check", label: "动画勾选", category: "uiverse", pack: "uiverse", propsSchema: [], html: `<div class="uv-check-anim"><svg viewBox="0 0 24 24" width="28" height="28"><path class="uv-check-path" d="M4 12l5 5L20 6" fill="none" stroke="#22c55e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></div>`, css: `.uv-check-anim { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; } .uv-check-path { stroke-dasharray: 30; stroke-dashoffset: 30; animation: uv-draw-check 0.6s ease forwards 0.3s; } @keyframes uv-draw-check { to { stroke-dashoffset: 0; } }` },
  { source: "css", id: "uv-morphing-btn", label: "变形按钮", category: "uiverse", pack: "uiverse", propsSchema: [{ key: "text", label: "文本", type: "string", bucket: "base" }], html: `<button class="uv-morph">Morph</button>`, css: `.uv-morph { width: 100%; height: 100%; border: none; border-radius: 25px; background: var(--uv-color, #6366f1); color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55); } .uv-morph:hover { border-radius: 8px; background: #ec4899; transform: scale(1.05); }` },
  { source: "css", id: "uv-gradient-text", label: "渐变文字", category: "uiverse", pack: "uiverse", propsSchema: [{ key: "text", label: "文本", type: "string", bucket: "base" }], html: `<div class="uv-gtext">Gradient</div>`, css: `.uv-gtext { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 800; background: linear-gradient(135deg, var(--uv-color, #6366f1), #ec4899, #f59e0b); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }` },
  { source: "css", id: "uv-wave-btn", label: "波浪按钮", category: "uiverse", pack: "uiverse", propsSchema: [{ key: "text", label: "文本", type: "string", bucket: "base" }], html: `<button class="uv-wave-b"><span>Wave</span></button>`, css: `.uv-wave-b { position: relative; width: 100%; height: 100%; border: none; border-radius: 10px; background: #3b82f6; color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; overflow: hidden; } .uv-wave-b::after { content: ''; position: absolute; bottom: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 60%); animation: uv-wave-move 3s linear infinite; } @keyframes uv-wave-move { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }` },
  { source: "css", id: "uv-notification", label: "通知卡片", category: "uiverse", pack: "uiverse", propsSchema: [{ key: "text", label: "通知内容", type: "string", bucket: "base" }], html: `<div class="uv-notif"><span class="uv-notif-dot"></span><span class="uv-notif-text">New notification</span></div>`, css: `.uv-notif { width: 100%; height: 100%; display: flex; align-items: center; gap: 8px; padding: 0 12px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 10px; } .uv-notif-dot { width: 8px; height: 8px; border-radius: 50%; background: #3b82f6; flex-shrink: 0; } .uv-notif-text { font-size: 12px; color: #1e40af; font-weight: 500; }` },
  { source: "css", id: "uv-social-btn", label: "社交按钮", category: "uiverse", pack: "uiverse", propsSchema: [], html: `<div class="uv-social"><span class="uv-social-item">G</span><span class="uv-social-item">f</span><span class="uv-social-item">in</span></div>`, css: `.uv-social { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; } .uv-social-item { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: #fff; cursor: pointer; transition: transform 0.2s; } .uv-social-item:nth-child(1) { background: #ea4335; } .uv-social-item:nth-child(2) { background: #1877f2; } .uv-social-item:nth-child(3) { background: #0a66c2; } .uv-social-item:hover { transform: scale(1.2); }` },
  { source: "css", id: "uv-timeline-css", label: "时间线", category: "uiverse", pack: "uiverse", propsSchema: [], html: `<div class="uv-tl"><div class="uv-tl-item"><span class="uv-tl-dot"></span><span class="uv-tl-text">Step 1</span></div><div class="uv-tl-item"><span class="uv-tl-dot uv-tl-active"></span><span class="uv-tl-text">Step 2</span></div><div class="uv-tl-item"><span class="uv-tl-dot"></span><span class="uv-tl-text">Step 3</span></div></div>`, css: `.uv-tl { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; gap: 4px; } .uv-tl-item { display: flex; flex-direction: column; align-items: center; gap: 4px; flex: 1; position: relative; } .uv-tl-item::after { content: ''; position: absolute; top: 5px; left: 60%; width: 80%; height: 2px; background: #d1d5db; } .uv-tl-item:last-child::after { display: none; } .uv-tl-dot { width: 10px; height: 10px; border-radius: 50%; background: #d1d5db; z-index: 1; } .uv-tl-active { background: var(--uv-color, #6366f1); box-shadow: 0 0 0 3px rgba(99,102,241,0.2); } .uv-tl-text { font-size: 9px; color: #6b7280; }` },
  { source: "css", id: "uv-pricing", label: "定价卡片", category: "uiverse", pack: "uiverse", propsSchema: [{ key: "text", label: "价格", type: "string", bucket: "base" }], html: `<div class="uv-price"><div class="uv-price-tag">$29</div><div class="uv-price-period">/month</div><div class="uv-price-btn">Choose</div></div>`, css: `.uv-price { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; border: 2px solid #e5e7eb; border-radius: 12px; transition: border-color 0.3s; } .uv-price:hover { border-color: var(--uv-color, #6366f1); } .uv-price-tag { font-size: 22px; font-weight: 800; color: #1f2937; } .uv-price-period { font-size: 11px; color: #9ca3af; } .uv-price-btn { margin-top: 4px; padding: 4px 16px; border-radius: 6px; background: var(--uv-color, #6366f1); color: #fff; font-size: 11px; font-weight: 600; cursor: pointer; }` },
  { source: "css", id: "uv-breadcrumb", label: "面包屑", category: "uiverse", pack: "uiverse", propsSchema: [], html: `<div class="uv-bread"><span>Home</span><span class="uv-bread-sep">/</span><span>Docs</span><span class="uv-bread-sep">/</span><span class="uv-bread-active">Page</span></div>`, css: `.uv-bread { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 12px; color: #6b7280; } .uv-bread-sep { color: #d1d5db; } .uv-bread-active { color: var(--uv-color, #6366f1); font-weight: 600; }` },
  { source: "css", id: "uv-badge-count", label: "计数徽章", category: "uiverse", pack: "uiverse", propsSchema: [], html: `<div class="uv-bcount"><span class="uv-bcount-icon">🔔</span><span class="uv-bcount-num">3</span></div>`, css: `.uv-bcount { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; position: relative; } .uv-bcount-icon { font-size: 22px; } .uv-bcount-num { position: absolute; top: 15%; right: 25%; width: 16px; height: 16px; border-radius: 50%; background: #ef4444; color: #fff; font-size: 9px; font-weight: 700; display: flex; align-items: center; justify-content: center; }` },
  { source: "css", id: "uv-skeleton-card", label: "骨架卡片", category: "uiverse", pack: "uiverse", propsSchema: [], html: `<div class="uv-skelcard"><div class="uv-skelcard-img"></div><div class="uv-skelcard-line uv-skelcard-w80"></div><div class="uv-skelcard-line uv-skelcard-w50"></div></div>`, css: `.uv-skelcard { width: 100%; height: 100%; display: flex; flex-direction: column; gap: 6px; padding: 10px; } .uv-skelcard-img { width: 100%; height: 40%; border-radius: 8px; background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%); background-size: 200% 100%; animation: uv-sk 1.5s infinite; } .uv-skelcard-line { height: 8px; border-radius: 4px; background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%); background-size: 200% 100%; animation: uv-sk 1.5s infinite; } .uv-skelcard-w80 { width: 80%; } .uv-skelcard-w50 { width: 50%; } @keyframes uv-sk { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }` },
  { source: "css", id: "uv-ripple-btn", label: "涟漪按钮", category: "uiverse", pack: "uiverse", propsSchema: [{ key: "text", label: "文本", type: "string", bucket: "base" }], html: `<button class="uv-ripple">Ripple</button>`, css: `.uv-ripple { position: relative; width: 100%; height: 100%; border: none; border-radius: 10px; background: #8b5cf6; color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; overflow: hidden; } .uv-ripple::after { content: ''; position: absolute; top: 50%; left: 50%; width: 0; height: 0; border-radius: 50%; background: rgba(255,255,255,0.3); transform: translate(-50%, -50%); transition: width 0.4s, height 0.4s; } .uv-ripple:active::after { width: 200px; height: 200px; }` },
  { source: "css", id: "uv-avatar-stack", label: "头像堆叠", category: "uiverse", pack: "uiverse", propsSchema: [], html: `<div class="uv-avatars"><span class="uv-av" style="background:var(--uv-color, #6366f1)">A</span><span class="uv-av" style="background:#ec4899">B</span><span class="uv-av" style="background:#f59e0b">C</span><span class="uv-av uv-av-more">+3</span></div>`, css: `.uv-avatars { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; } .uv-av { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: #fff; border: 2px solid #fff; margin-left: -8px; } .uv-av:first-child { margin-left: 0; } .uv-av-more { background: #e5e7eb; color: #6b7280; }` },
  { source: "css", id: "uv-tab-css", label: "标签页", category: "uiverse", pack: "uiverse", propsSchema: [], html: `<div class="uv-tabs"><span class="uv-tab uv-tab-active">Tab 1</span><span class="uv-tab">Tab 2</span><span class="uv-tab">Tab 3</span></div>`, css: `.uv-tabs { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; gap: 2px; background: #f3f4f6; border-radius: 8px; padding: 3px; } .uv-tab { padding: 4px 12px; border-radius: 6px; font-size: 11px; font-weight: 500; color: #6b7280; cursor: pointer; transition: all 0.2s; } .uv-tab-active { background: #fff; color: #1f2937; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }` },
  { source: "css", id: "uv-accordion-css", label: "手风琴", category: "uiverse", pack: "uiverse", propsSchema: [], html: `<div class="uv-acc"><div class="uv-acc-item"><div class="uv-acc-header">Section 1 <span>▾</span></div><div class="uv-acc-body">Content here</div></div><div class="uv-acc-item"><div class="uv-acc-header">Section 2 <span>▸</span></div></div></div>`, css: `.uv-acc { width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; gap: 4px; padding: 8px; } .uv-acc-item { border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; } .uv-acc-header { padding: 6px 10px; font-size: 11px; font-weight: 600; color: #374151; cursor: pointer; display: flex; justify-content: space-between; } .uv-acc-body { padding: 4px 10px 8px; font-size: 10px; color: #6b7280; }` },
  { source: "css", id: "uv-toggle-switch", label: "开关", category: "uiverse", pack: "uiverse", propsSchema: [], html: `<div class="uv-toggle"><input type="checkbox" id="uv-tg" class="uv-tg-input"><label for="uv-tg" class="uv-tg-label"></label></div>`, css: `.uv-toggle { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; } .uv-tg-input { display: none; } .uv-tg-label { width: 40px; height: 22px; border-radius: 11px; background: #d1d5db; position: relative; cursor: pointer; transition: background 0.3s; } .uv-tg-label::after { content: ''; position: absolute; top: 2px; left: 2px; width: 18px; height: 18px; border-radius: 50%; background: #fff; transition: transform 0.3s; box-shadow: 0 1px 3px rgba(0,0,0,0.2); } .uv-tg-input:checked + .uv-tg-label { background: var(--uv-color, #6366f1); } .uv-tg-input:checked + .uv-tg-label::after { transform: translateX(18px); }` },
  { source: "css", id: "uv-chip-tag", label: "标签芯片", category: "uiverse", pack: "uiverse", propsSchema: [{ key: "text", label: "文本", type: "string", bucket: "base" }], html: `<div class="uv-chips"><span class="uv-chip">React</span><span class="uv-chip uv-chip-active">Vue</span><span class="uv-chip">Svelte</span></div>`, css: `.uv-chips { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; gap: 6px; flex-wrap: wrap; } .uv-chip { padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 500; background: #f3f4f6; color: #6b7280; cursor: pointer; transition: all 0.2s; border: 1px solid transparent; } .uv-chip:hover { border-color: var(--uv-color, #6366f1); color: var(--uv-color, #6366f1); } .uv-chip-active { background: #eef2ff; color: var(--uv-color, #6366f1); border-color: var(--uv-color, #6366f1); }` },
  { source: "css", id: "uv-floating-label", label: "浮动标签输入", category: "uiverse", pack: "uiverse", propsSchema: [], html: `<div class="uv-fl-input"><input class="uv-fl-field" placeholder=" "><label class="uv-fl-label">Email</label></div>`, css: `.uv-fl-input { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; position: relative; } .uv-fl-field { width: 75%; padding: 10px 12px; border: 2px solid #e5e7eb; border-radius: 10px; font-size: 13px; outline: none; transition: border-color 0.3s; } .uv-fl-field:focus { border-color: var(--uv-color, #6366f1); } .uv-fl-label { position: absolute; left: calc(12.5% + 12px); top: 50%; transform: translateY(-50%); font-size: 13px; color: #9ca3af; pointer-events: none; transition: all 0.2s; } .uv-fl-field:focus ~ .uv-fl-label, .uv-fl-field:not(:placeholder-shown) ~ .uv-fl-label { top: 25%; font-size: 10px; color: var(--uv-color, #6366f1); }` },
  { source: "css", id: "uv-gradient-btn2", label: "渐变动画按钮", category: "uiverse", pack: "uiverse", propsSchema: [{ key: "text", label: "文本", type: "string", bucket: "base" }], html: `<button class="uv-gbtn">Click Me</button>`, css: `.uv-gbtn { width: 100%; height: 100%; border: none; border-radius: 10px; background: linear-gradient(135deg, var(--uv-color, #6366f1), #ec4899, #f59e0b, var(--uv-color, #6366f1)); background-size: 300% 300%; color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; animation: uv-gbtn-shift 4s ease infinite; } @keyframes uv-gbtn-shift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }` },
  { source: "css", id: "uv-pulse-loader", label: "脉冲加载器", category: "uiverse", pack: "uiverse", propsSchema: [], html: `<div class="uv-pload"><span></span><span></span><span></span></div>`, css: `.uv-pload { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; gap: 6px; } .uv-pload span { width: 10px; height: 10px; border-radius: 50%; background: var(--uv-color, #6366f1); animation: uv-pload-b 1.2s ease-in-out infinite; } .uv-pload span:nth-child(2) { animation-delay: 0.2s; background: #ec4899; } .uv-pload span:nth-child(3) { animation-delay: 0.4s; background: #f59e0b; } @keyframes uv-pload-b { 0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; } 40% { transform: scale(1); opacity: 1; } }` },
  { source: "css", id: "uv-card-hover2", label: "悬停抬升卡", category: "uiverse", pack: "uiverse", propsSchema: [{ key: "text", label: "文本", type: "string", bucket: "base" }], html: `<div class="uv-hcard">Hover Card</div>`, css: `.uv-hcard { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #fff; border-radius: 12px; border: 1px solid #e5e7eb; font-size: 13px; font-weight: 600; color: #374151; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; } .uv-hcard:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(99,102,241,0.15); border-color: var(--uv-color, #6366f1); }` },
  { source: "css", id: "uv-circular-prog", label: "环形进度", category: "uiverse", pack: "uiverse", propsSchema: [], html: `<div class="uv-cprog"><svg viewBox="0 0 36 36" width="40" height="40"><circle cx="18" cy="18" r="15" fill="none" stroke="#e5e7eb" stroke-width="3"/><circle class="uv-cprog-arc" cx="18" cy="18" r="15" fill="none" stroke="var(--uv-color, #6366f1)" stroke-width="3" stroke-linecap="round" stroke-dasharray="70 100" transform="rotate(-90 18 18)"/></svg></div>`, css: `.uv-cprog { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; } .uv-cprog-arc { animation: uv-cprog-fill 2s ease-in-out infinite alternate; } @keyframes uv-cprog-fill { from { stroke-dasharray: 20 100; } to { stroke-dasharray: 70 100; } }` },
  { source: "css", id: "uv-typing-dots", label: "打字动画", category: "uiverse", pack: "uiverse", propsSchema: [], html: `<div class="uv-tdots"><span></span><span></span><span></span></div>`, css: `.uv-tdots { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; gap: 4px; background: #f3f4f6; border-radius: 12px; } .uv-tdots span { width: 7px; height: 7px; border-radius: 50%; background: #9ca3af; animation: uv-tdot 1.4s infinite; } .uv-tdots span:nth-child(2) { animation-delay: 0.2s; } .uv-tdots span:nth-child(3) { animation-delay: 0.4s; } @keyframes uv-tdot { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }` },
  { source: "css", id: "uv-slide-toggle", label: "滑动切换", category: "uiverse", pack: "uiverse", propsSchema: [], html: `<div class="uv-stoggle"><span class="uv-st-opt uv-st-active">On</span><span class="uv-st-opt">Off</span><div class="uv-st-slider"></div></div>`, css: `.uv-stoggle { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; } .uv-stoggle { position: relative; display: flex; width: 80px; height: 32px; border-radius: 16px; background: #f3f4f6; overflow: hidden; } .uv-st-opt { flex: 1; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; color: #6b7280; z-index: 1; } .uv-st-active { color: #fff; } .uv-st-slider { position: absolute; top: 2px; left: 2px; width: calc(50% - 2px); height: calc(100% - 4px); border-radius: 14px; background: var(--uv-color, #6366f1); transition: transform 0.3s; }` },
  { source: "css", id: "uv-shine-card", label: "闪光卡片", category: "uiverse", pack: "uiverse", propsSchema: [{ key: "text", label: "文本", type: "string", bucket: "base" }], html: `<div class="uv-shine"><span>Shine Card</span></div>`, css: `.uv-shine { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; border-radius: 12px; background: #1f2937; color: #fff; font-size: 13px; font-weight: 600; } .uv-shine::after { content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%); animation: uv-shine-move 3s infinite; } @keyframes uv-shine-move { 0% { transform: translateX(-100%) rotate(0deg); } 100% { transform: translateX(100%) rotate(0deg); } }` },
  { source: "css", id: "uv-dot-loader", label: "圆点加载", category: "uiverse", pack: "uiverse", propsSchema: [], html: `<div class="uv-dload"><div class="uv-dload-dot"></div></div>`, css: `.uv-dload { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; } .uv-dload-dot { width: 12px; height: 12px; border-radius: 50%; background: var(--uv-color, #6366f1); animation: uv-dload-bounce 0.6s infinite alternate; } @keyframes uv-dload-bounce { from { transform: translateY(-8px); } to { transform: translateY(8px); } }` },
  { source: "css", id: "uv-border-spin", label: "旋转边框", category: "uiverse", pack: "uiverse", propsSchema: [{ key: "text", label: "文本", type: "string", bucket: "base" }], html: `<div class="uv-bspin"><div class="uv-bspin-inner">Content</div></div>`, css: `.uv-bspin { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; padding: 3px; border-radius: 12px; overflow: hidden; position: relative; } .uv-bspin::before { content: ''; position: absolute; inset: -50%; background: conic-gradient(from 0deg, var(--uv-color, #6366f1), #ec4899, #f59e0b, var(--uv-color, #6366f1)); animation: uv-bspin-rot 3s linear infinite; } .uv-bspin-inner { position: relative; z-index: 1; width: 100%; height: 100%; border-radius: 10px; background: #fff; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; color: #374151; } @keyframes uv-bspin-rot { to { transform: rotate(360deg); } }` },
  { source: "css", id: "uv-search-bar", label: "搜索栏", category: "uiverse", pack: "uiverse", propsSchema: [], html: `<div class="uv-search"><span class="uv-search-icon">🔍</span><input class="uv-search-input" placeholder="Search..."></div>`, css: `.uv-search { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; } .uv-search { display: flex; align-items: center; gap: 6px; width: 80%; padding: 6px 12px; border: 2px solid #e5e7eb; border-radius: 20px; transition: border-color 0.3s, box-shadow 0.3s; } .uv-search:focus-within { border-color: var(--uv-color, #6366f1); box-shadow: 0 0 0 3px rgba(99,102,241,0.1); } .uv-search-icon { font-size: 12px; } .uv-search-input { border: none; outline: none; font-size: 12px; flex: 1; }` },
  { source: "css", id: "uv-steps-bar", label: "步骤条", category: "uiverse", pack: "uiverse", propsSchema: [], html: `<div class="uv-steps"><div class="uv-step uv-step-done"><span>1</span></div><div class="uv-step-line uv-step-line-done"></div><div class="uv-step uv-step-current"><span>2</span></div><div class="uv-step-line"></div><div class="uv-step"><span>3</span></div></div>`, css: `.uv-steps { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; gap: 0; padding: 0 16px; } .uv-step { width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; background: #e5e7eb; color: #9ca3af; } .uv-step-done { background: var(--uv-color, #6366f1); color: #fff; } .uv-step-current { background: #fff; border: 2px solid var(--uv-color, #6366f1); color: var(--uv-color, #6366f1); } .uv-step-line { flex: 1; height: 2px; background: #e5e7eb; } .uv-step-line-done { background: var(--uv-color, #6366f1); }` },
  { source: "css", id: "uv-alert-box", label: "警告框", category: "uiverse", pack: "uiverse", propsSchema: [{ key: "text", label: "文本", type: "string", bucket: "base" }], html: `<div class="uv-alert"><span class="uv-alert-icon">⚠️</span><span class="uv-alert-text">Warning message</span></div>`, css: `.uv-alert { width: 100%; height: 100%; display: flex; align-items: center; gap: 8px; padding: 0 12px; background: #fef3c7; border: 1px solid #fcd34d; border-radius: 10px; border-left: 4px solid #f59e0b; } .uv-alert-icon { font-size: 14px; } .uv-alert-text { font-size: 12px; color: #92400e; font-weight: 500; }` },
  { source: "css", id: "uv-expand-card", label: "展开卡片", category: "uiverse", pack: "uiverse", propsSchema: [{ key: "text", label: "文本", type: "string", bucket: "base" }], html: `<div class="uv-exp"><div class="uv-exp-title">Title</div><div class="uv-exp-body">Hidden content revealed on hover</div></div>`, css: `.uv-exp { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; cursor: pointer; transition: all 0.3s; } .uv-exp-title { font-size: 13px; font-weight: 600; color: #374151; } .uv-exp-body { max-height: 0; overflow: hidden; font-size: 11px; color: #6b7280; transition: max-height 0.3s, padding 0.3s; padding: 0 12px; } .uv-exp:hover .uv-exp-body { max-height: 40px; padding: 6px 12px; } .uv-exp:hover { border-color: var(--uv-color, #6366f1); }` },
  { source: "css", id: "uv-wave-loader", label: "波浪加载", category: "uiverse", pack: "uiverse", propsSchema: [], html: `<div class="uv-wload"><span></span><span></span><span></span><span></span><span></span></div>`, css: `.uv-wload { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; gap: 3px; } .uv-wload span { width: 4px; height: 16px; border-radius: 2px; background: var(--uv-color, #6366f1); animation: uv-wload-s 1s ease-in-out infinite; } .uv-wload span:nth-child(2) { animation-delay: 0.1s; background: #818cf8; } .uv-wload span:nth-child(3) { animation-delay: 0.2s; background: #a78bfa; } .uv-wload span:nth-child(4) { animation-delay: 0.3s; background: #c084fc; } .uv-wload span:nth-child(5) { animation-delay: 0.4s; background: #e879f9; } @keyframes uv-wload-s { 0%, 100% { transform: scaleY(0.5); } 50% { transform: scaleY(1.5); } }` },
  { source: "css", id: "uv-profile-card", label: "个人资料卡", category: "uiverse", pack: "uiverse", propsSchema: [], html: `<div class="uv-pcard"><div class="uv-pcard-av">A</div><div class="uv-pcard-name">Alice</div><div class="uv-pcard-role">Developer</div></div>`, css: `.uv-pcard { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; } .uv-pcard-av { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, var(--uv-color, #6366f1), #ec4899); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 13px; font-weight: 700; } .uv-pcard-name { font-size: 13px; font-weight: 700; color: #1f2937; } .uv-pcard-role { font-size: 11px; color: #9ca3af; }` },
  { source: "css", id: "uv-countdown", label: "倒计时", category: "uiverse", pack: "uiverse", propsSchema: [], html: `<div class="uv-cdown"><div class="uv-cdown-item"><span class="uv-cdown-num">02</span><span class="uv-cdown-label">H</span></div><span class="uv-cdown-sep">:</span><div class="uv-cdown-item"><span class="uv-cdown-num">45</span><span class="uv-cdown-label">M</span></div><span class="uv-cdown-sep">:</span><div class="uv-cdown-item"><span class="uv-cdown-num">30</span><span class="uv-cdown-label">S</span></div></div>`, css: `.uv-cdown { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; gap: 4px; } .uv-cdown-item { display: flex; flex-direction: column; align-items: center; } .uv-cdown-num { font-size: 18px; font-weight: 800; color: #1f2937; font-variant-numeric: tabular-nums; } .uv-cdown-label { font-size: 9px; color: #9ca3af; font-weight: 600; } .uv-cdown-sep { font-size: 16px; font-weight: 700; color: #d1d5db; }` },
  { source: "css", id: "uv-hover-underline", label: "悬停下划线", category: "uiverse", pack: "uiverse", propsSchema: [{ key: "text", label: "文本", type: "string", bucket: "base" }], html: `<div class="uv-hul"><span class="uv-hul-text">Hover Link</span></div>`, css: `.uv-hul { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; } .uv-hul-text { position: relative; font-size: 14px; font-weight: 600; color: #374151; cursor: pointer; } .uv-hul-text::after { content: ''; position: absolute; bottom: -2px; left: 0; width: 0; height: 2px; background: var(--uv-color, #6366f1); transition: width 0.3s; } .uv-hul-text:hover::after { width: 100%; }` },
  { source: "css", id: "uv-mini-player", label: "迷你播放器", category: "uiverse", pack: "uiverse", propsSchema: [], html: `<div class="uv-player"><div class="uv-player-info"><span class="uv-player-title">Song</span><span class="uv-player-artist">Artist</span></div><div class="uv-player-bar"><div class="uv-player-prog"></div></div><div class="uv-player-btns"><span>⏮</span><span>▶</span><span>⏭</span></div></div>`, css: `.uv-player { width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; gap: 6px; padding: 10px 14px; background: #f9fafb; border-radius: 12px; border: 1px solid #e5e7eb; } .uv-player-info { display: flex; justify-content: space-between; } .uv-player-title { font-size: 12px; font-weight: 700; color: #1f2937; } .uv-player-artist { font-size: 10px; color: #9ca3af; } .uv-player-bar { height: 3px; background: #e5e7eb; border-radius: 2px; overflow: hidden; } .uv-player-prog { width: 40%; height: 100%; background: var(--uv-color, #6366f1); border-radius: 2px; } .uv-player-btns { display: flex; justify-content: center; gap: 12px; font-size: 12px; cursor: pointer; }` },
  { source: "css", id: "uv-status-badge", label: "状态徽章组", category: "uiverse", pack: "uiverse", propsSchema: [], html: `<div class="uv-sbadges"><span class="uv-sbadge uv-sbadge-ok">Online</span><span class="uv-sbadge uv-sbadge-warn">Away</span><span class="uv-sbadge uv-sbadge-err">Busy</span></div>`, css: `.uv-sbadges { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; gap: 6px; } .uv-sbadge { padding: 3px 10px; border-radius: 12px; font-size: 10px; font-weight: 600; } .uv-sbadge-ok { background: #dcfce7; color: #166534; } .uv-sbadge-warn { background: #fef9c3; color: #854d0e; } .uv-sbadge-err { background: #fee2e2; color: #991b1b; }` },
  { source: "css", id: "uv-animated-border", label: "动画边框按钮", category: "uiverse", pack: "uiverse", propsSchema: [{ key: "text", label: "文本", type: "string", bucket: "base" }], html: `<button class="uv-abtn">Animated</button>`, css: `.uv-abtn { width: 100%; height: 100%; border: 2px solid transparent; border-radius: 10px; background: linear-gradient(#fff, #fff) padding-box, linear-gradient(135deg, var(--uv-color, #6366f1), #ec4899, #f59e0b) border-box; font-size: 13px; font-weight: 600; color: #374151; cursor: pointer; transition: all 0.3s; } .uv-abtn:hover { background: linear-gradient(#f5f3ff, #f5f3ff) padding-box, linear-gradient(315deg, var(--uv-color, #6366f1), #ec4899, #f59e0b) border-box; transform: scale(1.02); }` },
];
