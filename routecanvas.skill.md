# RouteCanvas Design Skill

> 教 AI Agent 生成合法的 RouteCanvas 画布 JSON。将本文件放入项目根目录，Claude Code / Cursor / Qoder 等 Agent 即可直接生成、修改多页面应用设计。

## 触发条件

当用户要求"设计页面"、"生成 App 原型"、"创建画布"、"添加页面/组件/连线"时，使用本技能输出 RouteCanvas JSON。

## ⚠️ 设计系统约束（必读）

生成/修改画布前，**必须**阅读并遵守：

1. **[DESIGN.md](./DESIGN.md)** — 品牌设计契约：颜色令牌、字体排印、间距布局、组件规范、命名规则（保证「一致」）。
2. **[designer.skill.md](./designer.skill.md)** — 设计师审美技能：背景氛围、色彩进阶、字体戏剧性、深度质感、动效品味、构图套路、风格原型（保证「好看、上档次」）。

**三者分工**：本文件保证 JSON 合法，DESIGN.md 保证一致，designer.skill.md 负责审美。生成「好看」的设计时，务必按 designer.skill.md 的标准选背景、配色、排版、动效，**不要产出纯白背景的线框图**。

## 核心概念

RouteCanvas 是一个**多页面可视化流程编排画布**。一个画布文档包含：

- **pages**：页面画板（每个页面是一个独立的路由屏幕）
- **nodes**：页面内的 UI 组件节点（只能使用组件白名单中的 type）
- **transitions**：页面间的跳转连线（含触发事件、守卫条件、参数传递）

## JSON Schema

```typescript
interface CanvasDocument {
  meta: {
    schemaVersion: "1.0.0";
    canvasName?: string;
    createdAt?: string;   // ISO 8601
    updatedAt?: string;
    viewport?: { x: number; y: number; zoom: number };
  };
  pages: Page[];
  transitions: Transition[];
  componentRegistry?: ComponentDef[]; // 可选，用户自定义组件
}

interface Page {
  id: string;            // 格式：page_xxx（唯一）
  name: string;          // 页面名称，如"首页"
  route: {
    path: string;        // 路由路径，如 "/"、"/login"、"/detail"
    name?: string;
    isIndex?: boolean;   // 仅一个页面可为 true（入口页）
  };
  layout: {
    x: number;           // 画布上的位置（页面画板坐标）
    y: number;
    width: number;       // 页面宽度，默认 800
    height: number;      // 页面高度，默认 600
    collapsed?: boolean;
  };
  nodes: UINode[];
}

interface UINode {
  id: string;            // 格式：node_xxx（全局唯一）
  type: string;          // 组件类型，必须在组件白名单中
  position: { x: number; y: number };  // 相对页面左上角
  size: { width: number; height: number };
  props?: {
    text?: string;       // 文本内容
    imageSrc?: string;   // 图片地址
    apiUrl?: string;
    code?: string;
    custom?: Record<string, unknown>;  // 组件自定义属性
  };
  zIndex?: number;       // 层级，数字越大越在上层
}

interface Transition {
  id: string;            // 格式：trans_xxx
  source: {
    pageId: string;      // 来源页面 id
    nodeId: string;      // 触发节点 id
    event?: string;      // 默认 "onClick"
  };
  target: {
    pageId: string;      // 目标页面 id
    params?: Record<string, string>;  // 路由参数
  };
  mode?: "navigate" | "scroll";  // navigate=跳转（默认），scroll=滚动续页
  guard?: {
    requireAuth?: boolean;  // 需要登录
    label?: string;         // 守卫说明
  };
}
```

## 组件白名单（type 必须从以下选择）

### 基础组件（builtin）
| type | 说明 | 常用 props |
|------|------|-----------|
| Button | 按钮 | text, custom.variant(primary/secondary/ghost/danger), custom.size(sm/md/lg) |
| Input | 输入框 | text, custom.placeholder, custom.editable |
| Text | 文本 | text, custom.variant(h1/h2/h3/body/caption) |
| Image | 图片 | imageSrc, text(alt) |
| Card | 卡片 | text |
| Form | 表单 | text |
| Container | 容器 | text, custom.bg, custom.border |
| Badge | 徽章 | text |

### Pack 组件（精选，完整列表约 280+）
| type 前缀 | 来源 | 示例 |
|-----------|------|------|
| rb- | React Bits | rb-animated-cursor, rb-gradient-text, rb-count-up |
| ac- | Aceternity UI | ac-spotlight-card, ac-3d-card, ac-text-generate |
| scn- | Shadcn | scn-data-table, scn-progress-steps, scn-stat-card |
| mui- | Magic UI | mui-particle-text, mui-meteor-rain, mui-wave-progress |
| dash- | Dashboard | dash-progress-board, dash-calendar-heat, dash-rank-list |
| abg- | 动画背景 | abg-aurora, abg-particles, abg-waves |
| td- | 3D 特效 | td-tilt-card, td-parallax |
| uv- | Uiverse (CSS) | uv-neon-btn, uv-glass-card |

**规则：不确定 type 时，优先使用 builtin 组件（Button/Text/Input/Card/Container）。**

## 🧩 组件选型：用富原语 + 现有库，不注册自定义组件

组件库是**共享资产**，**不要注册自定义组件**（会造成污染）。正确做法是用**富原语 + 现有库组合出一切，全部可编辑**：

1. **富 Container/Text 是主力（零注册）**：`Container` 可设背景（纯色/渐变/图片/玻璃拟态）、圆角、品牌色阴影、边框、内边距、不透明度；`Text` 可设字号/字重/颜色/对齐/字间距/行高/斜体/大写/渐变文字/文字阴影。这些全是**可编辑数据**，用 `add_node`/`update_node` 的 `props.custom` 直接设置（详见 designer.skill.md §8 富原语速查）。
2. **背景与动画放开用**：`abg-` 动态背景、`rb-`/`ac-` 动画组件、高级卡片、华丽按钮、渐变文字可自由使用（详见 designer.skill.md §1/§8），无需任何注册。
3. **万不得已才用临时组件**：仅当现有组件 + 富原语**确实无法表达**强业务专属复杂部件时，才调用 `register_component` 创建**画布临时组件**（只属当前画布、组件库单独「本画布·临时」分区展示、可一键清理、绝不进共享库），id 带业务前缀（如 `ice-`/`shop-`）。

### 若万不得已用临时组件：TSX 源码要求

- 必须 `default export` 一个 React 组件；
- 推荐用**内联样式**（也可用 Tailwind 类名）；
- 可 `import react / framer-motion / lucide-react`（运行时经 esm.sh 加载）；
- 通过 `props.text`、`props.imageSrc` 以及展开的 `props.custom` 接收属性（即节点 `props.custom` 里的 key 会被平铺到组件 props 上）。

临时组件示例（仅在富原语 + 现有库都不够用时）：

```
register_component({ id: "ice-flavor-card", label: "口味展示卡", category: "冰激淋", props: ["emoji","price"], tsxSource: "..." })
```

> 能用富 `Container`/`Text` + 现有特效组件拼出来的，就不要注册。富原语做玻璃卡片：`bgType=glass`+`blur`+`borderWidth`；渐变大标题：`Text` 设 `gradText=true`。

## 布局规范

- 页面默认尺寸 800×600，移动端页面可用 390×844
- 节点 position 是相对页面左上角的偏移
- 节点之间建议间距 16-24px
- 页面画板 layout.x/y 在画布上错开排列（如每页 x 间隔 900）

## 示例 1：登录流程（2 页面 + 守卫）

```json
{
  "meta": { "schemaVersion": "1.0.0", "canvasName": "登录流程" },
  "pages": [
    {
      "id": "page_login",
      "name": "登录页",
      "route": { "path": "/login", "isIndex": true },
      "layout": { "x": 100, "y": 100, "width": 390, "height": 844 },
      "nodes": [
        { "id": "node_logo", "type": "Image", "position": { "x": 145, "y": 80 }, "size": { "width": 100, "height": 100 }, "props": { "imageSrc": "/logo.png", "text": "Logo" } },
        { "id": "node_title", "type": "Text", "position": { "x": 95, "y": 210 }, "size": { "width": 200, "height": 40 }, "props": { "text": "欢迎回来", "custom": { "variant": "h1" } } },
        { "id": "node_user", "type": "Input", "position": { "x": 45, "y": 300 }, "size": { "width": 300, "height": 48 }, "props": { "custom": { "placeholder": "用户名" } } },
        { "id": "node_pass", "type": "Input", "position": { "x": 45, "y": 370 }, "size": { "width": 300, "height": 48 }, "props": { "custom": { "placeholder": "密码" } } },
        { "id": "node_btn", "type": "Button", "position": { "x": 45, "y": 460 }, "size": { "width": 300, "height": 48 }, "props": { "text": "登录", "custom": { "variant": "primary" } } }
      ]
    },
    {
      "id": "page_home",
      "name": "首页",
      "route": { "path": "/" },
      "layout": { "x": 600, "y": 100, "width": 390, "height": 844 },
      "nodes": [
        { "id": "node_welcome", "type": "Text", "position": { "x": 45, "y": 60 }, "size": { "width": 300, "height": 40 }, "props": { "text": "你好，用户", "custom": { "variant": "h1" } } },
        { "id": "node_card1", "type": "Card", "position": { "x": 45, "y": 140 }, "size": { "width": 300, "height": 120 }, "props": { "text": "今日推荐" } }
      ]
    }
  ],
  "transitions": [
    {
      "id": "trans_login_home",
      "source": { "pageId": "page_login", "nodeId": "node_btn", "event": "onClick" },
      "target": { "pageId": "page_home" },
      "guard": { "requireAuth": true, "label": "验证通过后跳转" }
    }
  ]
}
```

## 示例 2：电商落地页（滚动续页模式）

```json
{
  "meta": { "schemaVersion": "1.0.0", "canvasName": "产品落地页" },
  "pages": [
    {
      "id": "page_hero",
      "name": "首屏",
      "route": { "path": "/", "isIndex": true },
      "layout": { "x": 100, "y": 100, "width": 800, "height": 600 },
      "nodes": [
        { "id": "node_h1", "type": "Text", "position": { "x": 200, "y": 180 }, "size": { "width": 400, "height": 60 }, "props": { "text": "让设计更简单", "custom": { "variant": "h1" } } },
        { "id": "node_sub", "type": "Text", "position": { "x": 250, "y": 260 }, "size": { "width": 300, "height": 30 }, "props": { "text": "AI 驱动的可视化设计工具", "custom": { "variant": "body" } } },
        { "id": "node_cta", "type": "Button", "position": { "x": 320, "y": 340 }, "size": { "width": 160, "height": 48 }, "props": { "text": "免费试用", "custom": { "variant": "primary" } } }
      ]
    },
    {
      "id": "page_pricing",
      "name": "定价",
      "route": { "path": "/pricing" },
      "layout": { "x": 1000, "y": 100, "width": 800, "height": 600 },
      "nodes": [
        { "id": "node_p_title", "type": "Text", "position": { "x": 300, "y": 60 }, "size": { "width": 200, "height": 40 }, "props": { "text": "选择方案", "custom": { "variant": "h2" } } },
        { "id": "node_free", "type": "Card", "position": { "x": 80, "y": 150 }, "size": { "width": 200, "height": 280 }, "props": { "text": "免费版 ¥0" } },
        { "id": "node_pro", "type": "Card", "position": { "x": 300, "y": 150 }, "size": { "width": 200, "height": 280 }, "props": { "text": "专业版 ¥99" } },
        { "id": "node_ent", "type": "Card", "position": { "x": 520, "y": 150 }, "size": { "width": 200, "height": 280 }, "props": { "text": "企业版 联系销售" } }
      ]
    }
  ],
  "transitions": [
    {
      "id": "trans_scroll_pricing",
      "source": { "pageId": "page_hero", "nodeId": "node_cta", "event": "onClick" },
      "target": { "pageId": "page_pricing" },
      "mode": "scroll"
    }
  ]
}
```

## 示例 3：带参数传递的商品详情

```json
{
  "transitions": [
    {
      "id": "trans_list_detail",
      "source": { "pageId": "page_list", "nodeId": "node_item1", "event": "onClick" },
      "target": { "pageId": "page_detail", "params": { "productId": "12345" } },
      "mode": "navigate"
    }
  ]
}
```

## 输出规则

1. **只输出合法 JSON**，不要添加注释或多余字段
2. **id 必须唯一**：page_xxx / node_xxx / trans_xxx 格式
3. **type 必须在白名单中**；优先用富 Container/Text + 现有组件 + 编辑属性实现设计，**不注册自定义组件**；仅当确实不够用时才 `register_component` 创建画布临时组件（不要虚构 type）
4. **transitions 的 source.nodeId 必须存在于对应页面的 nodes 中**
5. **最多一个页面设置 isIndex: true**
6. 生成完整画布时输出 CanvasDocument 根对象
7. 增量修改时，明确说明操作类型：`add_page` / `add_node` / `update_node` / `remove_node` / `connect` / `disconnect`

## MCP 工具（如已配置 RouteCanvas MCP Server）

优先使用 MCP 工具直接操作画布，而非输出 JSON 文本：

- `get_canvas` — 读取当前画布
- `list_components` — 查看可用组件（含本画布临时组件）
- `register_component` / `unregister_component` — 创建 / 删除画布临时组件（万不得已才用）
- `add_page` / `add_node` / `update_node` / `remove_node` — 增删改
- `connect` — 创建页面连线
- `set_canvas` — 整体替换画布（会保留已有的画布临时组件）
