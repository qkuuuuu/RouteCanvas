import { NextRequest, NextResponse } from "next/server";
import { resolveAiEndpoint } from "@/lib/aiEndpoint";

/**
 * POST /api/ai/chat — AI 对话式画布编辑
 *
 * 请求体:
 *   { messages: [{role, content}], model?: string, apiKey?: string }
 *
 * API Key 策略：用户在全局 AI Agent 中配置的 key 优先，其次环境变量。
 * AI 被约束为返回结构化 operations JSON，由前端解析并应用到画布。
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, model, apiKey: userKey, baseUrl, creativity } = body as {
      messages?: { role: string; content: unknown }[];
      model?: string;
      apiKey?: string;
      baseUrl?: string;
      /** 创意温度 0-1：设计排版类调用传高值释放想象力，结构化修改保持低值 */
      creativity?: number;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Missing required field: messages" },
        { status: 400 },
      );
    }

    const apiKey = userKey?.trim() || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "未配置 API Key。请在顶部“AI Agent”中配置 OpenAI API Key，或由部署方设置 OPENAI_API_KEY 环境变量。",
        },
        { status: 503 },
      );
    }

    let parsedEndpoint: URL;
    let officialOpenAi = false;
    try {
      ({ endpoint: parsedEndpoint, officialOpenAi } = resolveAiEndpoint(baseUrl));
    } catch (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 400 });
    }
    if (!(["http:", "https:"] as string[]).includes(parsedEndpoint.protocol)) {
      return NextResponse.json({ error: "API Base URL 仅支持 HTTP 或 HTTPS" }, { status: 400 });
    }

    const resp = await fetch(parsedEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model ?? "gpt-4o-mini",
        messages,
        temperature: typeof creativity === "number" && Number.isFinite(creativity)
          ? Math.min(Math.max(creativity, 0), 1.2)
          : 0.4,
        // 像素级排版 JSON 动辄数千 token：不显式给足上限，网关默认值会截断输出导致解析失败
        max_tokens: 16000,
        ...(officialOpenAi ? { max_completion_tokens: 16000, response_format: { type: "json_object" } } : {}),
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return NextResponse.json(
        { error: `OpenAI API error: ${errText}` },
        { status: resp.status },
      );
    }

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content ?? "";
    return NextResponse.json({ content });
  } catch (e) {
    return NextResponse.json(
      { error: `AI request failed: ${(e as Error).message}` },
      { status: 500 },
    );
  }
}
