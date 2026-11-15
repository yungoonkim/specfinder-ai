"use client";

interface EmptyStateProps {
  title?: string;
  description?: string;
  onResetFilters?: () => void;
}

export default function EmptyState({
  title = "조건에 일치하는 검색 결과가 없습니다 (0건)",
  description = "선택하신 필터 조건에 부합하는 항목이 없습니다. SpecFinder AI는 조건을 임의로 완화하지 않습니다. 필터를 조정하거나 초기화해 보세요.",
  onResetFilters,
}: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-lg font-bold text-slate-500">
        0
      </div>
      <h3 className="text-base font-bold text-slate-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">
        {description}
      </p>
      {onResetFilters && (
        <div className="mt-6">
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            검색 조건 초기화
          </button>
        </div>
      )}
    </div>
  );
}
