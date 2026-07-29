"use client";
import * as React from "react";
import { useCanvasStore } from "@/store/canvasStore";
import { findComponentDef } from "@/components/registry";
import { ChevronUp, ChevronDown, ArrowUpToLine, ArrowDownToLine, GitBranch, MousePointerClick } from "lucide-react";
import type { Field, NodeProps, Page, Transition, UINode } from "@/types/schema";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { resolveNodeFrame } from "@/design/frame";

/* ---------- 通用字段编辑器 ---------- */
function FieldEditor({
  field,
  value,
  onChange,
}: {
  field: Field;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  // local state 避免每次按键都更新 store 导致 input 失焦
  const [local, setLocal] = React.useState(value);
  React.useEffect(() => setLocal(value), [value]);

  const id = `f-${field.key}`;
  const labelCls = "text-[11px] text-gray-500 mb-0.5 block";
  const inputCls =
    "w-full h-8 rounded border border-gray-300 px-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500";

  if (field.type === "boolean") {
    return (
      <label className="flex items-center gap-2 py-1 cursor-pointer">
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4"
        />
        <span className="text-xs text-gray-700">{field.label}</span>
      </label>
    );
  }
  if (field.type === "select") {
    return (
      <div>
        <label className={labelCls}>{field.label}</label>
        <select
          className={inputCls}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        >
          {(field.options ?? []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>
    );
  }
  if (field.type === "code") {
    return (
      <div>
        <label className={labelCls}>{field.label}</label>
        <textarea
          rows={3}
          className="w-full rounded border border-gray-300 px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
          value={(local as string) ?? ""}
          onChange={(e) => setLocal(e.target.value)}
          onBlur={() => onChange(local)}
        />
      </div>
    );
  }
  if (field.type === "color") {
    const hex =
      typeof value === "string" && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)
        ? value
        : "";
    return (
      <div>
        <label className={labelCls}>{field.label}</label>
        <div className="flex items-center gap-1.5">
          <input
            type="color"
            className="h-8 w-9 shrink-0 rounded border border-gray-300 p-0.5 cursor-pointer bg-white"
            value={hex || "#000000"}
            onChange={(e) => onChange(e.target.value)}
            title="选择颜色"
          />
          <input
            className="flex-1 h-8 rounded border border-gray-300 px-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="留空=无"
            value={(local as string) ?? ""}
            onChange={(e) => setLocal(e.target.value)}
            onBlur={() => onChange(local)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onChange(local);
                (e.target as HTMLInputElement).blur();
              }
            }}
          />
          {hex && (
            <button
              className="shrink-0 text-gray-400 hover:text-red-500 text-sm px-0.5"
              title="清除颜色"
              onClick={() => onChange("")}
            >
              ×
            </button>
          )}
        </div>
      </div>
    );
  }
  return (
    <div>
      <label className={labelCls}>{field.label}</label>
      <input
        type={field.type === "number" ? "number" : "text"}
        className={inputCls}
        value={(local as string | number) ?? ""}
        onChange={(e) => {
          const v = field.type === "number" ? Number(e.target.value) : e.target.value;
          setLocal(v);
        }}
        onBlur={() => onChange(local)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onChange(local);
            (e.target as HTMLInputElement).blur();
          }
        }}
      />
    </div>
  );
}

/* ---------- 主面板 ---------- */
export function PropertyPanel() {
  const selection = useCanvasStore((s) => s.selection);
  const pages = useCanvasStore((s) => s.pages);
  const transitions = useCanvasStore((s) => s.transitions);
  const registry = useCanvasStore((s) => s.componentRegistry);
  const designSystem = useCanvasStore((s) => s.designSystem);

  const updatePage = useCanvasStore((s) => s.updatePage);
  const updateNode = useCanvasStore((s) => s.updateNode);
  const updateNodeProps = useCanvasStore((s) => s.updateNodeProps);
  const updateNodeResponsive = useCanvasStore((s) => s.updateNodeResponsive);
  const addTransition = useCanvasStore((s) => s.addTransition);
  const updateTransition = useCanvasStore((s) => s.updateTransition);
  const removeTransition = useCanvasStore((s) => s.removeTransition);
  const setSelection = useCanvasStore((s) => s.select);
  const createComponentFromNode = useCanvasStore((s) => s.createComponentFromNode);
  const addComponentVariant = useCanvasStore((s) => s.addComponentVariant);
  const applyComponentVariant = useCanvasStore((s) => s.applyComponentVariant);
  const breakpoint = useWorkspaceStore((s) => s.breakpoint);
  const view = useWorkspaceStore((s) => s.view);
  const setView = useWorkspaceStore((s) => s.setView);
  const setActivePageId = useWorkspaceStore((s) => s.setActivePageId);

  const section = "px-3 py-2 border-b border-gray-200";
  const title = "text-[10px] uppercase tracking-wide text-gray-400 mb-2";

  /* ---- 无选中 ---- */
  if (!selection.type || !selection.id) {
    return (
      <aside className="w-56 shrink-0 border-l border-gray-200 bg-white overflow-y-auto">
        <div className={section}>
          <div className="text-xs text-gray-400">未选中任何元素</div>
          <div className="text-[11px] text-gray-400 mt-1">
            点击页面/节点/连线以编辑属性
          </div>
        </div>
      </aside>
    );
  }

  /* ---- 页面 ---- */
  if (selection.type === "page") {
    const page = pages.find((p) => p.id === selection.id) as Page | undefined;
    if (!page) return null;
    return (
      <aside className="w-56 shrink-0 border-l border-gray-200 bg-white overflow-y-auto">
        <div className={section}>
          <div className={title}>页面画板</div>
          {view === "flow" && (
            <button className="mb-3 inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-md bg-gray-950 text-xs font-medium text-white hover:bg-gray-800" onClick={() => { setActivePageId(page.id); setView("design"); setSelection({ type: "page", id: page.id }); }}>
              编辑这个页面
            </button>
          )}
          <div className="space-y-2">
            <div>
              <label className="text-[11px] text-gray-500">页面名称</label>
              <input
                className="w-full h-8 rounded border border-gray-300 px-2 text-sm"
                value={page.name}
                onChange={(e) => updatePage(page.id, { name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[11px] text-gray-500">路由路径</label>
              <input
                className="w-full h-8 rounded border border-gray-300 px-2 text-sm font-mono"
                value={page.route.path}
                onChange={(e) =>
                  updatePage(page.id, {
                    route: { ...page.route, path: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <label className="text-[11px] text-gray-500">路由名 (name)</label>
              <input
                className="w-full h-8 rounded border border-gray-300 px-2 text-sm"
                value={page.route.name ?? ""}
                onChange={(e) =>
                  updatePage(page.id, {
                    route: { ...page.route, name: e.target.value },
                  })
                }
              />
            </div>
            <label className="flex items-center gap-2 py-1 cursor-pointer">
              <input
                type="checkbox"
                checked={!!page.route.isIndex}
                onChange={(e) =>
                  updatePage(page.id, {
                    route: { ...page.route, isIndex: e.target.checked },
                  })
                }
                className="h-4 w-4"
              />
              <span className="text-xs text-gray-700">设为首页 (isIndex)</span>
            </label>
            <label className="flex items-center gap-2 py-1 cursor-pointer">
              <input
                type="checkbox"
                checked={!!page.layout.collapsed}
                onChange={(e) =>
                  updatePage(page.id, {
                    layout: { ...page.layout, collapsed: e.target.checked },
                  })
                }
                className="h-4 w-4"
              />
              <span className="text-xs text-gray-700">折叠</span>
            </label>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <NumField label="X" value={page.layout.x} onChange={(v) => updatePage(page.id, { layout: { ...page.layout, x: v } })} />
              <NumField label="Y" value={page.layout.y} onChange={(v) => updatePage(page.id, { layout: { ...page.layout, y: v } })} />
              <NumField label="宽" value={page.layout.width} onChange={(v) => updatePage(page.id, { layout: { ...page.layout, width: v } })} />
              <NumField label="高" value={page.layout.height} onChange={(v) => updatePage(page.id, { layout: { ...page.layout, height: v } })} />
            </div>
          </div>
        </div>
      </aside>
    );
  }

  /* ---- 节点 ---- */
  if (selection.type === "node") {
    const pageId = selection.pageId!;
    const page = pages.find((p) => p.id === pageId);
    const node = page?.nodes.find((n) => n.id === selection.id) as
      | UINode
      | undefined;
    if (!page || !node) return null;
    const def = findComponentDef(registry, node.type);
    const component = designSystem?.components?.find((item) => item.id === node.componentId);
    const props: NodeProps = node.props ?? {};
    const frame = resolveNodeFrame(node, breakpoint);
    const clickTransition = transitions.find((item) => item.source.pageId === pageId && item.source.nodeId === node.id && (item.source.event ?? "onClick") === "onClick");
    const clickTarget = clickTransition?.target.pageId ?? "";
    const updateFrame = (patch: Partial<typeof frame>) => {
      if (breakpoint === "desktop") {
        updateNode(pageId, node.id, {
          position: { x: patch.x ?? node.position.x, y: patch.y ?? node.position.y },
          size: { width: patch.width ?? node.size.width, height: patch.height ?? node.size.height },
        });
      } else {
        updateNodeResponsive(pageId, node.id, breakpoint, patch);
      }
    };
    const setProp = (field: Field, v: unknown) => {
      if (field.bucket === "base") {
        updateNodeProps(pageId, node.id, { [field.key]: v });
      } else {
        updateNodeProps(pageId, node.id, {
          custom: { ...props.custom, [field.key]: v },
        });
      }
    };
    const getProp = (field: Field) =>
      field.bucket === "base"
        ? (props as Record<string, unknown>)[field.key]
        : props.custom?.[field.key];

    return (
      <aside className="w-56 shrink-0 border-l border-gray-200 bg-white overflow-y-auto">
        <div className={section}>
          <div className={title}>UI 节点</div>
          <div className="text-xs text-gray-700 mb-2">
            类型：<code className="text-blue-600">{def?.label ?? node.type}</code>
          </div>
          <div className="mb-2 flex items-center justify-between text-[10px] text-gray-400">
            <span>{breakpoint === "desktop" ? "基础画板" : `${breakpoint} 覆盖`}</span>
            {breakpoint !== "desktop" && <button className="text-indigo-600 hover:text-indigo-700" onClick={() => updateNode(pageId, node.id, { responsive: { ...node.responsive, [breakpoint]: undefined } })}>重置断点</button>}
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <NumField label="X" value={frame.x} onChange={(v) => updateFrame({ x: v })} />
            <NumField label="Y" value={frame.y} onChange={(v) => updateFrame({ y: v })} />
            <NumField label="宽" value={frame.width} onChange={(v) => updateFrame({ width: v })} />
            <NumField label="高" value={frame.height} onChange={(v) => updateFrame({ height: v })} />
          </div>
          {/* 层级控制 */}
          <div className="flex items-center gap-1 mb-2">
            <span className="text-[11px] text-gray-500 mr-1">层级</span>
            <button
              className="p-1 rounded border border-gray-200 hover:bg-gray-50 text-gray-600"
              title="置顶"
              onClick={() => {
                const maxZ = Math.max(0, ...page.nodes.map((n) => n.zIndex ?? 0));
                updateNode(pageId, node.id, { zIndex: maxZ + 1 });
              }}
            >
              <ArrowUpToLine size={12} />
            </button>
            <button
              className="p-1 rounded border border-gray-200 hover:bg-gray-50 text-gray-600"
              title="上移一层"
              onClick={() => updateNode(pageId, node.id, { zIndex: (node.zIndex ?? 0) + 1 })}
            >
              <ChevronUp size={12} />
            </button>
            <button
              className="p-1 rounded border border-gray-200 hover:bg-gray-50 text-gray-600"
              title="下移一层"
              onClick={() => updateNode(pageId, node.id, { zIndex: Math.max(0, (node.zIndex ?? 0) - 1) })}
            >
              <ChevronDown size={12} />
            </button>
            <button
              className="p-1 rounded border border-gray-200 hover:bg-gray-50 text-gray-600"
              title="置底"
              onClick={() => updateNode(pageId, node.id, { zIndex: 0 })}
            >
              <ArrowDownToLine size={12} />
            </button>
            <span className="text-[10px] text-gray-400 ml-1">z={node.zIndex ?? 0}</span>
          </div>
        </div>
        <div className={section}>
          <div className={`${title} flex items-center gap-1`}><MousePointerClick size={12} /> 点击交互</div>
          <label className="mb-1 block text-[11px] text-gray-500">点击后</label>
          <select
            className="h-8 w-full rounded border border-gray-300 px-2 text-xs text-gray-700 outline-none focus:border-indigo-500"
            value={clickTarget}
            onChange={(event) => {
              const targetPageId = event.target.value;
              if (!targetPageId) {
                if (clickTransition) removeTransition(clickTransition.id);
                return;
              }
              if (clickTransition) {
                updateTransition(clickTransition.id, { mode: "navigate", target: { ...clickTransition.target, pageId: targetPageId } });
              } else {
                addTransition({ pageId, nodeId: node.id, event: "onClick" }, { pageId: targetPageId });
              }
            }}
          >
            <option value="">无动作</option>
            {pages.filter((item) => item.id !== pageId).map((item) => <option key={item.id} value={item.id}>前往 {item.name}</option>)}
          </select>
          {clickTransition && (
            <button className="mt-2 inline-flex h-7 w-full items-center justify-center gap-1 rounded border border-indigo-200 text-[11px] font-medium text-indigo-600 hover:bg-indigo-50" onClick={() => { setSelection({ type: "transition", id: clickTransition.id }); setView("flow"); }}>
              <GitBranch size={12} /> 在流程中查看
            </button>
          )}
        </div>
        <div className={section}>
          <div className={title}>布局与约束</div>
          <div className="space-y-2">
            <div>
              <label className="text-[11px] text-gray-500">布局模式</label>
              <select className="mt-0.5 h-8 w-full rounded border border-gray-300 px-2 text-sm" value={node.layout?.mode ?? "absolute"} onChange={(e) => updateNode(pageId, node.id, { layout: { ...node.layout, mode: e.target.value as "absolute" | "stack" | "grid" } })}>
                <option value="absolute">绝对定位</option>
                <option value="stack">Auto Layout</option>
                <option value="grid">Grid</option>
              </select>
            </div>
            {(node.layout?.mode === "stack" || node.layout?.mode === "grid") && (
              <div className="grid grid-cols-2 gap-2">
                <NumField label={node.layout?.mode === "grid" ? "列数" : "间距"} value={node.layout?.mode === "grid" ? node.layout?.columns ?? 2 : node.layout?.gap ?? 8} onChange={(v) => updateNode(pageId, node.id, { layout: { ...node.layout, mode: node.layout?.mode ?? "stack", [node.layout?.mode === "grid" ? "columns" : "gap"]: v } })} />
                <NumField label="内边距" value={node.layout?.padding ?? 0} onChange={(v) => updateNode(pageId, node.id, { layout: { ...node.layout, mode: node.layout?.mode ?? "stack", padding: v } })} />
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-[11px] text-gray-500">水平约束</label><select className="mt-0.5 h-8 w-full rounded border border-gray-300 px-1 text-xs" value={node.constraints?.horizontal ?? "left"} onChange={(e) => updateNode(pageId, node.id, { constraints: { ...node.constraints, horizontal: e.target.value as "left" | "right" | "center" | "stretch" } })}>{["left", "right", "center", "stretch"].map((v) => <option key={v}>{v}</option>)}</select></div>
              <div><label className="text-[11px] text-gray-500">垂直约束</label><select className="mt-0.5 h-8 w-full rounded border border-gray-300 px-1 text-xs" value={node.constraints?.vertical ?? "top"} onChange={(e) => updateNode(pageId, node.id, { constraints: { ...node.constraints, vertical: e.target.value as "top" | "bottom" | "center" | "stretch" } })}>{["top", "bottom", "center", "stretch"].map((v) => <option key={v}>{v}</option>)}</select></div>
            </div>
            <div>
              <label className="text-[11px] text-gray-500">父级图层</label>
              <select className="mt-0.5 h-8 w-full rounded border border-gray-300 px-2 text-xs" value={node.parentId ?? ""} onChange={(e) => updateNode(pageId, node.id, { parentId: e.target.value || null })}>
                <option value="">页面根级</option>
                {page.nodes.filter((candidate) => candidate.id !== node.id).map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.props?.text || candidate.type}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className={section}>
          <div className={title}>注释与 AI 上下文</div>
          <textarea
            rows={3}
            className="w-full resize-none rounded border border-gray-300 px-2 py-1.5 text-xs leading-relaxed outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
            placeholder="记录设计意图、修改要求或交互说明..."
            value={node.note ?? ""}
            onChange={(event) => updateNode(pageId, node.id, { note: event.target.value })}
          />
          <p className="mt-1 text-[10px] text-gray-400">该注释会随设计文件保存，并作为 AI 修改上下文。</p>
        </div>
        <div className={section}>
          <div className={title}>组件实例</div>
          {component ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between"><span className="truncate text-xs font-medium text-indigo-700">{component.name}</span><span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[9px] text-indigo-500">INSTANCE</span></div>
              <div>
                <label className="text-[11px] text-gray-500">变体</label>
                <select className="mt-0.5 h-8 w-full rounded border border-gray-300 px-2 text-xs" value={node.variant ?? component.variants[0]?.id ?? ""} onChange={(e) => applyComponentVariant(pageId, node.id, component.id, e.target.value)}>
                  {component.variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.name}</option>)}
                </select>
              </div>
              <button className="h-8 w-full rounded border border-indigo-200 text-xs font-medium text-indigo-600 hover:bg-indigo-50" onClick={() => addComponentVariant(component.id, pageId, node.id)}>将当前外观保存为新变体</button>
            </div>
          ) : (
            <button className="h-8 w-full rounded bg-indigo-600 text-xs font-medium text-white hover:bg-indigo-700" onClick={() => createComponentFromNode(pageId, node.id)}>创建可复用组件</button>
          )}
        </div>
        <div className={section}>
          <div className={title}>属性 ({def?.label ?? node.type})</div>
          <div className="space-y-2">
            {def?.propsSchema.map((f) => (
              <FieldEditor key={f.key} field={f} value={getProp(f)} onChange={(v) => setProp(f, v)} />
            ))}
          </div>
          <p className="text-[10px] text-gray-400 mt-2">输入后按 Enter 或点击别处即可生效，无需手动保存</p>
        </div>
      </aside>
    );
  }

  /* ---- 连线 ---- */
  const tr = transitions.find((t) => t.id === selection.id) as
    | Transition
    | undefined;
  if (!tr) return null;
  const params = tr.target.params ?? {};
  const isScroll = tr.mode === "scroll";
  const sourcePage = pages.find((page) => page.id === tr.source.pageId);
  const targetPage = pages.find((page) => page.id === tr.target.pageId);
  const sourceNode = sourcePage?.nodes.find((node) => node.id === tr.source.nodeId);
  const hasBoundSource = sourcePage?.nodes.some((node) => node.id === tr.source.nodeId) ?? false;
  return (
    <aside className="w-56 shrink-0 border-l border-gray-200 bg-white overflow-y-auto">
      <div className={section}>
        <div className={`${title} flex items-center gap-1`}><GitBranch size={12} /> 页面交互</div>
        <div className="mb-3 rounded-md bg-gray-50 px-2 py-2 text-[11px] font-medium text-gray-600">
          {sourcePage?.name ?? "未知页面"} <span className="px-1 text-gray-300">→</span> {targetPage?.name ?? "未知页面"}
        </div>
        <button className="mb-3 inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-md bg-gray-950 text-xs font-medium text-white hover:bg-gray-800" onClick={() => { if (sourcePage) setActivePageId(sourcePage.id); setView("design"); setSelection(sourceNode ? { type: "node", id: sourceNode.id, pageId: sourcePage?.id } : { type: "page", id: sourcePage?.id ?? null }); }}>
          编辑触发组件
        </button>
        <div className="mb-2">
          <label className="mb-1 block text-[11px] text-gray-500">触发组件</label>
          <select className="h-8 w-full rounded border border-gray-300 px-2 text-xs" value={tr.source.nodeId} onChange={(event) => updateTransition(tr.id, { source: { ...tr.source, nodeId: event.target.value } })}>
            {!hasBoundSource && <option value={tr.source.nodeId}>未绑定具体组件</option>}
            {sourcePage?.nodes.map((node) => <option key={node.id} value={node.id}>{node.props?.text || node.type}</option>)}
          </select>
        </div>
        <div className="mb-3">
          <label className="mb-1 block text-[11px] text-gray-500">目标页面</label>
          <select className="h-8 w-full rounded border border-gray-300 px-2 text-xs" value={tr.target.pageId} onChange={(event) => updateTransition(tr.id, { target: { ...tr.target, pageId: event.target.value } })}>
            {pages.filter((page) => page.id !== tr.source.pageId).map((page) => <option key={page.id} value={page.id}>{page.name}</option>)}
          </select>
        </div>
        <div className="mb-3">
          <label className="text-[11px] text-gray-500 mb-1 block">动作</label>
          <div className="flex rounded-md border border-gray-300 overflow-hidden">
            <button
              className={`flex-1 px-2 py-1.5 text-xs font-medium transition-colors ${
                !isScroll ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
              onClick={() => updateTransition(tr.id, { mode: "navigate" })}
            >
              页面跳转
            </button>
            <button
              className={`flex-1 px-2 py-1.5 text-xs font-medium transition-colors ${
                isScroll ? "bg-violet-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
              onClick={() => updateTransition(tr.id, { mode: "scroll" })}
            >
              滚动续页
            </button>
          </div>
        </div>
        <div>
          <label className="text-[11px] text-gray-500">触发事件</label>
          <select
            className="w-full h-8 rounded border border-gray-300 px-2 text-sm"
            value={tr.source.event ?? "onClick"}
            onChange={(e) =>
              updateTransition(tr.id, {
                source: { ...tr.source, event: e.target.value },
              })
            }
          >
            <option value="onClick">点击</option>
            <option value="onHover">悬停</option>
            <option value="onSubmit">提交</option>
            <option value="onChange">内容变化</option>
          </select>
        </div>
        <div className="mt-2">
          <label className="text-[11px] text-gray-500">
            跳转参数 (key=value, 值支持 {`$\{...\}`} 占位符)
          </label>
          <textarea
            rows={3}
            className="w-full rounded border border-gray-300 px-2 py-1 text-xs font-mono"
            value={Object.entries(params).map(([k, v]) => `${k}=${v}`).join("\n")}
            onChange={(e) => {
              const obj: Record<string, string> = {};
              for (const line of e.target.value.split("\n")) {
                const i = line.indexOf("=");
                if (i > 0) obj[line.slice(0, i).trim()] = line.slice(i + 1).trim();
              }
              updateTransition(tr.id, {
                target: { ...tr.target, params: obj },
              });
            }}
          />
        </div>
      </div>
      <div className={section}>
        <div className={title}>守卫</div>
        <label className="flex items-center gap-2 py-1 cursor-pointer">
          <input
            type="checkbox"
            checked={!!tr.guard?.requireAuth}
            onChange={(e) =>
              updateTransition(tr.id, {
                guard: { ...tr.guard, requireAuth: e.target.checked },
              })
            }
            className="h-4 w-4"
          />
          <span className="text-xs text-gray-700">需登录验证</span>
        </label>
        <div>
          <label className="text-[11px] text-gray-500">守卫文案</label>
          <input
            className="w-full h-8 rounded border border-gray-300 px-2 text-sm"
            value={tr.guard?.label ?? ""}
            onChange={(e) =>
              updateTransition(tr.id, {
                guard: { ...tr.guard, label: e.target.value },
              })
            }
          />
        </div>
      </div>
      <div className="p-3">
        <button className="h-8 w-full rounded border border-red-200 text-xs font-medium text-red-600 hover:bg-red-50" onClick={() => { removeTransition(tr.id); if (sourcePage) setSelection({ type: "page", id: sourcePage.id }); }}>
          删除这个交互
        </button>
      </div>
    </aside>
  );
}

function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const [local, setLocal] = React.useState(Math.round(value));
  React.useEffect(() => setLocal(Math.round(value)), [value]);
  return (
    <div>
      <label className="text-[11px] text-gray-500">{label}</label>
      <input
        type="number"
        className="w-full h-8 rounded border border-gray-300 px-2 text-sm"
        value={local}
        onChange={(e) => setLocal(Number(e.target.value))}
        onBlur={() => onChange(local)}
      />
    </div>
  );
}
