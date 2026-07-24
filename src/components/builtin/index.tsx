import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import * as Lucide from "lucide-react";
import type { ComponentDef, NodeProps } from "@/types/schema";

/** 内置组件统一 props 契约 */
export interface BuiltinProps {
  props: NodeProps;
  interactive?: boolean; // 预览模式可交互
  onTrigger?: () => void; // 预览：有出向 transition 时触发跳转
}

/* ---------- Button ---------- */
const Button: React.FC<BuiltinProps> = ({ props, interactive, onTrigger }) => {
  const variant = (props.custom?.variant as string) ?? "primary";
  const size = (props.custom?.size as string) ?? "md";
  const base =
    "inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold tracking-wide transition-all duration-200 select-none";
  const variants: Record<string, string> = {
    primary:
      "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-px active:translate-y-0",
    secondary:
      "bg-white text-gray-700 border border-gray-200 shadow-sm hover:bg-gray-50 hover:border-gray-300 hover:-translate-y-px",
    ghost: "bg-transparent text-indigo-600 hover:bg-indigo-50",
    danger:
      "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30 hover:-translate-y-px",
  };
  const sizes: Record<string, string> = {
    sm: "h-8 px-3.5 text-[13px]",
    md: "h-10 px-5 text-sm",
    lg: "h-12 px-7 text-[15px]",
  };
  return (
    <motion.button
      whileTap={interactive ? { scale: 0.96 } : undefined}
      onClick={interactive ? onTrigger : undefined}
      className={cn(base, variants[variant], sizes[size], "w-full h-full")}
    >
      {props.text ?? "按钮"}
    </motion.button>
  );
};

/* ---------- Input ---------- */
const Input: React.FC<BuiltinProps> = ({ props }) => {
  const placeholder = (props.custom?.placeholder as string) ?? "";
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={props.text ?? ""}
      readOnly={!props.custom?.editable}
      className="w-full h-full rounded-lg border border-gray-200 bg-gray-50/60 px-3.5 text-sm text-gray-800 placeholder:text-gray-400 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
    />
  );
};

/* ---------- 样式工具：hex → rgba ---------- */
function hexToRgba(hex: string, alpha: number): string {
  let h = (hex || "").replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((ch) => ch + ch).join("");
  if (!/^[0-9a-f]{6}$/i.test(h)) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** 数值类 custom 字段读取（空字符串视为未设置） */
function num(v: unknown): number | undefined {
  if (v == null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/* ---------- Text ---------- */
const Text: React.FC<BuiltinProps> = ({ props }) => {
  const c = props.custom ?? {};
  const variant = (c.variant as string) ?? "body";
  const presets: Record<string, { fontSize: number; fontWeight: number; color: string; lineHeight: number; tracking: number }> = {
    display: { fontSize: 44, fontWeight: 800, color: "#0f172a", lineHeight: 1.12, tracking: -1 },
    h1: { fontSize: 32, fontWeight: 800, color: "#111827", lineHeight: 1.2, tracking: -0.5 },
    h2: { fontSize: 24, fontWeight: 700, color: "#111827", lineHeight: 1.3, tracking: -0.3 },
    h3: { fontSize: 17, fontWeight: 600, color: "#1f2937", lineHeight: 1.4, tracking: 0 },
    body: { fontSize: 14, fontWeight: 400, color: "#374151", lineHeight: 1.6, tracking: 0 },
    caption: { fontSize: 12, fontWeight: 400, color: "#6b7280", lineHeight: 1.5, tracking: 0 },
  };
  const preset = presets[variant] ?? presets.body;
  const fontSize = num(c.fontSize) ?? preset.fontSize;
  const fontWeight = num(c.fontWeight) ?? preset.fontWeight;
  const color = (c.color as string) || preset.color || "";
  const align = (c.align as string) || "left";
  const letterSpacing = num(c.letterSpacing);
  const lineHeight = num(c.lineHeight);
  const italic = c.italic === true;
  const uppercase = c.uppercase === true;
  const gradText = c.gradText === true;
  const gradFrom = (c.gradFrom as string) || "#6366f1";
  const gradTo = (c.gradTo as string) || "#ec4899";
  const textShadow = (c.textShadow as string) || "";

  const tag = variant === "display" ? "h1" : variant.startsWith("h") ? variant : "p";
  const style: React.CSSProperties = {
    fontSize: `${fontSize}px`,
    fontWeight,
    textAlign: align as React.CSSProperties["textAlign"],
    letterSpacing: letterSpacing != null ? `${letterSpacing}px` : preset.tracking !== 0 ? `${preset.tracking}px` : undefined,
    lineHeight: lineHeight != null ? lineHeight : preset.lineHeight,
    fontStyle: italic ? "italic" : undefined,
    textTransform: uppercase ? "uppercase" : undefined,
    textShadow: textShadow || undefined,
    width: "100%",
    margin: 0,
    wordBreak: "break-word",
  };
  if (gradText) {
    style.background = `linear-gradient(90deg, ${gradFrom}, ${gradTo})`;
    style.WebkitBackgroundClip = "text";
    style.backgroundClip = "text";
    style.WebkitTextFillColor = "transparent";
    style.color = "transparent";
  } else if (color) {
    style.color = color;
  }
  return React.createElement(tag, { style }, props.text ?? "文本");
};

/* ---------- Image ---------- */
const Image: React.FC<BuiltinProps> = ({ props }) => {
  const src = props.imageSrc ?? "";
  if (!src) {
    return (
      <div className="w-full h-full grid place-items-center bg-gray-100 text-xs text-gray-400 rounded-md">
        无图片
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={props.text ?? ""} className="w-full h-full object-cover rounded-md" />;
};

/* ---------- Card ---------- */
const Card: React.FC<BuiltinProps> = ({ props, interactive, onTrigger }) => {
  return (
    <motion.div
      whileHover={interactive ? { y: -3 } : undefined}
      onClick={interactive ? onTrigger : undefined}
      className="w-full h-full rounded-2xl border border-gray-100 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] hover:shadow-[0_16px_44px_rgba(15,23,42,0.10)] transition-shadow duration-300 p-5 flex flex-col gap-2"
    >
      <div className="text-[15px] font-semibold tracking-tight text-gray-900">{props.text ?? "卡片标题"}</div>
      {props.apiUrl && (
        <div className="text-xs text-gray-400 truncate">API: {props.apiUrl}</div>
      )}
    </motion.div>
  );
};

/* ---------- Form ---------- */
const Form: React.FC<BuiltinProps> = ({ props }) => {
  return (
    <div className="w-full h-full rounded-2xl border border-gray-100 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] p-5 flex flex-col gap-3">
      <div className="text-[15px] font-semibold tracking-tight text-gray-900">{props.text ?? "表单"}</div>
      <input
        placeholder="字段一"
        className="h-10 rounded-lg border border-gray-200 bg-gray-50/60 px-3.5 text-sm placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
      />
      <input
        placeholder="字段二"
        className="h-10 rounded-lg border border-gray-200 bg-gray-50/60 px-3.5 text-sm placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
      />
      <button className="h-10 self-end rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25">
        提交
      </button>
    </div>
  );
};

/* ---------- Container ---------- */
const SHADOW_META: Record<string, { y: number; blur: number; alpha: number }> = {
  sm: { y: 2, blur: 10, alpha: 0.08 },
  md: { y: 8, blur: 30, alpha: 0.12 },
  lg: { y: 16, blur: 48, alpha: 0.16 },
  xl: { y: 24, blur: 70, alpha: 0.2 },
};

const Container: React.FC<BuiltinProps> = ({ props }) => {
  const c = props.custom ?? {};
  const bgType = (c.bgType as string) || "";
  const bgColor = (c.bgColor as string) || "";
  const gradFrom = (c.gradFrom as string) || "#6366f1";
  const gradTo = (c.gradTo as string) || "#ec4899";
  const gradAngle = num(c.gradAngle) ?? 135;
  const bgImage = (c.bgImage as string) || "";
  const radius = num(c.radius);
  const padding = num(c.padding);
  const opacity = num(c.opacity);
  const shadow = (c.shadow as string) || "none";
  const shadowColor = (c.shadowColor as string) || "#4f46e5";
  const borderColor = (c.borderColor as string) || "#e5e7eb";
  const borderWidth = num(c.borderWidth) ?? 0;
  const blur = num(c.blur) ?? 12;
  const showLabel = c.showLabel === true;

  const hasStyle =
    (bgType !== "" && bgType !== "transparent") ||
    !!bgImage ||
    borderWidth > 0 ||
    (shadow !== "none" && !!SHADOW_META[shadow]);

  // 无样式：保留虚线占位框（编辑器 affordance）
  if (!hasStyle) {
    return (
      <div className="w-full h-full rounded-lg border-2 border-dashed border-gray-200 p-3 flex items-center justify-center">
        <span className="text-xs text-gray-400">{props.text ?? "容器"}</span>
      </div>
    );
  }

  let background: string | undefined;
  let backdropFilter: string | undefined;
  if (bgType === "solid") background = bgColor || "#ffffff";
  else if (bgType === "gradient") background = `linear-gradient(${gradAngle}deg, ${gradFrom}, ${gradTo})`;
  else if (bgType === "image") background = bgImage ? `url(${bgImage}) center/cover no-repeat` : undefined;
  else if (bgType === "glass") {
    background = hexToRgba(bgColor || "#ffffff", 0.55);
    backdropFilter = `blur(${blur}px)`;
  }

  const sm = SHADOW_META[shadow];
  const boxShadow = sm ? `0 ${sm.y}px ${sm.blur}px ${hexToRgba(shadowColor, sm.alpha)}` : "none";

  const style: React.CSSProperties = {
    width: "100%",
    height: "100%",
    background,
    backdropFilter,
    WebkitBackdropFilter: backdropFilter,
    borderRadius: radius != null ? `${radius}px` : undefined,
    padding: padding != null ? `${padding}px` : undefined,
    opacity: opacity != null ? opacity : undefined,
    boxShadow,
    border: borderWidth > 0 ? `${borderWidth}px solid ${borderColor}` : undefined,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  };

  return (
    <div style={style}>
      {showLabel ? <span className="text-xs text-gray-400">{props.text ?? ""}</span> : null}
    </div>
  );
};

/* ---------- Badge ---------- */
const Badge: React.FC<BuiltinProps> = ({ props }) => {
  const color = (props.custom?.color as string) ?? "blue";
  const colors: Record<string, string> = {
    blue: "bg-indigo-50 text-indigo-700 ring-indigo-600/15",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
    red: "bg-rose-50 text-rose-700 ring-rose-600/15",
    yellow: "bg-amber-50 text-amber-700 ring-amber-600/20",
    gray: "bg-gray-50 text-gray-600 ring-gray-500/15",
    purple: "bg-purple-50 text-purple-700 ring-purple-600/15",
  };
  return (
    <span className={cn("inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset", colors[color], "w-full h-full")}>
      {props.text ?? "标签"}
    </span>
  );
};

/* ---------- Link ---------- */
const Link: React.FC<BuiltinProps> = ({ props }) => {
  const href = props.apiUrl ?? "#";
  return (
    <a href={href} className="w-full h-full flex items-center text-sm text-indigo-600 hover:underline cursor-pointer">
      {props.text ?? "链接"}
    </a>
  );
};

/* ---------- Divider ---------- */
const Divider: React.FC<BuiltinProps> = ({ props }) => {
  const color = (props.custom?.color as string) ?? "border-gray-300";
  const style = (props.custom?.style as string) ?? "solid";
  const borderStyle = style === "dashed" ? "border-dashed" : style === "dotted" ? "border-dotted" : "border-solid";
  return <div className="w-full h-full flex items-center"><div className={cn("w-full border-t", color, borderStyle)} /></div>;
};

/* ---------- ProgressBar ---------- */
const ProgressBar: React.FC<BuiltinProps> = ({ props }) => {
  const progress = Math.min(100, Math.max(0, Number(props.custom?.progress ?? 40)));
  const color = (props.custom?.color as string) ?? "bg-gradient-to-r from-indigo-500 to-pink-500";
  return (
    <div className="w-full h-full flex flex-col gap-1.5 justify-center">
      <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${progress}%` }} />
      </div>
      <span className="text-[10px] font-medium text-gray-400">{progress}%</span>
    </div>
  );
};

/* ---------- Switch ---------- */
const Switch: React.FC<BuiltinProps> = ({ props, interactive }) => {
  const [on, setOn] = React.useState(!!props.custom?.checked);
  React.useEffect(() => setOn(!!props.custom?.checked), [props.custom?.checked]);
  return (
    <div className="w-full h-full flex items-center gap-2">
      <button
        onClick={() => interactive && setOn((v) => !v)}
        className={cn("relative h-6 w-11 rounded-full transition-colors", on ? "bg-indigo-500 shadow-md shadow-indigo-500/30" : "bg-gray-200")}
      >
        <span className={cn("absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform", on && "translate-x-5")} />
      </button>
      <span className="text-xs text-gray-600">{props.text ?? ""}</span>
    </div>
  );
};

/* ---------- Checkbox ---------- */
const Checkbox: React.FC<BuiltinProps> = ({ props, interactive }) => {
  const [checked, setChecked] = React.useState(!!props.custom?.checked);
  React.useEffect(() => setChecked(!!props.custom?.checked), [props.custom?.checked]);
  return (
    <label className="w-full h-full flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={() => interactive && setChecked((v) => !v)}
        className="h-4 w-4 rounded border-gray-300"
      />
      <span className="text-sm text-gray-700">{props.text ?? "选项"}</span>
    </label>
  );
};

/* ---------- Textarea ---------- */
const Textarea: React.FC<BuiltinProps> = ({ props }) => {
  const placeholder = (props.custom?.placeholder as string) ?? "";
  return (
    <textarea
      placeholder={placeholder}
      value={props.text ?? ""}
      readOnly={!props.custom?.editable}
      className="w-full h-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
    />
  );
};

/* ---------- Select ---------- */
const Select: React.FC<BuiltinProps> = ({ props }) => {
  const options = (props.custom?.options as string[]) ?? ["选项一", "选项二", "选项三"];
  return (
    <select
      className="w-full h-full rounded-md border border-gray-300 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
      value={props.text ?? ""}
    >
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
};

/* ---------- Icon ---------- */
const Icon: React.FC<BuiltinProps> = ({ props }) => {
  const name = (props.custom?.iconName as string) ?? "Heart";
  const size = Number(props.custom?.iconSize ?? 24);
  const color = (props.custom?.iconColor as string) ?? "text-gray-700";
  const IconComp = (Lucide as unknown as Record<string, React.FC<{ size?: number; className?: string }>>)[name];
  if (!IconComp) {
    return (
      <div className="w-full h-full grid place-items-center text-xs text-gray-400">
        图标不存在: {name}
      </div>
    );
  }
  return (
    <div className="w-full h-full grid place-items-center">
      <IconComp size={size} className={color} />
    </div>
  );
};

/* ---------- Avatar ---------- */
const Avatar: React.FC<BuiltinProps> = ({ props }) => {
  const src = props.imageSrc ?? "";
  const size = Number(props.custom?.avatarSize ?? 40);
  if (!src) {
    return (
      <div
        className="w-full h-full grid place-items-center rounded-full bg-gray-200 text-gray-500 text-sm font-medium"
        style={{ width: size, height: size }}
      >
        {(props.text ?? "?").charAt(0).toUpperCase()}
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="avatar" className="w-full h-full rounded-full object-cover" />;
};

/* ---------- Alert ---------- */
const Alert: React.FC<BuiltinProps> = ({ props }) => {
  const variant = (props.custom?.variant as string) ?? "info";
  const styles: Record<string, string> = {
    info: "bg-indigo-50/70 border-indigo-200 text-indigo-800",
    success: "bg-emerald-50/70 border-emerald-200 text-emerald-800",
    warning: "bg-amber-50/70 border-amber-200 text-amber-800",
    error: "bg-rose-50/70 border-rose-200 text-rose-800",
  };
  const iconNames: Record<string, string> = { info: "Info", success: "CheckCircle2", warning: "AlertTriangle", error: "XCircle" };
  const LucideIcon = (Lucide as unknown as Record<string, React.FC<{ size?: number; className?: string }>>)[iconNames[variant]];
  return (
    <div className={cn("w-full h-full rounded-xl border px-3.5 py-3 flex items-center gap-2.5", styles[variant])}>
      {LucideIcon && <LucideIcon size={15} className="shrink-0 opacity-80" />}
      <span className="text-xs font-medium leading-relaxed flex-1">{props.text ?? "提示信息"}</span>
    </div>
  );
};

/* ---------- Tabs ---------- */
const Tabs: React.FC<BuiltinProps> = ({ props, interactive }) => {
  const tabs = (props.custom?.tabs as string[]) ?? ["首页", "分类", "我的"];
  const [active, setActive] = React.useState(0);
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex border-b border-gray-200">
        {tabs.map((t, i) => (
          <button
            key={i}
            onClick={() => interactive && setActive(i)}
            className={cn("px-3 py-1.5 text-xs font-medium border-b-2 transition-colors", active === i ? "border-indigo-500 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700")}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="flex-1 p-2 text-xs text-gray-400">{tabs[active]} 内容区</div>
    </div>
  );
};

/* ---------- Accordion ---------- */
const Accordion: React.FC<BuiltinProps> = ({ props, interactive }) => {
  const items = (props.custom?.items as string[]) ?? ["第一项", "第二项", "第三项"];
  const [open, setOpen] = React.useState<number | null>(0);
  return (
    <div className="w-full h-full flex flex-col gap-1">
      {items.map((item, i) => (
        <div key={i} className="border border-gray-200 rounded-md overflow-hidden">
          <button
            onClick={() => interactive && setOpen(open === i ? null : i)}
            className="w-full px-3 py-2 text-left text-xs font-medium bg-gray-50 hover:bg-gray-100"
          >
            {item}
          </button>
          {open === i && (
            <div className="px-3 py-2 text-xs text-gray-500">{item} 的内容</div>
          )}
        </div>
      ))}
    </div>
  );
};

/* ---------- Navbar ---------- */
const Navbar: React.FC<BuiltinProps> = ({ props }) => {
  const links = (props.custom?.links as string[]) ?? ["首页", "产品", "文档", "关于"];
  return (
    <div className="w-full h-full flex items-center justify-between px-5 bg-white/75 backdrop-blur-xl border-b border-gray-100">
      <div className="flex items-center gap-2">
        <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-pink-500 shadow-md shadow-indigo-500/25" />
        <span className="text-sm font-bold tracking-tight text-gray-900">{props.text ?? "Logo"}</span>
      </div>
      <div className="flex items-center gap-5">
        {links.map((l, i) => (
          <span key={i} className="text-[13px] font-medium text-gray-500 hover:text-indigo-600 cursor-pointer transition-colors">{l}</span>
        ))}
      </div>
    </div>
  );
};

/* ---------- Footer ---------- */
const Footer: React.FC<BuiltinProps> = ({ props }) => {
  const links = (props.custom?.links as string[]) ?? ["隐私政策", "服务条款", "联系我们"];
  return (
    <div className="w-full h-full flex items-center justify-between px-5 bg-gray-50/80 border-t border-gray-100">
      <span className="text-xs text-gray-400">{props.text ?? "© 2025 Company"}</span>
      <div className="flex items-center gap-4">
        {links.map((l, i) => (
          <span key={i} className="text-xs text-gray-500 hover:text-indigo-600 cursor-pointer transition-colors">{l}</span>
        ))}
      </div>
    </div>
  );
};

/* ---------- Breadcrumb ---------- */
const Breadcrumb: React.FC<BuiltinProps> = ({ props }) => {
  const items = (props.custom?.items as string[]) ?? ["首页", "分类", "详情"];
  return (
    <div className="w-full h-full flex items-center gap-1 text-xs">
      {items.map((item, i) => (
        <React.Fragment key={i}>
          <span className={cn(i === items.length - 1 ? "text-gray-900 font-medium" : "text-indigo-600 hover:underline cursor-pointer")}>
            {item}
          </span>
          {i < items.length - 1 && <span className="text-gray-300">/</span>}
        </React.Fragment>
      ))}
    </div>
  );
};

/* ---------- Pagination ---------- */
const Pagination: React.FC<BuiltinProps> = ({ props }) => {
  const total = Number(props.custom?.total ?? 5);
  const pages = Array.from({ length: Math.min(total, 10) }, (_, i) => i + 1);
  const [current, setCurrent] = React.useState(1);
  return (
    <div className="w-full h-full flex items-center gap-1 justify-center">
      <button className="px-2 py-1 text-xs rounded border border-gray-200 text-gray-600 hover:bg-gray-50" onClick={() => setCurrent(Math.max(1, current - 1))}>«</button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => setCurrent(p)}
          className={cn("px-2 py-1 text-xs rounded-md border", current === p ? "border-indigo-500 bg-indigo-500 text-white shadow-md shadow-indigo-500/25" : "border-gray-200 text-gray-600 hover:bg-gray-50")}
        >
          {p}
        </button>
      ))}
      <button className="px-2 py-1 text-xs rounded border border-gray-200 text-gray-600 hover:bg-gray-50" onClick={() => setCurrent(Math.min(total, current + 1))}>»</button>
    </div>
  );
};

/* ---------- RadioGroup ---------- */
const RadioGroup: React.FC<BuiltinProps> = ({ props, interactive }) => {
  const options = (props.custom?.options as string[]) ?? ["选项一", "选项二", "选项三"];
  const [selected, setSelected] = React.useState(0);
  return (
    <div className="w-full h-full flex flex-col gap-1.5">
      {options.map((o, i) => (
        <label key={i} className="flex items-center gap-2 cursor-pointer text-xs text-gray-700">
          <input
            type="radio"
            checked={selected === i}
            onChange={() => interactive && setSelected(i)}
            className="h-4 w-4 text-indigo-600"
          />
          {o}
        </label>
      ))}
    </div>
  );
};

/* ---------- Slider ---------- */
const Slider: React.FC<BuiltinProps> = ({ props }) => {
  const val = Number(props.custom?.value ?? 50);
  const min = Number(props.custom?.min ?? 0);
  const max = Number(props.custom?.max ?? 100);
  return (
    <div className="w-full h-full flex flex-col gap-1">
      <input type="range" min={min} max={max} defaultValue={val} className="w-full accent-indigo-500" />
      <div className="flex justify-between text-[10px] text-gray-400">
        <span>{min}</span>
        <span>{val}</span>
        <span>{max}</span>
      </div>
    </div>
  );
};

/* ---------- Spinner ---------- */
const Spinner: React.FC<BuiltinProps> = ({ props }) => {
  const size = Number(props.custom?.spinnerSize ?? 24);
  const color = (props.custom?.color as string) ?? "text-indigo-500";
  return (
    <div className="w-full h-full grid place-items-center">
      <div className={cn("animate-spin rounded-full border-2 border-gray-200 border-t-current", color)} style={{ width: size, height: size }} />
    </div>
  );
};

/* ---------- Skeleton ---------- */
const Skeleton: React.FC<BuiltinProps> = ({ props }) => {
  const lines = Math.max(1, Math.min(10, Number(props.custom?.lines ?? 3)));
  const animated = props.custom?.animated !== false;
  const widths = ["w-3/4", "w-full", "w-1/2", "w-2/3", "w-5/6", "w-full", "w-3/4", "w-1/2", "w-2/3", "w-full"];
  return (
    <div className="w-full h-full flex flex-col gap-2 p-2">
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className={cn("h-4 rounded bg-gray-200", animated && "animate-pulse", widths[i % widths.length])} />
      ))}
    </div>
  );
};

/* ---------- StatCard ---------- */
const StatCard: React.FC<BuiltinProps> = ({ props }) => {
  const value = (props.custom?.statValue as string) ?? "1,234";
  const label = (props.custom?.statLabel as string) ?? "总量";
  return (
    <div className="w-full h-full rounded-2xl border border-gray-100 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)] px-4 py-3 flex flex-col justify-center relative overflow-hidden">
      <div className="absolute left-0 top-3 bottom-3 w-1 rounded-full bg-gradient-to-b from-indigo-500 to-pink-500" />
      <div className="text-[26px] leading-8 font-extrabold tracking-tight text-gray-900">{value}</div>
      <div className="text-xs text-gray-400 mt-1">{label}</div>
    </div>
  );
};

/* ---------- Quote ---------- */
const Quote: React.FC<BuiltinProps> = ({ props }) => {
  return (
    <blockquote className="w-full h-full flex items-center rounded-r-xl border-l-4 border-indigo-400 bg-gradient-to-r from-indigo-50/60 to-transparent pl-4 pr-3 py-2 text-sm leading-relaxed text-gray-600 italic">
      {props.text ?? "这是一段引用文字"}
    </blockquote>
  );
};

/* ---------- CodeBlock ---------- */
const CodeBlock: React.FC<BuiltinProps> = ({ props }) => {
  return (
    <pre className="w-full h-full rounded-md bg-gray-900 text-green-400 p-3 text-xs font-mono overflow-auto whitespace-pre-wrap">
      {props.code ?? "console.log('hello')"}
    </pre>
  );
};

/* ---------- Tag ---------- */
const Tag: React.FC<BuiltinProps> = ({ props }) => {
  const color = (props.custom?.color as string) ?? "gray";
  const colors: Record<string, string> = {
    gray: "bg-gray-100 text-gray-600 border-gray-200",
    blue: "bg-indigo-50 text-indigo-600 border-indigo-200",
    green: "bg-green-100 text-green-600 border-green-200",
    red: "bg-red-100 text-red-600 border-red-200",
    orange: "bg-orange-100 text-orange-600 border-orange-200",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs", colors[color])}>
      {props.text ?? "标签"}
    </span>
  );
};

/* ---------- List ---------- */
const List: React.FC<BuiltinProps> = ({ props }) => {
  const items = (props.custom?.items as string[]) ?? ["列表项一", "列表项二", "列表项三", "列表项四"];
  return (
    <ul className="w-full h-full flex flex-col gap-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-center gap-2 text-xs text-gray-700">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
          {item}
        </li>
      ))}
    </ul>
  );
};

/* ---------- Table ---------- */
const Table: React.FC<BuiltinProps> = ({ props }) => {
  const headers = (props.custom?.headers as string[]) ?? ["名称", "值", "状态"];
  const rows: string[][] = (props.custom?.rows as string[][]) ?? [["A", "100", "✓"], ["B", "200", "✗"]];
  return (
    <table className="w-full h-full text-xs">
      <thead>
        <tr className="border-b border-gray-100 bg-gray-50/60">
          {headers.map((h, i) => (
            <th key={i} className="text-left py-2 px-3 font-semibold text-gray-500">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr key={ri} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
            {(Array.isArray(row) ? row : [row]).map((cell, ci) => (
              <td key={ci} className="py-2 px-3 text-gray-600">{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

/* ---------- Steps ---------- */
const Steps: React.FC<BuiltinProps> = ({ props }) => {
  const steps = (props.custom?.steps as string[]) ?? ["第一步", "第二步", "第三步"];
  const current = Number(props.custom?.current ?? 1);
  return (
    <div className="w-full h-full flex items-center">
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          <div className="flex flex-col items-center">
            <div className={cn("w-6 h-6 rounded-full grid place-items-center text-xs font-medium", i < current ? "bg-indigo-500 text-white" : i === current ? "bg-indigo-100 text-indigo-600 border-2 border-indigo-500" : "bg-gray-200 text-gray-400")}>
              {i + 1}
            </div>
            <span className="text-[10px] text-gray-500 mt-1">{s}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={cn("flex-1 h-0.5 mx-1 mb-4", i < current ? "bg-indigo-500" : "bg-gray-200")} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

/* ---------- Rating ---------- */
const Rating: React.FC<BuiltinProps> = ({ props, interactive }) => {
  const max = Number(props.custom?.max ?? 5);
  const [val, setVal] = React.useState(Number(props.custom?.value ?? 3));
  React.useEffect(() => setVal(Number(props.custom?.value ?? 3)), [props.custom?.value]);
  return (
    <div className="w-full h-full flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <button
          key={i}
          onClick={() => interactive && setVal(i + 1)}
          className={cn("text-lg", i < val ? "text-yellow-400" : "text-gray-300")}
        >
          ★
        </button>
      ))}
      <span className="text-xs text-gray-500 ml-1">{val}/{max}</span>
    </div>
  );
};

/* ---------- Counter ---------- */
const Counter: React.FC<BuiltinProps> = ({ props, interactive }) => {
  const [count, setCount] = React.useState(Number(props.custom?.initial ?? 0));
  return (
    <div className="w-full h-full flex items-center justify-between">
      <button
        onClick={() => interactive && setCount((c) => c - 1)}
        className="w-8 h-8 rounded-md border border-gray-200 hover:bg-gray-50 text-gray-600"
      >−</button>
      <span className="text-lg font-semibold text-gray-900">{count}</span>
      <button
        onClick={() => interactive && setCount((c) => c + 1)}
        className="w-8 h-8 rounded-md border border-gray-200 hover:bg-gray-50 text-gray-600"
      >+</button>
    </div>
  );
};

/* ---------- SearchInput ---------- */
const SearchInput: React.FC<BuiltinProps> = ({ props }) => {
  const LucideSearch = (Lucide as unknown as Record<string, React.FC<{ size?: number; className?: string }>>)["Search"];
  return (
    <div className="relative w-full h-full">
      {LucideSearch && <LucideSearch size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />}
      <input
        type="text"
        placeholder={props.text ?? "搜索..."}
        className="w-full h-full rounded-full border border-gray-300 pl-8 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
      />
    </div>
  );
};

/* ---------- PasswordInput ---------- */
const PasswordInput: React.FC<BuiltinProps> = ({ props }) => {
  const [show, setShow] = React.useState(false);
  const LucideEye = (Lucide as unknown as Record<string, React.FC<{ size?: number; className?: string }>>)["Eye"];
  const LucideEyeOff = (Lucide as unknown as Record<string, React.FC<{ size?: number; className?: string }>>)["EyeOff"];
  return (
    <div className="relative w-full h-full">
      <input
        type={show ? "text" : "password"}
        placeholder={props.text ?? "请输入密码"}
        className="w-full h-full rounded-md border border-gray-300 px-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
      />
      <button
        onClick={() => setShow((v) => !v)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        {show && LucideEyeOff ? <LucideEyeOff size={14} /> : LucideEye ? <LucideEye size={14} /> : null}
      </button>
    </div>
  );
};

/* ---------- Empty ---------- */
const Empty: React.FC<BuiltinProps> = ({ props }) => {
  const LucideBox = (Lucide as unknown as Record<string, React.FC<{ size?: number; className?: string }>>)["Box"];
  return (
    <div className="w-full h-full grid place-items-center">
      <div className="flex flex-col items-center gap-2 text-gray-300">
        {LucideBox && <LucideBox size={32} className="text-gray-300" />}
        <span className="text-xs text-gray-400">{props.text ?? "暂无数据"}</span>
      </div>
    </div>
  );
};

/* ---------- Banner ---------- */
const Banner: React.FC<BuiltinProps> = ({ props }) => {
  const variant = (props.custom?.variant as string) ?? "info";
  const styles: Record<string, string> = {
    info: "bg-gradient-to-r from-indigo-500 to-indigo-600",
    success: "bg-gradient-to-r from-emerald-500 to-green-600",
    warning: "bg-gradient-to-r from-amber-500 to-orange-500",
    error: "bg-gradient-to-r from-rose-500 to-red-600",
  };
  return (
    <div className={cn("w-full h-full rounded-lg px-4 flex items-center text-white shadow-lg", styles[variant])}>
      <span className="text-xs font-semibold tracking-wide">{props.text ?? "公告内容"}</span>
    </div>
  );
};

/* ---------- Notification ---------- */
const Notification: React.FC<BuiltinProps> = ({ props }) => {
  const variant = (props.custom?.variant as string) ?? "info";
  const icons: Record<string, string> = { info: "Info", success: "CheckCircle", warning: "AlertTriangle", error: "XCircle" };
  const colors: Record<string, string> = {
    info: "border-l-indigo-500",
    success: "border-l-green-500",
    warning: "border-l-yellow-500",
    error: "border-l-red-500",
  };
  const IconName = icons[variant];
  const iconColors: Record<string, string> = { info: "text-indigo-500", success: "text-emerald-500", warning: "text-amber-500", error: "text-rose-500" };
  const LucideIcon = (Lucide as unknown as Record<string, React.FC<{ size?: number; className?: string }>>)[IconName];
  return (
    <div className={cn("w-full h-full rounded-xl bg-white shadow-[0_12px_36px_rgba(15,23,42,0.10)] border border-gray-100 border-l-4 p-3.5 flex items-start gap-2.5", colors[variant])}>
      {LucideIcon && <LucideIcon size={16} className={cn("mt-0.5 shrink-0", iconColors[variant])} />}
      <div className="flex-1">
        <div className="text-xs font-semibold text-gray-900">{props.text ?? "通知标题"}</div>
        <div className="text-[10px] text-gray-400 mt-0.5">这是一段通知描述</div>
      </div>
    </div>
  );
};

/* ---------- Timeline ---------- */
const Timeline: React.FC<BuiltinProps> = ({ props }) => {
  const items = (props.custom?.items as string[]) ?? ["创建项目", "开发中", "测试中", "已发布"];
  return (
    <div className="w-full h-full flex flex-col">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 flex-1">
          <div className="flex flex-col items-center">
            <div className={cn("w-2.5 h-2.5 rounded-full", i === 0 ? "bg-indigo-500" : "bg-gray-300")} />
            {i < items.length - 1 && <div className="flex-1 w-0.5 bg-gray-200 my-1" />}
          </div>
          <span className="text-xs text-gray-600 pt-0.5">{item}</span>
        </div>
      ))}
    </div>
  );
};

/* ---------- Tooltip ---------- */
const Tooltip: React.FC<BuiltinProps> = ({ props }) => {
  const [show, setShow] = React.useState(false);
  return (
    <div className="w-full h-full relative flex items-center justify-center"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span className="text-xs text-gray-600 underline decoration-dotted cursor-help">{props.text ?? "悬浮我"}</span>
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded bg-gray-900 text-white text-[10px] whitespace-nowrap z-10">
          {String(props.custom?.tip ?? "提示文字")}
        </div>
      )}
    </div>
  );
};

/* ---------- Freehand (手绘) ---------- */
const Freehand: React.FC<BuiltinProps> = ({ props }) => {
  const pathData = (props.custom?.pathData as string) ?? "";
  const color = (props.custom?.strokeColor as string) ?? "#000000";
  const width = Number(props.custom?.strokeWidth ?? 2);
  if (!pathData) {
    return <div className="w-full h-full grid place-items-center text-xs text-gray-300">手绘</div>;
  }
  return (
    <svg className="w-full h-full" viewBox="0 0 200 150" preserveAspectRatio="xMidYMid meet">
      <path d={pathData} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

/* ---------- GradientText ---------- */
const GradientText: React.FC<BuiltinProps> = ({ props }) => {
  const from = (props.custom?.from as string) ?? "#6366f1";
  const to = (props.custom?.to as string) ?? "#ec4899";
  return <div className="w-full h-full flex items-center justify-center"><span className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(135deg, ${from}, ${to})` }}>{props.text ?? "渐变文字"}</span></div>;
};

/* ---------- Highlight ---------- */
const Highlight: React.FC<BuiltinProps> = ({ props }) => {
  const color = (props.custom?.color as string) ?? "bg-yellow-200";
  return <div className="w-full h-full flex items-center"><span className={cn("px-1 rounded", color)}>{props.text ?? "高亮文本"}</span></div>;
};

/* ---------- Kbd ---------- */
const Kbd: React.FC<BuiltinProps> = ({ props }) => (
  <div className="w-full h-full flex items-center justify-center gap-1">
    {(props.text ?? "Ctrl+C").split("+").map((k, i) => (
      <React.Fragment key={i}>
        {i > 0 && <span className="text-xs text-gray-400">+</span>}
        <kbd className="px-2 py-1 text-xs font-mono bg-gray-100 border border-gray-300 rounded shadow-sm">{k.trim()}</kbd>
      </React.Fragment>
    ))}
  </div>
);

/* ---------- Marquee ---------- */
const Marquee: React.FC<BuiltinProps> = ({ props }) => (
  <div className="w-full h-full flex items-center overflow-hidden">
    <motion.div className="whitespace-nowrap text-sm text-gray-700" animate={{ x: ["100%", "-100%"] }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }}>{props.text ?? "跑马灯文字滚动效果展示"}</motion.div>
  </div>
);

/* ---------- Carousel ---------- */
const Carousel: React.FC<BuiltinProps> = ({ props }) => {
  const items = (props.custom?.items as string[]) ?? ["幻灯片 1", "幻灯片 2", "幻灯片 3"];
  const [idx, setIdx] = React.useState(0);
  return (
    <div className="w-full h-full rounded-lg bg-gray-100 flex flex-col items-center justify-center gap-2 relative overflow-hidden">
      <span className="text-sm font-medium text-gray-700">{items[idx]}</span>
      <div className="flex gap-1">{items.map((_, i) => <button key={i} onClick={() => setIdx(i)} className={cn("w-2 h-2 rounded-full", i === idx ? "bg-indigo-500" : "bg-gray-300")} />)}</div>
    </div>
  );
};

/* ---------- TreeView ---------- */
const TreeView: React.FC<BuiltinProps> = ({ props }) => {
  const items = (props.custom?.items as string[]) ?? ["src", "components", "pages", "utils"];
  return (
    <div className="w-full h-full flex flex-col gap-1 p-2 text-xs text-gray-700">
      <span className="flex items-center gap-1.5 font-semibold"><Lucide.Folder size={13} className="text-indigo-500" />{items[0] ?? "root"}</span>
      {items.slice(1).map((item, i) => <span key={i} className="flex items-center gap-1.5 pl-4 text-gray-500"><Lucide.File size={12} className="text-gray-400" />{item}</span>)}
    </div>
  );
};

/* ---------- DescriptionList ---------- */
const DescriptionList: React.FC<BuiltinProps> = ({ props }) => {
  const items: [string, string][] = (props.custom?.items as [string, string][]) ?? [["名称", "RouteCanvas"], ["版本", "1.0.0"], ["状态", "活跃"]];
  return (
    <div className="w-full h-full flex flex-col gap-1 p-2">
      {items.map(([k, v], i) => <div key={i} className="flex justify-between text-xs"><span className="text-gray-500">{k}</span><span className="text-gray-900 font-medium">{v}</span></div>)}
    </div>
  );
};

/* ---------- Chart ---------- */
const Chart: React.FC<BuiltinProps> = ({ props }) => {
  const data = (props.custom?.data as number[]) ?? [40, 70, 50, 90, 60, 80];
  const max = Math.max(...data, 1);
  return (
    <div className="w-full h-full flex items-end gap-1.5 p-2">
      {data.map((v, i) => <div key={i} className="flex-1 rounded-t-md bg-gradient-to-t from-indigo-500 to-indigo-400 hover:from-indigo-600 hover:to-indigo-500 transition-all" style={{ height: `${(v / max) * 100}%` }} />)}
    </div>
  );
};

/* ---------- Calendar ---------- */
const Calendar: React.FC<BuiltinProps> = () => {
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  return (
    <div className="w-full h-full p-2">
      <div className="grid grid-cols-7 gap-0.5 text-center text-[9px]">
        {["日","一","二","三","四","五","六"].map(d => <span key={d} className="text-gray-400 font-medium">{d}</span>)}
        {days.map(d => <span key={d} className={cn("rounded-full py-0.5", d === 15 ? "bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-500/30" : "text-gray-600 hover:bg-indigo-50")}>{d}</span>)}
      </div>
    </div>
  );
};

/* ---------- Modal ---------- */
const Modal: React.FC<BuiltinProps> = ({ props }) => (
  <div className="w-full h-full rounded-lg border border-gray-200 bg-white shadow-lg flex flex-col p-3">
    <div className="flex justify-between items-center mb-2"><span className="text-sm font-semibold">{props.text ?? "弹窗标题"}</span><span className="text-gray-400 text-xs">✕</span></div>
    <div className="flex-1 text-xs text-gray-500">弹窗内容区域</div>
    <div className="flex justify-end gap-2 mt-2"><button className="px-3 py-1 text-xs rounded border border-gray-200">取消</button><button className="px-3 py-1 text-xs rounded bg-indigo-500 text-white">确定</button></div>
  </div>
);

/* ---------- Drawer ---------- */
const Drawer: React.FC<BuiltinProps> = ({ props }) => (
  <div className="w-full h-full rounded-lg border border-gray-200 bg-white shadow-lg flex flex-col p-3">
    <div className="text-sm font-semibold mb-2">{props.text ?? "抽屉标题"}</div>
    <div className="flex-1 text-xs text-gray-400 border-l-2 border-indigo-200 pl-2">侧边抽屉内容</div>
  </div>
);

/* ---------- Popconfirm ---------- */
const Popconfirm: React.FC<BuiltinProps> = ({ props }) => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="rounded-lg border border-gray-200 bg-white shadow-md p-3 text-center">
      <div className="text-xs text-gray-700 mb-2">{props.text ?? "确认删除？"}</div>
      <div className="flex gap-2 justify-center"><button className="px-2 py-1 text-[10px] rounded border">取消</button><button className="px-2 py-1 text-[10px] rounded bg-red-500 text-white">删除</button></div>
    </div>
  </div>
);

/* ---------- Result ---------- */
const Result: React.FC<BuiltinProps> = ({ props }) => {
  const status = (props.custom?.status as string) ?? "success";
  const meta: Record<string, { icon: string; ring: string; fg: string }> = {
    success: { icon: "CheckCircle2", ring: "bg-emerald-50", fg: "text-emerald-500" },
    error: { icon: "XCircle", ring: "bg-rose-50", fg: "text-rose-500" },
    warning: { icon: "AlertTriangle", ring: "bg-amber-50", fg: "text-amber-500" },
    info: { icon: "Info", ring: "bg-indigo-50", fg: "text-indigo-500" },
  };
  const m = meta[status] ?? meta.success;
  const LucideIcon = (Lucide as unknown as Record<string, React.FC<{ size?: number; className?: string }>>)[m.icon];
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2.5">
      <span className={cn("w-12 h-12 rounded-full grid place-items-center", m.ring)}>
        {LucideIcon && <LucideIcon size={24} className={m.fg} />}
      </span>
      <span className="text-sm font-semibold text-gray-900">{props.text ?? "操作成功"}</span>
      <span className="text-xs text-gray-400">结果描述信息</span>
    </div>
  );
};

/* ---------- Watermark ---------- */
const Watermark: React.FC<BuiltinProps> = ({ props }) => (
  <div className="w-full h-full relative rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden">
    <div className="absolute inset-0 opacity-10 flex flex-wrap gap-4 p-2 rotate-[-20deg]" style={{ pointerEvents: "none" }}>
      {Array.from({ length: 12 }).map((_, i) => <span key={i} className="text-xs text-gray-900">{props.text ?? "水印"}</span>)}
    </div>
    <span className="text-xs text-gray-400">内容区域</span>
  </div>
);

/* ---------- Sidebar ---------- */
const Sidebar: React.FC<BuiltinProps> = ({ props }) => {
  const items = (props.custom?.items as string[]) ?? ["仪表盘", "用户管理", "设置", "日志"];
  return (
    <div className="w-full h-full rounded-2xl bg-gradient-to-b from-slate-900 to-gray-900 p-2.5 flex flex-col gap-1">
      <div className="flex items-center gap-2 px-2 mb-2">
        <span className="w-5 h-5 rounded-md bg-gradient-to-br from-indigo-500 to-pink-500" />
        <span className="text-[13px] font-bold text-white tracking-tight">{props.text ?? "Logo"}</span>
      </div>
      {items.map((item, i) => <div key={i} className={cn("px-2.5 py-1.5 rounded-lg text-xs transition-colors", i === 0 ? "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-medium shadow-lg shadow-indigo-500/30" : "text-gray-400 hover:text-white hover:bg-white/5")}>{item}</div>)}
    </div>
  );
};

/* ---------- Menu ---------- */
const Menu: React.FC<BuiltinProps> = ({ props }) => {
  const items = (props.custom?.items as string[]) ?? ["菜单项一", "菜单项二", "菜单项三"];
  return (
    <div className="w-full h-full rounded-lg border border-gray-200 bg-white shadow-md p-1 flex flex-col">
      {items.map((item, i) => <div key={i} className="px-3 py-1.5 text-xs text-gray-700 rounded hover:bg-gray-100 cursor-pointer">{item}</div>)}
    </div>
  );
};

/* ---------- Dropdown ---------- */
const Dropdown: React.FC<BuiltinProps> = ({ props }) => {
  const items = (props.custom?.items as string[]) ?? ["编辑", "复制", "删除"];
  return (
    <div className="w-full h-full flex flex-col items-center justify-start gap-1 p-2">
      <button className="px-3 py-1.5 text-xs rounded border border-gray-200 bg-white">{props.text ?? "下拉菜单"} ▾</button>
      <div className="w-24 rounded border border-gray-200 bg-white shadow-md p-0.5">{items.map((item, i) => <div key={i} className="px-2 py-1 text-[10px] text-gray-700 rounded hover:bg-gray-100">{item}</div>)}</div>
    </div>
  );
};

/* ---------- BackTop ---------- */
const BackTop: React.FC<BuiltinProps> = () => (
  <div className="w-full h-full flex items-center justify-center">
    <button className="w-8 h-8 rounded-full bg-indigo-500 text-white shadow-lg flex items-center justify-center text-sm">↑</button>
  </div>
);

/* ---------- DatePicker ---------- */
const DatePicker: React.FC<BuiltinProps> = ({ props }) => (
  <div className="w-full h-full flex items-center"><input type="date" className="w-full h-full rounded-md border border-gray-300 px-3 text-sm" defaultValue={props.text ?? ""} /></div>
);

/* ---------- TimePicker ---------- */
const TimePicker: React.FC<BuiltinProps> = ({ props }) => (
  <div className="w-full h-full flex items-center"><input type="time" className="w-full h-full rounded-md border border-gray-300 px-3 text-sm" defaultValue={props.text ?? ""} /></div>
);

/* ---------- ColorPicker ---------- */
const ColorPicker: React.FC<BuiltinProps> = ({ props }) => (
  <div className="w-full h-full flex items-center gap-2 px-2"><input type="color" className="w-8 h-8 rounded border-0 cursor-pointer" defaultValue={(props.custom?.color as string) ?? "#6366f1"} /><span className="text-xs text-gray-600">{props.text ?? "选择颜色"}</span></div>
);

/* ---------- FileUpload ---------- */
const FileUpload: React.FC<BuiltinProps> = ({ props }) => (
  <div className="w-full h-full rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:border-indigo-300 hover:bg-indigo-50/40 hover:text-indigo-500 transition-colors cursor-pointer">
    <Lucide.UploadCloud size={22} strokeWidth={1.6} /><span className="text-xs font-medium">{props.text ?? "点击或拖拽上传"}</span>
  </div>
);

/* ---------- OTPInput ---------- */
const OTPInput: React.FC<BuiltinProps> = () => (
  <div className="w-full h-full flex items-center justify-center gap-1.5">
    {Array.from({ length: 6 }).map((_, i) => <input key={i} maxLength={1} className="w-8 h-10 text-center rounded-md border border-gray-300 text-sm font-mono" />)}
  </div>
);

/* ---------- NumberInput ---------- */
const NumberInput: React.FC<BuiltinProps> = ({ props }) => (
  <div className="w-full h-full flex items-center"><input type="number" className="w-full h-full rounded-md border border-gray-300 px-3 text-sm" placeholder={props.text ?? "0"} /></div>
);

/* ---------- RateInput ---------- */
const RateInput: React.FC<BuiltinProps> = ({ props, interactive }) => {
  const [val, setVal] = React.useState(Number(props.custom?.value ?? 3));
  return <div className="w-full h-full flex items-center gap-0.5">{Array.from({ length: 5 }).map((_, i) => <button key={i} onClick={() => interactive && setVal(i + 1)} className={cn("text-lg", i < val ? "text-yellow-400" : "text-gray-300")}>★</button>)}</div>;
};

/* ---------- Transfer ---------- */
const Transfer: React.FC<BuiltinProps> = () => (
  <div className="w-full h-full flex gap-2 p-1">
    <div className="flex-1 rounded border border-gray-200 p-1"><div className="text-[9px] text-gray-400 mb-1">源列表</div>{["A","B","C"].map(i => <div key={i} className="text-[10px] px-1 py-0.5 rounded hover:bg-gray-100">{i}</div>)}</div>
    <div className="flex flex-col justify-center gap-1"><span className="text-xs text-gray-400">→</span><span className="text-xs text-gray-400">←</span></div>
    <div className="flex-1 rounded border border-gray-200 p-1"><div className="text-[9px] text-gray-400 mb-1">目标</div><div className="text-[10px] text-gray-300">空</div></div>
  </div>
);

/* ---------- Cascader ---------- */
const Cascader: React.FC<BuiltinProps> = ({ props }) => (
  <div className="w-full h-full flex items-center"><div className="w-full h-full rounded-md border border-gray-300 px-3 flex items-center text-sm text-gray-500">{props.text ?? "省 / 市 / 区"} <span className="ml-auto text-gray-300">▾</span></div></div>
);

/* ---------- AutoComplete ---------- */
const AutoComplete: React.FC<BuiltinProps> = ({ props }) => (
  <div className="w-full h-full relative flex items-center">
    <input className="w-full h-full rounded-md border border-gray-300 px-3 text-sm" placeholder={props.text ?? "输入搜索..."} />
    <div className="absolute top-full left-0 right-0 mt-0.5 rounded border border-gray-200 bg-white shadow-md p-0.5 z-10">{["建议一", "建议二"].map((s, i) => <div key={i} className="px-2 py-1 text-[10px] text-gray-700 rounded hover:bg-gray-100">{s}</div>)}</div>
  </div>
);

/* ---------- TagInput ---------- */
const TagInput: React.FC<BuiltinProps> = ({ props }) => {
  const tags = (props.custom?.tags as string[]) ?? ["React", "Next.js", "TypeScript"];
  return (
    <div className="w-full h-full rounded-md border border-gray-300 px-2 flex items-center gap-1 flex-wrap">
      {tags.map((t, i) => <span key={i} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px]">{t} ×</span>)}
      <input className="flex-1 min-w-[40px] text-xs outline-none" placeholder={props.text ?? "添加..."} />
    </div>
  );
};

/* ---------- PhoneInput ---------- */
const PhoneInput: React.FC<BuiltinProps> = ({ props }) => (
  <div className="w-full h-full flex items-center gap-1">
    <span className="px-2 h-full flex items-center rounded-l-md border border-r-0 border-gray-300 text-xs text-gray-500 bg-gray-50">+86</span>
    <input className="flex-1 h-full rounded-r-md border border-gray-300 px-3 text-sm" placeholder={props.text ?? "手机号"} />
  </div>
);

/* ---------- EmailInput ---------- */
const EmailInput: React.FC<BuiltinProps> = ({ props }) => (
  <div className="w-full h-full flex items-center"><input type="email" className="w-full h-full rounded-md border border-gray-300 px-3 text-sm" placeholder={props.text ?? "email@example.com"} /></div>
);

/* ---------- URLInput ---------- */
const URLInput: React.FC<BuiltinProps> = ({ props }) => (
  <div className="w-full h-full flex items-center gap-1">
    <span className="px-2 h-full flex items-center rounded-l-md border border-r-0 border-gray-300 text-xs text-gray-500 bg-gray-50">https://</span>
    <input className="flex-1 h-full rounded-r-md border border-gray-300 px-3 text-sm" placeholder={props.text ?? "example.com"} />
  </div>
);

/* ---------- MultiSelect ---------- */
const MultiSelect: React.FC<BuiltinProps> = ({ props }) => {
  const options = (props.custom?.options as string[]) ?? ["选项A", "选项B", "选项C", "选项D"];
  const [sel, setSel] = React.useState<number[]>([0]);
  return (
    <div className="w-full h-full rounded-md border border-gray-300 p-1 flex flex-wrap gap-1 content-start">
      {options.map((o, i) => <button key={i} onClick={() => setSel(s => s.includes(i) ? s.filter(x => x !== i) : [...s, i])} className={cn("px-2 py-0.5 rounded text-[10px] border", sel.includes(i) ? "bg-indigo-500 text-white border-indigo-500" : "border-gray-200 text-gray-600")}>{o}</button>)}
    </div>
  );
};

/* ---------- DateRangePicker ---------- */
const DateRangePicker: React.FC<BuiltinProps> = ({ props }) => (
  <div className="w-full h-full flex items-center gap-1">
    <input type="date" className="flex-1 h-full rounded-md border border-gray-300 px-2 text-xs" />
    <span className="text-xs text-gray-400">至</span>
    <input type="date" className="flex-1 h-full rounded-md border border-gray-300 px-2 text-xs" />
  </div>
);

/* ---------- WeekPicker ---------- */
const WeekPicker: React.FC<BuiltinProps> = ({ props }) => (
  <div className="w-full h-full flex items-center"><input type="week" className="w-full h-full rounded-md border border-gray-300 px-3 text-sm" defaultValue={props.text ?? ""} /></div>
);

/* ---------- MonthPicker ---------- */
const MonthPicker: React.FC<BuiltinProps> = ({ props }) => (
  <div className="w-full h-full flex items-center"><input type="month" className="w-full h-full rounded-md border border-gray-300 px-3 text-sm" defaultValue={props.text ?? ""} /></div>
);

/* ---------- ImageUpload ---------- */
const ImageUpload: React.FC<BuiltinProps> = ({ props }) => (
  <div className="w-full h-full rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:border-indigo-300 hover:bg-indigo-50/40 hover:text-indigo-500 transition-colors cursor-pointer">
    <Lucide.Image size={20} strokeWidth={1.6} /><span className="text-[10px] font-medium">{props.text ?? "点击上传图片"}</span>
  </div>
);

/* ---------- SignaturePad ---------- */
const SignaturePad: React.FC<BuiltinProps> = ({ props }) => (
  <div className="w-full h-full rounded-lg border border-gray-300 bg-gray-50 flex flex-col items-center justify-center relative">
    <span className="text-xs text-gray-300">{props.text ?? "签名区域"}</span>
    <div className="absolute bottom-1 right-2 text-gray-300"><Lucide.PenTool size={10} /></div>
    <div className="absolute bottom-0 left-2 right-2 border-b border-gray-200" />
  </div>
);

/* ---------- CaptchaInput ---------- */
const CaptchaInput: React.FC<BuiltinProps> = ({ props }) => (
  <div className="w-full h-full flex items-center gap-2">
    <input className="flex-1 h-full rounded-md border border-gray-300 px-3 text-sm" placeholder={props.text ?? "输入验证码"} />
    <div className="w-20 h-full rounded-md bg-gray-100 border border-gray-200 flex items-center justify-center text-sm font-mono font-bold text-gray-600 tracking-widest select-none">A3x9</div>
  </div>
);

/* ---------- AmountInput ---------- */
const AmountInput: React.FC<BuiltinProps> = ({ props }) => (
  <div className="w-full h-full flex items-center">
    <span className="px-2 h-full flex items-center rounded-l-md border border-r-0 border-gray-300 text-sm text-gray-500 bg-gray-50">¥</span>
    <input type="number" className="flex-1 h-full rounded-r-md border border-gray-300 px-3 text-sm" placeholder={props.text ?? "0.00"} />
  </div>
);

/* ---------- PercentageInput ---------- */
const PercentageInput: React.FC<BuiltinProps> = ({ props }) => (
  <div className="w-full h-full flex items-center">
    <input type="number" className="flex-1 h-full rounded-l-md border border-gray-300 px-3 text-sm" placeholder={props.text ?? "0"} />
    <span className="px-2 h-full flex items-center rounded-r-md border border-l-0 border-gray-300 text-sm text-gray-500 bg-gray-50">%</span>
  </div>
);

/* ---------- DualSlider ---------- */
const DualSlider: React.FC<BuiltinProps> = ({ props }) => {
  const min = Number(props.custom?.min ?? 0);
  const max = Number(props.custom?.max ?? 100);
  return (
    <div className="w-full h-full flex flex-col gap-1 justify-center">
      <div className="flex items-center gap-2">
        <input type="range" min={min} max={max} defaultValue={25} className="flex-1 accent-indigo-500" />
        <input type="range" min={min} max={max} defaultValue={75} className="flex-1 accent-indigo-500" />
      </div>
      <div className="flex justify-between text-[10px] text-gray-400"><span>{min}</span><span>范围选择</span><span>{max}</span></div>
    </div>
  );
};

/* ---------- InputGroup ---------- */
const InputGroup: React.FC<BuiltinProps> = ({ props }) => (
  <div className="w-full h-full flex flex-col gap-1.5 justify-center">
    <div className="flex items-center"><span className="px-2 h-8 flex items-center rounded-l-md border border-r-0 border-gray-300 text-xs text-gray-500 bg-gray-50">+86</span><input className="flex-1 h-8 rounded-r-md border border-gray-300 px-2 text-xs" placeholder="手机号" /></div>
    <div className="flex items-center"><span className="px-2 h-8 flex items-center rounded-l-md border border-r-0 border-gray-300 text-xs text-gray-500 bg-gray-50">@</span><input className="flex-1 h-8 rounded-r-md border border-gray-300 px-2 text-xs" placeholder="邮箱" /></div>
  </div>
);

/* ---------- ClearableInput ---------- */
const ClearableInput: React.FC<BuiltinProps> = ({ props }) => {
  const [val, setVal] = React.useState(props.text ?? "");
  return (
    <div className="relative w-full h-full flex items-center">
      <input value={val} onChange={(e) => setVal(e.target.value)} className="w-full h-full rounded-md border border-gray-300 px-3 pr-8 text-sm" placeholder={props.text ?? "可清除输入"} />
      {val && <button onClick={() => setVal("")} className="absolute right-2 text-gray-400 hover:text-gray-600 text-xs">✕</button>}
    </div>
  );
};

/* ---------- VoiceInput ---------- */
const VoiceInput: React.FC<BuiltinProps> = ({ props }) => (
  <div className="w-full h-full flex items-center gap-2">
    <input className="flex-1 h-full rounded-md border border-gray-300 px-3 text-sm" placeholder={props.text ?? "语音输入..."} readOnly />
    <button className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-red-500 text-white shadow-md shadow-rose-500/30 flex items-center justify-center shrink-0"><Lucide.Mic size={14} /></button>
  </div>
);

/* ---------- RichTextEditor ---------- */
const RichTextEditor: React.FC<BuiltinProps> = ({ props }) => (
  <div className="w-full h-full rounded-md border border-gray-300 flex flex-col overflow-hidden">
    <div className="flex items-center gap-1 px-2 py-1 border-b border-gray-200 bg-gray-50 text-xs text-gray-500">
      <span className="font-bold">B</span><span className="italic">I</span><span className="underline">U</span><span className="mx-1 text-gray-300">|</span><span>H1</span><span>H2</span><span className="mx-1 text-gray-300">|</span><span>≡</span><span>≡</span>
    </div>
    <div className="flex-1 p-2 text-xs text-gray-400">{props.text ?? "富文本编辑区域..."}</div>
  </div>
);

/* ---------- MarkdownEditor ---------- */
const MarkdownEditor: React.FC<BuiltinProps> = ({ props }) => (
  <div className="w-full h-full rounded-md border border-gray-300 flex flex-col overflow-hidden">
    <div className="flex items-center gap-1.5 px-2 py-1 border-b border-gray-200 bg-gray-50 text-[10px] text-gray-500 font-mono">
      <span className="font-bold">B</span><span className="italic">I</span><span>```</span><span>[ ]</span><span>#</span><span>&gt;</span>
    </div>
    <div className="flex-1 p-2 text-xs font-mono text-gray-400">{props.text ?? "# Markdown"}</div>
  </div>
);

/* ---------- CodeEditor ---------- */
const CodeEditor: React.FC<BuiltinProps> = ({ props }) => (
  <div className="w-full h-full rounded-md bg-gray-900 flex flex-col overflow-hidden">
    <div className="flex items-center gap-1 px-2 py-1 border-b border-gray-700 text-[9px] text-gray-400">
      <span className="w-2 h-2 rounded-full bg-red-400" /><span className="w-2 h-2 rounded-full bg-yellow-400" /><span className="w-2 h-2 rounded-full bg-green-400" /><span className="ml-2">script.ts</span>
    </div>
    <div className="flex-1 p-2 text-[10px] font-mono text-green-400">{props.text ?? "const x = 42;"}</div>
  </div>
);

/* ---------- JsonEditor ---------- */
const JsonEditor: React.FC<BuiltinProps> = ({ props }) => (
  <div className="w-full h-full rounded-md bg-gray-900 flex flex-col overflow-hidden">
    <div className="px-2 py-1 border-b border-gray-700 text-[9px] text-gray-400">JSON</div>
    <div className="flex-1 p-2 text-[10px] font-mono text-yellow-300">{"{ "}<span className="text-blue-300">&quot;key&quot;</span>: <span className="text-green-300">&quot;value&quot;</span>{" }"}</div>
  </div>
);

/* ---------- ColorSwatch ---------- */
const ColorSwatch: React.FC<BuiltinProps> = () => {
  const colors = ["#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#000000", "#ffffff"];
  return (
    <div className="w-full h-full flex items-center justify-center gap-1.5 flex-wrap p-2">
      {colors.map((c) => <div key={c} className="w-6 h-6 rounded-md border border-gray-200 cursor-pointer hover:scale-110 transition-transform" style={{ background: c }} />)}
    </div>
  );
};

/* ---------- FontPicker ---------- */
const FontPicker: React.FC<BuiltinProps> = ({ props }) => (
  <div className="w-full h-full flex items-center">
    <div className="w-full h-full rounded-md border border-gray-300 px-3 flex items-center justify-between text-sm text-gray-700">
      <span>{props.text ?? "Arial"}</span><span className="text-gray-300">▾</span>
    </div>
  </div>
);

/* ---------- IconPicker ---------- */
const IconPicker: React.FC<BuiltinProps> = () => {
  const iconNames = ["Heart", "Star", "Zap", "Check", "Rocket", "Lightbulb", "Target", "Bookmark", "Bell", "MessageCircle", "Folder", "Flag"];
  return (
    <div className="w-full h-full rounded-lg border border-gray-200 p-1.5 grid grid-cols-6 gap-1 content-start">
      {iconNames.map((name, i) => {
        const Ic = (Lucide as unknown as Record<string, React.FC<{ size?: number; className?: string }>>)[name];
        return Ic ? <button key={i} className="w-full aspect-square rounded-md hover:bg-indigo-50 hover:text-indigo-600 text-gray-500 flex items-center justify-center transition-colors"><Ic size={15} /></button> : null;
      })}
    </div>
  );
};

/* ---------- MaskedInput ---------- */
const MaskedInput: React.FC<BuiltinProps> = ({ props }) => (
  <div className="w-full h-full flex items-center">
    <input className="w-full h-full rounded-md border border-gray-300 px-3 text-sm font-mono" placeholder={props.text ?? "___-____-____"} />
  </div>
);

/* ---------- SearchSelect ---------- */
const SearchSelect: React.FC<BuiltinProps> = ({ props }) => {
  const options = (props.custom?.options as string[]) ?? ["北京", "上海", "广州", "深圳", "杭州"];
  return (
    <div className="w-full h-full relative flex items-center">
      <input className="w-full h-full rounded-md border border-gray-300 px-3 text-sm" placeholder={props.text ?? "搜索选择..."} />
      <div className="absolute top-full left-0 right-0 mt-0.5 rounded border border-gray-200 bg-white shadow-md p-0.5 z-10">
        {options.slice(0, 3).map((o, i) => <div key={i} className="px-2 py-1 text-[10px] text-gray-700 rounded hover:bg-indigo-50">{o}</div>)}
      </div>
    </div>
  );
};

/* ---------- EditableField ---------- */
const EditableField: React.FC<BuiltinProps> = ({ props, interactive }) => {
  const [editing, setEditing] = React.useState(false);
  const [val, setVal] = React.useState(props.text ?? "点击编辑");
  return (
    <div className="w-full h-full flex items-center">
      {editing ? (
        <input autoFocus value={val} onChange={(e) => setVal(e.target.value)} onBlur={() => setEditing(false)} onKeyDown={(e) => e.key === "Enter" && setEditing(false)} className="w-full h-full rounded-md border border-indigo-400 px-2 text-sm" />
      ) : (
        <button onClick={() => interactive && setEditing(true)} className="inline-flex items-center gap-1 text-sm text-gray-700 hover:text-indigo-600 border-b border-dashed border-gray-300 transition-colors">{val}<Lucide.Pencil size={12} className="opacity-60" /></button>
      )}
    </div>
  );
};

/* ---------- StrengthMeter ---------- */
const StrengthMeter: React.FC<BuiltinProps> = ({ props }) => {
  const level = Number(props.custom?.level ?? 2);
  const colors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500"];
  const labels = ["弱", "一般", "强", "很强"];
  return (
    <div className="w-full h-full flex flex-col gap-1 justify-center">
      <input type="password" className="w-full h-8 rounded-md border border-gray-300 px-3 text-sm" placeholder={props.text ?? "输入密码"} />
      <div className="flex gap-1">{[0,1,2,3].map(i => <div key={i} className={cn("h-1 flex-1 rounded-full", i < level ? colors[level - 1] : "bg-gray-200")} />)}</div>
      <span className="text-[10px] text-gray-400">密码强度：{labels[level - 1]}</span>
    </div>
  );
};

/* ---------- PinInput ---------- */
const PinInput: React.FC<BuiltinProps> = () => (
  <div className="w-full h-full flex items-center justify-center gap-2">
    {Array.from({ length: 4 }).map((_, i) => <input key={i} maxLength={1} className="w-10 h-12 text-center rounded-lg border-2 border-gray-300 text-lg font-bold font-mono focus:border-indigo-500 outline-none" />)}
  </div>
);

/* ============ Section 容器组件 ============ */

/** 全屏 Section —— 基础全屏布局容器 */
const Section: React.FC<BuiltinProps> = ({ props }) => {
  const bg = (props.custom?.bgColor as string) ?? "#f8fafc";
  const label = props.text ?? "全屏 Section";
  return (
    <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-indigo-300 rounded-xl relative overflow-hidden" style={{ background: bg }}>
      <div className="absolute top-2 left-3 text-[10px] font-semibold text-indigo-400 uppercase tracking-wide">Section</div>
      <span className="text-sm font-medium text-gray-500">{label}</span>
      <span className="text-[10px] text-gray-400 mt-1">预览时全屏展示，其他组件可叠加在其上方</span>
    </div>
  );
};

/** 动画 Section —— 带入场动画的全屏容器 */
const AnimSection: React.FC<BuiltinProps> = ({ props }) => {
  const bg = (props.custom?.bgColor as string) ?? "#eef2ff";
  const anim = (props.custom?.animation as string) ?? "fade-up";
  const label = props.text ?? "动画 Section";
  return (
    <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-indigo-300 rounded-xl relative overflow-hidden" style={{ background: bg }}>
      <div className="absolute top-2 left-3 text-[10px] font-semibold text-indigo-400 uppercase tracking-wide">Anim Section</div>
      <span className="text-sm font-medium text-gray-600">{label}</span>
      <span className="text-[10px] text-indigo-400 mt-1 px-2 py-0.5 bg-indigo-100 rounded-full">入场动画: {anim}</span>
    </div>
  );
};

/** 视差 Section —— 背景视差滚动效果 */
const ParallaxSection: React.FC<BuiltinProps> = ({ props }) => {
  const bg = (props.custom?.bgColor as string) ?? "#1e1b4b";
  const label = props.text ?? "视差 Section";
  return (
    <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-purple-400 rounded-xl relative overflow-hidden" style={{ background: bg }}>
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 30% 40%, #818cf8 0%, transparent 50%), radial-gradient(circle at 70% 60%, #c084fc 0%, transparent 50%)" }} />
      <div className="absolute top-2 left-3 text-[10px] font-semibold text-purple-300 uppercase tracking-wide">Parallax</div>
      <span className="text-sm font-medium text-white relative z-10">{label}</span>
      <span className="text-[10px] text-purple-300 mt-1 relative z-10">滚动时背景产生视差位移</span>
    </div>
  );
};

/** Spline 3D 场景嵌入 */
const SplineEmbed: React.FC<BuiltinProps> = ({ props }) => {
  const url = (props.custom?.splineUrl as string) ?? "";
  if (!url) {
    return (
      <div className="w-full h-full rounded-xl border-2 border-dashed border-teal-300 bg-teal-50 flex flex-col items-center justify-center gap-1.5">
        <Lucide.Box size={22} strokeWidth={1.6} className="text-teal-500" />
        <span className="text-xs font-medium text-teal-600">Spline 3D 场景</span>
        <span className="text-[10px] text-teal-400">在属性面板填入 Spline 场景 URL</span>
      </div>
    );
  }
  return (
    <div className="w-full h-full rounded-xl overflow-hidden">
      <iframe src={url} className="w-full h-full border-0" title="Spline 3D Scene" allow="autoplay" loading="lazy" />
    </div>
  );
};

export const BUILTIN_COMPONENTS: Record<string, React.FC<BuiltinProps>> = {
  Button,
  Input,
  Text,
  Image,
  Card,
  Form,
  Container,
  Badge,
  Link,
  Divider,
  ProgressBar,
  Switch,
  Checkbox,
  Textarea,
  Select,
  Icon,
  Avatar,
  Alert,
  Tabs,
  Accordion,
  Navbar,
  Footer,
  Breadcrumb,
  Pagination,
  RadioGroup,
  Slider,
  Spinner,
  Skeleton,
  StatCard,
  Quote,
  CodeBlock,
  Tag,
  List,
  Table,
  Steps,
  Rating,
  Counter,
  SearchInput,
  PasswordInput,
  Empty,
  Banner,
  Notification,
  Timeline,
  Tooltip,
  Freehand,
  GradientText,
  Highlight,
  Kbd,
  Marquee,
  Carousel,
  TreeView,
  DescriptionList,
  Chart,
  Calendar,
  Modal,
  Drawer,
  Popconfirm,
  Result,
  Watermark,
  Sidebar,
  Menu,
  Dropdown,
  BackTop,
  DatePicker,
  TimePicker,
  ColorPicker,
  FileUpload,
  OTPInput,
  NumberInput,
  RateInput,
  Transfer,
  Cascader,
  AutoComplete,
  TagInput,
  PhoneInput,
  EmailInput,
  URLInput,
  MultiSelect,
  DateRangePicker,
  WeekPicker,
  MonthPicker,
  ImageUpload,
  SignaturePad,
  CaptchaInput,
  AmountInput,
  PercentageInput,
  DualSlider,
  InputGroup,
  ClearableInput,
  VoiceInput,
  RichTextEditor,
  MarkdownEditor,
  CodeEditor,
  JsonEditor,
  ColorSwatch,
  FontPicker,
  IconPicker,
  MaskedInput,
  SearchSelect,
  EditableField,
  StrengthMeter,
  PinInput,
  Section,
  AnimSection,
  ParallaxSection,
  SplineEmbed,
};

export const BUILTIN_DEFS: ComponentDef[] = [
  {
    source: "builtin",
    id: "Button",
    label: "按钮",
    category: "基础",
    propsSchema: [
      { key: "text", label: "文本", type: "string", bucket: "base" },
      { key: "variant", label: "样式", type: "select", options: ["primary", "secondary", "ghost", "danger"], default: "primary", bucket: "custom" },
      { key: "size", label: "尺寸", type: "select", options: ["sm", "md", "lg"], default: "md", bucket: "custom" },
    ],
  },
  {
    source: "builtin",
    id: "Input",
    label: "输入框",
    category: "表单",
    propsSchema: [
      { key: "text", label: "值", type: "string", bucket: "base" },
      { key: "placeholder", label: "占位符", type: "string", bucket: "custom" },
      { key: "editable", label: "可编辑", type: "boolean", default: false, bucket: "custom" },
    ],
  },
  {
    source: "builtin",
    id: "Text",
    label: "文本",
    category: "基础",
    propsSchema: [
      { key: "text", label: "内容", type: "string", bucket: "base" },
      { key: "variant", label: "层级预设", type: "select", options: ["display", "h1", "h2", "h3", "body", "caption"], default: "body", bucket: "custom" },
      { key: "fontSize", label: "字号", type: "number", bucket: "custom" },
      { key: "fontWeight", label: "字重", type: "select", options: ["300", "400", "500", "600", "700", "800", "900"], bucket: "custom" },
      { key: "color", label: "颜色", type: "color", bucket: "custom" },
      { key: "align", label: "对齐", type: "select", options: ["left", "center", "right"], default: "left", bucket: "custom" },
      { key: "letterSpacing", label: "字间距", type: "number", bucket: "custom" },
      { key: "lineHeight", label: "行高", type: "number", bucket: "custom" },
      { key: "italic", label: "斜体", type: "boolean", bucket: "custom" },
      { key: "uppercase", label: "大写", type: "boolean", bucket: "custom" },
      { key: "gradText", label: "渐变文字", type: "boolean", bucket: "custom" },
      { key: "gradFrom", label: "渐变起", type: "color", bucket: "custom" },
      { key: "gradTo", label: "渐变止", type: "color", bucket: "custom" },
      { key: "textShadow", label: "文字阴影", type: "string", bucket: "custom" },
    ],
  },
  {
    source: "builtin",
    id: "Image",
    label: "图片",
    category: "展示",
    propsSchema: [
      { key: "imageSrc", label: "图片路径", type: "image", bucket: "base" },
      { key: "text", label: "Alt 文本", type: "string", bucket: "base" },
    ],
  },
  {
    source: "builtin",
    id: "Card",
    label: "卡片",
    category: "展示",
    propsSchema: [
      { key: "text", label: "标题", type: "string", bucket: "base" },
      { key: "apiUrl", label: "接口地址", type: "string", bucket: "base" },
    ],
  },
  {
    source: "builtin",
    id: "Form",
    label: "表单",
    category: "表单",
    propsSchema: [
      { key: "text", label: "标题", type: "string", bucket: "base" },
      { key: "code", label: "提交逻辑", type: "code", bucket: "base" },
    ],
  },
  {
    source: "builtin",
    id: "Container",
    label: "容器",
    category: "基础",
    propsSchema: [
      { key: "text", label: "占位文本", type: "string", bucket: "base" },
      { key: "showLabel", label: "显示文本", type: "boolean", default: false, bucket: "custom" },
      { key: "bgType", label: "背景类型", type: "select", options: ["transparent", "solid", "gradient", "image", "glass"], default: "transparent", bucket: "custom" },
      { key: "bgColor", label: "背景色", type: "color", bucket: "custom" },
      { key: "gradFrom", label: "渐变起", type: "color", bucket: "custom" },
      { key: "gradTo", label: "渐变止", type: "color", bucket: "custom" },
      { key: "gradAngle", label: "渐变角度", type: "number", default: 135, bucket: "custom" },
      { key: "bgImage", label: "背景图URL", type: "string", bucket: "custom" },
      { key: "radius", label: "圆角", type: "number", bucket: "custom" },
      { key: "padding", label: "内边距", type: "number", bucket: "custom" },
      { key: "opacity", label: "不透明度", type: "number", bucket: "custom" },
      { key: "shadow", label: "阴影", type: "select", options: ["none", "sm", "md", "lg", "xl"], default: "none", bucket: "custom" },
      { key: "shadowColor", label: "阴影色", type: "color", bucket: "custom" },
      { key: "borderWidth", label: "边框宽", type: "number", bucket: "custom" },
      { key: "borderColor", label: "边框色", type: "color", bucket: "custom" },
      { key: "blur", label: "玻璃模糊", type: "number", bucket: "custom" },
    ],
  },
  {
    source: "builtin",
    id: "Badge",
    label: "徽章",
    category: "基础",
    propsSchema: [
      { key: "text", label: "文本", type: "string", bucket: "base" },
      { key: "color", label: "颜色", type: "select", options: ["blue", "green", "red", "yellow", "gray", "purple"], default: "blue", bucket: "custom" },
    ],
  },
  {
    source: "builtin",
    id: "Link",
    label: "链接",
    category: "基础",
    propsSchema: [
      { key: "text", label: "文本", type: "string", bucket: "base" },
      { key: "apiUrl", label: "链接地址", type: "string", bucket: "base" },
    ],
  },
  {
    source: "builtin",
    id: "Divider",
    label: "分割线",
    category: "基础",
    propsSchema: [
      { key: "color", label: "颜色", type: "select", options: ["border-gray-300", "border-gray-200", "border-gray-400", "border-indigo-300", "border-red-300"], default: "border-gray-300", bucket: "custom" },
      { key: "style", label: "样式", type: "select", options: ["solid", "dashed", "dotted"], default: "solid", bucket: "custom" },
    ],
  },
  {
    source: "builtin",
    id: "ProgressBar",
    label: "进度条",
    category: "反馈",
    propsSchema: [
      { key: "progress", label: "进度", type: "number", default: 40, bucket: "custom" },
      { key: "color", label: "颜色", type: "select", options: ["bg-indigo-500", "bg-green-500", "bg-red-500", "bg-yellow-500", "bg-purple-500"], default: "bg-indigo-500", bucket: "custom" },
    ],
  },
  {
    source: "builtin",
    id: "Switch",
    label: "开关",
    category: "表单",
    propsSchema: [
      { key: "text", label: "标签", type: "string", bucket: "base" },
      { key: "checked", label: "是否开启", type: "boolean", default: false, bucket: "custom" },
    ],
  },
  {
    source: "builtin",
    id: "Checkbox",
    label: "复选框",
    category: "表单",
    propsSchema: [
      { key: "text", label: "标签", type: "string", bucket: "base" },
      { key: "checked", label: "是否选中", type: "boolean", default: false, bucket: "custom" },
    ],
  },
  {
    source: "builtin",
    id: "Textarea",
    label: "文本域",
    category: "表单",
    propsSchema: [
      { key: "text", label: "内容", type: "string", bucket: "base" },
      { key: "placeholder", label: "占位符", type: "string", bucket: "custom" },
      { key: "editable", label: "可编辑", type: "boolean", default: false, bucket: "custom" },
    ],
  },
  {
    source: "builtin",
    id: "Select",
    label: "下拉选择",
    category: "表单",
    propsSchema: [
      { key: "text", label: "选中值", type: "string", bucket: "base" },
      { key: "options", label: "选项列表", type: "code", bucket: "custom" },
    ],
  },
  {
    source: "builtin",
    id: "Icon",
    label: "图标",
    category: "基础",
    propsSchema: [
      { key: "iconName", label: "图标", type: "select", options: ["Heart", "Star", "Settings", "Home", "Search", "User", "Mail", "Phone", "Camera", "Music", "Video", "Image", "File", "Folder", "Trash", "Edit", "Copy", "Download", "Upload", "Share", "Bell", "Clock", "Calendar", "Map", "Globe", "Lock", "Unlock", "Eye", "EyeOff", "Sun", "Moon", "Cloud", "Zap", "Fire", "Gift", "Tag", "Bookmark", "Flag", "ThumbsUp", "MessageCircle", "Send", "Link", "Wifi", "Battery", "Volume", "Mic", "Play", "Pause", "SkipForward", "ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "Check", "X", "Plus", "Minus", "AlertTriangle", "Info", "HelpCircle"], default: "Heart", bucket: "custom" },
      { key: "iconSize", label: "尺寸", type: "number", default: 24, bucket: "custom" },
      { key: "iconColor", label: "颜色", type: "select", options: ["text-gray-700", "text-indigo-600", "text-green-600", "text-red-600", "text-purple-600", "text-yellow-500", "text-pink-500", "text-white"], default: "text-gray-700", bucket: "custom" },
    ],
  },
  // 常用图标快捷条目（带预览）
  { source: "builtin", id: "Icon-Heart", label: "心型", category: "图标", propsSchema: [{ key: "iconSize", label: "尺寸", type: "number", default: 24, bucket: "custom" }, { key: "iconColor", label: "颜色", type: "select", options: ["text-red-500", "text-pink-500", "text-gray-700", "text-indigo-600"], default: "text-red-500", bucket: "custom" }] },
  { source: "builtin", id: "Icon-Star", label: "星型", category: "图标", propsSchema: [{ key: "iconSize", label: "尺寸", type: "number", default: 24, bucket: "custom" }, { key: "iconColor", label: "颜色", type: "select", options: ["text-yellow-400", "text-gray-700", "text-indigo-600"], default: "text-yellow-400", bucket: "custom" }] },
  { source: "builtin", id: "Icon-Settings", label: "设置", category: "图标", propsSchema: [{ key: "iconSize", label: "尺寸", type: "number", default: 24, bucket: "custom" }, { key: "iconColor", label: "颜色", type: "select", options: ["text-gray-700", "text-indigo-600", "text-green-600"], default: "text-gray-700", bucket: "custom" }] },
  { source: "builtin", id: "Icon-Home", label: "主页", category: "图标", propsSchema: [{ key: "iconSize", label: "尺寸", type: "number", default: 24, bucket: "custom" }, { key: "iconColor", label: "颜色", type: "select", options: ["text-gray-700", "text-indigo-600"], default: "text-gray-700", bucket: "custom" }] },
  { source: "builtin", id: "Icon-Search", label: "搜索", category: "图标", propsSchema: [{ key: "iconSize", label: "尺寸", type: "number", default: 24, bucket: "custom" }, { key: "iconColor", label: "颜色", type: "select", options: ["text-gray-700", "text-indigo-600"], default: "text-gray-700", bucket: "custom" }] },
  { source: "builtin", id: "Icon-User", label: "用户", category: "图标", propsSchema: [{ key: "iconSize", label: "尺寸", type: "number", default: 24, bucket: "custom" }, { key: "iconColor", label: "颜色", type: "select", options: ["text-gray-700", "text-indigo-600"], default: "text-gray-700", bucket: "custom" }] },
  { source: "builtin", id: "Icon-Bell", label: "通知", category: "图标", propsSchema: [{ key: "iconSize", label: "尺寸", type: "number", default: 24, bucket: "custom" }, { key: "iconColor", label: "颜色", type: "select", options: ["text-gray-700", "text-yellow-500", "text-red-500"], default: "text-gray-700", bucket: "custom" }] },
  { source: "builtin", id: "Icon-Mail", label: "邮件", category: "图标", propsSchema: [{ key: "iconSize", label: "尺寸", type: "number", default: 24, bucket: "custom" }, { key: "iconColor", label: "颜色", type: "select", options: ["text-gray-700", "text-indigo-600"], default: "text-gray-700", bucket: "custom" }] },
  { source: "builtin", id: "Icon-Camera", label: "相机", category: "图标", propsSchema: [{ key: "iconSize", label: "尺寸", type: "number", default: 24, bucket: "custom" }, { key: "iconColor", label: "颜色", type: "select", options: ["text-gray-700", "text-indigo-600"], default: "text-gray-700", bucket: "custom" }] },
  { source: "builtin", id: "Icon-Map", label: "地图", category: "图标", propsSchema: [{ key: "iconSize", label: "尺寸", type: "number", default: 24, bucket: "custom" }, { key: "iconColor", label: "颜色", type: "select", options: ["text-gray-700", "text-green-600"], default: "text-gray-700", bucket: "custom" }] },
  { source: "builtin", id: "Icon-Clock", label: "时钟", category: "图标", propsSchema: [{ key: "iconSize", label: "尺寸", type: "number", default: 24, bucket: "custom" }, { key: "iconColor", label: "颜色", type: "select", options: ["text-gray-700", "text-indigo-600"], default: "text-gray-700", bucket: "custom" }] },
  { source: "builtin", id: "Icon-Zap", label: "闪电", category: "图标", propsSchema: [{ key: "iconSize", label: "尺寸", type: "number", default: 24, bucket: "custom" }, { key: "iconColor", label: "颜色", type: "select", options: ["text-yellow-500", "text-gray-700"], default: "text-yellow-500", bucket: "custom" }] },
  {
    source: "builtin",
    id: "Avatar",
    label: "头像",
    category: "展示",
    propsSchema: [
      { key: "imageSrc", label: "头像地址", type: "image", bucket: "base" },
      { key: "text", label: "占位文字", type: "string", bucket: "base" },
      { key: "avatarSize", label: "尺寸", type: "number", default: 40, bucket: "custom" },
    ],
  },
  {
    source: "builtin",
    id: "Alert",
    label: "警告提示",
    category: "反馈",
    propsSchema: [
      { key: "text", label: "内容", type: "string", bucket: "base" },
      { key: "variant", label: "类型", type: "select", options: ["info", "success", "warning", "error"], default: "info", bucket: "custom" },
    ],
  },
  {
    source: "builtin",
    id: "Tabs",
    label: "标签页",
    category: "导航",
    propsSchema: [
      { key: "tabs", label: "标签列表", type: "code", bucket: "custom" },
    ],
  },
  {
    source: "builtin",
    id: "Accordion",
    label: "折叠面板",
    category: "导航",
    propsSchema: [
      { key: "items", label: "项目列表", type: "code", bucket: "custom" },
    ],
  },
  {
    source: "builtin",
    id: "Navbar",
    label: "导航栏",
    category: "导航",
    propsSchema: [
      { key: "text", label: "Logo", type: "string", bucket: "base" },
      { key: "links", label: "链接列表", type: "code", bucket: "custom" },
    ],
  },
  {
    source: "builtin",
    id: "Footer",
    label: "页脚",
    category: "导航",
    propsSchema: [
      { key: "text", label: "版权文本", type: "string", bucket: "base" },
      { key: "links", label: "链接列表", type: "code", bucket: "custom" },
    ],
  },
  {
    source: "builtin",
    id: "Breadcrumb",
    label: "面包屑",
    category: "导航",
    propsSchema: [
      { key: "items", label: "路径列表", type: "code", bucket: "custom" },
    ],
  },
  {
    source: "builtin",
    id: "Pagination",
    label: "分页",
    category: "导航",
    propsSchema: [
      { key: "total", label: "总页数", type: "number", default: 5, bucket: "custom" },
    ],
  },
  {
    source: "builtin",
    id: "RadioGroup",
    label: "单选组",
    category: "表单",
    propsSchema: [
      { key: "options", label: "选项列表", type: "code", bucket: "custom" },
    ],
  },
  {
    source: "builtin",
    id: "Slider",
    label: "滑块",
    category: "表单",
    propsSchema: [
      { key: "value", label: "当前值", type: "number", default: 50, bucket: "custom" },
      { key: "min", label: "最小值", type: "number", default: 0, bucket: "custom" },
      { key: "max", label: "最大值", type: "number", default: 100, bucket: "custom" },
    ],
  },
  {
    source: "builtin",
    id: "Spinner",
    label: "加载动画",
    category: "反馈",
    propsSchema: [
      { key: "spinnerSize", label: "尺寸", type: "number", default: 24, bucket: "custom" },
      { key: "color", label: "颜色", type: "select", options: ["text-indigo-500", "text-gray-500", "text-green-500", "text-red-500", "text-purple-500"], default: "text-indigo-500", bucket: "custom" },
    ],
  },
  {
    source: "builtin",
    id: "Skeleton",
    label: "骨架屏",
    category: "反馈",
    propsSchema: [
      { key: "lines", label: "行数", type: "number", default: 3, bucket: "custom" },
      { key: "animated", label: "动画", type: "boolean", default: true, bucket: "custom" },
    ],
  },
  {
    source: "builtin",
    id: "StatCard",
    label: "统计卡片",
    category: "展示",
    propsSchema: [
      { key: "statValue", label: "数值", type: "string", bucket: "custom" },
      { key: "statLabel", label: "标签", type: "string", bucket: "custom" },
    ],
  },
  {
    source: "builtin",
    id: "Quote",
    label: "引用",
    category: "展示",
    propsSchema: [
      { key: "text", label: "引用内容", type: "string", bucket: "base" },
    ],
  },
  {
    source: "builtin",
    id: "CodeBlock",
    label: "代码块",
    category: "展示",
    propsSchema: [
      { key: "code", label: "代码", type: "code", bucket: "base" },
    ],
  },
  {
    source: "builtin",
    id: "Tag",
    label: "标签",
    category: "展示",
    propsSchema: [
      { key: "text", label: "文本", type: "string", bucket: "base" },
      { key: "color", label: "颜色", type: "select", options: ["gray", "blue", "green", "red", "orange"], default: "gray", bucket: "custom" },
    ],
  },
  {
    source: "builtin",
    id: "List",
    label: "列表",
    category: "展示",
    propsSchema: [
      { key: "items", label: "列表项", type: "code", bucket: "custom" },
    ],
  },
  {
    source: "builtin",
    id: "Table",
    label: "表格",
    category: "展示",
    propsSchema: [
      { key: "headers", label: "表头", type: "code", bucket: "custom" },
      { key: "rows", label: "数据行", type: "code", bucket: "custom" },
    ],
  },
  {
    source: "builtin",
    id: "Steps",
    label: "步骤条",
    category: "导航",
    propsSchema: [
      { key: "steps", label: "步骤列表", type: "code", bucket: "custom" },
      { key: "current", label: "当前步骤", type: "number", default: 1, bucket: "custom" },
    ],
  },
  {
    source: "builtin",
    id: "Rating",
    label: "评分",
    category: "展示",
    propsSchema: [
      { key: "value", label: "当前值", type: "number", default: 3, bucket: "custom" },
      { key: "max", label: "最大值", type: "number", default: 5, bucket: "custom" },
    ],
  },
  {
    source: "builtin",
    id: "Counter",
    label: "计数器",
    category: "表单",
    propsSchema: [
      { key: "initial", label: "初始值", type: "number", default: 0, bucket: "custom" },
    ],
  },
  {
    source: "builtin",
    id: "SearchInput",
    label: "搜索框",
    category: "表单",
    propsSchema: [
      { key: "text", label: "占位符", type: "string", bucket: "base" },
    ],
  },
  {
    source: "builtin",
    id: "PasswordInput",
    label: "密码框",
    category: "表单",
    propsSchema: [
      { key: "text", label: "占位符", type: "string", bucket: "base" },
    ],
  },
  {
    source: "builtin",
    id: "Empty",
    label: "空状态",
    category: "反馈",
    propsSchema: [
      { key: "text", label: "提示文字", type: "string", bucket: "base" },
    ],
  },
  {
    source: "builtin",
    id: "Banner",
    label: "横幅",
    category: "反馈",
    propsSchema: [
      { key: "text", label: "内容", type: "string", bucket: "base" },
      { key: "variant", label: "类型", type: "select", options: ["info", "success", "warning", "error"], default: "info", bucket: "custom" },
    ],
  },
  {
    source: "builtin",
    id: "Notification",
    label: "通知",
    category: "反馈",
    propsSchema: [
      { key: "text", label: "标题", type: "string", bucket: "base" },
      { key: "variant", label: "类型", type: "select", options: ["info", "success", "warning", "error"], default: "info", bucket: "custom" },
    ],
  },
  {
    source: "builtin",
    id: "Timeline",
    label: "时间线",
    category: "展示",
    propsSchema: [
      { key: "items", label: "时间项", type: "code", bucket: "custom" },
    ],
  },
  {
    source: "builtin",
    id: "Tooltip",
    label: "悬浮提示",
    category: "展示",
    propsSchema: [
      { key: "text", label: "文本", type: "string", bucket: "base" },
      { key: "tip", label: "提示内容", type: "string", bucket: "custom" },
    ],
  },
  {
    source: "builtin",
    id: "Freehand",
    label: "手绘",
    category: "基础",
    subCategory: "通用",
    propsSchema: [
      { key: "strokeColor", label: "颜色", type: "select", options: ["#000000", "#ef4444", "#3b82f6", "#22c55e", "#a855f7", "#f59e0b"], default: "#000000", bucket: "custom" },
      { key: "strokeWidth", label: "粗细", type: "select", options: ["1", "2", "4"], default: "2", bucket: "custom" },
    ],
  },
  // ===== 新增基础组件 =====
  { source: "builtin", id: "GradientText", label: "渐变文字", category: "基础", subCategory: "通用", propsSchema: [{ key: "text", label: "文本", type: "string", bucket: "base" }, { key: "from", label: "起始色", type: "string", default: "#6366f1", bucket: "custom" }, { key: "to", label: "结束色", type: "string", default: "#ec4899", bucket: "custom" }] },
  { source: "builtin", id: "Highlight", label: "高亮文本", category: "基础", subCategory: "通用", propsSchema: [{ key: "text", label: "文本", type: "string", bucket: "base" }, { key: "color", label: "高亮色", type: "select", options: ["bg-yellow-200", "bg-green-200", "bg-blue-200", "bg-pink-200", "bg-purple-200"], default: "bg-yellow-200", bucket: "custom" }] },
  { source: "builtin", id: "Kbd", label: "键盘按键", category: "基础", subCategory: "通用", propsSchema: [{ key: "text", label: "快捷键", type: "string", bucket: "base" }] },
  { source: "builtin", id: "Marquee", label: "跑马灯", category: "基础", subCategory: "通用", propsSchema: [{ key: "text", label: "文本", type: "string", bucket: "base" }] },
  // ===== 新增展示组件 =====
  { source: "builtin", id: "Carousel", label: "轮播", category: "基础", subCategory: "展示", propsSchema: [{ key: "items", label: "幻灯片", type: "code", bucket: "custom" }] },
  { source: "builtin", id: "TreeView", label: "树形控件", category: "基础", subCategory: "展示", propsSchema: [{ key: "items", label: "节点", type: "code", bucket: "custom" }] },
  { source: "builtin", id: "DescriptionList", label: "描述列表", category: "基础", subCategory: "展示", propsSchema: [{ key: "items", label: "键值对", type: "code", bucket: "custom" }] },
  { source: "builtin", id: "Chart", label: "柱状图", category: "基础", subCategory: "展示", propsSchema: [{ key: "data", label: "数据", type: "code", bucket: "custom" }] },
  { source: "builtin", id: "Calendar", label: "日历", category: "基础", subCategory: "展示", propsSchema: [] },
  // ===== 新增反馈组件 =====
  { source: "builtin", id: "Modal", label: "弹窗", category: "基础", subCategory: "反馈", propsSchema: [{ key: "text", label: "标题", type: "string", bucket: "base" }] },
  { source: "builtin", id: "Drawer", label: "抽屉", category: "基础", subCategory: "反馈", propsSchema: [{ key: "text", label: "标题", type: "string", bucket: "base" }] },
  { source: "builtin", id: "Popconfirm", label: "气泡确认", category: "基础", subCategory: "反馈", propsSchema: [{ key: "text", label: "提示", type: "string", bucket: "base" }] },
  { source: "builtin", id: "Result", label: "结果页", category: "基础", subCategory: "反馈", propsSchema: [{ key: "text", label: "标题", type: "string", bucket: "base" }, { key: "status", label: "状态", type: "select", options: ["success", "error", "warning", "info"], default: "success", bucket: "custom" }] },
  { source: "builtin", id: "Watermark", label: "水印", category: "基础", subCategory: "反馈", propsSchema: [{ key: "text", label: "水印文字", type: "string", bucket: "base" }] },
  // ===== 新增导航组件 =====
  { source: "builtin", id: "Sidebar", label: "侧边栏", category: "基础", subCategory: "导航", propsSchema: [{ key: "text", label: "Logo", type: "string", bucket: "base" }, { key: "items", label: "菜单项", type: "code", bucket: "custom" }] },
  { source: "builtin", id: "Menu", label: "菜单", category: "基础", subCategory: "导航", propsSchema: [{ key: "items", label: "菜单项", type: "code", bucket: "custom" }] },
  { source: "builtin", id: "Dropdown", label: "下拉菜单", category: "基础", subCategory: "导航", propsSchema: [{ key: "text", label: "触发文本", type: "string", bucket: "base" }, { key: "items", label: "选项", type: "code", bucket: "custom" }] },
  { source: "builtin", id: "BackTop", label: "返回顶部", category: "基础", subCategory: "导航", propsSchema: [] },
  // ===== 新增表单组件 =====
  { source: "builtin", id: "DatePicker", label: "日期选择", category: "表单", propsSchema: [{ key: "text", label: "默认值", type: "string", bucket: "base" }] },
  { source: "builtin", id: "TimePicker", label: "时间选择", category: "表单", propsSchema: [{ key: "text", label: "默认值", type: "string", bucket: "base" }] },
  { source: "builtin", id: "ColorPicker", label: "颜色选择器", category: "表单", propsSchema: [{ key: "text", label: "标签", type: "string", bucket: "base" }, { key: "color", label: "默认色", type: "string", default: "#6366f1", bucket: "custom" }] },
  { source: "builtin", id: "FileUpload", label: "文件上传", category: "表单", propsSchema: [{ key: "text", label: "提示文字", type: "string", bucket: "base" }] },
  { source: "builtin", id: "OTPInput", label: "验证码输入", category: "表单", propsSchema: [] },
  { source: "builtin", id: "NumberInput", label: "数字输入", category: "表单", propsSchema: [{ key: "text", label: "占位符", type: "string", bucket: "base" }] },
  { source: "builtin", id: "RateInput", label: "评分输入", category: "表单", propsSchema: [{ key: "value", label: "当前值", type: "number", default: 3, bucket: "custom" }] },
  { source: "builtin", id: "Transfer", label: "穿梭框", category: "表单", propsSchema: [] },
  { source: "builtin", id: "Cascader", label: "级联选择", category: "表单", propsSchema: [{ key: "text", label: "占位符", type: "string", bucket: "base" }] },
  { source: "builtin", id: "AutoComplete", label: "自动完成", category: "表单", propsSchema: [{ key: "text", label: "占位符", type: "string", bucket: "base" }] },
  { source: "builtin", id: "TagInput", label: "标签输入", category: "表单", propsSchema: [{ key: "text", label: "占位符", type: "string", bucket: "base" }, { key: "tags", label: "默认标签", type: "code", bucket: "custom" }] },
  { source: "builtin", id: "PhoneInput", label: "电话输入", category: "表单", propsSchema: [{ key: "text", label: "占位符", type: "string", bucket: "base" }] },
  { source: "builtin", id: "EmailInput", label: "邮箱输入", category: "表单", propsSchema: [{ key: "text", label: "占位符", type: "string", bucket: "base" }] },
  { source: "builtin", id: "URLInput", label: "URL输入", category: "表单", propsSchema: [{ key: "text", label: "占位符", type: "string", bucket: "base" }] },
  { source: "builtin", id: "MultiSelect", label: "多选", category: "表单", propsSchema: [{ key: "options", label: "选项", type: "code", bucket: "custom" }] },
  // ===== 新增表单组件（扩充至 50+） =====
  { source: "builtin", id: "DateRangePicker", label: "日期范围", category: "表单", propsSchema: [{ key: "text", label: "默认值", type: "string", bucket: "base" }] },
  { source: "builtin", id: "WeekPicker", label: "周选择", category: "表单", propsSchema: [{ key: "text", label: "默认值", type: "string", bucket: "base" }] },
  { source: "builtin", id: "MonthPicker", label: "月选择", category: "表单", propsSchema: [{ key: "text", label: "默认值", type: "string", bucket: "base" }] },
  { source: "builtin", id: "ImageUpload", label: "图片上传", category: "表单", propsSchema: [{ key: "text", label: "提示文字", type: "string", bucket: "base" }] },
  { source: "builtin", id: "SignaturePad", label: "签名板", category: "表单", propsSchema: [{ key: "text", label: "提示", type: "string", bucket: "base" }] },
  { source: "builtin", id: "CaptchaInput", label: "验证码输入", category: "表单", propsSchema: [{ key: "text", label: "占位符", type: "string", bucket: "base" }] },
  { source: "builtin", id: "AmountInput", label: "金额输入", category: "表单", propsSchema: [{ key: "text", label: "占位符", type: "string", bucket: "base" }] },
  { source: "builtin", id: "PercentageInput", label: "百分比输入", category: "表单", propsSchema: [{ key: "text", label: "占位符", type: "string", bucket: "base" }] },
  { source: "builtin", id: "DualSlider", label: "双滑块", category: "表单", propsSchema: [{ key: "min", label: "最小值", type: "number", default: 0, bucket: "custom" }, { key: "max", label: "最大值", type: "number", default: 100, bucket: "custom" }] },
  { source: "builtin", id: "InputGroup", label: "输入组", category: "表单", propsSchema: [{ key: "text", label: "标签", type: "string", bucket: "base" }] },
  { source: "builtin", id: "ClearableInput", label: "可清除输入", category: "表单", propsSchema: [{ key: "text", label: "占位符", type: "string", bucket: "base" }] },
  { source: "builtin", id: "VoiceInput", label: "语音输入", category: "表单", propsSchema: [{ key: "text", label: "占位符", type: "string", bucket: "base" }] },
  { source: "builtin", id: "RichTextEditor", label: "富文本编辑", category: "表单", propsSchema: [{ key: "text", label: "内容", type: "string", bucket: "base" }] },
  { source: "builtin", id: "MarkdownEditor", label: "MD编辑器", category: "表单", propsSchema: [{ key: "text", label: "内容", type: "string", bucket: "base" }] },
  { source: "builtin", id: "CodeEditor", label: "代码编辑器", category: "表单", propsSchema: [{ key: "text", label: "代码", type: "string", bucket: "base" }] },
  { source: "builtin", id: "JsonEditor", label: "JSON编辑", category: "表单", propsSchema: [{ key: "text", label: "数据", type: "string", bucket: "base" }] },
  { source: "builtin", id: "ColorSwatch", label: "色板", category: "表单", propsSchema: [] },
  { source: "builtin", id: "FontPicker", label: "字体选择", category: "表单", propsSchema: [{ key: "text", label: "默认字体", type: "string", bucket: "base" }] },
  { source: "builtin", id: "IconPicker", label: "图标选择", category: "表单", propsSchema: [] },
  { source: "builtin", id: "MaskedInput", label: "掩码输入", category: "表单", propsSchema: [{ key: "text", label: "掩码格式", type: "string", bucket: "base" }] },
  { source: "builtin", id: "SearchSelect", label: "搜索选择", category: "表单", propsSchema: [{ key: "text", label: "占位符", type: "string", bucket: "base" }, { key: "options", label: "选项", type: "code", bucket: "custom" }] },
  { source: "builtin", id: "EditableField", label: "可编辑字段", category: "表单", propsSchema: [{ key: "text", label: "默认值", type: "string", bucket: "base" }] },
  { source: "builtin", id: "StrengthMeter", label: "密码强度", category: "表单", propsSchema: [{ key: "text", label: "占位符", type: "string", bucket: "base" }, { key: "level", label: "强度等级", type: "number", default: 2, bucket: "custom" }] },
  { source: "builtin", id: "PinInput", label: "PIN输入", category: "表单", propsSchema: [] },
  // Section 容器组件
  { source: "builtin", id: "Section", label: "全屏Section", category: "布局", subCategory: "容器", propsSchema: [
    { key: "text", label: "标题", type: "string", bucket: "base" },
    { key: "bgColor", label: "背景色", type: "string", default: "#f8fafc", bucket: "custom" },
  ] },
  { source: "builtin", id: "AnimSection", label: "动画Section", category: "布局", subCategory: "容器", propsSchema: [
    { key: "text", label: "标题", type: "string", bucket: "base" },
    { key: "bgColor", label: "背景色", type: "string", default: "#eef2ff", bucket: "custom" },
    { key: "animation", label: "入场动画", type: "select", options: ["fade-up", "fade-in", "slide-left", "slide-right", "scale", "flip"], default: "fade-up", bucket: "custom" },
  ] },
  { source: "builtin", id: "ParallaxSection", label: "视差Section", category: "布局", subCategory: "容器", propsSchema: [
    { key: "text", label: "标题", type: "string", bucket: "base" },
    { key: "bgColor", label: "背景色", type: "string", default: "#1e1b4b", bucket: "custom" },
    { key: "speed", label: "视差速度", type: "number", default: 0.5, bucket: "custom" },
  ] },
  { source: "builtin", id: "SplineEmbed", label: "Spline 3D", category: "布局", subCategory: "嵌入", propsSchema: [
    { key: "splineUrl", label: "Spline URL", type: "string", bucket: "custom" },
  ] },
];
