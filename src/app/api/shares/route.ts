import { NextRequest, NextResponse } from "next/server";
import { createShare } from "../db";

function shortId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 10);
}

/** 创建只读分享快照。分享内容与编辑中的项目隔离，后续修改不会悄悄改变旧链接。 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { name?: string; json?: unknown };
    if (!body.json || typeof body.json !== "object") {
      return NextResponse.json({ error: "缺少有效项目数据" }, { status: 400 });
    }
    const record = await createShare(shortId(), body.name?.trim() || "未命名项目", body.json);
    return NextResponse.json({ id: record.id, url: `/share/${record.id}`, createdAt: record.createdAt });
  } catch (error) {
    return NextResponse.json({ error: `创建分享失败：${(error as Error).message}` }, { status: 400 });
  }
}
