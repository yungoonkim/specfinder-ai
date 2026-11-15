"use client";

import Link from "next/link";
import {
  formatCapturedDate,
  formatCpuSummary,
  formatGpuSummary,
  formatNumberUnit,
  formatPriceKrw,
  formatText,
} from "@/lib/format";
import { NotebookItem } from "@/types/api";

interface NotebookCardProps {
  item: NotebookItem;
}

export default function NotebookCard({ item }: NotebookCardProps) {
  const detailHref = `/notebooks/${encodeURIComponent(item.id)}`;

  return (
    <article className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md">
      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-md bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
              {formatText(item.manufacturer)}
            </span>
            {item.product_type && (
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                {item.product_type}
              </span>
            )}
          </div>
          <span className="font-mono text-[11px] text-slate-400">
            상품코드 #{item.id}
          </span>
        </div>

        <h3 className="text-base font-bold leading-snug text-slate-900">
          <Link href={detailHref} className="hover:text-blue-600 hover:underline">
            {formatText(item.name)}
          </Link>
        </h3>

        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 rounded-lg bg-slate-50 p-3.5 text-xs">
          <div className="col-span-2">
            <dt className="font-medium text-slate-500">CPU</dt>
            <dd className="mt-0.5 font-semibold text-slate-800">
              {formatCpuSummary(item.cpu_vendor, item.cpu_series, item.cpu_model)}
            </dd>
          </div>

          <div className="col-span-2">
            <dt className="font-medium text-slate-500">GPU</dt>
            <dd className="mt-0.5 font-semibold text-slate-800">
              {formatGpuSummary(item.gpu_type, item.gpu_model)}
            </dd>
          </div>

          <div>
            <dt className="font-medium text-slate-500">RAM</dt>
            <dd className="mt-0.5 font-semibold text-slate-800">
              {formatNumberUnit(item.ram_gb, "GB")}
            </dd>
          </div>

          <div>
            <dt className="font-medium text-slate-500">화면 크기</dt>
            <dd className="mt-0.5 font-semibold text-slate-800">
              {formatNumberUnit(item.screen_inches, "인치")}
            </dd>
          </div>

          <div>
            <dt className="font-medium text-slate-500">무게</dt>
            <dd className="mt-0.5 font-semibold text-slate-800">
              {formatNumberUnit(item.weight_kg, "kg")}
            </dd>
          </div>

          <div>
            <dt className="font-medium text-slate-500">저장장치 / OS</dt>
            <dd className="mt-0.5 font-semibold text-slate-800">
              {formatText(item.base_storage_text)} · {formatText(item.os)}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <span className="block text-[11px] font-semibold text-blue-700">
              관측 최저가 (검색 기준)
            </span>
            <span className="text-lg font-extrabold text-slate-900">
              {formatPriceKrw(item.price_krw)}
            </span>
            <span className="mt-0.5 block text-[11px] text-slate-500">
              대표 구성 가격: {formatPriceKrw(item.own_configuration_price_krw)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {item.source_url && item.source_url.trim().length > 0 ? (
              <a
                href={item.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                원본 제품 링크 ↗
              </a>
            ) : (
              <span className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-1.5 text-xs text-slate-400">
                원본 링크 정보 없음
              </span>
            )}
            <Link
              href={detailHref}
              className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              상세 보기
            </Link>
          </div>
        </div>

        <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
          <span>수집 날짜: {formatCapturedDate(item.captured_at)}</span>
          <span>현재 실시간 가격 아님</span>
        </div>
      </div>
    </article>
  );
}
