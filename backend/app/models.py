from decimal import Decimal
from typing import Any

from sqlalchemy import BigInteger, Boolean, Integer, Numeric, SmallInteger, Text
from sqlalchemy.dialects.postgresql import JSONB, TIMESTAMP
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Notebook(Base):
    __tablename__ = "notebooks"

    product_code: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    manufacturer: Mapped[str] = mapped_column(Text, nullable=False)
    product_type: Mapped[str | None] = mapped_column(Text)
    cpu_vendor: Mapped[str | None] = mapped_column(Text)
    cpu_series: Mapped[str | None] = mapped_column(Text)
    cpu_model: Mapped[str | None] = mapped_column(Text)
    gpu_type: Mapped[str | None] = mapped_column(Text)
    gpu_model: Mapped[str | None] = mapped_column(Text)
    ram_gb: Mapped[Decimal | None] = mapped_column(Numeric(6, 1))
    screen_inches: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    weight_kg: Mapped[Decimal | None] = mapped_column(Numeric(6, 3))
    base_storage_text: Mapped[str | None] = mapped_column(Text)
    os: Mapped[str | None] = mapped_column(Text)
    own_configuration_price_krw: Mapped[int | None] = mapped_column(BigInteger)
    min_observed_configuration_price_krw: Mapped[int | None] = mapped_column(BigInteger)
    observed_configuration_count: Mapped[int | None] = mapped_column(Integer)
    registered_month: Mapped[str | None] = mapped_column(Text)
    source_url: Mapped[str | None] = mapped_column(Text)
    captured_at: Mapped[Any | None] = mapped_column(TIMESTAMP(timezone=True))
    raw_data: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)


class Car(Base):
    __tablename__ = "cars"

    listing_id: Mapped[str] = mapped_column(Text, primary_key=True)
    source_vehicle_key: Mapped[str | None] = mapped_column(Text)
    sales_channel: Mapped[str | None] = mapped_column(Text)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    manufacturer: Mapped[str | None] = mapped_column(Text)
    model: Mapped[str | None] = mapped_column(Text)
    trim: Mapped[str | None] = mapped_column(Text)
    registration_year: Mapped[int | None] = mapped_column(SmallInteger)
    registration_month: Mapped[int | None] = mapped_column(SmallInteger)
    mileage_km: Mapped[int | None] = mapped_column(Integer)
    asking_price_krw: Mapped[int | None] = mapped_column(BigInteger)
    branch_or_region: Mapped[str | None] = mapped_column(Text)
    status_label: Mapped[str | None] = mapped_column(Text)
    drive_text_explicit: Mapped[str | None] = mapped_column(Text)
    flag_extreme_mileage: Mapped[bool | None] = mapped_column(Boolean)
    thumbnail_url: Mapped[str | None] = mapped_column(Text)
    source_url: Mapped[str | None] = mapped_column(Text)
    captured_at: Mapped[Any | None] = mapped_column(TIMESTAMP(timezone=True))
    raw_data: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
