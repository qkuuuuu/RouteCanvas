import type { ComponentDef } from "@/types/schema";
import { reactBitsDefs } from "./react-bits/manifest";
import { aceternityDefs } from "./aceternity/manifest";
import { uiverseDefs } from "./uiverse/manifest";
import { magicUIDefs } from "./magic-ui/manifest";
import { shadcnDefs } from "./shadcn/manifest";
import { dashboardDefs } from "./dashboard/manifest";
import { animBgDefs } from "./anim-bg/manifest";
import { threeDDefs } from "./3d-effects/manifest";
import { r3fDefs } from "./r3f-scenes/manifest";
import { generatedRBDefs } from "./react-bits/generated";
import { generatedACDefs } from "./aceternity/generated";
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
