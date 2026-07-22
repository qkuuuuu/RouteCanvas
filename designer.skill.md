# RouteCanvas Designer Skill（设计师审美技能）

> 教 AI Agent 把 RouteCanvas 设计做得**有审美、有高级感**，而不是"能跑但很 low"的线框图。
> 本技能与 [routecanvas.skill.md](./routecanvas.skill.md)（管"合法 JSON"）和 [DESIGN.md](./DESIGN.md)（管"品牌契约/结构规范"）配合使用：
> **routecanvas.skill 保证合法，DESIGN.md 保证一致，本技能负责"好看、上档次"。**

## 触发条件

只要涉及"设计页面 / 生成原型 / 美化 / 做个官网 / 落地页 / 让画面更好看"，**必须**先加载本技能，用下面的审美标准指导每一个节点的选型、配色、排版与动效。

---

## 0. 核心理念：高级感 = 克制的丰富

"Low" 的设计通常犯两类相反的错：要么**太素**（白底 + 默认组件 + 小标题，像线框图），要么**太花**（五颜六色 + 到处动画 + 元素堆砌）。

高级感的本质是 **"克制的丰富"**：

- **丰富**：有氛围（背景）、有层次（深度）、有戏剧性（大标题/渐变）、有生命（动效）。
- **克制**：统一的情绪、有限的色板、一致的节奏、动效服务于焦点而非喧宾夺主。

> 一句话：**宁可少而精，不要多而杂。每个元素都要有存在的理由。**

---

## 1. 背景与氛围（最高优先级 —— 告别"白底线框图"）

**铁律：落地页 / 首页 / Hero 区，禁止纯白背景。** 背景是决定"高级感"的第一杠杆。

### 背景分层技法（用现有组件，无需注册）

把一个 `abg-` 动态背景组件当作**整页背景层**，内容叠在上层：

```
背景层：{ type: "abg-xxx", position:{x:0,y:0}, size:{width:页面宽,height:页面高}, zIndex: 0 }
内容层：{ type: "Text"/"Button"/..., zIndex: 1, 2, 3 ... }
```

`zIndex` 越大越靠上。背景铺满整页（position 0,0 + size 等于页面尺寸），内容节点 zIndex ≥ 1。

### 背景选型速查（abg- 动态背景，全部现成）

| 情绪 / 风格 | 推荐背景 | 说明 |
|------|------|------|
| 高级 / 梦幻 | `abg-aurora-curtain` 极光帷幕、`abg-northern-lights` 极光 | 流动光带，最有"大片感" |
| 温柔 / 浪漫 | `abg-gradient-flow` 流动渐变、`abg-gradient-orbs` 渐变光球、`abg-sunset-gradient` 日落渐变 | 柔和渐变，适合美妆/甜品/生活方式 |
| 科技 / 未来 | `abg-particle-network` 粒子网络、`abg-cyber-grid` 赛博网格、`abg-geometric-flow` 几何流动、`abg-pulse-grid` 脉冲网格 | 适合 SaaS / 工具 / 科技产品 |
| 沉浸 / 深邃 | `abg-starfield` 星空、`abg-nebula` 星云、`abg-meteor-shower` 流星雨 | 深色背景 + 亮色文字，质感强 |
| 自然 / 清新 | `abg-ocean-waves` 海浪、`abg-fireflies` 萤火虫、`abg-snowfall` 雪花、`abg-bubbles` 气泡 | 适合环保/旅游/季节主题 |
| 活力 / 趣味 | `abg-rainbow-wave` 彩虹波浪、`abg-lava-lamp` 熔岩灯 | 适合潮玩/年轻品牌 |

> 背景组件的 `custom.color` 要与品牌主色协调（见 §2），`custom.speed` 建议 0.6–1.2（太快显廉价）。

---

## 2. 色彩进阶（Color）

### 60-30-10 法则
- **60% 主色调**：背景 / 大面积（决定整体情绪）。
- **30% 辅助色**：卡片 / 次级区块。
- **10% 强调色**：CTA 按钮 / 关键数字（最饱和，最吸睛）。

### 配色纪律
- **一个设计最多 3 种有彩色**（+ 黑白灰中性色）。颜色越多越 low。
- **色温统一**：要么都偏暖（粉/橙/金），要么都偏冷（蓝/紫/青），不要冷暖混搭打架。
- **渐变是高级感的捷径**：品牌渐变 `#6366f1 → #ec4899`（见 DESIGN.md）。同色系渐变（如 `#a855f7 → #6366f1`）最安全高级。
- **文字用渐变要克制**：只给"大标题 / 关键数字"用渐变文字（`rb-gradient-text`），正文永远用纯色。

### 情绪色板（直接取用）
| 情绪 | 主色 | 辅助 | 强调 | 背景倾向 |
|------|------|------|------|------|
| 高级奢华 | `#1e1b4b` 深紫 | `#a855f7` 紫 | `#f59e0b` 金 | 深色 + 极光 |
| 温柔浪漫 | `#ec4899` 粉 | `#c084fc` 紫 | `#f472b6` 玫红 | 粉紫渐变 |
| 科技未来 | `#6366f1` 靛 | `#22d3ee` 青 | `#818cf8` 浅靛 | 深色 + 粒子 |
| 清新自然 | `#10b981` 翠 | `#34d399` 绿 | `#f59e0b` 橙 | 浅色 + 海浪 |
| 活力潮流 | `#f97316` 橙 | `#ec4899` 粉 | `#facc15` 黄 | 彩虹波浪 |

---

## 3. 字体戏剧性（Typography）

"Low" 的设计标题太小、太怯。高级设计**敢用大标题、强对比**。

- **Hero 大标题要"炸场"**：40–64px、字重 800–900。一句话讲清价值（"每一口，都是云朵的味道"）。
- **字号对比要狠**：大标题 48px vs 辅助文字 13px，对比越强烈层级越清晰。
- **字重对比**：标题 800–900，正文 400–500，靠字重而非颜色拉开层级。
- **字间距（letter-spacing）**：标题略紧（-0.5px）显精致；全大写英文/标签略松（1–2px）显高级。
- **渐变 / 动画标题**：Hero 主标题用 `rb-gradient-text`（流光渐变）或 `rb-animated-text`（逐字浮现），瞬间提升档次。
- **数字要滚动**：统计数字用 `rb-count-up`（数字滚动），比静态数字高级十倍。

> 仍遵守 DESIGN.md：每页 1 个 H1、正文行高 1.5–1.6、单行不超 60 字符。

---

## 4. 深度与质感（Depth & Texture）

扁平 = 廉价。高级设计有**层次/纵深**。

- **玻璃拟态（Glassmorphism）**：半透明白 `rgba(255,255,255,0.6)` + `backdrop-filter: blur(20px)` + 细白边。导航栏、徽章、浮层首选。
- **柔和阴影**：卡片用大范围低透明度阴影（`0 16px 40px rgba(色,0.15)`），颜色取自品牌色，比纯黑阴影高级。
- **渐变叠加**：在背景图上叠一层品牌色渐变蒙版，统一色调。
- **卡片悬浮**：用 `rb-card-hover`（3D 悬停）/ `ac-3d-card` / `rb-spotlight-card`（聚光灯）让卡片"活"起来。
- **层级清晰**：背景层（zIndex 0）→ 装饰层 → 内容层（zIndex ≥1）→ 浮层（最高）。

---

## 5. 动效品味（Animation）

动效是双刃剑：**用得好是高级，用多了是灾难。**

### 三层动效框架
1. **氛围动效（背景层）**：`abg-` 背景的持续微动（极光流动、粒子漂浮）——营造"活着"的氛围，速度要慢。
2. **入场动效（内容层）**：内容进入视口时浮现。用 `AnimSection` 的 `custom.animation`（fade-up / slide-left / scale）。
3. **交互动效（焦点元素）**：只给 CTA / 关键卡片。`rb-shimmer-button`（流光按钮）、`rb-pulse-button`（脉冲）、`ac-glowing-btn`（发光）。

### 动效纪律
- **CTA 按钮必须有存在感**：用流光/脉冲/发光按钮，而非默认 Button。
- **不要所有东西都动**：背景动 + 标题动 + 按钮动 = 够了。正文、卡片保持安静。
- **动效要有目的**：引导视线到焦点（CTA、核心卖点），不是炫技。
- **跑马灯用对地方**：`rb-marquee` 适合"卖点罗列 / 合作伙伴 logo 墙"，一条即可，别刷屏。

---

## 6. 构图套路（Composition Recipes）

### Hero 首屏（落地页门面）
```
[背景层 abg- 铺满, zIndex 0]
  ├─ 玻璃徽章（"🏆 年度品牌"）        顶部居中
  ├─ 大标题 rb-gradient-text 48px     视觉中心
  ├─ 副标题（一句话价值）              标题下
  └─ 双 CTA：主(流光按钮) + 次(玻璃按钮) 底部
```

### 卖点跑马灯
Hero 下方一条 `rb-marquee`，罗列 4–6 个核心卖点（emoji + 短语）。

### 特性/产品卡片网格
- 3 列网格（800 宽 → 每卡 ~226 宽，间距 21）。
- 卡片用 `rb-spotlight-card` / `rb-card-hover` / `scn-stat-card`，别用裸 Card。
- 卡片内容：图标/emoji + 标题 + 一句描述 + （可选）价格/数字。

### 数据背书区
3–4 个 `scn-stat-card` / `rb-count-up`：大数字（渐变）+ 标签。如"50万+ 用户 / 12+ 门店 / 4.9 评分"。

### CTA 转化横幅
页面底部一条强对比横幅：品牌渐变底 + 大白字标题 + 反色按钮。用 `Container`（custom.bg 渐变）或 `Section`。

### 时间轴 / 故事
`ac-timeline` 讲品牌历程 / 产品步骤。

---

## 7. 风格原型（Style Archetypes）

接到需求先**定风格**，再套对应配方：

### A. 高级奢华（Premium / Luxury）
- 色板：深紫底 `#1e1b4b` + 紫 `#a855f7` + 金 `#f59e0b`
- 背景：`abg-aurora-curtain` / `abg-northern-lights`（深色）
- 标题：`rb-gradient-text` 紫→金，字重 900
- 按钮：`ac-glowing-btn` 金色发光
- 质感：玻璃拟态 + 金色细边

### B. 温柔浪漫（Soft / Romantic）—— 甜品/美妆/生活方式
- 色板：粉 `#ec4899` + 紫 `#c084fc` + 玫红 `#f472b6`
- 背景：`abg-gradient-flow` / `abg-gradient-orbs`（粉紫）
- 标题：`rb-gradient-text` 粉→紫
- 按钮：`rb-shimmer-button` 粉色流光
- 质感：柔和粉阴影 + 大圆角(20px+) + emoji 点缀

### C. 科技未来（Tech / Futuristic）—— SaaS/工具/AI
- 色板：靛 `#6366f1` + 青 `#22d3ee` + 浅靛 `#818cf8`
- 背景：`abg-particle-network` / `abg-cyber-grid`（深色）
- 标题：`rb-animated-text` 逐字浮现 + 等宽字体感
- 按钮：`rb-pulse-button` 脉冲
- 质感：发光边框 + 网格 + 3D（`td-tilt-card` / `r3f-`）

### D. 清新自然（Fresh / Natural）—— 环保/旅游/健康
- 色板：翠 `#10b981` + 绿 `#34d399` + 橙 `#f59e0b`
- 背景：`abg-ocean-waves` / `abg-fireflies`（浅色）
- 标题：纯色深绿 + `rb-blur-text` 揭示
- 按钮：`rb-ripple-button` 涟漪
- 质感：留白多 + 柔和绿阴影

---

## 8. 组件库活用速查（不注册自定义，现有库就够华丽）

| 需求 | 直接用这些现成组件 |
|------|------|
| **整页背景** | `abg-aurora-curtain` `abg-gradient-flow` `abg-gradient-orbs` `abg-particle-network` `abg-starfield`（铺满 + zIndex 0） |
| **大标题/流光字** | `rb-gradient-text` `rb-animated-text` `rb-blur-text` `rb-flip-text` |
| **打字机/生成感** | `rb-typewriter` `ac-typewriter` `ac-text-generate` |
| **华丽按钮(CTA)** | `rb-shimmer-button` `rb-pulse-button` `rb-ripple-button` `ac-glowing-btn` |
| **高级卡片** | `rb-spotlight-card` `rb-card-hover` `ac-3d-card` `ac-spotlight-card` `scn-stat-card` |
| **数字滚动** | `rb-count-up` |
| **跑马灯** | `rb-marquee` |
| **时间轴** | `ac-timeline` |
| **分屏区块(带入场动画)** | `Section` `AnimSection`(custom.animation) `ParallaxSection`(custom.bgColor) |
| **3D / 特效** | `td-tilt-card` `td-parallax` `r3f-`（3D 场景） |
| **导航/页脚骨架** | `Navbar` `Footer` |

> **优先用现有库 + 富原语，不要注册自定义组件**（见 §10）。

### 富原语可编辑属性速查（零注册做华丽设计的关键）

**Container**（背景/质感载体，全部属性面板可改）：
| 属性 | 说明 |
|------|------|
| `bgType` | transparent / solid / gradient / image / **glass**（玻璃拟态） |
| `bgColor` `gradFrom` `gradTo` `gradAngle` | 纯色 / 渐变（起止色 + 角度） |
| `bgImage` | 背景图 URL |
| `radius` `padding` `opacity` | 圆角 / 内边距 / 不透明度 |
| `shadow`(none/sm/md/lg/xl) `shadowColor` | 品牌色柔和阴影 |
| `borderWidth` `borderColor` `blur` | 边框 / 玻璃模糊度 |

**Text**（字体戏剧性，全部属性面板可改）：
| 属性 | 说明 |
|------|------|
| `fontSize` `fontWeight`(300–900) | 字号 / 字重（大标题 40+/800+） |
| `color` `align` | 颜色 / 对齐 |
| `letterSpacing` `lineHeight` | 字间距 / 行高 |
| `italic` `uppercase` | 斜体 / 大写 |
| `gradText` `gradFrom` `gradTo` | **渐变文字**（大标题/关键数字） |
| `textShadow` | 文字阴影 |

> 想要玻璃卡片？`Container` 设 `bgType=glass` + `blur` + `borderWidth=1`。想要渐变大标题？`Text` 设 `gradText=true` + 起止色。**这些都是编辑数据，不写一行代码、不注册。**

---

## 9. 避坑指南（这些会让设计变 "low"）

❌ **纯白背景的英雄区** → 必须上 `abg-` 背景或渐变。
❌ **五颜六色** → 最多 3 种有彩色，色温统一。
❌ **标题太小太怯** → Hero 标题 40px+、字重 800+。
❌ **全用默认 Button/Card/Text** → CTA 用流光按钮、卡片用 spotlight/3D、标题用渐变文字。
❌ **一切都在动** → 背景动 + 标题动 + CTA 动即可，正文安静。
❌ **元素堆砌无留白** → 留白与内容同等重要，区块间距 24–48px。
❌ **纯黑阴影** → 用品牌色低透明阴影。
❌ **错位/不对齐** → 同区块严格左对齐或居中，间距取 8 的倍数。
❌ **动效速度过快** → 背景 speed 0.6–1.2，太快显廉价。

---

## 10. 关于自定义组件（不注册，避免污染）

组件库是**共享资产**。**不要注册自定义组件**——每个项目都注册一堆，会让组件库越来越杂乱（污染）。正确做法是**用富原语 + 现有库组合出一切，全部可编辑**。

**铁律：默认不注册。**
1. **富 Container/Text 是主力**：`Container` 支持背景（纯色/渐变/图片/玻璃拟态）、圆角、品牌色阴影、边框、内边距、不透明度；`Text` 支持字号/字重/颜色/对齐/字间距/行高/斜体/大写/渐变文字/文字阴影。这些全是**可编辑数据**（属性面板直接调），靠它们 + 现有特效组件就能拼出任何华丽设计，**零注册**（见 §8 富原语速查）。
2. **现有库兜底特效**：背景用 `abg-`、华丽按钮用 `rb-`/`ac-`、高级卡片用 `rb-spotlight-card`/`ac-3d-card`、渐变文字用 `rb-gradient-text`、数字滚动用 `rb-count-up`（见 §8）。
3. **万不得已才用临时组件**：只有当现有组件 + 富原语确实无法表达（如强业务专属的复杂部件）时，才调用 `register_component` 创建**画布临时组件**——它只属当前画布、在组件库单独「本画布·临时」分区展示、可一键清理、**绝不进共享库**。命名带业务前缀（如 `ice-`）便于识别。

> 编辑数据（富原语属性 + 现有组件属性）是常态；创建临时组件是罕见例外，且随时可清理。

---

## 11. 高级感自检清单（生成后逐条自查）

- [ ] Hero / 落地页有**背景氛围**（abg- 或渐变），不是纯白？
- [ ] 全设计**有彩色 ≤ 3 种**，色温统一？
- [ ] 大标题够大够重（40px+ / 800+），用了渐变或动画文字？
- [ ] CTA 用了**华丽按钮**（流光/脉冲/发光），不是默认 Button？
- [ ] 卡片用了**高级卡片**（spotlight/3D/stat），不是裸 Card？
- [ ] 有**深度**（玻璃拟态 / 品牌色阴影 / 渐变叠加）？
- [ ] 动效**克制**（背景+标题+CTA 动，正文静）？
- [ ] 留白充足、对齐整齐、间距是 8 的倍数？
- [ ] **没有注册自定义组件**（用富原语 + 现有库实现）？
- [ ] 整体符合所选**风格原型**的配方？

---

## 12. 工作流（与 MCP 配合）

1. **定风格**：根据品牌选 §7 的风格原型（A/B/C/D）。
2. **选背景**：按 §1 选 `abg-` 背景，铺满整页 zIndex 0。
3. **搭骨架**：`Navbar` + Hero（大标题+CTA）+ 卖点跑马灯 + 卡片网格 + 数据背书 + CTA 横幅 + `Footer`。
4. **加质感**：渐变文字、华丽按钮、高级卡片、玻璃拟态。
5. **加动效**：背景微动 + 入场动画（AnimSection）+ CTA 流光。
6. **过清单**：逐条过 §11 自检。
7. **只编辑不注册**：用 `update_node` 调整富原语/现有组件属性；万不得已才用临时组件。
