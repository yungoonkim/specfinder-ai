import {
  AIConversationContext,
  AISearchDomain,
  AISearchRequest,
  AISearchResponse,
  ApiErrorPayload,
  ApiResultWithSource,
  CarDetail,
  CarFacetsResponse,
  CarFilterParams,
  CarSearchResponse,
  HealthResponse,
  NotebookDetail,
  NotebookFacetsResponse,
  NotebookFilterParams,
  NotebookSearchResponse,
} from "@/types/api";
import {
  getMockCarFacets,
  getMockNotebookFacets,
  MOCK_CAR_DETAILS,
  MOCK_NOTEBOOK_DETAILS,
  searchMockCars,
  searchMockNotebooks,
} from "@/lib/mock-data";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
  "http://localhost:8000";

export const DEFAULT_ALLOW_MOCK_FALLBACK =
  process.env.NEXT_PUBLIC_USE_MOCK !== "false";

const MOCK_PREF_STORAGE_KEY = "specfinder_allow_mock_fallback";

export function getStoredMockFallbackPreference(): boolean {
  if (typeof window === "undefined") {
    return DEFAULT_ALLOW_MOCK_FALLBACK;
  }
  try {
    const stored = window.sessionStorage.getItem(MOCK_PREF_STORAGE_KEY);
    if (stored === "true") return true;
    if (stored === "false") return false;
  } catch {
    // Ignore sessionStorage errors in restricted environments
  }
  return DEFAULT_ALLOW_MOCK_FALLBACK;
}

export function setStoredMockFallbackPreference(allow: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(MOCK_PREF_STORAGE_KEY, String(allow));
  } catch {
    // Ignore sessionStorage errors
  }
}

export class ApiClientError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: Record<string, unknown> | null;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: Record<string, unknown> | null
  ) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export interface RequestOptions {
  allowMockFallback?: boolean;
  signal?: AbortSignal;
}

function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }
    searchParams.set(key, String(value));
  }
  const qs = searchParams.toString();
  return qs ? `?${qs}` : "";
}

function validateNotebookRanges(params: NotebookFilterParams): void {
  if (
    params.min_ram_gb !== undefined &&
    params.max_ram_gb !== undefined &&
    params.min_ram_gb > params.max_ram_gb
  ) {
    throw new ApiClientError(
      422,
      "INVALID_FILTER",
      "RAM 최소값은 최대값보다 클 수 없습니다.",
      { field: "min_ram_gb", reason: "min_ram_gb must be <= max_ram_gb" }
    );
  }
  if (
    params.min_price_krw !== undefined &&
    params.max_price_krw !== undefined &&
    params.min_price_krw > params.max_price_krw
  ) {
    throw new ApiClientError(
      422,
      "INVALID_FILTER",
      "가격 최소값은 최대값보다 클 수 없습니다.",
      { field: "min_price_krw", reason: "min_price_krw must be <= max_price_krw" }
    );
  }
  if (
    params.min_weight_kg !== undefined &&
    params.max_weight_kg !== undefined &&
    params.min_weight_kg > params.max_weight_kg
  ) {
    throw new ApiClientError(
      422,
      "INVALID_FILTER",
      "무게 최소값은 최대값보다 클 수 없습니다.",
      { field: "min_weight_kg", reason: "min_weight_kg must be <= max_weight_kg" }
    );
  }
}

function validateCarRanges(params: CarFilterParams): void {
  if (
    params.registration_year_min !== undefined &&
    params.registration_year_max !== undefined &&
    params.registration_year_min > params.registration_year_max
  ) {
    throw new ApiClientError(
      422,
      "INVALID_FILTER",
      "등록연도 최소값은 최대값보다 클 수 없습니다.",
      {
        field: "registration_year_min",
        reason: "registration_year_min must be <= registration_year_max",
      }
    );
  }
  if (
    params.min_price_krw !== undefined &&
    params.max_price_krw !== undefined &&
    params.min_price_krw > params.max_price_krw
  ) {
    throw new ApiClientError(
      422,
      "INVALID_FILTER",
      "희망가 최소값은 최대값보다 클 수 없습니다.",
      { field: "min_price_krw", reason: "min_price_krw must be <= max_price_krw" }
    );
  }
  if (
    params.min_mileage_km !== undefined &&
    params.max_mileage_km !== undefined &&
    params.min_mileage_km > params.max_mileage_km
  ) {
    throw new ApiClientError(
      422,
      "INVALID_FILTER",
      "주행거리 최소값은 최대값보다 클 수 없습니다.",
      {
        field: "min_mileage_km",
        reason: "min_mileage_km must be <= max_mileage_km",
      }
    );
  }
}

async function fetchJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw err;
    }
    throw new ApiClientError(
      0,
      "NETWORK_ERROR",
      `FastAPI 서버(${API_BASE_URL})에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해 주세요.`,
      { url }
    );
  }

  if (!response.ok) {
    let payload: Partial<ApiErrorPayload> | null = null;
    try {
      payload = (await response.json()) as Partial<ApiErrorPayload>;
    } catch {
      payload = null;
    }
    const code =
      payload?.code ||
      (response.status === 404
        ? "NOT_FOUND"
        : response.status === 422
        ? "INVALID_FILTER"
        : response.status === 503
        ? "DB_UNAVAILABLE"
        : "INTERNAL_ERROR");
    const message =
      payload?.message ||
      (response.status === 404
        ? "요청한 상품 또는 매물을 찾을 수 없습니다."
        : response.status === 422
        ? "검색 조건을 확인해 주세요."
        : "서버 요청 처리 중 오류가 발생했습니다.");
    throw new ApiClientError(response.status, code, message, payload?.details);
  }

  return (await response.json()) as T;
}

export async function checkHealth(
  signal?: AbortSignal
): Promise<HealthResponse> {
  return fetchJson<HealthResponse>("/api/health", signal);
}

export async function getNotebookFacets(
  options: RequestOptions = {}
): Promise<ApiResultWithSource<NotebookFacetsResponse>> {
  const allowMock =
    options.allowMockFallback ?? getStoredMockFallbackPreference();
  try {
    const data = await fetchJson<NotebookFacetsResponse>(
      "/api/notebooks/facets",
      options.signal
    );
    return { data, source: "api" };
  } catch (err) {
    if (
      allowMock &&
      err instanceof ApiClientError &&
      err.code === "NETWORK_ERROR"
    ) {
      return { data: getMockNotebookFacets(), source: "mock" };
    }
    throw err;
  }
}

export async function searchNotebooks(
  params: NotebookFilterParams,
  options: RequestOptions = {}
): Promise<ApiResultWithSource<NotebookSearchResponse>> {
  validateNotebookRanges(params);
  const allowMock =
    options.allowMockFallback ?? getStoredMockFallbackPreference();
  const qs = buildQueryString(params as Record<string, unknown>);
  try {
    const data = await fetchJson<NotebookSearchResponse>(
      `/api/notebooks${qs}`,
      options.signal
    );
    return { data, source: "api" };
  } catch (err) {
    if (
      allowMock &&
      err instanceof ApiClientError &&
      err.code === "NETWORK_ERROR"
    ) {
      return { data: searchMockNotebooks(params), source: "mock" };
    }
    throw err;
  }
}

export async function getNotebookDetail(
  productCode: string,
  options: RequestOptions = {}
): Promise<ApiResultWithSource<NotebookDetail>> {
  const allowMock =
    options.allowMockFallback ?? getStoredMockFallbackPreference();
  const encoded = encodeURIComponent(productCode);
  try {
    const data = await fetchJson<NotebookDetail>(
      `/api/notebooks/${encoded}`,
      options.signal
    );
    return { data, source: "api" };
  } catch (err) {
    if (
      allowMock &&
      err instanceof ApiClientError &&
      err.code === "NETWORK_ERROR"
    ) {
      const found = MOCK_NOTEBOOK_DETAILS.find((item) => item.id === productCode);
      if (!found) {
        throw new ApiClientError(
          404,
          "NOT_FOUND",
          `노트북 상품(ID: ${productCode})을 찾을 수 없습니다.`
        );
      }
      return { data: found, source: "mock" };
    }
    throw err;
  }
}

export async function getCarFacets(
  options: RequestOptions = {}
): Promise<ApiResultWithSource<CarFacetsResponse>> {
  const allowMock =
    options.allowMockFallback ?? getStoredMockFallbackPreference();
  try {
    const data = await fetchJson<CarFacetsResponse>(
      "/api/cars/facets",
      options.signal
    );
    return { data, source: "api" };
  } catch (err) {
    if (
      allowMock &&
      err instanceof ApiClientError &&
      err.code === "NETWORK_ERROR"
    ) {
      return { data: getMockCarFacets(), source: "mock" };
    }
    throw err;
  }
}

export async function searchCars(
  params: CarFilterParams,
  options: RequestOptions = {}
): Promise<ApiResultWithSource<CarSearchResponse>> {
  validateCarRanges(params);
  const allowMock =
    options.allowMockFallback ?? getStoredMockFallbackPreference();
  const qs = buildQueryString(params as Record<string, unknown>);
  try {
    const data = await fetchJson<CarSearchResponse>(
      `/api/cars${qs}`,
      options.signal
    );
    return { data, source: "api" };
  } catch (err) {
    if (
      allowMock &&
      err instanceof ApiClientError &&
      err.code === "NETWORK_ERROR"
    ) {
      return { data: searchMockCars(params), source: "mock" };
    }
    throw err;
  }
}

export async function getCarDetail(
  listingId: string,
  options: RequestOptions = {}
): Promise<ApiResultWithSource<CarDetail>> {
  const allowMock =
    options.allowMockFallback ?? getStoredMockFallbackPreference();
  const encoded = encodeURIComponent(listingId);
  try {
    const data = await fetchJson<CarDetail>(
      `/api/cars/${encoded}`,
      options.signal
    );
    return { data, source: "api" };
  } catch (err) {
    if (
      allowMock &&
      err instanceof ApiClientError &&
      err.code === "NETWORK_ERROR"
    ) {
      const found = MOCK_CAR_DETAILS.find((item) => item.id === listingId);
      if (!found) {
        throw new ApiClientError(
          404,
          "NOT_FOUND",
          `자동차 매물(ID: ${listingId})을 찾을 수 없습니다.`
        );
      }
      return { data: found, source: "mock" };
    }
    throw err;
  }
}

export const ALLOWED_NOTEBOOK_FILTER_KEYS = [
  "manufacturer",
  "cpu_vendor",
  "cpu_series",
  "gpu_type",
  "min_ram_gb",
  "max_ram_gb",
  "min_price_krw",
  "max_price_krw",
  "min_weight_kg",
  "max_weight_kg",
  "page",
  "page_size",
  "sort",
] as const;

export const ALLOWED_CAR_FILTER_KEYS = [
  "manufacturer",
  "model",
  "registration_year_min",
  "registration_year_max",
  "min_mileage_km",
  "max_mileage_km",
  "min_price_krw",
  "max_price_krw",
  "branch_or_region",
  "page",
  "page_size",
  "sort",
] as const;

export function sanitizeAIConversationFilters(
  domain: AISearchDomain,
  rawFilters: Record<string, unknown> | null | undefined
): Record<string, unknown> {
  if (!rawFilters || typeof rawFilters !== "object") {
    return {};
  }
  const allowedSet = new Set<string>(
    domain === "notebooks"
      ? ALLOWED_NOTEBOOK_FILTER_KEYS
      : ALLOWED_CAR_FILTER_KEYS
  );
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(rawFilters)) {
    if (!allowedSet.has(key)) {
      continue;
    }
    if (value === null || value === undefined || value === "") {
      continue;
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed || trimmed.length > 200) {
        continue;
      }
      sanitized[key] = trimmed;
      continue;
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export function buildConditionSearchUrl(
  domain: AISearchDomain,
  appliedFilters: Record<string, unknown> | null | undefined
): string {
  const basePath = domain === "notebooks" ? "/notebooks" : "/cars";
  const sanitized = sanitizeAIConversationFilters(domain, appliedFilters);
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(sanitized)) {
    if (key === "page" || key === "page_size") {
      continue;
    }
    if (key === "sort" && value === "id_asc") {
      continue;
    }
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export async function searchAI(
  request: AISearchRequest,
  options: { signal?: AbortSignal } = {}
): Promise<AISearchResponse> {
  const trimmedMessage = request.message.trim();
  if (!trimmedMessage) {
    throw new ApiClientError(
      422,
      "INVALID_AI_REQUEST",
      "검색할 문장을 입력해 주세요.",
      { field: "message", reason: "message must not be blank" }
    );
  }
  if (trimmedMessage.length > 2000) {
    throw new ApiClientError(
      422,
      "INVALID_AI_REQUEST",
      "질문은 최대 2,000자까지 입력할 수 있습니다.",
      { field: "message", reason: "message may not exceed 2000 characters" }
    );
  }

  let safeContext: AIConversationContext | null = null;
  if (
    request.conversation_context &&
    (!request.domain ||
      request.conversation_context.domain === request.domain)
  ) {
    safeContext = {
      domain: request.conversation_context.domain,
      filters: sanitizeAIConversationFilters(
        request.conversation_context.domain,
        request.conversation_context.filters
      ),
    };
  }

  const payload: AISearchRequest = {
    domain: request.domain ?? null,
    message: trimmedMessage,
    conversation_context: safeContext,
  };

  const url = `${API_BASE_URL}/api/ai/search`;
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: options.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw err;
    }
    throw new ApiClientError(
      0,
      "NETWORK_ERROR",
      `FastAPI 서버(${API_BASE_URL})에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해 주세요.`,
      { url }
    );
  }

  if (!response.ok) {
    let errorBody: Record<string, unknown> | null = null;
    try {
      errorBody = (await response.json()) as Record<string, unknown>;
    } catch {
      errorBody = null;
    }

    const nestedDetail =
      errorBody &&
      typeof errorBody.detail === "object" &&
      errorBody.detail !== null
        ? (errorBody.detail as Record<string, unknown>)
        : null;
    const sourceObj = nestedDetail ?? errorBody;

    const rawCode =
      sourceObj && typeof sourceObj.code === "string"
        ? sourceObj.code
        : undefined;
    const rawMessage =
      sourceObj && typeof sourceObj.message === "string"
        ? sourceObj.message
        : undefined;
    const rawDetails =
      sourceObj &&
      typeof sourceObj.details === "object" &&
      sourceObj.details !== null
        ? (sourceObj.details as Record<string, unknown>)
        : null;

    const code =
      rawCode ||
      (response.status === 422
        ? "INVALID_AI_REQUEST"
        : response.status === 502
        ? "AI_MODEL_ERROR"
        : response.status === 503
        ? "AI_MODEL_UNAVAILABLE"
        : "INTERNAL_ERROR");

    const message =
      rawMessage ||
      (code === "INVALID_AI_REQUEST"
        ? "AI 검색 요청 또는 대화 조건을 확인해 주세요."
        : code === "AI_OUTPUT_INVALID"
        ? "AI 모델 응답을 처리할 수 없습니다."
        : code === "AI_MODEL_ERROR"
        ? "AI 모델 요청에 실패했습니다."
        : code === "AI_MODEL_UNAVAILABLE"
        ? "AI 모델이 설정되지 않았습니다."
        : code === "DB_UNAVAILABLE"
        ? "데이터베이스에 연결할 수 없습니다."
        : "AI 검색 요청 처리 중 오류가 발생했습니다.");

    throw new ApiClientError(response.status, code, message, rawDetails);
  }

  return (await response.json()) as AISearchResponse;
}

