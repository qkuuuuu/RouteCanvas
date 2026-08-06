import type { ComponentDef } from "@/types/schema";

const COLOR_OPTIONS = ["#6366f1", "#ec4899", "#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];
const textField = { key: "text", label: "文本", type: "string" as const, bucket: "base" as const };
const colorField = { key: "color", label: "主题色", type: "select" as const, options: COLOR_OPTIONS, default: "#6366f1", bucket: "custom" as const };

export const shadcnDefs: ComponentDef[] = [
  { source: "pack", id: "scn-command", label: "命令面板", category: "Shadcn", pack: "shadcn", subCategory: "导航", propsSchema: [textField, colorField] },
  { source: "pack", id: "scn-breadcrumb", label: "面包屑", category: "Shadcn", pack: "shadcn", subCategory: "导航", propsSchema: [textField, colorField] },
  { source: "pack", id: "scn-sheet", label: "侧滑面板", category: "Shadcn", pack: "shadcn", subCategory: "布局", propsSchema: [textField, colorField] },
  { source: "pack", id: "scn-hover-card", label: "悬停卡片", category: "Shadcn", pack: "shadcn", subCategory: "卡片", propsSchema: [textField, colorField] },
  { source: "pack", id: "scn-context-menu", label: "右键菜单", category: "Shadcn", pack: "shadcn", subCategory: "导航", propsSchema: [colorField] },
  { source: "pack", id: "scn-menubar", label: "菜单栏", category: "Shadcn", pack: "shadcn", subCategory: "导航", propsSchema: [textField, colorField] },
  { source: "pack", id: "scn-collapsible", label: "折叠区域", category: "Shadcn", pack: "shadcn", subCategory: "布局", propsSchema: [textField, colorField] },
  { source: "pack", id: "scn-input-otp", label: "OTP输入", category: "Shadcn", pack: "shadcn", subCategory: "表单", propsSchema: [colorField] },
  { source: "pack", id: "scn-toggle-group", label: "切换组", category: "Shadcn", pack: "shadcn", subCategory: "表单", propsSchema: [textField, colorField] },
  { source: "pack", id: "scn-skeleton-card", label: "骨架屏卡片", category: "Shadcn", pack: "shadcn", subCategory: "反馈", propsSchema: [colorField] },
  { source: "pack", id: "scn-notification-card", label: "通知卡片", category: "Shadcn", pack: "shadcn", subCategory: "反馈", propsSchema: [textField, colorField] },
  { source: "pack", id: "scn-progress-steps", label: "步骤条", category: "Shadcn", pack: "shadcn", subCategory: "反馈", propsSchema: [textField, colorField] },
  { source: "pack", id: "scn-tag-input", label: "标签输入", category: "Shadcn", pack: "shadcn", subCategory: "表单", propsSchema: [textField, colorField] },
  { source: "pack", id: "scn-alert-dialog", label: "确认对话框", category: "Shadcn", pack: "shadcn", subCategory: "反馈", propsSchema: [textField, colorField] },
  { source: "pack", id: "scn-avatar-group", label: "头像组", category: "Shadcn", pack: "shadcn", subCategory: "展示", propsSchema: [colorField] },
  { source: "pack", id: "scn-data-table", label: "数据表格", category: "Shadcn", pack: "shadcn", subCategory: "展示", propsSchema: [textField, colorField] },
  { source: "pack", id: "scn-tooltip", label: "工具提示", category: "Shadcn", pack: "shadcn", subCategory: "反馈", propsSchema: [textField, colorField] },
  { source: "pack", id: "scn-select-list", label: "选择列表", category: "Shadcn", pack: "shadcn", subCategory: "表单", propsSchema: [textField, colorField] },
  { source: "pack", id: "scn-calendar-widget", label: "日历组件", category: "Shadcn", pack: "shadcn", subCategory: "展示", propsSchema: [colorField] },
  { source: "pack", id: "scn-empty-state", label: "空状态", category: "Shadcn", pack: "shadcn", subCategory: "反馈", propsSchema: [textField, colorField] },
  /* ---- 新增 ---- */
  { source: "pack", id: "scn-rating-stars", label: "评分星星", category: "Shadcn", pack: "shadcn", subCategory: "表单", propsSchema: [colorField] },
  { source: "pack", id: "scn-file-upload", label: "文件上传", category: "Shadcn", pack: "shadcn", subCategory: "表单", propsSchema: [textField, colorField] },
  { source: "pack", id: "scn-stat-card", label: "统计卡片", category: "Shadcn", pack: "shadcn", subCategory: "展示", propsSchema: [textField, colorField] },
  { source: "pack", id: "scn-color-picker", label: "颜色选择器", category: "Shadcn", pack: "shadcn", subCategory: "表单", propsSchema: [colorField] },
  { source: "pack", id: "scn-timeline-list", label: "时间线列表", category: "Shadcn", pack: "shadcn", subCategory: "展示", propsSchema: [textField, colorField] },
];
