"use client";

import * as React from "react";
import type { ComponentDef } from "@/types/schema";
import type { PackComponentProps } from ".";

type ComponentMap = Record<string, React.FC<PackComponentProps>>;

const loaders: Record<string, () => Promise<ComponentMap>> = {
  "react-bits": async () => {
    const [base, generated] = await Promise.all([import("./react-bits/components"), import("./react-bits/generated")]);
    return { ...base.reactBitsComponents, ...generated.generatedRBComponents } as ComponentMap;
  },
  aceternity: async () => {
    const [base, generated] = await Promise.all([import("./aceternity/components"), import("./aceternity/generated")]);
    return { ...base.aceternityComponents, ...generated.generatedACComponents } as ComponentMap;
  },
  "magic-ui": async () => (await import("./magic-ui/components")).magicUIComponents,
  shadcn: async () => (await import("./shadcn/components")).shadcnComponents,
  dashboard: async () => (await import("./dashboard/components")).dashboardComponents,
  "anim-bg": async () => (await import("./anim-bg/components")).animBgComponents,
  "3d-effects": async () => (await import("./3d-effects/components")).threeDComponents,
  "r3f-scenes": async () => (await import("./r3f-scenes/components")).r3fComponents,
};

const cache = new Map<string, ComponentMap>();
const pending = new Map<string, Promise<ComponentMap>>();

function load(pack: string): Promise<ComponentMap> {
  const cached = cache.get(pack);
  if (cached) return Promise.resolve(cached);
  const active = pending.get(pack);
  if (active) return active;
  const promise = (loaders[pack]?.() ?? Promise.resolve({})).then((components) => {
    cache.set(pack, components);
    pending.delete(pack);
    return components;
  });
  pending.set(pack, promise);
  return promise;
}

export function PackRenderer({ def, componentProps, loadingLabel = "组件加载中…" }: { def: ComponentDef; componentProps: PackComponentProps; loadingLabel?: string }) {
  const pack = def.pack ?? "";
  const [Component, setComponent] = React.useState<React.FC<PackComponentProps> | null>(() => cache.get(pack)?.[def.id] ?? null);
  React.useEffect(() => {
    let cancelled = false;
    setComponent(() => cache.get(pack)?.[def.id] ?? null);
    void load(pack).then((components) => { if (!cancelled) setComponent(() => components[def.id] ?? null); });
    return () => { cancelled = true; };
  }, [def.id, pack]);
  if (!Component) return <div className="grid h-full w-full place-items-center rounded bg-gray-50 text-[10px] text-gray-400">{loadingLabel}</div>;
  return <Component {...componentProps} />;
}
