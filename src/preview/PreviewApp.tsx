"use client";
import * as React from "react";
import { useState, useMemo } from "react";
import { Monitor, Smartphone, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import type { CanvasState, Page, ComponentDef, UINode, Transition } from "@/types/schema";
import { findComponentDef } from "@/components/registry";
import { renderComponent } from "@/components/renderer";
import { buildRouteMap, findEntry, substituteParams } from "./router";

const PERSIST_KEY = "routecanvas-doc";

/* ============ Scroll 分组工具 ============ */
/** 从 transitions 中找出所有 scroll 链，返回 pageId → 有序页面列表 */
function buildScrollGroups(transitions: Transition[]): Map<string, string[]> {
  // 找出所有 scroll 边
  const scrollEdges = transitions.filter((t) => t.mode === "scroll");
  if (scrollEdges.length === 0) return new Map();

  // 构建有向图: sourcePageId → targetPageId
  const next = new Map<string, string>();
  const hasIncoming = new Set<string>();
  for (const e of scrollEdges) {
    next.set(e.source.pageId, e.target.pageId);
    hasIncoming.add(e.target.pageId);
  }

  // 找链头（没有入边的页面）
  const heads = [...next.keys()].filter((id) => !hasIncoming.has(id));
  const groups: string[][] = [];
  for (const head of heads) {
    const chain: string[] = [head];
    let cur = head;
    const visited = new Set<string>([head]);
    while (next.has(cur)) {
      const nxt = next.get(cur)!;
      if (visited.has(nxt)) break; // 防环
      visited.add(nxt);
      chain.push(nxt);
      cur = nxt;
    }
    if (chain.length > 1) groups.push(chain);
  }

  // 映射: 每个 pageId → 其所属的有序列表
  const result = new Map<string, string[]>();
  for (const chain of groups) {
    for (const pid of chain) {
      result.set(pid, chain);
    }
  }
  return result;
}

function loadFromStorage(): CanvasState | null {
  try {
    const raw = localStorage.getItem(PERSIST_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      meta: parsed.state?.meta ?? parsed.meta,
      pages: parsed.state?.pages ?? parsed.pages ?? [],
      transitions: parsed.state?.transitions ?? parsed.transitions ?? [],
      componentRegistry:
        parsed.state?.componentRegistry ?? parsed.componentRegistry ?? [],
    } as CanvasState;
  } catch {
    return null;
  }
}

/* ============ Section 感知的渲染器 ============ */
const SECTION_TYPES = new Set(["Section", "AnimSection", "ParallaxSection"]);

const ANIM_VARIANTS: Record<string, { initial: Record<string, number>; whileInView: Record<string, number> }> = {
  "fade-up": { initial: { opacity: 0, y: 60 }, whileInView: { opacity: 1, y: 0 } },
  "fade-in": { initial: { opacity: 0 }, whileInView: { opacity: 1 } },
  "slide-left": { initial: { opacity: 0, x: 80 }, whileInView: { opacity: 1, x: 0 } },
  "slide-right": { initial: { opacity: 0, x: -80 }, whileInView: { opacity: 1, x: 0 } },
  "scale": { initial: { opacity: 0, scale: 0.85 }, whileInView: { opacity: 1, scale: 1 } },
  "flip": { initial: { opacity: 0, rotateX: 15 }, whileInView: { opacity: 1, rotateX: 0 } },
};

interface SARProps {
  page: Page;
  registry: ComponentDef[];
  routeMap: Map<string, { target: { pageId: string }; guard?: { requireAuth?: boolean } }[]>;
  navigate: (pageId: string, requireAuth?: boolean) => void;
}

function SectionAwareRenderer({ page, registry, routeMap, navigate }: SARProps) {
  const sections = page.nodes.filter((n) => SECTION_TYPES.has(n.type));

  // 无 Section 时走原有绝对定位渲染
  if (sections.length === 0) {
    return (
      <div className="relative" style={{ width: page.layout.width, height: page.layout.height }}>
        {page.nodes.map((n) => (
          <PreviewNode key={n.id} node={n} registry={registry} routeMap={routeMap} navigate={navigate} />
        ))}
      </div>
    );
  }

  // 有 Section：按 Y 排序，生成 scroll-snap 流式布局
  const sorted = [...sections].sort((a, b) => a.position.y - b.position.y);
  const sectionIds = new Set(sorted.map((s) => s.id));

  // 将非 Section 节点分配给其覆盖的 Section（中心点落在哪个 Section 范围内）
  const childMap = new Map<string, UINode[]>();
  const orphans: UINode[] = [];
  sorted.forEach((s) => childMap.set(s.id, []));

  for (const n of page.nodes) {
    if (sectionIds.has(n.id)) continue;
    const cx = n.position.x + n.size.width / 2;
    const cy = n.position.y + n.size.height / 2;
    const owner = sorted.find(
      (s) => cx >= s.position.x && cx <= s.position.x + s.size.width &&
             cy >= s.position.y && cy <= s.position.y + s.size.height,
    );
    if (owner) childMap.get(owner.id)!.push(n);
    else orphans.push(n);
  }

  return (
    <div className="h-full overflow-y-auto" style={{ scrollSnapType: "y mandatory" }}>
      {/* 孤儿节点（不属于任何 Section）放在最前面 */}
      {orphans.length > 0 && (
        <div className="relative" style={{ width: page.layout.width, height: Math.max(...orphans.map((n) => n.position.y + n.size.height), 60) }}>
          {orphans.map((n) => (
            <PreviewNode key={n.id} node={n} registry={registry} routeMap={routeMap} navigate={navigate} />
          ))}
        </div>
      )}
      {sorted.map((sec) => {
        const def = findComponentDef(registry, sec.type);
        const bgColor = (sec.props?.custom?.bgColor as string) ?? "#f8fafc";
        const animType = (sec.props?.custom?.animation as string) ?? "fade-up";
        const children = childMap.get(sec.id) ?? [];
        const variant = ANIM_VARIANTS[animType] ?? ANIM_VARIANTS["fade-up"];
        const isParallax = sec.type === "ParallaxSection";
        const speed = (sec.props?.custom?.speed as number) ?? 0.5;

        const content = (
          <div
            className="relative w-full overflow-hidden"
            style={{
              height: "100%",
              minHeight: "100%",
              scrollSnapAlign: "start",
              background: isParallax ? undefined : bgColor,
            }}
          >
            {/* 视差背景层 */}
            {isParallax && (
              <div
                className="absolute inset-0"
                style={{
                  background: bgColor,
                  backgroundImage: "radial-gradient(circle at 30% 40%, rgba(129,140,248,0.3) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(192,132,252,0.3) 0%, transparent 50%)",
                  transform: `translateY(calc(var(--scroll-y, 0) * ${speed * 0.1}px))`,
                }}
              />
            )}
            {/* 子组件绝对定位 */}
            {children.map((child) => (
              <PreviewNode
                key={child.id}
                node={child}
                registry={registry}
                routeMap={routeMap}
                navigate={navigate}
                offsetX={sec.position.x}
                offsetY={sec.position.y}
              />
            ))}
            {/* 无子组件时显示 Section 标题 */}
            {children.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-medium text-gray-400">{sec.props?.text ?? def?.label ?? "Section"}</span>
              </div>
            )}
          </div>
        );

        // AnimSection 用 motion 包裹
        if (sec.type === "AnimSection") {
          return (
            <motion.div
              key={sec.id}
              className="h-full"
              style={{ scrollSnapAlign: "start" }}
              initial={variant.initial}
              whileInView={variant.whileInView}
              viewport={{ once: false, amount: 0.3 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              {content}
            </motion.div>
          );
        }

        return <div key={sec.id} className="h-full" style={{ scrollSnapAlign: "start" }}>{content}</div>;
      })}
    </div>
  );
}

/** 单个节点渲染（绝对定位） */
function PreviewNode({ node, registry, routeMap, navigate, offsetX = 0, offsetY = 0 }: {
  node: UINode;
  registry: ComponentDef[];
  routeMap: Map<string, { target: { pageId: string }; guard?: { requireAuth?: boolean } }[]>;
  navigate: (pageId: string, requireAuth?: boolean) => void;
  offsetX?: number;
  offsetY?: number;
}) {
  const def = findComponentDef(registry, node.type);
  const outs = routeMap.get(node.id) ?? [];
  const onTrigger = () => {
    const first = outs[0];
    if (!first) return;
    navigate(first.target.pageId, first.guard?.requireAuth);
  };
  return (
    <div
      style={{
        position: "absolute",
        left: node.position.x - offsetX,
        top: node.position.y - offsetY,
        width: node.size.width,
        height: node.size.height,
        zIndex: node.zIndex ?? 0,
        cursor: outs.length ? "pointer" : "default",
      }}
    >
      {renderComponent({
        def,
        props: node.props ?? {},
        interactive: true,
        onTrigger: outs.length ? onTrigger : undefined,
      })}
    </div>
  );
}

export default function PreviewApp() {
  const [doc, setDoc] = useState<CanvasState | null>(null);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [showLogin, setShowLogin] = useState(false);
  const [pendingTarget, setPendingTarget] = useState<string | null>(null);

  React.useEffect(() => {
    const d = loadFromStorage();
    if (d) {
      setDoc(d);
      const entry = findEntry(d.pages);
      setActivePageId(entry?.id ?? null);
    }
  }, []);

  // 监听 storage 事件（跨标签页）+ BroadcastChannel（同标签页）
  React.useEffect(() => {
    const onStorage = () => {
      const d = loadFromStorage();
      if (d) setDoc(d);
    };
    window.addEventListener("storage", onStorage);

    // BroadcastChannel 支持同标签页内编辑器→预览实时同步
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("routecanvas-sync");
      bc.onmessage = () => {
        const d = loadFromStorage();
        if (d) setDoc(d);
      };
    } catch { /* 不支持时回退 storage 事件 */ }

    return () => {
      window.removeEventListener("storage", onStorage);
      bc?.close();
    };
  }, []);

  const routeMap = useMemo(
    () => (doc ? buildRouteMap(doc.transitions) : new Map()),
    [doc],
  );

  const scrollGroups = useMemo(
    () => (doc ? buildScrollGroups(doc.transitions) : new Map()),
    [doc],
  );

  if (!doc || !activePageId) {
    return (
      <div className="h-screen grid place-items-center text-gray-400">
        暂无可预览内容。请先在编辑器中设计页面。
      </div>
    );
  }

  const page = doc.pages.find((p) => p.id === activePageId);
  if (!page) {
    return (
      <div className="h-screen grid place-items-center text-gray-400">
        页面不存在或已被删除。
      </div>
    );
  }
  const registry: ComponentDef[] = doc.componentRegistry ?? [];

  // 检查当前页是否属于 scroll 组
  const scrollChain = scrollGroups.get(activePageId);
  const isInScrollGroup = !!scrollChain && scrollChain.length > 1;
  const scrollPages: Page[] = scrollChain
    ? scrollChain.map((pid: string) => doc.pages.find((p) => p.id === pid)).filter(Boolean) as Page[]
    : [];

  const navigate = (transitionTargetPageId: string, requireAuth?: boolean) => {
    if (requireAuth) {
      setPendingTarget(transitionTargetPageId);
      setShowLogin(true);
      return;
    }
    // 如果目标页属于 scroll 组，导航到链头
    const chain = scrollGroups.get(transitionTargetPageId);
    const target = chain ? chain[0] : transitionTargetPageId;
    setActivePageId(target);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* 顶栏 */}
      <header className="h-11 shrink-0 bg-white border-b border-gray-200 flex items-center gap-3 px-4">
        <button
          className="text-gray-500 hover:text-gray-800 text-sm inline-flex items-center gap-1"
          onClick={() => { window.location.href = "/"; }}
        >
          <ArrowLeft size={14} /> 返回编辑器
        </button>
        <div className="text-sm font-medium text-gray-800">{page.name}</div>
        <code className="text-[11px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
          {page.route.path}
        </code>
        {isInScrollGroup && (
          <span className="text-[10px] bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded font-medium">
            ↓ 滚动模式 ({scrollPages.length}页)
          </span>
        )}
        <div className="flex-1" />
        <div className="flex items-center gap-1 bg-gray-100 rounded p-0.5">
          <button
            className={`p-1 rounded ${device === "desktop" ? "bg-white shadow" : ""}`}
            onClick={() => setDevice("desktop")}
            title="桌面"
          >
            <Monitor size={14} />
          </button>
          <button
            className={`p-1 rounded ${device === "mobile" ? "bg-white shadow" : ""}`}
            onClick={() => setDevice("mobile")}
            title="手机"
          >
            <Smartphone size={14} />
          </button>
        </div>
      </header>

      {/* 设备框 */}
      <div className="flex-1 min-h-0 grid place-items-center p-6 overflow-auto">
        <div
          className="bg-white shadow-lg rounded-lg overflow-auto"
          style={{
            width: device === "mobile" ? 390 : Math.min(page.layout.width, 1200),
            height: device === "mobile" ? 720 : Math.min(page.layout.height, 800),
          }}
        >
          {isInScrollGroup && scrollPages.length > 1 ? (
            /* Scroll 模式：多页合并为 scroll-snap 容器 */
            <div className="h-full overflow-y-auto" style={{ scrollSnapType: "y mandatory" }}>
              {scrollPages.map((sp) => (
                <div
                  key={sp.id}
                  className="relative w-full shrink-0"
                  style={{
                    height: "100%",
                    scrollSnapAlign: "start",
                  }}
                >
                  <SectionAwareRenderer
                    page={sp}
                    registry={registry}
                    routeMap={routeMap}
                    navigate={navigate}
                  />
                </div>
              ))}
            </div>
          ) : (
            <SectionAwareRenderer
              page={page}
              registry={registry}
              routeMap={routeMap}
              navigate={navigate}
            />
          )}
        </div>
      </div>

      {/* 守卫登录占位 */}
      {showLogin && (
        <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center">
          <div className="bg-white rounded-lg p-6 w-80 text-center">
            <div className="text-sm font-semibold mb-2">需要登录</div>
            <div className="text-xs text-gray-500 mb-4">
              该跳转标记为需登录验证（预览占位，无真实鉴权）
            </div>
            <div className="flex gap-2 justify-center">
              <button
                className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm"
                onClick={() => {
                  setShowLogin(false);
                  if (pendingTarget) setActivePageId(pendingTarget);
                  setPendingTarget(null);
                }}
              >
                模拟登录后继续
              </button>
              <button
                className="px-3 py-1.5 rounded bg-gray-100 text-gray-700 text-sm"
                onClick={() => {
                  setShowLogin(false);
                  setPendingTarget(null);
                }}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
