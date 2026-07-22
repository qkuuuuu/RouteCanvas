"use client";
import * as React from "react";
import { motion } from "framer-motion";

export interface PackComponentProps {
  text?: string;
  imageSrc?: string;
  interactive?: boolean;
  onTrigger?: () => void;
  [key: string]: unknown;
}

/* ---- 通用 props 提取工具 ---- */
function useColor(props: PackComponentProps, fallback = "#6366f1") {
  return (props.color as string) || fallback;
}
function useSpeed(props: PackComponentProps, fallback = 1) {
  const v = Number(props.speed);
  return v > 0 ? v : fallback;
}
function useSize(props: PackComponentProps): "sm" | "md" | "lg" {
  const s = props.size as string;
  return s === "sm" || s === "lg" ? s : "md";
}
const sizeMap = { sm: "text-xs px-2 py-1", md: "text-sm px-4 py-2", lg: "text-base px-6 py-3" };

/* ---------- ShimmerButton ---------- */
export const ShimmerButton: React.FC<PackComponentProps> = (props) => {
  const { text, interactive, onTrigger } = props;
  const color = useColor(props);
  const speed = useSpeed(props);
  const size = useSize(props);
  return (
    <motion.button
      whileTap={interactive ? { scale: 0.96 } : undefined}
      onClick={interactive ? onTrigger : undefined}
      className={`relative w-full h-full overflow-hidden rounded-xl px-4 py-2 font-medium text-white ${sizeMap[size]}`}
      style={{ background: "#0f172a" }}
    >
      <span className="relative z-10">{text ?? "Shimmer"}</span>
      <motion.span
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
        animate={{ x: ["-100%", "200%"] }}
        transition={{ duration: 1.5 / speed, repeat: Infinity, ease: "linear" }}
        style={{ backgroundImage: `linear-gradient(to right, transparent, ${color}44, transparent)` }}
      />
    </motion.button>
  );
};

/* ---------- GradientText ---------- */
export const GradientText: React.FC<PackComponentProps> = (props) => {
  const { text } = props;
  const color = useColor(props);
  const speed = useSpeed(props, 3);
  return (
    <span
      className="w-full inline-block bg-clip-text text-transparent font-bold text-lg text-center"
      style={{ backgroundImage: `linear-gradient(to right, ${color}, #ec4899, ${color})`, backgroundSize: "200% auto" }}
    >
      <motion.span
        animate={{ backgroundPosition: ["0% 50%", "200% 50%"] }}
        transition={{ duration: 3 / speed, repeat: Infinity, ease: "linear" }}
        style={{ backgroundClip: "text", WebkitBackgroundClip: "text" }}
        className="inline-block"
      >
        {text ?? "Gradient Text"}
      </motion.span>
    </span>
  );
};

/* ---------- CardHover (3D tilt) ---------- */
export const CardHover: React.FC<PackComponentProps> = ({ text, interactive, onTrigger }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = React.useState({ x: 0, y: 0 });

  const onMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const px = (cx / rect.width - 0.5) * 2;
    const py = (cy / rect.height - 0.5) * 2;
    setRotate({ x: -py * 8, y: px * 8 });
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={() => setRotate({ x: 0, y: 0 })}
      onClick={interactive ? onTrigger : undefined}
      style={{
        transformStyle: "preserve-3d",
        rotateX: rotate.x,
        rotateY: rotate.y,
      }}
      className="w-full h-full rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-4 shadow-lg flex flex-col items-center justify-center"
    >
      <div className="text-sm font-semibold text-gray-800">{text ?? "Hover Card"}</div>
      <div className="text-[10px] text-gray-400 mt-1">Move to tilt</div>
    </motion.div>
  );
};

/* ---------- LoadingDots ---------- */
export const LoadingDots: React.FC<PackComponentProps> = () => {
  return (
    <div className="w-full h-full flex items-center justify-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-2.5 w-2.5 rounded-full bg-blue-500"
          animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
};

/* ---------- SpotlightCard ---------- */
export const SpotlightCard: React.FC<PackComponentProps> = ({ text, interactive, onTrigger }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [pos, setPos] = React.useState({ x: -100, y: -100 });

  return (
    <div
      ref={ref}
      onMouseMove={(e) => {
        const rect = ref.current!.getBoundingClientRect();
        setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }}
      onClick={interactive ? onTrigger : undefined}
      className="relative w-full h-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 p-4 group cursor-pointer"
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          background: `radial-gradient(200px circle at ${pos.x}px ${pos.y}px, rgba(59,130,246,0.15), transparent 80%)`,
        }}
      />
      <div className="relative z-10 text-sm font-medium text-gray-700">{text ?? "Spotlight"}</div>
    </div>
  );
};

/* ---------- AnimatedText (letter stagger) ---------- */
export const AnimatedText: React.FC<PackComponentProps> = ({ text }) => {
  const chars = (text ?? "Animated").split("");
  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden">
      {chars.map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04, duration: 0.3 }}
          className="inline-block text-sm font-semibold text-gray-800"
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </div>
  );
};

/* ---------- Typewriter ---------- */
export const Typewriter: React.FC<PackComponentProps> = ({ text }) => {
  const full = text ?? "Hello World";
  const [display, setDisplay] = React.useState("");
  React.useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplay(full.slice(0, i));
      if (i >= full.length) clearInterval(timer);
    }, 80);
    return () => clearInterval(timer);
  }, [full]);
  return (
    <div className="w-full h-full flex items-center justify-center">
      <span className="text-sm font-mono font-medium text-gray-800">{display}</span>
      <motion.span className="inline-block w-0.5 h-4 bg-gray-800 ml-0.5" animate={{ opacity: [1, 0] }} transition={{ duration: 0.6, repeat: Infinity }} />
    </div>
  );
};

/* ---------- PulseButton ---------- */
export const PulseButton: React.FC<PackComponentProps> = ({ text, interactive, onTrigger }) => (
  <div className="w-full h-full flex items-center justify-center">
    <motion.button
      onClick={interactive ? onTrigger : undefined}
      className="relative px-5 py-2.5 rounded-full bg-blue-600 text-white text-sm font-medium"
      animate={{ boxShadow: ["0 0 0 0 rgba(59,130,246,0.4)", "0 0 0 12px rgba(59,130,246,0)", "0 0 0 0 rgba(59,130,246,0)"] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    >
      {text ?? "Pulse"}
    </motion.button>
  </div>
);

/* ---------- CountUp ---------- */
export const CountUp: React.FC<PackComponentProps> = ({ text }) => {
  const target = Number(text) || 100;
  const [val, setVal] = React.useState(0);
  React.useEffect(() => {
    let start = 0;
    const step = Math.ceil(target / 40);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(timer); }
      else setVal(start);
    }, 30);
    return () => clearInterval(timer);
  }, [target]);
  return (
    <div className="w-full h-full flex items-center justify-center">
      <span className="text-2xl font-bold text-gray-900">{val.toLocaleString()}</span>
    </div>
  );
};

/* ---------- Marquee ---------- */
export const Marquee: React.FC<PackComponentProps> = ({ text }) => {
  const content = text ?? "React Bits • Amazing Components • ";
  return (
    <div className="w-full h-full flex items-center overflow-hidden">
      <motion.div
        className="whitespace-nowrap text-sm font-medium text-gray-700"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
      >
        {content.repeat(4)}
      </motion.div>
    </div>
  );
};

/* ---------- BlurText ---------- */
export const BlurText: React.FC<PackComponentProps> = ({ text }) => {
  const words = (text ?? "Blur Reveal").split(" ");
  return (
    <div className="w-full h-full flex items-center justify-center flex-wrap gap-x-1">
      {words.map((w, i) => (
        <motion.span
          key={i}
          initial={{ filter: "blur(8px)", opacity: 0, y: 8 }}
          animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
          transition={{ delay: i * 0.12, duration: 0.4 }}
          className="text-sm font-semibold text-gray-800"
        >
          {w}
        </motion.span>
      ))}
    </div>
  );
};

/* ---------- RippleButton ---------- */
export const RippleButton: React.FC<PackComponentProps> = ({ text, interactive, onTrigger }) => {
  const [ripples, setRipples] = React.useState<{ x: number; y: number; id: number }[]>([]);
  const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples((r) => [...r, { x, y, id }]);
    setTimeout(() => setRipples((r) => r.filter((rp) => rp.id !== id)), 600);
    if (interactive) onTrigger?.();
  };
  return (
    <button onClick={onClick} className="relative w-full h-full overflow-hidden rounded-lg bg-indigo-600 text-white text-sm font-medium">
      {text ?? "Ripple"}
      {ripples.map((r) => (
        <motion.span
          key={r.id}
          className="absolute rounded-full bg-white/30"
          style={{ left: r.x - 5, top: r.y - 5, width: 10, height: 10 }}
          animate={{ scale: 20, opacity: 0 }}
          transition={{ duration: 0.6 }}
        />
      ))}
    </button>
  );
};

/* ---------- ParticlesBg ---------- */
export const ParticlesBg: React.FC<PackComponentProps> = ({ text }) => (
  <div className="relative w-full h-full overflow-hidden rounded-xl bg-slate-900 flex items-center justify-center">
    {Array.from({ length: 20 }).map((_, i) => (
      <motion.span
        key={i}
        className="absolute w-1 h-1 rounded-full bg-blue-400"
        style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
        animate={{ y: [0, -20, 0], opacity: [0.2, 0.8, 0.2] }}
        transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
      />
    ))}
    <span className="relative z-10 text-sm font-semibold text-white">{text ?? "Particles"}</span>
  </div>
);

/* ---------- FlipText ---------- */
export const FlipText: React.FC<PackComponentProps> = ({ text }) => {
  const chars = (text ?? "Flip").split("");
  return (
    <div className="w-full h-full flex items-center justify-center">
      {chars.map((c, i) => (
        <motion.span
          key={i}
          className="inline-block text-lg font-bold text-gray-800"
          animate={{ rotateX: [0, 360] }}
          transition={{ duration: 0.6, delay: i * 0.1, repeat: Infinity, repeatDelay: 2 }}
        >
          {c === " " ? "\u00A0" : c}
        </motion.span>
      ))}
    </div>
  );
};

/* ---------- ProgressRing ---------- */
export const ProgressRing: React.FC<PackComponentProps> = ({ text }) => {
  const pct = Math.min(100, Number(text) || 75);
  const r = 28;
  const circ = 2 * Math.PI * r;
  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke="#e5e7eb" strokeWidth="6" />
        <motion.circle
          cx="36" cy="36" r={r} fill="none" stroke="#6366f1" strokeWidth="6"
          strokeLinecap="round" strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - pct / 100) }}
          transition={{ duration: 1, ease: "easeOut" }}
          transform="rotate(-90 36 36)"
        />
        <text x="36" y="40" textAnchor="middle" className="text-xs font-bold" fill="#374151" fontSize="12">{pct}%</text>
      </svg>
    </div>
  );
};

/* ---------- WaveText ---------- */
export const WaveText: React.FC<PackComponentProps> = ({ text }) => {
  const chars = (text ?? "Wave").split("");
  return (
    <div className="w-full h-full flex items-center justify-center">
      {chars.map((c, i) => (
        <motion.span
          key={i}
          className="inline-block text-base font-bold text-indigo-600"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 0.8, delay: i * 0.08, repeat: Infinity }}
        >
          {c === " " ? "\u00A0" : c}
        </motion.span>
      ))}
    </div>
  );
};

/* ---------- NeonButton ---------- */
export const NeonButton: React.FC<PackComponentProps> = ({ text, interactive, onTrigger }) => (
  <div className="w-full h-full flex items-center justify-center">
    <motion.button
      onClick={interactive ? onTrigger : undefined}
      className="px-5 py-2 rounded-lg border-2 border-cyan-400 text-cyan-400 text-sm font-bold bg-transparent"
      whileHover={{ boxShadow: "0 0 20px rgba(34,211,238,0.6), inset 0 0 20px rgba(34,211,238,0.1)", textShadow: "0 0 8px rgba(34,211,238,0.8)" }}
      animate={{ boxShadow: ["0 0 5px rgba(34,211,238,0.3)", "0 0 15px rgba(34,211,238,0.5)", "0 0 5px rgba(34,211,238,0.3)"] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      {text ?? "Neon"}
    </motion.button>
  </div>
);

/* ---------- SlideCards ---------- */
export const SlideCards: React.FC<PackComponentProps> = ({ text }) => (
  <div className="w-full h-full flex items-center justify-center overflow-hidden">
    <motion.div
      className="flex gap-2"
      animate={{ x: [0, -60, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    >
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="w-16 h-20 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-md">
          {text ?? `Card ${i}`}
        </div>
      ))}
    </motion.div>
  </div>
);

/* ---------- BounceBadge ---------- */
export const BounceBadge: React.FC<PackComponentProps> = ({ text }) => (
  <div className="w-full h-full flex items-center justify-center">
    <motion.span
      className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold"
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
    >
      {text ?? "New"}
    </motion.span>
  </div>
);

/* ---------- GlitchText ---------- */
export const GlitchText: React.FC<PackComponentProps> = ({ text }) => {
  const t = text ?? "Glitch";
  return (
    <div className="w-full h-full flex items-center justify-center relative">
      <span className="text-lg font-bold text-gray-900 relative z-10">{t}</span>
      <motion.span className="absolute text-lg font-bold text-red-500 opacity-60" animate={{ x: [-2, 2, -1, 0], y: [1, -1, 0, 1] }} transition={{ duration: 0.3, repeat: Infinity, repeatDelay: 1.5 }}>{t}</motion.span>
      <motion.span className="absolute text-lg font-bold text-cyan-500 opacity-60" animate={{ x: [2, -2, 1, 0], y: [-1, 1, 0, -1] }} transition={{ duration: 0.3, repeat: Infinity, repeatDelay: 1.8 }}>{t}</motion.span>
    </div>
  );
};

/* ---------- Orbit ---------- */
export const Orbit: React.FC<PackComponentProps> = ({ text }) => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 rounded-full border border-gray-200" />
      <motion.div className="absolute w-3 h-3 rounded-full bg-blue-500 -top-1.5 left-1/2 -ml-1.5" animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} style={{ transformOrigin: "50% 38px" }} />
      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-700">{text ?? "Orbit"}</div>
    </div>
  </div>
);

/* ---------- MagneticButton ---------- */
export const MagneticButton: React.FC<PackComponentProps> = ({ text, interactive, onTrigger }) => {
  const ref = React.useRef<HTMLButtonElement>(null);
  const [pos, setPos] = React.useState({ x: 0, y: 0 });
  return (
    <div className="w-full h-full flex items-center justify-center">
      <button ref={ref} onClick={interactive ? onTrigger : undefined} onMouseMove={(e) => { const r = ref.current!.getBoundingClientRect(); setPos({ x: (e.clientX - r.left - r.width / 2) * 0.3, y: (e.clientY - r.top - r.height / 2) * 0.3 }); }} onMouseLeave={() => setPos({ x: 0, y: 0 })} style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }} className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium transition-transform duration-200">{text ?? "Magnetic"}</button>
    </div>
  );
};

/* ---------- BorderBeam ---------- */
export const BorderBeam: React.FC<PackComponentProps> = ({ text }) => (
  <div className="w-full h-full flex items-center justify-center p-2">
    <div className="relative w-full h-full rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden">
      <motion.div className="absolute w-12 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent" animate={{ top: ["0%", "100%"], left: ["0%", "80%"] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} />
      <span className="text-xs font-medium text-gray-600">{text ?? "Beam"}</span>
    </div>
  </div>
);

/* ---------- BreathingCircle ---------- */
export const BreathingCircle: React.FC<PackComponentProps> = ({ text }) => (
  <div className="w-full h-full flex items-center justify-center">
    <motion.div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center" animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
      <span className="text-[9px] text-white font-bold">{text ?? "Breathe"}</span>
    </motion.div>
  </div>
);

/* ---------- TypingIndicator ---------- */
export const TypingIndicator: React.FC<PackComponentProps> = () => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="flex items-center gap-1 bg-gray-100 rounded-full px-3 py-2">
      {[0, 1, 2].map((i) => (
        <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
      ))}
    </div>
  </div>
);

/* ---------- RainbowButton ---------- */
export const RainbowButton: React.FC<PackComponentProps> = ({ text, interactive, onTrigger }) => (
  <div className="w-full h-full flex items-center justify-center">
    <motion.button onClick={interactive ? onTrigger : undefined} className="px-4 py-2 rounded-lg text-white text-sm font-bold" style={{ background: "linear-gradient(90deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)", backgroundSize: "400% 100%" }} animate={{ backgroundPosition: ["0% 50%", "100% 50%"] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}>{text ?? "Rainbow"}</motion.button>
  </div>
);

/* ---------- FloatCard ---------- */
export const FloatCard: React.FC<PackComponentProps> = ({ text }) => (
  <div className="w-full h-full flex items-center justify-center">
    <motion.div className="w-3/4 h-3/4 rounded-xl bg-white shadow-lg border border-gray-100 flex items-center justify-center" animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
      <span className="text-xs font-medium text-gray-600">{text ?? "Float"}</span>
    </motion.div>
  </div>
);

/* ---------- ShakeButton ---------- */
export const ShakeButton: React.FC<PackComponentProps> = ({ text, interactive, onTrigger }) => (
  <div className="w-full h-full flex items-center justify-center">
    <motion.button onClick={interactive ? onTrigger : undefined} className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium" whileHover={{ x: [-2, 2, -2, 2, 0], transition: { duration: 0.3 } }}>{text ?? "Shake"}</motion.button>
  </div>
);

/* ---------- RotateText ---------- */
export const RotateText: React.FC<PackComponentProps> = ({ text }) => {
  const words = (text ?? "Rotate").split("");
  return (
    <div className="w-full h-full flex items-center justify-center">
      {words.map((c, i) => (
        <motion.span key={i} className="inline-block text-base font-bold text-purple-600" animate={{ rotateY: [0, 360] }} transition={{ duration: 2, delay: i * 0.15, repeat: Infinity, repeatDelay: 1 }}>{c === " " ? "\u00A0" : c}</motion.span>
      ))}
    </div>
  );
};

/* ---------- GradientOrb ---------- */
export const GradientOrb: React.FC<PackComponentProps> = () => (
  <div className="w-full h-full flex items-center justify-center">
    <motion.div className="w-16 h-16 rounded-full" style={{ background: "radial-gradient(circle at 30% 30%, #a78bfa, #6366f1, #312e81)" }} animate={{ scale: [1, 1.1, 1], rotate: [0, 180, 360] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} />
  </div>
);

/* ---------- SplitText ---------- */
export const SplitText: React.FC<PackComponentProps> = ({ text }) => {
  const chars = (text ?? "Split").split("");
  return (
    <div className="w-full h-full flex items-center justify-center">
      {chars.map((c, i) => (
        <motion.span key={i} className="inline-block text-base font-bold text-gray-800" initial={{ y: i % 2 === 0 ? -20 : 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.08, type: "spring", stiffness: 200 }}>{c === " " ? "\u00A0" : c}</motion.span>
      ))}
    </div>
  );
};

/* ---------- HoverLink ---------- */
export const HoverLink: React.FC<PackComponentProps> = ({ text }) => (
  <div className="w-full h-full flex items-center justify-center">
    <span className="relative text-sm font-medium text-blue-600 cursor-pointer group">
      {text ?? "Hover Link"}
      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full" />
    </span>
  </div>
);

/* ---------- AnimatedDivider ---------- */
export const AnimatedDivider: React.FC<PackComponentProps> = () => (
  <div className="w-full h-full flex items-center justify-center px-4">
    <motion.div className="h-0.5 w-full bg-gradient-to-r from-transparent via-blue-500 to-transparent" animate={{ scaleX: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} />
  </div>
);

/* ---------- ConfettiBurst ---------- */
export const ConfettiBurst: React.FC<PackComponentProps> = ({ text }) => (
  <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
    {["#f43f5e", "#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899"].map((c, i) => (
      <motion.span key={i} className="absolute w-2 h-2 rounded-sm" style={{ background: c }} animate={{ y: [0, -40 - Math.random() * 30], x: [(Math.random() - 0.5) * 60], opacity: [1, 0], rotate: [0, 360] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }} />
    ))}
    <span className="text-xs font-bold text-gray-700">{text ?? "🎉"}</span>
  </div>
);

/* ---------- PixelReveal ---------- */
export const PixelReveal: React.FC<PackComponentProps> = ({ text }) => (
  <div className="w-full h-full flex items-center justify-center">
    <motion.span className="text-sm font-bold text-gray-800" initial={{ filter: "blur(4px)", opacity: 0 }} animate={{ filter: "blur(0px)", opacity: 1 }} transition={{ duration: 1, repeat: Infinity, repeatDelay: 2, repeatType: "reverse" }}>{text ?? "Pixel"}</motion.span>
  </div>
);

/* ---------- SwingBadge ---------- */
export const SwingBadge: React.FC<PackComponentProps> = ({ text }) => (
  <div className="w-full h-full flex items-center justify-center">
    <motion.span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold" animate={{ rotate: [-3, 3, -3] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>{text ?? "Badge"}</motion.span>
  </div>
);

/* ---------- SlideText ---------- */
export const SlideText: React.FC<PackComponentProps> = ({ text }) => (
  <div className="w-full h-full flex items-center justify-center overflow-hidden">
    <motion.span className="text-sm font-bold text-gray-800" animate={{ x: [-100, 0], opacity: [0, 1] }} transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2 }}>{text ?? "Slide In"}</motion.span>
  </div>
);

/* ---------- HeartBeat ---------- */
export const HeartBeat: React.FC<PackComponentProps> = ({ text }) => (
  <div className="w-full h-full flex items-center justify-center">
    <motion.span className="text-2xl" animate={{ scale: [1, 1.3, 1, 1.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }}>❤️</motion.span>
    <span className="ml-1 text-xs text-gray-500">{text ?? "Like"}</span>
  </div>
);

/* ---------- SpinnerRing ---------- */
export const SpinnerRing: React.FC<PackComponentProps> = () => (
  <div className="w-full h-full flex items-center justify-center">
    <motion.div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-blue-500" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
  </div>
);

/* ---------- TiltCard ---------- */
export const TiltCard: React.FC<PackComponentProps> = ({ text }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = React.useState({ x: 0, y: 0 });
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ perspective: 600 }}>
      <motion.div
        ref={ref}
        className="w-[80%] h-[70%] rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold shadow-lg"
        animate={{ rotateX: tilt.y, rotateY: tilt.x }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        onMouseMove={(e) => { const r = ref.current?.getBoundingClientRect(); if (!r) return; const px = (e.clientX - r.left) / r.width - 0.5; const py = (e.clientY - r.top) / r.height - 0.5; setTilt({ x: px * 20, y: -py * 20 }); }}
        onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      >{text ?? "Tilt Card"}</motion.div>
    </div>
  );
};

/* ---------- MorphBtn ---------- */
export const MorphBtn: React.FC<PackComponentProps> = ({ text, interactive, onTrigger }) => {
  const [morphed, setMorphed] = React.useState(false);
  return (
    <div className="w-full h-full flex items-center justify-center">
      <motion.button
        className="text-white text-sm font-semibold overflow-hidden flex items-center justify-center"
        animate={morphed ? { width: 40, height: 40, borderRadius: "50%", background: "#22c55e" } : { width: 120, height: 40, borderRadius: 12, background: "#6366f1" }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        onClick={() => { setMorphed(!morphed); interactive && onTrigger?.(); }}
      >{morphed ? "✓" : (text ?? "Submit")}</motion.button>
    </div>
  );
};

/* ---------- StaggerList ---------- */
export const StaggerList: React.FC<PackComponentProps> = ({ text }) => (
  <div className="w-full h-full flex flex-col justify-center gap-1.5 px-4">
    {[0, 1, 2, 3].map((i) => (
      <motion.div key={i} className="h-6 rounded bg-indigo-100 flex items-center px-3 text-xs text-indigo-700" initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.12, duration: 0.3 }}>
        {(text ?? "Item") + " " + (i + 1)}
      </motion.div>
    ))}
  </div>
);

/* ---------- ParallaxCard ---------- */
export const ParallaxCard: React.FC<PackComponentProps> = ({ text }) => (
  <div className="w-full h-full flex items-center justify-center overflow-hidden">
    <motion.div className="relative w-[75%] h-[65%] rounded-xl overflow-hidden shadow-md" whileHover="hover">
      <motion.div className="absolute inset-0 bg-gradient-to-br from-sky-400 to-indigo-600" variants={{ hover: { scale: 1.1 } }} transition={{ duration: 0.4 }} />
      <motion.div className="absolute bottom-2 left-3 text-white text-sm font-bold" variants={{ hover: { y: -4 } }} transition={{ duration: 0.3 }}>{text ?? "Parallax"}</motion.div>
    </motion.div>
  </div>
);

/* ---------- ElasticBtn ---------- */
export const ElasticBtn: React.FC<PackComponentProps> = ({ text, interactive, onTrigger }) => (
  <div className="w-full h-full flex items-center justify-center">
    <motion.button
      className="px-5 py-2 rounded-xl bg-rose-500 text-white text-sm font-semibold"
      whileTap={{ scale: 0.7 }}
      transition={{ type: "spring", stiffness: 500, damping: 10 }}
      onClick={interactive ? onTrigger : undefined}
    >{text ?? "Elastic"}</motion.button>
  </div>
);

/* ---------- RevealText ---------- */
export const RevealText: React.FC<PackComponentProps> = ({ text }) => (
  <div className="w-full h-full flex items-center justify-center overflow-hidden">
    <motion.span className="text-lg font-bold text-gray-800" initial={{ clipPath: "inset(0 100% 0 0)" }} animate={{ clipPath: "inset(0 0% 0 0)" }} transition={{ duration: 1, ease: "easeInOut" }}>{text ?? "Reveal"}</motion.span>
  </div>
);

/* ---------- OrbitDots ---------- */
export const OrbitDots: React.FC<PackComponentProps> = () => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="relative w-16 h-16">
      {[0, 1, 2].map((i) => (
        <motion.span key={i} className="absolute top-1/2 left-1/2 w-2.5 h-2.5 rounded-full" style={{ background: ["#6366f1", "#ec4899", "#f59e0b"][i] }} animate={{ rotate: 360 }} transition={{ duration: 2 + i * 0.5, repeat: Infinity, ease: "linear" }} initial={{ x: -5, y: -5, offsetDistance: `${i * 33}%` }} />
      ))}
      <div className="absolute inset-0 m-auto w-3 h-3 rounded-full bg-gray-800" />
    </div>
  </div>
);

/* ---------- WaveDivider ---------- */
export const WaveDivider: React.FC<PackComponentProps> = () => (
  <div className="w-full h-full flex items-center justify-center">
    <svg viewBox="0 0 200 30" className="w-[90%] h-8">
      <motion.path d="M0,15 Q25,5 50,15 T100,15 T150,15 T200,15" fill="none" stroke="#6366f1" strokeWidth="2" animate={{ d: ["M0,15 Q25,5 50,15 T100,15 T150,15 T200,15", "M0,15 Q25,25 50,15 T100,15 T150,15 T200,15", "M0,15 Q25,5 50,15 T100,15 T150,15 T200,15"] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
    </svg>
  </div>
);

/* ---------- FlipCard ---------- */
export const FlipCard: React.FC<PackComponentProps> = ({ text }) => {
  const [flipped, setFlipped] = React.useState(false);
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ perspective: 600 }}>
      <motion.div className="w-[70%] h-[60%] cursor-pointer" style={{ transformStyle: "preserve-3d" }} animate={{ rotateY: flipped ? 180 : 0 }} transition={{ duration: 0.5 }} onClick={() => setFlipped(!flipped)}>
        <div className="absolute inset-0 rounded-xl bg-indigo-500 flex items-center justify-center text-white text-sm font-semibold" style={{ backfaceVisibility: "hidden" }}>{text ?? "Front"}</div>
        <div className="absolute inset-0 rounded-xl bg-emerald-500 flex items-center justify-center text-white text-sm font-semibold" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>Back</div>
      </motion.div>
    </div>
  );
};

/* ---------- ProgressWave ---------- */
export const ProgressWave: React.FC<PackComponentProps> = ({ text }) => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="relative w-14 h-14 rounded-full border-2 border-indigo-200 overflow-hidden">
      <motion.div className="absolute bottom-0 left-0 right-0 bg-indigo-500/70" animate={{ height: ["20%", "80%", "20%"] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-indigo-800">{text ?? "75%"}</span>
    </div>
  </div>
);

/* ---------- ShakeInput ---------- */
export const ShakeInput: React.FC<PackComponentProps> = ({ text }) => {
  const [shake, setShake] = React.useState(false);
  return (
    <div className="w-full h-full flex items-center justify-center">
      <motion.input
        className="w-[70%] px-3 py-1.5 rounded-lg border border-gray-300 text-sm outline-none focus:border-red-400"
        placeholder={text ?? "Enter email"}
        animate={shake ? { x: [0, -6, 6, -4, 4, 0] } : {}}
        transition={{ duration: 0.4 }}
        onAnimationComplete={() => setShake(false)}
        onFocus={() => setShake(true)}
      />
    </div>
  );
};

/* ---------- GlowCard ---------- */
export const GlowCard: React.FC<PackComponentProps> = ({ text }) => (
  <div className="w-full h-full flex items-center justify-center">
    <motion.div
      className="relative w-[75%] h-[65%] rounded-xl bg-gray-900 flex items-center justify-center text-white text-sm font-medium"
      whileHover="hover"
    >
      <motion.div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 blur-md -z-10" variants={{ hover: { opacity: 0.7 } }} transition={{ duration: 0.3 }} />
      {text ?? "Glow Card"}
    </motion.div>
  </div>
);

/* ---------- NEW: TextScramble ---------- */
const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
export const TextScramble: React.FC<PackComponentProps> = (props) => {
  const { text } = props;
  const color = useColor(props);
  const speed = useSpeed(props);
  const target = text ?? "DECRYPT";
  const [display, setDisplay] = React.useState(target);
  React.useEffect(() => {
    let frame = 0;
    const total = Math.ceil(20 / speed);
    const id = setInterval(() => {
      frame++;
      setDisplay(target.split("").map((c, i) => (i < (frame / total) * target.length ? c : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)])).join(""));
      if (frame >= total) { clearInterval(id); setDisplay(target); }
    }, 50);
    return () => clearInterval(id);
  }, [target, speed]);
  return <div className="w-full h-full flex items-center justify-center font-mono font-bold text-lg" style={{ color }}>{display}</div>;
};

/* ---------- NEW: GradientBorderCard ---------- */
export const GradientBorderCard: React.FC<PackComponentProps> = (props) => {
  const { text } = props;
  const color = useColor(props);
  return (
    <div className="w-full h-full p-[2px] rounded-2xl" style={{ background: `linear-gradient(135deg, ${color}, #ec4899, #06b6d4)` }}>
      <div className="w-full h-full rounded-2xl bg-white flex items-center justify-center text-sm font-semibold text-gray-700">
        {text ?? "Gradient Border"}
      </div>
    </div>
  );
};

/* ---------- NEW: AnimatedCounter ---------- */
export const AnimatedCounter: React.FC<PackComponentProps> = (props) => {
  const { text } = props;
  const color = useColor(props);
  const speed = useSpeed(props);
  const target = parseInt(text ?? "100", 10) || 100;
  const [val, setVal] = React.useState(0);
  React.useEffect(() => {
    let start = 0;
    const step = Math.ceil(target / (30 / speed));
    const id = setInterval(() => { start += step; if (start >= target) { setVal(target); clearInterval(id); } else setVal(start); }, 30);
    return () => clearInterval(id);
  }, [target, speed]);
  return <div className="w-full h-full flex items-center justify-center text-3xl font-extrabold tabular-nums" style={{ color }}>{val.toLocaleString()}</div>;
};

/* ---------- NEW: GlowPulse ---------- */
export const GlowPulse: React.FC<PackComponentProps> = (props) => {
  const color = useColor(props);
  const speed = useSpeed(props);
  const size = useSize(props);
  const dim = size === "sm" ? 40 : size === "lg" ? 80 : 60;
  return (
    <div className="w-full h-full flex items-center justify-center">
      <motion.div className="rounded-full" style={{ width: dim, height: dim, background: color }} animate={{ boxShadow: [`0 0 8px ${color}66`, `0 0 24px ${color}`, `0 0 8px ${color}66`], scale: [1, 1.1, 1] }} transition={{ duration: 2 / speed, repeat: Infinity }} />
    </div>
  );
};

/* ---------- NEW: BounceText ---------- */
export const BounceText: React.FC<PackComponentProps> = (props) => {
  const { text } = props;
  const color = useColor(props);
  const speed = useSpeed(props);
  const chars = (text ?? "Bounce").split("");
  return (
    <div className="w-full h-full flex items-center justify-center gap-0.5 text-xl font-bold" style={{ color }}>
      {chars.map((c, i) => (
        <motion.span key={i} animate={{ y: [0, -10, 0] }} transition={{ duration: 0.6 / speed, repeat: Infinity, delay: i * 0.08 }}>{c}</motion.span>
      ))}
    </div>
  );
};

/* ---------- NEW: MorphingShape ---------- */
export const MorphingShape: React.FC<PackComponentProps> = (props) => {
  const color = useColor(props);
  const speed = useSpeed(props);
  const size = useSize(props);
  const dim = size === "sm" ? 50 : size === "lg" ? 100 : 70;
  return (
    <div className="w-full h-full flex items-center justify-center">
      <motion.div style={{ width: dim, height: dim, background: `linear-gradient(135deg, ${color}, #ec4899)` }} animate={{ borderRadius: ["20%", "50%", "30% 70%", "20%"], rotate: [0, 90, 180, 360] }} transition={{ duration: 4 / speed, repeat: Infinity, ease: "easeInOut" }} />
    </div>
  );
};

/* ---------- NEW: SpotlightText ---------- */
export const SpotlightText: React.FC<PackComponentProps> = (props) => {
  const { text } = props;
  const color = useColor(props);
  const speed = useSpeed(props, 2);
  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden">
      <motion.span className="text-2xl font-extrabold" style={{ backgroundImage: `linear-gradient(90deg, #374151 40%, ${color} 50%, #374151 60%)`, backgroundSize: "200% 100%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }} animate={{ backgroundPosition: ["200% 0", "-200% 0"] }} transition={{ duration: 3 / speed, repeat: Infinity, ease: "linear" }}>
        {text ?? "Spotlight"}
      </motion.span>
    </div>
  );
};

/* ---------- NEW: TiltGallery ---------- */
export const TiltGallery: React.FC<PackComponentProps> = (props) => {
  const { text } = props;
  const color = useColor(props);
  const items = (text ?? "A,B,C").split(",").slice(0, 4);
  return (
    <div className="w-full h-full grid grid-cols-2 gap-2 p-2">
      {items.map((item, i) => (
        <motion.div key={i} whileHover={{ rotateX: 5, rotateY: -5, scale: 1.05 }} className="rounded-xl flex items-center justify-center text-xs font-bold text-white" style={{ background: `${color}${["cc", "99", "77", "55"][i % 4]}` }}>
          {item.trim()}
        </motion.div>
      ))}
    </div>
  );
};

export const reactBitsComponents = {
  "rb-shimmer-button": ShimmerButton,
  "rb-gradient-text": GradientText,
  "rb-card-hover": CardHover,
  "rb-loading-dots": LoadingDots,
  "rb-spotlight-card": SpotlightCard,
  "rb-animated-text": AnimatedText,
  "rb-typewriter": Typewriter,
  "rb-pulse-button": PulseButton,
  "rb-count-up": CountUp,
  "rb-marquee": Marquee,
  "rb-blur-text": BlurText,
  "rb-ripple-button": RippleButton,
  "rb-particles": ParticlesBg,
  "rb-flip-text": FlipText,
  "rb-progress-ring": ProgressRing,
  "rb-wave-text": WaveText,
  "rb-neon-button": NeonButton,
  "rb-slide-cards": SlideCards,
  "rb-bounce-badge": BounceBadge,
  "rb-glitch-text": GlitchText,
  "rb-orbit": Orbit,
  "rb-magnetic-btn": MagneticButton,
  "rb-border-beam": BorderBeam,
  "rb-breathing": BreathingCircle,
  "rb-typing-indicator": TypingIndicator,
  "rb-rainbow-btn": RainbowButton,
  "rb-float-card": FloatCard,
  "rb-shake-btn": ShakeButton,
  "rb-rotate-text": RotateText,
  "rb-gradient-orb": GradientOrb,
  "rb-split-text": SplitText,
  "rb-hover-link": HoverLink,
  "rb-animated-divider": AnimatedDivider,
  "rb-confetti": ConfettiBurst,
  "rb-pixel-reveal": PixelReveal,
  "rb-swing-badge": SwingBadge,
  "rb-slide-text": SlideText,
  "rb-heart-beat": HeartBeat,
  "rb-spinner-ring": SpinnerRing,
  "rb-tilt-card": TiltCard,
  "rb-morph-btn": MorphBtn,
  "rb-stagger-list": StaggerList,
  "rb-parallax-card": ParallaxCard,
  "rb-elastic-btn": ElasticBtn,
  "rb-reveal-text": RevealText,
  "rb-orbit-dots": OrbitDots,
  "rb-wave-divider": WaveDivider,
  "rb-flip-card": FlipCard,
  "rb-progress-wave": ProgressWave,
  "rb-shake-input": ShakeInput,
  "rb-glow-card": GlowCard,
  "rb-text-scramble": TextScramble,
  "rb-gradient-border-card": GradientBorderCard,
  "rb-animated-counter": AnimatedCounter,
  "rb-glow-pulse": GlowPulse,
  "rb-bounce-text": BounceText,
  "rb-morphing-shape": MorphingShape,
  "rb-spotlight-text": SpotlightText,
  "rb-tilt-gallery": TiltGallery,
};
