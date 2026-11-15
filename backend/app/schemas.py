from decimal import Decimal
from datetime import datetime
from typing import Generic, Literal, TypeVar

from pydantic import BaseModel, ConfigDict, Field, model_validator

NotebookSort = Literal["id_asc", "price_asc", "price_desc", "ram_desc", "weight_asc", "newest_capture"]
CarSort = Literal["id_asc", "price_asc", "price_desc", "mileage_asc", "year_desc", "newest_capture"]


class SearchParams(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)


class NotebookFilters(SearchParams):
    manufacturer: str | None = None
    cpu_vendor: str | None = None
    cpu_series: str | None = None
    gpu_type: str | None = None
    min_ram_gb: Decimal | None = Field(default=None, ge=0)
    max_ram_gb: Decimal | None = Field(default=None, ge=0)
    min_price_krw: int | None = Field(default=None, ge=0)
    max_price_krw: int | None = Field(default=None, ge=0)
    min_weight_kg: Decimal | None = Field(default=None, ge=0)
    max_weight_kg: Decimal | None = Field(default=None, ge=0)
    sort: NotebookSort = "id_asc"

    @model_validator(mode="after")
    def ordered_ranges(self):
        for low, high in (("min_ram_gb", "max_ram_gb"), ("min_price_krw", "max_price_krw"), ("min_weight_kg", "max_weight_kg")):
            if getattr(self, low) is not None and getattr(self, high) is not None and getattr(self, low) > getattr(self, high):
                raise ValueError(f"{low} must be less than or equal to {high}")
        return self


class CarFilters(SearchParams):
    manufacturer: str | None = None
    model: str | None = None
    registration_year_min: int | None = Field(default=None, ge=1900, le=2100)
    registration_year_max: int | None = Field(default=None, ge=1900, le=2100)
    min_mileage_km: int | None = Field(default=None, ge=0)
    max_mileage_km: int | None = Field(default=None, ge=0)
    min_price_krw: int | None = Field(default=None, ge=0)
    max_price_krw: int | None = Field(default=None, ge=0)
    branch_or_region: str | None = None
    sort: CarSort = "id_asc"

    @model_validator(mode="after")
    def ordered_ranges(self):
        for low, high in (("registration_year_min", "registration_year_max"), ("min_mileage_km", "max_mileage_km"), ("min_price_krw", "max_price_krw")):
            if getattr(self, low) is not None and getattr(self, high) is not None and getattr(self, low) > getattr(self, high):
                raise ValueError(f"{low} must be less than or equal to {high}")
        return self


class FacetOption(BaseModel):
    value: str
    label: str


class NotebookFacets(BaseModel):
    manufacturer: list[FacetOption]
    cpu_vendor: list[FacetOption]
    cpu_series: list[FacetOption]
    gpu_type: list[FacetOption]


class CarFacets(BaseModel):
    manufacturer: list[FacetOption]
    model: list[FacetOption]
    branch_or_region: list[FacetOption]


T = TypeVar("T")


class PageResult(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int
    total_pages: int


class NotebookItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    manufacturer: str
    product_type: str | None
    cpu_vendor: str | None
    cpu_series: str | None
    cpu_model: str | None
    gpu_type: str | None
    gpu_model: str | None
    ram_gb: Decimal | None
    screen_inches: Decimal | None
    weight_kg: Decimal | None
    price_krw: int | None
    price_basis: Literal["min_observed_configuration_price_krw"] = "min_observed_configuration_price_krw"
    own_configuration_price_krw: int | None
    base_storage_text: str | None
    os: str | None
    source_url: str | None
    captured_at: datetime | None


class NotebookDetail(NotebookItem):
    specs_text: str | None
    registered_month: str | None
    observed_configuration_count: int | None


class CarItem(BaseModel):
    id: str
    title: str
    manufacturer: str | None
    model: str | None
    trim: str | None
    registration_year: int | None
    registration_month: int | None
    mileage_km: int | None
    price_krw: int | None
    price_basis: Literal["asking_price_krw"] = "asking_price_krw"
    branch_or_region: str | None
    status_label: str | None
    drive_text_explicit: str | None
    flag_extreme_mileage: bool | None
    thumbnail_url: str | None
    source_url: str | None
    captured_at: datetime | None


class CarDetail(CarItem):
    description: str | None
    registration_text: str | None
    tags: list[str]
    flag_future_registration: bool | None
    first_captured_at: datetime | None
