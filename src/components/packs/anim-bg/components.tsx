"use client";
import * as React from "react";
import { motion } from "framer-motion";
import type { PackComponentProps } from "../react-bits/components";

/* ============ 1. 流动渐变 ============ */
const GradientFlow: React.FC<PackComponentProps> = (props) => (
  <div className="relative w-full h-full overflow-hidden rounded-xl">
    <motion.div className="absolute inset-0" style={{ background: "linear-gradient(45deg, #6366f1, #ec4899, #f59e0b, #22c55e)", backgroundSize: "400% 400%" }} animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} />
    <div className="absolute inset-0 flex items-center justify-center"><span className="text-xs font-bold text-white drop-shadow">{props.text ?? "Gradient Flow"}</span></div>
  </div>
);

/* ============ 2. 星空 ============ */
const Starfield: React.FC<PackComponentProps> = (props) => (
  <div className="relative w-full h-full overflow-hidden rounded-xl bg-gray-950 flex items-center justify-center">
    {Array.from({ length: 30 }).map((_, i) => (
      <motion.span key={i} className="absolute w-px h-px rounded-full bg-white" style={{ left: `${(i * 13 + 3) % 100}%`, top: `${(i * 17 + 7) % 100}%` }} animate={{ opacity: [0.1, 0.8, 0.1], scale: [0.5, 1.2, 0.5] }} transition={{ duration: 2 + (i % 4), repeat: Infinity, delay: i * 0.15 }} />
    ))}
    <span className="relative z-10 text-xs font-bold text-white">{props.text ?? "Starfield"}</span>
  </div>
);

/* ============ 3. 海浪 ============ */
const OceanWaves: React.FC<PackComponentProps> = (props) => (
  <div className="relative w-full h-full overflow-hidden rounded-xl bg-blue-950 flex items-center justify-center">
    {[0, 1, 2].map((i) => (
      <motion.div key={i} className="absolute bottom-0 left-0 right-0 rounded-t-full" style={{ height: `${25 + i * 10}%`, background: `rgba(59,130,246,${0.15 + i * 0.1})` }} animate={{ y: [0, -6 - i * 3, 0] }} transition={{ duration: 3 + i, repeat: Infinity, ease: "easeInOut" }} />
    ))}
    <span className="relative z-10 text-xs font-bold text-white">{props.text ?? "Ocean"}</span>
  </div>
);

/* ============ 4. 萤火虫 ============ */
const Fireflies: React.FC<PackComponentProps> = (props) => (
  <div className="relative w-full h-full overflow-hidden rounded-xl bg-gray-950 flex items-center justify-center">
    {Array.from({ length: 12 }).map((_, i) => (
      <motion.span key={i} className="absolute w-1.5 h-1.5 rounded-full bg-yellow-300" style={{ left: `${(i * 23 + 5) % 90}%`, top: `${(i * 19 + 10) % 80}%`, filter: "blur(0.5px)" }} animate={{ opacity: [0, 1, 0], x: [0, (i % 3 - 1) * 15, 0], y: [0, (i % 2 - 0.5) * 10, 0] }} transition={{ duration: 3 + (i % 3), repeat: Infinity, delay: i * 0.3 }} />
    ))}
    <span className="relative z-10 text-xs font-bold text-white">{props.text ?? "Fireflies"}</span>
  </div>
);

/* ============ 5. 极光 ============ */
const NorthernLights: React.FC<PackComponentProps> = (props) => (
  <div className="relative w-full h-full overflow-hidden rounded-xl bg-gray-950 flex items-center justify-center">
    <motion.div className="absolute w-40 h-20 blur-2xl opacity-40 rounded-full" style={{ background: "linear-gradient(90deg, #22c55e, #06b6d4)", top: "10%", left: "10%" }} animate={{ x: [0, 40, -20, 0], skewX: [0, 5, -5, 0] }} transition={{ duration: 10, repeat: Infinity }} />
    <motion.div className="absolute w-32 h-16 blur-2xl opacity-30 rounded-full" style={{ background: "linear-gradient(90deg, #8b5cf6, #ec4899)", top: "30%", right: "10%" }} animate={{ x: [0, -30, 20, 0], skewX: [0, -5, 5, 0] }} transition={{ duration: 8, repeat: Infinity }} />
    <span className="relative z-10 text-xs font-bold text-white">{props.text ?? "Aurora"}</span>
  </div>
);

/* ============ 6. 气泡 ============ */
const Bubbles: React.FC<PackComponentProps> = (props) => (
  <div className="relative w-full h-full overflow-hidden rounded-xl bg-blue-950 flex items-center justify-center">
    {Array.from({ length: 10 }).map((_, i) => (
      <motion.span key={i} className="absolute rounded-full border border-blue-400/30" style={{ width: 8 + (i % 4) * 6, height: 8 + (i % 4) * 6, left: `${(i * 19 + 5) % 90}%`, bottom: "-10%" }} animate={{ y: [0, -120], opacity: [0.6, 0] }} transition={{ duration: 4 + (i % 3), repeat: Infinity, delay: i * 0.5 }} />
    ))}
    <span className="relative z-10 text-xs font-bold text-white">{props.text ?? "Bubbles"}</span>
  </div>
);

/* ============ 7. 矩阵雨 ============ */
const MatrixRain: React.FC<PackComponentProps> = (props) => (
  <div className="relative w-full h-full overflow-hidden rounded-xl bg-black flex items-center justify-center">
    {Array.from({ length: 12 }).map((_, i) => (
      <motion.span key={i} className="absolute text-green-500 font-mono text-[8px] [writing-mode:vertical-lr]" style={{ left: `${(i * 8 + 3) % 95}%`, top: "-20%" }} animate={{ y: ["0%", "500%"] }} transition={{ duration: 2 + (i % 3), repeat: Infinity, delay: i * 0.2, ease: "linear" }}>
        {String.fromCharCode(0x30A0 + Math.random() * 96)}
      </motion.span>
    ))}
    <span className="relative z-10 text-xs font-bold text-green-400">{props.text ?? "Matrix"}</span>
  </div>
);

/* ============ 8. 烟雾 ============ */
const Smoke: React.FC<PackComponentProps> = (props) => (
  <div className="relative w-full h-full overflow-hidden rounded-xl bg-gray-900 flex items-center justify-center">
    {[0, 1, 2, 3].map((i) => (
      <motion.div key={i} className="absolute w-16 h-16 rounded-full bg-gray-500/10 blur-xl" style={{ left: `${20 + i * 15}%`, bottom: "20%" }} animate={{ y: [0, -40], scale: [1, 2], opacity: [0.3, 0] }} transition={{ duration: 4, repeat: Infinity, delay: i * 0.8 }} />
    ))}
    <span className="relative z-10 text-xs font-bold text-white">{props.text ?? "Smoke"}</span>
  </div>
);

/* ============ 9. 彩虹波浪 ============ */
const RainbowWave: React.FC<PackComponentProps> = (props) => (
  <div className="relative w-full h-full overflow-hidden rounded-xl bg-gray-950 flex items-center justify-center">
    {["#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#8b5cf6"].map((c, i) => (
      <motion.div key={i} className="absolute bottom-0 left-0 right-0 h-1/4 rounded-t-full opacity-30" style={{ background: c }} animate={{ y: [0, -5 - i * 2, 0] }} transition={{ duration: 2 + i * 0.3, repeat: Infinity, ease: "easeInOut" }} />
    ))}
    <span className="relative z-10 text-xs font-bold text-white">{props.text ?? "Rainbow"}</span>
  </div>
);

/* ============ 10. 脉冲网格 ============ */
const PulseGrid: React.FC<PackComponentProps> = (props) => (
  <div className="relative w-full h-full overflow-hidden rounded-xl bg-gray-950 flex items-center justify-center">
    <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 gap-px p-2 opacity-40">
      {Array.from({ length: 24 }).map((_, i) => (
        <motion.div key={i} className="rounded-sm bg-blue-500" animate={{ opacity: [0.1, 0.6, 0.1] }} transition={{ duration: 2, repeat: Infinity, delay: (i % 6 + Math.floor(i / 6)) * 0.15 }} />
      ))}
    </div>
    <span className="relative z-10 text-xs font-bold text-white">{props.text ?? "Pulse Grid"}</span>
  </div>
);

/* ============ 11. 流星雨 ============ */
const MeteorShower: React.FC<PackComponentProps> = (props) => (
  <div className="relative w-full h-full overflow-hidden rounded-xl bg-gray-950 flex items-center justify-center">
    {Array.from({ length: 8 }).map((_, i) => (
      <motion.div key={i} className="absolute h-px w-12" style={{ background: "linear-gradient(to right, rgba(255,255,255,0.8), transparent)", top: `${(i * 12 + 5) % 80}%`, left: "-15%" }} animate={{ x: ["0%", "400%"], opacity: [0, 1, 0] }} transition={{ duration: 1.5 + (i % 3) * 0.5, repeat: Infinity, delay: i * 0.7 }} />
    ))}
    <span className="relative z-10 text-xs font-bold text-white">{props.text ?? "Meteors"}</span>
  </div>
);

/* ============ 12. 熔岩灯 ============ */
const LavaLamp: React.FC<PackComponentProps> = (props) => (
  <div className="relative w-full h-full overflow-hidden rounded-xl bg-purple-950 flex items-center justify-center">
    {[0, 1, 2, 3].map((i) => (
      <motion.div key={i} className="absolute rounded-full blur-md" style={{ width: 20 + i * 8, height: 20 + i * 8, background: i % 2 === 0 ? "#ec4899" : "#8b5cf6", left: `${15 + i * 20}%` }} animate={{ y: [0, -30, 0], scale: [1, 1.3, 1] }} transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut" }} />
    ))}
    <span className="relative z-10 text-xs font-bold text-white">{props.text ?? "Lava"}</span>
  </div>
);

/* ============ 13. 雪花 ============ */
const Snowfall: React.FC<PackComponentProps> = (props) => (
  <div className="relative w-full h-full overflow-hidden rounded-xl bg-blue-950 flex items-center justify-center">
    {Array.from({ length: 15 }).map((_, i) => (
      <motion.span key={i} className="absolute text-white/60 text-[8px]" style={{ left: `${(i * 17 + 3) % 95}%`, top: "-5%" }} animate={{ y: ["0%", "600%"], x: [0, (i % 3 - 1) * 10] }} transition={{ duration: 4 + (i % 4), repeat: Infinity, delay: i * 0.3, ease: "linear" }}>❄</motion.span>
    ))}
    <span className="relative z-10 text-xs font-bold text-white">{props.text ?? "Snow"}</span>
  </div>
);

/* ============ 14. 赛博网格 ============ */
const CyberGrid: React.FC<PackComponentProps> = (props) => (
  <div className="relative w-full h-full overflow-hidden rounded-xl bg-black flex items-center justify-center">
    <div className="absolute inset-0" style={{ perspective: "150px" }}>
      <motion.div className="absolute inset-0 origin-bottom" style={{ transform: "rotateX(55deg)", backgroundImage: "linear-gradient(#06b6d444 1px, transparent 1px), linear-gradient(90deg, #06b6d444 1px, transparent 1px)", backgroundSize: "16px 16px" }} animate={{ backgroundPositionY: ["0px", "16px"] }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
    </div>
    <motion.div className="absolute bottom-0 left-0 right-0 h-1/2" style={{ background: "linear-gradient(to top, #06b6d422, transparent)" }} animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 3, repeat: Infinity }} />
    <span className="relative z-10 text-xs font-bold text-cyan-400">{props.text ?? "Cyber"}</span>
  </div>
);

/* ============ 15. 日落渐变 ============ */
const SunsetGradient: React.FC<PackComponentProps> = (props) => (
  <div className="relative w-full h-full overflow-hidden rounded-xl flex items-center justify-center">
    <motion.div className="absolute inset-0" style={{ background: "linear-gradient(180deg, #1e1b4b, #7c3aed, #f97316, #fbbf24)" }} animate={{ opacity: [0.8, 1, 0.8] }} transition={{ duration: 5, repeat: Infinity }} />
    <motion.div className="absolute w-12 h-12 rounded-full bg-yellow-400 blur-sm" style={{ bottom: "25%" }} animate={{ y: [0, -5, 0] }} transition={{ duration: 4, repeat: Infinity }} />
    <span className="relative z-10 text-xs font-bold text-white drop-shadow">{props.text ?? "Sunset"}</span>
  </div>
);

/* ============ 16. 星云 ============ */
const Nebula: React.FC<PackComponentProps> = (props) => (
  <div className="relative w-full h-full overflow-hidden rounded-xl bg-gray-950 flex items-center justify-center">
    <motion.div className="absolute w-32 h-32 rounded-full blur-3xl opacity-40" style={{ background: "radial-gradient(circle, #8b5cf6, transparent)", top: "10%", left: "20%" }} animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 6, repeat: Infinity }} />
    <motion.div className="absolute w-24 h-24 rounded-full blur-2xl opacity-30" style={{ background: "radial-gradient(circle, #ec4899, transparent)", bottom: "15%", right: "15%" }} animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 5, repeat: Infinity }} />
    {Array.from({ length: 15 }).map((_, i) => <motion.span key={i} className="absolute w-px h-px bg-white rounded-full" style={{ left: `${(i * 17 + 5) % 95}%`, top: `${(i * 13 + 8) % 90}%` }} animate={{ opacity: [0.2, 0.8, 0.2] }} transition={{ duration: 2 + (i % 3), repeat: Infinity, delay: i * 0.2 }} />)}
    <span className="relative z-10 text-xs font-bold text-white">{props.text ?? "Nebula"}</span>
  </div>
);

/* ============ 17. 几何流动 ============ */
const GeometricFlow: React.FC<PackComponentProps> = () => (
  <div className="relative w-full h-full overflow-hidden rounded-xl bg-gray-950 flex items-center justify-center">
    {Array.from({ length: 6 }).map((_, i) => (
      <motion.div key={i} className="absolute border border-cyan-500/30" style={{ width: 20 + i * 12, height: 20 + i * 12, borderRadius: i % 2 === 0 ? "50%" : "4px" }} animate={{ rotate: 360, scale: [1, 1.1, 1] }} transition={{ duration: 8 + i * 2, repeat: Infinity, ease: "linear" }} />
    ))}
  </div>
);

/* ============ 18. 极光帷幕 ============ */
const AuroraCurtain: React.FC<PackComponentProps> = () => (
  <div className="relative w-full h-full overflow-hidden rounded-xl bg-gray-950 flex items-center justify-center">
    {[0, 1, 2, 3].map((i) => (
      <motion.div key={i} className="absolute top-0 h-full w-8 blur-md opacity-30" style={{ left: `${15 + i * 20}%`, background: `linear-gradient(180deg, ${["#22c55e", "#06b6d4", "#8b5cf6", "#ec4899"][i]}, transparent)` }} animate={{ skewX: [0, 10, -10, 0], opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 4 + i, repeat: Infinity }} />
    ))}
  </div>
);

/* ============ 19. 粒子网络 ============ */
const ParticleNetwork: React.FC<PackComponentProps> = () => {
  const nodes = React.useMemo(() => Array.from({ length: 8 }).map((_, i) => ({ x: 15 + (i * 23) % 70, y: 15 + (i * 19) % 70 })), []);
  return (
    <div className="relative w-full h-full overflow-hidden rounded-xl bg-gray-950 flex items-center justify-center">
      <svg className="absolute inset-0 w-full h-full opacity-20">
        {nodes.map((n, i) => nodes.slice(i + 1).map((m, j) => (
          <line key={`${i}-${j}`} x1={`${n.x}%`} y1={`${n.y}%`} x2={`${m.x}%`} y2={`${m.y}%`} stroke="#06b6d4" strokeWidth="0.5" />
        )))}
      </svg>
      {nodes.map((n, i) => (
        <motion.div key={i} className="absolute w-1.5 h-1.5 rounded-full bg-cyan-400" style={{ left: `${n.x}%`, top: `${n.y}%` }} animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }} />
      ))}
    </div>
  );
};

/* ============ 20. 渐变光球 ============ */
const GradientOrbs: React.FC<PackComponentProps> = () => (
  <div className="relative w-full h-full overflow-hidden rounded-xl bg-gray-950 flex items-center justify-center">
    <motion.div className="absolute w-20 h-20 rounded-full blur-xl" style={{ background: "linear-gradient(135deg, #6366f1, #ec4899)", top: "15%", left: "20%" }} animate={{ x: [0, 30, 0], y: [0, 15, 0] }} transition={{ duration: 7, repeat: Infinity }} />
    <motion.div className="absolute w-16 h-16 rounded-full blur-xl" style={{ background: "linear-gradient(135deg, #06b6d4, #22c55e)", bottom: "20%", right: "20%" }} animate={{ x: [0, -25, 0], y: [0, -10, 0] }} transition={{ duration: 6, repeat: Infinity }} />
    <motion.div className="absolute w-12 h-12 rounded-full blur-lg" style={{ background: "linear-gradient(135deg, #f59e0b, #ef4444)", top: "50%", left: "50%" }} animate={{ x: [0, 15, -15, 0], y: [0, -15, 15, 0] }} transition={{ duration: 8, repeat: Infinity }} />
  </div>
);

/* ============ 导出 ============ */
export const animBgComponents: Record<string, React.FC<PackComponentProps>> = {
  "abg-gradient-flow": GradientFlow,
  "abg-starfield": Starfield,
  "abg-ocean-waves": OceanWaves,
  "abg-fireflies": Fireflies,
  "abg-northern-lights": NorthernLights,
  "abg-bubbles": Bubbles,
  "abg-matrix-rain": MatrixRain,
  "abg-smoke": Smoke,
  "abg-rainbow-wave": RainbowWave,
  "abg-pulse-grid": PulseGrid,
  "abg-meteor-shower": MeteorShower,
  "abg-lava-lamp": LavaLamp,
  "abg-snowfall": Snowfall,
  "abg-cyber-grid": CyberGrid,
  "abg-sunset-gradient": SunsetGradient,
  "abg-nebula": Nebula,
  "abg-geometric-flow": GeometricFlow,
  "abg-aurora-curtain": AuroraCurtain,
  "abg-particle-network": ParticleNetwork,
  "abg-gradient-orbs": GradientOrbs,
};
