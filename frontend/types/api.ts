export type NotebookPriceBasis = "min_observed_configuration_price_krw";
export type CarPriceBasis = "asking_price_krw";

export type NotebookSortOption =
  | "id_asc"
  | "price_asc"
  | "price_desc"
  | "ram_desc"
  | "weight_asc"
  | "newest_capture";

export type CarSortOption =
  | "id_asc"
  | "price_asc"
  | "price_desc"
  | "mileage_asc"
  | "year_desc"
  | "newest_capture";

export interface FacetOption {
  value: string;
  label: string;
}

export interface NotebookFacetsResponse {
  manufacturer: FacetOption[];
  cpu_vendor: FacetOption[];
  cpu_series: FacetOption[];
  gpu_type: FacetOption[];
}

export interface CarFacetsResponse {
  manufacturer: FacetOption[];
  model: FacetOption[];
  branch_or_region: FacetOption[];
}

export interface NotebookItem {
  id: string;
  name: string;
  manufacturer: string;
  product_type: string | null;
  cpu_vendor: string | null;
  cpu_series: string | null;
  cpu_model: string | null;
  gpu_type: string | null;
  gpu_model: string | null;
  ram_gb: number | null;
  screen_inches: number | null;
  weight_kg: number | null;
  price_krw: number | null;
  price_basis: NotebookPriceBasis;
  own_configuration_price_krw: number | null;
  base_storage_text: string | null;
  os: string | null;
  source_url: string | null;
  captured_at: string | null;
}

export interface NotebookDetail extends NotebookItem {
  specs_text: string | null;
  registered_month: string | null;
  observed_configuration_count: number | null;
}

export interface CarItem {
  id: string;
  title: string;
  manufacturer: string | null;
  model: string | null;
  trim: string | null;
  registration_year: number | null;
  registration_month: number | null;
  mileage_km: number | null;
  price_krw: number | null;
  price_basis: CarPriceBasis;
  branch_or_region: string | null;
  status_label: string | null;
  drive_text_explicit: string | null;
  flag_extreme_mileage: boolean | null;
  thumbnail_url: string | null;
  source_url: string | null;
  captured_at: string | null;
}

export interface CarDetail extends CarItem {
  description: string | null;
  registration_text: string | null;
  tags: string[];
  flag_future_registration: boolean | null;
  first_captured_at: string | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export type NotebookSearchResponse = PaginatedResponse<NotebookItem>;
export type CarSearchResponse = PaginatedResponse<CarItem>;

export interface NotebookFilterParams {
  manufacturer?: string;
  cpu_vendor?: string;
  cpu_series?: string;
  gpu_type?: string;
  min_ram_gb?: number;
  max_ram_gb?: number;
  min_price_krw?: number;
  max_price_krw?: number;
  min_weight_kg?: number;
  max_weight_kg?: number;
  page?: number;
  page_size?: number;
  sort?: NotebookSortOption;
}

export interface CarFilterParams {
  manufacturer?: string;
  model?: string;
  registration_year_min?: number;
  registration_year_max?: number;
  min_mileage_km?: number;
  max_mileage_km?: number;
  min_price_krw?: number;
  max_price_krw?: number;
  branch_or_region?: string;
  page?: number;
  page_size?: number;
  sort?: CarSortOption;
}

export interface HealthResponse {
  status: string;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: Record<string, unknown> | null;
}

export type DataSourceMode = "api" | "mock";

export interface ApiResultWithSource<T> {
  data: T;
  source: DataSourceMode;
}
