import type { Metadata, Viewport } from "next";
import "./globals.css";
import { WxShareInit } from "@/components/WxShareInit";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "/oldgame";
const SITE_URL = `https://waimaiketang.com${BASE_PATH}`;

export const metadata: Metadata = {
  title: "外卖老板7天生存挑战",
  description: "1万本金起步，7天经营，看看你能赚多少 or 亏多少",
  openGraph: {
    title: "外卖老板7天生存挑战",
    description: "1万本金起步，7天经营，每天4个决策，看看你能赚多少 or 亏多少",
    url: `${SITE_URL}/`,
    siteName: "外卖经营模拟",
    images: [
      {
        url: `${SITE_URL}/share-cover.png`,
        width: 600,
        height: 600,
        alt: "外卖老板7天生存挑战",
      },
    ],
    type: "website",
    locale: "zh_CN",
  },
  other: {
    "twitter:card": "summary",
    "twitter:title": "外卖老板7天生存挑战",
    "twitter:description": "1万本金起步，7天经营，看看你能赚多少 or 亏多少",
    "twitter:image": `${SITE_URL}/share-cover.png`,
  },
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
          <WxShareInit />
          {children}
        </main>
      </body>
    </html>
  );
}
