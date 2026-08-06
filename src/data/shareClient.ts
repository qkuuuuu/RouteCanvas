import type { CanvasState } from "@/types/schema";

export async function createShareLink(state: CanvasState): Promise<string> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch("/api/shares", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: state.meta.canvasName, json: state }),
      signal: controller.signal,
    });
    const result = await response.json() as { url?: string; error?: string };
    if (!response.ok || !result.url) throw new Error(result.error || "分享服务不可用");
    return new URL(result.url, window.location.origin).toString();
  } catch (error) {
    if ((error as Error).name === "AbortError") throw new Error("分享服务响应超时，请稍后重试");
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}
