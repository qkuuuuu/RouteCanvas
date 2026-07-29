export interface AiSettings {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export const AI_SETTINGS_EVENT = "routecanvas-ai-settings-change";

export const DEFAULT_AI_SETTINGS: AiSettings = {
  apiKey: "",
  baseUrl: "https://api.openai.com/v1",
  model: "gpt-4o-mini",
};

export function getAiSettings(): AiSettings {
  if (typeof window === "undefined") return DEFAULT_AI_SETTINGS;
  return {
    apiKey: localStorage.getItem("routecanvas-openai-key") ?? "",
    baseUrl: localStorage.getItem("routecanvas-openai-base-url") ?? DEFAULT_AI_SETTINGS.baseUrl,
    model: localStorage.getItem("routecanvas-openai-model") ?? DEFAULT_AI_SETTINGS.model,
  };
}

export function saveAiSettings(settings: AiSettings) {
  localStorage.setItem("routecanvas-openai-key", settings.apiKey.trim());
  localStorage.setItem("routecanvas-openai-base-url", settings.baseUrl.trim() || DEFAULT_AI_SETTINGS.baseUrl);
  localStorage.setItem("routecanvas-openai-model", settings.model.trim() || DEFAULT_AI_SETTINGS.model);
  window.dispatchEvent(new CustomEvent(AI_SETTINGS_EVENT, { detail: settings }));
}
