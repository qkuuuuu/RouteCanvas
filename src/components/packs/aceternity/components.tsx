"use client";
import * as React from "react";
import { motion } from "framer-motion";
import { Folder, Globe, Camera, Music, Settings } from "lucide-react";
import type { PackComponentProps } from "../react-bits/components";

/* ---------- HoverBorderGradient ---------- */
export const HoverBorderGradient: React.FC<PackComponentProps> = ({ text, interactive, onTrigger }) => {
  const [hovered, setHovered] = React.useState(false);
  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={interactive ? onTrigger : undefined}
      className="relative w-full h-full rounded-full bg-slate-950 p-px overflow-hidden"
    >
      <motion.span
        className="absolute inset-0"
        animate={hovered ? { rotate: 360 } : { rotate: 0 }}
        transition={{ duration: 1, ease: "linear" }}
        style={{
          background:
            "conic-gradient(from 0deg, transparent, #6366f1, transparent 50%)",
        }}
      />
      <span className="relative z-10 block h-full w-full rounded-full bg-slate-950 px-4 flex items-center justify-center text-sm text-white">
        {text ?? "Hover Me"}
      </span>
    </button>
  );
};

/* ---------- BackgroundBeams ---------- */
export const BackgroundBeams: React.FC<PackComponentProps> = ({ text }) => {
  return (
    <div className="relative w-full h-full overflow-hidden rounded-xl bg-slate-950 flex items-center justify-center">
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const x = Math.cos(angle) * 50;
        const y = Math.sin(angle) * 50;
        return (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: "50%",
              top: "50%",
              width: 1,
              height: 120,
              background: "linear-gradient(to bottom, transparent, rgba(99,102,241,0.8))",
              transformOrigin: "top center",
              transform: `rotate(${(angle * 180) / Math.PI}deg) translate(${x}px, ${y}px)`,
            }}
            animate={{ opacity: [0, 0.8, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.25 }}
          />
        );
      })}
      <div className="relative z-10 text-sm font-semibold text-white">{text ?? "Beams"}</div>
    </div>
  );
};

/* ---------- CardSpotlight ---------- */
export const CardSpotlight: React.FC<PackComponentProps> = ({ text, interactive, onTrigger }) => {
  const [pos, setPos] = React.useState({ x: 0, y: 0 });
  const ref = React.useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      onMouseMove={(e) => {
        const rect = ref.current!.getBoundingClientRect();
        setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }}
      onClick={interactive ? onTrigger : undefined}
      className="relative w-full h-full overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 p-4"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background: `radial-gradient(300px circle at ${pos.x}px ${pos.y}px, rgba(124,58,237,0.25), transparent 80%)`,
        }}
      />
      <div className="relative z-10 text-sm font-medium text-white">{text ?? "Spotlight"}</div>
    </div>
  );
};

/* ---------- TextGenerateEffect ---------- */
export const TextGenerateEffect: React.FC<PackComponentProps> = ({ text }) => {
  const words = (text ?? "Generate Effect").split(" ");
  return (
    <div className="w-full h-full flex items-center justify-center flex-wrap gap-x-1">
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, filter: "blur(10px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ delay: i * 0.15, duration: 0.5 }}
          className="inline-block text-sm font-medium text-gray-800"
        >
          {word}{" "}
        </motion.span>
      ))}
    </div>
  );
};

/* ---------- Meteors ---------- */
export const Meteors: React.FC<PackComponentProps> = ({ text }) => {
  return (
    <div className="relative w-full h-full overflow-hidden rounded-xl bg-slate-950 flex items-center justify-center">
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute h-0.5 w-12 bg-gradient-to-r from-white to-transparent rounded-full"
          initial={{
            x: -20,
            y: -20,
            opacity: 0,
          }}
          animate={{
            x: 200 + Math.random() * 100,
            y: 200 + Math.random() * 100,
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 1.5 + Math.random(),
            repeat: Infinity,
            delay: i * 0.5 + Math.random(),
          }}
          style={{
            top: `${Math.random() * 50}%`,
            left: `${Math.random() * 50}%`,
          }}
        />
      ))}
      <div className="relative z-10 text-sm font-semibold text-white">{text ?? "Meteors"}</div>
    </div>
  );
};

/* ---------- LampEffect ---------- */
export const LampEffect: React.FC<PackComponentProps> = ({ text }) => {
  return (
    <div className="relative w-full h-full overflow-hidden rounded-xl bg-slate-950 flex items-center justify-center">
      <div
        className="absolute left-1/2 top-0 -translate-x-1/2 w-1/2 h-1/2"
        style={{
          background: "radial-gradient(ellipse at top, rgba(99,102,241,0.4), transparent 70%)",
        }}
      />
      <motion.div
        className="absolute left-1/2 top-4 -translate-x-1/2 h-px bg-gradient-to-r from-transparent via-indigo-400 to-transparent"
        animate={{ width: ["30%", "80%", "30%"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="relative z-10 text-sm font-bold text-white">{text ?? "Lamp"}</div>
    </div>
  );
};

/* ---------- AuroraBackground ---------- */
export const AuroraBackground: React.FC<PackComponentProps> = ({ text }) => (
  <div className="relative w-full h-full overflow-hidden rounded-xl bg-slate-950 flex items-center justify-center">
    <motion.div className="absolute inset-0 opacity-40" style={{ background: "linear-gradient(135deg, #6366f1, #ec4899, #06b6d4)" }} animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }} transition={{ duration: 5, repeat: Infinity }} />
    <span className="relative z-10 text-sm font-bold text-white">{text ?? "Aurora"}</span>
  </div>
);

/* ---------- GlowingStars ---------- */
export const GlowingStars: React.FC<PackComponentProps> = ({ text }) => (
  <div className="relative w-full h-full overflow-hidden rounded-xl bg-slate-950 flex items-center justify-center">
    {Array.from({ length: 15 }).map((_, i) => (
      <motion.span key={i} className="absolute w-1 h-1 rounded-full bg-white" style={{ left: `${10 + Math.random() * 80}%`, top: `${10 + Math.random() * 80}%` }} animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }} transition={{ duration: 1.5 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }} />
    ))}
    <span className="relative z-10 text-sm font-semibold text-white">{text ?? "Stars"}</span>
  </div>
);

/* ---------- WavyBackground ---------- */
export const WavyBackground: React.FC<PackComponentProps> = ({ text }) => (
  <div className="relative w-full h-full overflow-hidden rounded-xl bg-indigo-950 flex items-center justify-center">
    {[0, 1, 2].map((i) => (
      <motion.div key={i} className="absolute bottom-0 left-0 right-0 h-1/3 rounded-t-full" style={{ background: `rgba(99,102,241,${0.15 + i * 0.1})` }} animate={{ y: [0, -8, 0], x: [i * 5, -i * 5, i * 5] }} transition={{ duration: 3 + i, repeat: Infinity, ease: "easeInOut" }} />
    ))}
    <span className="relative z-10 text-sm font-bold text-white">{text ?? "Waves"}</span>
  </div>
);

/* ---------- Sparkles ---------- */
export const Sparkles: React.FC<PackComponentProps> = ({ text }) => (
  <div className="relative w-full h-full overflow-hidden rounded-xl bg-gray-900 flex items-center justify-center">
    {Array.from({ length: 12 }).map((_, i) => (
      <motion.span key={i} className="absolute text-indigo-300" style={{ left: `${Math.random() * 90}%`, top: `${Math.random() * 90}%`, fontSize: 8 + Math.random() * 6 }} animate={{ opacity: [0, 1, 0], rotate: [0, 180] }} transition={{ duration: 1.5 + Math.random(), repeat: Infinity, delay: Math.random() * 2 }}>✦</motion.span>
    ))}
    <span className="relative z-10 text-sm font-semibold text-white">{text ?? "星光"}</span>
  </div>
);

/* ---------- GradientButton ---------- */
export const GradientButton: React.FC<PackComponentProps> = ({ text, interactive, onTrigger }) => (
  <div className="w-full h-full flex items-center justify-center">
    <motion.button onClick={interactive ? onTrigger : undefined} className="px-5 py-2.5 rounded-full text-white text-sm font-semibold" style={{ background: "linear-gradient(135deg, #6366f1, #ec4899)" }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }} transition={{ duration: 3, repeat: Infinity }}>{text ?? "Gradient"}</motion.button>
  </div>
);

/* ---------- TextReveal ---------- */
export const TextReveal: React.FC<PackComponentProps> = ({ text }) => {
  const words = (text ?? "Reveal Effect").split(" ");
  return (
    <div className="w-full h-full flex items-center justify-center flex-wrap gap-x-1">
      {words.map((w, i) => (
        <motion.span key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.2, duration: 0.4 }} className="text-sm font-semibold text-gray-800">{w}</motion.span>
      ))}
    </div>
  );
};

/* ---------- Card3D ---------- */
export const Card3D: React.FC<PackComponentProps> = ({ text }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [r, setR] = React.useState({ x: 0, y: 0 });
  return (
    <motion.div ref={ref} onMouseMove={(e) => { const rect = ref.current!.getBoundingClientRect(); setR({ x: -((e.clientY - rect.top) / rect.height - 0.5) * 20, y: ((e.clientX - rect.left) / rect.width - 0.5) * 20 }); }} onMouseLeave={() => setR({ x: 0, y: 0 })} style={{ rotateX: r.x, rotateY: r.y, transformStyle: "preserve-3d" }} className="w-full h-full rounded-2xl bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center shadow-xl shadow-indigo-500/25">
      <span className="text-white text-sm font-bold">{text ?? "3D 卡片"}</span>
    </motion.div>
  );
};

/* ---------- InfiniteMoving ---------- */
export const InfiniteMoving: React.FC<PackComponentProps> = ({ text }) => {
  const items = (text ?? "极致体验 • 匠心设计 • 持续进化 • ").repeat(3);
  return (
    <div className="w-full h-full flex items-center overflow-hidden">
      <motion.div className="whitespace-nowrap text-sm text-gray-600 font-medium" animate={{ x: ["0%", "-33.33%"] }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }}>{items}</motion.div>
    </div>
  );
};

/* ---------- ShootingStars ---------- */
export const ShootingStars: React.FC<PackComponentProps> = ({ text }) => (
  <div className="relative w-full h-full overflow-hidden rounded-xl bg-slate-950 flex items-center justify-center">
    {Array.from({ length: 5 }).map((_, i) => (
      <motion.div key={i} className="absolute h-px w-16 bg-gradient-to-r from-white via-blue-300 to-transparent" style={{ top: `${15 + i * 18}%`, left: "-20%" }} animate={{ x: ["0vw", "120vw"], opacity: [0, 1, 0] }} transition={{ duration: 1.2 + i * 0.3, repeat: Infinity, delay: i * 0.8 }} />
    ))}
    <span className="relative z-10 text-sm font-semibold text-white">{text ?? "Shooting"}</span>
  </div>
);

/* ---------- AnimatedTooltip ---------- */
export const AnimatedTooltip: React.FC<PackComponentProps> = ({ text }) => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="group relative">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500" />
      <motion.div initial={{ opacity: 0, y: 5, scale: 0.9 }} whileHover={{ opacity: 1, y: 0, scale: 1 }} className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">{text ?? "Tooltip"}</motion.div>
    </div>
  </div>
);

/* ---------- FocusCards ---------- */
export const FocusCards: React.FC<PackComponentProps> = ({ text }) => (
  <div className="w-full h-full flex items-center justify-center gap-1.5 px-2">
    {[1, 2, 3].map((i) => (
      <motion.div key={i} className="flex-1 h-3/4 rounded-lg bg-gradient-to-b from-gray-200 to-gray-300 flex items-center justify-center" whileHover={{ scale: 1.08, zIndex: 10 }} transition={{ type: "spring", stiffness: 300 }}>
        <span className="text-[10px] font-medium text-gray-600">{text ?? `Card ${i}`}</span>
      </motion.div>
    ))}
  </div>
);

/* ---------- TracingBeam ---------- */
export const TracingBeam: React.FC<PackComponentProps> = ({ text }) => (
  <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-xl bg-gray-50">
    <motion.div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-transparent" animate={{ scaleY: [0, 1, 0], originY: 0 }} transition={{ duration: 2, repeat: Infinity }} />
    <span className="text-sm font-medium text-gray-700">{text ?? "Tracing"}</span>
  </div>
);

/* ---------- HeroHighlight ---------- */
export const HeroHighlight: React.FC<PackComponentProps> = ({ text }) => (
  <div className="w-full h-full flex items-center justify-center">
    <span className="text-sm font-bold text-gray-900">{text ?? "高亮重点"}
      <motion.span className="block h-2 -mt-2 bg-indigo-300/50 -z-10 rounded" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.8, delay: 0.3 }} style={{ originX: 0 }} />
    </span>
  </div>
);

/* ---------- Vortex ---------- */
export const Vortex: React.FC<PackComponentProps> = ({ text }) => (
  <div className="relative w-full h-full overflow-hidden rounded-xl bg-slate-950 flex items-center justify-center">
    {[0, 1, 2, 3].map((i) => (
      <motion.div key={i} className="absolute rounded-full border border-indigo-500/30" style={{ width: 30 + i * 25, height: 30 + i * 25 }} animate={{ rotate: 360 }} transition={{ duration: 4 + i * 2, repeat: Infinity, ease: "linear" }} />
    ))}
    <span className="relative z-10 text-sm font-bold text-white">{text ?? "Vortex"}</span>
  </div>
);

/* ---------- GridPattern ---------- */
export const GridPattern: React.FC<PackComponentProps> = ({ text }) => (
  <div className="relative w-full h-full overflow-hidden rounded-xl bg-white border border-gray-200 flex items-center justify-center" style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)", backgroundSize: "20px 20px" }}>
    <motion.div className="absolute w-10 h-10 bg-blue-500/10 rounded-lg" animate={{ x: [0, 40, 80, 40, 0], y: [0, 20, 0, -20, 0] }} transition={{ duration: 6, repeat: Infinity }} />
    <span className="relative z-10 text-sm font-medium text-gray-700">{text ?? "Grid"}</span>
  </div>
);

/* ---------- DotPattern ---------- */
export const DotPattern: React.FC<PackComponentProps> = ({ text }) => (
  <div className="relative w-full h-full overflow-hidden rounded-xl bg-white border border-gray-200 flex items-center justify-center" style={{ backgroundImage: "radial-gradient(circle, #d1d5db 1px, transparent 1px)", backgroundSize: "16px 16px" }}>
    <span className="relative z-10 text-sm font-medium text-gray-700 bg-white/80 px-2 py-1 rounded">{text ?? "Dots"}</span>
  </div>
);

/* ---------- GradientBorder ---------- */
export const GradientBorder: React.FC<PackComponentProps> = ({ text }) => (
  <div className="w-full h-full flex items-center justify-center p-1">
    <div className="w-full h-full rounded-xl p-px" style={{ background: "linear-gradient(135deg, #6366f1, #ec4899, #06b6d4)" }}>
      <div className="w-full h-full rounded-xl bg-white flex items-center justify-center">
        <span className="text-sm font-medium text-gray-700">{text ?? "Border"}</span>
      </div>
    </div>
  </div>
);

/* ---------- ShimmerEffect ---------- */
export const ShimmerEffect: React.FC<PackComponentProps> = () => (
  <div className="w-full h-full flex flex-col items-center justify-center gap-2 px-4">
    {[100, 80, 60].map((w, i) => (
      <div key={i} className="h-3 rounded-full bg-gray-200 overflow-hidden relative" style={{ width: `${w}%` }}>
        <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent" animate={{ x: ["-100%", "200%"] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }} />
      </div>
    ))}
  </div>
);

/* ---------- TypewriterEffect ---------- */
export const TypewriterEffectAc: React.FC<PackComponentProps> = ({ text }) => {
  const full = text ?? "Aceternity";
  const [display, setDisplay] = React.useState("");
  React.useEffect(() => {
    let i = 0;
    const t = setInterval(() => { i++; setDisplay(full.slice(0, i)); if (i >= full.length) setTimeout(() => { i = 0; setDisplay(""); }, 1000); }, 100);
    return () => clearInterval(t);
  }, [full]);
  return (
    <div className="w-full h-full flex items-center justify-center">
      <span className="text-sm font-mono font-bold text-indigo-600">{display}</span>
      <motion.span className="w-0.5 h-4 bg-indigo-600 ml-0.5" animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }} />
    </div>
  );
};

/* ---------- FloatingAction ---------- */
export const FloatingAction: React.FC<PackComponentProps> = ({ text, interactive, onTrigger }) => (
  <div className="w-full h-full flex items-center justify-center">
    <motion.button onClick={interactive ? onTrigger : undefined} className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center shadow-lg text-lg" animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} whileHover={{ scale: 1.1 }}>+</motion.button>
  </div>
);

/* ---------- NeonGlow ---------- */
export const NeonGlow: React.FC<PackComponentProps> = ({ text }) => (
  <div className="w-full h-full flex items-center justify-center bg-gray-950 rounded-xl">
    <motion.span className="text-lg font-bold text-cyan-400" animate={{ textShadow: ["0 0 5px #22d3ee, 0 0 10px #22d3ee", "0 0 15px #22d3ee, 0 0 30px #22d3ee", "0 0 5px #22d3ee, 0 0 10px #22d3ee"] }} transition={{ duration: 2, repeat: Infinity }}>{text ?? "Neon"}</motion.span>
  </div>
);

/* ---------- PulseRing ---------- */
export const PulseRing: React.FC<PackComponentProps> = ({ text }) => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="relative">
      {[0, 1, 2].map((i) => (
        <motion.div key={i} className="absolute inset-0 rounded-full border-2 border-blue-400" animate={{ scale: [1, 2 + i * 0.5], opacity: [0.6, 0] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }} style={{ width: 40, height: 40 }} />
      ))}
      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
        <span className="text-[9px] text-white font-bold">{text ?? "Ping"}</span>
      </div>
    </div>
  </div>
);

/* ---------- AnimatedCursor ---------- */
export const AnimatedCursor: React.FC<PackComponentProps> = ({ text }) => (
  <div className="w-full h-full flex items-center justify-center">
    <span className="text-sm font-medium text-gray-800">{text ?? "Type here"}</span>
    <motion.span className="inline-block w-0.5 h-4 bg-blue-600 ml-0.5" animate={{ opacity: [1, 0] }} transition={{ duration: 0.6, repeat: Infinity }} />
  </div>
);

/* ---------- StaggerCards ---------- */
export const StaggerCards: React.FC<PackComponentProps> = ({ text }) => (
  <div className="w-full h-full flex items-center justify-center gap-1.5">
    {[0, 1, 2, 3].map((i) => (
      <motion.div key={i} className="w-8 h-12 rounded-md bg-gradient-to-b from-indigo-400 to-purple-500" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.1, duration: 0.3 }} whileHover={{ y: -5 }} />
    ))}
  </div>
);

/* ---------- TimelineAc ---------- */
export const TimelineAc: React.FC<PackComponentProps> = ({ text }) => (
  <div className="w-full h-full flex flex-col justify-center px-4 gap-0">
    {[0, 1, 2].map((i) => (
      <motion.div key={i} className="flex items-center gap-2" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.2 }}>
        <div className="flex flex-col items-center"><div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />{i < 2 && <div className="w-px h-5 bg-gray-300" />}</div>
        <span className="text-xs text-gray-700">{(text ?? "步骤") + " " + (i + 1)}</span>
      </motion.div>
    ))}
  </div>
);

/* ---------- BentoGrid ---------- */
export const BentoGrid: React.FC<PackComponentProps> = ({ text }) => (
  <div className="w-full h-full grid grid-cols-3 grid-rows-2 gap-1.5 p-3">
    <motion.div className="col-span-2 rounded-lg bg-indigo-100 flex items-center justify-center text-xs font-medium text-indigo-700" whileHover={{ scale: 1.02 }}>{text ?? "Feature"}</motion.div>
    <div className="rounded-lg bg-purple-100 flex items-center justify-center text-xs text-purple-700">B</div>
    <div className="rounded-lg bg-pink-100 flex items-center justify-center text-xs text-pink-700">C</div>
    <div className="col-span-2 rounded-lg bg-sky-100 flex items-center justify-center text-xs text-sky-700">D</div>
  </div>
);

/* ---------- FlipWords ---------- */
export const FlipWords: React.FC<PackComponentProps> = ({ text }) => {
  const words = ["优雅", "现代", "快速", "精致"];
  const [idx, setIdx] = React.useState(0);
  React.useEffect(() => { const t = setInterval(() => setIdx((p) => (p + 1) % words.length), 2000); return () => clearInterval(t); }, []);
  return (
    <div className="w-full h-full flex items-center justify-center gap-1">
      <span className="text-sm text-gray-600">{text ?? "让它更"}</span>
      <motion.span key={idx} className="text-sm font-bold text-indigo-600" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }}>{words[idx]}</motion.span>
    </div>
  );
};

/* ---------- MacOsDock ---------- */
export const MacOsDock: React.FC<PackComponentProps> = () => (
  <div className="w-full h-full flex items-end justify-center pb-2">
    <div className="flex items-end gap-1.5 px-3 py-2 rounded-2xl bg-white/70 backdrop-blur-xl border border-gray-200/60 shadow-lg">
      {[Folder, Globe, Camera, Music, Settings].map((Icon, i) => (
        <motion.span key={i} className="text-gray-600 hover:text-indigo-600 cursor-pointer" whileHover={{ scale: 1.4, y: -6 }} transition={{ type: "spring", stiffness: 300 }}><Icon size={18} /></motion.span>
      ))}
    </div>
  </div>
);

/* ---------- AnimatedModal ---------- */
export const AnimatedModalAc: React.FC<PackComponentProps> = ({ text }) => {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="w-full h-full flex items-center justify-center relative">
      <button className="px-3 py-1.5 rounded-lg bg-indigo-500 text-white text-xs font-medium" onClick={() => setOpen(true)}>{text ?? "Open"}</button>
      {open && <motion.div className="absolute inset-2 rounded-xl bg-white shadow-xl border flex items-center justify-center text-sm text-gray-700" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={() => setOpen(false)}>Modal Content</motion.div>}
    </div>
  );
};

/* ---------- DirectionAware ---------- */
export const DirectionAware: React.FC<PackComponentProps> = ({ text }) => {
  const [dir, setDir] = React.useState("");
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="relative w-[70%] h-[60%] rounded-xl overflow-hidden bg-gray-900" onMouseEnter={(e) => { const r = e.currentTarget.getBoundingClientRect(); const x = e.clientX - r.left - r.width / 2; setDir(x > 0 ? "right" : "left"); }}>
        <motion.div className="absolute inset-0 bg-indigo-600/80 flex items-center justify-center text-white text-xs font-semibold" initial={{ x: dir === "right" ? "100%" : "-100%" }} animate={{ x: 0 }} transition={{ duration: 0.3 }}>{text ?? "Hover"}</motion.div>
      </div>
    </div>
  );
};

/* ---------- ParticlesBgAc ---------- */
export const ParticlesBgAc: React.FC<PackComponentProps> = () => (
  <div className="w-full h-full relative overflow-hidden bg-gray-950 rounded-lg">
    {Array.from({ length: 20 }).map((_, i) => (
      <motion.div key={i} className="absolute w-1 h-1 rounded-full bg-white/40" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }} animate={{ y: [0, -20, 0], opacity: [0.2, 0.8, 0.2] }} transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }} />
    ))}
  </div>
);

/* ---------- TextPressure ---------- */
export const TextPressure: React.FC<PackComponentProps> = ({ text }) => (
  <div className="w-full h-full flex items-center justify-center">
    <motion.span className="text-xl font-black text-gray-800" whileHover={{ scale: 1.2, fontWeight: 900 }} transition={{ type: "spring", stiffness: 300 }}>{text ?? "Press"}</motion.span>
  </div>
);

/* ---------- CardStack ---------- */
export const CardStack: React.FC<PackComponentProps> = ({ text }) => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="relative w-20 h-14">
      {[2, 1, 0].map((i) => (
        <motion.div key={i} className="absolute inset-0 rounded-lg border bg-white shadow-sm flex items-center justify-center text-[10px] text-gray-500" style={{ zIndex: 3 - i }} animate={{ y: i * 4, scale: 1 - i * 0.05 }} whileHover={i === 0 ? { y: -4 } : undefined}>{i === 0 ? (text ?? "Card") : ""}</motion.div>
      ))}
    </div>
  </div>
);

/* ---------- ComparisonSlider ---------- */
export const ComparisonSlider: React.FC<PackComponentProps> = () => {
  const [pos, setPos] = React.useState(50);
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="relative w-[80%] h-[60%] rounded-lg overflow-hidden" onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setPos(Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100))); }}>
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-500" />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }} />
        <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow" style={{ left: `${pos}%` }} />
      </div>
    </div>
  );
};

/* ---------- AnimatedTabs ---------- */
export const AnimatedTabs: React.FC<PackComponentProps> = () => {
  const [active, setActive] = React.useState(0);
  const tabs = ["首页", "关于", "作品"];
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {tabs.map((t, i) => (
          <button key={t} className="relative px-3 py-1 rounded-md text-xs font-medium" onClick={() => setActive(i)}>
            {active === i && <motion.div layoutId="tab-bg" className="absolute inset-0 bg-white rounded-md shadow-sm" />}
            <span className={`relative z-10 ${active === i ? "text-gray-900" : "text-gray-500"}`}>{t}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

/* ---------- Marquee3D ---------- */
export const Marquee3D: React.FC<PackComponentProps> = ({ text }) => (
  <div className="w-full h-full flex items-center justify-center overflow-hidden" style={{ perspective: 400 }}>
    <motion.div className="flex gap-4" animate={{ x: [0, -100] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} style={{ transform: "rotateX(10deg)" }}>
      {Array.from({ length: 6 }).map((_, i) => <span key={i} className="text-sm font-bold text-indigo-500/70 whitespace-nowrap">{text ?? "Marquee"}</span>)}
    </motion.div>
  </div>
);

/* ---------- GlowingBtn ---------- */
export const GlowingBtn: React.FC<PackComponentProps> = ({ text, interactive, onTrigger }) => (
  <div className="w-full h-full flex items-center justify-center">
    <motion.button className="relative px-5 py-2 rounded-full bg-gray-900 text-white text-sm font-semibold overflow-hidden" whileHover="hover" onClick={interactive ? onTrigger : undefined}>
      <motion.span className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-60 blur-[6px]" variants={{ hover: { opacity: 1 } }} transition={{ duration: 0.3 }} />
      <span className="relative z-10">{text ?? "辉光按钮"}</span>
    </motion.button>
  </div>
);

/* ---------- ScrollReveal ---------- */
export const ScrollReveal: React.FC<PackComponentProps> = ({ text }) => (
  <div className="w-full h-full flex items-center justify-center">
    <motion.p className="text-sm text-gray-700 text-center px-4" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>{text ?? "Scroll to reveal content"}</motion.p>
  </div>
);

/* ---------- AnimatedCounter ---------- */
export const AnimatedCounter: React.FC<PackComponentProps> = ({ text }) => {
  const target = Math.max(1, parseInt(text ?? "", 10) || 100);
  const [count, setCount] = React.useState(0);
  React.useEffect(() => {
    const step = Math.max(1, Math.ceil(target / 40));
    const t = setInterval(() => {
      setCount((c) => {
        if (c >= target) { clearInterval(t); return target; }
        return Math.min(target, c + step);
      });
    }, 30);
    return () => clearInterval(t);
  }, [target]);
  return (
    <div className="w-full h-full flex items-center justify-center">
      <span className="text-2xl font-black text-indigo-600 tabular-nums">{count.toLocaleString()}</span>
    </div>
  );
};

/* ---------- GradientMesh ---------- */
export const GradientMesh: React.FC<PackComponentProps> = () => (
  <div className="w-full h-full relative overflow-hidden rounded-lg">
    <motion.div className="absolute w-24 h-24 rounded-full bg-indigo-400/50 blur-xl" animate={{ x: [0, 40, 0], y: [0, 20, 0] }} transition={{ duration: 6, repeat: Infinity }} style={{ top: "10%", left: "10%" }} />
    <motion.div className="absolute w-20 h-20 rounded-full bg-pink-400/50 blur-xl" animate={{ x: [0, -30, 0], y: [0, 30, 0] }} transition={{ duration: 5, repeat: Infinity }} style={{ top: "40%", right: "10%" }} />
    <motion.div className="absolute w-16 h-16 rounded-full bg-amber-300/50 blur-xl" animate={{ x: [0, 20, 0], y: [0, -20, 0] }} transition={{ duration: 7, repeat: Infinity }} style={{ bottom: "10%", left: "30%" }} />
  </div>
);

/* ---------- SpotlightHero ---------- */
export const SpotlightHero: React.FC<PackComponentProps> = ({ text }) => {
  const [pos, setPos] = React.useState({ x: 50, y: 50 });
  return (
    <div className="relative w-full h-full overflow-hidden rounded-xl bg-gray-950 flex items-center justify-center" onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setPos({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }); }}>
      <div className="absolute inset-0" style={{ background: `radial-gradient(600px circle at ${pos.x}% ${pos.y}%, rgba(99,102,241,0.15), transparent 60%)` }} />
      <span className="relative z-10 text-lg font-bold text-white">{text ?? "Spotlight Hero"}</span>
    </div>
  );
};

/* ---------- AnimatedBadge ---------- */
export const AnimatedBadgeAc: React.FC<PackComponentProps> = ({ text }) => (
  <div className="w-full h-full flex items-center justify-center">
    <motion.span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200" animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}>{text ?? "New"}</motion.span>
  </div>
);

/* ---------- GlassCardAc ---------- */
export const GlassCardAc: React.FC<PackComponentProps> = ({ text }) => (
  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-3">
    <div className="w-full h-full rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg">
      <span className="text-white text-sm font-semibold">{text ?? "Glass Card"}</span>
    </div>
  </div>
);

/* ---------- MorphingBlob ---------- */
export const MorphingBlob: React.FC<PackComponentProps> = () => (
  <div className="w-full h-full flex items-center justify-center">
    <motion.div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-pink-500" animate={{ borderRadius: ["30% 70% 70% 30% / 30% 30% 70% 70%", "70% 30% 30% 70% / 70% 70% 30% 30%", "30% 70% 70% 30% / 30% 30% 70% 70%"], rotate: [0, 180, 360] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} />
  </div>
);

/* ---------- TextShadowAc ---------- */
export const TextShadowAc: React.FC<PackComponentProps> = ({ text }) => (
  <div className="w-full h-full flex items-center justify-center bg-gray-950 rounded-xl">
    <motion.span className="text-xl font-black text-white" animate={{ textShadow: ["0 0 10px #6366f1, 0 0 20px #6366f1", "0 0 20px #ec4899, 0 0 40px #ec4899", "0 0 10px #6366f1, 0 0 20px #6366f1"] }} transition={{ duration: 3, repeat: Infinity }}>{text ?? "Glow"}</motion.span>
  </div>
);

/* ---------- AnimatedProgressAc ---------- */
export const AnimatedProgressAc: React.FC<PackComponentProps> = ({ text }) => (
  <div className="w-full h-full flex flex-col items-center justify-center gap-2 px-4">
    <span className="text-xs text-gray-600 font-medium">{text ?? "Loading..."}</span>
    <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
      <motion.div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-pink-500" animate={{ width: ["10%", "90%", "10%"] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
    </div>
  </div>
);

/* ---------- HoverGlowCard ---------- */
export const HoverGlowCard: React.FC<PackComponentProps> = ({ text }) => (
  <div className="w-full h-full flex items-center justify-center">
    <motion.div className="w-[80%] h-[70%] rounded-xl bg-white border border-gray-200 flex items-center justify-center cursor-pointer" whileHover={{ boxShadow: "0 0 20px rgba(99,102,241,0.4), 0 0 40px rgba(99,102,241,0.2)", borderColor: "#6366f1" }}>
      <span className="text-sm font-medium text-gray-700">{text ?? "Hover Glow"}</span>
    </motion.div>
  </div>
);

/* ---------- WaveTextAnim ---------- */
export const WaveTextAnim: React.FC<PackComponentProps> = ({ text }) => {
  const chars = (text ?? "Wave").split("");
  return (
    <div className="w-full h-full flex items-center justify-center">
      {chars.map((c, i) => (
        <motion.span key={i} className="text-lg font-bold text-indigo-600 inline-block" animate={{ y: [0, -8, 0] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.1 }}>{c}</motion.span>
      ))}
    </div>
  );
};

export const aceternityComponents = {
  "ac-hover-border-gradient": HoverBorderGradient,
  "ac-background-beams": BackgroundBeams,
  "ac-card-spotlight": CardSpotlight,
  "ac-text-generate": TextGenerateEffect,
  "ac-meteors": Meteors,
  "ac-lamp-effect": LampEffect,
  "ac-aurora": AuroraBackground,
  "ac-glowing-stars": GlowingStars,
  "ac-wavy-bg": WavyBackground,
  "ac-sparkles": Sparkles,
  "ac-gradient-btn": GradientButton,
  "ac-text-reveal": TextReveal,
  "ac-card-3d": Card3D,
  "ac-infinite-moving": InfiniteMoving,
  "ac-shooting-stars": ShootingStars,
  "ac-tooltip": AnimatedTooltip,
  "ac-focus-cards": FocusCards,
  "ac-tracing-beam": TracingBeam,
  "ac-hero-highlight": HeroHighlight,
  "ac-vortex": Vortex,
  "ac-grid-pattern": GridPattern,
  "ac-dot-pattern": DotPattern,
  "ac-gradient-border": GradientBorder,
  "ac-shimmer": ShimmerEffect,
  "ac-typewriter": TypewriterEffectAc,
  "ac-floating-btn": FloatingAction,
  "ac-neon-glow": NeonGlow,
  "ac-pulse-ring": PulseRing,
  "ac-cursor": AnimatedCursor,
  "ac-stagger-cards": StaggerCards,
  "ac-timeline": TimelineAc,
  "ac-bento-grid": BentoGrid,
  "ac-flip-words": FlipWords,
  "ac-mac-os-dock": MacOsDock,
  "ac-animated-modal": AnimatedModalAc,
  "ac-direction-aware": DirectionAware,
  "ac-particles-bg": ParticlesBgAc,
  "ac-text-pressure": TextPressure,
  "ac-card-stack": CardStack,
  "ac-comparison-slider": ComparisonSlider,
  "ac-animated-tabs": AnimatedTabs,
  "ac-marquee-3d": Marquee3D,
  "ac-glowing-btn": GlowingBtn,
  "ac-scroll-reveal": ScrollReveal,
  "ac-animated-counter": AnimatedCounter,
  "ac-gradient-mesh": GradientMesh,
  "ac-spotlight-hero": SpotlightHero,
  "ac-animated-badge": AnimatedBadgeAc,
  "ac-glass-card": GlassCardAc,
  "ac-morphing-blob": MorphingBlob,
  "ac-text-shadow": TextShadowAc,
  "ac-animated-progress": AnimatedProgressAc,
  "ac-hover-glow-card": HoverGlowCard,
  "ac-wave-text-anim": WaveTextAnim,
};
