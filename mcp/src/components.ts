/**
 * RouteCanvas 组件注册表摘要（供 MCP list_components 使用）
 * 与 src/components 中的 builtin + packs 保持同步
 */

export interface ComponentSummary {
  id: string;
  label: string;
  category: string;
  subCategory?: string;
  props: string[]; // 可配置的 prop key 列表
}

export const COMPONENTS: ComponentSummary[] = [
  // ===== builtin =====
  { id: "Button", label: "按钮", category: "基础", props: ["text", "variant(primary/secondary/ghost/danger)", "size(sm/md/lg)"] },
  { id: "Input", label: "输入框", category: "表单", props: ["text", "placeholder", "editable"] },
  { id: "Text", label: "文本", category: "基础", props: ["text", "variant(h1/h2/h3/body/caption)"] },
  { id: "Image", label: "图片", category: "展示", props: ["imageSrc", "text(alt)"] },
  { id: "Card", label: "卡片", category: "展示", props: ["text"] },
  { id: "Form", label: "表单", category: "表单", props: ["text", "code"] },
  { id: "Container", label: "容器", category: "基础", props: ["text", "bg", "border"] },
  { id: "Badge", label: "徽章", category: "基础", props: ["text"] },
  { id: "Switch", label: "开关", category: "表单", props: ["text"] },
  { id: "Slider", label: "滑块", category: "表单", props: ["text"] },
  { id: "Progress", label: "进度条", category: "反馈", props: ["text"] },
  { id: "Tabs", label: "标签页", category: "导航", props: ["text"] },
  { id: "Navbar", label: "导航栏", category: "导航", props: ["text"] },
  { id: "Section", label: "区块容器", category: "布局", props: ["text"] },

  // ===== React Bits (rb-) =====
  { id: "rb-animated-cursor", label: "动画光标", category: "React Bits", subCategory: "文字", props: ["text", "color"] },
  { id: "rb-gradient-text", label: "渐变文字", category: "React Bits", subCategory: "文字", props: ["text", "color"] },
  { id: "rb-text-pressure", label: "压力文字", category: "React Bits", subCategory: "文字", props: ["text"] },
  { id: "rb-count-up", label: "数字滚动", category: "React Bits", subCategory: "数字", props: ["text"] },
  { id: "rb-decrypted-text", label: "解密文字", category: "React Bits", subCategory: "文字", props: ["text"] },
  { id: "rb-shiny-text", label: "闪光文字", category: "React Bits", subCategory: "文字", props: ["text", "color"] },
  { id: "rb-split-text", label: "拆分文字", category: "React Bits", subCategory: "文字", props: ["text"] },
  { id: "rb-blur-text", label: "模糊文字", category: "React Bits", subCategory: "文字", props: ["text"] },
  { id: "rb-fuzzy-text", label: "绒毛文字", category: "React Bits", subCategory: "文字", props: ["text"] },
  { id: "rb-falling-text", label: "下落文字", category: "React Bits", subCategory: "文字", props: ["text"] },
  { id: "rb-aurora-bg", label: "极光背景", category: "React Bits", subCategory: "背景", props: [] },
  { id: "rb-squares-bg", label: "方格背景", category: "React Bits", subCategory: "背景", props: ["color"] },
  { id: "rb-dots-bg", label: "圆点背景", category: "React Bits", subCategory: "背景", props: ["color"] },
  { id: "rb-lines-bg", label: "线条背景", category: "React Bits", subCategory: "背景", props: ["color"] },

  // ===== Aceternity (ac-) =====
  { id: "ac-spotlight-card", label: "聚光卡片", category: "Aceternity", subCategory: "卡片", props: ["text", "color"] },
  { id: "ac-3d-card", label: "3D卡片", category: "Aceternity", subCategory: "卡片", props: ["text", "imageSrc"] },
  { id: "ac-text-generate", label: "文字生成", category: "Aceternity", subCategory: "文字", props: ["text"] },
  { id: "ac-typewriter", label: "打字机", category: "Aceternity", subCategory: "文字", props: ["text"] },
  { id: "ac-moving-border", label: "流动边框", category: "Aceternity", subCategory: "按钮", props: ["text", "color"] },
  { id: "ac-glowing-btn", label: "发光按钮", category: "Aceternity", subCategory: "按钮", props: ["text", "color"] },
  { id: "ac-hover-border", label: "悬停边框", category: "Aceternity", subCategory: "卡片", props: ["text"] },
  { id: "ac-timeline", label: "时间线", category: "Aceternity", subCategory: "展示", props: ["text"] },
  { id: "ac-infinite-moving", label: "无限滚动", category: "Aceternity", subCategory: "展示", props: ["text"] },
  { id: "ac-meteors", label: "流星", category: "Aceternity", subCategory: "背景", props: [] },
  { id: "ac-sparkles", label: "火花", category: "Aceternity", subCategory: "背景", props: ["color"] },
  { id: "ac-vortex", label: "漩涡", category: "Aceternity", subCategory: "背景", props: [] },

  // ===== Shadcn (scn-) =====
  { id: "scn-command", label: "命令面板", category: "Shadcn", subCategory: "导航", props: ["text", "color"] },
  { id: "scn-breadcrumb", label: "面包屑", category: "Shadcn", subCategory: "导航", props: ["text", "color"] },
  { id: "scn-data-table", label: "数据表格", category: "Shadcn", subCategory: "展示", props: ["text", "color"] },
  { id: "scn-progress-steps", label: "步骤条", category: "Shadcn", subCategory: "反馈", props: ["text", "color"] },
  { id: "scn-stat-card", label: "统计卡片", category: "Shadcn", subCategory: "展示", props: ["text", "color"] },
  { id: "scn-calendar-widget", label: "日历组件", category: "Shadcn", subCategory: "展示", props: ["color"] },
  { id: "scn-avatar-group", label: "头像组", category: "Shadcn", subCategory: "展示", props: ["color"] },
  { id: "scn-timeline-list", label: "时间线列表", category: "Shadcn", subCategory: "展示", props: ["text", "color"] },
  { id: "scn-rating-stars", label: "评分星星", category: "Shadcn", subCategory: "表单", props: ["color"] },
  { id: "scn-file-upload", label: "文件上传", category: "Shadcn", subCategory: "表单", props: ["text", "color"] },
  { id: "scn-alert-dialog", label: "确认对话框", category: "Shadcn", subCategory: "反馈", props: ["text", "color"] },
  { id: "scn-empty-state", label: "空状态", category: "Shadcn", subCategory: "反馈", props: ["text", "color"] },
  { id: "scn-skeleton-card", label: "骨架屏卡片", category: "Shadcn", subCategory: "反馈", props: ["color"] },
  { id: "scn-tag-input", label: "标签输入", category: "Shadcn", subCategory: "表单", props: ["text", "color"] },
  { id: "scn-color-picker", label: "颜色选择器", category: "Shadcn", subCategory: "表单", props: ["color"] },

  // ===== Magic UI (mui-) =====
  { id: "mui-particle-text", label: "粒子文字", category: "Magic UI", subCategory: "文字", props: ["text", "color"] },
  { id: "mui-meteor-rain", label: "流星雨", category: "Magic UI", subCategory: "背景", props: [] },
  { id: "mui-breathing-glow", label: "呼吸光环", category: "Magic UI", subCategory: "背景", props: ["color"] },
  { id: "mui-card-stack", label: "卡片堆叠", category: "Magic UI", subCategory: "卡片", props: ["text"] },
  { id: "mui-wave-progress", label: "波浪进度", category: "Magic UI", subCategory: "反馈", props: ["text", "color"] },

  // ===== Dashboard (dash-) =====
  { id: "dash-progress-board", label: "进度看板", category: "Dashboard", subCategory: "数据", props: ["text", "color"] },
  { id: "dash-calendar-heat", label: "日历热力", category: "Dashboard", subCategory: "数据", props: ["color"] },
  { id: "dash-rank-list", label: "排行榜", category: "Dashboard", subCategory: "数据", props: ["text", "color"] },
  { id: "dash-ring-stat", label: "环形统计", category: "Dashboard", subCategory: "数据", props: ["text", "color"] },
  { id: "dash-quick-actions", label: "快捷操作", category: "Dashboard", subCategory: "布局", props: ["text", "color"] },

  // ===== 动画背景 (abg-) =====
  { id: "abg-aurora", label: "极光", category: "动画背景", props: [] },
  { id: "abg-particles", label: "粒子", category: "动画背景", props: ["color"] },
  { id: "abg-waves", label: "波浪", category: "动画背景", props: ["color"] },
  { id: "abg-gradient-mesh", label: "渐变网格", category: "动画背景", props: [] },

  // ===== 3D 特效 (td-) =====
  { id: "td-tilt-card", label: "倾斜卡片", category: "3D特效", props: ["text", "imageSrc"] },
  { id: "td-parallax", label: "视差层", category: "3D特效", props: ["text"] },

  // ===== Uiverse (uv-) =====
  { id: "uv-neon-btn", label: "霓虹按钮", category: "Uiverse", subCategory: "按钮", props: ["text"] },
  { id: "uv-glass-card", label: "玻璃卡片", category: "Uiverse", subCategory: "卡片", props: ["text"] },
  { id: "uv-loader", label: "加载动画", category: "Uiverse", subCategory: "反馈", props: [] },
];

/** 生成给 LLM 的紧凑文本摘要 */
export function componentListText(): string {
  const lines = COMPONENTS.map(
    (c) =>
      `- ${c.id}（${c.label}）[${c.category}${c.subCategory ? "/" + c.subCategory : ""}] props: ${c.props.join(", ") || "无"}`,
  );
  return `可用组件（共 ${COMPONENTS.length} 个，type 必须从中选择）：\n${lines.join("\n")}`;
}
