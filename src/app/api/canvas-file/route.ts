import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

/**
 * /api/canvas-file — MCP 同步桥接
 * MCP Server 直接读写项目根目录的 canvas.json；
 * 浏览器无法直接访问文件系统，通过本路由间接读写。
 */
const CANVAS_FILE = path.resolve(process.cwd(), "canvas.json");

/** GET /api/canvas-file — 读取 canvas.json（含 mtime 用于变更检测） */
export async function GET() {
  try {
    if (!fs.existsSync(CANVAS_FILE)) {
      return NextResponse.json({ exists: false, mtime: null, content: null });
    }
    const stat = fs.statSync(CANVAS_FILE);
    const raw = fs.readFileSync(CANVAS_FILE, "utf-8");
    let content: unknown = null;
    try {
      content = JSON.parse(raw);
    } catch {
      content = null;
    }
    return NextResponse.json({
      exists: true,
      mtime: stat.mtimeMs,
      content,
    });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 },
    );
  }
}

/** POST /api/canvas-file — 将画布状态写入 canvas.json */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    fs.writeFileSync(CANVAS_FILE, JSON.stringify(body, null, 2), "utf-8");
    const stat = fs.statSync(CANVAS_FILE);
    return NextResponse.json({ ok: true, mtime: stat.mtimeMs });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 },
    );
  }
}
