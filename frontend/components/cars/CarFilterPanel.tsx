"use client";

import { FormEvent, useEffect, useState } from "react";
import NumberRangeFilter from "@/components/filters/NumberRangeFilter";
import SelectFilter from "@/components/filters/SelectFilter";
import { CarFacetsResponse, CarFilterParams } from "@/types/api";

export interface CarFilterFormValues {
  manufacturer: string;
  model: string;
  registration_year_min: string;
  registration_year_max: string;
  min_price_krw: string;
  max_price_krw: string;
  min_mileage_km: string;
  max_mileage_km: string;
  branch_or_region: string;
}

export const EMPTY_CAR_FILTER_FORM: CarFilterFormValues = {
  manufacturer: "",
  model: "",
  registration_year_min: "",
  registration_year_max: "",
  min_price_krw: "",
  max_price_krw: "",
  min_mileage_km: "",
  max_mileage_km: "",
  branch_or_region: "",
};

interface CarFilterPanelProps {
  facets: CarFacetsResponse;
  appliedParams: CarFilterParams;
  onApply: (values: CarFilterFormValues) => void;
  onReset: () => void;
}

export default function CarFilterPanel({
  facets,
  appliedParams,
  onApply,
  onReset,
}: CarFilterPanelProps) {
  const [form, setForm] = useState<CarFilterFormValues>(EMPTY_CAR_FILTER_FORM);
  const [mobileExpanded, setMobileExpanded] = useState<boolean>(true);

  useEffect(() => {
    setForm({
      manufacturer: appliedParams.manufacturer ?? "",
      model: appliedParams.model ?? "",
      registration_year_min:
        appliedParams.registration_year_min !== undefined
          ? String(appliedParams.registration_year_min)
          : "",
      registration_year_max:
        appliedParams.registration_year_max !== undefined
          ? String(appliedParams.registration_year_max)
          : "",
      min_price_krw:
        appliedParams.min_price_krw !== undefined
          ? String(appliedParams.min_price_krw)
          : "",
      max_price_krw:
        appliedParams.max_price_krw !== undefined
          ? String(appliedParams.max_price_krw)
          : "",
      min_mileage_km:
        appliedParams.min_mileage_km !== undefined
          ? String(appliedParams.min_mileage_km)
          : "",
      max_mileage_km:
        appliedParams.max_mileage_km !== undefined
          ? String(appliedParams.max_mileage_km)
          : "",
      branch_or_region: appliedParams.branch_or_region ?? "",
    });
  }, [appliedParams]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onApply(form);
  };

  const handleReset = () => {
    setForm(EMPTY_CAR_FILTER_FORM);
    onReset();
  };

  const updateAndApplySelect = (
    key: keyof Pick<
      CarFilterFormValues,
      "manufacturer" | "model" | "branch_or_region"
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
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">자동차 검색 조건</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            수집 당시 판매 희망가 기준입니다.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleReset}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            조건 초기화
          </button>
          <button
            type="button"
            onClick={() => setMobileExpanded((prev) => !prev)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 lg:hidden"
          >
            {mobileExpanded ? "접기 ▲" : "펼치기 ▼"}
          </button>
        </div>
      </div>

      <div
        className={`mt-4 space-y-4 ${
          mobileExpanded ? "block" : "hidden lg:block"
        }`}
      >
        <SelectFilter
          id="car-manufacturer"
          label="제조사"
          value={form.manufacturer}
          options={facets.manufacturer}
          onChange={(val) => updateAndApplySelect("manufacturer", val)}
        />

        <SelectFilter
          id="car-model"
          label="모델"
          value={form.model}
          options={facets.model}
          onChange={(val) => updateAndApplySelect("model", val)}
        />

        <SelectFilter
          id="car-region"
          label="판매 지역 (지점)"
          value={form.branch_or_region}
          options={facets.branch_or_region}
          onChange={(val) => updateAndApplySelect("branch_or_region", val)}
        />

        <div className="border-t border-slate-100 pt-3">
          <NumberRangeFilter
            idPrefix="car-year"
            label="등록 연도 범위"
            unit="년"
            step="1"
            minLimit={1900}
            maxLimit={2100}
            minPlaceholder="최소 (예: 2021)"
            maxPlaceholder="최대 (예: 2025)"
            minValue={form.registration_year_min}
            maxValue={form.registration_year_max}
            onMinChange={(val) =>
              setForm((prev) => ({ ...prev, registration_year_min: val }))
            }
            onMaxChange={(val) =>
              setForm((prev) => ({ ...prev, registration_year_max: val }))
            }
          />
        </div>

        <NumberRangeFilter
          idPrefix="car-price"
          label="수집 당시 판매 희망가 범위"
          unit="원"
          step="100000"
          minLimit={0}
          minPlaceholder="최소 (원)"
          maxPlaceholder="최대 (원)"
          helperText="asking_price_krw 기준 (현재 판매 여부 보장 안 함)"
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
          idPrefix="car-mileage"
          label="주행거리 범위"
          unit="km"
          step="1000"
          minLimit={0}
          minPlaceholder="최소 (km)"
          maxPlaceholder="최대 (km)"
          minValue={form.min_mileage_km}
          maxValue={form.max_mileage_km}
          onMinChange={(val) =>
            setForm((prev) => ({ ...prev, min_mileage_km: val }))
          }
          onMaxChange={(val) =>
            setForm((prev) => ({ ...prev, max_mileage_km: val }))
          }
        />

        <div className="flex flex-col gap-2 pt-2">
          <button
            type="submit"
            className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
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
