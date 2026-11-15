import json

from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

from app.models import Car
from app.schemas import CarFilters


def _filters(query: Select, params: CarFilters) -> Select:
    for field in ("manufacturer", "model", "branch_or_region"):
        value = getattr(params, field)
        if value is not None:
            query = query.where(getattr(Car, field) == value)
    for column_name, low, high in (
        ("registration_year", "registration_year_min", "registration_year_max"),
        ("mileage_km", "min_mileage_km", "max_mileage_km"),
        ("asking_price_krw", "min_price_krw", "max_price_krw"),
    ):
        column = getattr(Car, column_name)
        if getattr(params, low) is not None:
            query = query.where(column >= getattr(params, low))
        if getattr(params, high) is not None:
            query = query.where(column <= getattr(params, high))
    return query


def _ordered(query: Select, sort: str) -> Select:
    options = {
        "id_asc": (Car.listing_id.asc(),),
        "price_asc": (Car.asking_price_krw.asc().nulls_last(), Car.listing_id.asc()),
        "price_desc": (Car.asking_price_krw.desc().nulls_last(), Car.listing_id.asc()),
        "mileage_asc": (Car.mileage_km.asc().nulls_last(), Car.listing_id.asc()),
        "year_desc": (Car.registration_year.desc().nulls_last(), Car.listing_id.asc()),
        "newest_capture": (Car.captured_at.desc().nulls_last(), Car.listing_id.asc()),
    }
    return query.order_by(*options[sort])


def _item(row: Car) -> dict:
    return {
        "id": row.listing_id, "title": row.title, "manufacturer": row.manufacturer, "model": row.model,
        "trim": row.trim, "registration_year": row.registration_year, "registration_month": row.registration_month,
        "mileage_km": row.mileage_km, "price_krw": row.asking_price_krw,
        "branch_or_region": row.branch_or_region, "status_label": row.status_label,
        "drive_text_explicit": row.drive_text_explicit, "flag_extreme_mileage": row.flag_extreme_mileage,
        "thumbnail_url": row.thumbnail_url, "source_url": row.source_url, "captured_at": row.captured_at,
    }


def search_cars(db: Session, params: CarFilters) -> dict:
    filtered = _filters(select(Car), params)
    total = db.scalar(select(func.count()).select_from(_filters(select(Car.listing_id), params).subquery())) or 0
    rows = db.scalars(_ordered(filtered, params.sort).offset((params.page - 1) * params.page_size).limit(params.page_size)).all()
    return {"items": [_item(row) for row in rows], "total": total, "page": params.page, "page_size": params.page_size, "total_pages": (total + params.page_size - 1) // params.page_size}


def get_car(db: Session, listing_id: str) -> dict | None:
    row = db.get(Car, listing_id)
    if row is None:
        return None
    result = _item(row)
    try:
        tags = json.loads(row.raw_data.get("tags_json") or "[]")
        if not isinstance(tags, list):
            tags = []
    except (TypeError, json.JSONDecodeError):
        tags = []
    result.update({
        "description": row.raw_data.get("description"),
        "registration_text": row.raw_data.get("registration_text"),
        "tags": tags,
        "flag_future_registration": _parse_optional_bool(row.raw_data.get("flag_future_registration")),
        "first_captured_at": row.raw_data.get("first_captured_at"),
    })
    return result


def _parse_optional_bool(value):
    if value is None or value == "":
        return None
    return str(value).strip().lower() in {"true", "1", "yes"}


def car_facets(db: Session) -> dict:
    result = {}
    for field in ("manufacturer", "model", "branch_or_region"):
        column = getattr(Car, field)
        values = db.scalars(select(column).where(column.is_not(None), func.btrim(column) != "").distinct().order_by(column)).all()
        result[field] = [{"value": value, "label": value} for value in values]
    return result
