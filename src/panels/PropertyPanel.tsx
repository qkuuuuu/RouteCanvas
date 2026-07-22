"use client";
import * as React from "react";
import { useCanvasStore } from "@/store/canvasStore";
import { findComponentDef } from "@/components/registry";
import { ChevronUp, ChevronDown, ArrowUpToLine, ArrowDownToLine } from "lucide-react";
import type { Field, NodeProps, Page, Transition, UINode } from "@/types/schema";

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

  const updatePage = useCanvasStore((s) => s.updatePage);
  const updateNode = useCanvasStore((s) => s.updateNode);
  const updateNodeProps = useCanvasStore((s) => s.updateNodeProps);
  const updateTransition = useCanvasStore((s) => s.updateTransition);

  const section = "px-3 py-2 border-b border-gray-200";
  const title = "text-[10px] uppercase tracking-wide text-gray-400 mb-2";

  /* ---- 无选中 ---- */
  if (!selection.type || !selection.id) {
    return (
      <aside className="w-64 shrink-0 border-l border-gray-200 bg-white overflow-y-auto">
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
      <aside className="w-64 shrink-0 border-l border-gray-200 bg-white overflow-y-auto">
        <div className={section}>
          <div className={title}>页面画板</div>
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
    const props: NodeProps = node.props ?? {};
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
      <aside className="w-64 shrink-0 border-l border-gray-200 bg-white overflow-y-auto">
        <div className={section}>
          <div className={title}>UI 节点</div>
          <div className="text-xs text-gray-700 mb-2">
            类型：<code className="text-blue-600">{def?.label ?? node.type}</code>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <NumField label="X" value={node.position.x} onChange={(v) => updateNode(pageId, node.id, { position: { ...node.position, x: v } })} />
            <NumField label="Y" value={node.position.y} onChange={(v) => updateNode(pageId, node.id, { position: { ...node.position, y: v } })} />
            <NumField label="宽" value={node.size.width} onChange={(v) => updateNode(pageId, node.id, { size: { ...node.size, width: v } })} />
            <NumField label="高" value={node.size.height} onChange={(v) => updateNode(pageId, node.id, { size: { ...node.size, height: v } })} />
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
  return (
    <aside className="w-64 shrink-0 border-l border-gray-200 bg-white overflow-y-auto">
      <div className={section}>
        <div className={title}>连线</div>
        <div className="text-[11px] text-gray-500 mb-2">
          {tr.source.nodeId} → {tr.target.pageId}
        </div>
        {/* 连线模式切换 */}
        <div className="mb-3">
          <label className="text-[11px] text-gray-500 mb-1 block">连线模式</label>
          <div className="flex rounded-md border border-gray-300 overflow-hidden">
            <button
              className={`flex-1 px-2 py-1.5 text-xs font-medium transition-colors ${
                !isScroll ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
              onClick={() => updateTransition(tr.id, { mode: "navigate" })}
            >
              → 页面跳转
            </button>
            <button
              className={`flex-1 px-2 py-1.5 text-xs font-medium transition-colors ${
                isScroll ? "bg-violet-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
              onClick={() => updateTransition(tr.id, { mode: "scroll" })}
            >
              ↓ 滚动续页
            </button>
          </div>
          <p className="text-[10px] text-gray-400 mt-1">
            {isScroll ? "两页合并为同一滚动流，预览时上下滚动切换" : "点击后跳转到目标页面"}
          </p>
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
            {["onClick", "onHover", "onSubmit", "onChange"].map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
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
