"use client";
/**
 * AI Chat 面板 — 对话式画布共编
 * 用户输入自然语言指令 → AI 返回结构化 operations → 实时应用到画布。
 */
import * as React from "react";
import Image from "next/image";
import { ArrowLeftRight, Bot, Send, Sparkles, User, X, Loader2, Wand2, LayoutTemplate, LogIn, Check, Play, MousePointer2, ImagePlus, Square, FileText, RotateCcw } from "lucide-react";
import { useCanvasStore } from "@/store/canvasStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { buildChatMessages } from "@/data/chatPrompt";
import { describeOperation, executeOperations, parseAiResponse, toggleOperationSelection, undoLastAiChange, useAiChangeStore, useProposalStore, type ChatOp } from "@/data/chatOps";
import { toast } from "@/lib/toast";
import { AI_SETTINGS_EVENT, getAiSettings } from "@/lib/aiSettings";
import { COMMENT_AI_EVENT, dispatchFocusActivePage } from "@/lib/events";
import { triggerAutomations } from "@/data/automation";
import { parseFileToText, isParsableDoc } from "@/lib/fileParse";
import { routeIntent, makePlan, executePlan, estheticsFor, wantsRedo, isComponentRequest, SKILL_PACKS, type SkillPack, type SkillPlan } from "@/data/skills/agent";
import { fetchAiPlan } from "@/data/skills/skillPlan";
import { generateComponentOnPage, aiEngineReady } from "@/data/skills/aiLayout";
import { useVersionStore, restoreLatestSnapshot } from "@/lib/pageVersions";
import { matchEsthetic, type Theme } from "@/data/skills/esthetics";

interface ChatMsg {
  role: "user" | "assistant";
  content: string; // 展示文本
  applied?: string[]; // 已执行的操作摘要
  /** 技能流卡片：审美选择 */
  estheticPack?: SkillPack;
  estheticDone?: string; // 已选中的审美名（选定后卡片置灰）
  /** 技能流卡片：执行计划 */
  plan?: SkillPlan;
  /** AI 正在制定计划中（卡片头部转圈） */
  planThinking?: boolean;
  /** AI 计划不可用（未配置 Key / 请求失败） */
  planAiFailed?: boolean;
  /** 待办式进度：正在执行的步骤索引（之前步骤已完成） */
  planProgress?: number;
  planDone?: string; // 执行完成后的结果文案
  /** 生成/重做前存过快照的页面，可一键回退 */
  snapshotPageId?: string;
}

/** 快捷指令：一键触发高频高质量生成/美化诉求 */
const QUICK_ACTIONS = [
  {
    icon: Wand2,
    label: "美化当前页面",
    prompt: `对当前页面做高级感美化（增量修改，保持文案与结构，不要删页重建）：
1. 背景：第一个添加一个铺满整页的 abg- 动态背景或 Container 品牌渐变底（bgType=gradient），让页面告别白底；
2. 标题：主标题改 Text variant=display（或 fontSize≥40、fontWeight≥800），可叠 gradText 品牌渐变；副标题色 #6b7280；
3. 卡片：内容卡片外套 Container（radius=16、shadow=md）或玻璃拟态（bgType=glass、blur=16、borderWidth=1）；
4. CTA：只保留 1 个 Button variant=primary 放视觉终点，其余改 secondary/ghost；
5. 布局：x/y/宽/高取 8 的倍数，同区块严格左对齐或居中，消除错位；
6. 色彩：有彩色≤3 种、色温统一，主色 #6366f1。`,
  },
  {
    icon: LayoutTemplate,
    label: "落地页骨架",
    prompt:
      "按设计系统的「落地页构图套路」生成一个完整的品牌落地页（800×960，scroll 模式）：Navbar → Hero（abg- 动态背景 + display 渐变标题 + 副标题 + 双按钮）→ 3 列特性卡片 → 数据背书区 → CTA 渐变横幅 → Footer。",
  },
  {
    icon: LogIn,
    label: "登录页示例",
    prompt:
      "做一个有高级感的登录页：abg- 动态背景或品牌渐变底，居中玻璃拟态登录卡片（Container bgType=glass），含 display 标题、用户名/密码输入框、primary 登录按钮。",
  },
] as const;

/** 构造选中元素上下文（发送时实时取最新状态），让 AI 听懂「把这个改大」 */
function buildSelectionContext(): string {
  const s = useCanvasStore.getState();
  if (s.selection.type !== "node" || !s.selection.id || !s.selection.pageId) return "";
  const page = s.pages.find((p) => p.id === s.selection.pageId);
  const node = page?.nodes.find((n) => n.id === s.selection.id);
  if (!page || !node) return "";
  return JSON.stringify({
    pageId: page.id,
    pageName: page.name,
    nodeId: node.id,
    type: node.type,
    text: node.props?.text ?? "",
    frame: { x: node.position.x, y: node.position.y, width: node.size.width, height: node.size.height },
    custom: node.props?.custom ?? {},
  });
}

export function ChatPanel({ open, onClose, docked = false, onCreateCanvas, onStartProject, onOpenAiAgent }: { open: boolean; onClose: () => void; docked?: boolean; onCreateCanvas?: () => void; onStartProject?: () => void; onOpenAiAgent?: () => void }) {
  const [messages, setMessages] = React.useState<ChatMsg[]>([]);
  const [input, setInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [proposal, setProposal] = React.useState<{ reply: string; operations: ChatOp[] } | null>(null);
  const [selectedOps, setSelectedOps] = React.useState<Set<number>>(new Set());
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const sendRef = React.useRef<(override?: string) => Promise<void>>(async () => undefined);
  /** 技能流状态机：等待用户选择审美时的挂起上下文 */
  const flowRef = React.useRef<{ pack: SkillPack; input: string; attachment?: string | null; file?: { name: string; text: string } | null } | null>(null);
  /** 最近一次技能流的原始输入（供 AI 计划生成使用） */
  const flowInputRef = React.useRef("");
  const runningRef = React.useRef(false);
  const setActivePageId = useWorkspaceStore((s) => s.setActivePageId);
  const openStudio = useWorkspaceStore((s) => s.openStudio);
  const setView = useWorkspaceStore((s) => s.setView);
  /** 选中元素标签：让聊天框知道 AI 能看到哪个元素 */
  const selLabel = useCanvasStore((s) => {
    if (s.selection.type !== "node" || !s.selection.id || !s.selection.pageId) return "";
    const page = s.pages.find((p) => p.id === s.selection.pageId);
    const node = page?.nodes.find((n) => n.id === s.selection.id);
    if (!node) return "";
    const name = node.props?.text ? `${node.type} · ${String(node.props.text).slice(0, 10)}` : node.type;
    return `${name}（${Math.round(node.size.width)}×${Math.round(node.size.height)}）`;
  });
  const clearSelection = useCanvasStore((s) => s.clearSelection);
  const aiChange = useAiChangeStore((state) => state.change);
  const openAiDiff = useAiChangeStore((state) => state.openDiff);
  /** 用户上传的参考图（dataURL）：随技能流携带给多模态 AI */
  const [attachment, setAttachment] = React.useState<string | null>(null);
  /** 用户上传的文本文件（md/txt/word/ppt/pdf 等）：作为设计参考资料 */
  const [fileAtt, setFileAtt] = React.useState<{ name: string; text: string } | null>(null);
  const [parsing, setParsing] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [aiConfigured, setAiConfigured] = React.useState(() => Boolean(getAiSettings().apiKey));
  React.useEffect(() => {
    const sync = () => setAiConfigured(Boolean(getAiSettings().apiKey));
    window.addEventListener(AI_SETTINGS_EVENT, sync);
    return () => window.removeEventListener(AI_SETTINGS_EVENT, sync);
  }, []);
  /** 最近一次技能流用的技能包：重做时沿用 */
  const lastPackRef = React.useRef<SkillPack | null>(null);
  /** 中断控制：计划制定/执行 与 普通对话各一个 */
  const planAbortRef = React.useRef<AbortController | null>(null);
  const chatAbortRef = React.useRef<AbortController | null>(null);
  const onPickImage = (file: File | undefined) => {
    if (!file) return;
    if (file.type.startsWith("image/")) {
      if (file.size > 8 * 1024 * 1024) {
        toast.error("图片太大了，请控制在 8MB 以内");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => setAttachment(String(reader.result));
      reader.readAsDataURL(file);
      return;
    }
    // 文档类文件：md/txt/json/html/csv 直读，docx/pptx/pdf 走解析器提取文字
    const textLike = /\.(md|markdown|txt|json|html?|csv|yaml|yml)$/i.test(file.name) || file.type.startsWith("text/");
    if (!textLike && !isParsableDoc(file.name)) {
      toast.error("支持：图片、md/txt/json/html/csv、Word(docx)、PPT(pptx)、PDF");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("文件太大了，请控制在 20MB 以内");
      return;
    }
    setParsing(true);
    parseFileToText(file)
      .then((text) => {
        if (!text.trim()) {
          toast.error("没有提取到文字内容（可能是扫描件/纯图片 PDF）");
          return;
        }
        setFileAtt({ name: file.name, text });
        toast.success(`已解析《${file.name}》，发送需求时 AI 会据此填充内容`);
      })
      .catch((error) => toast.error((error as Error).message || "文件解析失败"))
      .finally(() => setParsing(false));
  };

  /** 单飞控制：停止上一轮未完成的流程，避免两张卡片并存/结果重叠 */
  const cancelActiveFlows = () => {
    if (planAbortRef.current && !planAbortRef.current.signal.aborted) {
      planAbortRef.current.abort();
      setMessages((items) =>
        items.map((item) =>
          item.planThinking || (item.plan && item.planProgress !== undefined && !item.planDone)
            ? { ...item, planThinking: false, planProgress: undefined, content: "该流程已被停止。" }
            : item,
        ),
      );
    }
    if (chatAbortRef.current && !chatAbortRef.current.signal.aborted) {
      chatAbortRef.current.abort();
    }
  };
  /** 用户主动停止当前所有 AI 任务 */
  const stopAll = () => {
    planAbortRef.current?.abort();
    chatAbortRef.current?.abort();
    setBusy(false);
    setMessages((items) =>
      items.map((item) =>
        item.planThinking || (item.plan && item.planProgress !== undefined && !item.planDone)
          ? { ...item, planThinking: false, planProgress: undefined, content: "已停止。" }
          : item,
      ),
    );
    toast.success("已停止");
  };

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  /* 评论钉“交给 AI”事件：自动发送指令 */
  React.useEffect(() => {
    const onCommentAi = (event: Event) => {
      const text = (event as CustomEvent<string>).detail;
      if (text) void sendRef.current(text);
    };
    window.addEventListener(COMMENT_AI_EVENT, onCommentAi);
    return () => window.removeEventListener(COMMENT_AI_EVENT, onCommentAi);
  }, []);

  if (!open) return null;

  /** 更新指定索引消息的字段（技能流卡片状态推进） */
  const patchMsg = (index: number, patch: Partial<ChatMsg>) => {
    setMessages((items) => items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  /** 展示 Plan 卡片：canvas 类先由 AI 制定计划；代码/工具类直接执行 */
  const presentPlan = async (basePlan: SkillPlan) => {
    lastPackRef.current = basePlan.pack;
    if (basePlan.pack.kind === "utility" || basePlan.pack.kind === "code") {
      const result = await executePlan(basePlan);
      toast.success(result.message);
      setMessages((m) => [...m, { role: "assistant", content: result.message, plan: basePlan, planDone: result.message }]);
      return;
    }
    // 单飞：停掉上一轮未完成的流程，避免双卡片/结果重叠
    cancelActiveFlows();
    const controller = new AbortController();
    planAbortRef.current = controller;
    // Plan 只由 AI 产出：先展示纯思考态（骨架屏），不预填任何本地模板步骤
    setMessages((m) => [...m, {
      role: "assistant",
      content: `已受理「${basePlan.pack.name}」需求${basePlan.esthetic ? `，审美方向：${basePlan.esthetic.name}` : ""}。正在交给 AI 制定执行计划…`,
      plan: { ...basePlan, steps: [] },
      planThinking: true,
    }]);
    void (async () => {
      const flowInput = flowInputRef.current;
      const ai = await fetchAiPlan(basePlan.pack, basePlan.esthetic, flowInput, controller.signal);
      if (controller.signal.aborted) return; // 已被停止/取代，不再回写
      setMessages((items) => {
        // 定位最后一条「AI 制定中」的计划消息，避免索引漂移
        let index = -1;
        for (let j = items.length - 1; j >= 0; j -= 1) {
          if (items[j].planThinking) { index = j; break; }
        }
        if (index < 0) return items;
        return items.map((item, i) => {
          if (i !== index || !item.plan) return item;
          if (ai) {
            return {
              ...item,
              planThinking: false,
              content: "AI 已制定好执行计划，确认后开始：",
              plan: { ...item.plan, steps: ai.steps, outline: ai.outline ?? item.plan.outline, aiPlanned: true },
            };
          }
          return {
            ...item,
            planThinking: false,
            planAiFailed: true,
            content: "未能连接 AI（未配置 API Key 或请求失败）。可点击聊天框底部的 AI 引擎状态条进行配置。",
          };
        });
      });
    })();
  };

  /** 弹出审美选择卡片 */
  const askEsthetic = (pack: SkillPack, input: string) => {
    flowRef.current = { pack, input, attachment, file: fileAtt };
    flowInputRef.current = input;
    setMessages((m) => [
      ...m,
      { role: "assistant", content: `好的，我来负责「${pack.name}」。${pack.desc}。\n先定个气质方向 —— 点一个审美风格，或直接告诉我你想要的感觉：`, estheticPack: pack },
    ]);
  };

  /** 选定审美 → 生成 Plan */
  const pickEsthetic = (msgIndex: number, theme: Theme) => {
    const flow = flowRef.current;
    if (!flow) return;
    flowRef.current = null;
    patchMsg(msgIndex, { estheticDone: theme.name });
    setMessages((m) => [...m, { role: "user", content: `${theme.name} — ${theme.tagline}` }]);
    const plan = makePlan(flow.pack, theme, flow.input);
    if (flow.attachment) plan.attachment = flow.attachment;
    if (flow.file) plan.attachmentFile = flow.file.text;
    setAttachment(null);
    setFileAtt(null);
    void presentPlan(plan);
  };

  /** 执行 Plan 卡片 —— Qoder 待办式：逐条点亮 → 转圈 → 打勾，最后真正落地 */
  const runPlan = async (msgIndex: number) => {
    const plan = messages[msgIndex]?.plan;
    if (!plan || runningRef.current) return;
    cancelActiveFlows();
    const controller = new AbortController();
    planAbortRef.current = controller;
    runningRef.current = true;
    try {
      for (let stepIndex = 0; stepIndex < plan.steps.length; stepIndex += 1) {
        if (controller.signal.aborted) return;
        patchMsg(msgIndex, { planProgress: stepIndex });
        await new Promise((resolve) => setTimeout(resolve, 220));
      }
      patchMsg(msgIndex, { content: "AI 正在画布上排版，通常需要 20–60 秒，可点「停止」中断…" });
      const result = await executePlan(plan, controller.signal);
      if (controller.signal.aborted) return; // 停止后不再回写
      const blocked = result.message.includes("未接入 AI") || result.message.includes("AI 排版失败");
      if (blocked) {
        patchMsg(msgIndex, { planAiFailed: true });
        toast.error(result.message);
        setMessages((items) => [...items, { role: "assistant", content: result.message }]);
        return;
      }
      patchMsg(msgIndex, { planDone: result.message, planProgress: plan.steps.length });
      // 若覆盖前存过快照，提供一键回退
      if (result.pageId && useVersionStore.getState().latestOf(result.pageId)) {
        patchMsg(msgIndex, { snapshotPageId: result.pageId });
      }
      toast.success(result.message);
      if (result.pageId) {
        setActivePageId(result.pageId);
        setView("design");
        openStudio();
        // 让画布视口聚焦到新生成的页面，避免"堆叠看不到"
        setTimeout(() => dispatchFocusActivePage(), 150);
      }
    } catch (error) {
      toast.error(`执行失败：${(error as Error).message}`);
    } finally {
      runningRef.current = false;
    }
  };

  /** 组件级快速生成：加到当前页，不新建页、不走审美/计划 */
  const handleComponentGen = async (instruction: string) => {
    cancelActiveFlows();
    const controller = new AbortController();
    chatAbortRef.current = controller;
    setBusy(true);
    try {
      if (!aiEngineReady()) {
        setMessages((m) => [...m, { role: "assistant", content: "未接入 AI 引擎，生成不可用。请点击聊天框底部的 AI 引擎状态条配置 API Key；也可以从左侧组件库手动拖入组件。" }]);
        return;
      }
      const s = useCanvasStore.getState();
      const page = s.pages.find((p) => p.id === useWorkspaceStore.getState().activePageId) ?? s.pages[0];
      if (!page) {
        setMessages((m) => [...m, { role: "assistant", content: "当前没有页面，请先新建一个页面。" }]);
        return;
      }
      openStudio();
      const occupied = page.nodes
        .filter((node) => !node.hidden)
        .map((node) => ({ x: node.position.x, y: node.position.y, width: node.size.width, height: node.size.height }));
      const applied = await generateComponentOnPage({
        input: instruction,
        pageId: page.id,
        width: page.layout.width,
        height: page.layout.height,
        occupied,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      if (!applied) {
        setMessages((m) => [...m, { role: "assistant", content: "AI 未能生成有效组件（返回无效或请求出错），请重试或检查 AI 配置。" }]);
        return;
      }
      setMessages((m) => [...m, { role: "assistant", content: `已把组件加到当前页面（${applied} 个节点），可直接选中继续调整。` }]);
      toast.success("组件已生成");
    } finally {
      setBusy(false);
    }
  };

  const send = async (override?: string) => {
    const instruction = (override ?? input).trim();
    if (!instruction || busy) return;
    onStartProject?.();
    setInput("");
    setMessages((m) => [...m, { role: "user", content: instruction }]);

    /* ===== 组件级生成：加到当前页，不新建页、不走审美/计划 ===== */
    if (isComponentRequest(instruction)) {
      void handleComponentGen(instruction);
      return;
    }

    /* ===== 重做意图：在当前页清空重画，不叠加新页 ===== */
    if (wantsRedo(instruction)) {
      const s = useCanvasStore.getState();
      const active = s.pages.find((p) => p.id === useWorkspaceStore.getState().activePageId) ?? s.pages[0];
      if (active && active.nodes.length > 0) {
        const pack = lastPackRef.current ?? SKILL_PACKS.find((p) => p.id === "web") ?? SKILL_PACKS[0];
        const plan = makePlan(pack, null, instruction);
        plan.redo = true;
        void presentPlan(plan);
        return;
      }
    }

    /* ===== 技能流拦截：挂起态（等待审美选择）===== */
    if (flowRef.current) {
      const flow = flowRef.current;
      if (/取消|算了|不用/.test(instruction)) {
        flowRef.current = null;
        setMessages((m) => [...m, { role: "assistant", content: "好的，已取消这次技能流程。你可以继续描述其他需求。" }]);
        return;
      }
      const theme = matchEsthetic(instruction);
      if (theme) {
        flowRef.current = null;
        flowInputRef.current = `${flow.input} ${instruction}`;
        const plan = makePlan(flow.pack, theme, `${flow.input} ${instruction}`);
        if (flow.attachment) plan.attachment = flow.attachment;
        if (flow.file) plan.attachmentFile = flow.file.text;
        setAttachment(null);
        setFileAtt(null);
        void presentPlan(plan);
        return;
      }
      setMessages((m) => [
        ...m,
        { role: "assistant", content: `没太确定你想要的气质。可以点上方卡片，或试试这些词：${estheticsFor(flow.pack).map((t) => t.name).join(" / ")}。输入「取消」可退出。` },
      ]);
      return;
    }

    /* ===== 技能流拦截：意图路由（主智能体）===== */
    const pack = routeIntent(instruction);
    if (pack) {
      if (pack.kind === "canvas" && !aiEngineReady()) {
        setMessages((m) => [...m, { role: "assistant", content: "这类 AI 生成需要先接入 AI Agent。请点击顶部或底部的「AI Agent」配置入口，连接成功后再开始生成。" }]);
        return;
      }
      flowInputRef.current = instruction;
      const attachedNow = attachment;
      const fileNow = fileAtt;
      if (pack.kind === "canvas" && pack.esthetics.length) {
        const theme = matchEsthetic(instruction);
        if (theme) {
          // 一句话同时说清了做什么 + 要什么气质 → 直达 Plan
          const plan = makePlan(pack, theme, instruction);
          if (attachedNow) plan.attachment = attachedNow;
          if (fileNow) plan.attachmentFile = fileNow.text;
          setAttachment(null);
          setFileAtt(null);
          void presentPlan(plan);
        } else {
          askEsthetic(pack, instruction);
        }
      } else {
        const plan = makePlan(pack, null, instruction);
        if (attachedNow) plan.attachment = attachedNow;
        if (fileNow) plan.attachmentFile = fileNow.text;
        setAttachment(null);
        setFileAtt(null);
        void presentPlan(plan);
      }
      return;
    }

    /* ===== 未命中技能包 → 交给 AI ===== */
    cancelActiveFlows();
    const chatController = new AbortController();
    chatAbortRef.current = chatController;
    setBusy(true);
    try {
      // 构建历史（仅保留展示文本，供 AI 理解上下文）
      const history = messages.map((m) => ({
        role: m.role,
        content: m.role === "assistant" ? m.content : m.content,
      }));
      const state = useCanvasStore.getState();
      const reqMessages: Array<{ role: string; content: unknown }> = buildChatMessages(state, history, instruction, buildSelectionContext() || undefined);
      // 参考图/文件随普通对话注入，避免附件永久残留
      if (attachment || fileAtt) {
        const last = reqMessages[reqMessages.length - 1];
        const baseText = typeof last.content === "string" ? last.content : "";
        const fileNote = fileAtt ? `\n\n（用户上传参考资料《${fileAtt.name}》：\n${fileAtt.text.slice(0, 6000)}\n……请据此理解需求并填充真实内容）` : "";
        const textPart = `${baseText}${fileNote}${attachment ? "\n\n（用户附上参考图，请结合图片理解并执行指令）" : ""}`;
        reqMessages[reqMessages.length - 1] = {
          role: last.role,
          content: attachment
            ? [
                { type: "text", text: textPart },
                { type: "image_url", image_url: { url: attachment } },
              ]
            : textPart,
        };
        setAttachment(null);
        setFileAtt(null);
      }

      const aiSettings = getAiSettings();
      const resp = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: reqMessages, ...aiSettings, apiKey: aiSettings.apiKey || undefined }),
        signal: chatController.signal,
      });
      const data = await resp.json();
      if (!resp.ok) {
        setMessages((m) => [
          ...m,
          { role: "assistant", content: `❌ ${data.error || "请求失败"}` },
        ]);
        return;
      }

      const parsed = parseAiResponse(data.content ?? "");
      if (!parsed) {
        setMessages((m) => [
          ...m,
          { role: "assistant", content: data.content || "（AI 无有效返回）" },
        ]);
        return;
      }

      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: parsed.reply || "已生成修改方案",
        },
      ]);
      if (parsed.operations?.length) {
        setProposal({ reply: parsed.reply || "AI 修改方案", operations: parsed.operations });
        setSelectedOps(new Set(parsed.operations.map((_, index) => index)));
        // 高亮待审核操作涉及的节点
        const ids = parsed.operations
          .map((operation) => ("nodeId" in operation ? operation.nodeId : undefined))
          .filter((id): id is string => Boolean(id));
        useProposalStore.getState().setNodeIds(ids);
      }
    } catch (e) {
      if (chatController.signal.aborted) return; // 用户主动停止，不报错
      setMessages((m) => [
        ...m,
        { role: "assistant", content: `❌ 网络错误：${(e as Error).message}` },
      ]);
    } finally {
      setBusy(false);
    }
  };

  sendRef.current = send;

  const toggleOp = (index: number) => {
    setSelectedOps((current) => proposal ? toggleOperationSelection(proposal.operations, current, index) : current);
  };

  const closeProposal = (appliedNote?: string[]) => {
    useProposalStore.getState().clear();
    setProposal(null);
    if (appliedNote) {
      setMessages((items) => [...items, { role: "assistant", content: "修改已确认并应用。", applied: appliedNote }]);
    }
  };

  return (
    <div className={docked ? "flex h-full w-full flex-col overflow-hidden bg-white" : "fixed bottom-4 right-4 z-50 flex h-[560px] w-96 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl"}>
      {/* 头部 */}
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-gray-100 bg-[#fbfbfa] px-3 text-gray-900">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="grid h-6 w-6 place-items-center rounded-md brand-gradient text-white shadow-sm"><Sparkles size={13} /></span>
          <span>AI 设计会话</span>
          <span className={`h-1.5 w-1.5 rounded-full ${aiConfigured ? "bg-emerald-500" : "bg-amber-400"}`} title={aiConfigured ? "已接入" : "未配置"} />
        </div>
        {!docked && <button className="p-1 rounded text-gray-400 hover:bg-gray-100" onClick={onClose}><X size={15} /></button>}
      </div>

      {/* 消息列表 */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="anim-slide-up mx-auto mt-16 w-full max-w-md px-6 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl brand-gradient text-white shadow-lg"><Sparkles size={20} /></span>
            <h1 className="mt-5 text-xl font-semibold text-gray-900">从想法开始设计</h1>
            <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-gray-500">描述产品、页面或交互流程。AI 先生成可审核的雏形，你可以随时在右侧画布接管细节。</p>
            <div className="mt-5 flex justify-center gap-2">
              <button className="card-lift inline-flex h-9 items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 shadow-sm hover:border-indigo-300" onClick={onCreateCanvas}><LayoutTemplate size={14} /> 新建空白项目</button>
              <button className="btn-brand inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-xs font-medium text-white" onClick={() => send("请为我创建一个完整、响应式、可继续编辑的产品雏形，包含首页、核心功能页和清晰的页面流程。")}><Wand2 size={14} /> AI 生成雏形</button>
            </div>
            <p className="mt-4 text-[10px] text-gray-400">AI 的每次修改都会先展示变更清单，确认后才应用。</p>
            {/* 示例开场白：解决冷启动不知道说什么 */}
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {["做个 SaaS 落地页", "做个关于 AI 产品的 PPT", "生成一个定价卡片", "做个暗色数据看板", "帮我做个登录页"].map((example) => (
                <button
                  key={example}
                  className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[10px] text-gray-500 transition-colors hover:border-indigo-300 hover:text-indigo-600"
                  onClick={() => send(example)}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                <Bot size={13} className="text-indigo-600" />
              </div>
            )}
            <div
              className={`${m.estheticPack || m.plan ? "max-w-[88%]" : "max-w-[75%]"} rounded-lg px-3 py-2 text-xs leading-relaxed ${
                m.role === "user"
                  ? "bg-gray-950 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              <div className="whitespace-pre-wrap">{m.content}</div>

              {/* 审美子技能选择卡片：实时微缩预览（用 Theme token 真画出来的迷你落地页） */}
              {m.estheticPack && (
                <div className="component-scrollbar mt-2 grid max-h-[420px] grid-cols-2 gap-1.5 overflow-y-auto pr-0.5">
                  {estheticsFor(m.estheticPack).map((theme) => {
                    const picked = m.estheticDone === theme.name;
                    const locked = !!m.estheticDone && !picked;
                    return (
                      <button
                        key={theme.id}
                        disabled={!!m.estheticDone}
                        className={`group flex flex-col overflow-hidden rounded-lg border text-left transition-all duration-150 ${picked ? "border-indigo-400 bg-white shadow-md" : locked ? "border-gray-100 opacity-40" : "border-gray-200 bg-white hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"}`}
                        onClick={() => pickEsthetic(i, theme)}
                        title={`${theme.tagline}（点击选择）`}
                      >
                        {/* 微缩预览：背景 + 标题条 + 胶囊按钮 + hero 视觉 */}
                        <span
                          className="relative block h-[72px] w-full shrink-0 overflow-hidden transition-transform duration-200 group-hover:scale-[1.04]"
                          style={{ background: theme.gradFrom ? `linear-gradient(150deg, ${theme.gradFrom}, ${theme.gradTo})` : theme.bg }}
                        >
                          {/* 迷你导航 */}
                          <span className="absolute left-2 top-1.5 h-1 w-4 rounded-full" style={{ background: theme.text, opacity: 0.85 }} />
                          <span className="absolute right-2 top-1.5 h-1.5 w-4 rounded-full" style={{ background: theme.accent }} />
                          {/* 迷你标题 */}
                          <span className="absolute left-1/2 top-5 h-[5px] w-16 -translate-x-1/2 rounded-full" style={{ background: theme.text, opacity: 0.92 }} />
                          <span className="absolute left-1/2 top-[26px] h-[3px] w-10 -translate-x-1/2 rounded-full" style={{ background: theme.subtext, opacity: 0.7 }} />
                          {/* 迷你 CTA 胶囊 */}
                          <span className="absolute left-1/2 top-[34px] h-2.5 w-7 -translate-x-1/2 rounded-full" style={{ background: theme.accent }} />
                          {/* hero 视觉 */}
                          {theme.hero === "orb" ? (
                            <span className="absolute bottom-1 left-1/2 h-7 w-7 -translate-x-1/2 rounded-full" style={{ background: `radial-gradient(circle at 32% 28%, rgba(255,255,255,0.85), ${theme.accent} 55%, ${theme.accent2})` }} />
                          ) : theme.hero === "none" ? (
                            <span className="absolute bottom-2 left-1/2 h-[2px] w-14 -translate-x-1/2 rounded-full" style={{ background: theme.surfaceBorder }} />
                          ) : (
                            <span className="absolute bottom-0.5 left-1/2 h-5 w-20 -translate-x-1/2 rounded-sm" style={{ background: theme.surface, border: `1px solid ${theme.surfaceBorder}`, boxShadow: `inset 0 0 0 2px ${theme.surface}, inset 0 0 12px ${theme.accent}33` }} />
                          )}
                        </span>
                        <span className="flex items-center gap-1.5 px-2 py-1.5">
                          <span className="h-3.5 w-3.5 shrink-0 rounded-full ring-1 ring-black/5" style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})` }} />
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1 text-[11px] font-semibold text-gray-800">{picked && <Check size={10} className="text-indigo-500" />}{theme.name}</span>
                            <span className="block truncate text-[9px] text-gray-400">{theme.inspiredBy}</span>
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 执行计划卡片 */}
              {m.plan && (
                <div className="mt-2 overflow-hidden rounded-md border border-indigo-100 bg-white">
                  <div className="flex items-center gap-1.5 border-b border-indigo-50 bg-indigo-50/50 px-2.5 py-1.5 text-[10px] font-semibold text-indigo-700">
                    {m.planThinking ? <Loader2 size={11} className="animate-spin" /> : <Wand2 size={11} />}
                    {m.plan.pack.name}{m.plan.esthetic ? ` · ${m.plan.esthetic.name}` : ""}
                    <span className={`ml-auto rounded-full px-1.5 py-px text-[9px] font-medium ${m.planThinking ? "bg-indigo-100 text-indigo-500" : m.plan.aiPlanned ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}>
                      {m.planThinking ? "AI 制定中…" : m.plan.aiPlanned ? "AI 计划" : "AI 不可用"}
                    </span>
                  </div>
                  {m.planThinking ? (
                    <div className="space-y-1.5 px-2.5 py-2.5">
                      {[70, 88, 60].map((width, rowIndex) => (
                        <div key={rowIndex} className="flex animate-pulse items-center gap-1.5" style={{ animationDelay: `${rowIndex * 150}ms` }}>
                          <span className="h-3.5 w-3.5 rounded-full bg-indigo-100" />
                          <span className="h-2 rounded-full bg-gray-100" style={{ width: `${width}%` }} />
                        </div>
                      ))}
                      <div className="pt-0.5 text-[9px] text-indigo-400">AI 正在结合你的需求与审美方向构思步骤…</div>
                    </div>
                  ) : m.planAiFailed ? (
                    <div className="px-2.5 py-2 text-[10px] leading-4 text-amber-600">技能生成需要 AI 引擎。请点击聊天框底部的 AI 引擎状态条配置 API Key 后重新发起；未接入 AI 时仅支持在画布上手动设计。</div>
                  ) : (
                  <div className="space-y-1 px-2.5 py-2">
                    {m.plan.steps.map((step, stepIndex) => {
                      const running = !m.planDone && m.planProgress === stepIndex;
                      const finished = !!m.planDone || (m.planProgress !== undefined && stepIndex < m.planProgress);
                      return (
                        <div key={stepIndex} className={`flex items-center gap-1.5 text-[10px] transition-colors ${finished ? "text-gray-700" : running ? "text-indigo-600 font-medium" : "text-gray-400"}`}>
                          <span className={`grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full text-[8px] font-bold ${finished ? "bg-emerald-100 text-emerald-600" : running ? "bg-indigo-100 text-indigo-600" : "bg-gray-100 text-gray-400"}`}>
                            {finished ? <Check size={8} /> : running ? <Loader2 size={8} className="animate-spin" /> : stepIndex + 1}
                          </span>
                          {step}
                        </div>
                      );
                    })}
                  </div>
                  )}
                  {m.planDone ? (
                    <div className="flex items-center gap-1.5 border-t border-emerald-100 bg-emerald-50/60 px-2.5 py-1.5 text-[10px] font-medium text-emerald-700">
                      <Check size={11} /> <span className="min-w-0 flex-1 truncate">{m.planDone}</span>
                      {m.snapshotPageId && (
                        <button
                          className="shrink-0 rounded border border-emerald-200 bg-white px-1.5 py-0.5 text-[9px] text-emerald-600 transition-colors hover:bg-emerald-100"
                          title="回退到这次生成前的版本"
                          onClick={() => {
                            if (restoreLatestSnapshot(m.snapshotPageId!)) {
                              toast.success("已回退到上一版");
                              dispatchFocusActivePage();
                            } else {
                              toast.error("没有可回退的版本");
                            }
                          }}
                        >
                          回到上一版
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-1.5 border-t border-gray-100 px-2 py-1.5">
                      {(m.planThinking || m.planProgress !== undefined) && (
                        <button className="inline-flex h-6 items-center gap-1 rounded border border-rose-200 px-2 text-[10px] font-medium text-rose-500 hover:bg-rose-50" onClick={stopAll}><Square size={9} /> 停止</button>
                      )}
                      <button className="h-6 rounded px-2 text-[10px] text-gray-500 hover:bg-gray-50 disabled:opacity-40" disabled={m.planProgress !== undefined || m.planThinking} onClick={() => { patchMsg(i, { plan: undefined }); setMessages((items) => [...items, { role: "assistant", content: "好的，重新选个审美方向：", estheticPack: m.plan!.pack }]); flowRef.current = { pack: m.plan!.pack, input: "" }; }}>换个审美</button>
                      <button className="btn-brand inline-flex h-6 items-center gap-1 rounded px-2.5 text-[10px] font-semibold text-white disabled:opacity-60" disabled={m.planProgress !== undefined || m.planThinking || m.planAiFailed} onClick={() => runPlan(i)}>{m.planProgress !== undefined ? <><Loader2 size={10} className="animate-spin" /> 执行中</> : m.planAiFailed ? "需接入 AI" : <><Play size={10} /> 开始执行</>}</button>
                    </div>
                  )}
                </div>
              )}

              {m.applied && m.applied.length > 0 && (
                <div className="mt-1.5 pt-1.5 border-t border-gray-200 space-y-0.5">
                  {m.applied.map((a, j) => (
                    <div key={j} className="text-[10px] text-gray-500 flex items-center gap-1">
                      <span className="text-green-500">✓</span> {a}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {m.role === "user" && (
              <div className="w-6 h-6 rounded-full brand-gradient flex items-center justify-center shrink-0">
                <User size={13} className="text-white" />
              </div>
            )}
          </div>
        ))}
        {busy && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
              <Bot size={13} className="text-indigo-600" />
            </div>
            <div className="bg-gray-100 rounded-lg px-3 py-2 text-xs text-gray-500 flex items-center gap-2">
              <Loader2 size={13} className="animate-spin" /> AI 正在思考…
              <button className="inline-flex items-center gap-1 rounded bg-gray-200 px-1.5 py-0.5 text-[10px] text-gray-600 hover:bg-gray-300" onClick={stopAll}><Square size={9} /> 停止</button>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {proposal && (
        <div className="shrink-0 border-t border-indigo-100 bg-indigo-50/70 px-3 py-2">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-indigo-700">待审核变更 · 已选 {selectedOps.size}/{proposal.operations.length} 项</span>
            <span className="text-[10px] text-indigo-400">尚未修改画布</span>
          </div>
          <div className="max-h-28 space-y-1 overflow-y-auto rounded border border-indigo-100 bg-white p-2">
            {proposal.operations.map((operation, index) => (
              <label key={index} className="flex cursor-pointer items-start gap-1.5 text-[10px] text-gray-600">
                <input
                  type="checkbox"
                  className="mt-0.5 h-3 w-3 shrink-0 accent-indigo-600"
                  checked={selectedOps.has(index)}
                  onChange={() => toggleOp(index)}
                />
                <span className={`mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full ${operation.op.startsWith("remove") ? "bg-red-400" : operation.op.startsWith("add") ? "bg-emerald-400" : "bg-amber-400"}`} />
                <span className={selectedOps.has(index) ? "" : "line-through opacity-50"}>{describeOperation(operation)}</span>
              </label>
            ))}
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <button className="h-7 rounded px-2.5 text-[11px] text-gray-600 hover:bg-white" onClick={() => { closeProposal(); setMessages((items) => [...items, { role: "assistant", content: "已取消这次修改，画布未发生变化。" }]); }}>取消</button>
            <button
              className="h-7 rounded bg-indigo-600 px-3 text-[11px] font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
              disabled={selectedOps.size === 0}
              onClick={() => {
                const chosen = proposal.operations.filter((_, index) => selectedOps.has(index));
                const applied = executeOperations(chosen);
                const failed = applied.some((item) => item.startsWith("⚠️"));
                if (failed) toast.error(applied[0] ?? "修改未应用");
                else {
                  toast.success(`已应用 ${applied.length} 项修改`);
                  void triggerAutomations("ai_complete", useWorkspaceStore.getState().activePageId ?? undefined);
                }
                closeProposal(applied);
                // 聚焦到活动页面，让变更可见
                openStudio();
                setTimeout(() => dispatchFocusActivePage(), 150);
              }}
            >
              应用 {selectedOps.size} 项修改
            </button>
          </div>
        </div>
      )}

      {!proposal && aiChange && (
        <div className="flex shrink-0 items-center gap-2 border-t border-amber-100 bg-amber-50/80 px-3 py-2">
          <div className="min-w-0 flex-1"><div className="text-[11px] font-semibold text-amber-800">本次 AI 修改已应用</div><div className="truncate text-[10px] text-amber-600">影响 {aiChange.changedPageIds.length} 个页面 · {aiChange.results.length} 项操作</div></div>
          <button className="inline-flex h-7 items-center gap-1 rounded border border-amber-200 bg-white px-2 text-[10px] text-amber-700 hover:bg-amber-100" onClick={openAiDiff}><ArrowLeftRight size={11} /> 对比</button>
          <button className="inline-flex h-7 items-center gap-1 rounded border border-amber-200 bg-white px-2 text-[10px] text-amber-700 hover:bg-amber-100" onClick={() => { const result = undoLastAiChange(); result.ok ? toast.success("已撤销本次 AI 修改") : toast.error(result.reason ?? "无法撤销"); }}><RotateCcw size={11} /> 撤销本次</button>
        </div>
      )}

      {/* 输入区 */}
      <div className="p-3 border-t border-gray-100 shrink-0 space-y-2">
        {/* 选中元素提示：聊天框即入口，选中后直接说“把这个…” */}
        {selLabel && (
          <div className="flex items-center gap-1.5 text-[10px]">
            <span className="anim-fade-in inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 font-medium text-indigo-600">
              <MousePointer2 size={10} /> AI 可见 · {selLabel}
              <button className="ml-0.5 text-indigo-300 transition-colors hover:text-indigo-600" onClick={clearSelection} title="取消选中"><X size={9} /></button>
            </span>
            <span className="text-gray-400">直接说「把它改大一点」就能懂</span>
          </div>
        )}
        {/* 快捷指令 */}
        <div className="flex gap-1.5 flex-wrap">
          {QUICK_ACTIONS.map((qa) => (
            <button
              key={qa.label}
              className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full border border-indigo-100 bg-indigo-50/60 text-indigo-600 text-[11px] font-medium hover:bg-indigo-100 hover:border-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              onClick={() => send(qa.prompt)}
              disabled={busy || !!proposal}
              title={qa.label}
            >
              <qa.icon size={12} />
              {qa.label}
            </button>
          ))}
        </div>
        {/* 参考图附件条：图转 3D / 融图设计 */}
        {attachment && (
          <div className="anim-fade-in flex items-center gap-2 rounded-md border border-violet-200 bg-violet-50 px-2 py-1.5">
            <Image src={attachment} width={32} height={32} unoptimized className="h-8 w-8 shrink-0 rounded object-cover" alt="参考图" />
            <span className="min-w-0 flex-1 text-[10px] leading-4 text-violet-600">参考图就绪：说「转成 3D」调用图转 3D 技能；提其他需求时 AI 会把图融入设计</span>
            <button className="shrink-0 text-violet-300 transition-colors hover:text-violet-600" onClick={() => setAttachment(null)} title="移除参考图"><X size={11} /></button>
          </div>
        )}
        {/* 文件附件条：一切有文字的格式都可作为设计参考 */}
        {parsing && (
          <div className="anim-fade-in flex items-center gap-2 rounded-md border border-sky-200 bg-sky-50 px-2 py-1.5">
            <Loader2 size={14} className="shrink-0 animate-spin text-sky-500" />
            <span className="min-w-0 flex-1 truncate text-[10px] text-sky-600">正在解析文件提取文字…</span>
          </div>
        )}
        {fileAtt && (
          <div className="anim-fade-in flex items-center gap-2 rounded-md border border-sky-200 bg-sky-50 px-2 py-1.5">
            <FileText size={16} className="shrink-0 text-sky-500" />
            <span className="min-w-0 flex-1 truncate text-[10px] text-sky-600">资料《{fileAtt.name}》就绪，AI 会据此填充真实内容</span>
            <button className="shrink-0 text-sky-300 transition-colors hover:text-sky-600" onClick={() => setFileAtt(null)} title="移除文件"><X size={11} /></button>
          </div>
        )}
        <div className="flex gap-2">
          <button
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-gray-200 text-gray-400 transition-colors hover:border-violet-300 hover:text-violet-600"
            title="上传参考图：图转 3D 或让 AI 把图融入设计"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus size={15} />
          </button>
          <input ref={fileInputRef} type="file" accept="image/*,.md,.markdown,.txt,.json,.html,.htm,.csv,.yaml,.yml,.docx,.pptx,.pdf" className="hidden" onChange={(e) => { onPickImage(e.target.files?.[0]); e.target.value = ""; }} />
          <input
            className="flex-1 h-9 rounded-lg border border-gray-200 bg-gray-50/60 px-3 text-xs placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
            placeholder={selLabel ? "对选中元素说：把它改大一点 / 换个颜色…" : "描述你想修改或创建的内容…"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            disabled={busy || !!proposal}
          />
          <button
            className="w-9 h-9 rounded-lg btn-brand text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none shrink-0"
            onClick={() => send()}
            disabled={busy || !!proposal || !input.trim()}
            title="发送"
          >
            <Send size={15} />
          </button>
        </div>
        {/* AI Agent：全局唯一配置入口 */}
        <div className="border-t border-gray-100 pt-1.5">
          <button
            className="mx-auto flex items-center gap-1.5 rounded px-2 py-0.5 text-[10px] text-gray-400 transition-colors hover:text-indigo-600"
            onClick={onOpenAiAgent}
            title="打开 AI Agent 配置"
          >
            <span className={`h-1.5 w-1.5 rounded-full ${aiConfigured ? "bg-emerald-500" : "bg-amber-400"}`} />
            {aiConfigured ? "AI Agent 已接入" : "AI Agent 未配置 · 点击接入"}
          </button>
        </div>
      </div>
    </div>
  );
}
