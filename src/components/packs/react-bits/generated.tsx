"use client";
import * as React from "react";
import { motion } from "framer-motion";
import type { ComponentDef } from "@/types/schema";
import type { PackComponentProps } from "./components";

const COLOR_MAP: Record<string, string> = {
  indigo: "#6366f1", pink: "#ec4899", blue: "#3b82f6", green: "#22c55e",
  amber: "#f59e0b", red: "#ef4444", purple: "#8b5cf6", cyan: "#06b6d4",
};
const COLOR_OPTIONS = Object.keys(COLOR_MAP);
function c(props: PackComponentProps) { return COLOR_MAP[(props.color as string) ?? "indigo"] ?? "#6366f1"; }

/* ============ 1. 动画按钮 ============ */
const AnimButton: React.FC<PackComponentProps> = (props) => {
  const color = c(props);
  const anim = (props.anim as string) ?? "pulse";
  const animProps: Record<string, unknown> =
    anim === "bounce" ? { animate: { y: [0, -6, 0] } } :
    anim === "shake" ? { animate: { x: [0, -3, 3, -3, 0] } } :
    anim === "glow" ? { animate: { boxShadow: [`0 0 4px ${color}44`, `0 0 16px ${color}88`, `0 0 4px ${color}44`] } } :
    anim === "rotate" ? { animate: { rotate: [0, 3, -3, 0] } } :
    { animate: { scale: [1, 1.08, 1] } };
  return (
    <div className="w-full h-full flex items-center justify-center">
      <motion.button onClick={props.interactive ? props.onTrigger : undefined} className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ background: color }} transition={{ duration: 1.5, repeat: Infinity }} {...animProps} whileTap={{ scale: 0.95 }}>
        {props.text ?? "按钮"}
      </motion.button>
    </div>
  );
};

/* ============ 2. 动画文字 ============ */
const AnimText: React.FC<PackComponentProps> = (props) => {
  const color = c(props);
  const anim = (props.anim as string) ?? "wave";
  const t = props.text ?? "动画文字";
  const chars = t.split("");
  if (anim === "fade") return <div className="w-full h-full flex items-center justify-center">{chars.map((ch, i) => <motion.span key={i} className="inline-block text-sm font-bold" style={{ color }} animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1.8, delay: i * 0.08, repeat: Infinity }}>{ch === " " ? "\u00A0" : ch}</motion.span>)}</div>;
  if (anim === "spin") return <div className="w-full h-full flex items-center justify-center">{chars.map((ch, i) => <motion.span key={i} className="inline-block text-sm font-bold" style={{ color }} animate={{ rotateY: [0, 360] }} transition={{ duration: 2, delay: i * 0.1, repeat: Infinity, repeatDelay: 1 }}>{ch === " " ? "\u00A0" : ch}</motion.span>)}</div>;
  if (anim === "scale") return <div className="w-full h-full flex items-center justify-center">{chars.map((ch, i) => <motion.span key={i} className="inline-block text-sm font-bold" style={{ color }} animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 1.5, delay: i * 0.07, repeat: Infinity }}>{ch === " " ? "\u00A0" : ch}</motion.span>)}</div>;
  if (anim === "blur") return <div className="w-full h-full flex items-center justify-center">{chars.map((ch, i) => <motion.span key={i} className="inline-block text-sm font-bold" style={{ color }} animate={{ filter: ["blur(0px)", "blur(3px)", "blur(0px)"] }} transition={{ duration: 2, delay: i * 0.05, repeat: Infinity }}>{ch === " " ? "\u00A0" : ch}</motion.span>)}</div>;
  return <div className="w-full h-full flex items-center justify-center">{chars.map((ch, i) => <motion.span key={i} className="inline-block text-sm font-bold" style={{ color }} animate={{ y: [0, -8, 0] }} transition={{ duration: 1.5, delay: i * 0.06, repeat: Infinity }}>{ch === " " ? "\u00A0" : ch}</motion.span>)}</div>;
};

/* ============ 3. 动画卡片 ============ */
const AnimCard: React.FC<PackComponentProps> = (props) => {
  const color = c(props);
  const anim = (props.anim as string) ?? "float";
  const animProps: Record<string, unknown> =
    anim === "tilt" ? { animate: { rotateZ: [-1, 1, -1] } } :
    anim === "breathe" ? { animate: { scale: [1, 1.03, 1] } } :
    anim === "shadow" ? { animate: { boxShadow: [`0 4px 12px ${color}22`, `0 8px 24px ${color}44`, `0 4px 12px ${color}22`] } } :
    { animate: { y: [0, -8, 0] } };
  return (
    <div className="w-full h-full flex items-center justify-center p-2">
      <motion.div className="w-full h-full rounded-xl border flex items-center justify-center" style={{ borderColor: `${color}44`, background: `${color}08` }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }} {...animProps}>
        <span className="text-xs font-medium" style={{ color }}>{props.text ?? "卡片"}</span>
      </motion.div>
    </div>
  );
};

/* ============ 4. 加载器 ============ */
const AnimLoader: React.FC<PackComponentProps> = (props) => {
  const color = c(props);
  const anim = (props.anim as string) ?? "spin";
  if (anim === "dots") return <div className="w-full h-full flex items-center justify-center gap-1.5">{[0,1,2].map(i => <motion.span key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: color }} animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }} />)}</div>;
  if (anim === "bar") return <div className="w-full h-full flex items-center justify-center px-4"><motion.div className="h-1.5 rounded-full w-full" style={{ background: color }} animate={{ scaleX: [0.2, 1, 0.2], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }} /></div>;
  if (anim === "ring") return <div className="w-full h-full flex items-center justify-center"><motion.div className="w-8 h-8 rounded-full border-2" style={{ borderColor: `${color}33`, borderTopColor: color, borderBottomColor: color }} animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} /></div>;
  if (anim === "equalizer") return <div className="w-full h-full flex items-center justify-center">{[0,1,2,3].map(i => <motion.span key={i} className="w-1.5 h-4 rounded-full mx-0.5" style={{ background: color }} animate={{ scaleY: [1, 2, 1] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }} />)}</div>;
  return <div className="w-full h-full flex items-center justify-center"><motion.div className="w-8 h-8 rounded-full border-2 border-gray-200" style={{ borderTopColor: color }} animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} /></div>;
};

/* ============ 5. 粒子背景 ============ */
const AnimBg: React.FC<PackComponentProps> = (props) => {
  const color = c(props);
  const anim = (props.anim as string) ?? "particles";
  if (anim === "gradient") return <div className="relative w-full h-full overflow-hidden rounded-xl flex items-center justify-center" style={{background:`linear-gradient(135deg, ${color}, ${color}88, ${color}44)`}}><motion.div className="absolute inset-0" style={{background:`linear-gradient(45deg, transparent, ${color}44, transparent)`}} animate={{x:["-100%","100%"]}} transition={{duration:2,repeat:Infinity,ease:"linear"}} /><span className="relative z-10 text-xs font-bold text-white">{props.text ?? "背景"}</span></div>;
  if (anim === "waves") return <div className="relative w-full h-full overflow-hidden rounded-xl bg-gray-900 flex items-center justify-center">{[0,1,2].map(i=><motion.div key={i} className="absolute bottom-0 left-0 right-0 h-1/3 rounded-t-full" style={{background:`${color}${["22","33","44"][i]}`}} animate={{y:[0,-6,0]}} transition={{duration:2+i,repeat:Infinity,ease:"easeInOut"}} />)}<span className="relative z-10 text-xs font-bold text-white">{props.text ?? "背景"}</span></div>;
  if (anim === "stars") return <div className="relative w-full h-full overflow-hidden rounded-xl bg-gray-950 flex items-center justify-center">{Array.from({length:12}).map((_,i)=><motion.span key={i} className="absolute w-0.5 h-0.5 rounded-full bg-white" style={{left:`${(i*8+5)%100}%`,top:`${(i*13+10)%100}%`}} animate={{opacity:[0.1,1,0.1],scale:[0.5,1.2,0.5]}} transition={{duration:2+(i%3),repeat:Infinity,delay:i*0.3}} />)}<span className="relative z-10 text-xs font-bold text-white">{props.text ?? "背景"}</span></div>;
  if (anim === "pulse") return <div className="relative w-full h-full overflow-hidden rounded-xl flex items-center justify-center" style={{background:`radial-gradient(circle at 50% 50%, ${color}22, #111827)`}}><motion.div className="absolute w-20 h-20 rounded-full" style={{background:`${color}22`,filter:"blur(20px)"}} animate={{scale:[1,1.5,1],opacity:[0.3,0.6,0.3]}} transition={{duration:3,repeat:Infinity}} /><span className="relative z-10 text-xs font-bold text-white">{props.text ?? "背景"}</span></div>;
  return <div className="relative w-full h-full overflow-hidden rounded-xl bg-gray-900 flex items-center justify-center">{Array.from({length:15}).map((_,i)=><motion.span key={i} className="absolute w-1 h-1 rounded-full" style={{background:color,left:`${(i*7+3)%100}%`,top:`${(i*11+5)%100}%`}} animate={{y:[0,-15,0],opacity:[0.2,0.8,0.2]}} transition={{duration:2+(i%3),repeat:Infinity,delay:i*0.2}} />)}<span className="relative z-10 text-xs font-bold text-white">{props.text ?? "背景"}</span></div>;
};

/* ============ 6. 动画徽章 ============ */
const AnimBadge: React.FC<PackComponentProps> = (props) => {
  const color = c(props);
  const anim = (props.anim as string) ?? "pulse";
  const animProps: Record<string, unknown> =
    anim === "bounce" ? { animate: { y: [0, -4, 0] } } :
    anim === "glow" ? { animate: { boxShadow: [`0 0 2px ${color}44`, `0 0 10px ${color}66`, `0 0 2px ${color}44`] } } :
    anim === "fade" ? { animate: { opacity: [0.7, 1, 0.7] } } :
    { animate: { scale: [1, 1.1, 1] } };
  return (
    <div className="w-full h-full flex items-center justify-center">
      <motion.span className="px-2.5 py-1 rounded-full text-[10px] font-semibold text-white" style={{ background: color }} transition={{ duration: 1.5, repeat: Infinity }} {...animProps}>{props.text ?? "徽章"}</motion.span>
    </div>
  );
};

/* ============ 导出 ============ */
const colorField = { key: "color", label: "颜色", type: "select" as const, options: COLOR_OPTIONS, default: "indigo", bucket: "custom" as const };
const animField = (options: string[], def: string) => ({ key: "anim", label: "动画", type: "select" as const, options, default: def, bucket: "custom" as const });
const textField = { key: "text", label: "文本", type: "string" as const, bucket: "base" as const };

export const generatedRBDefs: ComponentDef[] = [
  { source: "pack", id: "rb-anim-button", label: "动画按钮", category: "React Bits", pack: "react-bits", propsSchema: [textField, colorField, animField(["pulse","bounce","shake","glow","rotate"], "pulse")] },
  { source: "pack", id: "rb-anim-text", label: "动画文字", category: "React Bits", pack: "react-bits", propsSchema: [textField, colorField, animField(["wave","fade","spin","scale","blur"], "wave")] },
  { source: "pack", id: "rb-anim-card", label: "动画卡片", category: "React Bits", pack: "react-bits", propsSchema: [textField, colorField, animField(["float","tilt","breathe","shadow"], "float")] },
  { source: "pack", id: "rb-anim-loader", label: "动画加载器", category: "React Bits", pack: "react-bits", propsSchema: [colorField, animField(["spin","dots","bar","ring","equalizer"], "spin")] },
  { source: "pack", id: "rb-anim-bg", label: "动画背景", category: "React Bits", pack: "react-bits", propsSchema: [textField, colorField, animField(["particles","gradient","waves","stars","pulse"], "particles")] },
  { source: "pack", id: "rb-anim-badge", label: "动画徽章", category: "React Bits", pack: "react-bits", propsSchema: [textField, colorField, animField(["pulse","bounce","glow","fade"], "pulse")] },
];

export const generatedRBComponents: Record<string, React.FC<PackComponentProps>> = {
  "rb-anim-button": AnimButton,
  "rb-anim-text": AnimText,
  "rb-anim-card": AnimCard,
  "rb-anim-loader": AnimLoader,
  "rb-anim-bg": AnimBg,
  "rb-anim-badge": AnimBadge,
};
