import type { ComponentType } from "react";
import { rewriteImports } from "./importMap";

/**
 * Tier2 运行时沙箱：
 * 1. tsx 源码 → @babel/standalone 转译为 ESM JS
 * 2. bare import 重写为 esm.sh URL
 * 3. Blob URL 动态 import 取 default export
 * 4. 结果缓存（同一源码不重复转译）
 */

export interface SandboxResult {
  Component?: ComponentType<Record<string, unknown>>;
  error?: string;
}

// 缓存：source hash → Component
const cache = new Map<string, ComponentType<Record<string, unknown>>>();

// 懒加载 @babel/standalone（体积大，仅首次运行时加载）
let babelModule: typeof import("@babel/standalone") | null = null;

async function getBabel() {
  if (!babelModule) {
    babelModule = await import("@babel/standalone");
  }
  return babelModule;
}

/**
 * 转译 tsx 源码并返回 default export（React 组件）。
 * @param source  tsx 源码
 * @param id      组件 id（用于缓存 key）
 */
export async function transpileComponent(
  source: string,
  id: string,
): Promise<SandboxResult> {
  const cacheKey = `${id}::${source}`;
  const cached = cache.get(cacheKey);
  if (cached) return { Component: cached };

  try {
    const Babel = await getBabel();

    // 1. Babel 转译：TypeScript → JS + JSX → createElement
    const transformed = Babel.transform(source, {
      presets: [
        ["typescript", { isTSX: true, allExtensions: true }],
        ["react", { runtime: "automatic" }],
      ],
      filename: `${id}.tsx`,
    });

    if (!transformed.code) {
      return { error: "Babel transform produced empty output" };
    }

    // 2. 重写 bare imports 为 esm.sh URL
    const code = rewriteImports(transformed.code);

    // 3. 创建 Blob URL 并动态 import
    const blob = new Blob([code], { type: "text/javascript" });
    const blobUrl = URL.createObjectURL(blob);

    try {
      const mod = await import(/* @vite-ignore */ /* webpackIgnore: true */ blobUrl);
      const Component = mod.default ?? mod[id] ?? mod[Object.keys(mod)[0]];

      if (Component && typeof Component === "function") {
        cache.set(cacheKey, Component as ComponentType<Record<string, unknown>>);
        return { Component: Component as ComponentType<Record<string, unknown>> };
      }
      return { error: "No valid React component export found in source" };
    } finally {
      URL.revokeObjectURL(blobUrl);
    }
  } catch (e) {
    const msg = (e as Error).message || String(e);
    return { error: `Runtime sandbox error: ${msg}` };
  }
}

/** 清除缓存（组件被删除或源码更新时调用） */
export function clearSandboxCache(id?: string): void {
  if (id) {
    for (const key of cache.keys()) {
      if (key.startsWith(`${id}::`)) cache.delete(key);
    }
  } else {
    cache.clear();
  }
}
