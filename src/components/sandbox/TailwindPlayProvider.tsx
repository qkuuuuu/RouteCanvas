"use client";
import * as React from "react";

/**
 * 按需加载 Tailwind Play CDN（cdn.tailwindcss.com）。
 * 运行时沙箱组件可能使用任意 Tailwind class，Play CDN 的 JIT 引擎让这些 class 在运行时生效。
 * 生产环境性能弱于 build JIT，仅供原型/预览使用。
 */

let loaded = false;
let loadPromise: Promise<void> | null = null;

export function ensureTailwindPlay(): Promise<void> {
  if (loaded) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.tailwindcss.com";
    script.async = true;
    script.onload = () => {
      loaded = true;
      resolve();
    };
    script.onerror = () => {
      loadPromise = null;
      reject(new Error("Failed to load Tailwind Play CDN"));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

export function useTailwindPlay(): boolean {
  const [ready, setReady] = React.useState(loaded);
  React.useEffect(() => {
    if (loaded) return;
    let mounted = true;
    ensureTailwindPlay()
      .then(() => mounted && setReady(true))
      .catch(() => mounted && setReady(false));
    return () => {
      mounted = false;
    };
  }, []);
  return ready;
}

/** Provider 组件：包裹运行时沙箱组件，确保 Tailwind Play 已加载 */
export function TailwindPlayProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const ready = useTailwindPlay();
  if (!ready) {
    return (
      <div className="w-full h-full grid place-items-center text-xs text-gray-400">
        加载 Tailwind...
      </div>
    );
  }
  return <>{children}</>;
}
