import type { ComponentDef } from "@/types/schema";

const COLOR_OPTIONS = ["#6366f1", "#ec4899", "#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];
const textField = { key: "text", label: "文本", type: "string" as const, bucket: "base" as const };
const colorField = { key: "color", label: "主题色", type: "select" as const, options: COLOR_OPTIONS, default: "#6366f1", bucket: "custom" as const };

export const dashboardDefs: ComponentDef[] = [
  { source: "pack", id: "dash-kpi-card", label: "KPI卡片", category: "Dashboard", pack: "dashboard", subCategory: "统计", propsSchema: [textField, colorField] },
  { source: "pack", id: "dash-activity-feed", label: "活动流", category: "Dashboard", pack: "dashboard", subCategory: "列表", propsSchema: [colorField] },
  { source: "pack", id: "dash-donut-chart", label: "环形图", category: "Dashboard", pack: "dashboard", subCategory: "图表", propsSchema: [textField, colorField] },
  { source: "pack", id: "dash-sparkline", label: "迷你折线", category: "Dashboard", pack: "dashboard", subCategory: "图表", propsSchema: [textField, colorField] },
  { source: "pack", id: "dash-user-stats", label: "用户统计", category: "Dashboard", pack: "dashboard", subCategory: "统计", propsSchema: [colorField] },
  { source: "pack", id: "dash-recent-orders", label: "订单列表", category: "Dashboard", pack: "dashboard", subCategory: "列表", propsSchema: [colorField] },
  { source: "pack", id: "dash-traffic-source", label: "流量来源", category: "Dashboard", pack: "dashboard", subCategory: "图表", propsSchema: [colorField] },
  { source: "pack", id: "dash-goal-tracker", label: "目标追踪", category: "Dashboard", pack: "dashboard", subCategory: "统计", propsSchema: [textField, colorField] },
  { source: "pack", id: "dash-team-members", label: "团队成员", category: "Dashboard", pack: "dashboard", subCategory: "列表", propsSchema: [colorField] },
  { source: "pack", id: "dash-performance", label: "性能指标", category: "Dashboard", pack: "dashboard", subCategory: "图表", propsSchema: [textField, colorField] },
  { source: "pack", id: "dash-status-overview", label: "状态概览", category: "Dashboard", pack: "dashboard", subCategory: "统计", propsSchema: [colorField] },
  { source: "pack", id: "dash-revenue-card", label: "收入卡片", category: "Dashboard", pack: "dashboard", subCategory: "统计", propsSchema: [textField, colorField] },
  { source: "pack", id: "dash-task-board", label: "任务看板", category: "Dashboard", pack: "dashboard", subCategory: "列表", propsSchema: [colorField] },
  { source: "pack", id: "dash-notification-center", label: "通知中心", category: "Dashboard", pack: "dashboard", subCategory: "列表", propsSchema: [colorField] },
  { source: "pack", id: "dash-storage-widget", label: "存储用量", category: "Dashboard", pack: "dashboard", subCategory: "统计", propsSchema: [colorField] },
  /* ---- 新增 ---- */
  { source: "pack", id: "dash-bar-chart", label: "柱状图", category: "Dashboard", pack: "dashboard", subCategory: "图表", propsSchema: [textField, colorField] },
  { source: "pack", id: "dash-area-chart", label: "面积图", category: "Dashboard", pack: "dashboard", subCategory: "图表", propsSchema: [textField, colorField] },
  { source: "pack", id: "dash-conversion-funnel", label: "转化漏斗", category: "Dashboard", pack: "dashboard", subCategory: "图表", propsSchema: [colorField] },
  { source: "pack", id: "dash-heatmap", label: "热力图", category: "Dashboard", pack: "dashboard", subCategory: "图表", propsSchema: [colorField] },
  { source: "pack", id: "dash-live-metrics", label: "实时指标", category: "Dashboard", pack: "dashboard", subCategory: "统计", propsSchema: [textField, colorField] },
  { source: "pack", id: "dash-progress-board", label: "进度看板", category: "Dashboard", pack: "dashboard", subCategory: "统计", propsSchema: [textField, colorField] },
  { source: "pack", id: "dash-calendar-heat", label: "日历热力", category: "Dashboard", pack: "dashboard", subCategory: "图表", propsSchema: [textField, colorField] },
  { source: "pack", id: "dash-leaderboard", label: "排行榜", category: "Dashboard", pack: "dashboard", subCategory: "列表", propsSchema: [textField, colorField] },
  { source: "pack", id: "dash-radial-stats", label: "环形统计", category: "Dashboard", pack: "dashboard", subCategory: "图表", propsSchema: [colorField] },
  { source: "pack", id: "dash-quick-actions", label: "快捷操作", category: "Dashboard", pack: "dashboard", subCategory: "列表", propsSchema: [textField, colorField] },
];
