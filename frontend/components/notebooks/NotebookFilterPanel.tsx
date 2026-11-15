"use client";

import { FormEvent, useEffect, useState } from "react";
import NumberRangeFilter from "@/components/filters/NumberRangeFilter";
import SelectFilter from "@/components/filters/SelectFilter";
import { NotebookFacetsResponse, NotebookFilterParams } from "@/types/api";

export interface NotebookFilterFormValues {
  manufacturer: string;
  cpu_vendor: string;
  cpu_series: string;
  gpu_type: string;
  min_ram_gb: string;
  max_ram_gb: string;
  min_price_krw: string;
  max_price_krw: string;
  min_weight_kg: string;
  max_weight_kg: string;
}

export const EMPTY_NOTEBOOK_FILTER_FORM: NotebookFilterFormValues = {
  manufacturer: "",
  cpu_vendor: "",
  cpu_series: "",
  gpu_type: "",
  min_ram_gb: "",
  max_ram_gb: "",
  min_price_krw: "",
  max_price_krw: "",
  min_weight_kg: "",
  max_weight_kg: "",
};

interface NotebookFilterPanelProps {
  facets: NotebookFacetsResponse;
  appliedParams: NotebookFilterParams;
  onApply: (values: NotebookFilterFormValues) => void;
  onReset: () => void;
}

export default function NotebookFilterPanel({
  facets,
  appliedParams,
  onApply,
  onReset,
}: NotebookFilterPanelProps) {
  const [form, setForm] = useState<NotebookFilterFormValues>(
    EMPTY_NOTEBOOK_FILTER_FORM
  );

  useEffect(() => {
    setForm({
      manufacturer: appliedParams.manufacturer ?? "",
      cpu_vendor: appliedParams.cpu_vendor ?? "",
      cpu_series: appliedParams.cpu_series ?? "",
      gpu_type: appliedParams.gpu_type ?? "",
      min_ram_gb:
        appliedParams.min_ram_gb !== undefined
          ? String(appliedParams.min_ram_gb)
          : "",
      max_ram_gb:
        appliedParams.max_ram_gb !== undefined
          ? String(appliedParams.max_ram_gb)
          : "",
      min_price_krw:
        appliedParams.min_price_krw !== undefined
          ? String(appliedParams.min_price_krw)
          : "",
      max_price_krw:
        appliedParams.max_price_krw !== undefined
          ? String(appliedParams.max_price_krw)
          : "",
      min_weight_kg:
        appliedParams.min_weight_kg !== undefined
          ? String(appliedParams.min_weight_kg)
          : "",
      max_weight_kg:
        appliedParams.max_weight_kg !== undefined
          ? String(appliedParams.max_weight_kg)
          : "",
    });
  }, [appliedParams]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onApply(form);
  };

  const handleReset = () => {
    setForm(EMPTY_NOTEBOOK_FILTER_FORM);
    onReset();
  };

  const updateAndApplySelect = (
    key: keyof Pick<
      NotebookFilterFormValues,
      "manufacturer" | "cpu_vendor" | "cpu_series" | "gpu_type"
    >,
    value: string
  ) => {
    const next = { ...form, [key]: value };
    setForm(next);
    onApply(next);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">노트북 검색 조건</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            가격 필터는 관측 최저가 기준입니다.
          </p>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          조건 초기화
        </button>
      </div>

      <div className="space-y-4">
        <SelectFilter
          id="notebook-manufacturer"
          label="제조사"
          value={form.manufacturer}
          options={facets.manufacturer}
          onChange={(val) => updateAndApplySelect("manufacturer", val)}
        />

        <SelectFilter
          id="notebook-cpu-vendor"
          label="CPU 제조사"
          value={form.cpu_vendor}
          options={facets.cpu_vendor}
          onChange={(val) => updateAndApplySelect("cpu_vendor", val)}
        />

        <SelectFilter
          id="notebook-cpu-series"
          label="CPU 시리즈"
          value={form.cpu_series}
          options={facets.cpu_series}
          onChange={(val) => updateAndApplySelect("cpu_series", val)}
        />

        <SelectFilter
          id="notebook-gpu-type"
          label="GPU 유형"
          value={form.gpu_type}
          options={facets.gpu_type}
          onChange={(val) => updateAndApplySelect("gpu_type", val)}
        />

        <div className="border-t border-slate-100 pt-3">
          <NumberRangeFilter
            idPrefix="notebook-ram"
            label="RAM 용량"
            unit="GB"
            step="1"
            minLimit={0}
            minPlaceholder="최소 (예: 16)"
            maxPlaceholder="최대 (예: 64)"
            minValue={form.min_ram_gb}
            maxValue={form.max_ram_gb}
            onMinChange={(val) => setForm((prev) => ({ ...prev, min_ram_gb: val }))}
            onMaxChange={(val) => setForm((prev) => ({ ...prev, max_ram_gb: val }))}
          />
        </div>

        <NumberRangeFilter
          idPrefix="notebook-price"
          label="관측 최저가 범위"
          unit="원"
          step="10000"
          minLimit={0}
          minPlaceholder="최소 (원)"
          maxPlaceholder="최대 (원)"
          helperText="min_observed_configuration_price_krw 기준 (NULL 제외)"
          minValue={form.min_price_krw}
          maxValue={form.max_price_krw}
          onMinChange={(val) =>
            setForm((prev) => ({ ...prev, min_price_krw: val }))
          }
          onMaxChange={(val) =>
            setForm((prev) => ({ ...prev, max_price_krw: val }))
          }
        />

        <NumberRangeFilter
          idPrefix="notebook-weight"
          label="무게 범위"
          unit="kg"
          step="0.01"
          minLimit={0}
          minPlaceholder="최소 (예: 1.0)"
          maxPlaceholder="최대 (예: 2.0)"
          minValue={form.min_weight_kg}
          maxValue={form.max_weight_kg}
          onMinChange={(val) =>
            setForm((prev) => ({ ...prev, min_weight_kg: val }))
          }
          onMaxChange={(val) =>
            setForm((prev) => ({ ...prev, max_weight_kg: val }))
          }
        />

        <div className="pt-2 flex flex-col gap-2">
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            검색 조건 적용
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            전체 필터 초기화
          </button>
        </div>
      </div>
    </form>
  );
}
