import type { Metadata, Viewport } from "next";
import "./globals.css";
import { WxShareInit } from "@/components/WxShareInit";

const SITE_URL = "http://waimaiketang.com/game";

export const metadata: Metadata = {
  title: "外卖老板段位测试，90%的人拿不到黄金",
  description: "随机10题，测测你到底是青铜掌柜还是王者掌门",
  openGraph: {
    title: "外卖老板段位测试，90%的人拿不到黄金",
    description: "随机10题，测测你到底是青铜掌柜还是王者掌门。完成挑战免费领经营诊断+实战攻略+专属方案！",
    url: `${SITE_URL}/`,
    siteName: "外卖经营知识挑战",
    images: [
      {
        url: `${SITE_URL}/share-cover.png`,
        width: 600,
        height: 600,
        alt: "答题领经营大礼包",
      },
    ],
    type: "website",
    locale: "zh_CN",
  },
  other: {
    // WeChat specific meta tags
    "twitter:card": "summary",
    "twitter:title": "外卖老板段位测试，90%的人拿不到黄金",
    "twitter:description": "随机10题，测测你到底是青铜掌柜还是王者掌门",
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
