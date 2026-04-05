import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "外卖经营知识答题挑战",
  description: "随机10题，测测你是青铜掌柜还是外卖王者",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="min-h-full flex flex-col">
        <main className="flex-1 mx-auto w-full max-w-[430px] relative">
          {children}
        </main>
      </body>
    </html>
  );
}
