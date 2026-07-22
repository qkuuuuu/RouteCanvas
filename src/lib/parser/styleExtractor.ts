/**
 * 样式提取器：从 getComputedStyle 提取视觉属性 → 映射为富原语 props.custom
 */

/* ===== 颜色工具 ===== */

/** rgb/rgba 字符串 → hex（忽略全透明） */
export function rgbToHex(rgb: string): string {
  const m = rgb.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!m) return "";
  const r = parseInt(m[1], 10);
  const g = parseInt(m[2], 10);
  const b = parseInt(m[3], 10);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/** 提取 rgba 中的 alpha 值 */
export function rgbAlpha(rgb: string): number {
  const m = rgb.match(/rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([\d.]+)/);
  return m ? parseFloat(m[1]) : 1;
}

/** 判断颜色是否为透明/无 */
export function isTransparent(color: string): boolean {
  return (
    !color ||
    color === "transparent" ||
    color === "rgba(0, 0, 0, 0)" ||
    color === "none"
  );
}

/* ===== 背景解析 ===== */

export interface BgInfo {
  bgType: "solid" | "gradient" | "image" | "glass" | "transparent" | "";
  bgColor?: string;
  gradFrom?: string;
  gradTo?: string;
  gradAngle?: number;
  bgImage?: string;
}

/** 解析 background / background-image → BgInfo */
export function parseBackground(
  bg: string,
  bgImage: string,
  backdropFilter: string,
  bgColor: string,
): BgInfo {
  const combined = bg || bgImage || "";

  // 渐变
  const gradMatch = combined.match(
    /linear-gradient\((\d+)?deg?\s*,\s*(.+)\)/i,
  );
  if (gradMatch) {
    const angle = gradMatch[1] ? parseInt(gradMatch[1], 10) : 180;
    const colors = splitGradientColors(gradMatch[2]);
    return {
      bgType: "gradient",
      gradFrom: colors[0] || "#6366f1",
      gradTo: colors[1] || colors[0] || "#ec4899",
      gradAngle: angle,
    };
  }

  // 图片
  const urlMatch = combined.match(/url\(["']?(.+?)["']?\)/);
  if (urlMatch) {
    return { bgType: "image", bgImage: urlMatch[1] };
  }

  // 玻璃拟态：有 backdrop-filter blur + 半透明背景
  if (backdropFilter && backdropFilter.includes("blur")) {
    const alpha = rgbAlpha(bgColor);
    if (alpha < 0.9 && !isTransparent(bgColor)) {
      return { bgType: "glass", bgColor: rgbToHex(bgColor) };
    }
  }

  // 纯色
  if (bgColor && !isTransparent(bgColor)) {
    return { bgType: "solid", bgColor: rgbToHex(bgColor) };
  }

  return { bgType: "" };
}

/** 从渐变颜色列表中拆分出前两个颜色 */
function splitGradientColors(colorStr: string): string[] {
  // 处理 rgb(...) 内逗号干扰：按顶层逗号分割
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of colorStr) {
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    else if (ch === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  if (current.trim()) parts.push(current.trim());
  // 去除百分比 stop
  return parts.map((p) => p.replace(/\s+\d+%$/, "").trim()).slice(0, 2);
}

/* ===== 阴影匹配 ===== */

const SHADOW_LEVELS = [
  { level: "sm", maxBlur: 12 },
  { level: "md", maxBlur: 30 },
  { level: "lg", maxBlur: 50 },
  { level: "xl", maxBlur: Infinity },
];

export interface ShadowInfo {
  shadow: "none" | "sm" | "md" | "lg" | "xl";
  shadowColor?: string;
}

/** 解析 box-shadow → 匹配预设等级 */
export function matchShadow(boxShadow: string): ShadowInfo {
  if (!boxShadow || boxShadow === "none") return { shadow: "none" };

  // 提取 blur 半径（第二个长度值）和颜色
  const m = boxShadow.match(
    /([\d.]+)px\s+([\d.]+)px\s+([\d.]+)px\s+(rgba?\([^)]+\)|#[0-9a-fA-F]{3,8})/,
  );
  if (!m) return { shadow: "none" };

  const blur = parseFloat(m[3]);
  const color = m[4];

  for (const { level, maxBlur } of SHADOW_LEVELS) {
    if (blur <= maxBlur) {
      return {
        shadow: level as ShadowInfo["shadow"],
        shadowColor: color.startsWith("#") ? color : rgbToHex(color),
      };
    }
  }
  return { shadow: "xl", shadowColor: color.startsWith("#") ? color : rgbToHex(color) };
}

/* ===== 边框解析 ===== */

export interface BorderInfo {
  borderWidth: number;
  borderColor: string;
}

export function parseBorder(
  borderWidth: string,
  borderColor: string,
  borderStyle: string,
): BorderInfo | null {
  if (!borderStyle || borderStyle === "none") return null;
  const w = parseFloat(borderWidth);
  if (!w || w <= 0) return null;
  return {
    borderWidth: Math.round(w),
    borderColor: rgbToHex(borderColor),
  };
}

/* ===== 文本样式提取 ===== */

export interface TextStyleInfo {
  fontSize: number;
  fontWeight: number;
  color: string;
  align: string;
  letterSpacing?: number;
  lineHeight?: number;
  italic?: boolean;
  uppercase?: boolean;
  textShadow?: string;
  gradText?: boolean;
  gradFrom?: string;
  gradTo?: string;
}

/** 从 computedStyle 提取文本相关属性 */
export function extractTextStyle(cs: CSSStyleDeclaration): TextStyleInfo {
  const fontSize = parseFloat(cs.fontSize) || 14;
  const fontWeight = parseInt(cs.fontWeight, 10) || 400;
  const color = isTransparent(cs.color) ? "" : rgbToHex(cs.color);
  const align = cs.textAlign || "left";

  const info: TextStyleInfo = { fontSize: Math.round(fontSize), fontWeight, color, align };

  const ls = parseFloat(cs.letterSpacing);
  if (ls && ls !== 0) info.letterSpacing = Math.round(ls * 10) / 10;

  const lh = parseFloat(cs.lineHeight);
  if (lh && !isNaN(lh)) {
    const ratio = lh / fontSize;
    if (Math.abs(ratio - 1.5) > 0.05) info.lineHeight = Math.round(ratio * 100) / 100;
  }

  if (cs.fontStyle === "italic") info.italic = true;
  if (cs.textTransform === "uppercase") info.uppercase = true;

  if (cs.textShadow && cs.textShadow !== "none") info.textShadow = cs.textShadow;

  // 渐变文字检测：color transparent + background-clip: text
  const bgClip = cs.webkitBackgroundClip || cs.backgroundClip || "";
  if (bgClip === "text" && isTransparent(cs.color)) {
    const bg = cs.background || cs.backgroundImage || "";
    const gm = bg.match(/linear-gradient\([^,]*,\s*(.+)/i);
    if (gm) {
      const colors = splitGradientColors(gm[1]);
      info.gradText = true;
      info.gradFrom = colors[0] ? colorToHex(colors[0]) : "#6366f1";
      info.gradTo = colors[1] ? colorToHex(colors[1]) : "#ec4899";
      info.color = "";
    }
  }

  return info;
}

/** 任意颜色格式 → hex */
function colorToHex(c: string): string {
  c = c.trim();
  if (c.startsWith("#")) return c;
  if (c.startsWith("rgb")) return rgbToHex(c);
  return c;
}

/* ===== 容器样式提取 ===== */

export interface ContainerStyleInfo {
  bgType: string;
  bgColor?: string;
  gradFrom?: string;
  gradTo?: string;
  gradAngle?: number;
  bgImage?: string;
  radius?: number;
  padding?: number;
  opacity?: number;
  shadow: string;
  shadowColor?: string;
  borderWidth?: number;
  borderColor?: string;
  blur?: number;
}

/** 从 computedStyle 提取容器相关属性 */
export function extractContainerStyle(cs: CSSStyleDeclaration): ContainerStyleInfo {
  const bgInfo = parseBackground(
    cs.background || "",
    cs.backgroundImage || "",
    cs.backdropFilter || (cs as unknown as Record<string, string>).webkitBackdropFilter || "",
    cs.backgroundColor || "",
  );

  const shadowInfo = matchShadow(cs.boxShadow || "");
  const borderInfo = parseBorder(cs.borderWidth || "", cs.borderColor || "", cs.borderStyle || "");

  const info: ContainerStyleInfo = {
    bgType: bgInfo.bgType,
    shadow: shadowInfo.shadow,
  };

  if (bgInfo.bgColor) info.bgColor = bgInfo.bgColor;
  if (bgInfo.gradFrom) info.gradFrom = bgInfo.gradFrom;
  if (bgInfo.gradTo) info.gradTo = bgInfo.gradTo;
  if (bgInfo.gradAngle != null) info.gradAngle = bgInfo.gradAngle;
  if (bgInfo.bgImage) info.bgImage = bgInfo.bgImage;
  if (shadowInfo.shadowColor) info.shadowColor = shadowInfo.shadowColor;
  if (borderInfo) {
    info.borderWidth = borderInfo.borderWidth;
    info.borderColor = borderInfo.borderColor;
  }

  const radius = parseFloat(cs.borderRadius);
  if (radius > 0) info.radius = Math.round(radius);

  const padding = parseFloat(cs.padding);
  if (padding > 0) info.padding = Math.round(padding);

  const opacity = parseFloat(cs.opacity);
  if (opacity < 1) info.opacity = Math.round(opacity * 100) / 100;

  const bf = cs.backdropFilter || (cs as unknown as Record<string, string>).webkitBackdropFilter || "";
  const blurMatch = bf.match(/blur\((\d+)px\)/);
  if (blurMatch) info.blur = parseInt(blurMatch[1], 10);

  return info;
}
