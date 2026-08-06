// 对齐产品设计文档第 5 节 JSON Schema 规范的 TypeScript 类型定义。

/* ============ meta：画布元信息 ============ */
export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export interface Meta {
  schemaVersion: string;
  canvasName?: string;
  createdAt?: string;
  updatedAt?: string;
  viewport?: Viewport;
}

/* ============ route / layout ============ */
export interface Route {
  path: string;
  name?: string;
  isIndex?: boolean;
}

export interface Layout {
  x: number;
  y: number;
  width: number;
  height: number;
  collapsed?: boolean;
}

/* ============ V2 design primitives ============ */
export type BreakpointKey = "desktop" | "tablet" | "mobile";
export type LayoutMode = "absolute" | "stack" | "grid";

export interface ResponsiveFrame {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface NodeLayout {
  mode: LayoutMode;
  direction?: "horizontal" | "vertical";
  gap?: number;
  padding?: number;
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between";
  columns?: number;
}

export interface NodeConstraints {
  horizontal?: "left" | "right" | "center" | "stretch";
  vertical?: "top" | "bottom" | "center" | "stretch";
}

export interface DesignToken {
  id: string;
  name: string;
  type: "color" | "number" | "string" | "font" | "shadow";
  value: string | number;
  description?: string;
}

export interface DesignSystem {
  tokens: DesignToken[];
  breakpoints: Record<BreakpointKey, { label: string; width: number }>;
  components?: DesignComponent[];
}

export interface DesignComponentVariant {
  id: string;
  name: string;
  props: NodeProps;
}

export interface DesignComponent {
  id: string;
  name: string;
  type: string;
  size: Size;
  variants: DesignComponentVariant[];
}

/* ============ props：UI 节点素材与逻辑绑定 ============ */
export interface NodeProps {
  text?: string;
  imageSrc?: string;
  apiUrl?: string;
  code?: string;
  custom?: Record<string, unknown>;
}

/* ============ nodes：UI 节点 ============ */
export interface Position {
  x: number;
  y: number;
}
export interface Size {
  width: number;
  height: number;
}

export interface UINode {
  id: string;
  type: string; // 组件类型，对应 componentRegistry 中的 id
  position: Position; // 相对所属页面画板
  size: Size;
  props?: NodeProps;
  zIndex?: number; // 层级（数字越大越在上层）
  /** V2: parentId creates a layer/component tree while preserving V1 positions. */
  parentId?: string | null;
  layout?: NodeLayout;
  constraints?: NodeConstraints;
  responsive?: Partial<Record<BreakpointKey, ResponsiveFrame>>;
  hidden?: boolean;
  locked?: boolean;
  componentId?: string;
  variant?: string;
  note?: string;
}

/* ============ pages：页面画板与组件树 ============ */
export interface Page {
  id: string;
  name: string;
  route: Route;
  layout: Layout;
  nodes: UINode[];
}

/* ============ transitions：跳转连线逻辑 ============ */
export interface Source {
  pageId: string;
  nodeId: string;
  event?: string; // 默认 onClick
}
export interface Target {
  pageId: string;
  params?: Record<string, string>;
}
export interface Guard {
  requireAuth?: boolean;
  label?: string;
  custom?: Record<string, unknown>;
}
export interface Transition {
  id: string;
  source: Source;
  target: Target;
  /** 连线模式：navigate=页面跳转（默认），scroll=滚动续页（同一滚动流） */
  mode?: "navigate" | "scroll";
  guard?: Guard;
}

/* ============ 组件市场 ============ */
export type ComponentSource = "builtin" | "pack" | "runtime" | "css";

export type FieldType =
  | "string"
  | "number"
  | "boolean"
  | "select"
  | "keyvalue"
  | "code"
  | "image"
  | "color";

/** 属性面板字段定义；bucket 决定存储位置（base 四件套 vs custom 扩展） */
export interface Field {
  key: string;
  label: string;
  type: FieldType;
  options?: string[]; // type=select 时
  default?: unknown;
  bucket?: "base" | "custom"; // 默认 custom
}

export interface ComponentDef {
  source: ComponentSource;
  id: string; // 即组件 type
  label: string;
  category?: string;
  subCategory?: string; // 二级分类（如 基础>展示、基础>反馈）
  propsSchema: Field[];
  pack?: string; // source=pack 时所属包名
  tsxSource?: string; // source=runtime 时源码
  url?: string; // source=runtime 时来源 URL
  html?: string; // source=css (uiverse) 时 HTML 片段
  css?: string; // source=css 时 CSS 片段
  renderTree?: RenderNode; // 保留：声明式 DSL（可选，目前 builtin 也可用）
}

/** 声明式渲染树（保留给未来/css 路径） */
export interface RenderNode {
  tag: string;
  style?: Record<string, string>;
  className?: string;
  text?: string;
  bindProps?: string;
  children?: RenderNode[];
}

/* ============ comments：画布评论钉 ============ */
export interface CanvasComment {
  id: string;
  pageId: string;
  nodeId?: string | null;
  x: number; // 相对所属页面的坐标
  y: number;
  text: string;
  author?: string;
  createdAt: string;
  resolved?: boolean;
}

/* ============ 顶层文档 ============ */
export interface CanvasDocument {
  meta: Meta;
  pages: Page[];
  transitions: Transition[];
  designSystem?: DesignSystem;
  comments?: CanvasComment[];
}

/** 完整工作台状态（含组件注册表，注册表不随文档导出，单独存） */
export interface CanvasState extends CanvasDocument {
  componentRegistry: ComponentDef[];
}
