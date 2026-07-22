import type { CanvasState } from "@/types/schema";

const PERSIST_KEY = "routecanvas-doc";
const CLOUD_API = process.env.NEXT_PUBLIC_CLOUD_API ?? "";

export function isCloudEnabled(): boolean {
  return CLOUD_API.length > 0;
}

/** 从 localStorage 读取文档 */
function loadFromLocalStorage(): CanvasState | null {
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

/** 写入 localStorage */
function saveToLocalStorage(state: CanvasState) {
  localStorage.setItem(PERSIST_KEY, JSON.stringify({ state }));
}

/**
 * 加载文档：云端优先（启用时），否则回退 localStorage。
 */
export async function loadDocument(): Promise<CanvasState | null> {
  if (isCloudEnabled()) {
    try {
      const resp = await fetch(`${CLOUD_API}/docs?id=current`);
      if (resp.ok) {
        const data = await resp.json();
        if (data?.json) return data.json as CanvasState;
      }
    } catch {
      // 云端失败，回退 localStorage
    }
  }
  return loadFromLocalStorage();
}

/**
 * 保存文档：云端优先（启用时），同时写 localStorage 作为缓存。
 */
export async function saveDocument(state: CanvasState): Promise<void> {
  // 始终写 localStorage 作为本地缓存
  saveToLocalStorage(state);

  if (isCloudEnabled()) {
    try {
      await fetch(`${CLOUD_API}/docs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: "current",
          name: state.meta.canvasName ?? "未命名画布",
          json: state,
        }),
      });
    } catch {
      // 云端保存失败，静默回退（本地已有缓存）
    }
  }
}
