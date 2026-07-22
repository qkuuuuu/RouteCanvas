import dynamic from "next/dynamic";

// 编辑器主体仅客户端渲染（用到 localStorage / React Flow）
const Editor = dynamic(() => import("@/canvas/Editor"), { ssr: false });

export default function Home() {
  return <Editor />;
}
