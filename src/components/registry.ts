import type { ComponentDef } from "@/types/schema";
import { BUILTIN_DEFS } from "./builtin";
import { PACK_DEFS } from "./packs";

export { BUILTIN_DEFS, PACK_DEFS };

/* ---------- 缓存层：避免每次调用都重建 Map ---------- */
let cachedMap: Map<string, ComponentDef> | null = null;
let cachedSource: ComponentDef[] | null = null;

/**
 * builtin > pack > store(runtime/css)
 * builtin 和 pack 为编译期常量（覆盖同名 store 项），store 项来自用户导入/运行时注册。
 */
export function getMergedRegistry(
  storeRegistry: ComponentDef[],
): ComponentDef[] {
  // 如果 storeRegistry 引用未变，直接返回缓存
  if (cachedMap && cachedSource === storeRegistry) {
    return [...cachedMap.values()];
  }
  const map = new Map<string, ComponentDef>();
  for (const d of storeRegistry) map.set(d.id, d);
  for (const d of PACK_DEFS) map.set(d.id, d);
  for (const d of BUILTIN_DEFS) map.set(d.id, d);
  cachedMap = map;
  cachedSource = storeRegistry;
  return [...map.values()];
}

/** O(1) 查找组件定义（带缓存） */
export function findComponentDef(
  storeRegistry: ComponentDef[],
  id: string,
): ComponentDef | undefined {
  // 确保缓存是最新的
  if (!cachedMap || cachedSource !== storeRegistry) {
    getMergedRegistry(storeRegistry);
  }
  return cachedMap!.get(id);
}
