"use client";
import * as React from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import type { PackComponentProps } from "../react-bits/components";

/* ============ 1. 3D轮播 ============ */
const Carousel3D: React.FC<PackComponentProps> = (props) => {
  const items = ["A", "B", "C", "D", "E", "F"];
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ perspective: "600px" }}>
      <motion.div
        className="relative w-16 h-20"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      >
        {items.map((item, i) => (
          <div
            key={i}
            className="absolute inset-0 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold border border-white/20 backface-hidden"
            style={{ transform: `rotateY(${i * 60}deg) translateZ(60px)` }}
          >
            {item}
          </div>
        ))}
      </motion.div>
    </div>
  );
};

/* ============ 2. 旋转立方体 ============ */
const Cube3D: React.FC<PackComponentProps> = () => {
  const faces = [
    { label: "前", transform: "translateZ(30px)" },
    { label: "后", transform: "rotateY(180deg) translateZ(30px)" },
    { label: "右", transform: "rotateY(90deg) translateZ(30px)" },
    { label: "左", transform: "rotateY(-90deg) translateZ(30px)" },
    { label: "上", transform: "rotateX(90deg) translateZ(30px)" },
    { label: "下", transform: "rotateX(-90deg) translateZ(30px)" },
  ];
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ perspective: "400px" }}>
      <motion.div
        className="relative w-[60px] h-[60px]"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateX: 360, rotateY: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      >
        {faces.map((f) => (
          <div
            key={f.label}
            className="absolute inset-0 rounded-md bg-indigo-500/80 border border-indigo-300/50 flex items-center justify-center text-white text-xs font-bold backdrop-blur-sm"
            style={{ transform: f.transform }}
          >
            {f.label}
          </div>
        ))}
      </motion.div>
    </div>
  );
};

/* ============ 3. 3D翻转卡片 ============ */
const FlipCard3D: React.FC<PackComponentProps> = (props) => {
  const [flipped, setFlipped] = React.useState(false);
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ perspective: "800px" }}>
      <motion.div
        className="relative w-32 h-20 cursor-pointer"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.6 }}
        onClick={() => setFlipped(!flipped)}
      >
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold backface-hidden">
          {props.text ?? "正面"}
        </div>
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-xs font-bold" style={{ transform: "rotateY(180deg)", backfaceVisibility: "hidden" }}>
          背面内容
        </div>
      </motion.div>
    </div>
  );
};

/* ============ 4. 鼠标倾斜卡片 ============ */
const TiltCard: React.FC<PackComponentProps> = (props) => {
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  const rotateX = useTransform(y, [0, 1], [12, -12]);
  const rotateY = useTransform(x, [0, 1], [-12, 12]);
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ perspective: "600px" }}>
      <motion.div
        className="w-36 h-24 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 flex items-center justify-center shadow-xl"
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          x.set((e.clientX - rect.left) / rect.width);
          y.set((e.clientY - rect.top) / rect.height);
        }}
        onMouseLeave={() => { x.set(0.5); y.set(0.5); }}
      >
        <span className="text-white text-xs font-medium" style={{ transform: "translateZ(20px)" }}>{props.text ?? "Tilt Card"}</span>
      </motion.div>
    </div>
  );
};

/* ============ 5. 多层视差 ============ */
const ParallaxLayers: React.FC<PackComponentProps> = () => (
  <div className="w-full h-full relative overflow-hidden rounded-xl bg-gray-950" style={{ perspective: "300px" }}>
    <motion.div className="absolute inset-0 flex items-center justify-center" animate={{ z: [0, 20, 0] }} transition={{ duration: 4, repeat: Infinity }}>
      <div className="w-20 h-14 rounded-lg bg-blue-600/30 border border-blue-500/40" />
    </motion.div>
    <motion.div className="absolute inset-0 flex items-center justify-center" animate={{ z: [0, -15, 0] }} transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}>
      <div className="w-28 h-20 rounded-lg bg-purple-600/20 border border-purple-500/30" />
    </motion.div>
    <motion.div className="absolute inset-0 flex items-center justify-center" animate={{ z: [0, 35, 0] }} transition={{ duration: 4, repeat: Infinity, delay: 1 }}>
      <div className="w-12 h-8 rounded bg-cyan-500/40 border border-cyan-400/50" />
    </motion.div>
    <span className="absolute bottom-2 left-0 right-0 text-center text-[9px] text-gray-500">3D Parallax Layers</span>
  </div>
);

/* ============ 6. 透视网格 ============ */
const PerspectiveGrid: React.FC<PackComponentProps> = () => (
  <div className="w-full h-full overflow-hidden rounded-xl bg-gray-950 flex items-end justify-center">
    <div style={{ perspective: "200px", perspectiveOrigin: "50% 30%" }} className="w-full h-full">
      <motion.div
        className="w-full h-[200%]"
        style={{
          transform: "rotateX(60deg)",
          transformOrigin: "center top",
          backgroundImage: "linear-gradient(#6366f155 1px, transparent 1px), linear-gradient(90deg, #6366f155 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
        animate={{ backgroundPositionY: ["0px", "20px"] }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
    </div>
  </div>
);

/* ============ 7. 3D旋转环 ============ */
const RotatingRing: React.FC<PackComponentProps> = () => {
  const dots = Array.from({ length: 12 });
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ perspective: "500px" }}>
      <motion.div
        className="relative w-20 h-20"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: 360 }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
      >
        {dots.map((_, i) => (
          <div
            key={i}
            className="absolute w-2.5 h-2.5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
            style={{
              top: "50%", left: "50%",
              transform: `rotateY(${i * 30}deg) translateZ(36px) translate(-50%, -50%)`,
              boxShadow: "0 0 6px rgba(34,211,238,0.5)",
            }}
          />
        ))}
      </motion.div>
    </div>
  );
};

/* ============ 8. 3D卡片堆叠 ============ */
const CardStack3D: React.FC<PackComponentProps> = () => (
  <div className="w-full h-full flex items-center justify-center" style={{ perspective: "600px" }}>
    <div className="relative" style={{ transformStyle: "preserve-3d", transform: "rotateX(10deg) rotateY(-10deg)" }}>
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="absolute w-28 h-18 rounded-lg border shadow-md flex items-center justify-center text-[10px] font-medium"
          style={{
            width: 112, height: 72,
            background: `hsl(${220 + i * 20}, 70%, ${95 - i * 5}%)`,
            borderColor: `hsl(${220 + i * 20}, 60%, 80%)`,
            transform: `translateZ(${i * -12}px) translateY(${i * 4}px)`,
            color: `hsl(${220 + i * 20}, 50%, 40%)`,
          }}
          animate={{ y: [i * 4, i * 4 - 3, i * 4] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
        >
          Card {i + 1}
        </motion.div>
      ))}
    </div>
  </div>
);

/* ============ 9. 3D立体文字 ============ */
const Text3D: React.FC<PackComponentProps> = (props) => (
  <div className="w-full h-full flex items-center justify-center bg-gray-950 rounded-xl">
    <motion.span
      className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500"
      style={{ textShadow: "0 1px 0 #333, 0 2px 0 #2a2a2a, 0 3px 0 #222, 0 4px 8px rgba(0,0,0,0.5)" }}
      animate={{ rotateX: [0, 5, 0, -5, 0] }}
      transition={{ duration: 4, repeat: Infinity }}
    >
      {props.text ?? "3D Text"}
    </motion.span>
  </div>
);

/* ============ 10. CSS线框球 ============ */
const WireSphere: React.FC<PackComponentProps> = () => (
  <div className="w-full h-full flex items-center justify-center" style={{ perspective: "500px" }}>
    <motion.div
      className="relative w-20 h-20 rounded-full border-2 border-cyan-400/50"
      style={{ transformStyle: "preserve-3d" }}
      animate={{ rotateY: 360, rotateX: 15 }}
      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
    >
      {[0, 30, 60, 90, 120, 150].map((deg) => (
        <div key={deg} className="absolute inset-0 rounded-full border border-cyan-400/30" style={{ transform: `rotateY(${deg}deg)` }} />
      ))}
      <div className="absolute inset-x-0 top-1/4 h-px bg-cyan-400/30" />
      <div className="absolute inset-x-0 top-1/2 h-px bg-cyan-400/40" />
      <div className="absolute inset-x-0 top-3/4 h-px bg-cyan-400/30" />
    </motion.div>
  </div>
);

/* ============ 11. 旋转金字塔 ============ */
const Pyramid3D: React.FC<PackComponentProps> = () => (
  <div className="w-full h-full flex items-center justify-center" style={{ perspective: "500px" }}>
    <motion.div
      className="relative w-16 h-16"
      style={{ transformStyle: "preserve-3d" }}
      animate={{ rotateY: 360 }}
      transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
    >
      {[0, 90, 180, 270].map((deg) => (
        <div
          key={deg}
          className="absolute bottom-0 left-1/2 w-0 h-0"
          style={{
            borderLeft: "30px solid transparent",
            borderRight: "30px solid transparent",
            borderBottom: "52px solid rgba(245,158,11,0.6)",
            transformOrigin: "bottom center",
            transform: `translateX(-50%) rotateY(${deg}deg) rotateX(30deg)`,
          }}
        />
      ))}
    </motion.div>
  </div>
);

/* ============ 12. 波浪3D卡片 ============ */
const WaveCards: React.FC<PackComponentProps> = () => (
  <div className="w-full h-full flex items-center justify-center gap-1" style={{ perspective: "400px" }}>
    {Array.from({ length: 7 }).map((_, i) => (
      <motion.div
        key={i}
        className="w-5 h-14 rounded-md bg-gradient-to-t from-blue-600 to-cyan-400"
        animate={{ rotateX: [0, 25, 0, -25, 0], y: [0, -6, 0, 6, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.15 }}
      />
    ))}
  </div>
);

/* ============ 13. 深度层叠 ============ */
const DepthLayers: React.FC<PackComponentProps> = (props) => (
  <div className="w-full h-full flex items-center justify-center rounded-xl bg-gray-950" style={{ perspective: "500px" }}>
    <motion.div
      style={{ transformStyle: "preserve-3d", transform: "rotateX(20deg) rotateY(-15deg)" }}
      animate={{ rotateY: [-15, 15, -15] }}
      transition={{ duration: 6, repeat: Infinity }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="absolute w-24 h-16 rounded-lg border flex items-center justify-center text-[9px] font-medium"
          style={{
            transform: `translateZ(${i * 20}px)`,
            background: `rgba(99,102,241,${0.1 + i * 0.1})`,
            borderColor: `rgba(99,102,241,${0.3 + i * 0.2})`,
            color: `rgba(199,210,254,${0.5 + i * 0.2})`,
          }}
        >
          {i === 2 ? (props.text ?? "Top") : `Layer ${i + 1}`}
        </div>
      ))}
    </motion.div>
  </div>
);

/* ============ 14. 摇摆3D卡片 ============ */
const SwingCard: React.FC<PackComponentProps> = (props) => (
  <div className="w-full h-full flex items-center justify-center" style={{ perspective: "600px" }}>
    <motion.div
      className="w-32 h-20 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 shadow-lg flex items-center justify-center"
      style={{ transformOrigin: "top center", transformStyle: "preserve-3d" }}
      animate={{ rotateZ: [-3, 3, -3], rotateX: [2, -2, 2] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    >
      <span className="text-white text-xs font-bold">{props.text ?? "Swing"}</span>
    </motion.div>
  </div>
);

/* ============ 15. 螺旋列表 ============ */
const HelixList: React.FC<PackComponentProps> = () => (
  <div className="w-full h-full flex items-center justify-center" style={{ perspective: "500px" }}>
    <motion.div
      className="relative"
      style={{ transformStyle: "preserve-3d" }}
      animate={{ rotateY: 360 }}
      transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="absolute px-2 py-1 rounded bg-emerald-500/80 text-white text-[8px] font-medium whitespace-nowrap border border-emerald-300/30"
          style={{ transform: `rotateY(${i * 45}deg) translateZ(40px) translateY(${(i - 4) * 8}px)` }}
        >
          Item {i + 1}
        </div>
      ))}
    </motion.div>
  </div>
);

/* ============ 16. 翻转方块 ============ */
const FlipTile: React.FC<PackComponentProps> = () => (
  <div className="w-full h-full flex items-center justify-center" style={{ perspective: "500px" }}>
    <motion.div className="w-14 h-14 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold" style={{ transformStyle: "preserve-3d" }} animate={{ rotateX: [0, 90, 180, 270, 360] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>Flip</motion.div>
  </div>
);

/* ============ 17. 缩放卡片 ============ */
const ZoomCard: React.FC<PackComponentProps> = (props) => (
  <div className="w-full h-full flex items-center justify-center" style={{ perspective: "600px" }}>
    <motion.div className="w-32 h-20 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg" whileHover={{ scale: 1.15, rotateY: 5 }} transition={{ type: "spring", stiffness: 300 }}>
      <span className="text-white text-xs font-bold">{props.text ?? "Zoom"}</span>
    </motion.div>
  </div>
);

/* ============ 18. 旋转文字 ============ */
const RotateText3D: React.FC<PackComponentProps> = (props) => (
  <div className="w-full h-full flex items-center justify-center bg-gray-950 rounded-xl" style={{ perspective: "400px" }}>
    <motion.span className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500" animate={{ rotateY: [0, 360] }} transition={{ duration: 5, repeat: Infinity, ease: "linear" }} style={{ transformStyle: "preserve-3d" }}>{props.text ?? "3D"}</motion.span>
  </div>
);

/* ============ 19. 层叠背景 ============ */
const LayeredBg: React.FC<PackComponentProps> = () => (
  <div className="w-full h-full relative overflow-hidden rounded-xl bg-gray-950" style={{ perspective: "400px" }}>
    {[0, 1, 2, 3].map((i) => (
      <motion.div key={i} className="absolute inset-0 rounded-xl border border-indigo-500/20" style={{ transform: `translateZ(${i * -20}px) scale(${1 + i * 0.1})` }} animate={{ opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 3, repeat: Infinity, delay: i * 0.4 }} />
    ))}
    <div className="absolute inset-0 flex items-center justify-center"><span className="text-xs font-bold text-indigo-400">Layers</span></div>
  </div>
);

/* ============ 20. 轨道环 ============ */
const OrbitRing: React.FC<PackComponentProps> = () => (
  <div className="w-full h-full flex items-center justify-center" style={{ perspective: "500px" }}>
    <div className="relative w-20 h-20" style={{ transformStyle: "preserve-3d" }}>
      {[0, 60, 120].map((deg) => (
        <motion.div key={deg} className="absolute inset-0 rounded-full border border-purple-500/40" style={{ transform: `rotateX(${deg}deg)` }} animate={{ rotateZ: 360 }} transition={{ duration: 6, repeat: Infinity, ease: "linear" }} />
      ))}
      <div className="absolute inset-0 flex items-center justify-center"><div className="w-3 h-3 rounded-full bg-purple-500 shadow-lg shadow-purple-500/50" /></div>
    </div>
  </div>
);

/* ============ 导出 ============ */
export const threeDComponents: Record<string, React.FC<PackComponentProps>> = {
  "3d-carousel": Carousel3D,
  "3d-cube": Cube3D,
  "3d-flip-card": FlipCard3D,
  "3d-tilt-card": TiltCard,
  "3d-parallax-layers": ParallaxLayers,
  "3d-perspective-grid": PerspectiveGrid,
  "3d-rotating-ring": RotatingRing,
  "3d-card-stack": CardStack3D,
  "3d-text": Text3D,
  "3d-wire-sphere": WireSphere,
  "3d-pyramid": Pyramid3D,
  "3d-wave-cards": WaveCards,
  "3d-depth-layers": DepthLayers,
  "3d-swing-card": SwingCard,
  "3d-helix-list": HelixList,
  "3d-flip-tile": FlipTile,
  "3d-zoom-card": ZoomCard,
  "3d-rotate-text": RotateText3D,
  "3d-layered-bg": LayeredBg,
  "3d-orbit-ring": OrbitRing,
};
