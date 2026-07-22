"use client";
import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { PackComponentProps } from "../react-bits/components";

/* ============ 1. 命令面板 ============ */
const Command: React.FC<PackComponentProps> = (props) => (
  <div className="w-full h-full rounded-lg border border-gray-200 bg-white shadow-sm flex flex-col overflow-hidden">
    <div className="flex items-center gap-2 px-3 border-b border-gray-100 h-9">
      <span className="text-gray-400 text-xs">⌘</span>
      <span className="text-xs text-gray-400">{props.text ?? "输入命令..."}</span>
    </div>
    <div className="flex-1 p-1.5 space-y-0.5">
      {["日历", "搜索文档", "设置", "个人资料"].map((item) => (
        <div key={item} className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-gray-700 hover:bg-gray-100 cursor-pointer">
          <span className="text-gray-400">•</span>{item}
        </div>
      ))}
    </div>
  </div>
);

/* ============ 2. 面包屑 ============ */
const Breadcrumb: React.FC<PackComponentProps> = (props) => {
  const items = (props.text ?? "首页,产品,详情").split(",");
  return (
    <div className="w-full h-full flex items-center gap-1.5 px-2">
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="text-gray-300 text-xs">/</span>}
          <span className={`text-xs ${i === items.length - 1 ? "text-gray-900 font-medium" : "text-gray-500 hover:text-gray-700 cursor-pointer"}`}>{item}</span>
        </React.Fragment>
      ))}
    </div>
  );
};

/* ============ 3. 侧滑面板 ============ */
const Sheet: React.FC<PackComponentProps> = (props) => (
  <div className="w-full h-full relative rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
    <motion.div className="absolute right-0 top-0 bottom-0 w-2/3 bg-white border-l border-gray-200 shadow-lg p-3 flex flex-col" initial={{ x: "100%" }} animate={{ x: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-semibold text-gray-800">{props.text ?? "面板标题"}</span>
        <span className="text-gray-400 text-xs cursor-pointer">✕</span>
      </div>
      <div className="flex-1 text-[10px] text-gray-400">侧滑面板内容区域</div>
    </motion.div>
  </div>
);

/* ============ 4. 悬停卡片 ============ */
const HoverCard: React.FC<PackComponentProps> = (props) => {
  const [show, setShow] = React.useState(false);
  return (
    <div className="w-full h-full flex items-center justify-center relative" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <span className="text-xs text-blue-600 underline cursor-pointer">{props.text ?? "悬停查看"}</span>
      <AnimatePresence>
        {show && (
          <motion.div initial={{ opacity: 0, y: 4, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4, scale: 0.95 }} className="absolute top-full mt-1 w-40 rounded-lg border border-gray-200 bg-white shadow-lg p-2.5 z-10">
            <div className="text-[10px] font-medium text-gray-800">预览卡片</div>
            <div className="text-[9px] text-gray-400 mt-1">这是悬停时显示的内容</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ============ 5. 上下文菜单 ============ */
const ContextMenu: React.FC<PackComponentProps> = (props) => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="w-36 rounded-lg border border-gray-200 bg-white shadow-md p-1">
      {[{ label: "返回", shortcut: "⌘[" }, { label: "前进", shortcut: "⌘]" }, { label: "刷新", shortcut: "⌘R" }, { label: "另存为...", shortcut: "⌘S" }].map((item) => (
        <div key={item.label} className="flex items-center justify-between px-2 py-1.5 rounded text-xs text-gray-700 hover:bg-gray-100 cursor-pointer">
          <span>{item.label}</span><span className="text-[9px] text-gray-400">{item.shortcut}</span>
        </div>
      ))}
      <div className="my-1 border-t border-gray-100" />
      <div className="px-2 py-1.5 rounded text-xs text-red-600 hover:bg-red-50 cursor-pointer">删除</div>
    </div>
  </div>
);

/* ============ 6. 菜单栏 ============ */
const Menubar: React.FC<PackComponentProps> = (props) => (
  <div className="w-full h-full flex items-center">
    <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 bg-white px-1 py-0.5 shadow-sm">
      {["文件", "编辑", "视图", "帮助"].map((m) => (
        <button key={m} className="px-2.5 py-1 rounded-md text-xs text-gray-700 hover:bg-gray-100">{m}</button>
      ))}
    </div>
  </div>
);

/* ============ 7. 可折叠区域 ============ */
const Collapsible: React.FC<PackComponentProps> = (props) => {
  const [open, setOpen] = React.useState(true);
  return (
    <div className="w-full h-full rounded-lg border border-gray-200 bg-white p-2">
      <button onClick={() => setOpen(!open)} className="flex items-center justify-between w-full text-xs font-medium text-gray-800">
        <span>{props.text ?? "可折叠区域"}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} className="text-gray-400">▾</motion.span>
      </button>
      <AnimatePresence>
        {open && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
          <div className="pt-2 text-[10px] text-gray-500">这里是可折叠的内容区域，点击标题可以展开/收起。</div>
        </motion.div>}
      </AnimatePresence>
    </div>
  );
};

/* ============ 8. 输入OTP ============ */
const InputOTP: React.FC<PackComponentProps> = () => (
  <div className="w-full h-full flex items-center justify-center gap-1.5">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className={`w-8 h-10 rounded-md border-2 flex items-center justify-center text-sm font-bold ${i < 3 ? "border-blue-500 text-gray-900" : "border-gray-200 text-gray-300"}`}>
        {i < 3 ? "•" : ""}
      </div>
    ))}
  </div>
);

/* ============ 9. 开关组 ============ */
const ToggleGroup: React.FC<PackComponentProps> = (props) => {
  const [active, setActive] = React.useState(1);
  const items = (props.text ?? "左,中,右").split(",");
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
        {items.map((item, i) => (
          <button key={i} onClick={() => setActive(i)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${active === i ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>{item}</button>
        ))}
      </div>
    </div>
  );
};

/* ============ 10. 骨架卡片 ============ */
const SkeletonCard: React.FC<PackComponentProps> = () => (
  <div className="w-full h-full rounded-lg border border-gray-200 bg-white p-3 flex flex-col gap-2">
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
      <div className="flex-1 space-y-1">
        <div className="h-2.5 w-3/4 rounded bg-gray-200 animate-pulse" />
        <div className="h-2 w-1/2 rounded bg-gray-100 animate-pulse" />
      </div>
    </div>
    <div className="h-16 rounded-md bg-gray-100 animate-pulse" />
    <div className="space-y-1">
      <div className="h-2 w-full rounded bg-gray-200 animate-pulse" />
      <div className="h-2 w-2/3 rounded bg-gray-100 animate-pulse" />
    </div>
  </div>
);

/* ============ 11. 通知卡片 ============ */
const NotificationCard: React.FC<PackComponentProps> = (props) => (
  <div className="w-full h-full rounded-lg border border-gray-200 bg-white shadow-sm p-3 flex gap-2.5">
    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm shrink-0">🔔</div>
    <div className="flex-1 min-w-0">
      <div className="text-xs font-medium text-gray-900">{props.text ?? "新通知"}</div>
      <div className="text-[10px] text-gray-500 mt-0.5 truncate">您有一条新的消息待处理</div>
      <div className="text-[9px] text-gray-400 mt-1">2 分钟前</div>
    </div>
  </div>
);

/* ============ 12. 进度步骤 ============ */
const ProgressSteps: React.FC<PackComponentProps> = (props) => {
  const steps = (props.text ?? "购物车,配送,支付,完成").split(",");
  const current = 1;
  return (
    <div className="w-full h-full flex items-center px-2">
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          <div className="flex flex-col items-center">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${i <= current ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"}`}>{i < current ? "✓" : i + 1}</div>
            <span className="text-[9px] text-gray-500 mt-1 whitespace-nowrap">{s}</span>
          </div>
          {i < steps.length - 1 && <div className={`flex-1 h-0.5 mx-1 mb-4 ${i < current ? "bg-blue-600" : "bg-gray-200"}`} />}
        </React.Fragment>
      ))}
    </div>
  );
};

/* ============ 13. 标签输入 ============ */
const TagInputScn: React.FC<PackComponentProps> = (props) => {
  const tags = (props.text ?? "React,Next.js,Tailwind").split(",");
  return (
    <div className="w-full h-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 flex items-center gap-1 flex-wrap">
      {tags.map((t, i) => (
        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-medium border border-blue-200">{t}<span className="text-blue-400 cursor-pointer">×</span></span>
      ))}
      <input className="flex-1 min-w-[50px] text-xs outline-none text-gray-700" placeholder="添加..." />
    </div>
  );
};

/* ============ 14. 确认对话框 ============ */
const AlertDialog: React.FC<PackComponentProps> = (props) => (
  <div className="w-full h-full rounded-lg border border-gray-200 bg-white shadow-lg p-4 flex flex-col">
    <div className="text-sm font-semibold text-gray-900">{props.text ?? "确认操作"}</div>
    <div className="text-xs text-gray-500 mt-1.5 flex-1">此操作不可撤销，确定要继续吗？</div>
    <div className="flex justify-end gap-2 mt-3">
      <button className="px-3 py-1.5 rounded-md text-xs border border-gray-200 text-gray-700 hover:bg-gray-50">取消</button>
      <button className="px-3 py-1.5 rounded-md text-xs bg-red-600 text-white hover:bg-red-700">确认删除</button>
    </div>
  </div>
);

/* ============ 15. 头像组 ============ */
const AvatarGroup: React.FC<PackComponentProps> = () => {
  const colors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500"];
  const names = ["A", "B", "C", "D"];
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="flex -space-x-2">
        {names.map((n, i) => (
          <div key={i} className={`w-8 h-8 rounded-full ${colors[i]} border-2 border-white flex items-center justify-center text-[10px] font-bold text-white`}>{n}</div>
        ))}
        <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-[9px] font-medium text-gray-600">+5</div>
      </div>
    </div>
  );
};

/* ============ 16. 数据表格 ============ */
const DataTable: React.FC<PackComponentProps> = () => (
  <div className="w-full h-full rounded-lg border border-gray-200 bg-white overflow-hidden flex flex-col">
    <table className="w-full text-[10px]">
      <thead><tr className="border-b border-gray-100 bg-gray-50">
        {["名称", "状态", "角色"].map((h) => <th key={h} className="text-left px-2.5 py-1.5 font-medium text-gray-500">{h}</th>)}
      </tr></thead>
      <tbody>
        {[["张三", "活跃", "管理员"], ["李四", "离线", "编辑者"], ["王五", "活跃", "查看者"]].map(([n, s, r], i) => (
          <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
            <td className="px-2.5 py-1.5 text-gray-800">{n}</td>
            <td className="px-2.5 py-1.5"><span className={`px-1.5 py-0.5 rounded-full text-[8px] ${s === "活跃" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{s}</span></td>
            <td className="px-2.5 py-1.5 text-gray-500">{r}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/* ============ 17. 工具提示 ============ */
const TooltipScn: React.FC<PackComponentProps> = (props) => {
  const [show, setShow] = React.useState(false);
  return (
    <div className="w-full h-full flex items-center justify-center relative" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <button className="px-3 py-1.5 rounded-md bg-gray-900 text-white text-xs">{props.text ?? "按钮"}</button>
      <AnimatePresence>
        {show && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="absolute bottom-full mb-1.5 px-2 py-1 rounded-md bg-gray-900 text-white text-[9px] whitespace-nowrap">
            这是提示信息
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45 -mt-1" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ============ 18. 选择列表 ============ */
const SelectList: React.FC<PackComponentProps> = (props) => {
  const [sel, setSel] = React.useState(0);
  const items = (props.text ?? "个人资料,设置,退出登录").split(",");
  return (
    <div className="w-full h-full rounded-lg border border-gray-200 bg-white shadow-sm p-1">
      {items.map((item, i) => (
        <button key={i} onClick={() => setSel(i)} className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-colors ${sel === i ? "bg-gray-100 text-gray-900 font-medium" : "text-gray-600 hover:bg-gray-50"}`}>{item}</button>
      ))}
    </div>
  );
};

/* ============ 19. 日历小组件 ============ */
const CalendarWidget: React.FC<PackComponentProps> = () => {
  const days = Array.from({ length: 28 }, (_, i) => i + 1);
  return (
    <div className="w-full h-full rounded-lg border border-gray-200 bg-white p-2">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-semibold text-gray-800">2025年 7月</span>
        <div className="flex gap-1"><span className="text-gray-400 text-[10px] cursor-pointer">‹</span><span className="text-gray-400 text-[10px] cursor-pointer">›</span></div>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center text-[8px]">
        {["日", "一", "二", "三", "四", "五", "六"].map((d) => <span key={d} className="text-gray-400 font-medium py-0.5">{d}</span>)}
        {days.map((d) => <span key={d} className={`rounded py-0.5 ${d === 17 ? "bg-blue-600 text-white font-bold" : "text-gray-700 hover:bg-gray-100 cursor-pointer"}`}>{d}</span>)}
      </div>
    </div>
  );
};

/* ============ 20. 空状态 ============ */
const EmptyState: React.FC<PackComponentProps> = (props) => (
  <div className="w-full h-full rounded-lg border border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center gap-2 p-4">
    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-lg">📭</div>
    <span className="text-xs font-medium text-gray-700">{props.text ?? "暂无数据"}</span>
    <span className="text-[10px] text-gray-400 text-center">这里空空如也，试试添加一些内容吧</span>
    <button className="mt-1 px-3 py-1.5 rounded-md bg-blue-600 text-white text-[10px] font-medium hover:bg-blue-700">添加内容</button>
  </div>
);

/* ============ 21. 评分星星 ============ */
const RatingStars: React.FC<PackComponentProps> = () => {
  const [rating, setRating] = React.useState(3);
  return (
    <div className="w-full h-full flex items-center justify-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} onClick={() => setRating(s)} className={`text-lg transition-transform hover:scale-125 ${s <= rating ? "text-yellow-400" : "text-gray-300"}`}>★</button>
      ))}
    </div>
  );
};

/* ============ 22. 文件上传 ============ */
const FileUpload: React.FC<PackComponentProps> = (props) => (
  <div className="w-full h-full rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center gap-2 p-4 hover:border-blue-400 transition-colors cursor-pointer">
    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-lg">📁</div>
    <span className="text-xs font-medium text-gray-700">{props.text ?? "点击或拖拽上传"}</span>
    <span className="text-[10px] text-gray-400">支持 PNG, JPG, PDF</span>
  </div>
);

/* ============ 23. 统计卡片 ============ */
const StatCard: React.FC<PackComponentProps> = (props) => (
  <div className="w-full h-full rounded-lg border border-gray-200 bg-white p-3 flex flex-col justify-between">
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-gray-500">{props.text ?? "总用户"}</span>
      <span className="text-green-500 text-[9px] font-medium">↑ 5.2%</span>
    </div>
    <div className="text-xl font-bold text-gray-900 mt-1">12,847</div>
    <div className="h-1 rounded-full bg-gray-100 mt-1.5"><div className="h-full w-3/4 rounded-full bg-blue-500" /></div>
  </div>
);

/* ============ 24. 颜色选择器 ============ */
const ColorPicker: React.FC<PackComponentProps> = () => {
  const colors = ["#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899"];
  const [sel, setSel] = React.useState(3);
  return (
    <div className="w-full h-full flex items-center justify-center gap-2">
      {colors.map((c, i) => (
        <button key={i} onClick={() => setSel(i)} className={`w-6 h-6 rounded-full transition-transform ${sel === i ? "scale-125 ring-2 ring-offset-2 ring-gray-400" : "hover:scale-110"}`} style={{ background: c }} />
      ))}
    </div>
  );
};

/* ============ 25. 时间线列表 ============ */
const TimelineList: React.FC<PackComponentProps> = (props) => {
  const items = (props.text ?? "需求分析,设计,开发,测试").split(",");
  return (
    <div className="w-full h-full rounded-lg border border-gray-200 bg-white p-3 flex flex-col justify-center">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          <div className="flex flex-col items-center">
            <div className={`w-2.5 h-2.5 rounded-full ${i === 0 ? "bg-blue-600" : "bg-gray-300"}`} />
            {i < items.length - 1 && <div className="w-px h-4 bg-gray-200" />}
          </div>
          <span className={`text-[10px] ${i === 0 ? "text-gray-900 font-medium" : "text-gray-500"}`}>{item}</span>
        </div>
      ))}
    </div>
  );
};

/* ============ 导出 ============ */
export const shadcnComponents: Record<string, React.FC<PackComponentProps>> = {
  "scn-command": Command,
  "scn-breadcrumb": Breadcrumb,
  "scn-sheet": Sheet,
  "scn-hover-card": HoverCard,
  "scn-context-menu": ContextMenu,
  "scn-menubar": Menubar,
  "scn-collapsible": Collapsible,
  "scn-input-otp": InputOTP,
  "scn-toggle-group": ToggleGroup,
  "scn-skeleton-card": SkeletonCard,
  "scn-notification-card": NotificationCard,
  "scn-progress-steps": ProgressSteps,
  "scn-tag-input": TagInputScn,
  "scn-alert-dialog": AlertDialog,
  "scn-avatar-group": AvatarGroup,
  "scn-data-table": DataTable,
  "scn-tooltip": TooltipScn,
  "scn-select-list": SelectList,
  "scn-calendar-widget": CalendarWidget,
  "scn-empty-state": EmptyState,
  "scn-rating-stars": RatingStars,
  "scn-file-upload": FileUpload,
  "scn-stat-card": StatCard,
  "scn-color-picker": ColorPicker,
  "scn-timeline-list": TimelineList,
};
