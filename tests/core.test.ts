import { describe, expect, it } from "vitest";
import { describeOperation, operationDependencies, toggleOperationSelection, type ChatOp } from "@/data/chatOps";
import { validateDocument } from "@/data/serializer";
import { resolvePageFrames } from "@/design/frame";
import { exportHtmlDocument } from "@/lib/codeExport";
import { methodologyBrief, ESTHETICS } from "@/data/skills/esthetics";
import type { CanvasState, Page } from "@/types/schema";

const page = (id: string, nodes: Page["nodes"] = []): Page => ({ id, name: id, route: { path: `/${id}` }, layout: { x: 0, y: 0, width: 800, height: 600 }, nodes });

describe("AI operation review", () => {
  it("keeps forward refs selected with their dependencies", () => {
    const ops: ChatOp[] = [
      { op: "add_page", ref: "home", name: "首页", path: "/" },
      { op: "add_node", pageRef: "home", ref: "cta", type: "Button" },
      { op: "connect", sourcePageRef: "home", sourceNodeRef: "cta", targetPageRef: "home" },
    ];
    expect([...operationDependencies(ops).get(2)!]).toEqual([0, 1]);
    expect([...toggleOperationSelection(ops, new Set(), 2)]).toEqual([0, 1, 2]);
    expect(describeOperation(ops[0])).toContain("首页");
  });
});

describe("document integrity", () => {
  it("rejects transitions whose source node or target page disappeared", () => {
    const state = { meta: { schemaVersion: "2" }, pages: [page("home", [{ id: "button", type: "Button", position: { x: 0, y: 0 }, size: { width: 80, height: 40 } }])], transitions: [{ id: "t1", source: { pageId: "home", nodeId: "missing" }, target: { pageId: "gone" } }] };
    expect(validateDocument(state)).toEqual(expect.arrayContaining([expect.stringContaining("来源节点不存在"), expect.stringContaining("目标页面不存在")]));
  });
});

describe("responsive frame and export semantics", () => {
  it("lays out stack children and maps the parent to flex DOM", () => {
    const state: CanvasState = {
      meta: { schemaVersion: "2" },
      pages: [page("home", [
        { id: "container", type: "Container", position: { x: 40, y: 40 }, size: { width: 400, height: 200 }, layout: { mode: "stack", direction: "vertical", gap: 12, padding: 16 } },
        { id: "text", type: "Text", parentId: "container", position: { x: 0, y: 0 }, size: { width: 200, height: 30 }, props: { text: "Hello" } },
      ])], transitions: [], componentRegistry: [],
    };
    const frames = resolvePageFrames(state.pages[0], "desktop");
    expect(frames.get("text")?.y).toBe(56);
    const html = exportHtmlDocument(state);
    expect(html).toContain("display: flex");
    expect(html.indexOf("node-home-container")).toBeLessThan(html.indexOf("node-home-text"));
  });
});

describe("esthetic methodology", () => {
  it("provides a distinct nine-part brief for all themes", () => {
    expect(ESTHETICS).toHaveLength(12);
    ESTHETICS.forEach((theme) => {
      const brief = methodologyBrief(theme);
      expect(brief).toContain("1. 情绪");
      expect(brief).toContain("9. 收尾");
    });
  });
});
