"use client";
import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { PackComponentProps } from "../react-bits/components";

/* ============ 1. 动画光束 ============ */
const AnimatedBeam: React.FC<PackComponentProps> = (props) => {
  const color = (props.color as string) ?? "#6366f1";
  return (
    <div className="relative w-full h-full overflow-hidden rounded-xl bg-gray-950 flex items-center justify-center">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 100">
        <path d="M10 50 C60 10, 140 90, 190 50" fill="none" stroke={`${color}33`} strokeWidth="2" />
        <motion.circle r="3" fill={color} initial={{ offsetDistance: "0%" }} animate={{ offsetDistance: "100%" }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} style={{ offsetPath: 'path("M10 50 C60 10, 140 90, 190 50")' }} />
      </svg>
      <span className="relative z-10 text-xs font-bold text-white">{props.text ?? "Beam"}</span>
    </div>
  );
};

/* ============ 2. 边框光束 ============ */
const BorderBeam: React.FC<PackComponentProps> = (props) => {
  const color = (props.color as string) ?? "#6366f1";
  return (
    <div className="w-full h-full flex items-center justify-center p-2">
      <div className="relative w-full h-full rounded-xl overflow-hidden border border-gray-800 flex items-center justify-center">
        <motion.div className="absolute w-8 h-8 rounded-full blur-md" style={{ background: color }} animate={{ top: ["0%", "0%", "100%", "100%", "0%"], left: ["0%", "100%", "100%", "0%", "0%"] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} />
        <span className="relative z-10 text-xs font-medium text-white">{props.text ?? "Border Beam"}</span>
      </div>
    </div>
  );
};

/* ============ 3. 闪光边框 ============ */
const ShineBorder: React.FC<PackComponentProps> = (props) => {
  const color = (props.color as string) ?? "#6366f1";
  return (
    <div className="w-full h-full flex items-center justify-center p-2">
      <motion.div className="w-full h-full rounded-xl flex items-center justify-center relative overflow-hidden" style={{ border: `2px solid ${color}44` }} animate={{ boxShadow: [`0 0 5px ${color}22`, `0 0 20px ${color}44`, `0 0 5px ${color}22`] }} transition={{ duration: 2, repeat: Infinity }}>
        <motion.div className="absolute inset-0" style={{ background: `linear-gradient(105deg, transparent 40%, ${color}33 50%, transparent 60%)` }} animate={{ x: ["-100%", "100%"] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} />
        <span className="relative z-10 text-xs font-medium text-white">{props.text ?? "Shine"}</span>
      </motion.div>
    </div>
  );
};

/* ============ 4. 魔法卡片 ============ */
const MagicCard: React.FC<PackComponentProps> = (props) => {
  const color = (props.color as string) ?? "#6366f1";
  const ref = React.useRef<HTMLDivElement>(null);
  const [pos, setPos] = React.useState({ x: 0, y: 0 });
  return (
    <div ref={ref} onMouseMove={(e) => { const r = ref.current!.getBoundingClientRect(); setPos({ x: e.clientX - r.left, y: e.clientY - r.top }); }} className="relative w-full h-full overflow-hidden rounded-xl border border-gray-700 bg-gray-900 flex items-center justify-center">
      <div className="pointer-events-none absolute inset-0 opacity-0 hover:opacity-100 transition-opacity" style={{ background: `radial-gradient(300px circle at ${pos.x}px ${pos.y}px, ${color}22, transparent 70%)` }} />
      <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(200px circle at ${pos.x}px ${pos.y}px, ${color}11, transparent 60%)` }} />
      <span className="relative z-10 text-xs font-medium text-white">{props.text ?? "Magic Card"}</span>
    </div>
  );
};

/* ============ 5. 数字滚动 ============ */
const NumberTicker: React.FC<PackComponentProps> = (props) => {
  const target = Number(props.text ?? "1234");
  const [val, setVal] = React.useState(0);
  React.useEffect(() => {
    let frame: number;
    const start = performance.now();
    const dur = 1500;
    const tick = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      setVal(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);
  return (
    <div className="w-full h-full flex items-center justify-center">
      <span className="text-2xl font-bold tabular-nums text-gray-900">{val.toLocaleString()}</span>
    </div>
  );
};

/* ============ 6. 文字轮转 ============ */
const WordRotate: React.FC<PackComponentProps> = (props) => {
  const words = (props.text ?? "Fast,Beautiful,Modern").split(",");
  const [idx, setIdx] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % words.length), 2000);
    return () => clearInterval(t);
  }, [words.length]);
  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.span key={idx} className="text-sm font-bold text-gray-900" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} transition={{ duration: 0.4 }}>{words[idx]}</motion.span>
      </AnimatePresence>
    </div>
  );
};

/* ============ 7. 字母上拉 ============ */
const LetterPullup: React.FC<PackComponentProps> = (props) => {
  const text = props.text ?? "Hello!";
  return (
    <div className="w-full h-full flex items-center justify-center">
      {text.split("").map((ch, i) => (
        <motion.span key={i} className="inline-block text-lg font-bold text-gray-900" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.08, duration: 0.5, type: "spring", stiffness: 200 }}>{ch === " " ? "\u00A0" : ch}</motion.span>
      ))}
    </div>
  );
};

/* ============ 8. 模糊渐入 ============ */
const BlurFade: React.FC<PackComponentProps> = (props) => {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <motion.div className="text-center" initial={{ filter: "blur(10px)", opacity: 0, y: 10 }} animate={{ filter: "blur(0px)", opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}>
        <span className="text-sm font-semibold text-gray-900">{props.text ?? "Blur Fade In"}</span>
      </motion.div>
    </div>
  );
};

/* ============ 9. 渐进间距 ============ */
const GradualSpacing: React.FC<PackComponentProps> = (props) => {
  const text = props.text ?? "Gradual Spacing";
  return (
    <div className="w-full h-full flex items-center justify-center">
      {text.split("").map((ch, i) => (
        <motion.span key={i} className="inline-block text-sm font-bold text-gray-900" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05, duration: 0.4 }}>{ch === " " ? "\u00A0" : ch}</motion.span>
      ))}
    </div>
  );
};

/* ============ 10. 微光按钮 ============ */
const ShimmerButton: React.FC<PackComponentProps> = (props) => {
  const color = (props.color as string) ?? "#6366f1";
  return (
    <div className="w-full h-full flex items-center justify-center">
      <motion.button onClick={props.interactive ? props.onTrigger : undefined} className="relative px-5 py-2.5 rounded-lg text-white text-xs font-semibold overflow-hidden" style={{ background: color }}>
        <motion.div className="absolute inset-0" style={{ background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%)" }} animate={{ x: ["-150%", "150%"] }} transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }} />
        <span className="relative z-10">{props.text ?? "Shimmer"}</span>
      </motion.button>
    </div>
  );
};

/* ============ 11. 涟漪效果 ============ */
const Ripple: React.FC<PackComponentProps> = (props) => {
  const color = (props.color as string) ?? "#6366f1";
  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden rounded-xl bg-gray-950">
      {[0, 1, 2, 3].map((i) => (
        <motion.div key={i} className="absolute rounded-full border" style={{ borderColor: `${color}44`, width: 20, height: 20 }} animate={{ scale: [1, 4 + i], opacity: [0.6, 0] }} transition={{ duration: 3, repeat: Infinity, delay: i * 0.6, ease: "easeOut" }} />
      ))}
      <div className="w-3 h-3 rounded-full relative z-10" style={{ background: color }} />
    </div>
  );
};

/* ============ 12. 点阵背景 ============ */
const DotPattern: React.FC<PackComponentProps> = (props) => {
  const color = (props.color as string) ?? "#6366f1";
  return (
    <div className="relative w-full h-full overflow-hidden rounded-xl bg-gray-950 flex items-center justify-center">
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: `radial-gradient(circle, ${color} 1px, transparent 1px)`, backgroundSize: "16px 16px" }} />
      <span className="relative z-10 text-xs font-bold text-white">{props.text ?? "Dots"}</span>
    </div>
  );
};

/* ============ 13. 网格背景 ============ */
const GridPattern: React.FC<PackComponentProps> = (props) => {
  const color = (props.color as string) ?? "#6366f1";
  return (
    <div className="relative w-full h-full overflow-hidden rounded-xl bg-gray-950 flex items-center justify-center">
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`, backgroundSize: "20px 20px" }} />
      <span className="relative z-10 text-xs font-bold text-white">{props.text ?? "Grid"}</span>
    </div>
  );
};

/* ============ 14. 复古网格 ============ */
const RetroGrid: React.FC<PackComponentProps> = (props) => {
  const color = (props.color as string) ?? "#6366f1";
  return (
    <div className="relative w-full h-full overflow-hidden rounded-xl bg-gray-950 flex items-center justify-center">
      <div className="absolute inset-0" style={{ perspective: "200px" }}>
        <motion.div className="absolute inset-0 origin-bottom" style={{ transform: "rotateX(60deg)", backgroundImage: `linear-gradient(${color}44 1px, transparent 1px), linear-gradient(90deg, ${color}44 1px, transparent 1px)`, backgroundSize: "20px 20px" }} animate={{ backgroundPositionY: ["0px", "20px"] }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
      </div>
      <span className="relative z-10 text-xs font-bold text-white">{props.text ?? "Retro"}</span>
    </div>
  );
};

/* ============ 15. 星火效果 ============ */
const Sparkles: React.FC<PackComponentProps> = (props) => {
  const color = (props.color as string) ?? "#f59e0b";
  return (
    <div className="relative w-full h-full overflow-hidden rounded-xl bg-gray-950 flex items-center justify-center">
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.span key={i} className="absolute w-1 h-1 rounded-full" style={{ background: color, left: `${(i * 17 + 8) % 90}%`, top: `${(i * 23 + 5) % 85}%` }} animate={{ scale: [0, 1.2, 0], opacity: [0, 1, 0], rotate: [0, 180] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }} />
      ))}
      <span className="relative z-10 text-xs font-bold text-white">{props.text ?? "Sparkles"}</span>
    </div>
  );
};

/* ============ 16. 文字揭示 ============ */
const TextReveal: React.FC<PackComponentProps> = (props) => {
  const text = props.text ?? "Reveal Effect";
  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden">
      <div className="relative">
        <span className="text-sm font-bold text-gray-300">{text}</span>
        <motion.div className="absolute inset-0 bg-white" initial={{ scaleX: 1 }} animate={{ scaleX: 0 }} transition={{ duration: 1, ease: "easeInOut" }} style={{ transformOrigin: "right" }} />
      </div>
    </div>
  );
};

/* ============ 17. 轨道动画 ============ */
const Orbit: React.FC<PackComponentProps> = (props) => {
  const color = (props.color as string) ?? "#6366f1";
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border border-gray-300" />
        <div className="absolute inset-3 rounded-full border border-gray-200" />
        <motion.div className="absolute w-3 h-3 rounded-full" style={{ background: color, top: -6, left: "50%", marginLeft: -6, transformOrigin: "6px 46px" }} animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} />
        <motion.div className="absolute w-2 h-2 rounded-full bg-pink-500" style={{ top: 6, left: "50%", marginLeft: -4 }} animate={{ rotate: -360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} />
        <div className="absolute inset-0 flex items-center justify-center"><div className="w-4 h-4 rounded-full bg-gray-800" /></div>
      </div>
    </div>
  );
};

/* ============ 18. 脉冲按钮 ============ */
const PulsatingButton: React.FC<PackComponentProps> = (props) => {
  const color = (props.color as string) ?? "#6366f1";
  return (
    <div className="w-full h-full flex items-center justify-center">
      <motion.button onClick={props.interactive ? props.onTrigger : undefined} className="px-4 py-2 rounded-lg text-white text-xs font-medium" style={{ background: color }} animate={{ scale: [1, 1.05, 1], boxShadow: [`0 0 0 0 ${color}44`, `0 0 0 8px ${color}00`, `0 0 0 0 ${color}00`] }} transition={{ duration: 1.5, repeat: Infinity }}>
        {props.text ?? "Pulse"}
      </motion.button>
    </div>
  );
};

/* ============ 19. 极光背景 ============ */
const Aurora: React.FC<PackComponentProps> = (props) => {
  const color = (props.color as string) ?? "#6366f1";
  return (
    <div className="relative w-full h-full overflow-hidden rounded-xl bg-gray-950 flex items-center justify-center">
      <motion.div className="absolute w-32 h-32 rounded-full blur-3xl opacity-30" style={{ background: color, top: "-20%", left: "10%" }} animate={{ x: [0, 30, -20, 0], y: [0, -10, 15, 0] }} transition={{ duration: 8, repeat: Infinity }} />
      <motion.div className="absolute w-24 h-24 rounded-full blur-3xl opacity-20" style={{ background: "#ec4899", bottom: "-10%", right: "15%" }} animate={{ x: [0, -25, 15, 0], y: [0, 10, -15, 0] }} transition={{ duration: 6, repeat: Infinity }} />
      <span className="relative z-10 text-xs font-bold text-white">{props.text ?? "Aurora"}</span>
    </div>
  );
};

/* ============ 20. 翻转按钮 ============ */
const FlipButton: React.FC<PackComponentProps> = (props) => {
  const color = (props.color as string) ?? "#6366f1";
  const [flipped, setFlipped] = React.useState(false);
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ perspective: 400 }}>
      <motion.button onClick={() => { setFlipped(!flipped); props.interactive && props.onTrigger?.(); }} className="px-4 py-2 rounded-lg text-white text-xs font-medium" style={{ background: color }} animate={{ rotateX: flipped ? 360 : 0 }} transition={{ duration: 0.6 }}>
        {props.text ?? "Flip"}
      </motion.button>
    </div>
  );
};

/* ============ 21. 打字动画 ============ */
const TypingAnimation: React.FC<PackComponentProps> = (props) => {
  const text = props.text ?? "Hello World!";
  const [display, setDisplay] = React.useState("");
  React.useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      i++;
      setDisplay(text.slice(0, i));
      if (i >= text.length) { i = 0; setDisplay(""); }
    }, 120);
    return () => clearInterval(t);
  }, [text]);
  return (
    <div className="w-full h-full flex items-center justify-center">
      <span className="text-sm font-mono font-medium text-gray-900">{display}<motion.span className="inline-block w-0.5 h-4 bg-gray-900 ml-0.5" animate={{ opacity: [1, 0] }} transition={{ duration: 0.6, repeat: Infinity }} /></span>
    </div>
  );
};

/* ============ 22. 文字淡入 ============ */
const WordFadeIn: React.FC<PackComponentProps> = (props) => {
  const words = (props.text ?? "Word Fade In Effect").split(" ");
  return (
    <div className="w-full h-full flex items-center justify-center flex-wrap gap-x-1.5">
      {words.map((w, i) => (
        <motion.span key={i} className="text-sm font-bold text-gray-900" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15, duration: 0.5 }}>{w}</motion.span>
      ))}
    </div>
  );
};

/* ============ 23. 滚动进度 ============ */
const ScrollProgress: React.FC<PackComponentProps> = (props) => {
  const color = (props.color as string) ?? "#6366f1";
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2 px-4">
      <div className="w-full h-1.5 rounded-full bg-gray-200 overflow-hidden">
        <motion.div className="h-full rounded-full" style={{ background: color }} animate={{ width: ["0%", "100%"] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
      </div>
      <span className="text-[10px] text-gray-500">{props.text ?? "Loading..."}</span>
    </div>
  );
};

/* ============ 24. 渐变边框 ============ */
const GradientBorder: React.FC<PackComponentProps> = (props) => {
  const color = (props.color as string) ?? "#6366f1";
  return (
    <div className="w-full h-full flex items-center justify-center p-2">
      <div className="w-full h-full rounded-xl p-[2px]" style={{ background: `linear-gradient(135deg, ${color}, #ec4899, ${color})` }}>
        <div className="w-full h-full rounded-[10px] bg-white flex items-center justify-center">
          <span className="text-xs font-medium text-gray-800">{props.text ?? "Gradient"}</span>
        </div>
      </div>
    </div>
  );
};

/* ============ 25. 弹跳徽章 ============ */
const BounceBadge: React.FC<PackComponentProps> = (props) => {
  const color = (props.color as string) ?? "#6366f1";
  return (
    <div className="w-full h-full flex items-center justify-center">
      <motion.span className="px-3 py-1 rounded-full text-[10px] font-semibold text-white" style={{ background: color }} animate={{ y: [0, -6, 0] }} transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}>
        {props.text ?? "New"}
      </motion.span>
    </div>
  );
};

/* ============ 26. 粒子文字 ============ */
const ParticleText: React.FC<PackComponentProps> = (props) => {
  const color = (props.color as string) ?? "#6366f1";
  const text = props.text ?? "Hello";
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-950 rounded-xl overflow-hidden relative">
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div key={i} className="absolute w-1 h-1 rounded-full" style={{ background: color }} initial={{ x: 0, y: 0, opacity: 0 }} animate={{ x: (Math.random() - 0.5) * 80, y: (Math.random() - 0.5) * 40, opacity: [0, 1, 0] }} transition={{ duration: 2 + Math.random(), repeat: Infinity, delay: Math.random() * 2 }} />
      ))}
      <span className="relative z-10 text-lg font-bold text-white">{text}</span>
    </div>
  );
};

/* ============ 27. 流星雨 ============ */
const MeteorShower: React.FC<PackComponentProps> = (props) => {
  const color = (props.color as string) ?? "#6366f1";
  return (
    <div className="w-full h-full bg-gray-950 rounded-xl overflow-hidden relative flex items-center justify-center">
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div key={i} className="absolute w-0.5 rounded-full" style={{ height: 20 + Math.random() * 30, background: `linear-gradient(to bottom, ${color}, transparent)`, left: `${10 + Math.random() * 80}%`, top: "-30px" }} animate={{ y: [0, 200], opacity: [1, 0] }} transition={{ duration: 1.5 + Math.random(), repeat: Infinity, delay: Math.random() * 3, ease: "linear" }} />
      ))}
      <span className="relative z-10 text-xs font-medium text-white/80">{props.text ?? "Meteors"}</span>
    </div>
  );
};

/* ============ 28. 呼吸光环 ============ */
const BreathingGlow: React.FC<PackComponentProps> = (props) => {
  const color = (props.color as string) ?? "#6366f1";
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-950 rounded-xl">
      <motion.div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: `${color}22`, boxShadow: `0 0 30px ${color}44` }} animate={{ scale: [1, 1.2, 1], boxShadow: [`0 0 20px ${color}33`, `0 0 50px ${color}66`, `0 0 20px ${color}33`] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
        <div className="w-8 h-8 rounded-full" style={{ background: color }} />
      </motion.div>
    </div>
  );
};

/* ============ 29. 卡片堆叠 ============ */
const CardStack: React.FC<PackComponentProps> = (props) => {
  const color = (props.color as string) ?? "#6366f1";
  const [idx, setIdx] = React.useState(0);
  React.useEffect(() => { const t = setInterval(() => setIdx((i) => (i + 1) % 3), 2000); return () => clearInterval(t); }, []);
  const cards = ["A", "B", "C"];
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-xl">
      <div className="relative w-24 h-16">
        {cards.map((c, i) => {
          const offset = (i - idx + 3) % 3;
          return (
            <motion.div key={c} className="absolute inset-0 rounded-lg border border-gray-200 bg-white shadow-sm flex items-center justify-center text-xs font-bold" style={{ color }} animate={{ y: offset * 8, scale: 1 - offset * 0.05, zIndex: 3 - offset }} transition={{ duration: 0.4 }}>
              {props.text ?? c}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

/* ============ 30. 波浪进度 ============ */
const WaveProgress: React.FC<PackComponentProps> = (props) => {
  const color = (props.color as string) ?? "#6366f1";
  const pct = 65;
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-xl">
      <div className="relative w-16 h-16 rounded-full overflow-hidden border-2" style={{ borderColor: color }}>
        <motion.div className="absolute bottom-0 left-0 right-0" style={{ background: `${color}44`, height: `${pct}%` }} animate={{ y: [0, -2, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} />
        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color }}>{pct}%</div>
      </div>
    </div>
  );
};

/* ============ 导出 ============ */
export const magicUIComponents: Record<string, React.FC<PackComponentProps>> = {
  "mu-animated-beam": AnimatedBeam,
  "mu-border-beam": BorderBeam,
  "mu-shine-border": ShineBorder,
  "mu-magic-card": MagicCard,
  "mu-number-ticker": NumberTicker,
  "mu-word-rotate": WordRotate,
  "mu-letter-pullup": LetterPullup,
  "mu-blur-fade": BlurFade,
  "mu-gradual-spacing": GradualSpacing,
  "mu-shimmer-button": ShimmerButton,
  "mu-ripple": Ripple,
  "mu-dot-pattern": DotPattern,
  "mu-grid-pattern": GridPattern,
  "mu-retro-grid": RetroGrid,
  "mu-sparkles": Sparkles,
  "mu-text-reveal": TextReveal,
  "mu-orbit": Orbit,
  "mu-pulsating-button": PulsatingButton,
  "mu-aurora": Aurora,
  "mu-flip-button": FlipButton,
  "mu-typing-animation": TypingAnimation,
  "mu-word-fade-in": WordFadeIn,
  "mu-scroll-progress": ScrollProgress,
  "mu-gradient-border": GradientBorder,
  "mu-bounce-badge": BounceBadge,
  "mu-particle-text": ParticleText,
  "mu-meteor-shower": MeteorShower,
  "mu-breathing-glow": BreathingGlow,
  "mu-card-stack": CardStack,
  "mu-wave-progress": WaveProgress,
};
