"use client";

import * as React from "react";
import Image from "next/image";
import { ArrowLeftRight, RotateCcw, X } from "lucide-react";
import { renderPageToCanvas } from "@/lib/exportImage";
import { toast } from "@/lib/toast";
import { undoLastAiChange, useAiChangeStore } from "@/data/chatOps";

export function AiDiffDialog() {
  const change = useAiChangeStore((state) => state.change);
  const open = useAiChangeStore((state) => state.diffOpen);
  const close = useAiChangeStore((state) => state.closeDiff);
  const [pageId, setPageId] = React.useState<string | null>(null);
  const [images, setImages] = React.useState<{ before?: string; after?: string }>({});
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (open && change) setPageId((current) => current && change.changedPageIds.includes(current) ? current : change.changedPageIds[0] ?? null);
  }, [open, change]);

  React.useEffect(() => {
    if (!open || !change || !pageId) return;
    let cancelled = false;
    setLoading(true);
    setImages({});
    const before = change.before.pages.find((page) => page.id === pageId);
    const after = change.after.pages.find((page) => page.id === pageId);
    void Promise.all([
      before ? renderPageToCanvas(before).then((canvas) => canvas.toDataURL("image/png")) : Promise.resolve(undefined),
      after ? renderPageToCanvas(after).then((canvas) => canvas.toDataURL("image/png")) : Promise.resolve(undefined),
    ]).then(([beforeImage, afterImage]) => {
      if (!cancelled) setImages({ before: beforeImage, after: afterImage });
    }).catch((error) => {
      if (!cancelled) toast.error(`Diff 渲染失败：${(error as Error).message}`);
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, change, pageId]);

  if (!open || !change) return null;
  const pageLabel = (id: string) => change.after.pages.find((page) => page.id === id)?.name ?? change.before.pages.find((page) => page.id === id)?.name ?? "已删除页面";
  const undo = () => {
    const result = undoLastAiChange();
    if (result.ok) toast.success("已撤销本次 AI 修改");
    else toast.error(result.reason ?? "无法撤销");
  };

  return (
    <div className="fixed inset-0 z-[95] flex flex-col bg-[#111216]">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-white/10 px-4 text-white">
        <ArrowLeftRight size={16} className="text-amber-300" />
        <div><div className="text-sm font-semibold">AI 变更对比</div><div className="text-[10px] text-white/40">左侧应用前，右侧应用后 · {change.results.length} 项操作</div></div>
        <select value={pageId ?? ""} onChange={(event) => setPageId(event.target.value)} className="ml-4 h-8 rounded border border-white/10 bg-white/5 px-2 text-xs text-white outline-none">
          {change.changedPageIds.map((id) => <option key={id} value={id} className="bg-gray-900">{pageLabel(id)}</option>)}
        </select>
        <div className="flex-1" />
        <button className="inline-flex h-8 items-center gap-1.5 rounded border border-white/15 px-3 text-xs text-white/80 hover:bg-white/10" onClick={undo}><RotateCcw size={13} /> 撤销本次</button>
        <button className="grid h-8 w-8 place-items-center rounded text-white/50 hover:bg-white/10 hover:text-white" onClick={close} title="关闭"><X size={16} /></button>
      </header>
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-px bg-white/10">
        {(["before", "after"] as const).map((side) => (
          <section key={side} className="flex min-h-0 flex-col bg-[#191a1f]">
            <div className="flex h-9 shrink-0 items-center justify-between border-b border-white/5 px-4 text-[11px] text-white/50"><span>{side === "before" ? "应用前" : "应用后"}</span><span>{side === "before" ? change.before.pages.find((page) => page.id === pageId)?.nodes.length ?? 0 : change.after.pages.find((page) => page.id === pageId)?.nodes.length ?? 0} 个节点</span></div>
            <div className="grid min-h-0 flex-1 place-items-center overflow-auto p-8">
              {loading ? <div className="text-xs text-white/30">正在渲染画布…</div> : images[side] ? <div className="relative h-full w-full"><Image src={images[side]} alt={side === "before" ? "AI 修改前画布" : "AI 修改后画布"} fill unoptimized className="object-contain drop-shadow-2xl" /></div> : <div className="grid h-48 w-72 place-items-center rounded border border-dashed border-white/15 text-xs text-white/30">{side === "before" ? "新增页面，修改前不存在" : "页面已被删除"}</div>}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
