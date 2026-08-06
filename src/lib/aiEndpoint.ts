/** 服务端 AI 端点校验，避免 Base URL 被滥用为内网代理。 */
export function resolveAiEndpoint(baseUrl?: string): { endpoint: URL; officialOpenAi: boolean } {
  const raw = (baseUrl?.trim() || "https://api.openai.com/v1").replace(/\/$/, "");
  const endpoint = new URL(raw.endsWith("/chat/completions") ? raw : `${raw}/chat/completions`);
  if (endpoint.protocol !== "http:" && endpoint.protocol !== "https:") throw new Error("API Base URL 仅支持 HTTP 或 HTTPS");

  const hostname = endpoint.hostname.toLowerCase().replace(/[\[\]]/g, "");
  const localAllowed = process.env.ROUTECANVAS_ALLOW_LOCAL_AI === "true";
  const isPrivate = hostname === "localhost" || hostname.endsWith(".local") || hostname === "0.0.0.0" || hostname === "::1" ||
    /^127\./.test(hostname) || /^10\./.test(hostname) || /^192\.168\./.test(hostname) ||
    /^169\.254\./.test(hostname) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname);
  if (isPrivate && !localAllowed) throw new Error("为防止内网请求，默认不允许 localhost 或私网 Base URL；开发本地模型时请设置 ROUTECANVAS_ALLOW_LOCAL_AI=true");

  return { endpoint, officialOpenAi: hostname === "api.openai.com" };
}
