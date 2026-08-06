/**
 * AI 计划生成 —— Plan 由大模型产出，本地规则仅兜底
 * 流程：用户意图 + 技能包 + 审美 + 组件库清单 → /api/ai/chat → 结构化计划（steps + deck 大纲 + 组件建议）
 */
import { useCanvasStore } from "@/store/canvasStore";
import { getAiSettings } from "@/lib/aiSettings";
import type { SkillPack } from "./agent";
import { methodologyBrief, type Theme } from "./esthetics";
import type { DeckOutline } from "./deck";

export interface AiPlanResult {
  steps: string[];
  outline?: DeckOutline;
}

/** 组件库清单：让 AI 知道技能包可以调用哪些真实组件 */
export function componentInventory(limit = 60): string {
  const registry = useCanvasStore.getState().componentRegistry;
  return registry
    .slice(0, limit)
    .map((def) => `${def.id}(${def.label})`)
    .join("、");
}

export function buildSkillPlanMessages(pack: SkillPack, theme: Theme | null, input: string): Array<{ role: string; content: string }> {
  const themeDesc = theme
    ? `审美方向已锁定为「${theme.name}」（${theme.tagline}，灵感：${theme.inspiredBy}）。下面是设计基线，优先保证整体气质与信息层级；为了更好的画面允许突破单个 token，但不要破坏对比度、可读性和节奏：
- 页面底色 ${theme.bg}${theme.gradFrom ? `（可渐变 ${theme.gradFrom} → ${theme.gradTo}）` : ""}
- 卡片/面板 ${theme.surface}，发丝边框 ${theme.surfaceBorder}
- 文字三级色阶：主 ${theme.text} / 次 ${theme.subtext}
- 品牌强调色：主 ${theme.accent} / 辅 ${theme.accent2}
- 圆角 ${theme.radius}px；大标题字重 ${theme.displayWeight ?? 600}、字距 ${theme.displayTracking ?? 0}px
- Hero 视觉语言：${theme.hero === "orb" ? "3D 光影球体（渐变球体+高光+地面反光）" : theme.hero === "none" ? "纯排版留白，不加视觉主体" : "产品摄影卡片（发丝边框包裹）"}
${methodologyBrief(theme)}`
    : "审美方向未定";
  const designLaws = `设计法则（必须遵守）：
① Apple 式构图：大留白、居中 display 巨字标题、三级文字色阶、发丝线分隔、实色胶囊 CTA；
② 反 AI 味清单：禁 emoji 开头、禁假版本徽标、禁装饰性文字条、禁按钮渐变、禁满页紫渐变、禁无意义滚动提示；
③ 色彩克制：一套页面彩色≤ 3 种，情绪由留白与光影承担。`;
  const outlineSchema =
    pack.id === "deck"
      ? `，并给出 outline 字段：{"topic":"主题","subtitle":"副标题","sections":[{"title":"章节标题","points":["要点1","要点2","要点3"]}],"closing":"结束语"}，sections 给 3 个，要点必须紧扣用户主题、有真实信息量，不许用「成果/数据/计划」这类万能模板`
      : "";
  return [
    {
      role: "system",
      content: `你是 RouteCanvas 的首席设计智能体，品味对标 Apple / Stripe / Linear 官网水准。现在为「${pack.name}」技能包制定执行计划。
${themeDesc}。
${designLaws}
可用组件库（执行时可自由调用这些真实组件，也可用基础图元 Container/Text/Button/Badge/Image 自由构图）：${componentInventory()}。
${pack.id === "deck" ? "Deck 技能会生成多页 1280×720 幻灯片并自动连线，封面+内容页+结束页。" : ""}
要求：充分发挥设计创意，步骤要具体、有画面感（描述真实的视觉手法：构图、光影、色彩节奏、留白），严禁套话与模板腔；内容必须紧扣用户的实际主题。
重要：执行阶段不使用任何模板，由你亲自在画布上逐个节点排版（坐标/尺寸/光影/配图全由你决定），所以步骤应描述你的设计动作而非机械流程。
只输出 JSON，不要任何解释或代码块标记${outlineSchema}。
JSON 格式：{"steps":["4-7条具体可感知的执行步骤"]}`,
    },
    { role: "user", content: input || `生成一个${pack.name}` },
  ];
}

/** 解析 AI 返回的计划 JSON（容错：剥代码块、截取 JSON 段） */
export function parseAiPlan(raw: string): AiPlanResult | null {
  try {
    let text = (raw ?? "").trim();
    text = text.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start < 0 || end <= start) return null;
    const data = JSON.parse(text.slice(start, end + 1)) as { steps?: unknown; outline?: unknown; components?: unknown };
    const steps = Array.isArray(data.steps) ? data.steps.filter((s): s is string => typeof s === "string" && s.length > 0) : [];
    if (!steps.length) return null;
    let outline: DeckOutline | undefined;
    if (data.outline && typeof data.outline === "object") {
      const o = data.outline as Partial<DeckOutline>;
      if (o.topic && Array.isArray(o.sections) && o.sections.length) {
        outline = {
          topic: String(o.topic),
          subtitle: String(o.subtitle ?? ""),
          sections: o.sections
            .filter((s) => s && s.title)
            .map((s) => ({ title: String(s.title), points: (s.points ?? []).map(String).slice(0, 4) })),
          closing: String(o.closing ?? "谢谢观看"),
        };
      }
    }
    return { steps: steps.slice(0, 7), outline };
  } catch {
    return null;
  }
}

/** 请求 AI 生成计划；未配置 API Key 或失败时返回 null（由调用方展示失败态） */
export async function fetchAiPlan(pack: SkillPack, theme: Theme | null, input: string, signal?: AbortSignal): Promise<AiPlanResult | null> {
  const settings = getAiSettings();
  if (!settings.apiKey) return null;
  // 外部中断 + 120s 超时（计划输出较短，但需给慢模型留余量），避免计划制定卡死
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 120000);
  const onOuter = () => ctrl.abort();
  if (signal) {
    if (signal.aborted) ctrl.abort();
    else signal.addEventListener("abort", onOuter);
  }
  try {
    const resp = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: buildSkillPlanMessages(pack, theme, input),
        ...settings,
        apiKey: settings.apiKey || undefined,
        creativity: 0.8,
      }),
      signal: ctrl.signal,
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    return parseAiPlan(data.content ?? "");
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onOuter);
  }
}

/** 是否已配置 AI（决定 Plan 卡片标注 AI/本地） */
export function aiConfigured(): boolean {
  return Boolean(getAiSettings().apiKey);
}
