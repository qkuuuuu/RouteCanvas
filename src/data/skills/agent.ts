/**
 * 技能智能体编排层
 * 主智能体：routeIntent —— 从用户话语识别目标技能包（ppt/html/vue/android/image/web/mobile…）
 * 审美子智能体：matchEsthetic（esthetics.ts）—— 大技能包内的小技能包，决定气质 Theme
 * 计划层：makePlan / executePlan —— Trae/Qoder 式"先对齐再执行"，但零表单、全程对话驱动
 */
import { useCanvasStore } from "@/store/canvasStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import type { CanvasState } from "@/types/schema";
import { matchEsthetic, ESTHETICS, AURORA, type Theme } from "./esthetics";
import { scaffoldDeck, DEFAULT_OUTLINE, type DeckOutline } from "./deck";
import { generateAiLayout, aiEngineReady, imageTo3dLayout, type PageSpec } from "./aiLayout";
import { runCritique, runDarkMode, runAutoAlign, runPageStats, type SkillResult } from "./utils";
import { snapshotPage } from "@/lib/pageVersions";
import { exportHtmlDocument, exportReactCode, exportVueCode, exportComposeCode, downloadText } from "@/lib/codeExport";

/* ================= 技能包定义 ================= */

export type PackKind = "canvas" | "code" | "utility";

export interface SkillPack {
  id: string;
  name: string;
  desc: string;
  icon: string;
  gradient: [string, string];
  kind: PackKind;
  /** 意图路由关键词 */
  keywords: string[];
  /** 该技能包内可选的审美子技能（code/utility 类不需要） */
  esthetics: Theme[];
}

export const SKILL_PACKS: SkillPack[] = [
  {
    id: "deck", name: "PPT 演示", desc: "多页幻灯片 + 自动翻页连线，可在演示模式播放", icon: "Presentation",
    gradient: ["#8b5cf6", "#ec4899"], kind: "canvas",
    keywords: ["ppt", "幻灯片", "演示", "汇报", "slides", "deck", "幻灯片", "路演", "周报"],
    esthetics: ESTHETICS,
  },
  {
    id: "web", name: "网页设计", desc: "落地页 / 定价页 / 登录页，生成后可导出代码", icon: "Globe",
    gradient: ["#6366f1", "#0ea5e9"], kind: "canvas",
    keywords: ["网页", "官网", "落地页", "landing", "首页", "定价", "登录", "web", "网站", "专题页"],
    esthetics: ESTHETICS,
  },
  {
    id: "mobile", name: "移动应用", desc: "iOS 引导流 / 安卓首页，390 与 360 双规格", icon: "Smartphone",
    gradient: ["#f59e0b", "#ef4444"], kind: "canvas",
    keywords: ["app", "移动", "手机", "引导页", "onboarding", "安卓", "android", "ios", "小程序"],
    esthetics: ESTHETICS,
  },
  {
    id: "dashboard", name: "数据看板", desc: "高密度指标工作台，暗色与亮色皆宜", icon: "BarChart3",
    gradient: ["#10b981", "#0ea5e9"], kind: "canvas",
    keywords: ["看板", "数据", "后台", "dashboard", "管理", "报表", "指标"],
    esthetics: ESTHETICS,
  },
  {
    id: "image", name: "视觉图像", desc: "社媒卡片 1080² / 杂志海报 1080×1350", icon: "Image",
    gradient: ["#ec4899", "#f59e0b"], kind: "canvas",
    keywords: ["海报", "图片", "社媒", "小红书", "封面", "banner", "poster", "宣传图", "大图"],
    esthetics: ESTHETICS,
  },
  {
    id: "email", name: "营销邮件", desc: "表格兼容安全的品牌邮件模板", icon: "Mail",
    gradient: ["#6366f1", "#14b8a6"], kind: "canvas",
    keywords: ["邮件", "email", "edm", "周报", "订阅"],
    esthetics: ESTHETICS,
  },
  {
    id: "wireframe", name: "线框草图", desc: "低保真灰阶布局速写，快速对齐想法", icon: "Frame",
    gradient: ["#78716c", "#a8a29e"], kind: "canvas",
    keywords: ["线框", "wireframe", "草图", "低保真", "原型骨架"],
    esthetics: [],
  },
  {
    id: "code-html", name: "HTML 交付", desc: "把当前项目导出为可运行的 HTML 单文件", icon: "Code2",
    gradient: ["#f97316", "#ef4444"], kind: "code",
    keywords: ["html", "网页代码", "导出网页", "静态页"],
    esthetics: [],
  },
  {
    id: "code-react", name: "React 交付", desc: "导出 React 单文件组件源码（.tsx）", icon: "Atom",
    gradient: ["#0ea5e9", "#22d3ee"], kind: "code",
    keywords: ["react", "tsx", "组件代码"],
    esthetics: [],
  },
  {
    id: "code-vue", name: "Vue 交付", desc: "导出 Vue 3 SFC（script setup）", icon: "Leaf",
    gradient: ["#22c55e", "#84cc16"], kind: "code",
    keywords: ["vue", "sfc"],
    esthetics: [],
  },
  {
    id: "code-android", name: "Android 交付", desc: "导出 Jetpack Compose Kotlin 代码", icon: "Bot",
    gradient: ["#3ddc84", "#10b981"], kind: "code",
    keywords: ["compose", "kotlin", "安卓代码", "android 代码"],
    esthetics: [],
  },
  {
    id: "image-3d", name: "图转 3D", desc: "上传一张参考图，AI 分析主体并挑选真实 WebGL 3D 场景搭建舞台页", icon: "Boxes",
    gradient: ["#7c6cff", "#33d6c8"], kind: "canvas",
    keywords: ["3d", "三维", "立体", "建模", "模型", "three"],
    esthetics: [],
  },
  {
    id: "utility", name: "通用工具", desc: "设计评审 / 暗色模式 / 自动对齐 / 页面体检", icon: "Wrench",
    gradient: ["#64748b", "#94a3b8"], kind: "utility",
    keywords: ["评审", "对齐", "暗色", "体检", "检查"],
    esthetics: [],
  },
];

/* ================= 意图路由（主智能体） ================= */

/** 创造意图：明确的“从无到有”信号 */
function hasCreateIntent(lower: string): boolean {
  return /做|生成|创建|新建|来一|弄一|搞一|设计一|出一|写一|转成|变?成?\s*3d|create|make|build/.test(lower);
}

/** 修改意图：对已有内容的调整（出现则拦截生成流，交给增量 AI 修改） */
function hasModifyIntent(lower: string): boolean {
  return /修改|改一?下|改成|改为|调整|换个|换颜色|移动|挪|删掉|去掉|加大|缩小|变大|变小|改[大小色字]|改得|优化一|美化一|精修/.test(lower);
}

export function routeIntent(input: string): SkillPack | null {
  const lower = input.toLowerCase();
  let best: { pack: SkillPack; hits: number } | null = null;
  for (const pack of SKILL_PACKS) {
    const hits = pack.keywords.filter((kw) => lower.includes(kw)).length;
    if (hits > 0 && (!best || hits > best.hits)) best = { pack, hits };
  }
  // 画布类技能包 = “从无到有”的生成：必须有创造意图，且不能被修改意图拦截。
  // 否则“帮我改一下首页”这类话会被误判成生成新首页，导致覆盖/新页
  if (best && best.pack.kind === "canvas") {
    if (hasModifyIntent(lower) && !hasCreateIntent(lower)) return null;
    if (!hasCreateIntent(lower)) return null;
  }
  return best?.pack ?? null;
}

/* ================= web / mobile 包的子意图细分 ================= */

function subIntentWeb(lower: string): "pricing" | "login" | "landing" {
  if (/定价|价格|pricing|套餐/.test(lower)) return "pricing";
  if (/登录|login|注册/.test(lower)) return "login";
  return "landing";
}

function subIntentMobile(lower: string): "android" | "ios" {
  if (/安卓|android|小米|华为/.test(lower)) return "android";
  return "ios";
}

function subIntentImage(lower: string): "poster" | "social" {
  if (/海报|poster|杂志|封面/.test(lower)) return "poster";
  return "social";
}

function subIntentUtility(lower: string): "critique" | "dark" | "align" | "stats" {
  if (/评审|评分|自评|打分/.test(lower)) return "critique";
  if (/暗色|深色|夜间|dark/.test(lower)) return "dark";
  if (/对齐|网格|整齐/.test(lower)) return "align";
  return "stats";
}

/* ================= 计划 ================= */

export interface SkillPlan {
  pack: SkillPack;
  esthetic: Theme | null;
  /** 细分场景 id（web: landing/pricing/login 等） */
  sub: string;
  /** 从用户话语提取的主题（让计划因人而异，而非硬编码模板） */
  topic: string;
  steps: string[];
  /** AI 产出的内容大纲（deck 等），执行时优先于默认大纲 */
  outline?: DeckOutline;
  /** 计划是否由 AI 生成（false = 本地规则兑底） */
  aiPlanned?: boolean;
  /** 用户上传的参考图（dataURL）：图转 3D 等技能携带 */
  attachment?: string;
  /** 用户上传的文本文件内容（md/txt 等）：作为设计参考资料 */
  attachmentFile?: string;
  /** 重做模式：清除目标页现有节点后重画，避免两次结果叠加 */
  redo?: boolean;
  /** 用户明确要求新增页面时，不复用现有空白页 */
  forceNew?: boolean;
}

/** 主智能体的主题提取：剔掉指令词，留下用户真正想做的内容 */
export function extractTopic(input: string): string {
  const cleaned = input
    .replace(/帮我|请|麻烦|给我|我想|我要|我需要|希望能|可以/g, "")
    .replace(/(做|生成|创建|设计|来|弄|搞|出|写|建)(一?个|一?张|一?份|一?套|一?版)?/g, "")
    .replace(/关于|主题为|主题是|叫做|名叫/g, "")
    .replace(/(用|要|需要|换|改成)?.{0,10}(风格|审美|感觉|色调|主题)/g, "")
    .replace(/新页面|新的一页|另外一页|单独一页|再加一页|再来一页/g, "")
    .replace(/ppt|PPT|幻灯片|演示|汇报|落地页|官网|首页|看板|海报|社媒|卡片|邮件|线框|登录页?|定价页?|引导页|网页|页面|网站|app|安卓|android|ios/gi, "")
    .replace(/[，。！？,.!？~～\s]+$/g, "")
    .trim();
  return cleaned.length >= 2 && cleaned.length <= 24 ? cleaned : "";
}

/** 是否明确要求新建页面 */
function wantsNewPage(input: string): boolean {
  return /新页面|新的一页|新建页|另外.{0,3}页|单独.{0,3}页|再加一页|再来一页|新增一页/.test(input);
}

/** 是否要求重做/重画（在现有页面上清除重画，而非叠加新页） */
export function wantsRedo(input: string): boolean {
  return /重新设计|重新生成|重做|重画|再设计一|再来一版|换个设计|不满意.*重/.test(input);
}

/**
 * 组件级生成意图：「生成一个按钮/卡片/导航栏」→ 加到当前页，不新建页。
 * 与页面级生成的区别：含组件名词、不含页面级名词、有创造意图、非修改诉求。
 */
export function isComponentRequest(input: string): boolean {
  const lower = input.toLowerCase();
  const compNouns = /按钮|卡片|导航栏|导航条|头像|徽标|标签|输入框|搜索框|表单|表格|图表|轮播|时间线|定价卡|步骤条|面包屑|页脚|footer|navbar|button|card|banner|cta/i;
  const pageNouns = /落地页|官网|首页|看板|海报|社媒|ppt|幻灯片|演示|项目|邮件|线框|引导页|网站|页面|app|安卓|android|ios|3d|场景|舞台/i;
  if (!compNouns.test(lower)) return false;
  if (pageNouns.test(lower)) return false;
  if (hasModifyIntent(lower)) return false;
  return hasCreateIntent(lower);
}

export function makePlan(pack: SkillPack, esthetic: Theme | null, input: string): SkillPlan {
  const lower = input.toLowerCase();
  const theme = esthetic ?? AURORA;
  const topic = extractTopic(input);
  const subject = topic ? `「${topic}」` : "";
  const store = useCanvasStore.getState();
  const hasEmptyPage = store.pages.some((p) => p.nodes.length === 0);
  const placeStep = pack.kind === "canvas"
    ? wantsRedo(input)
      ? "清除当前页现有内容并重新设计（不叠加、不新建页）"
      : hasEmptyPage && !wantsNewPage(input)
        ? "直接填充当前空白画板（不新建页面）"
        : "新建独立画板并自动铺排位置"
    : "";
  let sub = "";
  const steps: string[] = [];

  switch (pack.id) {
    case "deck":
      steps.push(`生成${subject || "主题"}封面页（1280×720）`, "生成 3 页内容页（成果 / 数据 / 计划）", "生成结束页", "连接「下一页」翻页热区", `套用「${theme.name}」审美`);
      break;
    case "web":
      sub = subIntentWeb(lower);
      steps.push(
        sub === "pricing" ? `生成${subject || "三档"}定价卡片（含高亮推荐位）` : sub === "login" ? `生成${subject || "毛玻璃"}登录卡片 + 输入区` : `生成${subject || "品牌"} Hero + 特性卡 + CTA`,
        `套用「${theme.name}」审美`, "产出可继续编辑的结构化画布",
      );
      break;
    case "mobile":
      sub = subIntentMobile(lower);
      steps.push(sub === "android" ? `生成${subject || "应用"}安卓首页（360×800）` : `生成${subject || "应用"} iOS 引导页（390×844）`, `套用「${theme.name}」审美`);
      break;
    case "dashboard":
      steps.push(`生成${subject || "业务"}指标看板：侧边导航 + 指标卡 + 趋势图`, `套用「${theme.name}」审美`);
      break;
    case "image":
      sub = subIntentImage(lower);
      steps.push(sub === "poster" ? `生成${subject || "杂志风"}海报（1080×1350）` : `生成${subject || "宣发"}社媒卡片（1080×1080）`, `套用「${theme.name}」审美`, "可随时导出 PNG");
      break;
    case "email":
      steps.push(`生成${subject || "品牌"}营销邮件（640×900）`, `套用「${theme.name}」审美`);
      break;
    case "wireframe":
      steps.push(`生成${subject || "页面"}灰阶线框（导航 / Hero / 特性卡）`);
      break;
    case "code-html":
      steps.push("读取当前项目全部页面", "编译为 HTML 单文件（含页面跳转交互）", "下载到本地");
      break;
    case "code-react":
      steps.push("读取当前项目全部页面", "编译为 React 单文件组件（useState 路由）", "下载 .tsx 源码");
      break;
    case "code-vue":
      steps.push("读取当前项目全部页面", "编译为 Vue 3 SFC（script setup）", "下载 .vue 源码");
      break;
    case "code-android":
      steps.push("读取首页画布结构", "编译为 Jetpack Compose Kotlin", "下载 .kt 源码");
      break;
    case "image-3d":
      steps.push("读图：识别主体形态、主色与气质", "从 6 个真实 WebGL 3D 场景中挑选最贴合的一个", "搭建深空氛围光晕舞台，3D 场景作视觉主角", "围绕场景排布主题大字与诠释文案");
      break;
    case "utility":
      sub = subIntentUtility(lower);
      steps.push(sub === "critique" ? "五维评审并生成报告页" : sub === "dark" ? "切换当前页面暗色主题" : sub === "align" ? "全部节点吸附 8px 网格" : "统计节点构成与连线");
      break;
  }
  if (placeStep) steps.splice(1, 0, placeStep);
  return { pack, esthetic, sub, topic, steps, aiPlanned: false, forceNew: wantsNewPage(input) };
}

/* ================= 执行（子智能体干活） ================= */

/**
 * 页面落位策略（修复“无限画布叠在一起”与“空白画布却新建页”）：
 * 1. 存在空白页且用户没说要新页 → 直接填充它（改尺寸改名，不新建）；
 * 2. 需要新建时 → 放到现有页面最右侧之外（间距 240px），不再叠放。
 */
function resolveTargetPage(name: string, width: number, height: number, forceNew: boolean): string {
  const store = useCanvasStore.getState();
  if (!forceNew) {
    const empty = store.pages.find((p) => p.nodes.length === 0);
    if (empty) {
      store.updatePage(empty.id, { name, layout: { ...empty.layout, width, height } });
      return empty.id;
    }
  }
  // 铺排：所有现有页面的最右边界 + 240
  const rightEdge = store.pages.reduce((max, p) => Math.max(max, p.layout.x + p.layout.width), 0);
  const topY = store.pages.length ? Math.min(...store.pages.map((p) => p.layout.y)) : 120;
  const x = store.pages.length ? rightEdge + 240 : 120;
  return store.addPage({ name, path: `/${Date.now().toString(36)}`, width, height, x, y: topY });
}

export async function executePlan(plan: SkillPlan, signal?: AbortSignal): Promise<SkillResult & { pageIds?: string[] }> {
  const theme = plan.esthetic ?? AURORA;
  const store = useCanvasStore.getState();
  const forceNew = plan.forceNew ?? false;
  const beforeCanvas = plan.pack.kind === "canvas" ? cloneCanvasState(storeToState()) : null;
  const rollback = () => { if (beforeCanvas) useCanvasStore.getState().loadDocument(beforeCanvas); };

  /* 重做模式：在当前活动页上清空重画，避免新旧结果叠加 */
  if (plan.redo && plan.pack.kind === "canvas") {
    if (!aiEngineReady()) {
      return { message: "未接入 AI 引擎，技能生成不可用。请在聊天框底部「AI 引擎配置」中配置 API Key。" };
    }
    const s = useCanvasStore.getState();
    const page = s.pages.find((p) => p.id === (useWorkspaceStore.getState().activePageId ?? "")) ?? s.pages[0];
    if (!page) return { message: "当前没有可重做的页面" };
    snapshotPage(page.id, "重做前");
    [...page.nodes].forEach((node) => s.removeNode(page.id, node.id));
    const applied = await generateAiLayout({
      pack: plan.pack,
      theme,
      input: plan.topic || plan.pack.name,
      pages: [{ pageId: page.id, role: "重做：重新设计这个页面", width: page.layout.width, height: page.layout.height }],
      imageDataUrl: plan.attachment,
      fileText: plan.attachmentFile,
      signal,
    });
    if (signal?.aborted) { rollback(); return { message: "已停止生成，未保留半成品。" }; }
    if (!applied) { rollback(); return { message: "AI 排版失败（返回无效或请求出错），未保留半成品，请重试或检查 AI 配置。" }; }
    return { message: `已清除旧内容并重新设计（${applied} 个节点）`, pageId: page.id };
  }

  /* ===== 画布类技能包：AI 亲自排版，无硬编码模板；未接入 AI 则禁止生成 ===== */
  if (plan.pack.kind === "canvas") {
    if (!aiEngineReady()) {
      return { message: "未接入 AI 引擎，技能生成不可用。请在聊天框底部「AI 引擎」入口配置 API Key；也可以直接在画布上手动拖拽组件设计。" };
    }
    const packId = plan.pack.id;
    const input = plan.topic ? `${plan.topic}（${plan.sub || packId}）` : plan.sub || plan.pack.name;

    /* 图转 3D：必须携带用户上传的参考图 */
    if (packId === "image-3d") {
      if (!plan.attachment) {
        return { message: "图转 3D 需要先上传一张参考图：点输入框旁的图片按钮附图后再发送。" };
      }
      const id = resolveTargetPage("3D 场景舞台", 1280, 800, forceNew);
      const applied = await imageTo3dLayout({ input: plan.topic || "把这张图变成一个 3D 场景展示页", imageDataUrl: plan.attachment, pageId: id, theme, signal });
      if (signal?.aborted) { rollback(); return { message: "已停止生成，未保留半成品。" }; }
      if (!applied) { rollback(); return { message: "AI 分析图片失败（返回无效或请求出错），未生成任何内容，请重试或检查 AI 配置。" }; }
      return { message: `3D 舞台页已由 AI 生成（${applied} 个节点），3D 场景在预览/演示中会真实转动`, pageId: id };
    }

    if (packId === "deck") {
      const outline = plan.outline ?? (plan.topic
        ? { ...DEFAULT_OUTLINE, topic: plan.topic, subtitle: `围绕「${plan.topic}」的结构化表达` }
        : DEFAULT_OUTLINE);
      const firstId = resolveTargetPage(`幻灯片 · 封面${plan.topic ? `：${plan.topic}` : ""}`, 1280, 720, forceNew);
      const origin = store.pages.find((p) => p.id === firstId)?.layout ?? { x: 120, y: 120 };
      const { pageIds } = scaffoldDeck(firstId, outline, { x: origin.x, y: origin.y }, theme);
      const hotspotNote = "；注意：右下角 (1080,640) 152×44 已存在「下一页」翻页按钮，排版时避开该区域也不要重复创建它";
      const specs: PageSpec[] = pageIds.map((pid, index) => {
        if (index === 0) return { pageId: pid, role: "封面", width: 1280, height: 720, note: `主题「${outline.topic}」，副标题「${outline.subtitle}」，要有开场气场${hotspotNote}` };
        if (index < pageIds.length - 1) {
          const section = outline.sections[index - 1];
          return { pageId: pid, role: `内容页 ${index + 1}/${outline.sections.length}`, width: 1280, height: 720, note: `章节「${section.title}」：${section.points.join("；")}${hotspotNote}` };
        }
        return { pageId: pid, role: "结束页", width: 1280, height: 720, note: outline.closing };
      });
      let applied = 0;
      for (const pageSpec of specs) {
        if (signal?.aborted) { rollback(); return { message: "已停止生成，未保留半成品。" }; }
        const pageApplied = await generateAiLayout({
          pack: plan.pack,
          theme,
          input: plan.topic || "主题演示文稿",
          pages: [pageSpec],
          outline,
          signal,
        });
        if (!pageApplied) {
          rollback();
          return { message: "AI 排版失败（返回无效或请求出错），未生成任何内容，请重试或检查 AI 配置。" };
        }
        applied += pageApplied;
        useWorkspaceStore.getState().setActivePageId(pageSpec.pageId);
      }
      useWorkspaceStore.getState().setActivePageId(firstId);
      return { message: `PPT 已逐页生成完成：${pageIds.length} 页、${applied} 个设计节点，点「下一页」可翻页演示`, pageId: firstId, pageIds };
    }

    const dims: Record<string, { name: string; w: number; h: number; role: string }> = {
      web: { name: plan.topic ? `落地页：${plan.topic}` : "SaaS 落地页", w: 1200, h: theme.hero === "none" ? 1112 : 1312, role: "品牌落地页（导航/Hero/特性/页脚完整叙事）" },
      mobile: plan.sub === "android" ? { name: "安卓首页", w: 360, h: 800, role: "安卓 App 首页" } : { name: "引导页", w: 390, h: 844, role: "iOS App 引导页" },
      dashboard: { name: plan.topic ? `看板：${plan.topic}` : "数据看板", w: 1200, h: 820, role: "高密度数据看板" },
      image: plan.sub === "poster" ? { name: "杂志海报", w: 1080, h: 1350, role: "杂志风海报" } : { name: "社媒卡片", w: 1080, h: 1080, role: "社交媒体宣发图" },
      email: { name: "营销邮件", w: 640, h: 900, role: "品牌营销邮件" },
      wireframe: { name: "线框图", w: 1200, h: 820, role: "低保真线框（灰阶、无彩色）" },
    };
    const spec = dims[packId] ?? dims.web;
    const id = resolveTargetPage(spec.name, spec.w, spec.h, forceNew);
    // 目标页若已有内容（复用场景），覆盖前先存档，支持一键回退
    const targetPage = useCanvasStore.getState().pages.find((p) => p.id === id);
    if (targetPage && targetPage.nodes.length > 0) snapshotPage(id, "生成前");
    const applied = await generateAiLayout({
      pack: plan.pack,
      theme,
      input: plan.topic || spec.role,
      pages: [{ pageId: id, role: spec.role, width: spec.w, height: spec.h }],
      imageDataUrl: plan.attachment,
      fileText: plan.attachmentFile,
      signal,
    });
    if (signal?.aborted) { rollback(); return { message: "已停止生成，未保留半成品。" }; }
    if (!applied) { rollback(); return { message: "AI 排版失败（返回无效或请求出错），未生成任何内容，请重试或检查 AI 配置。" }; }
    return { message: `${spec.name}已由 AI 排版完成（${applied} 个设计节点）`, pageId: id };
  }

  /* ===== 代码导出 / 通用工具：确定性执行，不依赖 AI ===== */
  switch (plan.pack.id) {
    case "code-html": {
      const state = storeToState();
      if (!state.pages.length) return { message: "画布为空，先生成或导入一些页面" };
      downloadText(`${fileName(state)}.html`, exportHtmlDocument(state), "text/html");
      return { message: "HTML 已导出下载（含页面跳转交互）" };
    }
    case "code-react": {
      const state = storeToState();
      if (!state.pages.length) return { message: "画布为空，先生成或导入一些页面" };
      downloadText(`${fileName(state)}.tsx`, exportReactCode(state), "text/plain");
      return { message: "React 组件源码已导出下载" };
    }
    case "code-vue": {
      const state = storeToState();
      if (!state.pages.length) return { message: "画布为空，先生成或导入一些页面" };
      downloadText(`${fileName(state)}.vue`, exportVueCode(state), "text/plain");
      return { message: "Vue 3 SFC 已导出下载" };
    }
    case "code-android": {
      const state = storeToState();
      if (!state.pages.length) return { message: "画布为空，先生成或导入一些页面" };
      downloadText(`${fileName(state)}.kt`, exportComposeCode(state), "text/plain");
      return { message: "Jetpack Compose 代码已导出下载" };
    }
    case "utility": {
      if (plan.sub === "critique") return runCritique();
      if (plan.sub === "dark") return runDarkMode();
      if (plan.sub === "align") return runAutoAlign();
      return runPageStats();
    }
    default:
      return { message: "未知技能包" };
  }
}

/* ================= 工具函数 ================= */

function storeToState(): CanvasState {
  const s = useCanvasStore.getState();
  return JSON.parse(JSON.stringify({ meta: s.meta, pages: s.pages, transitions: s.transitions, designSystem: s.designSystem, comments: s.comments, componentRegistry: s.componentRegistry })) as CanvasState;
}

function cloneCanvasState(state: CanvasState): CanvasState {
  return JSON.parse(JSON.stringify(state)) as CanvasState;
}

function fileName(state: CanvasState): string {
  return (state.meta.canvasName || "routecanvas").replace(/\s+/g, "-");
}

/** 审美卡片候选：返回技能包内可用审美 */
export function estheticsFor(pack: SkillPack): Theme[] {
  return pack.esthetics.length ? pack.esthetics : ESTHETICS;
}
