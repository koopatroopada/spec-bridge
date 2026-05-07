import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "spec-bridge",
  description: "PM-friendly front-door for Promptfoo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-white text-slate-900">{children}</body>
    </html>
  );
}
