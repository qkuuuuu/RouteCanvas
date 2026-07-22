import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/import — 从 URL 导入组件
 *
 * 请求体: { url: string }
 *
 * 逻辑:
 * - 如果 URL 以 .tsx/.jsx 结尾 → 获取源码，作为 runtime 组件返回
 * - 否则 → 获取 HTML，提取 <style> 中的 CSS 和 body 中的 HTML 结构
 *
 * 返回: { type: "runtime" | "css", tsxSource?, html?, css? }
 */
export async function POST(req: NextRequest) {
  try {
    const { url } = (await req.json()) as { url?: string };
    if (!url || !url.startsWith("http")) {
      return NextResponse.json({ error: "请输入有效的 URL" }, { status: 400 });
    }

    const resp = await fetch(url, {
      headers: { "User-Agent": "RouteCanvas/1.0" },
      signal: AbortSignal.timeout(15000),
    });

    if (!resp.ok) {
      return NextResponse.json({ error: `获取失败: HTTP ${resp.status}` }, { status: 400 });
    }

    const text = await resp.text();

    // TSX/JSX 文件
    if (/\.(tsx|jsx)$/i.test(url)) {
      return NextResponse.json({ type: "runtime", tsxSource: text });
    }

    // HTML 页面 → 提取 style + body 内容
    const styleMatches = [...text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)];
    const css = styleMatches.map((m) => m[1]).join("\n").trim();

    // 提取 body 内容
    let html = "";
    const bodyMatch = text.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      html = bodyMatch[1].trim();
    } else {
      // 没有 body 标签，尝试取整个 HTML（去除 head/style/script）
      html = text
        .replace(/<head[\s\S]*?<\/head>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<\/?html[^>]*>/gi, "")
        .replace(/<\/?body[^>]*>/gi, "")
        .trim();
    }

    // 移除 script 标签
    html = html.replace(/<script[\s\S]*?<\/script>/gi, "").trim();

    if (!html && !css) {
      return NextResponse.json({ error: "未能从页面中提取到有效的 HTML/CSS 内容" }, { status: 400 });
    }

    return NextResponse.json({ type: "css", html, css });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "未知错误";
    return NextResponse.json({ error: `导入失败: ${msg}` }, { status: 500 });
  }
}
