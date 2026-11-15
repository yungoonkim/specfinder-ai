"use client";

interface LoadingStateProps {
  message?: string;
  count?: number;
}

export default function LoadingState({
  message = "검색 조건에 맞는 데이터를 불러오는 중입니다...",
  count = 4,
}: LoadingStateProps) {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 shadow-sm">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        <span>{message}</span>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={idx}
            className="animate-pulse rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="mb-3 h-4 w-24 rounded bg-slate-200" />
            <div className="mb-4 h-6 w-3/4 rounded bg-slate-200" />
            <div className="space-y-2">
              <div className="h-3.5 w-full rounded bg-slate-100" />
              <div className="h-3.5 w-5/6 rounded bg-slate-100" />
              <div className="h-3.5 w-2/3 rounded bg-slate-100" />
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
              <div className="h-6 w-28 rounded bg-slate-200" />
              <div className="h-8 w-24 rounded bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
