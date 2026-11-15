from decimal import Decimal
from unittest.mock import Mock

import pytest
from fastapi.testclient import TestClient

from app.database import get_db
from app.main import app
from app.routers import cars, notebooks


@pytest.fixture
def client():
    app.dependency_overrides[get_db] = lambda: None
    with TestClient(app, raise_server_exceptions=False) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def notebook_item(**overrides):
    item = {
        "id": "101", "name": "Test notebook", "manufacturer": "Example",
        "product_type": None, "cpu_vendor": None, "cpu_series": None, "cpu_model": None,
        "gpu_type": None, "gpu_model": None, "ram_gb": Decimal("16.0"),
        "screen_inches": Decimal("15.60"), "weight_kg": Decimal("0.990"),
        "price_krw": 1000000, "own_configuration_price_krw": 1000000,
        "base_storage_text": None, "os": None, "source_url": None, "captured_at": None,
    }
    item.update(overrides)
    return item


def car_item():
    return {
        "id": "direct:101", "title": "Test car", "manufacturer": "Example", "model": "Model",
        "trim": None, "registration_year": 2022, "registration_month": 1, "mileage_km": 1000,
        "price_krw": 20000000, "branch_or_region": None, "status_label": None,
        "drive_text_explicit": None, "flag_extreme_mileage": False, "thumbnail_url": None,
        "source_url": None, "captured_at": None,
    }


@pytest.mark.parametrize(
    ("path", "field", "service"),
    [
        ("/api/notebooks?min_price_krw=3000000&max_price_krw=1000000", "min_price_krw", "notebooks"),
        ("/api/notebooks?min_ram_gb=32&max_ram_gb=16", "min_ram_gb", "notebooks"),
        ("/api/notebooks?min_weight_kg=2&max_weight_kg=1", "min_weight_kg", "notebooks"),
        ("/api/cars?min_price_krw=30000000&max_price_krw=10000000", "min_price_krw", "cars"),
        ("/api/cars?min_mileage_km=100000&max_mileage_km=1000", "min_mileage_km", "cars"),
        ("/api/cars?registration_year_min=2024&registration_year_max=2020", "registration_year_min", "cars"),
    ],
)
def test_reversed_ranges_return_invalid_filter_without_search(client, monkeypatch, path, field, service):
    search = Mock()
    monkeypatch.setattr(notebooks if service == "notebooks" else cars, f"search_{service}", search)

    response = client.get(path)

    assert response.status_code == 422
    assert response.json()["code"] == "INVALID_FILTER"
    assert response.json()["details"]["field"] == field
    assert search.call_count == 0


@pytest.mark.parametrize(
    "path,field",
    [
        ("/api/notebooks?page=0", "page"),
        ("/api/notebooks?page_size=101", "page_size"),
        ("/api/notebooks?sort=unsupported", "sort"),
        ("/api/notebooks?min_price_krw=not-a-number", "min_price_krw"),
        ("/api/notebooks?min_price_krw=-1", "min_price_krw"),
        ("/api/cars?min_mileage_km=-1", "min_mileage_km"),
    ],
)
def test_invalid_query_values_keep_contract_error(client, monkeypatch, path, field):
    notebook_search = Mock()
    car_search = Mock()
    monkeypatch.setattr(notebooks, "search_notebooks", notebook_search)
    monkeypatch.setattr(cars, "search_cars", car_search)

    response = client.get(path)

    assert response.status_code == 422
    assert response.json()["code"] == "INVALID_FILTER"
    assert response.json()["details"]["field"] == field
    notebook_search.assert_not_called()
    car_search.assert_not_called()


@pytest.mark.parametrize("endpoint", ["list", "detail"])
def test_notebook_decimal_fields_are_json_numbers_or_null(client, monkeypatch, endpoint):
    item = notebook_item(weight_kg=None)
    if endpoint == "list":
        monkeypatch.setattr(notebooks, "search_notebooks", lambda db, params: {
            "items": [item], "total": 1, "page": 1, "page_size": 1, "total_pages": 1,
        })
        response = client.get("/api/notebooks?page_size=1")
        result = response.json()["items"][0]
    else:
        item.update({"specs_text": "specs", "registered_month": "26.10", "observed_configuration_count": 1})
        monkeypatch.setattr(notebooks, "get_notebook", lambda db, product_code: item)
        response = client.get("/api/notebooks/101")
        result = response.json()

    assert response.status_code == 200
    assert result["ram_gb"] == 16 and isinstance(result["ram_gb"], int)
    assert result["screen_inches"] == 15.6 and isinstance(result["screen_inches"], float)
    assert result["weight_kg"] is None


def test_health_and_mocked_search_routes_remain_available(client, monkeypatch):
    notebook_search = Mock(return_value={
        "items": [notebook_item()], "total": 1, "page": 1, "page_size": 1, "total_pages": 1,
    })
    car_search = Mock(return_value={
        "items": [car_item()], "total": 1, "page": 1, "page_size": 1, "total_pages": 1,
    })
    monkeypatch.setattr(notebooks, "search_notebooks", notebook_search)
    monkeypatch.setattr(cars, "search_cars", car_search)

    assert client.get("/api/health").status_code == 200
    assert client.get("/api/notebooks?page=1&page_size=1&min_ram_gb=16&sort=price_asc").status_code == 200
    assert client.get("/api/cars?page=1&page_size=1&min_price_krw=10000000&sort=year_desc").status_code == 200
    assert notebook_search.call_args.args[1].min_ram_gb == Decimal("16")
    assert notebook_search.call_args.args[1].sort == "price_asc"
    assert car_search.call_args.args[1].min_price_krw == 10000000
    assert car_search.call_args.args[1].sort == "year_desc"


@pytest.mark.parametrize("path,service", [("/api/notebooks/999", "notebook"), ("/api/cars/missing", "car")])
def test_missing_detail_returns_404(client, monkeypatch, path, service):
    if service == "notebook":
        monkeypatch.setattr(notebooks, "get_notebook", lambda db, product_code: None)
    else:
        monkeypatch.setattr(cars, "get_car", lambda db, listing_id: None)

    response = client.get(path)

    assert response.status_code == 404
    assert response.json()["code"] == "NOT_FOUND"


def test_car_detail_remains_serializable(client, monkeypatch):
    item = car_item() | {
        "description": None, "registration_text": "2022년 1월", "tags": ["AWD"],
        "flag_future_registration": False, "first_captured_at": None,
    }
    monkeypatch.setattr(cars, "get_car", lambda db, listing_id: item)

    response = client.get("/api/cars/direct:101")

    assert response.status_code == 200
    assert response.json()["id"] == "direct:101"


def test_response_validation_failure_is_not_misreported_as_422(client, monkeypatch):
    monkeypatch.setattr(notebooks, "search_notebooks", lambda db, params: {
        "items": [{"id": "invalid"}], "total": 1, "page": 1, "page_size": 1, "total_pages": 1,
    })

    response = client.get("/api/notebooks?page_size=1")

    assert response.status_code == 500
    assert response.json()["code"] == "INTERNAL_ERROR"
    assert "traceback" not in response.text.lower()
