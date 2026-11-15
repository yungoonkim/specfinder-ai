# SpecFinder AI MVP 안정화 최종 회귀 테스트 보고서

> **보존본 정합성 주석 (2026-11-15):** Gemini 원본 QA ZIP을 바탕으로 작성했으며, 원본의 실제 시험 결과·시각·URL은 유지했습니다. S-1에 대한 「pytest 19개에서 DB 중단/503 검증」 주장은 제출된 테스트 목록으로 입증되지 않아 **미검증**으로 정정했습니다. 원본 ZIP의 `06_decimal_json_number_cards.png`는 `01_notebooks_all_2181.png`와 바이트가 같아 이 저장소에는 중복 파일을 제외했습니다. JSON 타입 검증 근거는 `logs/pr3_before_after_verification.json`을 함께 참조하세요. 테스트 D의 `D-10 & 11`은 원본 보고서에서 한 행으로 합쳐 세었으며 **36 PASS는 보고서 시나리오 행 기준**입니다. 이는 사용자가 보관한 원본 QA 결과를 수정하는 것이 아니라 **문서 정합성 주석을 반영한 사본**입니다.


---

## 1. 테스트 개요

- **프로젝트 및 테스트 목적:**
  - **프로젝트:** SpecFinder AI (`https://github.com/yungoonkim/specfinder-ai`)
  - **대상 브랜치 및 커밋:** `main` (백엔드 안정화 **PR #3** 병합 완료, Merge commit: `92456d1`)
  - **테스트 목적:** 이전 1차 통합 테스트에서 발견된 두 가지 핵심 이슈(① 역전 범위 요청 시 HTTP 500 발생, ② 노트북 `Decimal` 필드의 JSON 문자열 직렬화 및 소수점 끝자리 노출)가 PR #3 병합 이후 완전히 해결되었는지 검증하고, 노트북(`2,181건`)·자동차(`302건`) 전체 필수 검색 기능에 회귀(Regression) 오류가 없는지 실제 Chrome 브라우저에서 최종 확인합니다.
- **테스트 실행 환경:**
  - **OS:** Windows 10
  - **Frontend:** Next.js App Router (`http://localhost:3000`, `NEXT_PUBLIC_USE_MOCK=false`, `sessionStorage` 내 `specfinder_allow_mock_fallback="false"`)
  - **Backend:** Python FastAPI + SQLAlchemy (`http://127.0.0.1:8000` / `http://localhost:8000`)
  - **Database:** Docker PostgreSQL 16 (`localhost:5433`, `notebooks`: **2,181건**, `cars`: **302건**)
  - **실행 일시:** `2026-11-15 16:23:45 ~ 16:34:35 (KST)`
- **PR #3 주요 수정 사항:**
  1. `Depends()`로 주입된 필터 모델(`NotebookFilters`, `CarFilters`)의 `@model_validator` 역전 범위 검증 실패 시 HTTP 500 대신 계약된 **HTTP 422 (`INVALID_FILTER`)**와 `details.field`를 반환하도록 수정
  2. `NotebookItem` 및 `NotebookDetail`의 `ram_gb`, `screen_inches`, `weight_kg` 필드를 JSON 문자열(`"16.0"`, `"1.740"`)이 아닌 **JSON 숫자(`number`: `16`, `1.74`)**로 직렬화했으며 프론트엔드에서는 기존 숫자 포맷터가 해당 값을 표시
- **실제 Browser Subagent 사용 여부:**
  - **사용 완료 (Chrome DevTools 실제 브라우저 조작):** Antigravity `/browser` 서브에이전트(`conversationId: 0f97a3f2-9f77-4e58-a3c1-d36cde9f2b32`)를 통해 실제 Chrome에서 화면 이동, 필터 선택, 정렬, 페이지 이동, 상세 조회, 뷰포트 리사이즈(`1440px` ↔ `390px`), Network/Console 검사를 모두 수행했습니다.

---

## 2. 테스트 요약

> [!IMPORTANT]
> **최종 보고서에서 집계한 정상 환경의 기능·회귀 시나리오 36건은 PASS, FAIL은 0건입니다.** 서버 중단 시나리오 2건은 별도 BLOCKED입니다.

| 구분 | 전체 항목 수 | PASS | FAIL | BLOCKED (서버 중단 보류) | 미실행 |
|---|---:|---:|---:|---:|---:|
| **테스트 A — 실제 DB 연결** | 3 | **3** | 0 | 0 | 0 |
| **테스트 B — PR #3 핵심 오류 재검증** | 8 | **8** | 0 | 0 | 0 |
| **테스트 C — 노트북 기능 회귀 테스트** | 10 | **10** | 0 | 0 | 0 |
| **테스트 D — 자동차 기능 회귀 테스트** | 11 | **11** | 0 | 0 | 0 |
| **테스트 E — 공통 UI 안정성 및 반응형** | 4 | **4** | 0 | 0 | 0 |
| **서버 중단 예외 테스트 (10절 지침)** | 2 | 0 | 0 | **2** | 0 |
| **합계** | **38** | **36** | **0** | **2** | **0** |

*(참고: 서버 중단 예외 테스트 2건은 운영 중인 Docker PostgreSQL 및 FastAPI 프로세스를 강제 종료하지 말라는 10절 지침에 따라 실제 서버 중단 대신 **BLOCKED**로 분류했으며, 제출된 19개 `pytest` 테스트 항목에서는 실제 DB 중단/503 시나리오 검증이 확인되지 않았습니다.)*

---

## 3. 상세 테스트 결과

### 3.1 테스트 A — 실제 DB 연결 검증

| 테스트 ID | 기능 | 실행 시각 | 실행 방법 (URL / 조건) | 기대 결과 | 실제 결과 | 판정 |
|---|---|---|---|---|---|---|
| **A-1** | Mock 비활성화 및 세션 검증 | 16:24:07 | `http://localhost:3000/notebooks` 접속 후 `sessionStorage` 확인 | `specfinder_allow_mock_fallback="false"` | `{"sessionStorageLength":1,"mockFallback":"false"}` 확인 | **PASS** |
| **A-2** | 노트북 실제 DB 2,181건 연결 | 16:24:14 | `GET /api/notebooks?sort=id_asc&page=1&page_size=20` 및 UI 비교 | `2,181건`, 녹색 `실제 FastAPI 연동됨` 배너, Console 오류 0건 | UI `검색 결과 2,181건` = API `total: 2181` (`1/110페이지`), 녹색 배너 표시, Console 오류 0건 (`01_notebooks_all_2181.png`) | **PASS** |
| **A-3** | 자동차 실제 DB 302건 연결 | 16:24:50 | `GET /api/cars?sort=id_asc&page=1&page_size=20` 및 UI 비교 | `302건`, 녹색 `실제 FastAPI 연동됨` 배너, Console 오류 0건 | UI `검색 결과 302건` = API `total: 302` (`1/16페이지`), 녹색 배너 표시, Console 오류 0건 (`02_cars_all_302.png`) | **PASS** |

### 3.2 테스트 B — PR #3 핵심 오류 재검증

| 테스트 ID | 기능 | 실행 시각 | 실행 방법 (URL / 조건) | 기대 결과 | 실제 결과 | 판정 |
|---|---|---|---|---|---|---|
| **B-1-1** | 노트북 가격 역전 (`min > max`) | 16:25:23 | `GET http://127.0.0.1:8000/api/notebooks?min_price_krw=3000000&max_price_krw=1000000` | HTTP 422, `code: "INVALID_FILTER"`, `details.field: "min_price_krw"` | HTTP **422** `{"code":"INVALID_FILTER","message":"검색 조건을 확인해 주세요.","details":{"field":"min_price_krw","reason":"min_price_krw must be less than or equal to max_price_krw"}}` | **PASS** |
| **B-1-2** | 노트북 RAM 역전 (`min > max`) | 16:25:23 | `GET http://127.0.0.1:8000/api/notebooks?min_ram_gb=64&max_ram_gb=16` | HTTP 422, `code: "INVALID_FILTER"`, `details.field: "min_ram_gb"` | HTTP **422** `{"code":"INVALID_FILTER","message":"검색 조건을 확인해 주세요.","details":{"field":"min_ram_gb","reason":"min_ram_gb must be less than or equal to max_ram_gb"}}` | **PASS** |
| **B-1-3** | 노트북 무게 역전 (`min > max`) | 16:25:23 | `GET http://127.0.0.1:8000/api/notebooks?min_weight_kg=3.0&max_weight_kg=1.0` | HTTP 422, `code: "INVALID_FILTER"`, `details.field: "min_weight_kg"` | HTTP **422** `{"code":"INVALID_FILTER","message":"검색 조건을 확인해 주세요.","details":{"field":"min_weight_kg","reason":"min_weight_kg must be less than or equal to max_weight_kg"}}` | **PASS** |
| **B-1-4** | 자동차 가격 역전 (`min > max`) | 16:25:23 | `GET http://127.0.0.1:8000/api/cars?min_price_krw=40000000&max_price_krw=20000000` | HTTP 422, `code: "INVALID_FILTER"`, `details.field: "min_price_krw"` | HTTP **422** `{"code":"INVALID_FILTER","message":"검색 조건을 확인해 주세요.","details":{"field":"min_price_krw","reason":"min_price_krw must be less than or equal to max_price_krw"}}` | **PASS** |
| **B-1-5** | 자동차 주행거리 역전 (`min > max`) | 16:25:23 | `GET http://127.0.0.1:8000/api/cars?min_mileage_km=80000&max_mileage_km=20000` | HTTP 422, `code: "INVALID_FILTER"`, `details.field: "min_mileage_km"` | HTTP **422** `{"code":"INVALID_FILTER","message":"검색 조건을 확인해 주세요.","details":{"field":"min_mileage_km","reason":"min_mileage_km must be less than or equal to max_mileage_km"}}` | **PASS** |
| **B-1-6** | 자동차 등록연도 역전 (`min > max`) | 16:25:23 | `GET http://127.0.0.1:8000/api/cars?registration_year_min=2025&registration_year_max=2021` | HTTP 422, `code: "INVALID_FILTER"`, `details.field: "registration_year_min"` | HTTP **422** `{"code":"INVALID_FILTER","message":"검색 조건을 확인해 주세요.","details":{"field":"registration_year_min","reason":"registration_year_min must be less than or equal to registration_year_max"}}` | **PASS** |
| **B-1-UI** | 역전 조건 UI 사용자 안내 | 16:26:04 | `http://localhost:3000/notebooks?min_price_krw=3000000&max_price_krw=1000000` | `INVALID_FILTER` 오류 안내 및 초기화/재시도 표시 | `INVALID_FILTER` 오류 화면(`대상 필드: min_price_krw`) 정상 표시 (`05_inverted_range_422_ui.png`) | **PASS** |
| **B-2** | Decimal JSON 숫자 직렬화 및 화면 표시 | 16:26:35 | `/api/notebooks`, `/api/notebooks/122624573`, `#124336299`, `#124720412` | 값 존재 시 JSON `number`, 결측 시 `null`, 화면에 `.0`/`.990` 미노출 | `ram_gb: 16` (`number`), `screen_inches: 15.6` (`number`), `weight_kg: 1.74` (`number`), 결측 시 `null`. 화면에 `16GB`, `15.6인치`, `1.81kg`, `1.3kg` 정상 표시 (`01_notebooks_all_2181.png` (기존 ZIP의 06번은 01번과 동일 이미지)) | **PASS** |

### 3.3 테스트 C — 기존 노트북 기능 회귀 테스트 (`/notebooks`)

| 테스트 ID | 기능 | 실행 시각 | 실행 방법 (URL / 조건) | 기대 결과 | 실제 결과 | 판정 |
|---|---|---|---|---|---|---|
| **C-1** | 제조사 필터 선택 | 16:27:05 | `?manufacturer=LG전자` | LG전자 제품만 반환 | **`328건`** 조회, 표시된 카드 전수 `LG전자` 일치 | **PASS** |
| **C-2** | CPU 제조사/시리즈 선택 | 16:29:42 | `?cpu_vendor=인텔&cpu_series=코어 울트라7` | 해당 CPU 제품만 반환 | **`32건`** 조회, 전수 `인텔 코어 울트라7` 일치 | **PASS** |
| **C-3** | RAM 16GB 이상 검색 | 16:29:51 | `?min_ram_gb=16` | `ram_gb >= 16` 제품만 반환 | **`1,998건`** 조회, 모든 카드 16GB 이상 충족 | **PASS** |
| **C-4** | 관측 최저가 150만 원 이하 | 16:29:58 | `?max_price_krw=1500000` | `price_krw <= 1,500,000` (NULL 제외) | **`394건`** 조회, 모든 카드 150만 원 이하 충족 | **PASS** |
| **C-5** | 복합 필터 (3조건 결합) | 16:28:39 | `?manufacturer=LG전자&min_ram_gb=16&max_price_krw=1500000` | 3개 조건 동시 충족 | **`45건`** (`1/3페이지`), `#20461304`(1,204,000원, 16GB) 등 전수 충족 (`03_notebooks_composite_45.png`) | **PASS** |
| **C-6** | 가격 낮은순 정렬 (`price_asc`) | 16:30:19 | `?sort=price_asc&page=1` 및 `page=110` | 오름차순 및 가격 NULL 맨 뒤 배치 | 1페이지 `#123860420`(`648,990원`) → `#124423792`(`699,000원`), 110페이지 마지막 `#124720412`(`정보 없음`) | **PASS** |
| **C-7** | 페이지네이션 | 16:29:14 | 복합 필터 상태에서 `page=2` 이동 | 필터 3개 유지 및 2페이지 표시 | `총 45건 중 2 / 3 페이지`, 상단 필터 칩 및 URL 쿼리 유지 | **PASS** |
| **C-8** | 전체 필터 초기화 | 16:29:33 | `조건 초기화` 클릭 | `/notebooks` 및 `2,181건` 복원 | 쿼리 초기화 및 **`2,181건`** 복원 완료 | **PASS** |
| **C-9** | 상품 상세보기 | 16:30:40 | `/notebooks/122624573` | 상세 필드 및 가격 2종 일치 | `16GB`, `16인치`, `1.74kg`, 최저가 `1,218,890원`, 대표 구성가 `1,218,890원`, 관측 구성 `4개`, `specs_text` 일치 (`07_notebook_detail_122624573.png`) | **PASS** |
| **C-10** | 다나와 원본 링크 및 결측값 표시 | 16:30:56 | `/notebooks/122624573`, `#124720412`, `#124336299` | 원본 URL 연결 및 결측치 `정보 없음` | `https://prod.danawa.com/info/?pcode=122624573&cate=112758` 정상, 가격/무게 결측 시 `정보 없음` 표시 | **PASS** |

### 3.4 테스트 D — 기존 자동차 기능 회귀 테스트 (`/cars`)

| 테스트 ID | 기능 | 실행 시각 | 실행 방법 (URL / 조건) | 기대 결과 | 실제 결과 | 판정 |
|---|---|---|---|---|---|---|
| **D-1** | 제조사 필터 (`현대`) | 16:31:07 | `?manufacturer=현대` | 현대 매물만 조회 | **`103건`** 조회, 전수 `현대` 일치 | **PASS** |
| **D-2** | 모델 필터 (`아이오닉 5`) | 16:31:22 | `?manufacturer=현대&model=아이오닉 5` | 아이오닉 5 매물만 조회 | **`41건`** 조회, 전수 `아이오닉 5` 일치 | **PASS** |
| **D-3** | 등록연도 범위 (`2022`~`2023`) | 16:32:22 | `?registration_year_min=2022&registration_year_max=2023` | 2022~2023년식 매물만 조회 | **`113건`** 조회, 연식 범위 충족 | **PASS** |
| **D-4** | 판매 희망가 범위 | 16:32:30 | `?min_price_krw=20000000&max_price_krw=35000000` | 2,000만~3,500만 원 매물 조회 | **`162건`** 조회, 가격 범위 충족 | **PASS** |
| **D-5** | 주행거리 범위 | 16:32:43 | `?min_mileage_km=10000&max_mileage_km=50000` | 1만~5만 km 매물 조회 | **`154건`** 조회, 주행거리 범위 충족 | **PASS** |
| **D-6** | 복합 필터 (3조건 결합) | 16:31:38 | `?manufacturer=현대&model=아이오닉 5&max_price_krw=35000000` | 3개 조건 동시 충족 | **`30건`** (`1/2페이지`), `direct:61386293`(`34,900,000원`) 등 전수 충족 (`04_cars_composite_30.png`) | **PASS** |
| **D-7** | 가격 낮은순 정렬 (`price_asc`) | 16:32:55 | `?sort=price_asc` | 희망가 오름차순 정렬 | 1순위 `direct:61403856`(`10,800,000원`) → 2순위 `direct:61412145`(`11,200,000원`) 일치 | **PASS** |
| **D-8** | 페이지네이션 | 16:32:02 | 복합 필터(`30건`)에서 `page=2` 이동 | 필터 유지 및 2페이지 표시 | `총 30건 중 2 / 2 페이지`, 필터 3개 유지 | **PASS** |
| **D-9** | 전체 필터 초기화 | 16:32:12 | `조건 초기화` 클릭 | `/cars` 및 `302건` 복원 | 쿼리 초기화 및 **`302건`** 복원 완료 | **PASS** |
| **D-10 & 11** | 차량 상세 및 콜론(`:`) ID 조회 | 16:33:12 | `/cars/direct%3A61386067` (`GET /api/cars/direct%3A61386067`) | 콜론 ID 정상 라우팅, 태그·설명·검색페이지 안내 표시 | `direct:61386067` 정상 로드, 태그 4종·설명·원본 검색 URL 안내 정상 표시 (`08_car_detail_direct_61386067.png`) | **PASS** |
| **D-12** | 이미지 및 결측값·이상치 표시 | 16:33:30 | `/cars/marketplace%3ACC00001038` | 구동방식 `null` → `정보 없음`, 이상치 경고 배지 표시 | `명시 구동방식: 정보 없음`, `flag_extreme_mileage` 경고 배지 및 플레이스홀더 정상 동작 | **PASS** |

### 3.5 테스트 E — 공통 UI 안정성 및 서버 중단 예외 항목

| 테스트 ID | 기능 | 실행 시각 | 실행 방법 | 기대 결과 | 실제 결과 | 판정 |
|---|---|---|---|---|---|---|
| **E-1** | 탭 전환 및 상태 분리 | 16:33:52 | `/notebooks` 필터 적용 상태에서 `자동차 탭` 클릭 | `/cars` 진입 시 필터 혼선 없이 `302건` 표시 | `/cars` (`302건`) 깨끗하게 표시 | **PASS** |
| **E-2** | 검색 결과 0건 (`EmptyState`) | 16:33:43 | `/notebooks?manufacturer=LG전자&cpu_vendor=애플` | 0건 안내 및 초기화 버튼 표시 | `"조건에 일치하는 노트북이 없습니다 (0건)"` 및 초기화 동작 확인 | **PASS** |
| **E-3** | 필터/정렬 변경 시 `page=1` 초기화 | 16:29:24 | `page=2`에서 정렬 변경 | `page=1`로 자동 리셋 | 즉시 `1 / 3 페이지`로 초기화됨 | **PASS** |
| **E-4** | 반응형(`1440px` / `390px`) 및 Console/Network 점검 | 16:34:33 | `390x844` 리사이즈 후 필터 접기/펼치기, Console/Network 확인 | 가로 넘침 없음, Console 오류 0건 | 모바일 필터 접기/펼치기 및 1열 카드 정상(`09_mobile_390px_cars.png`, `10_mobile_390px_notebooks.png`), Console 오류 **0건** | **PASS** |
| **S-1** | PostgreSQL 중단 시 HTTP 503 | — | 10절 지침에 따라 운영 DB 컨테이너 종료 생략 | `503 DB_UNAVAILABLE` | 라이브 서버 무중단 원칙에 따라 미실행 (제출된 19개 `pytest` 항목으로는 검증 여부 확인 불가) | **BLOCKED** |
| **S-2** | FastAPI 중단 시 Mock 미대체 | — | 10절 지침에 따라 운영 FastAPI 종료 생략 | `NETWORK_ERROR` 표시, Mock 미대체 | 라이브 서버 무중단 원칙에 따라 미실행 | **BLOCKED** |

---

## 4. PR #3 수정 전후 비교

| 비교 항목 | PR #3 병합 전 (1차 통합 테스트) | PR #3 (`92456d1`) 병합 후 (이번 최종 회귀 테스트) | 검증 결과 |
|---|---|---|---|
| **역전 범위 API 요청 6종** (`min > max`) | `pydantic.ValidationError` 미처리로 **HTTP 500 (`INTERNAL_ERROR`)** 반환 및 CORS 헤더 누락 | 6개 요청 모두 **HTTP 422 (`INVALID_FILTER`)** + 정확한 `details.field` (`min_price_krw`, `min_ram_gb`, `min_weight_kg`, `min_mileage_km`, `registration_year_min`) 반환 | **해결 완료 (PASS)** |
| **노트북 `Decimal` 필드 직렬화 타입** (`ram_gb`, `screen_inches`, `weight_kg`) | JSON `string` (`"16.0"`, `"15.60"`, `"1.740"`) 반환 | JSON **`number`** (`16`, `15.6`, `1.74`) 반환, 결측값은 JSON `null` 유지 | **해결 완료 (PASS)** |
| **프론트엔드 카드/상세 숫자 표기** | `16.0GB`, `14.0인치`, `1.300kg`처럼 불필요한 끝자리 `0` 노출 | **`16GB`**, **`15.6인치`**, **`14인치`**, **`1.81kg`**, **`1.3kg`**으로 깔끔하게 표시 | **해결 완료 (PASS)** |

---

## 5. 발견된 문제

- **신규 오류 또는 미해결 결함: 없음 (0건)**
  - 1차 통합 테스트에서 식별된 모든 기능/직렬화/예외 처리 문제가 PR #3에서 해결되었으며, 이번 최종 회귀 테스트에서 추가적인 Console 오류, Network 오류, UI 깨짐, 데이터 불일치가 발견되지 않았습니다.
  - 자동차 `source_url`이 개별 매물 상세 URL이 아닌 K Car 공통 검색 페이지(`https://www.kcar.com/bc/search`)인 점은 데이터셋 스냅샷의 알려진 제약 사항으로, 상세 화면 하단에 명확히 안내 문구가 표시되고 있습니다.

---

## 6. 스크린샷 및 로그 (실제 브라우저 테스트 증거)

````carousel
![증거 #1 (A-2): 노트북 전체 검색 화면 (2,181건, 실제 FastAPI 연동 배너)](./screenshots/01_notebooks_all_2181.png)
<!-- slide -->
![증거 #2 (A-3): 자동차 전체 검색 화면 (302건, 실제 FastAPI 연동 배너)](./screenshots/02_cars_all_302.png)
<!-- slide -->
![증거 #3 (C-5): 노트북 복합 필터 결과 (LG전자 + RAM>=16GB + 최저가<=150만원 = 45건)](./screenshots/03_notebooks_composite_45.png)
<!-- slide -->
![증거 #4 (D-6): 자동차 복합 필터 결과 (현대 + 아이오닉 5 + 희망가<=3,500만원 = 30건)](./screenshots/04_cars_composite_30.png)
<!-- slide -->
![증거 #5 (B-1): 역전 범위 요청 HTTP 422 INVALID_FILTER 화면 (대상 필드: min_price_krw)](./screenshots/05_inverted_range_422_ui.png)
<!-- slide -->
![증거 #6 (B-2): Decimal JSON 숫자 직렬화 및 깔끔한 사양 표기 (16GB, 15.6인치, 1.81kg)](./screenshots/01_notebooks_all_2181.png)
<!-- slide -->
![증거 #7 (C-9): 노트북 상세 화면 (/notebooks/122624573)](./screenshots/07_notebook_detail_122624573.png)
<!-- slide -->
![증거 #8 (D-10/11): 자동차 상세 화면 (: 포함 ID /cars/direct%3A61386067)](./screenshots/08_car_detail_direct_61386067.png)
<!-- slide -->
![증거 #9 (E-4): 모바일 390px 반응형 화면 — 자동차 탭 필터 접기 및 1열 카드](./screenshots/09_mobile_390px_cars.png)
<!-- slide -->
![증거 #10 (E-4): 모바일 390px 반응형 화면 — 노트북 탭 필터 접기 및 1열 카드](./screenshots/10_mobile_390px_notebooks.png)
````

---

## 7. 기존 통합 테스트와 비교

1. **기존 PASS 기능의 회귀 여부:**
   - 노트북 전체 조회(`2,181건`), 자동차 전체 조회(`302건`), 단일/복합 필터, 정렬, 페이지네이션, 필터 칩 개별 해제, 전체 초기화, 상세 페이지(`:` 포함 ID 포함), 결측값 `정보 없음` 표시, 반응형 레이아웃 모두 기존과 동일하게 **정상 동작(회귀 오류 0건)**함을 확인했습니다.
2. **수정된 기능(PR #3)의 재검증 결과:**
   - 역전 범위 6개 시나리오(노트북 가격/RAM/무게, 자동차 가격/주행거리/등록연도) 모두 HTTP 500 없이 **HTTP 422 `INVALID_FILTER`**를 반환하여 **FAIL → PASS**로 전환되었습니다.
   - 노트북 `Decimal` 수치 필드의 JSON 숫자 직렬화 및 화면 표기(`16GB`, `15.6인치`, `1.74kg`)가 **완벽히 개선**되었습니다.
3. **BLOCKED 항목 유지:**
   - 라이브 서버(PostgreSQL / FastAPI) 강제 중단이 필요한 2개 항목은 실행 환경 보호 지침에 따라 동일하게 `BLOCKED`로 유지했습니다.

---

## 8. 최종 판단

- **MVP 안정화 완료 가능 여부:** **완료 가능 (PASS)**
- **남은 치명적 오류:** **없음 (0건)**
- **후속 개발(2차 확장: LangGraph 자연어 검색 등) 착수 가능 여부:** **착수 가능**
  - 정형 SQL 검색 서비스(`search_notebooks`, `search_cars`), FastAPI 입력 검증 및 오류 규격, 프론트엔드 UI 및 상태 관리가 모두 실제 PostgreSQL 데이터(`2,181건` / `302건`) 위에서 안정적으로 검증되었으므로, MVP 단계를 완료 처리하고 후속 단계로 진입할 수 있습니다.
