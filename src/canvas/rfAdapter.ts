import type { Edge, Node } from "@xyflow/react";
import type {
  CanvasState,
  Page,
  Transition,
  UINode,
  ComponentDef,
} from "@/types/schema";

/* React Flow 节点 data 载荷 */
export interface PageNodeData {
  kind: "page";
  page: Page;
  [key: string]: unknown;
}
export interface UINodeData {
  kind: "ui";
  node: UINode;
  pageId: string;
  component?: ComponentDef; // 节点 type 对应的注册表项（便于渲染）
  [key: string]: unknown;
}
export type RFNodeData = PageNodeData | UINodeData;

export type RFNode = Node<RFNodeData>;
export type RFEdge = Edge;

export const PAGE_NODE_TYPE = "page" as const;
export const UI_NODE_TYPE = "ui" as const;
export const TRANSITION_EDGE_TYPE = "transition" as const;

/**
 * 规范 store → React Flow nodes。
 * page = group 节点（绝对坐标 = layout）；UI 节点 = parentId=pageId + extent:parent（相对坐标）。
 * 页面折叠时不输出子节点。
 */
export function toRFNodes(state: CanvasState): RFNode[] {
  const nodes: RFNode[] = [];
  // 预建 registry Map 避免每个节点都 .find()
  const regMap = new Map(state.componentRegistry.map((c) => [c.id, c]));
  for (const page of state.pages) {
    const collapsed = page.layout.collapsed ?? false;
    nodes.push({
      id: page.id,
      type: PAGE_NODE_TYPE,
      position: { x: page.layout.x, y: page.layout.y },
      data: { kind: "page", page } as PageNodeData,
      width: page.layout.width,
      height: collapsed ? 44 : page.layout.height,
      className: "routecanvas-page",
    });
    if (collapsed) continue;
    for (const node of page.nodes) {
      nodes.push({
        id: node.id,
        type: UI_NODE_TYPE,
        position: { x: node.position.x, y: node.position.y },
        data: {
          kind: "ui",
          node,
          pageId: page.id,
          component: regMap.get(node.type),
        } as UINodeData,
        width: node.size.width,
        height: node.size.height,
        parentId: page.id,
        extent: "parent",
        zIndex: node.zIndex ?? 0,
        className: "routecanvas-uinode",
      });
    }
  }
  return nodes;
}

/** 规范 store → React Flow edges（transition: source=UI 节点 → target=页面） */
export function toRFEdges(state: CanvasState): RFEdge[] {
  return state.transitions.map((t: Transition): RFEdge => ({
    id: t.id,
    source: t.source.nodeId,
    target: t.target.pageId,
    sourceHandle: "source",
    targetHandle: "target",
    type: TRANSITION_EDGE_TYPE,
    data: { transition: t },
    markerEnd: "arrowclosed",
  }));
}

/** 各组件类型的默认尺寸（拖入画布时的初始宽高） */
const DEFAULT_SIZES: Record<string, { width: number; height: number }> = {
  // builtin
  Button: { width: 120, height: 40 },
  Input: { width: 200, height: 36 },
  Text: { width: 200, height: 24 },
  Image: { width: 200, height: 150 },
  Card: { width: 240, height: 160 },
  Form: { width: 280, height: 200 },
  Container: { width: 240, height: 160 },
  Badge: { width: 80, height: 24 },
  Link: { width: 120, height: 24 },
  Divider: { width: 240, height: 4 },
  ProgressBar: { width: 200, height: 40 },
  Switch: { width: 140, height: 28 },
  Checkbox: { width: 140, height: 28 },
  Textarea: { width: 240, height: 100 },
  Select: { width: 200, height: 36 },
  Icon: { width: 48, height: 48 },
  Avatar: { width: 48, height: 48 },
  Alert: { width: 280, height: 60 },
  Tabs: { width: 240, height: 100 },
  Accordion: { width: 240, height: 120 },
  Navbar: { width: 320, height: 48 },
  Footer: { width: 320, height: 40 },
  Breadcrumb: { width: 200, height: 24 },
  Pagination: { width: 240, height: 32 },
  RadioGroup: { width: 160, height: 80 },
  Slider: { width: 200, height: 48 },
  Spinner: { width: 48, height: 48 },
  Skeleton: { width: 200, height: 80 },
  StatCard: { width: 160, height: 80 },
  Quote: { width: 200, height: 60 },
  CodeBlock: { width: 240, height: 80 },
  Tag: { width: 80, height: 28 },
  List: { width: 200, height: 120 },
  Table: { width: 280, height: 120 },
  Steps: { width: 280, height: 60 },
  Rating: { width: 160, height: 28 },
  Counter: { width: 120, height: 36 },
  SearchInput: { width: 200, height: 36 },
  PasswordInput: { width: 200, height: 36 },
  Empty: { width: 160, height: 100 },
  Banner: { width: 300, height: 40 },
  Notification: { width: 280, height: 60 },
  Timeline: { width: 200, height: 120 },
  Tooltip: { width: 100, height: 24 },
  // 图标快捷条目
  "Icon-Heart": { width: 48, height: 48 },
  "Icon-Star": { width: 48, height: 48 },
  "Icon-Settings": { width: 48, height: 48 },
  "Icon-Home": { width: 48, height: 48 },
  "Icon-Search": { width: 48, height: 48 },
  "Icon-User": { width: 48, height: 48 },
  "Icon-Bell": { width: 48, height: 48 },
  "Icon-Mail": { width: 48, height: 48 },
  "Icon-Camera": { width: 48, height: 48 },
  "Icon-Map": { width: 48, height: 48 },
  "Icon-Clock": { width: 48, height: 48 },
  "Icon-Zap": { width: 48, height: 48 },
  // 手绘节点
  Freehand: { width: 200, height: 150 },
  // react-bits
  "rb-shimmer-button": { width: 160, height: 44 },
  "rb-gradient-text": { width: 200, height: 36 },
  "rb-card-hover": { width: 220, height: 150 },
  "rb-loading-dots": { width: 80, height: 40 },
  "rb-spotlight-card": { width: 220, height: 120 },
  "rb-animated-text": { width: 200, height: 36 },
  // aceternity
  "ac-hover-border-gradient": { width: 160, height: 44 },
  "ac-background-beams": { width: 300, height: 200 },
  "ac-card-spotlight": { width: 240, height: 150 },
  "ac-text-generate": { width: 220, height: 40 },
  "ac-meteors": { width: 300, height: 200 },
  "ac-lamp-effect": { width: 300, height: 200 },
  // uiverse
  "uv-button-glow": { width: 140, height: 44 },
  "uv-loader-spinner": { width: 60, height: 60 },
  "uv-card-flip": { width: 200, height: 150 },
  "uv-toggle-switch": { width: 60, height: 30 },
  "uv-checkbox-glow": { width: 36, height: 36 },
  "uv-button-3d": { width: 140, height: 44 },
  // 新增表单组件
  DateRangePicker: { width: 280, height: 36 },
  WeekPicker: { width: 180, height: 36 },
  MonthPicker: { width: 180, height: 36 },
  ImageUpload: { width: 200, height: 120 },
  SignaturePad: { width: 240, height: 120 },
  CaptchaInput: { width: 240, height: 40 },
  AmountInput: { width: 180, height: 36 },
  PercentageInput: { width: 160, height: 36 },
  DualSlider: { width: 220, height: 50 },
  InputGroup: { width: 220, height: 80 },
  ClearableInput: { width: 200, height: 36 },
  VoiceInput: { width: 220, height: 40 },
  RichTextEditor: { width: 300, height: 160 },
  MarkdownEditor: { width: 300, height: 160 },
  CodeEditor: { width: 280, height: 150 },
  JsonEditor: { width: 260, height: 120 },
  ColorSwatch: { width: 200, height: 60 },
  FontPicker: { width: 180, height: 36 },
  IconPicker: { width: 200, height: 80 },
  MaskedInput: { width: 200, height: 36 },
  SearchSelect: { width: 200, height: 36 },
  EditableField: { width: 160, height: 32 },
  StrengthMeter: { width: 220, height: 70 },
  PinInput: { width: 240, height: 56 },
  Section: { width: 800, height: 500 },
  AnimSection: { width: 800, height: 500 },
  ParallaxSection: { width: 800, height: 500 },
  SplineEmbed: { width: 400, height: 300 },
};

const FALLBACK_SIZE = { width: 140, height: 44 };

/** 根据组件类型返回默认尺寸 */
export function defaultSizeForType(type: string): { width: number; height: number } {
  if (DEFAULT_SIZES[type]) return DEFAULT_SIZES[type];
  // pack 组件智能分配尺寸
  if (type.startsWith("ac-") || type.startsWith("rb-") || type.startsWith("uv-") || type.startsWith("mu-") || type.startsWith("scn-") || type.startsWith("dash-") || type.startsWith("abg-") || type.startsWith("3d-") || type.startsWith("r3f-")) {
    if (/bg|background|card|beam|aurora|vortex|grid|dot|glass|pricing|skeleton-card|lamp|meteor|shooting|wave|particles|slide|kpi|donut|sparkline|revenue|task-board|storage|gradient-flow|starfield|ocean|fireflies|northern|bubbles|matrix|smoke|rainbow|pulse-grid|lava|snowfall|cyber|sunset/.test(type)) {
      return { width: 200, height: 120 };
    }
    if (/table|calendar|sheet|command|context-menu|notification-center|activity-feed|recent-orders|traffic|team-members|status-overview/.test(type)) {
      return { width: 200, height: 140 };
    }
    return { width: 160, height: 56 };
  }
  return FALLBACK_SIZE;
}

/** 工具：从 RF node id 找到所属页面与节点 */
export function locateNode(
  state: CanvasState,
  nodeId: string,
): { page: Page; node: UINode } | null {
  for (const page of state.pages) {
    const node = page.nodes.find((n) => n.id === nodeId);
    if (node) return { page, node };
  }
  return null;
}
