# SpecFinder AI — 데이터 사전 및 CSV 전처리 계약

> **기준:** 실제 첨부 CSV 파일 `danawa_notebook(2).csv`(2,181행 × 42열), `kcar_ev_all(2).csv`(302행 × 41열)  
> **목적:** 원본 보존과 검색용 정규화를 구분하여 PostgreSQL `notebooks`, `cars`에 적재  
> **수집일:** 노트북 2026-10-30, 전기차 2026-09-21. 둘 다 현재 재고/현재 가격을 보장하지 않는다.

## 1. 저장 전략 — 업무 테이블은 두 개만

- PostgreSQL 테이블: `notebooks(product_code BIGINT PK)`와 `cars(listing_id TEXT PK)` **딱 두 개**.
- UI 검색·정렬에 필요한 필드를 타입이 있는 DB 컬럼으로 저장하고, **CSV의 모든 원본 컬럼 42/41개를 `raw_data JSONB`에 보존**한다.
- 원본 CSV 파일은 `data/raw/`에 별도 보존한다. 원본 파일의 인코딩·줄바꿈·헤더·값을 임의로 덮어쓰지 않는다.
- `raw_data`는 CSV 파서가 읽은 원본 셀 문자열을 가능한 한 유지한다. 빈 셀은 JSON `null`로 표현하고 CSV 원본을 재현할 필요가 있으면 저장된 원본 파일을 사용한다.
- 원본 컬럼의 중복 이름·행 수·ID 중복·필수값 오류는 적재 전에 일괄 집계해서 콘솔/파일 로그로 출력한다. **오류 로그 DB 테이블을 추가하지 않는다.**
- 동일 CSV를 두 번 적재해도 행이 증가하지 않도록 고유 ID 기준 `UPSERT` 한다. 기존 원본 행과 다른 값이 들어오면 DB의 최신 스냅샷을 갱신하되 이전 이력을 저장하지 않는다.
- `created_at`, `updated_at` 같은 운영 컬럼은 초기 데이터에서 필수 아님; 필요해지면 기획 변경 후 추가한다.

## 2. 노트북 `notebooks` 검색용 컬럼

| DB 컬럼 | DB 타입 | 원본 CSV 컬럼 | 용도 / 전처리 |
|---|---|---|---|
| `product_code` | BIGINT PK | `product_code` | 정수형 고유 ID, 변형·재생성 금지 |
| `name` | TEXT NOT NULL | `name` | 상품명 |
| `manufacturer` | TEXT NOT NULL | `manufacturer` | 제조사 검색; 별칭 자동 치환 금지 |
| `product_type` | TEXT | `product_type` | 유형 표시 |
| `cpu_vendor` | TEXT | `cpu_vendor` | CPU 제조사 필터 |
| `cpu_series` | TEXT | `cpu_series` | CPU 시리즈 필터 |
| `cpu_model` | TEXT | `cpu_model` | 모델 표시 |
| `gpu_type` | TEXT | `gpu_type` | GPU 유형 필터 |
| `gpu_model` | TEXT | `gpu_model` | GPU 표시 |
| `ram_gb` | NUMERIC(6,1) | `ram_gb` | RAM 필터, NULL 보존 |
| `screen_inches` | NUMERIC(5,2) | `screen_inches` | 화면 크기 표시 |
| `weight_kg` | NUMERIC(6,3) | `weight_kg` | 무게 필터, NULL 보존 |
| `base_storage_text` | TEXT | `base_storage_text` | 원문 그대로 표시; 임의 단위환산 안 함 |
| `os` | TEXT | `os` | 운영체제 표시 |
| `own_configuration_price_krw` | BIGINT | 동명 컬럼 | 해당 구성 가격, nullable |
| `min_observed_configuration_price_krw` | BIGINT | 동명 컬럼 | 검색 기준 **관측 최저가**, nullable |
| `observed_configuration_count` | INTEGER | 동명 컬럼 | 관측 구성 개수 (구성별 행 개수 아님) |
| `registered_month` | TEXT | 동명 컬럼 | `26.04` 같은 표기 보존. 부동소수 변환 금지 |
| `source_url` | TEXT | 동명 컬럼 | 다나와 제품 상세 URL |
| `captured_at` | TIMESTAMPTZ | 동명 컬럼 | ISO 시각, 타임존 보존 |
| `raw_data` | JSONB NOT NULL | 모든 42개 | 누락·비정형 원문 보존 |

**전체 노트북 원본 42개 컬럼 (원본 순서):**

`product_code`, `name`, `own_configuration_price_krw`, `min_observed_configuration_price_krw`, `observed_configuration_count`, `additional_collapsed_configurations`, `manufacturer`, `product_type`, `screen_inches`, `weight_kg`, `os`, `max_battery_hours`, `resolution`, `refresh_hz`, `brightness_nit`, `cpu_vendor`, `cpu_series`, `cpu_model`, `npu_tops`, `gpu_type`, `gpu_model`, `gpu_core_count`, `vram_gb`, `tgp_w`, `ram_gb`, `ram_replaceable_text`, `base_storage_text`, `battery_wh`, `usb_pd_text`, `registered_month`, `general_specs`, `screen_specs`, `cpu_specs`, `gpu_specs`, `configuration_specs`, `specs_text`, `shop_review_text`, `danawa_review_text`, `source_url`, `first_page`, `last_page`, `captured_at`.

### 노트북 실측 품질 주의

- 전체 2,181건, `product_code` 중복 **0건**.
- `own_configuration_price_krw` **2건 NULL**, `min_observed_configuration_price_krw` **2건 NULL**.
- `weight_kg` **29건 NULL**, `ram_gb` **1건 NULL**.
- `max_battery_hours` **1,728건 NULL**, `npu_tops` **982건 NULL**. MVP에서는 이 값으로 필터를 만들지 않는다.
- `base_storage_text`는 `256GB`, `1TB`, `256GB(UFS)` 등이 혼재한다. 정수형 용량으로 무리하게 치환하지 않는다.
- `registered_month`는 CSV 판독 시 `26.04`가 float로 변해 `26.4`가 될 위험이 있으므로 **처음부터 dtype=str**, 원본 문자열 유지.
- 두 가격 컬럼은 다르며 서로 바꾸어 사용하면 안 된다. 목록 검색/정렬은 `min_observed_configuration_price_krw`를 기준으로 한다.

## 3. 자동차 `cars` 검색용 컬럼

| DB 컬럼 | DB 타입 | 원본 CSV 컬럼 | 용도 / 전처리 |
|---|---|---|---|
| `listing_id` | TEXT PK | `listing_id` | `direct:61386067` 등 접두사 포함 ID 그대로 |
| `source_vehicle_key` | TEXT | 동명 컬럼 | 원본 참조 키 |
| `sales_channel` | TEXT | 동명 컬럼 | 판매 채널 |
| `title` | TEXT NOT NULL | 동명 컬럼 | 매물 이름 |
| `manufacturer` | TEXT | 동명 컬럼 | 제조사 필터 |
| `model` | TEXT | 동명 컬럼 | 모델 필터 |
| `trim` | TEXT | 동명 컬럼 | 트림 표시 |
| `registration_year` | SMALLINT | 동명 컬럼 | 연식(등록연도) 필터 |
| `registration_month` | SMALLINT | 동명 컬럼 | 등록월 표시(1~12) |
| `mileage_km` | INTEGER | 동명 컬럼 | km 정수 필터 |
| `asking_price_krw` | BIGINT | 동명 컬럼 | 수집 당시 판매 희망가 |
| `branch_or_region` | TEXT | 동명 컬럼 | 지역 필터 |
| `status_label` | TEXT | 동명 컬럼 | 원문 상태; 실판매 상태로 단정 금지 |
| `drive_text_explicit` | TEXT | 동명 컬럼 | 명시 구동방식만 저장 |
| `flag_extreme_mileage` | BOOLEAN | 동명 컬럼 | 이상치 플래그 보존, 삭제 금지 |
| `thumbnail_url` | TEXT | 동명 컬럼 | 외부 이미지 URL, 로드 실패 대체 처리 |
| `source_url` | TEXT | 동명 컬럼 | **검색 페이지 주소** (개별 상세 아님) |
| `captured_at` | TIMESTAMPTZ | 동명 컬럼 | 수집 시각 |
| `raw_data` | JSONB NOT NULL | 모든 41개 | 비정형 포함 전체 원본 |

**전체 자동차 원본 41개 컬럼 (원본 순서):**

`listing_id`, `source_vehicle_key`, `id_source`, `sales_channel`, `title`, `manufacturer`, `model`, `trim`, `model_parse_ok`, `fuel`, `registration_text`, `registration_year`, `registration_month`, `registration_ym`, `model_year_explicit`, `vehicle_age_months`, `mileage_text`, `mileage_km`, `mileage_is_approximate`, `price_text`, `asking_price_krw`, `previous_price_krw`, `installment_monthly_krw`, `branch_or_region`, `status_label`, `drive_text_explicit`, `tags_json`, `description`, `promotion_text`, `price_negotiable`, `placement`, `thumbnail_url`, `source_url`, `source_file`, `captured_at`, `flag_extreme_mileage`, `flag_future_registration`, `tag_one_owner_listed`, `tag_no_insurance_history_listed`, `tag_manufacturer_warranty_listed`, `first_captured_at`.

### 자동차 실측 품질 주의

- 전체 302건, `listing_id` 중복 **0건**. 기본 키는 숫자 ID만이 아닌 `sales_channel:식별자` 문자열이다.
- `previous_price_krw` **300건 NULL**. 이 파일만으로 가격 이력 서비스를 만들지 않는다.
- `drive_text_explicit` **164건 NULL**. 구동방식을 트림 문자열만으로 무조건 보정하지 않는다.
- `status_label` 값 `상태표시없음`은 273건으로, 판매 가능 여부를 확인한 것이 아니다.
- `source_url` 값이 모두 같은 K Car **검색 페이지**이므로 매물별 상세 링크를 만들지 않는다.
- `flag_extreme_mileage=true`인 행이 존재한다(예: `marketplace:CC00001038`의 `mileage_km=999000`). **제거하지 않고** 플래그/경고로 처리한다.
- `vehicle_age_months`는 **수집일 기준 계산값**이므로 현재 날짜 기준 나이인 것처럼 쓰지 않는다.
- `tags_json`은 JSON **문자열**이다. 상세 API에서 배열로 파싱할 수 있지만 파싱 실패 시 `[]`와 경고 로그로 처리하며 `raw_data`에는 원본을 보존한다.
- 배터리 용량·인증 주행가능거리·충전 속도는 구조화 컬럼이 없으므로 MVP 필터에서 제외한다.

## 4. 전처리 파이프라인 (Codex 구현 지침)

1. `data/raw/`의 CSV를 Python에서 **문자열 우선**으로 읽고 원본 헤더 및 고유키 검증. 원본 파일 수정 금지.
2. 빈 문자열·공백 문자열·NaN 유사 표기를 **정규화 DB 필드에서만 NULL**로 처리. 원본 raw JSON에는 복원 가능한 문자열/JSON null 저장.
3. 가격·주행거리·RAM·무게·연식 등 이미 구조화된 숫자 필드에 대해 엄격한 형식 검증 후 숫자 변환. 실패 행은 콘솔/파일 로그로 보고하고 임의로 0 대체하지 않는다.
4. `registered_month`는 문자열 유지. `listing_id`와 `source_vehicle_key`도 문자열로 유지.
5. `captured_at`는 ISO8601을 timezone-aware datetime으로 변환하여 PostgreSQL `TIMESTAMPTZ`에 저장.
6. 원본 42/41개 컬럼을 누락 없이 `raw_data`로 직렬화하고 JSON 불가능 값(NaN, NaT)을 제거.
7. 키 기준 `INSERT ... ON CONFLICT DO UPDATE`로 적재. 중복·행 누락·원본 컬럼 수·NULL 수를 결과 로그에 출력.
8. 적재 직후 `SELECT COUNT(*)`, PK 중복 검증, 대표 필터 조회, 날짜/가격 분포 검사. 이는 데이터가 정상 적재됐는지 확인하는 **기본 실행 점검**이며 광범위한 기능별 테스트는 MVP 통합 후 수행.

## 5. 초기 적재 검증 체크리스트

- 노트북 2,181건, 자동차 302건이 조회되는가?
- `product_code`/`listing_id`가 원본과 정확히 동일한가?
- 두 가격 필드를 섞지 않았는가? 자동차 `asking_price_krw`가 원 단위인가?
- 누락 가격·RAM·무게·구동방식을 0으로 채우지 않았는가?
- `registered_month='26.04'`가 숫자 변환 과정에서 깨지지 않았는가?
- 전기차 URL이 개별 매물 상세 링크인 것처럼 표시되지 않는가?
- `raw_data`에 42/41개 키가 각각 보존되는가?
- `captured_at`의 타임존이 보존되는가?
- 재적재 시 행 개수가 늘어나지 않는가?

## 6. 비범위

초기에는 자동 실시간 수집, 가격 이력 별도 테이블, 계정, 벡터 검색, RAG를 구현하지 않는다. 이후 확장 필요성이 확인되면 스키마 변경으로 도입한다.
