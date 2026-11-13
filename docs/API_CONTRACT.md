# SpecFinder AI — API 계약 (MVP v1.0)

> **상태: 구현 기준 문서** · 2026-11-13  
> **저장소:** https://github.com/yungoonkim/specfinder-ai  
> **담당:** FastAPI 구현 Codex / Next.js 구현 Gemini  
> **기준:** `docs/PRD.md`, `docs/DATA_DICTIONARY.md`  
> API 계약의 변경은 구현 전에 `main`에서 합의하고 양측 브랜치에 반영한다.

## 1. 공통 규칙

- 기본 URL: 개발용 FastAPI `http://localhost:8000`. 모든 API 경로는 `/api`로 시작한다. 프론트엔드의 API 주소는 `NEXT_PUBLIC_API_BASE_URL`로 설정한다.
- 응답: UTF-8 JSON, 필드명 `snake_case`, 가격 **원(KRW) 정수**, 무게 **kg**, 주행거리 **km**, 날짜/시간 ISO 8601(타임존 포함).
- 모든 검색은 PostgreSQL `notebooks` 또는 `cars` 테이블에서 읽는다. 프론트엔드는 DB에 직접 연결하지 않는다.
- 공개·읽기 전용(guest). MVP에는 인증·사용자 정보·채팅·LangGraph가 없다.
- 페이지: `page` 기본 1, 최소 1. `page_size` 기본 20, 1~100. `total`은 페이지 제한 전의 조건 일치 건수다.
- 공통 `sort` 기본 `id_asc`. 허용값 이외의 입력은 422. 정렬 값이 동일하면 기본 ID 기준 오름차순으로 순서를 안정화한다.
- 누락된 숫자/문자 속성은 JSON `null`로 반환한다. **NULL 값은 해당 숫자/문자 필터와 일치하지 않으며**, 가격이 NULL인 상품도 가격 범위를 지정했다면 검색 결과에서 제외한다.
- 텍스트 필터는 원본 정규화 필드와 정확 일치(`=`)를 기본으로 한다. 쉼표 구분 다중 선택, 검색어 전문 검색, 퍼지 검색은 MVP 범위 밖이다.
- 범위 인자의 값은 경계 포함(`>= min`, `<= max`), min > max이면 422. 미지정 필터는 적용하지 않는다.
- 필터 옵션은 별도 `facets` API에서 조회하며 이 API의 옵션 값이 검색 파라미터와 일치해야 한다. 화면에서는 `label`을 그대로 출력한다.
- 개인 정보, 내부 DB 오류 또는 스택 트레이스를 클라이언트로 반환하지 않는다.

## 2. 엔드포인트 목록

| 메서드 | 경로 | 목적 |
|---|---|---|
| GET | `/api/health` | 서버 상태 |
| GET | `/api/notebooks` | 노트북 조건 검색 |
| GET | `/api/notebooks/facets` | 노트북 필터 선택 값 |
| GET | `/api/notebooks/{product_code}` | 노트북 상세 |
| GET | `/api/cars` | 전기차 조건 검색 |
| GET | `/api/cars/facets` | 자동차 필터 선택 값 |
| GET | `/api/cars/{listing_id}` | 자동차 매물 상세 |

> **라우팅 유의:** `/facets`를 동적 `/{id}` 경로보다 우선 매칭되도록 선언한다. 자동차 `listing_id`에는 `:`가 포함되므로 프론트에서 경로 세그먼트를 `encodeURIComponent`로 인코딩한다.

## 3. 노트북 검색: `GET /api/notebooks`

| 파라미터 | 타입 | 기본값 | DB 필드 / 의미 |
|---|---|---|---|
| `manufacturer` | string | 없음 | 제조사 정확 일치 |
| `cpu_vendor` | string | 없음 | CPU 제조사 정확 일치 |
| `cpu_series` | string | 없음 | CPU 시리즈 정확 일치 |
| `gpu_type` | string | 없음 | GPU 유형 정확 일치 |
| `min_ram_gb` | number >= 0 | 없음 | `ram_gb >=` |
| `max_ram_gb` | number >= 0 | 없음 | `ram_gb <=` |
| `min_price_krw` | integer >= 0 | 없음 | `min_observed_configuration_price_krw >=` |
| `max_price_krw` | integer >= 0 | 없음 | `min_observed_configuration_price_krw <=` |
| `min_weight_kg` | number >= 0 | 없음 | `weight_kg >=` |
| `max_weight_kg` | number >= 0 | 없음 | `weight_kg <=` |
| `page` | integer >= 1 | 1 | 페이지 |
| `page_size` | integer 1~100 | 20 | 페이지 크기 |
| `sort` | enum | `id_asc` | 아래 정렬 옵션 |

정렬: `id_asc`, `price_asc`, `price_desc`, `ram_desc`, `weight_asc`, `newest_capture`. `price_asc`는 가격 NULL을 맨 뒤에 배치한다. 가격 NULL의 `price_desc` 역시 맨 뒤에 배치한다.

**가격의 의미:** 검색 카드의 `price_krw`는 `min_observed_configuration_price_krw`다. 이는 관측된 구성 중 최저 가격이며 **대표 구성 가격 또는 현재 판매가와 동일하다고 보장하지 않는다**. `own_configuration_price_krw`는 별도 표시하되 최저가와 섞지 않는다.

예시:

```http
GET /api/notebooks?manufacturer=LG전자&min_ram_gb=16&max_price_krw=1500000&sort=price_asc&page=1&page_size=20
```

**응답(200):**

```json
{
  "items": [
    {
      "id": "122624573",
      "name": "LG전자 그램북 16U55U-GSOWK",
      "manufacturer": "LG전자",
      "product_type": "AI노트북",
      "cpu_vendor": "AMD",
      "cpu_series": "라이젠AI 5",
      "cpu_model": "430 (4.5GHz)",
      "gpu_type": "내장그래픽",
      "gpu_model": "Radeon 840M",
      "ram_gb": 16,
      "screen_inches": 16,
      "weight_kg": 1.74,
      "price_krw": 1218890,
      "price_basis": "min_observed_configuration_price_krw",
      "own_configuration_price_krw": 1218890,
      "base_storage_text": "256GB",
      "os": "윈도우11홈",
      "source_url": "https://prod.danawa.com/info/?pcode=122624573&cate=112758",
      "captured_at": "2026-10-30T08:06:03.274Z"
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 20,
  "total_pages": 1
}
```

위 JSON은 **반환 형식을 설명하는 예시**이며 예시 검색 조건의 실제 집계 결과를 보증하지 않는다. `total_pages`는 `total=0`일 때 `0`이다. `id`는 JSON에서 문자열로 통일한다.

## 4. 자동차 검색: `GET /api/cars`

| 파라미터 | 타입 | 기본값 | DB 필드 / 의미 |
|---|---|---|---|
| `manufacturer` | string | 없음 | 제조사 정확 일치 |
| `model` | string | 없음 | 모델 정확 일치 |
| `registration_year_min` | integer 1900~2100 | 없음 | 등록연도 하한 |
| `registration_year_max` | integer 1900~2100 | 없음 | 등록연도 상한 |
| `min_mileage_km` | integer >= 0 | 없음 | 주행거리 하한 |
| `max_mileage_km` | integer >= 0 | 없음 | 주행거리 상한 |
| `min_price_krw` | integer >= 0 | 없음 | 판매 희망가 하한 |
| `max_price_krw` | integer >= 0 | 없음 | 판매 희망가 상한 |
| `branch_or_region` | string | 없음 | 지점/지역 정확 일치 |
| `page` | integer >= 1 | 1 | 페이지 |
| `page_size` | integer 1~100 | 20 | 페이지 크기 |
| `sort` | enum | `id_asc` | 아래 정렬 옵션 |

정렬: `id_asc`, `price_asc`, `price_desc`, `mileage_asc`, `year_desc`, `newest_capture`.

예시:

```http
GET /api/cars?manufacturer=현대&max_price_krw=40000000&max_mileage_km=50000&sort=price_asc
```

**응답(200):**

```json
{
  "items": [
    {
      "id": "direct:61386067",
      "title": "현대 아이오닉 5 롱레인지 AWD 프레스티지",
      "manufacturer": "현대",
      "model": "아이오닉 5",
      "trim": "롱레인지 AWD 프레스티지",
      "registration_year": 2022,
      "registration_month": 12,
      "mileage_km": 27795,
      "price_krw": 38000000,
      "price_basis": "asking_price_krw",
      "branch_or_region": "천안",
      "status_label": "상태표시없음",
      "drive_text_explicit": "AWD",
      "flag_extreme_mileage": false,
      "thumbnail_url": "https://img.kcar.com/carpicture/carpicture08/pic6138/kcarM_61386067_045.jpg",
      "source_url": "https://www.kcar.com/bc/search",
      "captured_at": "2026-09-21T16:50:45.337+09:00"
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 20,
  "total_pages": 1
}
```

위 예시의 `items`는 **형식 설명용**이며 `total=1`은 실제 해당 필터 결과 건수를 보증하지 않는다. 실제 구현에서는 DB 조회 결과와 `total`을 일치시킨다.

**주의:** `status_label=상태표시없음`은 판매 중을 뜻하지 않는다. 현재 CSV의 `source_url`은 개별 매물 상세 URL이 아닌 검색 페이지이므로 상품 상세 링크로 단정하지 않는다.

## 5. 상세 조회

- `GET /api/notebooks/{product_code}`: 노트북 목록 카드의 모든 필드 + `specs_text`(`raw_data.specs_text`) + `registered_month`(원본 월 표기, 문자열) + `observed_configuration_count`를 반환한다.
- `GET /api/cars/{listing_id}`: 자동차 목록 카드의 모든 필드 + `description`, `registration_text`, `tags`(원본 `tags_json`을 배열로 파싱), `flag_future_registration`, `first_captured_at`을 반환한다.
- 상세 응답은 목록과 달리 `items`로 감싸지 않은 단일 JSON 객체다.
- 존재하지 않는 ID는 404. 자동차 ID는 `direct:61386067`, `marketplace:...`처럼 `:` 문자를 포함한 문자열이다.
- `raw_data`를 API로 무조건 전송하지 않는다. 필요한 화면 필드만 반환한다.

## 6. 필터 옵션 조회

- `GET /api/notebooks/facets`: DB의 고유한 비NULL 값을 기준으로 `manufacturer`, `cpu_vendor`, `cpu_series`, `gpu_type` 옵션을 반환한다.
- `GET /api/cars/facets`: `manufacturer`, `model`, `branch_or_region` 옵션을 반환한다.
- 각 옵션은 `{ "value": "LG전자", "label": "LG전자" }` 형식이며 `value`의 오름차순으로 정렬한다.
- MVP에서는 현재 선택된 다른 필터에 따른 **동적 옵션 건수**를 계산하지 않는다. 항상 전체 DB 기준의 고유 옵션을 반환한다.
- 응답 형식:

```json
{
  "manufacturer": [{"value": "LG전자", "label": "LG전자"}],
  "cpu_vendor": [{"value": "AMD", "label": "AMD"}],
  "cpu_series": [{"value": "라이젠AI 5", "label": "라이젠AI 5"}],
  "gpu_type": [{"value": "내장그래픽", "label": "내장그래픽"}]
}
```

자동차는 동일 구조로 지정된 세 키만 반환한다. `null`/공백 값은 선택지에서 제외하며, 미지원 필터는 UI에 노출하지 않는다.

## 7. 상태 확인 및 오류

`GET /api/health` 성공(200): `{ "status": "ok" }`. DB 접속 상태까지 확인할지는 구현 중 결정하되, 이 API가 DB 데이터의 실시간성을 뜻하지는 않는다.

오류 응답 표준:

```json
{
  "code": "INVALID_FILTER",
  "message": "검색 조건을 확인해 주세요.",
  "details": {"field": "page_size", "reason": "must be between 1 and 100"}
}
```

| HTTP | 코드 | 상황 |
|---|---|---|
| 422 | `INVALID_FILTER` | 타입·범위·enum·min/max 오류 |
| 404 | `NOT_FOUND` | 상품/매물 ID 없음 |
| 500 | `INTERNAL_ERROR` | 예상하지 못한 서버 오류 |
| 503 | `DB_UNAVAILABLE` | DB 접속 실패 |

FastAPI의 기본 422 오류를 위 오류 형식으로 변환하는 예외 처리기를 구현한다. 필터 결과가 0건인 것은 오류가 아니라 **200 + `items: []`, `total: 0`, `total_pages: 0`**이다.

## 8. 화면·API 동기화 규칙

- 페이지 필터를 변경하면 `page=1`로 재설정한다. 검색 결과는 항상 API의 `items`를 그대로 표시한다.
- 노트북 가격 라벨은 **“관측 최저가”**, 자동차는 **“수집 당시 판매 희망가”**로 표기한다.
- `captured_at` 또는 출처를 화면에서 확인할 수 있도록 한다.
- 자동차의 `thumbnail_url`은 외부 이미지이므로 실패 시 대체 이미지/플레이스홀더로 처리한다.
- 원본 데이터의 값이 없으면 `정보 없음`으로 표시하며 0원·0kg·0km로 대체하지 않는다.
- 코드 생성 시 백엔드 Pydantic 스키마가 이 문서를 구현하도록 하고, 프론트 TypeScript 타입도 동일한 필드명·nullable 계약을 따른다.

## 9. 확장 제외 범위와 변경 절차

- MVP에서는 로그인, 즐겨찾기, 챗봇, LangGraph, RAG, 실시간 수집, 가격 이력, 추가 DB 테이블을 만들지 않는다.
- 새로운 필터·필드·API 경로가 필요하다면 **우선 `docs/API_CONTRACT.md` 변경 제안**을 남기고 두 담당자가 동의한 뒤 `main`에 반영한다.
- 정상 동작 확인은 구현 중 가볍게 진행하고, **MVP 전체 기능 구현·병합 후 통합 테스트와 안정화**를 집중 수행한다.
