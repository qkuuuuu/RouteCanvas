import { notFound } from "next/navigation";
import PreviewApp from "@/preview/PreviewApp";
import { getShare } from "@/app/api/db";
import type { CanvasState } from "@/types/schema";

export default async function SharedProjectPage({ params }: { params: { id: string } }) {
  const share = await getShare(params.id);
  if (!share) notFound();
  return <PreviewApp initialDocument={share.json as CanvasState} shared />;
}
