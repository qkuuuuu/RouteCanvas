"use client";
import * as React from "react";
import { create } from "zustand";
import { CheckCircle, XCircle, Info, AlertTriangle, X } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";
interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastStore {
  toasts: ToastItem[];
  add: (type: ToastType, message: string) => void;
  remove: (id: number) => void;
}

let nextId = 0;
const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (type, message) => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts, { id, type, message }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 3500);
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** 全局 toast 调用 */
export const toast = {
  success: (msg: string) => useToastStore.getState().add("success", msg),
  error: (msg: string) => useToastStore.getState().add("error", msg),
  info: (msg: string) => useToastStore.getState().add("info", msg),
  warning: (msg: string) => useToastStore.getState().add("warning", msg),
};

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={16} className="text-green-500" />,
  error: <XCircle size={16} className="text-red-500" />,
  info: <Info size={16} className="text-blue-500" />,
  warning: <AlertTriangle size={16} className="text-yellow-500" />,
};

const bgColors: Record<ToastType, string> = {
  success: "border-green-200 bg-green-50",
  error: "border-red-200 bg-red-50",
  info: "border-blue-200 bg-blue-50",
  warning: "border-yellow-200 bg-yellow-50",
};

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const remove = useToastStore((s) => s.remove);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-2 px-3 py-2 rounded-lg border shadow-lg text-sm text-gray-800 animate-in slide-in-from-right-2 ${bgColors[t.type]}`}
        >
          {icons[t.type]}
          <span className="flex-1 max-w-xs">{t.message}</span>
          <button
            className="text-gray-400 hover:text-gray-600"
            onClick={() => remove(t.id)}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
