"use client";
import dynamic from "next/dynamic";

const PreviewApp = dynamic(() => import("@/preview/PreviewApp"), {
  ssr: false,
});

export default function PreviewPage() {
  return <PreviewApp />;
}
