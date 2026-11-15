import argparse
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "backend"))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from csv_import import CAR_COLUMNS, boolean, import_csv, integer, nullable_text, required_text, timestamp


def convert(row):
    year = integer(row, "registration_year")
    month = integer(row, "registration_month")
    if year is not None and not 1900 <= year <= 2100:
        raise ValueError(f"registration_year outside supported range: {year}")
    if month is not None and not 1 <= month <= 12:
        raise ValueError(f"registration_month outside 1..12: {month}")
    return {
        "listing_id": required_text(row, "listing_id"),
        "source_vehicle_key": nullable_text(row, "source_vehicle_key"),
        "sales_channel": nullable_text(row, "sales_channel"),
        "title": required_text(row, "title"),
        "manufacturer": nullable_text(row, "manufacturer"),
        "model": nullable_text(row, "model"),
        "trim": nullable_text(row, "trim"),
        "registration_year": year,
        "registration_month": month,
        "mileage_km": integer(row, "mileage_km"),
        "asking_price_krw": integer(row, "asking_price_krw"),
        "branch_or_region": nullable_text(row, "branch_or_region"),
        "status_label": nullable_text(row, "status_label"),
        "drive_text_explicit": nullable_text(row, "drive_text_explicit"),
        "flag_extreme_mileage": boolean(row, "flag_extreme_mileage"),
        "thumbnail_url": nullable_text(row, "thumbnail_url"),
        "source_url": nullable_text(row, "source_url"),
        "captured_at": timestamp(row, "captured_at"),
    }


def main():
    parser = argparse.ArgumentParser(description="Import K Car EV CSV into PostgreSQL")
    parser.add_argument("csv", nargs="?", type=Path, default=ROOT / "data/raw/kcar_ev_all.csv")
    args = parser.parse_args()
    import_csv(args.csv, "cars", CAR_COLUMNS, convert)


if __name__ == "__main__":
    main()
