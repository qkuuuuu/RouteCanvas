# RouteCanvas

> 无限画布 UI 流程与 JSON 协同工作台

RouteCanvas 是一款基于浏览器的可视化页面设计工具，通过**无限画布 + 组件拖拽 + 连线跳转**的方式，快速搭建多页面应用原型，并导出结构化 JSON 供 AI 或开发者直接消费。

**核心差异化能力：**
- **MCP Server 实时共编** — AI Agent（Cursor / Claude / Qoder）通过 MCP 协议直接读写画布，无需导出步骤
- **万能解析引擎** — 粘贴 HTML / React TSX / Vue / Svelte 代码，自动拆解为字段级可编辑画布节点
- **画笔交互** — 框选 + 涂画 + 文字指令，AI 局部精修 / 手绘生成真实组件

---

## 功能亮点

| 能力 | 说明 |
|------|------|
| 无限画布 | 基于 React Flow，自由缩放/平移，多页面画板并排布局 |
| 组件拖拽 | 左侧组件库拖入画板，支持 200+ 内置/第三方组件 |
| 连线跳转 | 组件 → 页面连线定义交互跳转，支持事件/参数/守卫 |
| 滚动续页 | 连线模式切换为“滚动续页”，多页合并为 PPT 式滚动长页 |
| **万能解析引擎** | 粘贴 HTML/TSX/Vue/Svelte 代码 → 自动拆解为可编辑节点 |
| **MCP Server** | 13 个工具，AI Agent 直接读写画布（get_canvas / add_node / import_code 等） |
| **智能导入** | 工具栏一键导入，自动检测格式，iframe 精确解析 + 节点预览 |
| 属性编辑 | 右侧面板编辑文本、颜色、动画速度等组件属性 |
| 富编辑原语 | Container/Text 支持渐变/玻璃/阴影/渐变文字等 20+ 视觉字段 |
| 自由缩放 | 选中组件后拖拽边角自由调整尺寸 |
| 层级管理 | zIndex 置顶/置底/上移/下移 |
| 画笔工具 | 自由绘制/直线/矩形/椭圆/箭头/三角形 + AI 草图生成 |
| AI 区域精修 | 框选多个组件 + 涂画标注 + 文字指令，AI 局部修改 |
| AI 设计助手 | 内置 Chat 面板，对话式修改画布 |
| 撤销重做 | Ctrl+Z / Ctrl+Shift+Z，最多 80 步历史 |
| 多画布管理 | 创建/切换/删除多个画布项目 |
| 实时预览 | 一键打开预览页，模拟真实交互跳转与滚动 |
| JSON 导入导出 | 结构化文档，可版本管理、跨设备迁移 |
| 组件市场 | 在线安装第三方组件包（Runtime 沙箱渲染） |
| 悬停预览 | 组件库中悬停即可实时预览组件效果 |

---

## 技术栈

- **框架**: Next.js 14 (App Router) + React 18 + TypeScript
- **画布**: @xyflow/react (React Flow 12)
- **状态管理**: Zustand + zundo (撤销/重做)
- **MCP Server**: @modelcontextprotocol/sdk + Zod
- **动画**: Framer Motion
- **3D**: Three.js + @react-three/fiber + @react-three/drei
- **样式**: Tailwind CSS
- **图标**: Lucide React

---

## 快速开始

### 环境要求

- Node.js 18+
- npm 或 pnpm

### 安装与启动

```bash
# 克隆项目
git clone <repo-url>
cd RouteCanvas

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

启动后访问 **http://localhost:3000**

### 构建生产版本

```bash
npm run build
npm start
```

---

## MCP Server（AI 实时共编）

RouteCanvas 内置 MCP Server，支持 Cursor / Claude Desktop / Qoder 等 IDE 直接读写画布。

### 配置

项目已包含 `.cursor/mcp.json`，IDE 重新加载窗口即可发现：

```json
{
  "mcpServers": {
    "routecanvas": {
      "command": "node",
      "args": ["mcp/dist/index.js"],
      "cwd": "${workspaceFolder}",
      "env": { "ROUTECANVAS_FILE": "${workspaceFolder}/canvas.json" }
    }
  }
}
```

### 工具列表（13 个）

| 工具 | 说明 |
|------|------|
| `get_canvas` | 获取完整画布 JSON |
| `list_components` | 列出可用组件 |
| `register_component` | 注册自定义组件 |
| `unregister_component` | 删除自定义组件 |
| `get_page` | 获取单页详情 |
| `add_page` | 新建页面 |
| `add_node` | 添加节点 |
| `update_node` | 修改节点属性/位置/尺寸 |
| `remove_node` | 删除节点 |
| `connect` | 创建页面间连线 |
| `remove_page` | 删除页面 |
| `set_canvas` | 整体替换画布 |
| **`import_code`** | **万能解析：前端代码 → 可编辑画布节点** |

### 万能解析引擎

在对话中说“解析这个”/“导入项目”，AI 自动调用 `import_code`：

```
用户：“帮我把这段代码导入画布”
  ↓
AI 调用 import_code(code, pageId)
  ↓
服务端解析 → 节点写入 canvas.json
  ↓
编辑器 mcpSync 轮询检测 → 画布实时渲染新节点
```

支持格式：**HTML/CSS**、**React TSX**、**Vue SFC**、**Svelte**

精度分层：
- 客户端 iframe（有 computedStyle + boundingBox）→ 最精确
- 服务端正则解析（Node.js 无 DOM）→ best-effort，AI 可用 update_node 微调

---

## 项目结构

```
src/
├── app/                    # Next.js App Router 页面
│   ├── page.tsx            # 编辑器入口
│   ├── preview/            # 预览页
│   └── api/                # API 路由 (AI / 解析 / 导入 / 文档)
├── canvas/                 # 画布核心
│   ├── ReactFlowCanvas.tsx # React Flow 画布主组件
│   ├── Editor.tsx          # 编辑器布局
│   ├── rfAdapter.ts        # Store ↔ React Flow 适配层
│   ├── AiAnnotateOverlay.tsx # AI 框选精修标注层
│   ├── nodes/              # 自定义节点 (PageBoard / UINode)
│   └── edges/              # 自定义边 (TransitionEdge)
├── components/             # 组件系统
│   ├── builtin/            # 内置基础组件 (40+)
│   ├── packs/              # 组件包
│   │   ├── aceternity/     # Aceternity UI (54 组件)
│   │   ├── react-bits/     # React Bits (60+ 组件)
│   │   ├── shadcn/         # Shadcn 风格 (25 组件)
│   │   ├── uiverse/        # Uiverse CSS 组件 (20 组件)
│   │   ├── dashboard/      # 仪表盘组件 (20 组件)
│   │   ├── anim-bg/        # 动画背景 (20 组件)
│   │   ├── 3d-effects/     # 3D 效果 (20 组件)
│   │   ├── magic-ui/       # Magic UI
│   │   └── r3f-scenes/     # R3F 3D 场景
│   ├── import/             # 智能导入对话框
│   ├── market/             # 组件市场
│   ├── renderer.tsx        # 统一组件渲染器
│   ├── registry.ts         # 组件注册表
│   └── sandbox/            # 运行时沙箱 (CSS / Babel)
├── panels/                 # 面板
│   ├── Toolbar.tsx         # 顶部工具栏
│   ├── ComponentLibrary.tsx# 左侧组件库
│   └── PropertyPanel.tsx   # 右侧属性面板
├── preview/                # 预览系统
│   ├── PreviewApp.tsx      # 预览渲染 (含 scroll-snap)
│   └── router.ts           # 预览路由逻辑
├── store/                  # 状态管理
│   └── canvasStore.ts      # Zustand 主 Store
├── data/                   # 数据层
│   ├── serializer.ts       # JSON 导入/导出/校验
│   ├── chatOps.ts          # AI Chat 操作执行器
│   └── promptTemplate.ts   # AI Prompt 模板
├── lib/                    # 工具函数
│   ├── parser/             # 万能解析引擎
│   │   ├── normalize.ts    # 多格式归一化 (HTML/TSX/Vue/Svelte)
│   │   ├── iframeRenderer.ts # 客户端 iframe 精确解析
│   │   ├── parseEngine.ts  # DOM 遍历 → 节点生成
│   │   ├── elementMapper.ts # 元素→类型映射规则
│   │   └── styleExtractor.ts # 样式提取工具
│   ├── canvasManager.ts    # 多画布管理
│   ├── mcpSync.ts          # MCP 文件同步 (canvas.json 双向)
│   └── id.ts               # ID 生成器
└── types/                  # TypeScript 类型
    └── schema.ts           # 核心 JSON Schema 定义

mcp/                        # MCP Server (独立 Node.js 服务)
├── src/
│   ├── index.ts            # 13 个 MCP 工具入口
│   ├── htmlParser.ts       # 服务端解析器 (import_code)
│   ├── components.ts       # 组件校验
│   └── canvasStore.ts      # canvas.json 读写
└── package.json
```

---

## 导出 JSON Schema

```jsonc
{
  "meta": {
    "schemaVersion": "1.0.0",
    "canvasName": "我的项目",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "viewport": { "x": 0, "y": 0, "zoom": 1 }
  },
  "pages": [
    {
      "id": "page_xxx",
      "name": "首页",
      "route": { "path": "/", "isIndex": true },
      "layout": { "x": 120, "y": 120, "width": 800, "height": 600 },
      "nodes": [
        {
          "id": "node_xxx",
          "type": "Button",
          "position": { "x": 40, "y": 40 },
          "size": { "width": 120, "height": 40 },
          "props": { "text": "点击我", "custom": { "color": "#6366f1" } },
          "zIndex": 1
        }
      ]
    }
  ],
  "transitions": [
    {
      "id": "trans_xxx",
      "source": { "pageId": "page_xxx", "nodeId": "node_xxx", "event": "onClick" },
      "target": { "pageId": "page_yyy", "params": { "id": "${item.id}" } },
      "mode": "navigate",       // "navigate" | "scroll"
      "guard": { "requireAuth": false }
    }
  ],
  "componentRegistry": []
}
```

---

## 环境变量（可选）

| 变量 | 说明 |
|------|------|
| `OPENAI_API_KEY` | 服务端 AI 代理使用的 API Key |
| `NEXT_PUBLIC_CLOUD_API` | 云端同步 API 地址（留空则纯本地） |
| `ROUTECANVAS_FILE` | MCP Server 画布文件路径（默认 cwd/canvas.json） |

---

## License

MIT
