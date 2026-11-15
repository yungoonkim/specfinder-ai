CREATE TABLE IF NOT EXISTS notebooks (
    product_code BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    manufacturer TEXT NOT NULL,
    product_type TEXT,
    cpu_vendor TEXT,
    cpu_series TEXT,
    cpu_model TEXT,
    gpu_type TEXT,
    gpu_model TEXT,
    ram_gb NUMERIC(6,1),
    screen_inches NUMERIC(5,2),
    weight_kg NUMERIC(6,3),
    base_storage_text TEXT,
    os TEXT,
    own_configuration_price_krw BIGINT,
    min_observed_configuration_price_krw BIGINT,
    observed_configuration_count INTEGER,
    registered_month TEXT,
    source_url TEXT,
    captured_at TIMESTAMPTZ,
    raw_data JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notebooks_manufacturer_price ON notebooks (manufacturer, min_observed_configuration_price_krw);
CREATE INDEX IF NOT EXISTS idx_notebooks_cpu_ram ON notebooks (cpu_vendor, ram_gb);

CREATE TABLE IF NOT EXISTS cars (
    listing_id TEXT PRIMARY KEY,
    source_vehicle_key TEXT,
    sales_channel TEXT,
    title TEXT NOT NULL,
    manufacturer TEXT,
    model TEXT,
    trim TEXT,
    registration_year SMALLINT,
    registration_month SMALLINT,
    mileage_km INTEGER,
    asking_price_krw BIGINT,
    branch_or_region TEXT,
    status_label TEXT,
    drive_text_explicit TEXT,
    flag_extreme_mileage BOOLEAN,
    thumbnail_url TEXT,
    source_url TEXT,
    captured_at TIMESTAMPTZ,
    raw_data JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cars_manufacturer_price ON cars (manufacturer, asking_price_krw);
CREATE INDEX IF NOT EXISTS idx_cars_year_mileage ON cars (registration_year, mileage_km);
