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

    const padding = node.layout?.padding ?? 0;
    const gap = node.layout?.gap ?? 8;
    const direction = node.layout?.direction ?? "vertical";
    const columns = Math.max(1, node.layout?.columns ?? 2);
    let cursorX = frame.x + padding;
    let cursorY = frame.y + padding;
    const gridRowHeights = layout === "grid"
      ? children.reduce<number[]>((heights, child, index) => {
          const row = Math.floor(index / columns);
          heights[row] = Math.max(heights[row] ?? 0, resolveNodeFrame(child, breakpoint).height);
          return heights;
        }, [])
      : [];

    children.forEach((child, index) => {
      const childFrame = resolveNodeFrame(child, breakpoint);
      let next: ResolvedFrame = { ...childFrame, x: cursorX, y: cursorY };
      if (layout === "grid") {
        const column = index % columns;
        const row = Math.floor(index / columns);
        const cellWidth = Math.max(40, (frame.width - padding * 2 - gap * (columns - 1)) / columns);
        next = {
          ...childFrame,
          x: frame.x + padding + column * (cellWidth + gap),
          y: frame.y + padding + gridRowHeights.slice(0, row).reduce((sum, height) => sum + height, 0) + row * gap,
          width: child.constraints?.horizontal === "stretch" ? cellWidth : Math.min(childFrame.width, cellWidth),
        };
      } else if (direction === "horizontal") {
        next = { ...childFrame, x: cursorX, y: frame.y + padding };
        cursorX += next.width + gap;
      } else {
        next = { ...childFrame, x: frame.x + padding, y: cursorY };
        cursorY += next.height + gap;
      }
      visit(child, next);
    });
  };

  roots.forEach((root) => visit(root));
  return frames;
}
