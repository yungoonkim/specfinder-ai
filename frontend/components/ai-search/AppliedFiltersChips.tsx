"use client";

import Link from "next/link";
import {
  buildConditionSearchUrl,
  sanitizeAIConversationFilters,
} from "@/lib/api";
import { AISearchDomain } from "@/types/api";

interface AppliedFiltersChipsProps {
  domain: AISearchDomain;
  appliedFilters: Record<string, unknown>;
  showConditionSearchLink?: boolean;
  title?: string;
}

const SORT_VALUE_LABELS: Record<string, string> = {
  id_asc: "기본순(ID 오름차순)",
  price_asc: "가격 낮은순",
  price_desc: "가격 높은순",
  ram_desc: "RAM 용량 높은순",
  weight_asc: "무게 가벼운순",
  mileage_asc: "주행거리 짧은순",
  year_desc: "등록연도 최신순",
  newest_capture: "수집 날짜 최신순",
};

export function formatAppliedFilterChip(
  domain: AISearchDomain,
  key: string,
  value: unknown
): string | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const priceLabel = domain === "notebooks" ? "관측 최저가" : "판매 희망가";

  switch (key) {
    case "manufacturer":
      return `제조사: ${String(value)}`;
    case "model":
      return `모델: ${String(value)}`;
    case "cpu_vendor":
      return `CPU 제조사: ${String(value)}`;
    case "cpu_series":
      return `CPU 시리즈: ${String(value)}`;
    case "gpu_type":
      return `GPU 유형: ${String(value)}`;
    case "min_ram_gb":
      return `RAM ≥ ${Number(value).toLocaleString("ko-KR")}GB`;
    case "max_ram_gb":
      return `RAM ≤ ${Number(value).toLocaleString("ko-KR")}GB`;
    case "min_price_krw":
      return `${priceLabel} ≥ ${Number(value).toLocaleString("ko-KR")}원`;
    case "max_price_krw":
      return `${priceLabel} ≤ ${Number(value).toLocaleString("ko-KR")}원`;
    case "min_weight_kg":
      return `무게 ≥ ${Number(value).toLocaleString("ko-KR")}kg`;
    case "max_weight_kg":
      return `무게 ≤ ${Number(value).toLocaleString("ko-KR")}kg`;
    case "registration_year_min":
      return `등록연도 ≥ ${String(value)}년`;
    case "registration_year_max":
      return `등록연도 ≤ ${String(value)}년`;
    case "min_mileage_km":
      return `주행거리 ≥ ${Number(value).toLocaleString("ko-KR")}km`;
    case "max_mileage_km":
      return `주행거리 ≤ ${Number(value).toLocaleString("ko-KR")}km`;
    case "branch_or_region":
      return `지역: ${String(value)}`;
    case "sort": {
      const sortKey = String(value);
      if (sortKey === "id_asc") return null;
      return `정렬: ${SORT_VALUE_LABELS[sortKey] || sortKey}`;
    }
    case "page": {
      const pageNum = Number(value);
      return pageNum > 1 ? `페이지: ${pageNum}` : null;
    }
    case "page_size": {
      const sizeNum = Number(value);
      return sizeNum !== 20 ? `표시 개수: ${sizeNum}개` : null;
    }
    default:
      return `${key}: ${String(value)}`;
  }
}

export default function AppliedFiltersChips({
  domain,
  appliedFilters,
  showConditionSearchLink = true,
  title = "적용된 검색 조건",
}: AppliedFiltersChipsProps) {
  const sanitized = sanitizeAIConversationFilters(domain, appliedFilters);
  const chips: Array<{ key: string; label: string }> = [];

  for (const [key, value] of Object.entries(sanitized)) {
    const label = formatAppliedFilterChip(domain, key, value);
    if (label) {
      chips.push({ key, label });
    }
  }

  const conditionSearchHref = buildConditionSearchUrl(domain, sanitized);
  const isNotebook = domain === "notebooks";

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 ${
        isNotebook
          ? "border-blue-100 bg-blue-50/70"
          : "border-emerald-100 bg-emerald-50/70"
      }`}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <span
          className={`mr-1 text-xs font-semibold ${
            isNotebook ? "text-blue-900" : "text-emerald-900"
          }`}
        >
          {title}:
        </span>
        {chips.length > 0 ? (
          chips.map((chip) => (
            <span
              key={chip.key}
              className={`inline-flex items-center rounded-full border bg-white px-2.5 py-0.5 text-xs font-semibold shadow-sm ${
                isNotebook
                  ? "border-blue-200 text-blue-800"
                  : "border-emerald-200 text-emerald-800"
              }`}
            >
              {chip.label}
            </span>
          ))
        ) : (
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-medium text-slate-600">
            전체 조회 (세부 조건 없음)
          </span>
        )}
      </div>

      {showConditionSearchLink && (
        <Link
          href={conditionSearchHref}
          className={`inline-flex items-center gap-1 rounded-lg border bg-white px-3 py-1 text-xs font-semibold shadow-sm transition ${
            isNotebook
              ? "border-blue-200 text-blue-700 hover:bg-blue-100"
              : "border-emerald-200 text-emerald-700 hover:bg-emerald-100"
          }`}
        >
          <span>조건 검색에서 전체 보기</span>
          <span aria-hidden="true">→</span>
        </Link>
      )}
    </div>
  );
}
