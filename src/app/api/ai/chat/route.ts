import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/ai/chat — AI 对话式画布编辑
 *
 * 请求体:
 *   { messages: [{role, content}], model?: string, apiKey?: string }
 *
 * 与 /api/ai 共用 API Key 策略（用户 key 优先，其次环境变量）。
 * AI 被约束为返回结构化 operations JSON，由前端解析并应用到画布。
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, model, apiKey: userKey, baseUrl } = body as {
      messages?: { role: string; content: unknown }[];
      model?: string;
      apiKey?: string;
      baseUrl?: string;
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

    const apiBase = (baseUrl?.trim() || "https://api.openai.com/v1").replace(/\/$/, "");
    const endpoint = apiBase.endsWith("/chat/completions") ? apiBase : `${apiBase}/chat/completions`;
    const parsedEndpoint = new URL(endpoint);
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
        temperature: 0.4,
        response_format: { type: "json_object" },
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
