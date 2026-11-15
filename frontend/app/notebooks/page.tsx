"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import DataSourceBanner from "@/components/common/DataSourceBanner";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import LoadingState from "@/components/common/LoadingState";
import Pagination from "@/components/common/Pagination";
import NotebookCard from "@/components/notebooks/NotebookCard";
import NotebookFilterPanel, {
  NotebookFilterFormValues,
} from "@/components/notebooks/NotebookFilterPanel";
import {
  ApiClientError,
  getNotebookFacets,
  searchNotebooks,
} from "@/lib/api";
import {
  DataSourceMode,
  NotebookFacetsResponse,
  NotebookFilterParams,
  NotebookSearchResponse,
  NotebookSortOption,
} from "@/types/api";

const ALLOWED_NOTEBOOK_SORTS: NotebookSortOption[] = [
  "id_asc",
  "price_asc",
  "price_desc",
  "ram_desc",
  "weight_asc",
  "newest_capture",
];

const SORT_LABELS: Record<NotebookSortOption, string> = {
  id_asc: "기본순 (상품코드 오름차순)",
  price_asc: "관측 최저가 낮은순",
  price_desc: "관측 최저가 높은순",
  ram_desc: "RAM 용량 높은순",
  weight_asc: "무게 가벼운순",
  newest_capture: "수집 날짜 최신순",
};

const EMPTY_FACETS: NotebookFacetsResponse = {
  manufacturer: [],
  cpu_vendor: [],
  cpu_series: [],
  gpu_type: [],
};

function parseOptionalNumber(raw: string | null): number | undefined {
  if (!raw || raw.trim() === "") return undefined;
  const num = Number(raw);
  return Number.isFinite(num) ? num : undefined;
}

function parseOptionalInt(raw: string | null): number | undefined {
  if (!raw || raw.trim() === "") return undefined;
  const num = Number.parseInt(raw, 10);
  return Number.isFinite(num) ? num : undefined;
}

function NotebooksSearchContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [allowMockFallback, setAllowMockFallback] = useState<boolean>(
    process.env.NEXT_PUBLIC_USE_MOCK !== "false"
  );
  const [facets, setFacets] = useState<NotebookFacetsResponse>(EMPTY_FACETS);
  const [result, setResult] = useState<NotebookSearchResponse | null>(null);
  const [dataSource, setDataSource] = useState<DataSourceMode | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<{
    code: string;
    message: string;
    details?: Record<string, unknown> | null;
  } | null>(null);
  const [reloadTick, setReloadTick] = useState<number>(0);

  const currentParams: NotebookFilterParams = useMemo(() => {
    const rawSort = searchParams.get("sort");
    const sort: NotebookSortOption =
      rawSort &&
      ALLOWED_NOTEBOOK_SORTS.includes(rawSort as NotebookSortOption)
        ? (rawSort as NotebookSortOption)
        : "id_asc";

    const page = parseOptionalInt(searchParams.get("page"));
    const pageSize = parseOptionalInt(searchParams.get("page_size"));

    return {
      manufacturer: searchParams.get("manufacturer") || undefined,
      cpu_vendor: searchParams.get("cpu_vendor") || undefined,
      cpu_series: searchParams.get("cpu_series") || undefined,
      gpu_type: searchParams.get("gpu_type") || undefined,
      min_ram_gb: parseOptionalNumber(searchParams.get("min_ram_gb")),
      max_ram_gb: parseOptionalNumber(searchParams.get("max_ram_gb")),
      min_price_krw: parseOptionalInt(searchParams.get("min_price_krw")),
      max_price_krw: parseOptionalInt(searchParams.get("max_price_krw")),
      min_weight_kg: parseOptionalNumber(searchParams.get("min_weight_kg")),
      max_weight_kg: parseOptionalNumber(searchParams.get("max_weight_kg")),
      sort,
      page: page && page >= 1 ? page : 1,
      page_size: pageSize && pageSize >= 1 && pageSize <= 100 ? pageSize : 20,
    };
  }, [searchParams]);

  const updateUrlParams = useCallback(
    (next: NotebookFilterParams) => {
      const qs = new URLSearchParams();
      if (next.manufacturer) qs.set("manufacturer", next.manufacturer);
      if (next.cpu_vendor) qs.set("cpu_vendor", next.cpu_vendor);
      if (next.cpu_series) qs.set("cpu_series", next.cpu_series);
      if (next.gpu_type) qs.set("gpu_type", next.gpu_type);
      if (next.min_ram_gb !== undefined)
        qs.set("min_ram_gb", String(next.min_ram_gb));
      if (next.max_ram_gb !== undefined)
        qs.set("max_ram_gb", String(next.max_ram_gb));
      if (next.min_price_krw !== undefined)
        qs.set("min_price_krw", String(next.min_price_krw));
      if (next.max_price_krw !== undefined)
        qs.set("max_price_krw", String(next.max_price_krw));
      if (next.min_weight_kg !== undefined)
        qs.set("min_weight_kg", String(next.min_weight_kg));
      if (next.max_weight_kg !== undefined)
        qs.set("max_weight_kg", String(next.max_weight_kg));
      if (next.sort && next.sort !== "id_asc") qs.set("sort", next.sort);
      if (next.page && next.page > 1) qs.set("page", String(next.page));
      if (next.page_size && next.page_size !== 20)
        qs.set("page_size", String(next.page_size));

      const query = qs.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    },
    [pathname, router]
  );

  useEffect(() => {
    const controller = new AbortController();
    getNotebookFacets({
      allowMockFallback,
      signal: controller.signal,
    })
      .then((res) => {
        setFacets(res.data);
      })
      .catch(() => {
        // Facets error is surfaced alongside search request if backend is unreachable
      });
    return () => controller.abort();
  }, [allowMockFallback, reloadTick]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    searchNotebooks(currentParams, {
      allowMockFallback,
      signal: controller.signal,
    })
      .then((res) => {
        setResult(res.data);
        setDataSource(res.source);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        if (err instanceof ApiClientError) {
          setError({
            code: err.code,
            message: err.message,
            details: err.details,
          });
        } else {
          setError({
            code: "INTERNAL_ERROR",
            message:
              err instanceof Error
                ? err.message
                : "노트북 목록을 불러오는 중 알 수 없는 오류가 발생했습니다.",
          });
        }
        setLoading(false);
      });

    return () => controller.abort();
  }, [currentParams, allowMockFallback, reloadTick]);

  const handleApplyFilter = (form: NotebookFilterFormValues) => {
    updateUrlParams({
      ...currentParams,
      manufacturer: form.manufacturer.trim() || undefined,
      cpu_vendor: form.cpu_vendor.trim() || undefined,
      cpu_series: form.cpu_series.trim() || undefined,
      gpu_type: form.gpu_type.trim() || undefined,
      min_ram_gb: parseOptionalNumber(form.min_ram_gb),
      max_ram_gb: parseOptionalNumber(form.max_ram_gb),
      min_price_krw: parseOptionalInt(form.min_price_krw),
      max_price_krw: parseOptionalInt(form.max_price_krw),
      min_weight_kg: parseOptionalNumber(form.min_weight_kg),
      max_weight_kg: parseOptionalNumber(form.max_weight_kg),
      page: 1, // 필터 변경 시 페이지 번호를 1로 초기화
    });
  };

  const handleResetFilters = () => {
    router.push(pathname);
  };

  const handleSortChange = (nextSort: NotebookSortOption) => {
    updateUrlParams({
      ...currentParams,
      sort: nextSort,
      page: 1, // 정렬 변경 시 페이지 1로 초기화
    });
  };

  const handlePageChange = (nextPage: number) => {
    updateUrlParams({
      ...currentParams,
      page: nextPage,
    });
  };

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          노트북 조건 검색
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          제조사, CPU, GPU, RAM, 무게,{" "}
          <strong className="font-semibold text-slate-800">관측 최저가</strong>{" "}
          조건으로 노트북 스펙을 조회합니다.
        </p>
      </div>

      <DataSourceBanner
        source={dataSource}
        allowMockFallback={allowMockFallback}
        onToggleMockFallback={(allow) => {
          setAllowMockFallback(allow);
          setReloadTick((t) => t + 1);
        }}
        onRetryApi={() => setReloadTick((t) => t + 1)}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <aside className="lg:col-span-4 xl:col-span-3">
          <NotebookFilterPanel
            facets={facets}
            appliedParams={currentParams}
            onApply={handleApplyFilter}
            onReset={handleResetFilters}
          />
        </aside>

        <section className="lg:col-span-8 xl:col-span-9">
          <div className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-700">
              검색 결과{" "}
              <strong className="font-extrabold text-blue-600">
                {result ? result.total.toLocaleString("ko-KR") : 0}
              </strong>
              건
              <span className="ml-2 text-xs text-slate-500">
                (가격 기준: 관측 최저가)
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label
                htmlFor="notebook-sort"
                className="text-xs font-semibold text-slate-600"
              >
                정렬 기준
              </label>
              <select
                id="notebook-sort"
                value={currentParams.sort ?? "id_asc"}
                onChange={(e) =>
                  handleSortChange(e.target.value as NotebookSortOption)
                }
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none"
              >
                {ALLOWED_NOTEBOOK_SORTS.map((sortKey) => (
                  <option key={sortKey} value={sortKey}>
                    {SORT_LABELS[sortKey]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <LoadingState message="노트북 스펙 데이터를 조회하고 있습니다..." />
          ) : error ? (
            <ErrorState
              code={error.code}
              message={error.message}
              details={error.details}
              onRetry={() => setReloadTick((t) => t + 1)}
              onResetFilters={handleResetFilters}
              onEnableMockFallback={
                !allowMockFallback
                  ? () => {
                      setAllowMockFallback(true);
                      setReloadTick((t) => t + 1);
                    }
                  : undefined
              }
            />
          ) : !result || result.items.length === 0 ? (
            <EmptyState
              title="조건에 일치하는 노트북이 없습니다 (0건)"
              description="선택한 제조사·CPU·RAM·무게·관측 최저가 범위에 해당하는 노트북이 없습니다. 필터를 초기화하거나 범위를 넓혀 다시 검색해 보세요."
              onResetFilters={handleResetFilters}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {result.items.map((item) => (
                  <NotebookCard key={item.id} item={item} />
                ))}
              </div>

              <Pagination
                page={result.page}
                totalPages={result.total_pages}
                total={result.total}
                pageSize={result.page_size}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default function NotebooksPage() {
  return (
    <Suspense
      fallback={<LoadingState message="노트북 검색 화면을 준비 중입니다..." />}
    >
      <NotebooksSearchContent />
    </Suspense>
  );
}
