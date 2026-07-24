"use client";
/**
 * AI Chat 面板 — 对话式画布共编
 * 用户输入自然语言指令 → AI 返回结构化 operations → 实时应用到画布。
 */
import * as React from "react";
import { Bot, Send, Settings, Sparkles, User, X, Loader2, Wand2, LayoutTemplate, LogIn } from "lucide-react";
import { useCanvasStore } from "@/store/canvasStore";
import { buildChatMessages } from "@/data/chatPrompt";
import { executeOperations, parseAiResponse } from "@/data/chatOps";
import { toast } from "@/lib/toast";

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

export function ChatPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [messages, setMessages] = React.useState<ChatMsg[]>([]);
  const [input, setInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [apiKey, setApiKey] = React.useState("");
  const [showSettings, setShowSettings] = React.useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const saved = localStorage.getItem("routecanvas-openai-key");
    if (saved) setApiKey(saved);
  }, []);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  if (!open) return null;

  const send = async (override?: string) => {
    const instruction = (override ?? input).trim();
    if (!instruction || busy) return;
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

      const resp = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: reqMessages, apiKey: apiKey || undefined }),
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

      // 执行操作 → 画布实时更新
      let applied: string[] = [];
      if (parsed.operations && parsed.operations.length > 0) {
        applied = executeOperations(parsed.operations);
        toast.success(`已应用 ${applied.length} 项修改`);
      }

      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: parsed.reply || "已完成修改",
          applied,
        },
      ]);
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
    <div className="fixed right-4 bottom-4 z-50 w-96 h-[560px] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden">
      {/* 头部 */}
      <div className="h-11 shrink-0 px-3 flex items-center justify-between bg-gradient-to-r from-indigo-500 to-pink-500 text-white">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles size={15} /> AI 设计助手
        </div>
        <div className="flex items-center gap-1">
          <button
            className="p-1 rounded hover:bg-white/20"
            onClick={() => setShowSettings((v) => !v)}
            title="API Key 设置"
          >
            <Settings size={14} />
          </button>
          <button className="p-1 rounded hover:bg-white/20" onClick={onClose}>
            <X size={15} />
          </button>
        </div>
      </div>

      {/* 设置 */}
      {showSettings && (
        <div className="px-3 py-2 border-b bg-gray-50 shrink-0">
          <label className="text-[10px] text-gray-500 block mb-1">OpenAI API Key（存本地浏览器）</label>
          <div className="flex gap-2">
            <input
              type="password"
              className="flex-1 h-7 rounded border border-gray-300 px-2 text-xs font-mono"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <button
              className="px-2 py-1 rounded text-xs bg-indigo-500 text-white hover:bg-indigo-600"
              onClick={() => {
                localStorage.setItem("routecanvas-openai-key", apiKey);
                toast.success("API Key 已保存");
              }}
            >
              保存
            </button>
          </div>
        </div>
      )}

      {/* 消息列表 */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 text-xs mt-8 space-y-2">
            <Bot size={28} className="mx-auto text-indigo-300" />
            <p>描述你想要的页面，我来帮你设计。</p>
            <p className="text-[10px]">例如：&quot;做一个登录页，有用户名、密码输入框和登录按钮&quot;</p>
            <p className="text-[10px] text-indigo-400">也可以直接点下方「美化当前页面」一键提升颜值</p>
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
                  ? "bg-indigo-500 text-white"
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
              <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                <User size={13} className="text-indigo-600" />
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

      {/* 输入区 */}
      <div className="p-3 border-t border-gray-100 shrink-0 space-y-2">
        {/* 快捷指令 */}
        <div className="flex gap-1.5 flex-wrap">
          {QUICK_ACTIONS.map((qa) => (
            <button
              key={qa.label}
              className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full border border-indigo-100 bg-indigo-50/60 text-indigo-600 text-[11px] font-medium hover:bg-indigo-100 hover:border-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              onClick={() => send(qa.prompt)}
              disabled={busy}
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
            disabled={busy}
          />
          <button
            className="w-9 h-9 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none shrink-0 transition-shadow"
            onClick={() => send()}
            disabled={busy || !input.trim()}
            title="发送"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
