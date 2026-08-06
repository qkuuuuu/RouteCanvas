import type { BreakpointKey, Page, ResponsiveFrame, UINode } from "@/types/schema";

export interface ResolvedFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function resolveNodeFrame(node: UINode, breakpoint: BreakpointKey): ResolvedFrame {
  const override = node.responsive?.[breakpoint] ?? {};
  return {
    x: override.x ?? node.position.x,
    y: override.y ?? node.position.y,
    width: override.width ?? node.size.width,
    height: override.height ?? node.size.height,
  };
}

export function responsivePatchFromFrame(frame: Partial<ResolvedFrame>): ResponsiveFrame {
  return { x: frame.x, y: frame.y, width: frame.width, height: frame.height };
}

/**
 * Resolves the V2 layer tree into page-relative frames. Absolute nodes retain
 * their own frame; children of stack/grid containers are laid out at render time.
 */
export function resolvePageFrames(page: Page, breakpoint: BreakpointKey): Map<string, ResolvedFrame> {
  const frames = new Map<string, ResolvedFrame>();
  const childrenByParent = new Map<string, UINode[]>();
  const roots: UINode[] = [];

  for (const node of page.nodes) {
    if (node.parentId && page.nodes.some((candidate) => candidate.id === node.parentId)) {
      const siblings = childrenByParent.get(node.parentId) ?? [];
      siblings.push(node);
      childrenByParent.set(node.parentId, siblings);
    } else {
      roots.push(node);
    }
  }

  const visit = (node: UINode, assigned?: ResolvedFrame) => {
    const frame = assigned ?? resolveNodeFrame(node, breakpoint);
    frames.set(node.id, frame);
    const children = childrenByParent.get(node.id) ?? [];
    if (!children.length) return;

    const layout = node.layout?.mode ?? "absolute";
    if (layout === "absolute") {
      children.forEach((child) => visit(child));
      return;
    }

    const padding = Math.max(0, node.layout?.padding ?? 0);
    const gap = Math.max(0, node.layout?.gap ?? 8);
    const direction = node.layout?.direction ?? "vertical";
    const align = node.layout?.align ?? "start";
    const justify = node.layout?.justify ?? "start";
    const columns = Math.max(1, Math.floor(node.layout?.columns ?? 2));

    const placeCross = (child: UINode, childFrame: ResolvedFrame, crossStart: number, crossSize: number, horizontal: boolean) => {
      const constraint = horizontal ? child.constraints?.vertical : child.constraints?.horizontal;
      const crossAlign = constraint === "stretch" ? "stretch" : constraint === "center" ? "center" : constraint === "right" || constraint === "bottom" ? "end" : align;
      const childCrossSize = horizontal ? childFrame.height : childFrame.width;
      const size = crossAlign === "stretch" ? Math.max(8, crossSize) : Math.min(childCrossSize, Math.max(8, crossSize));
      const offset = crossAlign === "center" ? (crossSize - size) / 2 : crossAlign === "end" ? crossSize - size : 0;
      return { size, offset };
    };

    if (layout === "grid") {
      const cellWidth = Math.max(40, (frame.width - padding * 2 - gap * (columns - 1)) / columns);
      const rowHeights = children.reduce<number[]>((heights, child, index) => {
        const row = Math.floor(index / columns);
        heights[row] = Math.max(heights[row] ?? 0, resolveNodeFrame(child, breakpoint).height);
        return heights;
      }, []);
      let rowY = frame.y + padding;
      children.forEach((child, index) => {
        const childFrame = resolveNodeFrame(child, breakpoint);
        const column = index % columns;
        const row = Math.floor(index / columns);
        const rowHeight = rowHeights[row] ?? childFrame.height;
        const cross = placeCross(child, childFrame, 0, cellWidth, false);
        const x = frame.x + padding + column * (cellWidth + gap) + cross.offset;
        const yCross = placeCross(child, childFrame, 0, rowHeight, true);
        const y = rowY + yCross.offset;
        visit(child, {
          x,
          y,
          width: cross.size,
          height: yCross.size,
        });
        if (column === columns - 1 || index === children.length - 1) rowY += rowHeight + gap;
      });
      return;
    }

    const horizontal = direction === "horizontal";
    const mainSize = horizontal ? frame.width : frame.height;
    const crossSize = horizontal ? frame.height : frame.width;
    const childFrames = children.map((child) => resolveNodeFrame(child, breakpoint));
    const totalMain = childFrames.reduce((sum, child) => sum + (horizontal ? child.width : child.height), 0);
    const availableMain = Math.max(0, mainSize - padding * 2);
    const freeMain = Math.max(0, availableMain - totalMain - gap * Math.max(0, children.length - 1));
    const betweenGap = justify === "between" && children.length > 1 ? gap + freeMain / (children.length - 1) : gap;
    const justifyOffset = justify === "center" ? freeMain / 2 : justify === "end" ? freeMain : 0;
    let cursor = (horizontal ? frame.x : frame.y) + padding + justifyOffset;

    children.forEach((child, index) => {
      const childFrame = childFrames[index];
      const main = horizontal ? childFrame.width : childFrame.height;
      const cross = placeCross(child, childFrame, 0, Math.max(0, crossSize - padding * 2), horizontal);
      const next: ResolvedFrame = horizontal
        ? { x: cursor, y: frame.y + padding + cross.offset, width: Math.max(8, main), height: cross.size }
        : { x: frame.x + padding + cross.offset, y: cursor, width: cross.size, height: Math.max(8, main) };
      visit(child, next);
      cursor += main + betweenGap;
    });
  };

  roots.forEach((root) => visit(root));
  return frames;
}
