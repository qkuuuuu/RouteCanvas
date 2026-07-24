/**
 * 设计系统运行时精简版（DESIGN.md 的 prompt 版本）
 * 注入到应用内 AI（Chat / 标注层）的 system prompt，约束生成风格。
 * 注意：与根目录 DESIGN.md 保持一致，修改时需同步。
 */
export const DESIGN_RULES = `## 设计系统约束（必须遵守）

### 一、令牌（一致性底线）
颜色：主色 #6366f1、主色深 #4f46e5、辅助 #ec4899、成功 #22c55e、警告 #f59e0b、危险 #ef4444、正文 #1f2937、次级 #6b7280、背景 #ffffff、边框 #e5e7eb。品牌渐变 #6366f1→#ec4899。
字体：display 44/800（Hero 大标题，每页≤1 个）、H1 32/800、H2 24/700、H3 17/600、正文 14/400、辅助 12/400。
间距：只用 8 的倍数（8/16/24/32/48）；页内边距≥40；组内 8-16，区块 24-32，章节 48。
圆角：控件 8-12，卡片/容器 16。布局：同区块严格左对齐或居中对齐，禁止错位与重叠。桌面页 800×600，移动页 390×844，落地页高度可按内容扩展（如 720/960）。
命名：页面 name 用中文功能名，path 用英文小写短横线；按钮文案用动词；占位数据用真实感示例（「张三」「¥199」）。

### 二、高级感铁律（决定颜值，最高优先级）
1. 拒绝白底线框图：落地页/首页/Hero 必须有背景氛围——放一个 abg- 动态背景（x:0 y:0，宽高=页面尺寸）或 Container 渐变底（bgType=gradient，gradFrom/gradTo 用品牌色或同色系），背景节点必须最先添加（zIndex 自动递增，先加的在底层），内容节点后加叠在上层。
2. 色彩纪律：60-30-10（背景 60% / 卡片 30% / 强调 10%）；全页有彩色≤3 种且色温统一（冷色系：靛/紫/青；暖色系：粉/橙/金，不混搭）；深色背景配白/浅灰文字，浅色背景配 #1f2937 文字。
3. 字体戏剧性：Hero 主标题用 Text variant=display（或 fontSize≥40、fontWeight≥800），可叠加 gradText=true 品牌渐变文字；副标题 14-16px 色 #6b7280；靠字号/字重对比拉开层级，不靠堆颜色。
4. 深度质感：卡片优先用 Container（bgType=solid bgColor=#ffffff radius=16 shadow=md）或玻璃拟态（bgType=glass blur=16 borderWidth=1 borderColor=#ffffff）；拒绝裸 Text 直接平铺在背景上。
5. CTA 必须醒目：每页仅 1 个主按钮（Button variant=primary 或 rb-shimmer-button/rb-pulse-button），放在视觉终点；次要操作用 variant=secondary/ghost。
6. 动效克制：背景微动（custom.speed 0.6-1.2）+ AnimSection 入场动画 + CTA 强调即可，正文与卡片保持安静。

### 三、组件选型速查（优先用这些，不要全用 Button/Text/Card 裸组件）
- 整页背景：abg-aurora-curtain（极光）、abg-gradient-flow（流动渐变）、abg-gradient-orbs（光球）、abg-particle-network（粒子）、abg-starfield（星空）
- 大标题：Text variant=display（可叠 gradText）；或 rb-gradient-text / rb-animated-text
- 华丽按钮：rb-shimmer-button（流光）、rb-pulse-button（脉冲）、ac-glowing-btn（发光）
- 高级卡片：rb-spotlight-card、rb-card-hover、scn-stat-card
- 数据背书：scn-stat-card 或 rb-count-up，3-4 个横排
- 页面骨架：Navbar（顶部）+ Footer（底部），导航页必备

### 四、落地页构图套路（800 宽，自上而下）
Navbar（高 56，y=0）→ Hero（徽章 Badge + display 大标题宽 560 居中 + 副标题 + 主/次双按钮横排）→ 特性区（H2 标题 + 3 列卡片，每卡宽≈226、间距 21）→ 数据区（3-4 个 StatCard 横排）→ CTA 横幅（Container 品牌渐变底 + 白字标题 + 反色按钮）→ Footer（高 56 贴底）。

### 五、生成后自检
组件 type 都在白名单内？背景不是纯白？有彩色≤3 且色温统一？Hero 标题≥40px/800？每页只有 1 个主标题和 1 个 primary 按钮？卡片有圆角和阴影？间距是 8 的倍数且严格对齐？背景节点最先添加、连线 source/target 都存在？`;
