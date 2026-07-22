"use client";
import * as React from "react";
import { motion } from "framer-motion";
import type { ComponentDef } from "@/types/schema";
import type { PackComponentProps } from "../react-bits/components";

const COLOR_MAP: Record<string, string> = {
  indigo: "#6366f1", pink: "#ec4899", blue: "#3b82f6", green: "#22c55e",
  amber: "#f59e0b", red: "#ef4444", purple: "#8b5cf6", cyan: "#06b6d4",
};
const COLOR_OPTIONS = Object.keys(COLOR_MAP);
function c(props: PackComponentProps) { return COLOR_MAP[(props.color as string) ?? "indigo"] ?? "#6366f1"; }

/* ============ 1. 光束背景 ============ */
const BeamBg: React.FC<PackComponentProps> = (props) => {
  const color = c(props);
  const count = 10;
  return (
    <div className="relative w-full h-full overflow-hidden rounded-xl bg-slate-950 flex items-center justify-center">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div key={i} className="absolute" style={{ left: "50%", top: "50%", width: 1, height: 60 + i * 10, background: `linear-gradient(to bottom, transparent, ${color})`, transformOrigin: "top center", transform: `rotate(${(i / count) * 360}deg)` }} animate={{ opacity: [0, 0.8, 0] }} transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.25 }} />
      ))}
      <span className="relative z-10 text-xs font-bold text-white">{props.text ?? "光束"}</span>
    </div>
  );
};

/* ============ 2. 发光边框 ============ */
const GlowBorder: React.FC<PackComponentProps> = (props) => {
  const color = c(props);
  return (
    <div className="w-full h-full flex items-center justify-center p-1">
      <motion.button onClick={props.interactive ? props.onTrigger : undefined} className="w-full h-full flex items-center justify-center text-xs font-medium text-white rounded-lg" style={{ background: `linear-gradient(135deg, ${color}, ${color}88)` }} animate={{ boxShadow: [`0 0 5px ${color}44`, `0 0 20px ${color}88`, `0 0 5px ${color}44`] }} transition={{ duration: 2, repeat: Infinity }}>{props.text ?? "发光"}</motion.button>
    </div>
  );
};

/* ============ 3. 聚光灯卡片 ============ */
const SpotCard: React.FC<PackComponentProps> = (props) => {
  const color = c(props);
  const ref = React.useRef<HTMLDivElement>(null);
  const [pos, setPos] = React.useState({ x: 0, y: 0 });
  return (
    <div ref={ref} onMouseMove={(e) => { const r = ref.current!.getBoundingClientRect(); setPos({ x: e.clientX - r.left, y: e.clientY - r.top }); }} className="relative w-full h-full overflow-hidden rounded-xl border border-gray-700 bg-gray-900 flex items-center justify-center">
      <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(250px circle at ${pos.x}px ${pos.y}px, ${color}33, transparent 70%)` }} />
      <span className="relative z-10 text-xs font-medium text-white">{props.text ?? "聚光灯"}</span>
    </div>
  );
};

/* ============ 4. 流星 ============ */
const Meteors: React.FC<PackComponentProps> = (props) => {
  const color = c(props);
  return (
    <div className="relative w-full h-full overflow-hidden rounded-xl bg-slate-950 flex items-center justify-center">
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.span key={i} className="absolute h-px w-10 rounded-full" style={{ background: `linear-gradient(to right, ${color}, transparent)`, top: `${10 + i * 12}%`, left: "-10%" }} animate={{ x: ["0%", "300%"], opacity: [0, 1, 0] }} transition={{ duration: 1.5 + i * 0.3, repeat: Infinity, delay: i * 0.6 }} />
      ))}
      <span className="relative z-10 text-xs font-bold text-white">{props.text ?? "流星"}</span>
    </div>
  );
};

/* ============ 5. 文字渐显 ============ */
const TextFade: React.FC<PackComponentProps> = (props) => {
  const color = c(props);
  const words = (props.text ?? "渐显效果").split("");
  return (
    <div className="w-full h-full flex items-center justify-center flex-wrap gap-x-0.5">
      {words.map((w, i) => (
        <motion.span key={i} initial={{ opacity: 0, filter: "blur(8px)" }} animate={{ opacity: 1, filter: "blur(0px)" }} transition={{ delay: i * 0.1, duration: 0.5 }} className="text-xs font-semibold" style={{ color }}>{w}</motion.span>
      ))}
    </div>
  );
};

/* ============ 6. 旋转边框 ============ */
const SpinBorder: React.FC<PackComponentProps> = (props) => {
  const color = c(props);
  return (
    <div className="w-full h-full flex items-center justify-center p-1">
      <div className="relative w-full h-full rounded-full overflow-hidden">
        <motion.div className="absolute inset-0" style={{ background: `conic-gradient(from 0deg, transparent, ${color}, transparent 60%)` }} animate={{ rotate: 360 }} transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }} />
        <button onClick={props.interactive ? props.onTrigger : undefined} className="absolute inset-px rounded-full bg-slate-950 flex items-center justify-center text-xs text-white font-medium">{props.text ?? "旋转"}</button>
      </div>
    </div>
  );
};

/* ============ 7. 脉冲环 ============ */
const PulseRing: React.FC<PackComponentProps> = (props) => {
  const color = c(props);
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="relative">
        {[0,1,2].map(i => <motion.div key={i} className="absolute rounded-full border" style={{ width: 32, height: 32, borderColor: color, inset: 0 }} animate={{ scale: [1, 2 + i * 0.4], opacity: [0.6, 0] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }} />)}
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: color }}><span className="text-[8px] text-white font-bold">{props.text ?? "•"}</span></div>
      </div>
    </div>
  );
};

/* ============ 8. 霓虹文字 ============ */
const NeonText: React.FC<PackComponentProps> = (props) => {
  const color = c(props);
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-950 rounded-lg">
      <motion.span className="text-sm font-bold" style={{ color }} animate={{ textShadow: [`0 0 4px ${color}, 0 0 8px ${color}`, `0 0 12px ${color}, 0 0 24px ${color}`, `0 0 4px ${color}, 0 0 8px ${color}`] }} transition={{ duration: 2, repeat: Infinity }}>{props.text ?? "Neon"}</motion.span>
    </div>
  );
};

/* ============ 导出 ============ */
const colorField = { key: "color", label: "颜色", type: "select" as const, options: COLOR_OPTIONS, default: "indigo", bucket: "custom" as const };
const textField = { key: "text", label: "文本", type: "string" as const, bucket: "base" as const };

export const generatedACDefs: ComponentDef[] = [
  { source: "pack", id: "ac-beam-bg", label: "光束背景", category: "Aceternity UI", pack: "aceternity", propsSchema: [textField, colorField] },
  { source: "pack", id: "ac-glow-border", label: "发光边框", category: "Aceternity UI", pack: "aceternity", propsSchema: [textField, colorField] },
  { source: "pack", id: "ac-spot-card", label: "聚光灯卡片", category: "Aceternity UI", pack: "aceternity", propsSchema: [textField, colorField] },
  { source: "pack", id: "ac-meteors", label: "流星效果", category: "Aceternity UI", pack: "aceternity", propsSchema: [textField, colorField] },
  { source: "pack", id: "ac-text-fade", label: "文字渐显", category: "Aceternity UI", pack: "aceternity", propsSchema: [textField, colorField] },
  { source: "pack", id: "ac-spin-border", label: "旋转边框", category: "Aceternity UI", pack: "aceternity", propsSchema: [textField, colorField] },
  { source: "pack", id: "ac-pulse-ring", label: "脉冲环", category: "Aceternity UI", pack: "aceternity", propsSchema: [textField, colorField] },
  { source: "pack", id: "ac-neon-text", label: "霓虹文字", category: "Aceternity UI", pack: "aceternity", propsSchema: [textField, colorField] },
];

export const generatedACComponents: Record<string, React.FC<PackComponentProps>> = {
  "ac-beam-bg": BeamBg,
  "ac-glow-border": GlowBorder,
  "ac-spot-card": SpotCard,
  "ac-meteors": Meteors,
  "ac-text-fade": TextFade,
  "ac-spin-border": SpinBorder,
  "ac-pulse-ring": PulseRing,
  "ac-neon-text": NeonText,
};
