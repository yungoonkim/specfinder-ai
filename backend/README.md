# SpecFinder AI backend

## Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `DATABASE_URL` in `backend/.env` for a PostgreSQL role/database you have created. The default is only an example and does not include working credentials.

## Create tables and load source CSVs

Create both tables with PostgreSQL's `psql` client:

```bash
set -a
source backend/.env
set +a
psql "$DATABASE_URL" -f backend/sql/schema.sql
```

Place the unchanged source files at `data/raw/danawa_notebook.csv` and `data/raw/kcar_ev_all.csv`, or pass their actual paths to the import commands. From the repository root:

```bash
python data/scripts/import_notebooks.py /path/to/danawa_notebook.csv
python data/scripts/import_cars.py /path/to/kcar_ev_all.csv
```

Both loaders validate headers, timestamps, identifiers and typed values, preserve every CSV cell in `raw_data`, log invalid rows, UPSERT by the original primary key and report the post-import table row count. They skip invalid rows and continue with valid rows. Re-running the same source updates rows without increasing the count.

## Run the API

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API: `http://localhost:8000`; interactive Swagger documentation: `http://localhost:8000/docs`. Set `CORS_ORIGINS` to the exact frontend origin(s), comma separated. Available endpoints are `/api/health`, `/api/notebooks`, `/api/notebooks/facets`, `/api/notebooks/{product_code}`, `/api/cars`, `/api/cars/facets` and `/api/cars/{listing_id}`.
