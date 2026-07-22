import { NextRequest, NextResponse } from "next/server";
import { listDocs, getDoc, upsertDoc, deleteDoc } from "../db";

/** GET /api/docs — 列出所有文档 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (id) {
    const doc = await getDoc(id);
    if (!doc)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(doc);
  }

  const docs = await listDocs();
  return NextResponse.json({ docs });
}

/** POST /api/docs — 创建或更新文档 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, json } = body as {
      id?: string;
      name?: string;
      json?: unknown;
    };
    if (!id) {
      return NextResponse.json(
        { error: "Missing required field: id" },
        { status: 400 },
      );
    }
    const doc = await upsertDoc(
      id,
      name ?? "未命名画布",
      json ?? {},
    );
    return NextResponse.json(doc);
  } catch (e) {
    return NextResponse.json(
      { error: `Invalid request: ${(e as Error).message}` },
      { status: 400 },
    );
  }
}

/** DELETE /api/docs?id=xxx — 删除文档 */
export async function DELETE(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { error: "Missing required param: id" },
      { status: 400 },
    );
  }
  const ok = await deleteDoc(id);
  if (!ok)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
