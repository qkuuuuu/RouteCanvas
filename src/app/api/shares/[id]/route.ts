import { NextResponse } from "next/server";
import { getShare } from "../../db";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const share = await getShare(params.id);
  if (!share) return NextResponse.json({ error: "分享不存在或已失效" }, { status: 404 });
  return NextResponse.json(share);
}
