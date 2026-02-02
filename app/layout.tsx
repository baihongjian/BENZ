import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BENZ - 德语学习",
  description: "BENZ 德语学习平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
