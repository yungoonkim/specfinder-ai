# SpecFinder AI 프로젝트 기획안

**버전:** v1.1 · **작성일:** 2026-11-13  
**상태:** MVP 범위 및 기술 아키텍처 확정 (Next.js + FastAPI + PostgreSQL)  
**핵심 원칙:** 필수 기능 전체를 먼저 구현 → 전체 통합 테스트 → 오류 수정·안정화 → 기능 확장

> 이 문서는 실제 업로드된 `danawa_notebook(2).csv`(2,181행·42열)와 `kcar_ev_all(2).csv`(302행·41열)를 검사한 결과에 근거한다. 숫자와 데이터 제약은 현재 파일 스냅샷 기준이다.

## 1. 프로젝트 개요

**서비스명:** SpecFinder AI  
**목표:** 하나의 웹서비스에서 노트북과 중고 전기차를 탭으로 나누어, 각각의 SQL 테이블에서 조건에 맞는 제품·매물을 조회한다. 나중에 LangGraph 자연어 검색을 기존 조회 함수에 연결한다.

### 확정된 제품 결정

| 항목 | 결정 |
|---|---|
| 웹서비스 | 통합 서비스(unified), 노트북 탭 / 자동차 탭 |
| 초기 인증 | 없음(guest), 누구나 검색 가능 |
| 데이터베이스 | PostgreSQL 1개, 업무 데이터 테이블 2개(`notebooks`, `cars`) |
| 프론트엔드 | Next.js + React + TypeScript (Gemini 담당) |
| 백엔드 | Python FastAPI + Pydantic + SQLAlchemy (Codex 담당) |
| MVP | 두 탭, CSV 적재, 기본 조건 필터, 결과 목록·정렬·페이지네이션 |
| 우선 구현 | 노트북 검색 먼저 → 동일 패턴으로 자동차 탭 연결 |
| AI 검색 / LangGraph | **MVP 이후** 별도 개발 |
| RAG 및 벡터 검색 | **MVP 이후** 필요할 때 추가 |
| 검증 정책 | 기능마다 광범위한 테스트로 개발을 중단하지 않음. 필수 기능 연결 후 전체 시나리오 통합 테스트에 집중 |

### 이번 MVP에서 하지 않는 일

개인화 추천, 로그인·회원 관리, 실시간 중고차 재고 보장, 가격 알림, 가격 이력 테이블, 복잡한 멀티 에이전트, RAG, Redis, Kubernetes, 관리자 대시보드는 범위에서 제외한다. 필수 검색을 완성한 뒤 사용해 보고 추가한다.

## 2. 사용자 화면과 검색 흐름

- **노트북 탭 `/notebooks`**: 제조사, CPU 제조사·시리즈, RAM, 가격 범위, 무게 등. 제품명, CPU, RAM, 무게, 가격, 수집일을 카드/표로 표시한다.
- **자동차 탭 `/cars`**: 제조사, 모델, 가격 범위, 등록 연도, 주행거리, 지역 등. 매물 제목, 가격, 연식, 주행거리, 상태, 수집일을 표시한다.
- **검색 UX**: 필터 선택 → 서버에 조건 전송 → 대상 테이블 `SELECT` → 조회 결과·총 건수·정렬·페이지네이션 표시.
- **빈 결과 UX**: 결과 0건 메시지와 필터 초기화 제공. 조건을 무단 완화하지 않는다.
- **후속 단계**: AI 채팅창에서 자연어를 필터 JSON으로 변환하고 같은 검색 함수를 호출한다.

```text
브라우저: 노트북 탭 ─┐
                   ├─> 검색 API ──> PostgreSQL: notebooks / cars
브라우저: 자동차 탭 ┘                         │
                   <────────── JSON 목록·총 건수·수집일

[2차] 자연어 검색 ──> LangGraph ──> 동일한 검색 함수/SQL
```

## 3. 실제 CSV 점검 결과

| 데이터 | 원본 행/열 | 유일 식별자 | 수집 시점 | 특별 주의사항 |
|---|---:|---|---|---|
| 노트북 | 2,181행 / 42열 | `product_code` 중복 0건 | 2026-10-30 (UTC 시각 포함) | 가격 2건 누락, 무게 29건 누락, 배터리 사용시간 1,728건 누락 |
| 전기차 | 302행 / 41열 | `listing_id` 중복 0건 | 2026-09-21 (+09:00) | `source_url` 302건 모두 동일한 검색 페이지; 구동방식 명시값 138건 |

### 3.1 노트북 데이터의 주요 함정

- `own_configuration_price_krw`와 `min_observed_configuration_price_krw`는 **서로 다른 가격**이다. 검색·표시에는 선택한 가격 기준을 명시한다. 두 값 모두 2건씩 비어 있다.
- `observed_configuration_count`는 구성의 **관측 개수**다. CSV가 개별 구성별 상품·가격 행을 보장하는 것은 아니다.
- `registered_month` 값은 `26.04` 같은 표기다. 자동 숫자 변환 과정에서 `26.10`이 `26.1`로 바뀔 수 있으므로 **문자열로 읽고 보존**한다.
- RAM 값 1건, 무게 29건, 배터리 최대 사용시간 1,728건이 누락된다. `NULL`을 0으로 대체하지 않고 해당 수치 필터에서 적절히 제외한다.
- 원본에는 `base_storage_text`(예: `256GB`, `1TB`)가 있으므로 정규화 숫자 컬럼이 없을 때는 무리한 저장장치 정밀 필터를 제공하지 않는다.
- 제품마다 서로 다른 `source_url`이 존재하며, 페이지 추출 관련 `first_page`, `last_page`는 검색의 핵심 정보가 아니다.

### 3.2 전기차 데이터의 주요 함정

- `listing_id` 예: `direct:61386067` → **문자형 기본키**. `source_vehicle_key`와 혼동하지 않는다.
- `asking_price_krw`는 판매 희망가. 최신 가격·판매 가능 여부를 보장하지 않는다.
- `previous_price_krw`는 **2건만** 채워져 있다. 가격 이력 전체가 있는 것처럼 표시하면 안 된다.
- `source_url`은 302행 모두 `https://www.kcar.com/bc/search`로 동일하다. **매물별 상세 URL로 사용하지 않는다.**
- `drive_text_explicit`는 138건에만 값이 있다(164건 누락). 구동방식을 추정해서 채우지 않는다.
- `flag_extreme_mileage` 1건, `flag_future_registration` 0건. 이상치는 경고 표시·필터 정책으로 처리한다.
- `vehicle_age_months`는 **수집 시점 기준** 계산값이므로 현재 차량 나이처럼 표시하지 않는다.
- 배터리 용량, 인증 1회 충전 거리, 충전 속도, 배터리 SOH는 정형 컬럼에 없다. MVP 정확 필터에서 제외한다.
- `tags_json`은 JSON 문자열이므로 파싱 오류를 처리하고 `raw_data`에도 보존한다.

## 4. DB 설계: 업무 테이블은 딱 2개

DB 이름(예): `specfinder_db`. 초기에는 **제품 테이블과 매물 테이블만** 둔다. 원본 전체 42/41개 컬럼은 `raw_data JSONB`로 보존하고, 검색·표시에 필요한 컬럼만 별도 정규화한다. 이는 원본 컬럼의 손실 없이 DB를 작게 유지하기 위한 방식이다.

### 4.1 권장 스키마 초안 (PostgreSQL)

```sql
CREATE TABLE notebooks (
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

CREATE TABLE cars (
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

CREATE INDEX idx_notebooks_manufacturer_price
    ON notebooks (manufacturer, min_observed_configuration_price_krw);
CREATE INDEX idx_notebooks_cpu_ram
    ON notebooks (cpu_vendor, ram_gb);
CREATE INDEX idx_cars_manufacturer_price
    ON cars (manufacturer, asking_price_krw);
CREATE INDEX idx_cars_year_mileage
    ON cars (registration_year, mileage_km);
```

**중요:** 이 SQL은 구현 착수용 스키마 초안이다. 정확한 길이·수치 제약·유니크 정책·인덱스는 실측 SQL 조회와 정제 정책을 바탕으로 결정한다. 필터가 없는 컬럼도 `raw_data`에 원문을 남긴다.

### 4.2 모든 CSV 원본 컬럼 보존 정책

**노트북 원본 42개:**  
`product_code`, `name`, `own_configuration_price_krw`, `min_observed_configuration_price_krw`, `observed_configuration_count`, `additional_collapsed_configurations`, `manufacturer`, `product_type`, `screen_inches`, `weight_kg`, `os`, `max_battery_hours`, `resolution`, `refresh_hz`, `brightness_nit`, `cpu_vendor`, `cpu_series`, `cpu_model`, `npu_tops`, `gpu_type`, `gpu_model`, `gpu_core_count`, `vram_gb`, `tgp_w`, `ram_gb`, `ram_replaceable_text`, `base_storage_text`, `battery_wh`, `usb_pd_text`, `registered_month`, `general_specs`, `screen_specs`, `cpu_specs`, `gpu_specs`, `configuration_specs`, `specs_text`, `shop_review_text`, `danawa_review_text`, `source_url`, `first_page`, `last_page`, `captured_at`.

**전기차 원본 41개:**  
`listing_id`, `source_vehicle_key`, `id_source`, `sales_channel`, `title`, `manufacturer`, `model`, `trim`, `model_parse_ok`, `fuel`, `registration_text`, `registration_year`, `registration_month`, `registration_ym`, `model_year_explicit`, `vehicle_age_months`, `mileage_text`, `mileage_km`, `mileage_is_approximate`, `price_text`, `asking_price_krw`, `previous_price_krw`, `installment_monthly_krw`, `branch_or_region`, `status_label`, `drive_text_explicit`, `tags_json`, `description`, `promotion_text`, `price_negotiable`, `placement`, `thumbnail_url`, `source_url`, `source_file`, `captured_at`, `flag_extreme_mileage`, `flag_future_registration`, `tag_one_owner_listed`, `tag_no_insurance_history_listed`, `tag_manufacturer_warranty_listed`, `first_captured_at`.

ETL은 CSV를 문자열 중심으로 안전하게 읽고, 별도 검증한 숫자·시간 필드만 타입 변환한다. `raw_data`는 CSV 원문 의미가 최대한 유지되도록 적재한다. NaN이나 잘못된 JSON은 직렬화 전에 정리한다.

## 5. 확정 기술 아키텍처 — Next.js + FastAPI + PostgreSQL

이번 프로젝트는 **프론트엔드와 백엔드를 분리하는 구조로 확정**한다. 추후 LangGraph를 FastAPI 백엔드에 추가하면서 기존 Python 검색 함수를 재사용한다.

```text
사용자 브라우저
    │
    ▼
frontend/ (Next.js + React + TypeScript)
    - 노트북 / 자동차 탭, 필터, 결과 카드
    - 검색 조건 전달, 결과 렌더링
    │ HTTP JSON (개발 중 CORS 또는 프록시 설정)
    ▼
backend/ (Python FastAPI + Pydantic + SQLAlchemy)
    - 필터 파라미터 검증, SQL 검색 API
    - Python/Pandas CSV 정제 및 적재 코드 연계
    - [2차] LangGraph 자연어 검색 추가
    │ SQL (바인딩 파라미터)
    ▼
PostgreSQL (notebooks, cars)
```

- **Next.js:** UI·클라이언트 상태·라우팅 및 화면 렌더링 담당. Next.js 자체도 서버 기능을 제공하지만, **이 프로젝트의 업무 검색 API와 DB 접근은 FastAPI가 담당**한다.
- **FastAPI:** `/api/notebooks`, `/api/cars` 등 JSON 검색 API, Pydantic 입력 검증, SQLAlchemy DB 조회 담당.
- **PostgreSQL:** 두 업무 테이블의 원본 및 정규화 값 저장. 직접 SQL SELECT, 인덱스, 정렬·페이지네이션 수행.
- **Python CSV 처리:** Pandas로 안전한 파싱·정규화·NULL 처리 후 PostgreSQL 적재. 원본 42/41개 컬럼은 `raw_data JSONB`로 보존.
- **LangGraph:** MVP 완성·통합 테스트 이후 **기존 FastAPI 백엔드 안에** 추가. 동일한 `search_notebooks` / `search_cars` 조회 함수를 재사용.

**선정 이유:** MVP SQL 검색 기능과 이후 AI 자연어 검색을 모두 Python으로 유지해 중복 구현을 줄인다. 프론트엔드 디자인 작업과 백엔드 개발도 파일 단위로 명확하게 분담할 수 있다.

**인지할 단점:** Next.js와 FastAPI 개발 서버가 각각 필요하며, API 요청·응답 계약과 CORS(또는 개발용 프록시)를 관리해야 한다. 이 비용은 향후 LangGraph 통합 시 Python 검색 로직 재사용을 위한 의도적인 선택이다.

## 6. API 계약 초안 (FastAPI 백엔드 기준)

| 메서드 | 경로 | 기능 |
|---|---|---|
| `GET` | `/api/notebooks` | 노트북 필터 검색, 정렬, 페이징 |
| `GET` | `/api/notebooks/{product_code}` | 노트북 상세 |
| `GET` | `/api/cars` | 전기차 필터 검색, 정렬, 페이징 |
| `GET` | `/api/cars/{listing_id}` | 전기차 상세 |
| `GET` | `/api/health` | 서버 기본 동작 확인 |

**노트북 쿼리 예:** `GET /api/notebooks?manufacturer=LG전자&cpu_vendor=인텔&min_ram_gb=16&max_price_krw=1500000&sort=price_asc&page=1&page_size=20`  
**자동차 쿼리 예:** `GET /api/cars?manufacturer=현대&max_price_krw=30000000&max_mileage_km=50000&sort=price_asc&page=1&page_size=20`

- `max_price_krw`는 노트북에서는 **최저 관측 가격** 기준임을 UI·계약에 명시한다. 자동차는 `asking_price_krw` 기준이다.
- 필터 미지정 = 전체 결과, 값 불일치 = 0건; `NULL`은 숫자 필터에 일치하지 않음.
- 페이지는 1부터, 페이지 크기는 기본 20·최대 100으로 제한한다.
- 정렬 키는 `price_asc`, `price_desc`, `newest_capture`처럼 명시된 값만 허용한다. 기본 정렬은 도메인별 ID로 안정화한다.
- 요청 파라미터는 숫자·범위 검증, SQL은 바인딩 파라미터를 사용한다.

**성공 응답 예시(구조):**

```json
{
  "items": [
    {
      "id": "122624573",
      "name": "LG전자 그램북 16U55U-GSOWK",
      "manufacturer": "LG전자",
      "price_krw": 1218890,
      "price_basis": "min_observed_configuration_price_krw",
      "captured_at": "2026-10-30T08:06:03.274Z"
    }
  ],
  "total": 2181,
  "page": 1,
  "page_size": 20
}
```

이 JSON은 **스키마 설명을 위한 예시**다. 위 필터에 대한 실제 검색 결과 2,181건을 의미하지 않는다. 가격·건수는 DB에서 조회한 그대로 반환한다.

**오류 응답:** HTTP 400(필터 오류), 404(존재하지 않는 ID), 500(서버 오류). 오류 코드는 `code`, `message`, `details` 필드를 기준으로 통일한다.

## 7. 구현 순서와 통합 테스트 정책

### 구현 구간 — 필수 기능 먼저 빠르게 완성

1. DB 2개 테이블 생성 및 두 CSV 적재.
2. 노트북 조건 검색 API + 탭 UI 연결.
3. 같은 구조로 자동차 검색 API + 탭 UI 연결.
4. 필터, 정렬, 페이지네이션, 데이터 수집 시점, 빈 결과 UI 연결.
5. 기본 실행 확인(앱 시작, DB 연결, 주요 화면 진입)만 수행하면서 전체 흐름을 완성.

### 통합 테스트 구간 — 전체 프로그램을 한 번에 집중 검증

- 두 탭을 오가며 필터 상태가 섞이지 않는지 확인.
- 단일 필터/복합 필터/선택 해제/초기화/결과 0건/잘못된 범위 확인.
- `notebooks` 2,181건, `cars` 302건 적재·중복·ID 확인.
- 가격·RAM·무게·주행거리의 `NULL`과 경곗값 확인.
- 필터 적용 후 `total`, 정렬, 페이지 이동이 일치하는지 확인.
- 노트북 대표 가격과 최저 관측 가격 혼동 여부 확인.
- 전기차 공통 URL이 개별 상세 페이지처럼 처리되지 않는지 확인.
- 수집 시점과 오래된 매물 안내 표시 확인.
- 쿼리 파라미터 검증 및 SQL Injection 방지 확인.
- 주요 화면 모바일 폭 테스트 및 서버 오류 메시지 확인.

**출시 기준:** 필수 기능 전체가 연결되고, 주요 시나리오 통합 테스트에서 차단 수준의 오류가 없으며, 데이터 원본과 검색 결과가 일치할 것. 기능별 광범위한 테스트를 통과해야 다음 기능을 만드는 방식은 적용하지 않는다.

## 8. Gemini·Codex·DeepSeek 협업 방식

### 8.1 '소스코드를 여러 벌 복제하고 기획안만 주는 방식'의 문제

폴더에 프로젝트 복사본을 두 개 만들고 각각 수정하면 **같은 파일이 서로 다르게 발전**한다. 마지막에 어떤 버전을 합칠지 판단하기 어렵고, 파일 복사로 병합하면 변경 사항이 덮어써질 수 있다. **기획안 하나만 넣는 것도 부족하다.** 에이전트가 API 필드·DB 컬럼·수정 가능 디렉터리를 서로 다르게 해석하기 때문이다.

### 8.2 권장 운영: Git 저장소 하나 + 분리된 작업 공간

- **한 Git 저장소**를 단일 기준으로 사용한다.
- 간단하게 시작할 때는 **같은 저장소에서 번갈아 작업**시킨다. 한 에이전트가 작업하는 동안 다른 에이전트가 같은 파일을 수정하지 않는다.
- 병렬 작업이 필요하면 **별도 Git worktree를 프로젝트 폴더 밖의 형제 디렉터리**로 만들고 브랜치를 분리한다(프로젝트 내부에 복제본을 중첩하지 않는다).
- **Codex:** `backend/` DB·API·ETL 담당. **Gemini:** `frontend/` UI·스타일 담당. **DeepSeek:** 테스트 시나리오 및 독립 리뷰.
- 공통 파일·API 계약 변경은 한 담당자만 수행한다. 작업 결과는 Git 변경 내역 검토 후 병합한다.

```text
workspace/
├─ specfinder-ai/             # 메인 Git 저장소
├─ specfinder-codex/          # 필요 시 별도 worktree (backend 브랜치)
└─ specfinder-gemini/         # 필요 시 별도 worktree (frontend 브랜치)
```

### 8.3 기획안 외에 공유할 핵심 문서

| 파일 | 내용 |
|---|---|
| `docs/PRD.md` | 본 기획안의 MVP 범위와 비목표 |
| `docs/TECH_STACK.md` | 기술 선택 이유·Next.js/FastAPI 확정 아키텍처 |
| `docs/API_CONTRACT.md` | 요청 필터, JSON 응답, 오류 규칙 |
| `docs/DATA_DICTIONARY.md` | 42/41컬럼 원본·NULL·타입 변환 주의 |
| `AGENTS.md` | 공통 작업 원칙, 파일 소유권, 변경 금지, 테스트 전략 |
| `GEMINI.md` (선택) | Gemini 전용 UI 작업 경로 및 완료 요청 형식 |

**중요:** `AGENTS.md`는 Codex에서 읽히는 프로젝트 지침으로 활용할 수 있지만, Gemini/Antigravity가 자동으로 읽는 지침 파일의 형식은 사용하는 도구의 설정을 확인한다. *자동 참조를 가정하지 말고 각 작업 시작 시 명시적으로 문서 경로를 알려준다.*

### 8.4 에이전트별 최초 작업 지시(요약)

**Codex:** “`docs/PRD.md`, `docs/API_CONTRACT.md`, `docs/DATA_DICTIONARY.md`를 기준으로 DB 2개 테이블과 검색 API를 구현해라. 노트북 `registered_month`는 문자열로 유지하고, 전기차 `listing_id`는 TEXT로 사용해라. 소스 파일을 임의로 변경·삭제하지 마라. AI/RAG·추가 업무 테이블은 구현하지 마라.”

**Gemini:** “동일한 문서와 API 계약을 읽고 노트북/자동차 탭, 조건 필터, 결과 카드, 빈 상태, 로딩 및 오류 화면을 작성해라. DB 스키마와 API 응답 스키마는 변경하지 말고, 필요 시 계약 변경 요청을 문서로 제안해라.”

**DeepSeek:** “두 CSV의 데이터 제약을 반영한 통합 테스트 시나리오를 작성하고, 필수 기능 연결 후 검색 필터·데이터 누락·정렬·탭 전환의 오류 가능성을 독립적으로 리뷰해라. 소스 수정은 주 담당자가 승인한 파일에서만 수행해라.”

## 9. 원본 이미지의 8단계 개발 워크플로우 반영

| 단계 | SpecFinder AI에서의 적용 |
|---|---|
| 01 문제·목표 정의 | 두 탭 + 필터 검색 MVP로 범위 확정 |
| 02 지식·평가셋 준비 | 두 CSV 분석, 데이터 사전과 통합 테스트 시나리오 준비 |
| 03 에이전트 설계 | 2차 확장 때 LangGraph 라우터·필터 추출·검색 도구 설계 |
| 04 프로토타입 구현 | DB + 검색 API + 전체 필수 UI 우선 구현 |
| 05 평가·검증 | 필수 기능 구현을 마친 후 전체 통합 테스트·안정화 |
| 06 배포·서비스 연동 | 로컬 안정화 후 웹 배포 및 DB 연결 |
| 07 운영·모니터링 | 기본 오류 로그와 응답 시간부터 시작 |
| 08 분석·개선 | LangGraph → 채팅 검색 → 비교 → 필요 시 RAG 순서로 확장 |

## 10. 최종 결정 및 다음 작업

1. 현재까지 **확정**: 통합 서비스, guest, DB 두 테이블, 노트북 우선, 필수 기능 완성 후 통합 테스트, LangGraph/RAG 후순위.
2. **기술 아키텍처 확정**: `frontend/`는 Next.js + React + TypeScript, `backend/`는 Python FastAPI + Pydantic + SQLAlchemy. 두 서비스 모두 PostgreSQL의 `notebooks`, `cars`를 사용하되 DB 직접 접근은 FastAPI 백엔드로 제한한다.
3. 다음 실행 산출물: 확정된 아키텍처로 프로젝트 골격, SQL 생성 스크립트, CSV 적재 스크립트, 프론트 UI, FastAPI 필터 검색 API 구현.

---

**문서의 범위:** 현재 소스 파일과 합의된 MVP를 기반으로 한 구현 지침. 데이터셋의 판매·가격·상품 상태는 수집 시점의 관측값이며 실시간 정보가 아니다.
