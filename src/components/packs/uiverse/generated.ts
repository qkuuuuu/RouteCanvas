import type { ComponentDef } from "@/types/schema";

const COLOR_OPTIONS = ["indigo","pink","blue","green","amber","red","purple","cyan","orange","teal"];
const COLOR_MAP: Record<string, string> = {
  indigo: "#6366f1", pink: "#ec4899", blue: "#3b82f6", green: "#22c55e",
  amber: "#f59e0b", red: "#ef4444", purple: "#8b5cf6", cyan: "#06b6d4",
  orange: "#f97316", teal: "#14b8a6",
};

const colorField = { key: "color", label: "颜色", type: "select" as const, options: COLOR_OPTIONS, default: "indigo", bucket: "custom" as const };
const textField = { key: "text", label: "文本", type: "string" as const, bucket: "base" as const };

/**
 * uiverse 生成组件使用 CSS 变量 --uv-color 注入颜色。
 * 渲染时 CssSandbox 会将 props.custom.color 映射为 style="--uv-color: xxx"。
 * 这里 css 中统一使用 var(--uv-color, #6366f1)。
 */

export const generatedUVDefs: ComponentDef[] = [
  {
    source: "css", id: "uv-g-button", label: "CSS动画按钮", category: "uiverse", pack: "uiverse",
    propsSchema: [textField, colorField],
    html: `<button class="uv-g-btn">Button</button>`,
    css: `.uv-g-btn{width:100%;height:100%;border:none;border-radius:8px;background:var(--uv-color,#6366f1);color:#fff;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s;box-shadow:0 4px 12px color-mix(in srgb,var(--uv-color,#6366f1) 30%,transparent)}.uv-g-btn:hover{transform:translateY(-2px) scale(1.02);box-shadow:0 6px 16px color-mix(in srgb,var(--uv-color,#6366f1) 50%,transparent)}.uv-g-btn:active{transform:translateY(0) scale(.98)}`,
  },
  {
    source: "css", id: "uv-g-card", label: "CSS悬浮卡片", category: "uiverse", pack: "uiverse",
    propsSchema: [textField, colorField],
    html: `<div class="uv-g-card"><span class="uv-g-card-title">Card</span><span class="uv-g-card-desc">Hover me</span></div>`,
    css: `.uv-g-card{width:100%;height:100%;border-radius:12px;border:2px solid color-mix(in srgb,var(--uv-color,#6366f1) 25%,transparent);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;transition:all .3s;cursor:pointer}.uv-g-card:hover{border-color:var(--uv-color,#6366f1);box-shadow:0 8px 24px color-mix(in srgb,var(--uv-color,#6366f1) 20%,transparent);transform:translateY(-2px)}.uv-g-card-title{font-size:12px;font-weight:700;color:var(--uv-color,#6366f1)}.uv-g-card-desc{font-size:10px;color:#9ca3af}`,
  },
  {
    source: "css", id: "uv-g-loader", label: "CSS加载器", category: "uiverse", pack: "uiverse",
    propsSchema: [colorField],
    html: `<div class="uv-g-load"></div>`,
    css: `.uv-g-load{width:100%;height:100%;display:flex;align-items:center;justify-content:center}.uv-g-load::after{content:'';width:28px;height:28px;border:3px solid #e5e7eb;border-top-color:var(--uv-color,#6366f1);border-radius:50%;animation:uv-g-spin .7s linear infinite}@keyframes uv-g-spin{to{transform:rotate(360deg)}}`,
  },
  {
    source: "css", id: "uv-g-badge", label: "CSS徽章", category: "uiverse", pack: "uiverse",
    propsSchema: [textField, colorField],
    html: `<div class="uv-g-badge"><span>Badge</span></div>`,
    css: `.uv-g-badge{width:100%;height:100%;display:flex;align-items:center;justify-content:center}.uv-g-badge span{padding:4px 12px;border-radius:999px;background:var(--uv-color,#6366f1);color:#fff;font-size:11px;font-weight:600;box-shadow:0 0 8px color-mix(in srgb,var(--uv-color,#6366f1) 40%,transparent);animation:uv-g-glowb 1.5s infinite}@keyframes uv-g-glowb{0%,100%{box-shadow:0 0 4px color-mix(in srgb,var(--uv-color,#6366f1) 30%,transparent)}50%{box-shadow:0 0 12px color-mix(in srgb,var(--uv-color,#6366f1) 60%,transparent)}}`,
  },
  {
    source: "css", id: "uv-g-input", label: "CSS输入框", category: "uiverse", pack: "uiverse",
    propsSchema: [textField, colorField],
    html: `<div class="uv-g-input"><input placeholder="Type..." /></div>`,
    css: `.uv-g-input{width:100%;height:100%;display:flex;align-items:center;justify-content:center}.uv-g-input input{width:80%;border:2px solid #e5e7eb;border-radius:8px;padding:6px 10px;font-size:12px;outline:none;transition:all .3s}.uv-g-input input:focus{border-color:var(--uv-color,#6366f1);box-shadow:0 0 0 3px color-mix(in srgb,var(--uv-color,#6366f1) 15%,transparent)}`,
  },
  {
    source: "css", id: "uv-g-toggle", label: "CSS开关", category: "uiverse", pack: "uiverse", subCategory: "表单",
    propsSchema: [colorField],
    html: `<div class="uv-g-toggle"><div class="uv-g-toggle-track"><div class="uv-g-toggle-thumb"></div></div></div>`,
    css: `.uv-g-toggle{width:100%;height:100%;display:flex;align-items:center;justify-content:center}.uv-g-toggle-track{width:44px;height:24px;border-radius:12px;background:var(--uv-color,#6366f1);position:relative;cursor:pointer;transition:background .3s}.uv-g-toggle-thumb{width:20px;height:20px;border-radius:50%;background:#fff;position:absolute;top:2px;right:2px;box-shadow:0 1px 3px rgba(0,0,0,.2);transition:all .3s}`,
  },
  {
    source: "css", id: "uv-g-progress", label: "CSS进度条", category: "uiverse", pack: "uiverse", subCategory: "反馈",
    propsSchema: [colorField],
    html: `<div class="uv-g-progress"><div class="uv-g-progress-bar"></div></div>`,
    css: `.uv-g-progress{width:100%;height:100%;display:flex;align-items:center;justify-content:center;padding:0 12px}.uv-g-progress-bar{width:100%;height:8px;border-radius:4px;background:#e5e7eb;overflow:hidden;position:relative}.uv-g-progress-bar::after{content:'';position:absolute;left:0;top:0;height:100%;width:70%;border-radius:4px;background:var(--uv-color,#6366f1);animation:uv-g-prog 2s ease-in-out infinite}@keyframes uv-g-prog{0%{width:20%}50%{width:80%}100%{width:20%}}`,
  },
  {
    source: "css", id: "uv-g-tooltip", label: "CSS提示框", category: "uiverse", pack: "uiverse", subCategory: "反馈",
    propsSchema: [textField, colorField],
    html: `<div class="uv-g-tip"><span class="uv-g-tip-trigger">Hover</span><span class="uv-g-tip-box">Tooltip</span></div>`,
    css: `.uv-g-tip{width:100%;height:100%;display:flex;align-items:center;justify-content:center;position:relative}.uv-g-tip-trigger{font-size:12px;color:var(--uv-color,#6366f1);cursor:pointer;font-weight:600}.uv-g-tip-box{position:absolute;bottom:70%;left:50%;transform:translateX(-50%) scale(.8);opacity:0;background:#1f2937;color:#fff;font-size:10px;padding:4px 10px;border-radius:6px;white-space:nowrap;transition:all .2s;pointer-events:none}.uv-g-tip:hover .uv-g-tip-box{opacity:1;transform:translateX(-50%) scale(1)}`,
  },
  {
    source: "css", id: "uv-g-skeleton", label: "CSS骨架屏", category: "uiverse", pack: "uiverse", subCategory: "反馈",
    propsSchema: [colorField],
    html: `<div class="uv-g-skel"><div class="uv-g-skel-circle"></div><div class="uv-g-skel-lines"><div class="uv-g-skel-line w80"></div><div class="uv-g-skel-line w60"></div></div></div>`,
    css: `.uv-g-skel{width:100%;height:100%;display:flex;align-items:center;gap:10px;padding:12px}.uv-g-skel-circle{width:32px;height:32px;border-radius:50%;background:linear-gradient(90deg,#e5e7eb 25%,#f3f4f6 50%,#e5e7eb 75%);background-size:200% 100%;animation:uv-g-shimmer 1.5s infinite}.uv-g-skel-lines{flex:1;display:flex;flex-direction:column;gap:6px}.uv-g-skel-line{height:10px;border-radius:4px;background:linear-gradient(90deg,#e5e7eb 25%,#f3f4f6 50%,#e5e7eb 75%);background-size:200% 100%;animation:uv-g-shimmer 1.5s infinite}.w80{width:80%}.w60{width:60%}@keyframes uv-g-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`,
  },
  {
    source: "css", id: "uv-g-chip", label: "CSS标签", category: "uiverse", pack: "uiverse", subCategory: "徽章",
    propsSchema: [textField, colorField],
    html: `<div class="uv-g-chip"><span>Tag</span><span class="uv-g-chip-x">×</span></div>`,
    css: `.uv-g-chip{width:100%;height:100%;display:flex;align-items:center;justify-content:center}.uv-g-chip span:first-child{padding:3px 10px;border-radius:6px;background:color-mix(in srgb,var(--uv-color,#6366f1) 12%,transparent);color:var(--uv-color,#6366f1);font-size:11px;font-weight:600;border:1px solid color-mix(in srgb,var(--uv-color,#6366f1) 30%,transparent)}.uv-g-chip-x{margin-left:4px;cursor:pointer;color:var(--uv-color,#6366f1);font-size:12px}`,
  },
  {
    source: "css", id: "uv-g-avatar", label: "CSS头像", category: "uiverse", pack: "uiverse", subCategory: "展示",
    propsSchema: [colorField],
    html: `<div class="uv-g-avatar"><span>A</span><span class="uv-g-avatar-dot"></span></div>`,
    css: `.uv-g-avatar{width:100%;height:100%;display:flex;align-items:center;justify-content:center;position:relative}.uv-g-avatar span:first-child{width:40px;height:40px;border-radius:50%;background:var(--uv-color,#6366f1);color:#fff;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700}.uv-g-avatar-dot{position:absolute;bottom:calc(50% - 18px);right:calc(50% - 18px);width:10px;height:10px;border-radius:50%;background:#22c55e;border:2px solid #fff}`,
  },
  {
    source: "css", id: "uv-g-breadcrumb", label: "CSS面包屑", category: "uiverse", pack: "uiverse", subCategory: "导航",
    propsSchema: [colorField],
    html: `<div class="uv-g-bread"><span>Home</span><i>/</i><span>Page</span><i>/</i><span class="active">Detail</span></div>`,
    css: `.uv-g-bread{width:100%;height:100%;display:flex;align-items:center;justify-content:center;gap:6px;font-size:11px}.uv-g-bread span{color:#6b7280;cursor:pointer;transition:color .2s}.uv-g-bread span:hover{color:var(--uv-color,#6366f1)}.uv-g-bread span.active{color:var(--uv-color,#6366f1);font-weight:600}.uv-g-bread i{color:#d1d5db;font-style:normal}`,
  },
  {
    source: "css", id: "uv-g-alert", label: "CSS警告框", category: "uiverse", pack: "uiverse", subCategory: "反馈",
    propsSchema: [textField, colorField],
    html: `<div class="uv-g-alert"><span class="uv-g-alert-icon">⚠</span><span>Warning message</span></div>`,
    css: `.uv-g-alert{width:100%;height:100%;display:flex;align-items:center;justify-content:center;padding:8px}.uv-g-alert>div,.uv-g-alert{display:flex;align-items:center;gap:8px;width:90%;padding:8px 12px;border-radius:8px;background:color-mix(in srgb,var(--uv-color,#6366f1) 8%,transparent);border:1px solid color-mix(in srgb,var(--uv-color,#6366f1) 25%,transparent)}.uv-g-alert-icon{font-size:14px}.uv-g-alert span:last-child{font-size:11px;color:#374151}`,
  },
  {
    source: "css", id: "uv-g-tabs", label: "CSS标签页", category: "uiverse", pack: "uiverse", subCategory: "导航",
    propsSchema: [colorField],
    html: `<div class="uv-g-tabs"><span class="active">Tab 1</span><span>Tab 2</span><span>Tab 3</span></div>`,
    css: `.uv-g-tabs{width:100%;height:100%;display:flex;align-items:center;justify-content:center;gap:2px;padding:4px}.uv-g-tabs span{padding:5px 14px;font-size:11px;border-radius:6px;cursor:pointer;color:#6b7280;transition:all .2s}.uv-g-tabs span.active{background:var(--uv-color,#6366f1);color:#fff;font-weight:600;box-shadow:0 2px 8px color-mix(in srgb,var(--uv-color,#6366f1) 30%,transparent)}.uv-g-tabs span:not(.active):hover{background:#f3f4f6}`,
  },
  {
    source: "css", id: "uv-g-pricing", label: "CSS价格卡", category: "uiverse", pack: "uiverse", subCategory: "卡片",
    propsSchema: [colorField],
    html: `<div class="uv-g-price"><span class="uv-g-price-label">Pro</span><span class="uv-g-price-val">$29</span><span class="uv-g-price-per">/mo</span><div class="uv-g-price-btn">Get Started</div></div>`,
    css: `.uv-g-price{width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;border-radius:12px;border:2px solid color-mix(in srgb,var(--uv-color,#6366f1) 20%,transparent);padding:8px}.uv-g-price-label{font-size:10px;color:#6b7280;font-weight:600;text-transform:uppercase}.uv-g-price-val{font-size:22px;font-weight:800;color:var(--uv-color,#6366f1)}.uv-g-price-per{font-size:9px;color:#9ca3af}.uv-g-price-btn{margin-top:4px;padding:4px 16px;border-radius:6px;background:var(--uv-color,#6366f1);color:#fff;font-size:10px;font-weight:600;cursor:pointer;transition:transform .2s}.uv-g-price-btn:hover{transform:scale(1.05)}`,
  },
  {
    source: "css", id: "uv-g-timeline", label: "CSS时间线", category: "uiverse", pack: "uiverse", subCategory: "布局",
    propsSchema: [colorField],
    html: `<div class="uv-g-tl"><div class="uv-g-tl-item"><span class="uv-g-tl-dot"></span><span>Step 1</span></div><div class="uv-g-tl-item"><span class="uv-g-tl-dot"></span><span>Step 2</span></div><div class="uv-g-tl-item"><span class="uv-g-tl-dot"></span><span>Step 3</span></div></div>`,
    css: `.uv-g-tl{width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;padding:8px 16px;gap:0}.uv-g-tl-item{display:flex;align-items:center;gap:8px;position:relative;padding:4px 0}.uv-g-tl-item:not(:last-child)::after{content:'';position:absolute;left:5px;top:18px;bottom:-4px;width:2px;background:color-mix(in srgb,var(--uv-color,#6366f1) 30%,transparent)}.uv-g-tl-dot{width:12px;height:12px;border-radius:50%;background:var(--uv-color,#6366f1);flex-shrink:0}.uv-g-tl-item span:last-child{font-size:11px;color:#374151}`,
  },
  {
    source: "css", id: "uv-g-notification", label: "CSS通知条", category: "uiverse", pack: "uiverse", subCategory: "反馈",
    propsSchema: [textField, colorField],
    html: `<div class="uv-g-notif"><span class="uv-g-notif-dot"></span><span>New message received</span><span class="uv-g-notif-time">2m</span></div>`,
    css: `.uv-g-notif{width:100%;height:100%;display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:10px;background:#fff;border:1px solid #e5e7eb;box-shadow:0 2px 8px rgba(0,0,0,.06)}.uv-g-notif-dot{width:8px;height:8px;border-radius:50%;background:var(--uv-color,#6366f1);animation:uv-g-pulse2 1.5s infinite}.uv-g-notif span:nth-child(2){font-size:11px;color:#374151;flex:1}.uv-g-notif-time{font-size:9px;color:#9ca3af}@keyframes uv-g-pulse2{0%,100%{opacity:1}50%{opacity:.4}}`,
  },
  {
    source: "css", id: "uv-g-rating", label: "CSS评分", category: "uiverse", pack: "uiverse", subCategory: "展示",
    propsSchema: [colorField],
    html: `<div class="uv-g-rating"><span>★</span><span>★</span><span>★</span><span>★</span><span class="dim">★</span></div>`,
    css: `.uv-g-rating{width:100%;height:100%;display:flex;align-items:center;justify-content:center;gap:2px;font-size:18px}.uv-g-rating span{color:var(--uv-color,#6366f1);cursor:pointer;transition:transform .15s}.uv-g-rating span:hover{transform:scale(1.2)}.uv-g-rating span.dim{color:#d1d5db}`,
  },
  {
    source: "css", id: "uv-g-divider", label: "CSS分割线", category: "uiverse", pack: "uiverse", subCategory: "布局",
    propsSchema: [colorField],
    html: `<div class="uv-g-divider"><span>OR</span></div>`,
    css: `.uv-g-divider{width:100%;height:100%;display:flex;align-items:center;padding:0 12px}.uv-g-divider::before,.uv-g-divider::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,transparent,var(--uv-color,#6366f1),transparent)}.uv-g-divider span{padding:0 10px;font-size:10px;color:var(--uv-color,#6366f1);font-weight:600}`,
  },
  {
    source: "css", id: "uv-g-accordion", label: "CSS手风琴", category: "uiverse", pack: "uiverse", subCategory: "布局",
    propsSchema: [colorField],
    html: `<div class="uv-g-acc"><div class="uv-g-acc-item open"><span class="uv-g-acc-title">Section 1</span><span class="uv-g-acc-body">Content here</span></div><div class="uv-g-acc-item"><span class="uv-g-acc-title">Section 2</span></div></div>`,
    css: `.uv-g-acc{width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;padding:8px;gap:4px}.uv-g-acc-item{border:1px solid #e5e7eb;border-radius:8px;overflow:hidden}.uv-g-acc-title{display:block;padding:6px 10px;font-size:11px;font-weight:600;color:#374151;cursor:pointer;background:#f9fafb}.uv-g-acc-item.open .uv-g-acc-title{color:var(--uv-color,#6366f1);border-bottom:1px solid #e5e7eb}.uv-g-acc-body{display:block;padding:6px 10px;font-size:10px;color:#6b7280}`,
  },
  {
    source: "css", id: "uv-g-stepper", label: "CSS步骤器", category: "uiverse", pack: "uiverse", subCategory: "导航",
    propsSchema: [colorField],
    html: `<div class="uv-g-step"><span class="done">1</span><i></i><span class="current">2</span><i></i><span>3</span></div>`,
    css: `.uv-g-step{width:100%;height:100%;display:flex;align-items:center;justify-content:center;gap:0}.uv-g-step span{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;border:2px solid #d1d5db;color:#9ca3af}.uv-g-step span.done{background:var(--uv-color,#6366f1);border-color:var(--uv-color,#6366f1);color:#fff}.uv-g-step span.current{border-color:var(--uv-color,#6366f1);color:var(--uv-color,#6366f1)}.uv-g-step i{width:24px;height:2px;background:#d1d5db}`,
  },
];

/** 颜色映射表（供 CssSandbox 注入 CSS 变量时使用） */
export const UV_COLOR_MAP = COLOR_MAP;
