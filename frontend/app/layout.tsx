import type { Metadata } from "next";
import Navbar from "@/components/common/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "SpecFinder AI — 노트북 · 전기차 조건 검색",
  description:
    "노트북과 중고 전기차 스펙·매물 데이터를 정형 필터로 정확하게 조회하는 통합 검색 웹서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className=" flex min-h-screen flex-col bg-slate-50 text-slate-900">
        <Navbar />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
        <footer className="mt-12 border-t border-slate-200 bg-white py-6 text-xs text-slate-500">
          <div className="mx-auto flex max-w-7xl flex-col justify-between gap-2 px-4 sm:flex-row sm:items-center sm:px-6 lg:px-8">
            <p className="font-semibold text-slate-700">
              SpecFinder AI · 통합 스펙/매물 조건 검색 서비스 (MVP)
            </p>
            <p>
              데이터 안내: 노트북 가격(관측 최저가) 및 전기차 매물(수집 당시 판매 희망가)은
              수집 시점 스냅샷이며 현재 실시간 가격·재고를 보장하지 않습니다.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
