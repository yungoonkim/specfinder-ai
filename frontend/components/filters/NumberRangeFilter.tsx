"use client";

interface NumberRangeFilterProps {
  idPrefix: string;
  label: string;
  unit: string;
  minValue: string;
  maxValue: string;
  minPlaceholder?: string;
  maxPlaceholder?: string;
  step?: string;
  minLimit?: number;
  maxLimit?: number;
  helperText?: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
}

export default function NumberRangeFilter({
  idPrefix,
  label,
  unit,
  minValue,
  maxValue,
  minPlaceholder = "최소",
  maxPlaceholder = "최대",
  step = "1",
  minLimit = 0,
  maxLimit,
  helperText,
  onMinChange,
  onMaxChange,
}: NumberRangeFilterProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-700">
          {label} <span className="font-normal text-slate-500">({unit})</span>
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor={`${idPrefix}-min`} className="sr-only">
            {label} 최소
          </label>
          <input
            id={`${idPrefix}-min`}
            type="number"
            inputMode="decimal"
            min={minLimit}
            max={maxLimit}
            step={step}
            value={minValue}
            placeholder={minPlaceholder}
            onChange={(e) => onMinChange(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-max`} className="sr-only">
            {label} 최대
          </label>
          <input
            id={`${idPrefix}-max`}
            type="number"
            inputMode="decimal"
            min={minLimit}
            max={maxLimit}
            step={step}
            value={maxValue}
            placeholder={maxPlaceholder}
            onChange={(e) => onMaxChange(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>
      {helperText && (
        <p className="text-[11px] text-slate-500">{helperText}</p>
      )}
    </div>
  );
}
