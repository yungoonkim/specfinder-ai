from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

from app.models import Notebook
from app.schemas import NotebookFilters


def _filters(query: Select, params: NotebookFilters) -> Select:
    for field in ("manufacturer", "cpu_vendor", "cpu_series", "gpu_type"):
        value = getattr(params, field)
        if value is not None:
            query = query.where(getattr(Notebook, field) == value)
    for column_name, low, high in (
        ("ram_gb", "min_ram_gb", "max_ram_gb"),
        ("min_observed_configuration_price_krw", "min_price_krw", "max_price_krw"),
        ("weight_kg", "min_weight_kg", "max_weight_kg"),
    ):
        column = getattr(Notebook, column_name)
        if getattr(params, low) is not None:
            query = query.where(column >= getattr(params, low))
        if getattr(params, high) is not None:
            query = query.where(column <= getattr(params, high))
    return query


def _ordered(query: Select, sort: str) -> Select:
    options = {
        "id_asc": (Notebook.product_code.asc(),),
        "price_asc": (Notebook.min_observed_configuration_price_krw.asc().nulls_last(), Notebook.product_code.asc()),
        "price_desc": (Notebook.min_observed_configuration_price_krw.desc().nulls_last(), Notebook.product_code.asc()),
        "ram_desc": (Notebook.ram_gb.desc().nulls_last(), Notebook.product_code.asc()),
        "weight_asc": (Notebook.weight_kg.asc().nulls_last(), Notebook.product_code.asc()),
        "newest_capture": (Notebook.captured_at.desc().nulls_last(), Notebook.product_code.asc()),
    }
    return query.order_by(*options[sort])


def _item(row: Notebook) -> dict:
    return {
        "id": str(row.product_code), "name": row.name, "manufacturer": row.manufacturer,
        "product_type": row.product_type, "cpu_vendor": row.cpu_vendor, "cpu_series": row.cpu_series,
        "cpu_model": row.cpu_model, "gpu_type": row.gpu_type, "gpu_model": row.gpu_model,
        "ram_gb": row.ram_gb, "screen_inches": row.screen_inches, "weight_kg": row.weight_kg,
        "price_krw": row.min_observed_configuration_price_krw,
        "own_configuration_price_krw": row.own_configuration_price_krw,
        "base_storage_text": row.base_storage_text, "os": row.os, "source_url": row.source_url,
        "captured_at": row.captured_at,
    }


def search_notebooks(db: Session, params: NotebookFilters) -> dict:
    filtered = _filters(select(Notebook), params)
    total = db.scalar(select(func.count()).select_from(_filters(select(Notebook.product_code), params).subquery())) or 0
    rows = db.scalars(_ordered(filtered, params.sort).offset((params.page - 1) * params.page_size).limit(params.page_size)).all()
    return {"items": [_item(row) for row in rows], "total": total, "page": params.page, "page_size": params.page_size, "total_pages": (total + params.page_size - 1) // params.page_size}


def get_notebook(db: Session, product_code: int) -> dict | None:
    row = db.get(Notebook, product_code)
    if row is None:
        return None
    result = _item(row)
    result.update({"specs_text": row.raw_data.get("specs_text"), "registered_month": row.registered_month, "observed_configuration_count": row.observed_configuration_count})
    return result


def notebook_facets(db: Session) -> dict:
    result = {}
    for field in ("manufacturer", "cpu_vendor", "cpu_series", "gpu_type"):
        column = getattr(Notebook, field)
        values = db.scalars(select(column).where(column.is_not(None), func.btrim(column) != "").distinct().order_by(column)).all()
        result[field] = [{"value": value, "label": value} for value in values]
    return result
