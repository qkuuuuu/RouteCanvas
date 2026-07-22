import type { FC } from "react";
import type { ComponentDef } from "@/types/schema";
import { reactBitsDefs, reactBitsComponents } from "./react-bits/manifest";
import { aceternityDefs, aceternityComponents } from "./aceternity/manifest";
import { uiverseDefs } from "./uiverse/manifest";
import { magicUIDefs, magicUIComponents } from "./magic-ui/manifest";
import { shadcnDefs, shadcnComponents } from "./shadcn/manifest";
import { dashboardDefs, dashboardComponents } from "./dashboard/manifest";
import { animBgDefs, animBgComponents } from "./anim-bg/manifest";
import { threeDDefs, threeDComponents } from "./3d-effects/manifest";
import { r3fDefs } from "./r3f-scenes/manifest";
import { generatedRBDefs, generatedRBComponents } from "./react-bits/generated";
import { generatedACDefs, generatedACComponents } from "./aceternity/generated";
import { generatedUVDefs } from "./uiverse/generated";

export type PackComponentProps = {
  text?: string;
  imageSrc?: string;
  interactive?: boolean;
  onTrigger?: () => void;
  [key: string]: unknown;
};

/** 所有预打包 pack 的 ComponentDef（注册到统一 registry） */
export const PACK_DEFS: ComponentDef[] = [
  ...reactBitsDefs,
  ...aceternityDefs,
  ...uiverseDefs,
  ...magicUIDefs,
  ...shadcnDefs,
  ...dashboardDefs,
  ...animBgDefs,
  ...threeDDefs,
  ...r3fDefs,
  ...generatedRBDefs,
  ...generatedACDefs,
  ...generatedUVDefs,
];

/** pack 组件 id → React 组件（不含 css 组件，css 走 cssSandbox） */
export const PACK_COMPONENTS: Record<
  string,
  FC<PackComponentProps>
> = {
  ...reactBitsComponents,
  ...aceternityComponents,
  ...magicUIComponents,
  ...shadcnComponents,
  ...dashboardComponents,
  ...animBgComponents,
  ...threeDComponents,
  ...generatedRBComponents,
  ...generatedACComponents,
};
