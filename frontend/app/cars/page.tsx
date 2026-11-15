"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import CarCard from "@/components/cars/CarCard";
import CarFilterPanel, {
  CarFilterFormValues,
} from "@/components/cars/CarFilterPanel";
import DataSourceBanner from "@/components/common/DataSourceBanner";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import LoadingState from "@/components/common/LoadingState";
import Pagination from "@/components/common/Pagination";
import {
  ApiClientError,
  DEFAULT_ALLOW_MOCK_FALLBACK,
  getCarFacets,
  getStoredMockFallbackPreference,
  searchCars,
  setStoredMockFallbackPreference,
} from "@/lib/api";
import {
  CarFacetsResponse,
  CarFilterParams,
  CarSearchResponse,
  CarSortOption,
  DataSourceMode,
} from "@/types/api";

const ALLOWED_CAR_SORTS: CarSortOption[] = [
  "id_asc",
  "price_asc",
  "price_desc",
  "mileage_asc",
  "year_desc",
  "newest_capture",
];

const CAR_SORT_LABELS: Record<CarSortOption, string> = {
  id_asc: "기본순 (매물 ID 오름차순)",
  price_asc: "수집 당시 희망가 낮은순",
  price_desc: "수집 당시 희망가 높은순",
  mileage_asc: "주행거리 짧은순",
  year_desc: "등록연도 최신순",
  newest_capture: "수집 날짜 최신순",
};

const PAGE_SIZE_OPTIONS = [20, 50, 100];

const EMPTY_CAR_FACETS: CarFacetsResponse = {
  manufacturer: [],
  model: [],
  branch_or_region: [],
};

function parseOptionalInt(raw: string | null): number | undefined {
  if (!raw || raw.trim() === "") return undefined;
  const num = Number.parseInt(raw, 10);
  return Number.isFinite(num) ? num : undefined;
}

function CarsSearchContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [allowMockFallback, setAllowMockFallback] = useState<boolean>(
    DEFAULT_ALLOW_MOCK_FALLBACK
  );
  const [facets, setFacets] = useState<CarFacetsResponse>(EMPTY_CAR_FACETS);
  const [result, setResult] = useState<CarSearchResponse | null>(null);
  const [dataSource, setDataSource] = useState<DataSourceMode | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<{
    code: string;
    message: string;
    details?: Record<string, unknown> | null;
  } | null>(null);
  const [reloadTick, setReloadTick] = useState<number>(0);

  useEffect(() => {
    setAllowMockFallback(getStoredMockFallbackPreference());
  }, []);

  const handleToggleMockFallback = (allow: boolean) => {
    setStoredMockFallbackPreference(allow);
    setAllowMockFallback(allow);
    setReloadTick((t) => t + 1);
  };

  const currentParams: CarFilterParams = useMemo(() => {
    const rawSort = searchParams.get("sort");
    const sort: CarSortOption =
      rawSort && ALLOWED_CAR_SORTS.includes(rawSort as CarSortOption)
        ? (rawSort as CarSortOption)
        : "id_asc";

    const page = parseOptionalInt(searchParams.get("page"));
    const pageSize = parseOptionalInt(searchParams.get("page_size"));

    return {
      manufacturer: searchParams.get("manufacturer") || undefined,
      model: searchParams.get("model") || undefined,
      registration_year_min: parseOptionalInt(
        searchParams.get("registration_year_min")
      ),
      registration_year_max: parseOptionalInt(
        searchParams.get("registration_year_max")
      ),
      min_mileage_km: parseOptionalInt(searchParams.get("min_mileage_km")),
      max_mileage_km: parseOptionalInt(searchParams.get("max_mileage_km")),
      min_price_krw: parseOptionalInt(searchParams.get("min_price_krw")),
      max_price_krw: parseOptionalInt(searchParams.get("max_price_krw")),
      branch_or_region: searchParams.get("branch_or_region") || undefined,
      sort,
      page: page && page >= 1 ? page : 1,
      page_size: pageSize && pageSize >= 1 && pageSize <= 100 ? pageSize : 20,
    };
  }, [searchParams]);

  const updateUrlParams = useCallback(
    (next: CarFilterParams) => {
      const qs = new URLSearchParams();
      if (next.manufacturer) qs.set("manufacturer", next.manufacturer);
      if (next.model) qs.set("model", next.model);
      if (next.registration_year_min !== undefined)
        qs.set("registration_year_min", String(next.registration_year_min));
      if (next.registration_year_max !== undefined)
        qs.set("registration_year_max", String(next.registration_year_max));
      if (next.min_mileage_km !== undefined)
        qs.set("min_mileage_km", String(next.min_mileage_km));
      if (next.max_mileage_km !== undefined)
        qs.set("max_mileage_km", String(next.max_mileage_km));
      if (next.min_price_krw !== undefined)
        qs.set("min_price_krw", String(next.min_price_krw));
      if (next.max_price_krw !== undefined)
        qs.set("max_price_krw", String(next.max_price_krw));
      if (next.branch_or_region)
        qs.set("branch_or_region", next.branch_or_region);
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
    getCarFacets({
      allowMockFallback,
      signal: controller.signal,
    })
      .then((res) => {
        setFacets(res.data);
      })
      .catch(() => {
        // Handled in main search effect
      });
    return () => controller.abort();
  }, [allowMockFallback, reloadTick]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    searchCars(currentParams, {
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
                : "자동차 매물 목록을 불러오는 중 알 수 없는 오류가 발생했습니다.",
          });
        }
        setLoading(false);
      });

    return () => controller.abort();
  }, [currentParams, allowMockFallback, reloadTick]);

  const handleApplyFilter = (form: CarFilterFormValues) => {
    updateUrlParams({
      ...currentParams,
      manufacturer: form.manufacturer.trim() || undefined,
      model: form.model.trim() || undefined,
      registration_year_min: parseOptionalInt(form.registration_year_min),
      registration_year_max: parseOptionalInt(form.registration_year_max),
      min_price_krw: parseOptionalInt(form.min_price_krw),
      max_price_krw: parseOptionalInt(form.max_price_krw),
      min_mileage_km: parseOptionalInt(form.min_mileage_km),
      max_mileage_km: parseOptionalInt(form.max_mileage_km),
      branch_or_region: form.branch_or_region.trim() || undefined,
      page: 1, // 필터 변경 시 페이지 번호를 1로 초기화
    });
  };

  const handleResetFilters = () => {
    router.push(pathname);
  };

  const handleSortChange = (nextSort: CarSortOption) => {
    updateUrlParams({
      ...currentParams,
      sort: nextSort,
      page: 1, // 정렬 변경 시 페이지 1로 초기화
    });
  };

  const handlePageSizeChange = (nextSize: number) => {
    updateUrlParams({
      ...currentParams,
      page_size: nextSize,
      page: 1, // 페이지 크기 변경 시 페이지 1로 초기화
    });
  };

  const handlePageChange = (nextPage: number) => {
    updateUrlParams({
      ...currentParams,
      page: nextPage,
    });
  };

  const activeFilterChips = useMemo(() => {
    const chips: Array<{
      key: keyof CarFilterParams;
      label: string;
    }> = [];
    if (currentParams.manufacturer) {
      chips.push({
        key: "manufacturer",
        label: `제조사: ${currentParams.manufacturer}`,
      });
    }
    if (currentParams.model) {
      chips.push({
        key: "model",
        label: `모델: ${currentParams.model}`,
      });
    }
    if (currentParams.branch_or_region) {
      chips.push({
        key: "branch_or_region",
        label: `지역: ${currentParams.branch_or_region}`,
      });
    }
    if (currentParams.registration_year_min !== undefined) {
      chips.push({
        key: "registration_year_min",
        label: `등록연도 ≥ ${currentParams.registration_year_min}년`,
      });
    }
    if (currentParams.registration_year_max !== undefined) {
      chips.push({
        key: "registration_year_max",
        label: `등록연도 ≤ ${currentParams.registration_year_max}년`,
      });
    }
    if (currentParams.min_price_krw !== undefined) {
      chips.push({
        key: "min_price_krw",
        label: `희망가 ≥ ${currentParams.min_price_krw.toLocaleString("ko-KR")}원`,
      });
    }
    if (currentParams.max_price_krw !== undefined) {
      chips.push({
        key: "max_price_krw",
        label: `희망가 ≤ ${currentParams.max_price_krw.toLocaleString("ko-KR")}원`,
      });
    }
    if (currentParams.min_mileage_km !== undefined) {
      chips.push({
        key: "min_mileage_km",
        label: `주행거리 ≥ ${currentParams.min_mileage_km.toLocaleString("ko-KR")}km`,
      });
    }
    if (currentParams.max_mileage_km !== undefined) {
      chips.push({
        key: "max_mileage_km",
        label: `주행거리 ≤ ${currentParams.max_mileage_km.toLocaleString("ko-KR")}km`,
      });
    }
    return chips;
  }, [currentParams]);

  const removeSingleFilter = (key: keyof CarFilterParams) => {
    updateUrlParams({
      ...currentParams,
      [key]: undefined,
      page: 1,
    });
  };

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          중고 전기차 매물 조건 검색
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          제조사, 모델, 등록연도, 주행거리, 지역,{" "}
          <strong className="font-semibold text-slate-800">
            수집 당시 판매 희망가
          </strong>{" "}
          범위로 매물을 조회합니다. (실시간 판매 가능 여부를 보장하지 않습니다.)
        </p>
      </div>

      <DataSourceBanner
        source={dataSource}
        allowMockFallback={allowMockFallback}
        onToggleMockFallback={handleToggleMockFallback}
        onRetryApi={() => setReloadTick((t) => t + 1)}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <aside className="lg:col-span-4 xl:col-span-3">
          <CarFilterPanel
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
              <strong className="font-extrabold text-emerald-700">
                {result ? result.total.toLocaleString("ko-KR") : 0}
              </strong>
              건
              <span className="ml-2 text-xs text-slate-500">
                (가격 기준: 수집 당시 판매 희망가)
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label
                htmlFor="car-sort"
                className="text-xs font-semibold text-slate-600"
              >
                정렬 기준
              </label>
              <select
                id="car-sort"
                value={currentParams.sort ?? "id_asc"}
                onChange={(e) =>
                  handleSortChange(e.target.value as CarSortOption)
                }
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 shadow-sm focus:border-emerald-600 focus:outline-none"
              >
                {ALLOWED_CAR_SORTS.map((sortKey) => (
                  <option key={sortKey} value={sortKey}>
                    {CAR_SORT_LABELS[sortKey]}
                  </option>
                ))}
              </select>

              <label
                htmlFor="car-page-size"
                className="sr-only"
              >
                페이지당 표시 개수
              </label>
              <select
                id="car-page-size"
                value={currentParams.page_size ?? 20}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900 shadow-sm focus:border-emerald-600 focus:outline-none"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}개씩 보기
                  </option>
                ))}
              </select>
            </div>
          </div>

          {activeFilterChips.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-1.5 rounded-xl border border-emerald-100 bg-emerald-50/60 px-3.5 py-2.5">
              <span className="mr-1 text-xs font-semibold text-emerald-900">
                적용된 필터:
              </span>
              {activeFilterChips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => removeSingleFilter(chip.key)}
                  className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-white px-2.5 py-0.5 text-xs font-medium text-emerald-800 transition hover:bg-emerald-100"
                >
                  <span>{chip.label}</span>
                  <span aria-hidden="true" className="font-bold text-emerald-600">
                    ×
                  </span>
                </button>
              ))}
              <button
                type="button"
                onClick={handleResetFilters}
                className="ml-auto text-xs font-semibold text-emerald-700 underline hover:text-emerald-900"
              >
                전체 해제
              </button>
            </div>
          )}

          {loading ? (
            <LoadingState message="전기차 매물 데이터를 조회하고 있습니다..." />
          ) : error ? (
            <ErrorState
              code={error.code}
              message={error.message}
              details={error.details}
              onRetry={() => setReloadTick((t) => t + 1)}
              onResetFilters={handleResetFilters}
              onEnableMockFallback={
                !allowMockFallback
                  ? () => handleToggleMockFallback(true)
                  : undefined
              }
            />
          ) : !result || result.items.length === 0 ? (
            <EmptyState
              title="조건에 일치하는 전기차 매물이 없습니다 (0건)"
              description="선택한 제조사·모델·등록연도·주행거리·희망가·지역 조건에 해당하는 매물이 없습니다. 필터를 초기화하거나 범위를 조정해 보세요."
              onResetFilters={handleResetFilters}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {result.items.map((item) => (
                  <CarCard key={item.id} item={item} />
                ))}
              </div>

              <Pagination
                page={result.page}
                totalPages={result.total_pages}
                total={result.total}
                pageSize={result.page_size}
                accentColor="emerald"
                onPageChange={handlePageChange}
              />
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default function CarsPage() {
  return (
    <Suspense
      fallback={<LoadingState message="자동차 검색 화면을 준비 중입니다..." />}
    >
      <CarsSearchContent />
    </Suspense>
  );
}
