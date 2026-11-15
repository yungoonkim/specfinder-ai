"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CarThumbnail from "@/components/common/CarThumbnail";
import DataSourceBanner from "@/components/common/DataSourceBanner";
import ErrorState from "@/components/common/ErrorState";
import LoadingState from "@/components/common/LoadingState";
import { ApiClientError, getCarDetail } from "@/lib/api";
import {
  formatCapturedDate,
  formatNumberUnit,
  formatPriceKrw,
  formatRegistration,
  formatText,
} from "@/lib/format";
import { CarDetail, DataSourceMode } from "@/types/api";

interface CarDetailPageProps {
  params: {
    listingId: string;
  };
}

export default function CarDetailPage({ params }: CarDetailPageProps) {
  const decodedListingId = decodeURIComponent(params.listingId);

  const [allowMockFallback, setAllowMockFallback] = useState<boolean>(
    process.env.NEXT_PUBLIC_USE_MOCK !== "false"
  );
  const [detail, setDetail] = useState<CarDetail | null>(null);
  const [dataSource, setDataSource] = useState<DataSourceMode | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<{
    code: string;
    message: string;
    details?: Record<string, unknown> | null;
  } | null>(null);
  const [reloadTick, setReloadTick] = useState<number>(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    getCarDetail(decodedListingId, {
      allowMockFallback,
      signal: controller.signal,
    })
      .then((res) => {
        setDetail(res.data);
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
                : "자동차 매물 상세 정보를 불러오는 중 오류가 발생했습니다.",
          });
        }
        setLoading(false);
      });

    return () => controller.abort();
  }, [decodedListingId, allowMockFallback, reloadTick]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/cars"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          ← 자동차 검색 목록으로 돌아가기
        </Link>
        <span className="font-mono text-xs text-slate-500">
          매물 ID: {decodedListingId}
        </span>
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

      {loading ? (
        <LoadingState
          message="전기차 매물 상세 정보를 불러오는 중입니다..."
          count={1}
        />
      ) : error || !detail ? (
        <ErrorState
          code={error?.code ?? "NOT_FOUND"}
          message={error?.message ?? "요청한 매물 상세 정보를 찾을 수 없습니다."}
          details={error?.details}
          onRetry={() => setReloadTick((t) => t + 1)}
          onEnableMockFallback={
            !allowMockFallback
              ? () => {
                  setAllowMockFallback(true);
                  setReloadTick((t) => t + 1);
                }
              : undefined
          }
        />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <CarThumbnail
                src={detail.thumbnail_url}
                alt={detail.title || "전기차 매물 대표 이미지"}
                className="h-64 w-full sm:h-72"
              />
            </div>

            <div className="flex flex-col justify-between lg:col-span-7">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                    {formatText(detail.manufacturer)}
                  </span>
                  <span className="rounded-md bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    상태(수집원문): {formatText(detail.status_label)}
                  </span>
                  {detail.flag_extreme_mileage && (
                    <span className="rounded-md bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
                      주행거리 이상치 플래그 (flag_extreme_mileage)
                    </span>
                  )}
                  {detail.flag_future_registration && (
                    <span className="rounded-md bg-rose-100 px-3 py-1 text-xs font-bold text-rose-900">
                      등록연도 이상치 플래그 (flag_future_registration)
                    </span>
                  )}
                </div>

                <h1 className="mt-3 text-2xl font-extrabold text-slate-900 sm:text-3xl">
                  {formatText(detail.title)}
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  모델: {formatText(detail.model)} · 트림:{" "}
                  {formatText(detail.trim)}
                </p>

                <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50/50 p-5">
                  <span className="block text-xs font-semibold text-emerald-700">
                    수집 당시 판매 희망가 (asking_price_krw)
                  </span>
                  <span className="mt-1 block text-2xl font-extrabold text-slate-900">
                    {formatPriceKrw(detail.price_krw)}
                  </span>
                  <p className="mt-1.5 text-xs text-slate-600">
                    ※ 본 가격은 데이터 수집 당시 관측된 판매 희망가이며, 현재 재고 및
                    실제 판매 가능 여부를 보장하지 않습니다. (상태 라벨{" "}
                    <code className="rounded bg-white px-1 py-0.5 font-mono text-[11px]">
                      {formatText(detail.status_label)}
                    </code>{" "}
                    또한 수집 시점 원문입니다.)
                  </p>
                </div>
              </div>

              {detail.tags && detail.tags.length > 0 && (
                <div className="mt-4">
                  <span className="block text-xs font-semibold text-slate-500">
                    원본 매물 태그 (tags)
                  </span>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {detail.tags.map((tag, idx) => (
                      <span
                        key={`${tag}-${idx}`}
                        className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-700"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-base font-bold text-slate-900">매물 상세 제원</h2>
            <dl className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <dt className="text-xs font-medium text-slate-500">
                  제조사 / 모델 / 트림
                </dt>
                <dd className="mt-1 text-sm font-bold text-slate-900">
                  {formatText(detail.manufacturer)} · {formatText(detail.model)}
                </dd>
                <dd className="mt-1 text-xs text-slate-500">
                  트림: {formatText(detail.trim)}
                </dd>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <dt className="text-xs font-medium text-slate-500">
                  등록연월 / 원문 표기
                </dt>
                <dd className="mt-1 text-sm font-bold text-slate-900">
                  {formatRegistration(
                    detail.registration_year,
                    detail.registration_month
                  )}
                </dd>
                <dd className="mt-1 text-xs text-slate-500">
                  원문(registration_text): {formatText(detail.registration_text)}
                </dd>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <dt className="text-xs font-medium text-slate-500">주행거리</dt>
                <dd className="mt-1 text-sm font-bold text-slate-900">
                  {formatNumberUnit(detail.mileage_km, "km")}
                </dd>
                {detail.flag_extreme_mileage && (
                  <dd className="mt-1 text-xs font-semibold text-amber-800">
                    ※ 이상치 주행거리 플래그가 감지된 매물입니다.
                  </dd>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <dt className="text-xs font-medium text-slate-500">
                  판매 지역 (지점)
                </dt>
                <dd className="mt-1 text-sm font-bold text-slate-900">
                  {formatText(detail.branch_or_region)}
                </dd>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <dt className="text-xs font-medium text-slate-500">
                  명시 구동방식 (drive_text_explicit)
                </dt>
                <dd className="mt-1 text-sm font-bold text-slate-900">
                  {formatText(detail.drive_text_explicit)}
                </dd>
                <dd className="mt-1 text-xs text-slate-500">
                  명시되지 않은 경우 임의 추정하지 않음
                </dd>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <dt className="text-xs font-medium text-slate-500">
                  수집 상태 라벨 (status_label)
                </dt>
                <dd className="mt-1 text-sm font-bold text-slate-900">
                  {formatText(detail.status_label)}
                </dd>
                <dd className="mt-1 text-xs text-slate-500">
                  현재 판매 가능 여부를 의미하지 않음
                </dd>
              </div>
            </dl>
          </div>

          <div className="mt-8">
            <h2 className="text-base font-bold text-slate-900">
              매물 설명 (description)
            </h2>
            <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-800">
              {formatText(detail.description)}
            </div>
          </div>

          <div className="mt-8 flex flex-col justify-between gap-3 border-t border-slate-100 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center">
            <div className="space-y-1">
              <p>
                최초 수집 시각(first_captured_at):{" "}
                {formatCapturedDate(detail.first_captured_at)}
              </p>
              <p>
                최근 수집 시각(captured_at):{" "}
                {formatCapturedDate(detail.captured_at)}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              수집 출처 검색 페이지:{" "}
              <span className="font-mono">{formatText(detail.source_url)}</span>{" "}
              (개별 매물 상세 URL 아님)
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
