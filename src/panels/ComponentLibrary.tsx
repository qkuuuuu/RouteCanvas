"use client";
import * as React from "react";
import { createPortal } from "react-dom";
import { ImagePlus, Search, ChevronDown, ChevronRight } from "lucide-react";
import * as Lucide from "lucide-react";
import { useCanvasStore } from "@/store/canvasStore";
import { getMergedRegistry } from "@/components/registry";
import { BUILTIN_COMPONENTS } from "@/components/builtin";
import { PACK_COMPONENTS } from "@/components/packs";
import type { PackComponentProps } from "@/components/packs";
import { CssSandbox } from "@/components/sandbox/cssSandbox";
import { toast } from "@/lib/toast";
import type { ComponentDef } from "@/types/schema";

/* ---------- 分类映射：旧分类 → 新二级分类 ---------- */
const SUB_CATEGORY_MAP: Record<string, { category: string; subCategory?: string }> = {
  "基础": { category: "基础", subCategory: "通用" },
  "展示": { category: "基础", subCategory: "展示" },
  "反馈": { category: "基础", subCategory: "反馈" },
  "图标": { category: "基础", subCategory: "图标" },
  "导航": { category: "基础", subCategory: "导航" },
  "表单": { category: "表单" },
  "React Bits": { category: "React Bits" },
  "Aceternity UI": { category: "Aceternity UI" },
  "Magic UI": { category: "Magic UI" },
  "Shadcn": { category: "Shadcn" },
  "Dashboard": { category: "Dashboard" },
  "动态背景": { category: "动态背景" },
  "3D特效": { category: "3D特效" },
  "3D场景": { category: "3D场景" },
  "uiverse": { category: "uiverse" },
};

function resolveCategory(def: ComponentDef): { category: string; subCategory?: string } {
  // 如果 def 已经有显式 subCategory，直接使用
  if (def.subCategory) return { category: def.category ?? "其它", subCategory: def.subCategory };
  const cat = def.category ?? "其它";
  const mapped = SUB_CATEGORY_MAP[cat];
  // 映射有明确 subCategory 时直接返回（如 基础>展示）
  if (mapped?.subCategory) return mapped;
  // pack / css 组件智能推断子分类
  if (def.source === "pack" || def.source === "css") {
    return { category: cat, subCategory: inferPackSubCategory(def.id) };
  }
  if (mapped) return mapped;
  return { category: cat };
}

/** 根据组件 ID 模式推断 pack 组件子分类 */
function inferPackSubCategory(id: string): string {
  // 按钮类
  if (/btn|button|shimmer-button|pulse$|pulsating|elastic|morph|shake-btn|magnetic|neon-btn|glowing-btn|floating-btn|flip-button|gradient-btn|anim-button|ripple-button|pulse-button/.test(id)) return "按钮";
  // 背景类
  if (/bg|background|beam$|beams|aurora|vortex|grid-pattern|dot-pattern|retro-grid|particles|meteors|shooting|wavy|gradient-mesh|gradient-orb|lamp|animated-beam|glowing-stars|sparkles|anim-bg|beam-bg/.test(id)) return "背景";
  // 卡片类
  if (/card|bento|dock|stack|comparison|stagger-cards|focus-cards|direction-aware|magic-card|glass|spot-card|anim-card/.test(id)) return "卡片";
  // 文字类
  if (/text|typewriter|typing-animation|word|letter|blur-fade|gradual-spacing|counter|flip-words|pressure|generate|reveal-text|split|glitch|wave-text|rotate-text|slide-text|pixel|fade-in|neon-text|anim-text|count-up|blur-text|flip-text|gradient-text|animated-text/.test(id)) return "文字";
  // 加载/进度类
  if (/load|spinner|progress|shimmer$|ring$|pulse-ring|scroll-progress|breathing|anim-loader|loading-dots|spin-border/.test(id)) return "加载";
  // 徽章/标签类
  if (/badge|tag|chip|bounce-badge|swing|anim-badge|star-rating/.test(id)) return "徽章";
  // 布局/导航类
  if (/timeline|tabs|marquee|divider|modal|slider$|mac-os|infinite|moving|menu|tooltip|cursor|confetti|orbit$|orbit-dots|accordion|stepper|breadcrumb/.test(id)) return "布局";
  // 表单类
  if (/toggle|switch|checkbox|input|search|label|select|radio/.test(id)) return "表单";
  // 边框/效果类
  if (/border|shine|ripple|sparkle|glow|neon|spotlight|hover|tilt|parallax|3d|flip$|wave-divider|skeleton|alert|notification|pricing/.test(id)) return "效果";
  return "通用";
}

/* ---------- 图标组件预览 ---------- */
function IconPreview({ id }: { id: string }) {
  const name = id.startsWith("Icon-") ? id.slice(5) : null;
  if (!name) return null;
  const IconComp = (Lucide as unknown as Record<string, React.FC<{ size?: number; className?: string }>>)[name];
  if (!IconComp) return null;
  return <IconComp size={14} className="inline-block mr-0.5 text-gray-500" />;
}

/* ---------- 悬停预览浮层 ---------- */
function HoverPreview({ def, rect }: { def: ComponentDef; rect: DOMRect }) {
  const style: React.CSSProperties = {
    position: "fixed",
    top: rect.top,
    left: rect.right + 8,
    width: 180,
    height: 100,
    zIndex: 9999,
    pointerEvents: "none",
  };

  // 如果右侧空间不够，放左边
  if (rect.right + 196 > window.innerWidth) {
    style.left = rect.left - 188;
  }

  let content: React.ReactNode;
  switch (def.source) {
    case "css":
      content = <CssSandbox html={def.html ?? ""} css={def.css} />;
      break;
    case "pack": {
      const C = PACK_COMPONENTS[def.id] as React.FC<PackComponentProps> | undefined;
      content = C ? <C text={def.label} /> : <span className="text-xs text-gray-400">{def.label}</span>;
      break;
    }
    case "builtin": {
      const key = def.id.startsWith("Icon-") ? "Icon" : def.id;
      const C = BUILTIN_COMPONENTS[key];
      const builtinProps = def.id.startsWith("Icon-")
        ? { custom: { iconName: def.id.slice(5) } }
        : { text: def.label };
      content = C ? <C props={builtinProps} /> : <span className="text-xs text-gray-400">{def.label}</span>;
      break;
    }
    default:
      content = <span className="text-xs text-gray-500 font-medium">{def.label}</span>;
  }

  return createPortal(
    <div style={style} className="rounded-lg border border-gray-200 bg-white shadow-xl overflow-hidden flex items-center justify-center p-1">
      <div className="w-full h-full overflow-hidden">{content}</div>
    </div>,
    document.body,
  );
}

/* ---------- 主组件 ---------- */
export function ComponentLibrary({ embedded = false }: { embedded?: boolean }) {
  const registry = useCanvasStore((s) => s.componentRegistry);
  const addNode = useCanvasStore((s) => s.addNode);
  const unregisterComponent = useCanvasStore((s) => s.unregisterComponent);
  const clearTempComponents = useCanvasStore((s) => s.clearTempComponents);
  const [query, setQuery] = React.useState("");
  const [collapsed, setCollapsed] = React.useState<Set<string>>(new Set());
  const initedRef = React.useRef(false);
  const imgInputRef = React.useRef<HTMLInputElement>(null);
  const [hoverDef, setHoverDef] = React.useState<ComponentDef | null>(null);
  const [hoverRect, setHoverRect] = React.useState<DOMRect | null>(null);
  const hoverTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const defs = React.useMemo(() => getMergedRegistry(registry), [registry]);

  // 临时组件（runtime）与常规组件分离展示，避免污染共享组件库
  const tempDefs = React.useMemo(() => defs.filter((d) => d.source === "runtime"), [defs]);
  const normalDefs = React.useMemo(() => defs.filter((d) => d.source !== "runtime"), [defs]);

  const filteredTemp = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tempDefs;
    return tempDefs.filter(
      (d) => d.label.toLowerCase().includes(q) || d.id.toLowerCase().includes(q),
    );
  }, [tempDefs, query]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return normalDefs;
    return normalDefs.filter(
      (d) => d.label.toLowerCase().includes(q) || d.id.toLowerCase().includes(q),
    );
  }, [normalDefs, query]);

  // 二级分组: category → subCategory → items
  const grouped = React.useMemo(() => {
    const catMap = new Map<string, Map<string, ComponentDef[]>>();
    for (const d of filtered) {
      const { category, subCategory } = resolveCategory(d);
      if (!catMap.has(category)) catMap.set(category, new Map());
      const subMap = catMap.get(category)!;
      const subKey = subCategory ?? "__flat__";
      if (!subMap.has(subKey)) subMap.set(subKey, []);
      subMap.get(subKey)!.push(d);
    }
    return [...catMap.entries()];
  }, [filtered]);

  React.useEffect(() => {
    if (initedRef.current || grouped.length === 0) return;
    initedRef.current = true;
    const cats = grouped.map(([cat]) => cat);
    setCollapsed(new Set(cats.slice(2)));
  }, [grouped]);

  const effectiveCollapsed = query.trim() ? new Set<string>() : collapsed;

  const toggleCat = (cat: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const onDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("application/routecanvas-component", id);
    e.dataTransfer.effectAllowed = "copy";
  };

  // 悬停预览
  const onItemEnter = (e: React.MouseEvent, def: ComponentDef) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    hoverTimer.current = setTimeout(() => {
      setHoverDef(def);
      setHoverRect(rect);
    }, 300);
  };
  const onItemLeave = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setHoverDef(null);
    setHoverRect(null);
  };

  const onImportImage = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("请选择图片文件 (png/jpg/svg/webp)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const store = useCanvasStore.getState();
      const page = store.pages[0];
      if (!page) { toast.warning("请先创建一个页面"); return; }
      addNode(page.id, "Image", {
        position: { x: 60 + Math.random() * 80, y: 60 + Math.random() * 80 },
        size: { width: 200, height: 150 },
        props: { imageSrc: dataUrl, text: file.name },
      });
      toast.success(`已导入图片：${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  const renderItem = (d: ComponentDef) => (
    <div
      key={d.id}
      draggable
      onDragStart={(e) => onDragStart(e, d.id)}
      onMouseEnter={(e) => onItemEnter(e, d)}
      onMouseLeave={onItemLeave}
      className="cursor-grab active:cursor-grabbing rounded-md border border-gray-200 hover:border-blue-400 hover:bg-blue-50 px-2 py-2 text-center text-xs text-gray-700 select-none flex items-center justify-center gap-0.5"
      title={`拖入页面：${d.label}`}
    >
      <IconPreview id={d.id} />
      <span className="truncate">{d.label}</span>
    </div>
  );

  // 临时组件项：带删除按钮
  const renderTempItem = (d: ComponentDef) => (
    <div
      key={d.id}
      draggable
      onDragStart={(e) => onDragStart(e, d.id)}
      onMouseEnter={(e) => onItemEnter(e, d)}
      onMouseLeave={onItemLeave}
      className="group relative cursor-grab active:cursor-grabbing rounded-md border border-amber-200 bg-amber-50 hover:border-amber-400 px-2 py-2 text-center text-xs text-gray-700 select-none flex items-center justify-center gap-0.5"
      title={`拖入页面：${d.label}（临时组件）`}
    >
      <span className="truncate">{d.label}</span>
      <button
        className="absolute -top-1.5 -right-1.5 hidden group-hover:flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-[10px] leading-none hover:bg-red-600"
        title="删除临时组件"
        onClick={(e) => {
          e.stopPropagation();
          unregisterComponent(d.id);
        }}
      >
        ×
      </button>
    </div>
  );

  return (
    <aside className={`${embedded ? "h-full min-h-0 w-full" : "w-56 shrink-0 border-r"} bg-white flex flex-col overflow-hidden`}>
      <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500">组件库</span>
        <button onClick={() => imgInputRef.current?.click()} className="inline-flex items-center gap-0.5 text-xs text-green-600 hover:text-green-700" title="导入图片">
          <ImagePlus size={13} />
        </button>
      </div>
      <div className="px-2 py-2 border-b border-gray-100">
        <div className="relative">
          <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索组件..."
            className="w-full h-7 rounded-md border border-gray-200 pl-7 pr-2 text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>
      <input
        ref={imgInputRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onImportImage(f); e.target.value = ""; }}
      />
      <div className="component-scrollbar flex-1 overflow-y-scroll p-2 pr-1.5 space-y-1">
        {filteredTemp.length > 0 && (
          <div className="mb-1 rounded-md border border-amber-200 bg-amber-50/60 p-1.5">
            <div className="flex items-center gap-1 px-0.5 pb-1">
              <span className="text-[10px] font-semibold text-amber-600">本画布·临时</span>
              <span className="text-[10px] text-amber-400">{filteredTemp.length}</span>
              <button
                className="ml-auto text-[10px] text-red-500 hover:text-red-600"
                onClick={() => clearTempComponents()}
                title="清空所有临时组件"
              >
                清空
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5 px-0.5">{filteredTemp.map(renderTempItem)}</div>
          </div>
        )}
        {grouped.length === 0 && filteredTemp.length === 0 && (
          <div className="text-center text-xs text-gray-400 py-8">未找到匹配组件</div>
        )}
        {grouped.map(([cat, subMap]) => {
          const isCollapsed = effectiveCollapsed.has(cat);
          const totalItems = [...subMap.values()].reduce((s, arr) => s + arr.length, 0);
          return (
            <div key={cat}>
              <button onClick={() => toggleCat(cat)} className="w-full flex items-center gap-1 px-1 py-1 rounded hover:bg-gray-50 text-left">
                {isCollapsed ? <ChevronRight size={12} className="text-gray-400" /> : <ChevronDown size={12} className="text-gray-400" />}
                <span className="text-[10px] uppercase tracking-wide text-gray-500 font-medium">{cat}</span>
                <span className="text-[10px] text-gray-300 ml-auto">{totalItems}</span>
              </button>
              {!isCollapsed && (
                <div className="pb-2">
                  {[...subMap.entries()].map(([subKey, items]) => (
                    <div key={subKey}>
                      {subKey !== "__flat__" && (
                        <div className="px-1.5 pt-1.5 pb-0.5 text-[9px] text-gray-400 font-medium">{subKey}</div>
                      )}
                      <div className="grid grid-cols-2 gap-1.5 px-0.5 pt-0.5">
                        {items.map(renderItem)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {hoverDef && hoverRect && <HoverPreview def={hoverDef} rect={hoverRect} />}
    </aside>
  );
}
