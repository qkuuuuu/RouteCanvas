import type { Page, Transition } from "@/types/schema";

/** 从 transitions 构建「节点 id → 出向连线」路由图 */
export function buildRouteMap(
  transitions: Transition[],
): Map<string, Transition[]> {
  const m = new Map<string, Transition[]>();
  for (const t of transitions) {
    const arr = m.get(t.source.nodeId) ?? [];
    arr.push(t);
    m.set(t.source.nodeId, arr);
  }
  return m;
}

/** 找到入口页（isIndex），否则第一个页面 */
export function findEntry(pages: Page[]): Page | undefined {
  return pages.find((p) => p.route.isIndex) ?? pages[0];
}

/** 用给定值替换 params 中的 ${key} 占位符（无值时保留占位符字面量） */
export function substituteParams(
  params: Record<string, string> | undefined,
  values: Record<string, string>,
): Record<string, string> {
  if (!params) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    out[k] = v.replace(/\$\{(\w+)\}/g, (_, name) => values[name] ?? `\${${name}}`);
  }
  return out;
}
