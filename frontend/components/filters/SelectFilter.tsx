"use client";

import { FacetOption } from "@/types/api";

interface SelectFilterProps {
  id: string;
  label: string;
  value: string;
  options: FacetOption[];
  placeholder?: string;
  onChange: (value: string) => void;
}

export default function SelectFilter({
  id,
  label,
  value,
  options,
  placeholder = "전체",
  onChange,
}: SelectFilterProps) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-xs font-semibold text-slate-700"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
