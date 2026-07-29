import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/ai — 代理 AI 请求到 OpenAI
 *
 * 请求体:
 *   { prompt: string, model?: string, apiKey?: string }
 *
 * API Key 来源（优先级）:
 *   1. 请求体 apiKey（前端用户在全局 AI Agent 中输入，存 localStorage）
 *   2. 服务端环境变量 OPENAI_API_KEY（部署方预设，可选）
 *
 * 两种方式都不在前端暴露服务端密钥；
 * 用户自带 key 时直接透传，部署方密钥仅在服务端使用。
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, model, apiKey: userKey, baseUrl } = body as {
      prompt?: string;
      model?: string;
      apiKey?: string;
      baseUrl?: string;
    };

    if (!prompt) {
      return NextResponse.json(
        { error: "Missing required field: prompt" },
        { status: 400 },
      );
    }

    // 优先使用用户传入的 key，其次使用环境变量
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
        messages: [
          {
            role: "system",
            content:
              "你是一位资深前端工程师，擅长 React/Next.js/Tailwind CSS。根据用户的 JSON 描述生成完整可运行的多页面应用代码。",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
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
