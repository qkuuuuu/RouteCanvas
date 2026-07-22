"use client";
/**
 * AI 标注层状态 store
 * UINode 的 ✨ 按钮 / 画笔 AI 模式 → 设置 target → Editor 渲染 AiAnnotateOverlay
 */
import { create } from "zustand";
import type { AnnotateTarget } from "@/canvas/AiAnnotateOverlay";

interface AnnotateStore {
  target: AnnotateTarget | null;
  open: (target: AnnotateTarget) => void;
  close: () => void;
}

export const useAnnotateStore = create<AnnotateStore>((set) => ({
  target: null,
  open: (target) => set({ target }),
  close: () => set({ target: null }),
}));
