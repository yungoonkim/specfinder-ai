"use client";

interface ErrorStateProps {
  code?: string;
  message: string;
  details?: Record<string, unknown> | null;
  onRetry?: () => void;
  onResetFilters?: () => void;
  onEnableMockFallback?: () => void;
}

export default function ErrorState({
  code = "API_ERROR",
  message,
  details,
  onRetry,
  onResetFilters,
  onEnableMockFallback,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-rose-200 bg-rose-50/70 p-6 text-rose-950 shadow-sm"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded bg-rose-200 px-2 py-0.5 font-mono text-xs font-bold text-rose-900">
          {code}
        </span>
        <h3 className="text-base font-bold text-rose-900">
          요청을 처리하는 중 오류가 발생했습니다
        </h3>
      </div>

      <p className="mt-2 text-sm leading-relaxed text-rose-800">{message}</p>

      {details && Object.keys(details).length > 0 && (
        <pre className="mt-3 overflow-x-auto rounded-lg border border-rose-200 bg-white/80 p-3 font-mono text-xs text-rose-900">
          {JSON.stringify(details, null, 2)}
        </pre>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-lg bg-rose-700 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-800"
          >
            다시 시도
          </button>
        )}
        {onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="rounded-lg border border-rose-300 bg-white px-4 py-2 text-xs font-semibold text-rose-900 transition hover:bg-rose-100"
          >
            필터 초기화
          </button>
        )}
        {onEnableMockFallback && (
          <button
            type="button"
            onClick={onEnableMockFallback}
            className="rounded-lg border border-amber-400 bg-amber-100 px-4 py-2 text-xs font-semibold text-amber-950 transition hover:bg-amber-200"
          >
            임시 Mock 데이터로 UI 확인하기
          </button>
        )}
      </div>
    </div>
  );
}
