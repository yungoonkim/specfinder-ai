"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DataSourceBanner from "@/components/common/DataSourceBanner";
import ErrorState from "@/components/common/ErrorState";
import LoadingState from "@/components/common/LoadingState";
import {
  ApiClientError,
  DEFAULT_ALLOW_MOCK_FALLBACK,
  getNotebookDetail,
  getStoredMockFallbackPreference,
  setStoredMockFallbackPreference,
} from "@/lib/api";
import {
  formatCapturedDate,
  formatCpuSummary,
  formatGpuSummary,
  formatNumberUnit,
  formatPriceKrw,
  formatText,
  safeDecodeURIComponent,
} from "@/lib/format";
import { DataSourceMode, NotebookDetail } from "@/types/api";

interface NotebookDetailPageProps {
  params: {
    productCode: string;
  };
}

export default function NotebookDetailPage({ params }: NotebookDetailPageProps) {
  const decodedProductCode = safeDecodeURIComponent(params.productCode);

  const [allowMockFallback, setAllowMockFallback] = useState<boolean>(
    DEFAULT_ALLOW_MOCK_FALLBACK
  );
  const [detail, setDetail] = useState<NotebookDetail | null>(null);
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

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    getNotebookDetail(decodedProductCode, {
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
                : "노트북 상세 정보를 불러오는 중 오류가 발생했습니다.",
          });
        }
        setLoading(false);
      });

    return () => controller.abort();
  }, [decodedProductCode, allowMockFallback, reloadTick]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href="/notebooks"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          ← 노트북 검색 목록으로 돌아가기
        </Link>
        <span className="font-mono text-xs text-slate-500">
          상품코드: {decodedProductCode}
        </span>
      </div>

      <DataSourceBanner
        source={dataSource}
        allowMockFallback={allowMockFallback}
        onToggleMockFallback={handleToggleMockFallback}
        onRetryApi={() => setReloadTick((t) => t + 1)}
      />

      {loading ? (
        <LoadingState
          message="노트북 상세 스펙 정보를 불러오는 중입니다..."
          count={1}
        />
      ) : error || !detail ? (
        <ErrorState
          code={error?.code ?? "NOT_FOUND"}
          message={error?.message ?? "노트북 상세 정보를 찾을 수 없습니다."}
          details={error?.details}
          onRetry={() => setReloadTick((t) => t + 1)}
          onEnableMockFallback={
            !allowMockFallback
              ? () => handleToggleMockFallback(true)
              : undefined
          }
        />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
              {formatText(detail.manufacturer)}
            </span>
            <span className="rounded-md bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              유형: {formatText(detail.product_type)}
            </span>
            <span className="rounded-md bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              등록월: {formatText(detail.registered_month)}
            </span>
          </div>

          <h1 className="mt-3 text-2xl font-extrabold text-slate-900 sm:text-3xl">
            {formatText(detail.name)}
          </h1>

          <div className="mt-6 grid grid-cols-1 gap-4 rounded-xl border border-blue-100 bg-blue-50/50 p-5 sm:grid-cols-3">
            <div>
              <span className="block text-xs font-semibold text-blue-700">
                관측 최저가 (검색/정렬 기준)
              </span>
              <span className="mt-1 block text-2xl font-extrabold text-slate-900">
                {formatPriceKrw(detail.price_krw)}
              </span>
              <span className="mt-1 block text-[11px] text-slate-500">
                필드: min_observed_configuration_price_krw
              </span>
            </div>

            <div>
              <span className="block text-xs font-semibold text-slate-600">
                대표 구성 가격 (개별 구성가)
              </span>
              <span className="mt-1 block text-xl font-bold text-slate-800">
                {formatPriceKrw(detail.own_configuration_price_krw)}
              </span>
              <span className="mt-1 block text-[11px] text-slate-500">
                필드: own_configuration_price_krw
              </span>
            </div>

            <div>
              <span className="block text-xs font-semibold text-slate-600">
                관측된 구성 개수
              </span>
              <span className="mt-1 block text-xl font-bold text-slate-800">
                {formatNumberUnit(detail.observed_configuration_count, "개")}
              </span>
              <span className="mt-1 block text-[11px] text-slate-500">
                수집 시각: {formatCapturedDate(detail.captured_at)}
              </span>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-base font-bold text-slate-900">주요 정규화 사양</h2>
            <dl className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <dt className="text-xs font-medium text-slate-500">
                  CPU (제조사 · 시리즈 · 모델)
                </dt>
                <dd className="mt-1 text-sm font-bold text-slate-900">
                  {formatCpuSummary(
                    detail.cpu_vendor,
                    detail.cpu_series,
                    detail.cpu_model
                  )}
                </dd>
                <dd className="mt-1 text-xs text-slate-500">
                  제조사: {formatText(detail.cpu_vendor)} / 시리즈:{" "}
                  {formatText(detail.cpu_series)}
                </dd>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <dt className="text-xs font-medium text-slate-500">
                  GPU (유형 · 모델)
                </dt>
                <dd className="mt-1 text-sm font-bold text-slate-900">
                  {formatGpuSummary(detail.gpu_type, detail.gpu_model)}
                </dd>
                <dd className="mt-1 text-xs text-slate-500">
                  유형: {formatText(detail.gpu_type)}
                </dd>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <dt className="text-xs font-medium text-slate-500">RAM 용량</dt>
                <dd className="mt-1 text-sm font-bold text-slate-900">
                  {formatNumberUnit(detail.ram_gb, "GB")}
                </dd>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <dt className="text-xs font-medium text-slate-500">화면 크기</dt>
                <dd className="mt-1 text-sm font-bold text-slate-900">
                  {formatNumberUnit(detail.screen_inches, "인치")}
                </dd>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <dt className="text-xs font-medium text-slate-500">무게</dt>
                <dd className="mt-1 text-sm font-bold text-slate-900">
                  {formatNumberUnit(detail.weight_kg, "kg")}
                </dd>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <dt className="text-xs font-medium text-slate-500">
                  기본 저장장치 / 운영체제(OS)
                </dt>
                <dd className="mt-1 text-sm font-bold text-slate-900">
                  {formatText(detail.base_storage_text)} / {formatText(detail.os)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="mt-8">
            <h2 className="text-base font-bold text-slate-900">
              원본 상세 스펙 요약 (specs_text)
            </h2>
            <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-800">
              {formatText(detail.specs_text)}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-6">
            <div className="text-xs text-slate-500">
              데이터 수집 시각: {formatCapturedDate(detail.captured_at)} · 등록월 표기:{" "}
              {formatText(detail.registered_month)}
            </div>
            {detail.source_url && detail.source_url.trim().length > 0 ? (
              <a
                href={detail.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                원본 제품 페이지(다나와) 열기 ↗
              </a>
            ) : (
              <span className="text-xs text-slate-400">원본 제품 링크: 정보 없음</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
