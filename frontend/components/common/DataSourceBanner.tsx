"use client";

import { API_BASE_URL } from "@/lib/api";
import { DataSourceMode } from "@/types/api";

interface DataSourceBannerProps {
  source: DataSourceMode | null;
  allowMockFallback: boolean;
  onToggleMockFallback: (allow: boolean) => void;
  onRetryApi: () => void;
}

export default function DataSourceBanner({
  source,
  allowMockFallback,
  onToggleMockFallback,
  onRetryApi,
}: DataSourceBannerProps) {
  if (source === "api") {
    return (
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs text-emerald-900">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
          <span>
            <strong>실제 FastAPI 연동됨:</strong> 현재 검색 결과는{" "}
            <code className="rounded bg-emerald-100 px-1 py-0.5 font-mono">
              {API_BASE_URL}
            </code>{" "}
            백엔드 API에서 조회한 데이터입니다.
          </span>
        </div>
      </div>
    );
  }

  if (source === "mock") {
    return (
      <div
        role="status"
        className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 shadow-sm"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <span className="inline-flex items-center rounded-md bg-amber-200 px-2 py-0.5 text-xs font-bold text-amber-950">
                임시 Mock 데이터 표시 중
              </span>
              <span>실제 PostgreSQL DB 조회 결과가 아닙니다</span>
            </div>
            <p className="text-xs leading-relaxed text-amber-800">
              현재 FastAPI 백엔드(
              <code className="rounded bg-amber-100 px-1 py-0.5 font-mono">
                {API_BASE_URL}
              </code>
              )에 연결할 수 없어, <code className="font-mono">docs/API_CONTRACT.md</code>{" "}
              규격과 일치하는 로컬 Mock 데이터로 UI를 표시하고 있습니다.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onRetryApi}
              className="rounded-lg bg-amber-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-950"
            >
              실제 API 재연결 시도
            </button>
            {allowMockFallback && (
              <button
                type="button"
                onClick={() => onToggleMockFallback(false)}
                className="rounded-lg border border-amber-400 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 transition hover:bg-amber-100"
              >
                Mock 끄기 (API 오류 화면 확인)
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
