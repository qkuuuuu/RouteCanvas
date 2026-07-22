// 带前缀的短 id 生成器：page_ / node_ / trans_
// 优先用 crypto.randomUUID 截短，无则回退时间戳+随机数。

const PREFIXES = ["page", "node", "trans", "canvas"] as const;
export type IdPrefix = (typeof PREFIXES)[number];

function rand(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 10);
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function genId(prefix: IdPrefix): string {
  return `${prefix}_${rand()}`;
}

export function isPageId(id: string): boolean {
  return id.startsWith("page_");
}
export function isNodeId(id: string): boolean {
  return id.startsWith("node_");
}
export function isTransId(id: string): boolean {
  return id.startsWith("trans_");
}
