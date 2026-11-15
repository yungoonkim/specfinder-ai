const INFO_MISSING = "정보 없음";

export function formatText(value: string | null | undefined): string {
  if (value === null || value === undefined) return INFO_MISSING;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : INFO_MISSING;
}

export function formatPriceKrw(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return INFO_MISSING;
  }
  return `${ value.toLocaleString("ko-KR") }원`;
}

export function formatNumberUnit(
  value: number | null | undefined,
  unit: string
): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return INFO_MISSING;
  }
  return `${ value.toLocaleString("ko-KR") }${ unit }`;
}

export function formatRegistration(
  year: number | null | undefined,
  month: number | null | undefined
): string {
  if (year === null || year === undefined) {
    return INFO_MISSING;
  }
  if (month === null || month === undefined) {
    return `${ year }년`;
  }
  return `${ year }년 ${ month }월`;
}

export function formatCapturedDate(iso: string | null | undefined): string {
  if (!iso || iso.trim().length === 0) {
    return INFO_MISSING;
  }
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return iso;
  }
  const yyyy = parsed.getFullYear();
  const mm = String(parsed.getMonth() + 1).padStart(2, "0");
  const dd = String(parsed.getDate()).padStart(2, "0");
  const hh = String(parsed.getHours()).padStart(2, "0");
  const min = String(parsed.getMinutes()).padStart(2, "0");
  return `${ yyyy }-${ mm }-${ dd } ${ hh }:${ min }`;
}

export function formatCpuSummary(
  vendor: string | null | undefined,
  series: string | null | undefined,
  model: string | null | undefined
): string {
  const parts = [vendor, series, model]
    .map((part) => (part ? part.trim() : ""))
    .filter((part) => part.length > 0);
  return parts.length > 0 ? parts.join(" ") : INFO_MISSING;
}

export function formatGpuSummary(
  gpuType: string | null | undefined,
  gpuModel: string | null | undefined
): string {
  const parts = [gpuType, gpuModel]
    .map((part) => (part ? part.trim() : ""))
    .filter((part) => part.length > 0);
  return parts.length > 0 ? parts.join(" · ") : INFO_MISSING;
}
