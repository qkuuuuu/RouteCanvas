"use client";
import * as React from "react";
import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { ComponentDef, NodeProps } from "@/types/schema";
import { BUILTIN_COMPONENTS } from "./builtin";
import { PACK_COMPONENTS } from "./packs";
import type { PackComponentProps } from "./packs";
import { CssSandbox } from "./sandbox/cssSandbox";
import { TailwindPlayProvider } from "./sandbox/TailwindPlayProvider";
import { transpileComponent } from "./sandbox/runtimeSandbox";

export interface RenderArgs {
  def?: ComponentDef;
  props: NodeProps;
  interactive?: boolean;
  onTrigger?: () => void;
}

function Placeholder({ label }: { label: string }) {
  return (
    <div className="w-full h-full grid place-items-center text-xs text-gray-400 bg-gray-50 rounded-md">
      {label}
    </div>
  );
}

/* ---------- 运行时沙箱组件包装器 ---------- */
const transpileCache = new Map<string, ComponentType<Record<string, unknown>>>();

function RuntimeComponent({
  def,
  props,
  interactive,
  onTrigger,
}: {
  def: ComponentDef;
  props: NodeProps;
  interactive?: boolean;
  onTrigger?: () => void;
}) {
  const [Component, setComponent] = React.useState<ComponentType<Record<string, unknown>> | null>(
    () => transpileCache.get(def.id) ?? null,
  );
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    // 缓存命中则跳过转译
    if (transpileCache.has(def.id)) {
      setComponent(() => transpileCache.get(def.id)!);
      return;
    }
    const source = def.tsxSource;
    if (!source) {
      setError("No source code provided");
      return;
    }
    let cancelled = false;
    transpileComponent(source, def.id).then((result) => {
      if (cancelled) return;
      if (result.error) setError(result.error);
      else if (result.Component) {
        transpileCache.set(def.id, result.Component);
        setComponent(() => result.Component!);
        setError(null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [def.tsxSource, def.id]);

  if (error) {
    return (
      <div className="w-full h-full grid place-items-center text-[10px] text-red-500 bg-red-50 rounded-md p-2 text-center overflow-hidden">
        {error}
      </div>
    );
  }
  if (!Component) {
    return <Placeholder label="转译中..." />;
  }

  return (
    <TailwindPlayProvider>
      <Component
        text={props.text}
        imageSrc={props.imageSrc}
        interactive={interactive}
        onTrigger={onTrigger}
        {...(props.custom ?? {})}
      />
    </TailwindPlayProvider>
  );
}

/* ---------- R3F 动态加载包装器（仅客户端） ---------- */
const R3FLazy = dynamic(
  () => import("./packs/r3f-scenes/components").then((m) => m.R3FRenderer),
  { ssr: false, loading: () => <Placeholder label="3D 场景加载中..." /> }
);

function R3FWrapper({ id, props }: { id: string; props: PackComponentProps }) {
  return <R3FLazy id={id} {...props} />;
}

/**
 * 统一渲染器：按组件 source 分发。
 * builtin → 内置组件；pack → 预打包组件；runtime → 沙箱转译；css → CssSandbox。
 */
export function renderComponent({
  def,
  props,
  interactive,
  onTrigger,
}: RenderArgs): React.ReactNode {
  if (!def) {
    return <Placeholder label="未知组件" />;
  }

  switch (def.source) {
    case "builtin": {
      // Icon-XXX 快捷类型：提取图标名注入 props
      const isIconShortcut = def.id.startsWith("Icon-");
      const lookupId = isIconShortcut ? "Icon" : def.id;
      const C = BUILTIN_COMPONENTS[lookupId];
      if (!C) return <Placeholder label={def.id} />;
      const finalProps = isIconShortcut
        ? { ...props, custom: { ...props.custom, iconName: def.id.slice(5) } }
        : props;
      return <C props={finalProps} interactive={interactive} onTrigger={onTrigger} />;
    }
    case "pack": {
      // R3F 组件动态加载（避免 SSR 报错）
      if (def.id.startsWith("r3f-")) {
        return <R3FWrapper id={def.id} props={{ text: props.text, imageSrc: props.imageSrc, interactive, onTrigger, ...(props.custom ?? {}) }} />;
      }
      const C = PACK_COMPONENTS[def.id] as React.FC<PackComponentProps> | undefined;
      if (!C) return <Placeholder label={`[pack] ${def.id}`} />;
      return (
        <C
          text={props.text}
          imageSrc={props.imageSrc}
          interactive={interactive}
          onTrigger={onTrigger}
          {...(props.custom ?? {})}
        />
      );
    }
    case "runtime": {
      return (
        <RuntimeComponent
          def={def}
          props={props}
          interactive={interactive}
          onTrigger={onTrigger}
        />
      );
    }
    case "css": {
      const color = (props.custom?.color as string) || "";
      const vars = color ? { "--uv-color": color } : undefined;
      return <CssSandbox html={def.html ?? ""} css={def.css} vars={vars} />;
    }
    default:
      return <Placeholder label={`未知来源: ${def.source}`} />;
  }
}
