"use client";

import Link from "next/link";
import CarThumbnail from "@/components/common/CarThumbnail";
import {
  formatCapturedDate,
  formatNumberUnit,
  formatPriceKrw,
  formatRegistration,
  formatText,
} from "@/lib/format";
import { CarItem } from "@/types/api";

interface CarCardProps {
  item: CarItem;
}

export default function CarCard({ item }: CarCardProps) {
  const detailHref = `/cars/${encodeURIComponent(item.id)}`;
  const manufacturerModel = [item.manufacturer, item.model, item.trim]
    .map((part) => (part ? part.trim() : ""))
    .filter((part) => part.length > 0)
    .join(" · ");

  return (
    <article className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md">
      <div>
        <Link href={detailHref} className="block">
          <CarThumbnail
            src={item.thumbnail_url}
            alt={item.title || "전기차 매물 이미지"}
            className="mb-3.5 h-44 w-full"
          />
        </Link>

        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-md bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
              {formatText(item.manufacturer)}
            </span>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
              상태(수집원문): {formatText(item.status_label)}
            </span>
            {item.flag_extreme_mileage && (
              <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900">
                주행거리 이상치 주의
              </span>
            )}
          </div>
          <span className="font-mono text-[11px] text-slate-400">
            {item.id}
          </span>
        </div>

        <h3 className="text-base font-bold leading-snug text-slate-900">
          <Link
            href={detailHref}
            className="hover:text-emerald-700 hover:underline"
          >
            {formatText(item.title)}
          </Link>
        </h3>
        <p className="mt-1 text-xs text-slate-600">
          {manufacturerModel || "정보 없음"}
        </p>

        <dl className="mt-3.5 grid grid-cols-2 gap-x-4 gap-y-2.5 rounded-lg bg-slate-50 p-3.5 text-xs">
          <div>
            <dt className="font-medium text-slate-500">등록연도</dt>
            <dd className="mt-0.5 font-semibold text-slate-800">
              {formatRegistration(
                item.registration_year,
                item.registration_month
              )}
            </dd>
          </div>

          <div>
            <dt className="font-medium text-slate-500">주행거리</dt>
            <dd className="mt-0.5 font-semibold text-slate-800">
              {formatNumberUnit(item.mileage_km, "km")}
            </dd>
          </div>

          <div>
            <dt className="font-medium text-slate-500">판매 지역</dt>
            <dd className="mt-0.5 font-semibold text-slate-800">
              {formatText(item.branch_or_region)}
            </dd>
          </div>

          <div>
            <dt className="font-medium text-slate-500">명시 구동방식</dt>
            <dd className="mt-0.5 font-semibold text-slate-800">
              {formatText(item.drive_text_explicit)}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <span className="block text-[11px] font-semibold text-emerald-700">
              수집 당시 판매 희망가
            </span>
            <span className="text-lg font-extrabold text-slate-900">
              {formatPriceKrw(item.price_krw)}
            </span>
            <span className="mt-0.5 block text-[11px] text-slate-500">
              실시간 재고·현재 판매 가능 여부 보장 안 함
            </span>
          </div>

          <Link
            href={detailHref}
            className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            매물 상세 보기
          </Link>
        </div>

        <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
          <span>수집 날짜: {formatCapturedDate(item.captured_at)}</span>
          <span>스냅샷 매물 정보</span>
        </div>
      </div>
    </article>
  );
}
