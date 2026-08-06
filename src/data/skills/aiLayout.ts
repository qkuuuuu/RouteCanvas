/**
 * AI 像素级布局引擎 —— 生成不再走硬编码模板
 * AI（首席设计师）直接产出 add_node operations：坐标/尺寸/层次/样式/配图全部由它按内容现设计。
 * 审美 Theme 只作为"思路与主色调参考"注入，明确允许突破，杜绝模板感。
 */
import { getAiSettings } from "@/lib/aiSettings";
import { executeOperations, parseAiResponse, type ChatOp } from "@/data/chatOps";
import { componentInventory } from "./skillPlan";
import type { SkillPack } from "./agent";
import { methodologyBrief, type Theme } from "./esthetics";
import type { DeckOutline } from "./deck";

export interface PageSpec {
  pageId: string;
  role: string; // 封面 / 内容页·章节名 / 结束页 / 落地页 …
  width: number;
  height: number;
  note?: string; // 该页应承载的内容提示
}

/** 带外部中断 + 超时的 fetch：避免 AI 请求挂死导致界面卡死。
 * 超时取值对标行业实践（Kimi 官方建议 5 分钟、Dify/Azure 长生成场景 300s）：
 * 大输出排版请求给足 300s，用户可随时手动停止。 */
function fetchWithGuard(url: string, init: RequestInit, outer?: AbortSignal, timeoutMs = 300000): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const onOuter = () => ctrl.abort();
  if (outer) {
    if (outer.aborted) ctrl.abort();
    else outer.addEventListener("abort", onOuter);
  }
  return fetch(url, { ...init, signal: ctrl.signal }).finally(() => {
    clearTimeout(timer);
    outer?.removeEventListener("abort", onOuter);
  });
}

const STYLE_GRAMMAR = `样式语法（节点 props.custom 可用字段）：
- Container：bgType="solid"(bgColor) | "gradient"(gradFrom,gradTo,gradAngle 0-360) | "glass"(bgColor+blur) | "image"(bgImage URL)；radius 圆角；borderWidth/borderColor 发丝边框；shadow="md"|"lg"+shadowColor 投影；opacity 0-1 透明度（做光晕/遮罩必用）；padding 内边距
- Text：props.text 内容；custom：fontSize/fontWeight(300-900)/color/lineHeight/align(left|center|right)/letterSpacing/italic(true)/uppercase(true)；高级效果：gradText:true+gradFrom+gradTo 渐变文字、textShadow 文字阴影（压在图片上必用）
- Button：props.text；custom.variant="primary"|"secondary"|"ghost"|"danger"
- Badge：props.text；custom.color="blue"|"green"|"red"|"yellow"|"purple"|"gray"
- Image：props.imageSrc —— 只能从下列已验证图库选图（禁止编造其它 URL）：
  科技/产品 1517336714731-489689fd1ca8、1550745165-9bc0b252726f；山野自然 1506905925346-21bda4d32df4、1441974231531-c6227db76b6e；城市 1477959858617-67f85cf4f1df、1449824913935-59a10b8d2000；办公 1497366216548-37526070297c、1497215728101-856f4ea42174；人像 1494790108377-be9c29b29330、1507003211169-0a1dd7228f2d；美食 1504674900247-0877df9cc836；建筑 1487958449943-2429e8be8625；海洋 1505142468610-359e7d316be0；星空 1462331940025-496dfbfc7564；植物 1466692476868-aef1dfb1e735；音乐 1511671782779-c97d3d27a1d4；旅行 1488646953014-85cb44e25828
  用法：https://images.unsplash.com/photo-<上述id>?auto=format&fit=crop&w=1200&q=85
- 也可用组件库真实组件：${"{{COMPONENTS}}"}`;

const DESIGN_PRINCIPLES = `设计法则（对标 Apple / Stripe / Linear 官网水准，我们是专业设计工具，绝不能有 AI 味）：
1. 构图必须为这次的内容专门设计：鼓励编辑感版式——非对称网格、错位叠压、满版图压字、巨型编号/肩题、瑞士排版、杂志分栏，严禁"居中标题+三张卡片"的模板腔；
2. 背景要有层次：先用 Container(gradient+opacity) 铺氛围光晕/光带，再叠内容；纯平背景视为失败；
3. 大胆使用真实摄影图：满版背景图+半透明遮罩+textShadow 压字、图文并置、卡片内配图；
4. 文字三级色阶与字号节奏：display 巨字（48-96px，可负字距）/ 正文 / 弱化注释；善用 uppercase+letterSpacing 做肩题；
5. 色彩克制：一套页面彩色≤3 种，大面积用中性色，强调色点到为止；
6. 细节：发丝线分隔、实色胶囊 CTA、小徽标、页码、留白呼吸；
7. 设计感优先（核心准则）：任何视觉手法都允许——毛玻璃、渐变、大字重、纹理、 3D、光影——但每一处必须有明确的设计意图且执行到位：毛玻璃要有层次与透光感，渐变要有色彩关系，装饰要与内容呼应；每页必须有一个视觉主角，其余元素为它服务。真正禁止的是廉价感：无脑堆砌技法、元素互不关联、为了装饰而装饰、把"紫渐变+毛玻璃卡+emoji"当万能公式滥用；
8. 画板宽度 ≤480 时为移动端：必须单列构图、大触控目标（按钮高≥48）、文字层级简化为两级。`;

function themeBrief(theme: Theme | null): string {
  if (!theme) return "审美方向：自由发挥，保持高级感。";
  return `审美方向「${theme.name}」（${theme.tagline}）——以下 token 是设计基线，不是硬约束；为了更好的画面允许突破单个 token，但要保持清晰层级、可读性和品牌一致性。避免模板化三段卡片、平均分栏、无意义渐变和默认居中：
主色 ${theme.accent}、辅色 ${theme.accent2}、底色 ${theme.bg}、面板 ${theme.surface}、边框 ${theme.surfaceBorder}、主文字 ${theme.text}、次文字 ${theme.subtext}、圆角倾向 ${theme.radius}px、标题字重倾向 ${theme.displayWeight ?? 600}。
${methodologyBrief(theme)}`;
}

/**
 * 让 AI 为给定页面直接排版。返回成功落地的节点数；0 表示失败（未接入 AI / 解析失败 / 零有效操作）。
 */
export async function generateAiLayout(opts: {
  pack: SkillPack;
  theme: Theme | null;
  input: string;
  pages: PageSpec[];
  outline?: DeckOutline;
  /** 用户上传的参考图（dataURL）：AI 提取其主体/色调/气质融入设计 */
  imageDataUrl?: string;
  /** 用户上传的文本文件内容（md/txt 等）：作为设计参考资料 */
  fileText?: string;
  /** 外部中断信号：用户点停止时中止请求 */
  signal?: AbortSignal;
}): Promise<number> {
  const settings = getAiSettings();
  if (!settings.apiKey) return 0;

  const pageList = opts.pages
    .map((p) => `- pageId=${p.pageId}（${p.role}，画布 ${p.width}×${p.height}${p.note ? `；内容要求：${p.note}` : ""}）`)
    .join("\n");
  const perPageLimit = opts.pages.length > 1 ? 16 : 26;
  const outlineBlock = opts.outline
    ? `\n演示文稿内容大纲（按此组织各页文字，不要照抄大纲标题以外的多余内容）：${JSON.stringify(opts.outline)}`
    : "";

  const system = `你是 RouteCanvas 的首席视觉设计师。现在由你亲自在画布上排版——坐标、尺寸、层次、配色、配图全部由你决定，不使用任何模板。
${themeBrief(opts.theme)}
${DESIGN_PRINCIPLES}

${STYLE_GRAMMAR.replace("{{COMPONENTS}}", componentInventory(40))}

执行要求：
- 主要输出 add_node 操作，每条必须带 pageId（从下面的页面清单选）、x、y、width、height；坐标系相对各自页面左上角，不要越界；
- 用 zIndex 0-10 控制层次：0 背景与光晕 → 1 图片/遮罩 → 2+ 前景内容；
- 每页节点数 ≤ ${perPageLimit}，宁精勿滥；
- 文字内容紧扣用户需求，写真实有信息量的文案，禁止占位套话；
- 内容充实度：交付的是完成稿而非骨架——每页除主标题外必须有充实的支撑内容（具体数据、描述段落、列表条目、标注细节），严禁只放一个大标题加几个空色块就收工；若用户提供了资料文件，内容必须从中提炼；
- 多页授权：若需求天然包含多个页面（如“登录页+首页”），可用 add_page（带 ref 临时名，尺寸与现有页一致）新建页面，并用 connect 操作把按钮连到目标页：{"op":"connect","sourceNodeRef":"按钮的ref","targetPageRef":"目标页ref"}，让原型可点击跳转。
只输出一个 JSON：{ "reply": "一句话设计说明", "operations": [ { "op":"add_node", "pageId":"...", "type":"...", "x":0, "y":0, "width":0, "height":0, "props":{ "text":"...", "imageSrc":"...", "custom":{...} } } ] }，不要代码块标记。`;

  const userBase = `用户需求：${opts.input || "自由发挥"}${outlineBlock}${opts.fileText ? `\n\n用户提供的参考资料文件内容（请据此填充真实、详尽、有信息量的文案与数据）：\n${opts.fileText.slice(0, 8000)}` : ""}

待排版的页面清单：
${pageList}`;
  const userContent = opts.imageDataUrl
    ? [
        { type: "text", text: `${userBase}\n\n用户还提供了一张参考图：请提取图中的主体、色彩与气质，融入到你的设计中（可作为配图、色彩来源或构图灵感）。` },
        { type: "image_url", image_url: { url: opts.imageDataUrl } },
      ]
    : userBase;

  try {
    const resp = await fetchWithGuard("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "system", content: system },
          { role: "user", content: userContent },
        ],
        ...settings,
        apiKey: settings.apiKey || undefined,
        creativity: 0.95,
      }),
    }, opts.signal);
    if (!resp.ok) return 0;
    const data = await resp.json();
    const parsed = parseAiResponse(data.content ?? "");
    const ops = (parsed?.operations ?? []).filter((op) => op.op === "add_node" || op.op === "add_page" || op.op === "connect") as ChatOp[];
    if (!ops.length) return 0;
    const results = executeOperations(ops);
    return results.filter((r) => !r.startsWith("⚠️")).length;
  } catch {
    return 0;
  }
}

/** 是否已接入 AI（未接入则禁止技能生成，引导手动设计） */
export function aiEngineReady(): boolean {
  return Boolean(getAiSettings().apiKey);
}

/**
 * 组件级生成：在现有页面上添加单个组件（或小组件群），不新建页面。
 * 与页面级生成的区别：无审美选择/无计划确认，快速直达；AI 需避开已有节点找空位。
 */
export async function generateComponentOnPage(opts: {
  input: string;
  pageId: string;
  width: number;
  height: number;
  /** 页面现有节点占位摘要（防重叠） */
  occupied: Array<{ x: number; y: number; width: number; height: number }>;
  signal?: AbortSignal;
}): Promise<number> {
  const settings = getAiSettings();
  if (!settings.apiKey) return 0;

  const system = `你是 RouteCanvas 的 UI 设计师。用户要在现有页面上添加一个组件，你在合适的位置把它加上去。

${STYLE_GRAMMAR.replace("{{COMPONENTS}}", componentInventory(40))}

要求：
- 只输出 add_node 操作，pageId 固定为 "${opts.pageId}"，节点数 1-5 个（一个完整组件：如卡片=背景容器+标题+描述）；
- 画布尺寸 ${opts.width}×${opts.height}，以下区域已被占用，严禁重叠：${JSON.stringify(opts.occupied)}；
- 在剩余空间中选择视觉合理的位置（优先视线焦点区），坐标取 8 的倍数；
- 组件本身要有设计感：背景/圆角/投影/色彩层级完整，不是裸组件。
只输出 JSON：{ "reply": "一句话说明", "operations": [...] }，不要代码块标记。`;

  try {
    const resp = await fetchWithGuard("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "system", content: system },
          { role: "user", content: `用户需求：${opts.input}` },
        ],
        ...settings,
        apiKey: settings.apiKey || undefined,
        creativity: 0.9,
      }),
    }, opts.signal, 120000);
    if (!resp.ok) return 0;
    const data = await resp.json();
    const parsed = parseAiResponse(data.content ?? "");
    const ops = (parsed?.operations ?? []).filter((op) => op.op === "add_node") as ChatOp[];
    if (!ops.length) return 0;
    const results = executeOperations(ops);
    return results.filter((r) => !r.startsWith("⚠️")).length;
  } catch {
    return 0;
  }
}

/**
 * 图转 3D 场景页：用户上传参考图 → 多模态 AI 分析主体 → 选 r3f-* 真实 WebGL 组件搭舞台页。
 * 对标 img2threejs 的交互形态（给张图就出 3D），但落在我们的可编辑画布上。
 */
export async function imageTo3dLayout(opts: { input: string; imageDataUrl: string; pageId: string; theme: Theme | null; signal?: AbortSignal }): Promise<number> {
  const settings = getAiSettings();
  if (!settings.apiKey) return 0;

  const system = `你是 RouteCanvas 的 3D 视觉设计师。用户上传了一张参考图，请你把它转化为一个以真实 WebGL 3D 场景为主角的展示页。

可用的真实 3D 场景组件（type 从这里面选一个最贴合图片主体的）：
- r3f-distort-sphere 变形球体（有机/流体/柔和主体）
- r3f-torus-knot 旋转扭结（机械/结构/缠绕主体）
- r3f-floating-shapes 漂浮几何（轻盈/多彩/空间感）
- r3f-particles 粒子星空（氛围/深邃/科技）
- r3f-product-stage 产品展示台（实物产品/商品）
- r3f-wire-globe 线框地球（全球/网络/地理）
组件 props.custom 可设 color（主色）、speed（转速）、bg（背景色）——请从参考图提取色彩来配。

${DESIGN_PRINCIPLES}

排版要求：
- 页面 1280×800，只输出 add_node 操作，pageId 用给定的；节点 ≤ 14 个；
- 3D 场景组件作为视觉主角，占页面 50% 以上面积，放在视觉焦点位；
- 先用 Container(gradient+opacity) 铺深空氛围光晕再叠内容；文字围绕 3D 场景排布：主题大字（可从图中提炼意境）、一句诠释、一枚小徽标；
- zIndex：0 背景光晕 → 1 3D 场景 → 2+ 文字。
只输出 JSON：{ "reply": "一句话说明选了哪个 3D 组件、为什么", "operations": [...] }，不要代码块标记。`;

  try {
    const resp = await fetchWithGuard("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content: [
              { type: "text", text: `用户需求：${opts.input || "把这张图变成一个 3D 场景展示页"}\n目标页面 pageId=${opts.pageId}（1280×800）。请分析这张图：` },
              { type: "image_url", image_url: { url: opts.imageDataUrl } },
            ],
          },
        ],
        ...settings,
        apiKey: settings.apiKey || undefined,
        creativity: 0.95,
      }),
    }, opts.signal);
    if (!resp.ok) return 0;
    const data = await resp.json();
    const parsed = parseAiResponse(data.content ?? "");
    const ops = (parsed?.operations ?? []).filter((op) => op.op === "add_node") as ChatOp[];
    if (!ops.length) return 0;
    const results = executeOperations(ops);
    return results.filter((r) => !r.startsWith("⚠️")).length;
  } catch {
    return 0;
  }
}
