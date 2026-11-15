"""Shared, strict CSV parsing and PostgreSQL UPSERT helpers for the MVP loaders."""

import csv
import logging
from datetime import datetime
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Callable

from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.exc import SQLAlchemyError

from app.database import SessionLocal
from app.models import Car, Notebook

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
logger = logging.getLogger("specfinder.import")

NOTEBOOK_COLUMNS = set("""product_code name own_configuration_price_krw min_observed_configuration_price_krw
observed_configuration_count additional_collapsed_configurations manufacturer product_type screen_inches weight_kg os
max_battery_hours resolution refresh_hz brightness_nit cpu_vendor cpu_series cpu_model npu_tops gpu_type gpu_model
gpu_core_count vram_gb tgp_w ram_gb ram_replaceable_text base_storage_text battery_wh usb_pd_text registered_month
general_specs screen_specs cpu_specs gpu_specs configuration_specs specs_text shop_review_text danawa_review_text
source_url first_page last_page captured_at""".split())
CAR_COLUMNS = set("""listing_id source_vehicle_key id_source sales_channel title manufacturer model trim model_parse_ok fuel
registration_text registration_year registration_month registration_ym model_year_explicit vehicle_age_months
mileage_text mileage_km mileage_is_approximate price_text asking_price_krw previous_price_krw installment_monthly_krw
branch_or_region status_label drive_text_explicit tags_json description promotion_text price_negotiable placement
thumbnail_url source_url source_file captured_at flag_extreme_mileage flag_future_registration tag_one_owner_listed
tag_no_insurance_history_listed tag_manufacturer_warranty_listed first_captured_at""".split())


def nullable_text(row: dict[str, str | None], key: str) -> str | None:
    value = row.get(key)
    return value if value is not None and value.strip() else None


def required_text(row: dict[str, str | None], key: str) -> str:
    value = nullable_text(row, key)
    if value is None:
        raise ValueError(f"{key} is required")
    return value.strip()


def integer(row: dict[str, str | None], key: str) -> int | None:
    value = nullable_text(row, key)
    if value is None:
        return None
    try:
        number = Decimal(value.strip())
        if not number.is_finite() or number != number.to_integral_value():
            raise ValueError
        return int(number)
    except (InvalidOperation, ValueError, OverflowError) as exc:
        raise ValueError(f"{key} must be an integer, got {value!r}") from exc


def decimal(row: dict[str, str | None], key: str) -> Decimal | None:
    value = nullable_text(row, key)
    if value is None:
        return None
    try:
        number = Decimal(value.strip())
        if not number.is_finite():
            raise ValueError
        return number
    except (InvalidOperation, ValueError) as exc:
        raise ValueError(f"{key} must be numeric, got {value!r}") from exc


def boolean(row: dict[str, str | None], key: str) -> bool | None:
    value = nullable_text(row, key)
    if value is None:
        return None
    normalized = value.strip().lower()
    if normalized in {"true", "1", "yes"}:
        return True
    if normalized in {"false", "0", "no"}:
        return False
    raise ValueError(f"{key} must be true/false, got {value!r}")


def timestamp(row: dict[str, str | None], key: str):
    value = nullable_text(row, key)
    if value is None:
        return None
    try:
        parsed = datetime.fromisoformat(value.strip().replace("Z", "+00:00"))
    except ValueError as exc:
        raise ValueError(f"{key} must be ISO 8601, got {value!r}") from exc
    if parsed.tzinfo is None or parsed.utcoffset() is None:
        raise ValueError(f"{key} must include a timezone")
    return parsed


def read_csv(path: Path, required: set[str]):
    if not path.is_file():
        raise FileNotFoundError(f"CSV not found: {path}; place the original under data/raw/ or pass its path")
    errors = []
    rows = []
    with path.open("r", encoding="utf-8-sig", newline="") as stream:
        reader = csv.DictReader(stream)
        headers = reader.fieldnames or []
        if len(headers) != len(set(headers)):
            raise ValueError("CSV contains duplicate column names")
        missing = sorted(required - set(headers))
        if missing:
            raise ValueError(f"CSV is missing required columns: {', '.join(missing)}")
        key = "product_code" if "product_code" in required else "listing_id"
        seen = set()
        for line_number, raw in enumerate(reader, start=2):
            if None in raw:
                errors.append((line_number, "row has more fields than the header"))
                continue
            if any(value is None for value in raw.values()):
                errors.append((line_number, "row has fewer fields than the header"))
                continue
            raw_key = raw.get(key)
            if raw_key is None or not raw_key.strip():
                errors.append((line_number, f"{key} is required"))
                continue
            if raw_key in seen:
                errors.append((line_number, f"duplicate {key} {raw_key!r}"))
                continue
            seen.add(raw_key)
            rows.append((line_number, {name: value for name, value in raw.items()}))
    return rows, errors, len(headers)


def import_csv(path: Path, entity: str, required: set[str], converter: Callable):
    rows, errors, column_count = read_csv(path, required)
    model = Notebook if entity == "notebooks" else Car
    key = "product_code" if entity == "notebooks" else "listing_id"
    table_columns = [column.name for column in model.__table__.columns]
    records = []
    normalized_keys = set()
    for line_number, raw in rows:
        try:
            normalized = converter(raw)
            normalized["raw_data"] = {name: value if value and value.strip() else None for name, value in raw.items()}
            if entity == "notebooks":
                normalized[key] = int(raw[key].strip())
            if normalized[key] in normalized_keys:
                errors.append((line_number, f"duplicate normalized {key} {normalized[key]!r}"))
                continue
            normalized_keys.add(normalized[key])
            records.append(normalized)
        except (ValueError, InvalidOperation) as exc:
            errors.append((line_number, str(exc)))

    for line_number, reason in errors:
        logger.error("%s:%s: %s", path.name, line_number, reason)
    if errors:
        logger.warning("%d invalid row(s) will be skipped; valid rows will still be imported", len(errors))

    inserted = 0
    try:
        with SessionLocal.begin() as session:
            for start in range(0, len(records), 250):
                batch = records[start : start + 250]
                if not batch:
                    continue
                statement = insert(model).values(batch)
                updates = {name: getattr(statement.excluded, name) for name in table_columns if name != key}
                session.execute(statement.on_conflict_do_update(index_elements=[getattr(model, key)], set_=updates))
                inserted += len(batch)
            total = session.scalar(select(func.count()).select_from(model)) or 0
        logger.info("%s: source rows=%d columns=%d upserted=%d failed=%d database rows=%d", entity, len(rows) + len(errors), column_count, inserted, len(errors), total)
    except SQLAlchemyError:
        logger.exception("Database import failed for %s", entity)
        raise
    return {"rows": len(rows) + len(errors), "columns": column_count, "upserted": inserted, "failed": len(errors), "database_rows": total}
