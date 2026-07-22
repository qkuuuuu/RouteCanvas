import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RouteCanvas",
  description: "无限画布 UI 流程与 JSON 协同工作台",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  );
}
