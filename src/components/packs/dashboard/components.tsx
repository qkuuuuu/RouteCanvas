"use client";
import * as React from "react";
import { motion } from "framer-motion";
import type { PackComponentProps } from "../react-bits/components";

/* ============ 1. KPI卡片 ============ */
const KpiCard: React.FC<PackComponentProps> = (props) => (
  <div className="w-full h-full rounded-xl border border-gray-200 bg-white p-3 flex flex-col justify-between">
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-gray-500">{props.text ?? "总收入"}</span>
      <span className="text-green-500 text-[9px] font-medium">↑ 12.5%</span>
    </div>
    <div className="text-xl font-bold text-gray-900 mt-1">¥128,430</div>
    <div className="text-[9px] text-gray-400 mt-0.5">较上月 +¥14,200</div>
  </div>
);

/* ============ 2. 活动流 ============ */
const ActivityFeed: React.FC<PackComponentProps> = () => (
  <div className="w-full h-full rounded-xl border border-gray-200 bg-white p-3 flex flex-col">
    <span className="text-xs font-semibold text-gray-800 mb-2">最近活动</span>
    <div className="flex-1 space-y-2">
      {[{ t: "用户注册", d: "2分钟前", c: "bg-blue-500" }, { t: "新订单", d: "15分钟前", c: "bg-green-500" }, { t: "系统更新", d: "1小时前", c: "bg-purple-500" }].map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${item.c}`} />
          <span className="text-[10px] text-gray-700 flex-1">{item.t}</span>
          <span className="text-[8px] text-gray-400">{item.d}</span>
        </div>
      ))}
    </div>
  </div>
);

/* ============ 3. 环形进度 ============ */
const DonutChart: React.FC<PackComponentProps> = (props) => {
  const pct = 72;
  return (
    <div className="w-full h-full rounded-xl border border-gray-200 bg-white p-3 flex flex-col items-center justify-center">
      <div className="relative w-16 h-16">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15" fill="none" stroke="#e5e7eb" strokeWidth="3" />
          <circle cx="18" cy="18" r="15" fill="none" stroke="#3b82f6" strokeWidth="3" strokeDasharray={`${pct} ${100 - pct}`} strokeLinecap="round" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-800">{pct}%</span>
      </div>
      <span className="text-[9px] text-gray-500 mt-1">{props.text ?? "完成率"}</span>
    </div>
  );
};

/* ============ 4. 迷你折线图 ============ */
const Sparkline: React.FC<PackComponentProps> = (props) => {
  const points = "0,20 15,15 30,18 45,10 60,12 75,5 90,8 105,3 120,6";
  return (
    <div className="w-full h-full rounded-xl border border-gray-200 bg-white p-3 flex flex-col">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-gray-500">{props.text ?? "访问量"}</span>
        <span className="text-xs font-bold text-gray-900">8,549</span>
      </div>
      <div className="flex-1 flex items-end">
        <svg className="w-full h-10" viewBox="0 0 120 25" preserveAspectRatio="none">
          <polyline points={points} fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points={`${points} 120,25 0,25`} fill="url(#grad)" stroke="none" opacity="0.1" />
        </svg>
      </div>
    </div>
  );
};

/* ============ 5. 用户统计 ============ */
const UserStats: React.FC<PackComponentProps> = () => (
  <div className="w-full h-full rounded-xl border border-gray-200 bg-white p-3">
    <div className="flex items-center gap-2 mb-2">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">U</div>
      <div><div className="text-xs font-medium text-gray-800">活跃用户</div><div className="text-[9px] text-gray-400">实时在线</div></div>
    </div>
    <div className="flex items-end gap-3">
      <div><div className="text-lg font-bold text-gray-900">2,847</div><div className="text-[8px] text-gray-400">今日</div></div>
      <div><div className="text-lg font-bold text-gray-900">18.2k</div><div className="text-[8px] text-gray-400">本周</div></div>
      <div className="ml-auto text-green-500 text-[9px] font-medium self-center">↑ 8.1%</div>
    </div>
  </div>
);

/* ============ 6. 订单列表 ============ */
const RecentOrders: React.FC<PackComponentProps> = () => (
  <div className="w-full h-full rounded-xl border border-gray-200 bg-white p-3 flex flex-col">
    <span className="text-xs font-semibold text-gray-800 mb-2">最近订单</span>
    <div className="flex-1 space-y-1.5">
      {[{ id: "#1024", amt: "¥299", st: "已完成" }, { id: "#1023", amt: "¥1,580", st: "处理中" }, { id: "#1022", amt: "¥89", st: "已取消" }].map((o) => (
        <div key={o.id} className="flex items-center justify-between text-[10px]">
          <span className="text-gray-600 font-mono">{o.id}</span>
          <span className="text-gray-800 font-medium">{o.amt}</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[8px] ${o.st === "已完成" ? "bg-green-100 text-green-700" : o.st === "处理中" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-600"}`}>{o.st}</span>
        </div>
      ))}
    </div>
  </div>
);

/* ============ 7. 流量来源 ============ */
const TrafficSource: React.FC<PackComponentProps> = () => {
  const sources = [{ name: "直接访问", pct: 40, color: "bg-blue-500" }, { name: "搜索引擎", pct: 35, color: "bg-green-500" }, { name: "社交媒体", pct: 25, color: "bg-purple-500" }];
  return (
    <div className="w-full h-full rounded-xl border border-gray-200 bg-white p-3 flex flex-col">
      <span className="text-xs font-semibold text-gray-800 mb-2">流量来源</span>
      <div className="flex-1 space-y-2">
        {sources.map((s) => (
          <div key={s.name}>
            <div className="flex justify-between text-[9px] text-gray-600 mb-0.5"><span>{s.name}</span><span>{s.pct}%</span></div>
            <div className="h-1.5 rounded-full bg-gray-100"><div className={`h-full rounded-full ${s.color}`} style={{ width: `${s.pct}%` }} /></div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ============ 8. 目标追踪 ============ */
const GoalTracker: React.FC<PackComponentProps> = (props) => (
  <div className="w-full h-full rounded-xl border border-gray-200 bg-white p-3 flex flex-col">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs font-semibold text-gray-800">{props.text ?? "月度目标"}</span>
      <span className="text-[9px] text-blue-600 font-medium">72%</span>
    </div>
    <div className="flex-1 flex items-center">
      <div className="w-full">
        <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600" initial={{ width: 0 }} animate={{ width: "72%" }} transition={{ duration: 1 }} />
        </div>
        <div className="flex justify-between mt-1.5 text-[8px] text-gray-400"><span>¥72,000</span><span>目标 ¥100,000</span></div>
      </div>
    </div>
  </div>
);

/* ============ 9. 团队成员 ============ */
const TeamMembers: React.FC<PackComponentProps> = () => (
  <div className="w-full h-full rounded-xl border border-gray-200 bg-white p-3 flex flex-col">
    <span className="text-xs font-semibold text-gray-800 mb-2">团队</span>
    <div className="flex-1 space-y-1.5">
      {[{ n: "张三", r: "前端", c: "bg-blue-500" }, { n: "李四", r: "设计", c: "bg-pink-500" }, { n: "王五", r: "后端", c: "bg-green-500" }].map((m) => (
        <div key={m.n} className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-full ${m.c} flex items-center justify-center text-[8px] text-white font-bold`}>{m.n[0]}</div>
          <span className="text-[10px] text-gray-700 flex-1">{m.n}</span>
          <span className="text-[8px] text-gray-400 px-1.5 py-0.5 bg-gray-100 rounded">{m.r}</span>
        </div>
      ))}
    </div>
  </div>
);

/* ============ 10. 性能指标 ============ */
const PerformanceMetric: React.FC<PackComponentProps> = (props) => {
  const bars = [60, 80, 45, 90, 70, 55, 85];
  return (
    <div className="w-full h-full rounded-xl border border-gray-200 bg-white p-3 flex flex-col">
      <span className="text-[10px] text-gray-500 mb-1">{props.text ?? "响应时间"}</span>
      <div className="flex-1 flex items-end gap-1">
        {bars.map((h, i) => (
          <motion.div key={i} className="flex-1 rounded-t bg-blue-400" initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: i * 0.05, duration: 0.5 }} style={{ opacity: 0.5 + (i / bars.length) * 0.5 }} />
        ))}
      </div>
      <div className="text-[8px] text-gray-400 mt-1 text-center">最近 7 天</div>
    </div>
  );
};

/* ============ 11. 状态概览 ============ */
const StatusOverview: React.FC<PackComponentProps> = () => (
  <div className="w-full h-full rounded-xl border border-gray-200 bg-white p-3 grid grid-cols-2 gap-2">
    {[{ label: "运行中", val: "12", color: "text-green-600" }, { label: "已停止", val: "3", color: "text-red-500" }, { label: "待处理", val: "8", color: "text-yellow-600" }, { label: "已完成", val: "156", color: "text-blue-600" }].map((s) => (
      <div key={s.label} className="rounded-lg bg-gray-50 p-2 text-center">
        <div className={`text-sm font-bold ${s.color}`}>{s.val}</div>
        <div className="text-[8px] text-gray-500 mt-0.5">{s.label}</div>
      </div>
    ))}
  </div>
);

/* ============ 12. 收入卡片 ============ */
const RevenueCard: React.FC<PackComponentProps> = () => (
  <div className="w-full h-full rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 p-3 flex flex-col justify-between text-white">
    <div className="text-[10px] opacity-80">本月收入</div>
    <div className="text-xl font-bold">¥84,254</div>
    <div className="flex items-center gap-1 text-[9px] opacity-70"><span className="bg-white/20 px-1 rounded">↑ 23%</span> 较上月</div>
  </div>
);

/* ============ 13. 任务看板 ============ */
const TaskBoard: React.FC<PackComponentProps> = () => (
  <div className="w-full h-full rounded-xl border border-gray-200 bg-white p-2 flex gap-2">
    {[{ title: "待办", items: ["设计稿", "接口联调"], color: "border-t-yellow-400" }, { title: "进行中", items: ["首页开发"], color: "border-t-blue-400" }, { title: "完成", items: ["需求分析", "原型"], color: "border-t-green-400" }].map((col) => (
      <div key={col.title} className="flex-1 rounded-lg bg-gray-50 p-1.5">
        <div className={`text-[8px] font-semibold text-gray-600 mb-1 border-t-2 ${col.color} pt-1`}>{col.title}</div>
        {col.items.map((item) => <div key={item} className="text-[8px] bg-white rounded border border-gray-200 px-1.5 py-1 mb-1 text-gray-700">{item}</div>)}
      </div>
    ))}
  </div>
);

/* ============ 14. 通知中心 ============ */
const NotificationCenter: React.FC<PackComponentProps> = () => (
  <div className="w-full h-full rounded-xl border border-gray-200 bg-white p-3 flex flex-col">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs font-semibold text-gray-800">通知</span>
      <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center">3</span>
    </div>
    <div className="flex-1 space-y-1.5">
      {[{ t: "系统维护通知", time: "10:00" }, { t: "新版本已发布", time: "09:30" }, { t: "安全更新", time: "昨天" }].map((n) => (
        <div key={n.t} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-gray-50">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          <span className="text-[10px] text-gray-700 flex-1">{n.t}</span>
          <span className="text-[8px] text-gray-400">{n.time}</span>
        </div>
      ))}
    </div>
  </div>
);

/* ============ 15. 存储用量 ============ */
const StorageWidget: React.FC<PackComponentProps> = () => (
  <div className="w-full h-full rounded-xl border border-gray-200 bg-white p-3 flex flex-col justify-center">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs font-medium text-gray-800">存储空间</span>
      <span className="text-[9px] text-gray-400">68.2 / 100 GB</span>
    </div>
    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
      <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500" style={{ width: "68%" }} />
    </div>
    <div className="flex gap-3 mt-2">
      {[{ l: "文档", c: "bg-blue-500" }, { l: "图片", c: "bg-green-500" }, { l: "视频", c: "bg-purple-500" }].map((s) => (
        <div key={s.l} className="flex items-center gap-1"><div className={`w-2 h-2 rounded-sm ${s.c}`} /><span className="text-[8px] text-gray-500">{s.l}</span></div>
      ))}
    </div>
  </div>
);

/* ============ 16. 柱状图 ============ */
const BarChart: React.FC<PackComponentProps> = (props) => {
  const bars = [40, 65, 50, 80, 60, 90, 75];
  return (
    <div className="w-full h-full rounded-xl border border-gray-200 bg-white p-3 flex flex-col">
      <span className="text-[10px] text-gray-500 mb-2">{props.text ?? "周数据"}</span>
      <div className="flex-1 flex items-end gap-1.5">
        {bars.map((h, i) => (
          <motion.div key={i} className="flex-1 rounded-t bg-blue-500" initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: i * 0.08, duration: 0.5 }} style={{ opacity: 0.6 + (i / bars.length) * 0.4 }} />
        ))}
      </div>
      <div className="flex justify-between mt-1 text-[7px] text-gray-400"><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span><span>日</span></div>
    </div>
  );
};

/* ============ 17. 面积图 ============ */
const AreaChart: React.FC<PackComponentProps> = (props) => (
  <div className="w-full h-full rounded-xl border border-gray-200 bg-white p-3 flex flex-col">
    <span className="text-[10px] text-gray-500 mb-1">{props.text ?? "趋势"}</span>
    <div className="flex-1 flex items-end">
      <svg className="w-full h-full" viewBox="0 0 120 40" preserveAspectRatio="none">
        <defs><linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" /><stop offset="100%" stopColor="#3b82f6" stopOpacity="0" /></linearGradient></defs>
        <path d="M0,35 Q15,30 30,25 T60,15 T90,20 T120,10 L120,40 L0,40 Z" fill="url(#areaGrad)" />
        <path d="M0,35 Q15,30 30,25 T60,15 T90,20 T120,10" fill="none" stroke="#3b82f6" strokeWidth="1.5" />
      </svg>
    </div>
  </div>
);

/* ============ 18. 转化漏斗 ============ */
const ConversionFunnel: React.FC<PackComponentProps> = () => {
  const steps = [{ label: "访问", pct: 100 }, { label: "注册", pct: 60 }, { label: "付费", pct: 25 }];
  return (
    <div className="w-full h-full rounded-xl border border-gray-200 bg-white p-3 flex flex-col justify-center gap-1.5">
      {steps.map((s) => (
        <div key={s.label} className="flex items-center gap-2">
          <span className="text-[8px] text-gray-500 w-6">{s.label}</span>
          <div className="flex-1 h-4 rounded bg-gray-100 overflow-hidden"><div className="h-full rounded bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-end pr-1" style={{ width: `${s.pct}%` }}><span className="text-[7px] text-white font-medium">{s.pct}%</span></div></div>
        </div>
      ))}
    </div>
  );
};

/* ============ 19. 热力图 ============ */
const Heatmap: React.FC<PackComponentProps> = () => (
  <div className="w-full h-full rounded-xl border border-gray-200 bg-white p-3 flex flex-col">
    <span className="text-[10px] text-gray-500 mb-2">活跃度</span>
    <div className="flex-1 grid grid-cols-7 grid-rows-4 gap-0.5">
      {Array.from({ length: 28 }).map((_, i) => {
        const intensity = Math.random();
        return <div key={i} className="rounded-sm" style={{ background: `rgba(59,130,246,${0.1 + intensity * 0.8})` }} />;
      })}
    </div>
  </div>
);

/* ============ 20. 实时指标 ============ */
const LiveMetrics: React.FC<PackComponentProps> = (props) => {
  const [val, setVal] = React.useState(247);
  React.useEffect(() => { const t = setInterval(() => setVal((v) => v + Math.floor(Math.random() * 5 - 2)), 1000); return () => clearInterval(t); }, []);
  return (
    <div className="w-full h-full rounded-xl border border-gray-200 bg-white p-3 flex flex-col justify-between">
      <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /><span className="text-[10px] text-gray-500">{props.text ?? "实时在线"}</span></div>
      <div className="text-2xl font-bold text-gray-900 tabular-nums">{val.toLocaleString()}</div>
      <div className="text-[8px] text-gray-400">每秒更新</div>
    </div>
  );
};

/* ============ 21. 进度看板 ============ */
const ProgressBoard: React.FC<PackComponentProps> = (props) => {
  const color = (props.color as string) ?? "#6366f1";
  const items = [{ label: "设计", pct: 85 }, { label: "开发", pct: 60 }, { label: "测试", pct: 30 }];
  return (
    <div className="w-full h-full rounded-xl border border-gray-200 bg-white p-3 flex flex-col">
      <span className="text-[10px] font-semibold text-gray-700 mb-2">{props.text ?? "项目进度"}</span>
      <div className="flex-1 space-y-2">
        {items.map((it) => (
          <div key={it.label}>
            <div className="flex justify-between text-[8px] text-gray-500 mb-0.5"><span>{it.label}</span><span>{it.pct}%</span></div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${it.pct}%`, background: color }} /></div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ============ 22. 日历热力 ============ */
const CalendarHeat: React.FC<PackComponentProps> = (props) => {
  const color = (props.color as string) ?? "#22c55e";
  return (
    <div className="w-full h-full rounded-xl border border-gray-200 bg-white p-3 flex flex-col">
      <span className="text-[10px] font-semibold text-gray-700 mb-2">{props.text ?? "提交活跃度"}</span>
      <div className="flex-1 grid grid-cols-12 gap-0.5 content-center">
        {Array.from({ length: 48 }).map((_, i) => {
          const level = Math.random();
          const opacity = level > 0.7 ? 1 : level > 0.4 ? 0.6 : level > 0.2 ? 0.3 : 0.1;
          return <div key={i} className="aspect-square rounded-[2px]" style={{ background: color, opacity }} />;
        })}
      </div>
    </div>
  );
};

/* ============ 23. 排行榜 ============ */
const Leaderboard: React.FC<PackComponentProps> = (props) => {
  const color = (props.color as string) ?? "#6366f1";
  const users = [{ name: "张三", score: 980 }, { name: "李四", score: 870 }, { name: "王五", score: 760 }];
  return (
    <div className="w-full h-full rounded-xl border border-gray-200 bg-white p-3 flex flex-col">
      <span className="text-[10px] font-semibold text-gray-700 mb-2">{props.text ?? "排行榜"}</span>
      <div className="flex-1 space-y-1.5">
        {users.map((u, i) => (
          <div key={u.name} className="flex items-center gap-2">
            <span className={`w-4 h-4 rounded-full text-[8px] flex items-center justify-center font-bold text-white ${i === 0 ? "bg-yellow-500" : i === 1 ? "bg-gray-400" : "bg-orange-400"}`}>{i + 1}</span>
            <span className="text-[10px] text-gray-700 flex-1">{u.name}</span>
            <span className="text-[10px] font-bold" style={{ color }}>{u.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ============ 24. 环形统计 ============ */
const RadialStats: React.FC<PackComponentProps> = (props) => {
  const color = (props.color as string) ?? "#6366f1";
  const data = [{ label: "完成", val: 45, c: color }, { label: "进行中", val: 30, c: "#f59e0b" }, { label: "待处理", val: 25, c: "#e5e7eb" }];
  let offset = 0;
  return (
    <div className="w-full h-full rounded-xl border border-gray-200 bg-white p-3 flex items-center gap-3">
      <div className="relative w-14 h-14 shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          {data.map((d) => { const dash = `${d.val} ${100 - d.val}`; const el = <circle key={d.label} cx="18" cy="18" r="15" fill="none" stroke={d.c} strokeWidth="4" strokeDasharray={dash} strokeDashoffset={-offset} />; offset += d.val; return el; })}
        </svg>
      </div>
      <div className="space-y-1">
        {data.map((d) => <div key={d.label} className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ background: d.c }} /><span className="text-[8px] text-gray-600">{d.label} {d.val}%</span></div>)}
      </div>
    </div>
  );
};

/* ============ 25. 快捷操作 ============ */
const QuickActions: React.FC<PackComponentProps> = (props) => {
  const color = (props.color as string) ?? "#6366f1";
  const actions = ["新建", "导入", "分享", "设置"];
  return (
    <div className="w-full h-full rounded-xl border border-gray-200 bg-white p-3 flex flex-col">
      <span className="text-[10px] font-semibold text-gray-700 mb-2">{props.text ?? "快捷操作"}</span>
      <div className="flex-1 grid grid-cols-2 gap-1.5 content-center">
        {actions.map((a) => (
          <button key={a} className="px-2 py-1.5 rounded-lg text-[9px] font-medium border border-gray-200 hover:border-transparent hover:text-white transition-colors" style={{ ['--tw-hover-bg' as string]: color }} onMouseEnter={(e) => { e.currentTarget.style.background = color; e.currentTarget.style.color = "#fff"; }} onMouseLeave={(e) => { e.currentTarget.style.background = ""; e.currentTarget.style.color = ""; }}>{a}</button>
        ))}
      </div>
    </div>
  );
};

/* ============ 导出 ============ */
export const dashboardComponents: Record<string, React.FC<PackComponentProps>> = {
  "dash-kpi-card": KpiCard,
  "dash-activity-feed": ActivityFeed,
  "dash-donut-chart": DonutChart,
  "dash-sparkline": Sparkline,
  "dash-user-stats": UserStats,
  "dash-recent-orders": RecentOrders,
  "dash-traffic-source": TrafficSource,
  "dash-goal-tracker": GoalTracker,
  "dash-team-members": TeamMembers,
  "dash-performance": PerformanceMetric,
  "dash-status-overview": StatusOverview,
  "dash-revenue-card": RevenueCard,
  "dash-task-board": TaskBoard,
  "dash-notification-center": NotificationCenter,
  "dash-storage-widget": StorageWidget,
  "dash-bar-chart": BarChart,
  "dash-area-chart": AreaChart,
  "dash-conversion-funnel": ConversionFunnel,
  "dash-heatmap": Heatmap,
  "dash-live-metrics": LiveMetrics,
  "dash-progress-board": ProgressBoard,
  "dash-calendar-heat": CalendarHeat,
  "dash-leaderboard": Leaderboard,
  "dash-radial-stats": RadialStats,
  "dash-quick-actions": QuickActions,
};
