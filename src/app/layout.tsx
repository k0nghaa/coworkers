import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Header from "@/components/Common/Header/Header";
import ToastProvider from "@/providers/ToastProvider";
import StoreHydrationProvider from "@/providers/StoreHydrationProvider";
import Providers from "./providers";

// metadataBase는 상대 경로를 절대 URL로 변환하기 위한 기본 URL 설정
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL ||
      (process.env.NODE_ENV === "development"
        ? "http://localhost:3000"
        : "https://coworkers-two.vercel.app")
  ),
  title: {
    default: "Coworkers - 팀 협업 관리 서비스",
    template: "%s | Coworkers", // 하위 페이지에서 %s가 title로 대체됨
  },
  description:
    "팀 협업을 위한 할 일 관리, 멤버 초대, 프로젝트 진행 상황 추적 서비스",
  keywords: ["팀 협업", "프로젝트 관리", "할 일 관리", "업무 관리", "팀워크"],
  authors: [{ name: "Coworkers" }],
  creator: "Coworkers",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "/",
    title: "Coworkers - 팀 협업 관리 서비스",
    description:
      "팀 협업을 위한 할 일 관리, 멤버 초대, 프로젝트 진행 상황 추적 서비스",
    siteName: "Coworkers",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Coworkers",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
};

// 모바일 viewport 설정 - 자동 줌 방지
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
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body>
        <StoreHydrationProvider>
          <ToastProvider />
          <Providers>
            <Header />
            <main className="pt-[var(--app-header-height)]">{children}</main>
          </Providers>
          <Analytics />
          <SpeedInsights />
        </StoreHydrationProvider>
      </body>
    </html>
  );
}
