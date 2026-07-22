"use client";
/**
 * AI 标注层 — 画笔交互核心
 * 两种模式：
 *  - edit：选中节点后点 ✨，在节点快照上涂画标注 + 文字指令 → AI 局部精修（update_node）
 *  - generate：空白处手绘草图 → AI 识别意图生成真实组件（add_node）
 * 涂画与节点上下文一起渲染为图片，发送给多模态 AI。
 */
import * as React from "react";
import { Eraser, Loader2, Send, Sparkles, X } from "lucide-react";
import { useCanvasStore } from "@/store/canvasStore";
import { findComponentDef } from "@/components/registry";
import { executeOperations, parseAiResponse, type ChatOp } from "@/data/chatOps";
import { DESIGN_RULES } from "@/data/designSystem";
import { toast } from "@/lib/toast";
import type { UINode } from "@/types/schema";

const W = 480;
const H = 340;

interface Stroke {
  points: { x: number; y: number }[];
  color: string;
}

export interface AnnotateTarget {
  mode: "edit" | "generate";
  pageId: string;
  /** edit 模式：目标节点（一个或多个，多个=区域精修） */
  nodes?: UINode[];
  /** generate 模式：手绘草图（200x150 viewBox 的 pathData）+ 期望放置的页面内位置/尺寸 */
  sketchPath?: string;
  sketchPos?: { x: number; y: number };
  sketchSize?: { width: number; height: number };
}

/* ---------- Canvas 绘制辅助 ---------- */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const lines: string[] = [];
  let line = "";
  for (const ch of text) {
    if (ctx.measureText(line + ch).width > maxWidth && line) {
      lines.push(line);
      line = ch;
    } else {
      line += ch;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** 绘制单个节点的表示框 */
function drawNodeBox(
  ctx: CanvasRenderingContext2D,
  node: UINode,
  label: string,
  bx: number, by: number, bw: number, bh: number,
) {
  // 类型标签（框上方）
  ctx.fillStyle = "#8b5cf6";
  ctx.font = "bold 11px sans-serif";
  ctx.fillText(`[${node.type}] ${label}`, bx, by - 6);
  // 节点框
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#6366f1";
  ctx.lineWidth = 2;
  roundRect(ctx, bx, by, bw, bh, 8);
  ctx.fill();
  ctx.stroke();
  // 文本内容
  const text = (node.props?.text as string) ?? "";
  if (text) {
    ctx.fillStyle = "#1f2937";
    ctx.font = "13px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const lines = wrapText(ctx, text, bw - 16).slice(0, 3);
    const lineH = 17;
    const startY = by + bh / 2 - ((lines.length - 1) * lineH) / 2;
    lines.forEach((ln, i) => ctx.fillText(ln, bx + bw / 2, startY + i * lineH));
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  } else {
    ctx.fillStyle = "#9ca3af";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("（无文本）", bx + bw / 2, by + bh / 2);
    ctx.textAlign = "left";
  }
}

/** 绘制节点表示（edit 模式，支持单节点 / 多节点区域） */
function drawNodesRepresentation(
  ctx: CanvasRenderingContext2D,
  nodes: UINode[],
  labelOf: (n: UINode) => string,
) {
  const area = { x: 40, y: 50, w: W - 80, h: H - 100 };

  if (nodes.length === 1) {
    const node = nodes[0];
    const scale = Math.min(area.w / node.size.width, area.h / node.size.height, 2);
    const bw = Math.max(node.size.width * scale, 140);
    const bh = Math.max(node.size.height * scale, 60);
    const bx = (W - bw) / 2;
    const by = area.y + (area.h - bh) / 2;
    ctx.fillStyle = "#8b5cf6";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText("[组件精修]", 40, 36);
    drawNodeBox(ctx, node, labelOf(node), bx, by, bw, bh);
    ctx.fillStyle = "#9ca3af";
    ctx.font = "11px sans-serif";
    ctx.fillText(`${Math.round(node.size.width)} × ${Math.round(node.size.height)}`, bx, by + bh + 16);
    return;
  }

  // 区域精修：网格排布多个节点
  ctx.fillStyle = "#8b5cf6";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText(`[区域精修 · ${nodes.length} 个组件]`, 40, 36);
  const cols = nodes.length <= 2 ? 1 : 2;
  const rows = Math.ceil(nodes.length / cols);
  const cellW = area.w / cols;
  const cellH = area.h / rows;
  nodes.forEach((node, i) => {
    const c = i % cols;
    const r = Math.floor(i / cols);
    const bw = Math.min(cellW - 30, 190);
    const bh = Math.min(cellH - 36, 88);
    const bx = area.x + c * cellW + (cellW - bw) / 2;
    const by = area.y + r * cellH + (cellH - bh) / 2 + 10;
    drawNodeBox(ctx, node, labelOf(node), bx, by, bw, bh);
  });
}

/** 绘制手绘草图（generate 模式） */
function drawSketch(ctx: CanvasRenderingContext2D, pathData: string) {
  ctx.fillStyle = "#8b5cf6";
  ctx.font = "bold 13px sans-serif";
  ctx.fillText("[手绘草图] 请根据草图生成组件", 40, 36);

  // pathData 基于 200x150 viewBox，放大到中央区域
  const scale = 1.8;
  const ox = (W - 200 * scale) / 2;
  const oy = (H - 150 * scale) / 2 + 10;
  ctx.save();
  ctx.translate(ox, oy);
  ctx.scale(scale, scale);
  const path = new Path2D(pathData);
  ctx.strokeStyle = "#374151";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke(path);
  ctx.restore();
}

/** 绘制用户标注笔画 */
function drawStrokes(ctx: CanvasRenderingContext2D, strokes: Stroke[]) {
  for (const s of strokes) {
    if (s.points.length < 2) continue;
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    s.points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();
  }
}

/* ---------- 组件 ---------- */
export function AiAnnotateOverlay({
  target,
  onClose,
}: {
  target: AnnotateTarget;
  onClose: () => void;
}) {
  const registry = useCanvasStore((s) => s.componentRegistry);
  const [strokes, setStrokes] = React.useState<Stroke[]>([]);
  const [current, setCurrent] = React.useState<{ x: number; y: number }[] | null>(null);
  const [instruction, setInstruction] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [penColor, setPenColor] = React.useState("#ef4444");
  const svgRef = React.useRef<SVGSVGElement>(null);

  const isEdit = target.mode === "edit";
  const nodes = React.useMemo(() => target.nodes ?? [], [target.nodes]);
  const isRegion = nodes.length > 1;
  const labelOf = React.useCallback(
    (n: UINode) => findComponentDef(registry, n.type)?.label ?? n.type,
    [registry],
  );

  /* 坐标换算：SVG 视口 → 内部 W×H 坐标系 */
  const toLocal = (e: React.PointerEvent) => {
    const rect = svgRef.current!.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * W,
      y: ((e.clientY - rect.top) / rect.height) * H,
    };
  };

  const onDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setCurrent([toLocal(e)]);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!current) return;
    setCurrent((pts) => (pts ? [...pts, toLocal(e)] : pts));
  };
  const onUp = () => {
    if (current && current.length > 1) {
      setStrokes((s) => [...s, { points: current, color: penColor }]);
    }
    setCurrent(null);
  };

  /* 合成图片：节点/草图 + 标注 */
  const buildImage = React.useCallback((): string => {
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fafafa";
    ctx.fillRect(0, 0, W, H);
    if (isEdit && nodes.length > 0) {
      drawNodesRepresentation(ctx, nodes, labelOf);
    } else if (target.sketchPath) {
      drawSketch(ctx, target.sketchPath);
    }
    drawStrokes(ctx, strokes);
    return canvas.toDataURL("image/png");
  }, [isEdit, nodes, labelOf, target, strokes]);

  /* 发送给多模态 AI */
  const send = async () => {
    if (busy) return;
    if (!instruction.trim() && strokes.length === 0) {
      toast.warning("请涂画标注或输入修改指令");
      return;
    }
    setBusy(true);
    try {
      const imageDataUrl = buildImage();
      const apiKey = localStorage.getItem("routecanvas-openai-key") ?? "";

      // 组装节点上下文
      const nodeCtx = isEdit
        ? `目标节点 JSON（每个都有唯一 id）：\n${JSON.stringify(nodes.map((n) => ({ id: n.id, type: n.type, position: n.position, size: n.size, props: n.props })), null, 2)}\n所在页面 id：${target.pageId}`
        : `目标页面 id：${target.pageId}\n期望放置位置：${JSON.stringify(target.sketchPos)}，期望尺寸：${JSON.stringify(target.sketchSize)}`;

      const taskDesc = isEdit
        ? isRegion
          ? "用户在一个包含多个 UI 组件的区域截图上做了手绘标注（彩色笔画）。每个组件标有 [type] 和名称。请理解标注意图（圈选=重点修改、箭头=移动、划线=删除、写字=替换内容），结合文字指令修改对应组件。可输出多个 update_node（各自指定 nodeId）或 remove_node 操作，不要新增页面。"
          : "用户在一个 UI 组件的截图上做了手绘标注（彩色笔画）。请理解标注意图（圈选=重点修改、箭头=移动、划线=删除、写字=替换内容），结合文字指令修改该节点。只输出 update_node 操作（可多个），不要新增页面。"
        : "用户手绘了一个 UI 草图。请识别草图意图，用最合适的组件白名单中的组件生成它。只输出 add_node 操作（可多个，注意合理布局），pageId 用给定的页面 id。";

      const messages = [
        {
          role: "system",
          content: `你是 RouteCanvas 设计助手。根据用户的手绘标注和指令修改画布。
只输出一个 JSON 对象：{ "reply": "一句话说明", "operations": [...] }
可用操作：
- update_node: { "op":"update_node", "pageId":"...", "nodeId":"...", "props":{...}, "x":?, "y":?, "width":?, "height":? }
- add_node: { "op":"add_node", "pageId":"...", "type":"组件类型", "x":?, "y":?, "width":?, "height":?, "props":{"text":"...","custom":{...}} }
- remove_node: { "op":"remove_node", "pageId":"...", "nodeId":"..." }
组件 type 只能从白名单选：Button,Input,Text,Image,Card,Form,Container,Badge,Toggle,Progress,Tabs,Navbar,Section,以及 rb-/ac-/scn-/mui-/dash- 前缀的 pack 组件。不确定就用基础组件。
props.text 放文字，颜色等放 props.custom。

${DESIGN_RULES}`,
        },
        {
          role: "user",
          content: [
            { type: "text", text: `${taskDesc}\n\n${nodeCtx}\n\n用户文字指令：${instruction.trim() || "（无文字，仅涂画标注）"}` },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        },
      ];

      const resp = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, apiKey: apiKey || undefined, model: "gpt-4o" }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        toast.error(data.error || "AI 请求失败");
        return;
      }
      const parsed = parseAiResponse(data.content ?? "");
      if (!parsed?.operations?.length) {
        toast.warning("AI 未返回有效操作");
        return;
      }
      const results = executeOperations(parsed.operations as ChatOp[]);
      toast.success(`${parsed.reply ?? "已完成"}（${results.length} 项修改）`);
      onClose();
    } catch (e) {
      toast.error("请求失败：" + (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const strokePath = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-6">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl flex flex-col overflow-hidden">
        {/* 头部 */}
        <div className="h-11 shrink-0 px-4 flex items-center justify-between bg-gradient-to-r from-orange-500 to-pink-500 text-white">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles size={15} />
            {isEdit ? (isRegion ? "AI 区域精修" : "AI 局部精修") : "AI 草图生成"}
          </div>
          <button className="p-1 rounded hover:bg-white/20" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* 画布区：SVG 涂画层 */}
        <div className="p-4">
          <div className="relative rounded-lg border border-gray-200 overflow-hidden bg-[#fafafa]">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${W} ${H}`}
              className="w-full block touch-none cursor-crosshair"
              style={{ aspectRatio: `${W}/${H}` }}
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerLeave={onUp}
            >
              {/* 已有笔画 */}
              {strokes.map((s, i) => (
                <path
                  key={i}
                  d={strokePath(s.points)}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
              {/* 当前笔画 */}
              {current && current.length > 1 && (
                <path
                  d={strokePath(current)}
                  fill="none"
                  stroke={penColor}
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.8}
                />
              )}
            </svg>
            {/* 提示 */}
            {strokes.length === 0 && !current && (
              <div className="absolute inset-0 grid place-items-center pointer-events-none">
                <span className="text-xs text-gray-400 bg-white/80 px-3 py-1.5 rounded-full shadow-sm">
                  {isEdit ? (isRegion ? "在区域上圈画标注，告诉 AI 改哪里" : "在组件上圈画标注，告诉 AI 改哪里") : "这是你的草图，可补充标注"}
                </span>
              </div>
            )}
          </div>

          {/* 工具行 */}
          <div className="flex items-center gap-2 mt-3">
            <div className="flex items-center gap-1.5">
              {["#ef4444", "#f59e0b", "#3b82f6", "#22c55e", "#111827"].map((c) => (
                <button
                  key={c}
                  onClick={() => setPenColor(c)}
                  className={`w-5 h-5 rounded-full border-2 transition-transform ${
                    penColor === c ? "border-gray-600 scale-125" : "border-gray-300"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <button
              className="ml-auto inline-flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 px-2 py-1 rounded hover:bg-red-50"
              onClick={() => setStrokes((s) => s.slice(0, -1))}
              disabled={strokes.length === 0}
            >
              <Eraser size={13} /> 撤销一笔
            </button>
            <button
              className="text-xs text-gray-500 hover:text-red-500 px-2 py-1 rounded hover:bg-red-50"
              onClick={() => setStrokes([])}
              disabled={strokes.length === 0}
            >
              清空
            </button>
          </div>

          {/* 指令输入 */}
          <div className="flex gap-2 mt-3">
            <input
              className="flex-1 h-10 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder={isEdit ? "例如：把圈出来的文字改成英文、这个按钮改成渐变..." : "例如：按草图生成一个定价卡片区域..."}
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
              disabled={busy}
            />
            <button
              className="h-10 px-4 rounded-lg bg-orange-500 text-white text-sm font-medium flex items-center gap-1.5 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              onClick={send}
              disabled={busy}
            >
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              {busy ? "处理中" : "发送"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
