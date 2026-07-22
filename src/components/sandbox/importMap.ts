/**
 * Tier2 运行时沙箱的 esm.sh import map。
 * 运行时组件源码中的 bare import 会被重写为这些 URL，
 * 使 babel 转译后的 blob 模块能通过浏览器原生 ESM 加载。
 */
export const IMPORT_MAP: Record<string, string> = {
  react: "https://esm.sh/react@18.3.1",
  "react/jsx-runtime": "https://esm.sh/react@18.3.1/jsx-runtime",
  "react-dom": "https://esm.sh/react-dom@18.3.1",
  "react-dom/client": "https://esm.sh/react-dom@18.3.1/client",
  "framer-motion": "https://esm.sh/framer-motion@11.3.24?external=react,react-dom",
  motion: "https://esm.sh/framer-motion@11.3.24?external=react,react-dom",
  clsx: "https://esm.sh/clsx@2.1.1",
  "tailwind-merge": "https://esm.sh/tailwind-merge@2.5.2",
  "lucide-react": "https://esm.sh/lucide-react@0.428.0?external=react",
  "class-variance-authority":
    "https://esm.sh/class-variance-authority@0.7.0",
  "@radix-ui/react-slot": "https://esm.sh/@radix-ui/react-slot@1.1.0?external=react",
};

/**
 * 将源码中的 bare import specifiers 重写为 esm.sh URL。
 * 匹配 from "spec"、import "spec"、export ... from "spec" 等模式。
 */
export function rewriteImports(code: string): string {
  let out = code;
  for (const [spec, url] of Object.entries(IMPORT_MAP)) {
    // 精确匹配 bare specifier（避免匹配子路径如 "react/foo"）
    const re = new RegExp(
      `(["'])${escapeRegExp(spec)}(["'])`,
      "g",
    );
    out = out.replace(re, (m, q1, q2) => `"${url}"`);
  }
  return out;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
