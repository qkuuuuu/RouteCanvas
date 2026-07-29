"use client";
/**
 * MCP 双向同步 Hook
 * - 编辑器 → canvas.json：store 变化后防抖推送（MCP get_canvas 始终读到最新）
 * - canvas.json → 编辑器：轮询 mtime，检测到 MCP 写入后自动加载到画布
 */
import * as React from "react";
import { useCanvasStore } from "@/store/canvasStore";
import { exportDocument, importDocument } from "@/data/serializer";
import { toast } from "@/lib/toast";

/** 正在从文件加载的标记（抑制加载触发的回推，避免死循环） */
let loadingFromFile = false;

export function useMcpSync(enabled: boolean) {
  const lastMtime = React.useRef<number | null>(null);
  const lastPushedJson = React.useRef<string>("");
  const [syncState, setSyncState] = React.useState<"idle" | "synced" | "external">("idle");

  /* ---------- 编辑器 → 文件（防抖推送，仅在文档内容变化时写入） ---------- */
  React.useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const unsub = useCanvasStore.subscribe((s) => {
      // 从文件加载时不回推
      if (loadingFromFile) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(async () => {
        try {
          const doc = exportDocument({
            meta: s.meta,
            pages: s.pages,
            transitions: s.transitions,
            designSystem: s.designSystem,
            componentRegistry: s.componentRegistry,
          });
          // 内容未变（如仅选区/视口变化）则跳过，避免无意义写入触发 mtime
          const json = JSON.stringify({ pages: doc.pages, transitions: doc.transitions, designSystem: doc.designSystem });
          if (json === lastPushedJson.current) return;
          lastPushedJson.current = json;
          const res = await fetch("/api/canvas-file", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(doc),
          });
          const data = await res.json();
          if (data.mtime) lastMtime.current = data.mtime;
        } catch {
          /* 静默失败，不打扰用户 */
        }
      }, 600);
    });
    return () => {
      unsub();
      if (timer) clearTimeout(timer);
    };
  }, [enabled]);

  /* ---------- 文件 → 编辑器（轮询拉取） ---------- */
  React.useEffect(() => {
    if (!enabled) return;
    const poll = async () => {
      try {
        const res = await fetch("/api/canvas-file");
        const data = await res.json();
        if (!data.exists || data.mtime === null) return;
        // mtime 未变 → 无外部修改
        if (lastMtime.current !== null && data.mtime === lastMtime.current) return;
        lastMtime.current = data.mtime;
        if (!data.content) return;
        // 内容与当前 store 一致 → 无需加载（pages/transitions/componentRegistry 任一变化都需同步，
        // 否则 MCP 纯注册自定义组件时编辑器不会感知）
        const s = useCanvasStore.getState();
        const current = JSON.stringify({
          pages: s.pages,
          transitions: s.transitions,
          designSystem: s.designSystem,
          componentRegistry: s.componentRegistry,
        });
        const incoming = JSON.stringify({
          pages: data.content.pages ?? [],
          transitions: data.content.transitions ?? [],
          designSystem: data.content.designSystem,
          componentRegistry: data.content.componentRegistry ?? [],
        });
        if (current === incoming) return;
        // 加载外部修改
        const json = JSON.stringify(data.content);
        const result = importDocument(json);
        if (result.ok && result.state) {
          loadingFromFile = true;
          // 记录已加载内容，避免加载后立即回推
          lastPushedJson.current = JSON.stringify({
            pages: result.state.pages,
            transitions: result.state.transitions,
            designSystem: result.state.designSystem,
          });
          useCanvasStore.getState().loadDocument(result.state);
          // 等一个 tick 让 subscribe 回调跑完再解除抑制
          setTimeout(() => {
            loadingFromFile = false;
          }, 100);
          setSyncState("external");
          toast.success("已同步 MCP 画布修改");
          setTimeout(() => setSyncState("idle"), 2000);
        }
      } catch {
        /* 静默 */
      }
    };
    // 首次立即拉一次以初始化 mtime 基线
    poll();
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, [enabled]);

  /* ---------- 手动同步 ---------- */
  const syncNow = React.useCallback(async () => {
    try {
      const res = await fetch("/api/canvas-file");
      const data = await res.json();
      if (!data.exists || !data.content) {
        toast.error("canvas.json 不存在，请先通过 MCP 生成画布");
        return;
      }
      lastMtime.current = data.mtime;
      const result = importDocument(JSON.stringify(data.content));
      if (result.ok && result.state) {
        loadingFromFile = true;
        lastPushedJson.current = JSON.stringify({
          pages: result.state.pages,
          transitions: result.state.transitions,
          designSystem: result.state.designSystem,
        });
        useCanvasStore.getState().loadDocument(result.state);
        setTimeout(() => {
          loadingFromFile = false;
        }, 100);
        setSyncState("synced");
        toast.success("已从 canvas.json 同步");
        setTimeout(() => setSyncState("idle"), 2000);
      } else {
        toast.error("同步失败：" + result.errors.join("，"));
      }
    } catch (e) {
      toast.error("同步失败：" + (e as Error).message);
    }
  }, []);

  return { syncNow, syncState };
}
