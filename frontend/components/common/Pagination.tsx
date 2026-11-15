"use client";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  accentColor?: "blue" | "emerald";
  onPageChange: (nextPage: number) => void;
}

export default function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  accentColor = "blue",
  onPageChange,
}: PaginationProps) {
  if (total === 0 || totalPages <= 0) {
    return null;
  }

  const maxVisible = 5;
  const half = Math.floor(maxVisible / 2);
  let startPage = Math.max(1, page - half);
  const endPage = Math.min(totalPages, startPage + maxVisible - 1);
  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  const pages: number[] = [];
  for (let p = startPage; p <= endPage; p += 1) {
    pages.push(p);
  }

  const activeButtonClass =
    accentColor === "emerald"
      ? "bg-emerald-600 text-white shadow-sm"
      : "bg-blue-600 text-white shadow-sm";

  return (
    <nav
      aria-label="페이지네이션"
      className="mt-6 flex flex-col items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:flex-row"
    >
      <div className="text-center text-xs text-slate-600 sm:text-left">
        총{" "}
        <strong className="font-semibold text-slate-900">
          {total.toLocaleString("ko-KR")}
        </strong>
        건 중{" "}
        <strong className="font-semibold text-slate-900">
          {page} / {totalPages}
        </strong>{" "}
        페이지 (페이지당 {pageSize}건)
      </div>

      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          이전
        </button>

        {startPage > 1 && (
          <>
            <button
              type="button"
              onClick={() => onPageChange(1)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              1
            </button>
            {startPage > 2 && (
              <span className="px-1 text-xs text-slate-400">...</span>
            )}
          </>
        )}

        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            aria-current={p === page ? "page" : undefined}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              p === page
                ? activeButtonClass
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {p}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && (
              <span className="px-1 text-xs text-slate-400">...</span>
            )}
            <button
              type="button"
              onClick={() => onPageChange(totalPages)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          다음
        </button>
      </div>
    </nav>
  );
}
