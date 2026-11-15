"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const isNotebooks = pathname?.startsWith("/notebooks");
  const isCars = pathname?.startsWith("/cars");
  const isAISearch = pathname?.startsWith("/ai-search");

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 font-bold text-white shadow-sm transition group-hover:bg-blue-700">
              SF
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900">
                SpecFinder AI
              </span>
              <span className="ml-2 hidden rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 sm:inline-block">
                노트북 · 전기차 스펙/매물 검색
              </span>
            </div>
          </Link>
        </div>

        <nav aria-label="주요 메뉴" className="flex items-center gap-2">
          <Link
            href="/notebooks"
            className={`flex-1 sm:flex-initial text-center rounded-lg px-4 py-2 text-sm font-semibold transition ${
              isNotebooks
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            노트북 탭
          </Link>
          <Link
            href="/cars"
            className={`flex-1 sm:flex-initial text-center rounded-lg px-4 py-2 text-sm font-semibold transition ${
              isCars
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            자동차 탭
          </Link>
          <Link
            href="/ai-search"
            className={`flex-1 sm:flex-initial text-center rounded-lg px-4 py-2 text-sm font-semibold transition ${
              isAISearch
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
            }`}
          >
            AI 검색
          </Link>
        </nav>
      </div>
    </header>
  );
}
