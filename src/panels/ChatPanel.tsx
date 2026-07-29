"use client";
/**
 * AI Chat 面板 — 对话式画布共编
 * 用户输入自然语言指令 → AI 返回结构化 operations → 实时应用到画布。
 */
import * as React from "react";
import { Bot, Send, Sparkles, User, X, Loader2, Wand2, LayoutTemplate, LogIn } from "lucide-react";
import { useCanvasStore } from "@/store/canvasStore";
import { buildChatMessages } from "@/data/chatPrompt";
import { describeOperation, executeOperations, parseAiResponse, type ChatOp } from "@/data/chatOps";
import { toast } from "@/lib/toast";
import { getAiSettings } from "@/lib/aiSettings";

interface ChatMsg {
  role: "user" | "assistant";
  content: string; // 展示文本
  applied?: string[]; // 已执行的操作摘要
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

export function ChatPanel({ open, onClose, docked = false, onCreateCanvas, onStartProject }: { open: boolean; onClose: () => void; docked?: boolean; onCreateCanvas?: () => void; onStartProject?: () => void }) {
  const [messages, setMessages] = React.useState<ChatMsg[]>([]);
  const [input, setInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [proposal, setProposal] = React.useState<{ reply: string; operations: ChatOp[] } | null>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  if (!open) return null;

  const send = async (override?: string) => {
    const instruction = (override ?? input).trim();
    if (!instruction || busy) return;
    onStartProject?.();
    setInput("");
    setBusy(true);
    setMessages((m) => [...m, { role: "user", content: instruction }]);

    try {
      // 构建历史（仅保留展示文本，供 AI 理解上下文）
      const history = messages.map((m) => ({
        role: m.role,
        content: m.role === "assistant" ? m.content : m.content,
      }));
      const state = useCanvasStore.getState();
      const reqMessages = buildChatMessages(state, history, instruction);

      const aiSettings = getAiSettings();
      const resp = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: reqMessages, ...aiSettings, apiKey: aiSettings.apiKey || undefined }),
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
      }
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: `❌ 网络错误：${(e as Error).message}` },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={docked ? "flex h-full w-full flex-col overflow-hidden bg-white" : "fixed bottom-4 right-4 z-50 flex h-[560px] w-96 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl"}>
      {/* 头部 */}
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-gray-100 bg-[#fbfbfa] px-3 text-gray-900">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-gray-950 text-white"><Sparkles size={13} /></span>
          <span>AI 设计会话</span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" title="可用" />
        </div>
        {!docked && <button className="p-1 rounded text-gray-400 hover:bg-gray-100" onClick={onClose}><X size={15} /></button>}
      </div>

      {/* 消息列表 */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="mx-auto mt-16 w-full max-w-md px-6 text-center">
            <span className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-gray-950 text-white shadow-sm"><Sparkles size={18} /></span>
            <h1 className="mt-5 text-xl font-semibold text-gray-900">从想法开始设计</h1>
            <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-gray-500">描述产品、页面或交互流程。AI 先生成可审核的雏形，你可以随时在右侧画布接管细节。</p>
            <div className="mt-5 flex justify-center gap-2">
              <button className="inline-flex h-9 items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 shadow-sm hover:border-gray-300 hover:bg-gray-50" onClick={onCreateCanvas}><LayoutTemplate size={14} /> 新建空白项目</button>
              <button className="inline-flex h-9 items-center gap-1.5 rounded-md bg-gray-950 px-3 text-xs font-medium text-white shadow-sm hover:bg-gray-800" onClick={() => send("请为我创建一个完整、响应式、可继续编辑的产品雏形，包含首页、核心功能页和清晰的页面流程。")}><Wand2 size={14} /> AI 生成雏形</button>
            </div>
            <p className="mt-4 text-[10px] text-gray-400">AI 的每次修改都会先展示变更清单，确认后才应用。</p>
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
              className={`max-w-[75%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
                m.role === "user"
                  ? "bg-gray-950 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              <div className="whitespace-pre-wrap">{m.content}</div>
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
              <div className="w-6 h-6 rounded-full bg-gray-900 flex items-center justify-center shrink-0">
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
              <Loader2 size={13} className="animate-spin" /> 正在设计...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {proposal && (
        <div className="shrink-0 border-t border-indigo-100 bg-indigo-50/70 px-3 py-2">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-indigo-700">待审核变更 · {proposal.operations.length} 项</span>
            <span className="text-[10px] text-indigo-400">尚未修改画布</span>
          </div>
          <div className="max-h-28 space-y-1 overflow-y-auto rounded border border-indigo-100 bg-white p-2">
            {proposal.operations.map((operation, index) => (
              <div key={index} className="flex items-start gap-1.5 text-[10px] text-gray-600">
                <span className={`mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full ${operation.op.startsWith("remove") ? "bg-red-400" : operation.op.startsWith("add") ? "bg-emerald-400" : "bg-amber-400"}`} />
                <span>{describeOperation(operation)}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <button className="h-7 rounded px-2.5 text-[11px] text-gray-600 hover:bg-white" onClick={() => { setProposal(null); setMessages((items) => [...items, { role: "assistant", content: "已取消这次修改，画布未发生变化。" }]); }}>取消</button>
            <button className="h-7 rounded bg-indigo-600 px-3 text-[11px] font-medium text-white hover:bg-indigo-700" onClick={() => {
              const applied = executeOperations(proposal.operations);
              setMessages((items) => [...items, { role: "assistant", content: "修改已确认并应用。", applied }]);
              toast.success(`已应用 ${applied.length} 项修改`);
              setProposal(null);
            }}>应用修改</button>
          </div>
        </div>
      )}

      {/* 输入区 */}
      <div className="p-3 border-t border-gray-100 shrink-0 space-y-2">
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
        <div className="flex gap-2">
          <input
            className="flex-1 h-9 rounded-lg border border-gray-200 bg-gray-50/60 px-3 text-xs placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
            placeholder="描述你想修改或创建的内容..."
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
            className="w-9 h-9 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none shrink-0 transition-shadow"
            onClick={() => send()}
            disabled={busy || !!proposal || !input.trim()}
            title="发送"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
