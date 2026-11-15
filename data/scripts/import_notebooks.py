import argparse
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "backend"))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from csv_import import NOTEBOOK_COLUMNS, decimal, import_csv, integer, nullable_text, required_text, timestamp


def convert(row):
    return {
        "product_code": integer(row, "product_code"),
        "name": required_text(row, "name"),
        "manufacturer": required_text(row, "manufacturer"),
        "product_type": nullable_text(row, "product_type"),
        "cpu_vendor": nullable_text(row, "cpu_vendor"),
        "cpu_series": nullable_text(row, "cpu_series"),
        "cpu_model": nullable_text(row, "cpu_model"),
        "gpu_type": nullable_text(row, "gpu_type"),
        "gpu_model": nullable_text(row, "gpu_model"),
        "ram_gb": decimal(row, "ram_gb"),
        "screen_inches": decimal(row, "screen_inches"),
        "weight_kg": decimal(row, "weight_kg"),
        "base_storage_text": nullable_text(row, "base_storage_text"),
        "os": nullable_text(row, "os"),
        "own_configuration_price_krw": integer(row, "own_configuration_price_krw"),
        "min_observed_configuration_price_krw": integer(row, "min_observed_configuration_price_krw"),
        "observed_configuration_count": integer(row, "observed_configuration_count"),
        "registered_month": nullable_text(row, "registered_month"),
        "source_url": nullable_text(row, "source_url"),
        "captured_at": timestamp(row, "captured_at"),
    }


def main():
    parser = argparse.ArgumentParser(description="Import Danawa notebook CSV into PostgreSQL")
    parser.add_argument("csv", nargs="?", type=Path, default=ROOT / "data/raw/danawa_notebook.csv")
    args = parser.parse_args()
    import_csv(args.csv, "notebooks", NOTEBOOK_COLUMNS, convert)


if __name__ == "__main__":
    main()
