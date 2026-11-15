# SpecFinder AI — API 계약 (MVP v1.0 · Phase 2 AI 검색 v1.1)

> **상태: 구현 기준 문서** · MVP 2026-11-13 / AI 검색 2026-11-15 (PR #5 병합)
> **저장소:** https://github.com/yungoonkim/specfinder-ai  
> **담당:** FastAPI 구현 Codex / Next.js 구현 Gemini  
> **기준:** `docs/PRD.md`, `docs/DATA_DICTIONARY.md`  
> 기존 GET API는 MVP v1.0 계약을 유지한다. Phase 2 AI 검색 계약은 10절에 추가하며, 실제 LLM 제공자는 아직 연결되지 않았다. 프론트엔드 구현 전에 계약을 검토해 기준으로 사용한다.

## 1. 공통 규칙

- 기본 URL: 개발용 FastAPI `http://localhost:8000`. 모든 API 경로는 `/api`로 시작한다. 프론트엔드의 API 주소는 `NEXT_PUBLIC_API_BASE_URL`로 설정한다.
- 응답: UTF-8 JSON, 필드명 `snake_case`, 가격 **원(KRW) 정수**, 무게 **kg**, 주행거리 **km**, 날짜/시간 ISO 8601(타임존 포함).
- 모든 검색은 PostgreSQL `notebooks` 또는 `cars` 테이블에서 읽는다. 프론트엔드는 DB에 직접 연결하지 않는다.
- 기존 MVP의 목록·상세 조회 API는 공개·읽기 전용(guest)이다. Phase 2에서는 별도 `POST /api/ai/search` 라우트에 LangGraph 실행 흐름을 추가했지만, 실제 LLM과 채팅 UI는 아직 연동하지 않았다.
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
| POST | `/api/ai/search` | Phase 2 자연어 검색·조건 확인 (현재 LLM 미설정: 503) |

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

- **MVP v1.0 범위**에서는 로그인, 즐겨찾기, 챗봇, LangGraph, RAG, 실시간 수집, 가격 이력, 추가 DB 테이블을 만들지 않았다. **Phase 2**에서 LangGraph 자연어 검색 API만 별도로 추가했으며, 여전히 LLM·채팅 UI·RAG는 미연결/미구현이다.
- 새로운 필터·필드·API 경로가 필요하다면 **우선 `docs/API_CONTRACT.md` 변경 제안**을 남기고 두 담당자가 동의한 뒤 `main`에 반영한다.
- 정상 동작 확인은 구현 중 가볍게 진행하고, **MVP 전체 기능 구현·병합 후 통합 테스트와 안정화**를 집중 수행한다.


## 10. Phase 2 자연어 검색: `POST /api/ai/search` (v1.1)

> **구현 근거:** PR #5 병합 커밋 `a091cc0`, `backend/app/routers/ai_search.py`, `backend/app/ai_search/schemas.py`, `backend/app/ai_search/graph.py`, `backend/app/ai_search/llm.py`. **현재 FastAPI 라우트·LangGraph 그래프는 구현되었지만 실제 LLM 어댑터는 미설정**이며, 기본 요청은 503 `AI_MODEL_UNAVAILABLE`을 반환한다. 아래 200 예시는 LLM 어댑터가 연결되거나 테스트에서 대체된 경우의 **계약 예시**이지 현재 운영 가능한 AI 검색 결과가 아니다.

### 10.1 엔드포인트 및 사용 목적

| 항목 | 값 |
|---|---|
| 메서드 / 경로 | `POST /api/ai/search` |
| Content-Type | `application/json` |
| 처리 흐름 | FastAPI 요청 검증 → `intent_classification` → `filter_extraction` → `filter_validation` → `clarification` 또는 `search_tool` → `result_explanation` |
| 검색 실행 | 기존 `search_notebooks(db, params)` 또는 `search_cars(db, params)` 호출; LLM이 직접 SQL을 만들지 않음 |
| 사용 데이터 | 기존 `notebooks`·`cars` 테이블, 수집 시점 스냅샷 |
| 현재 모델 상태 | `UnconfiguredLLM` (실제 AI 요청은 503) |
| 인증/상태 저장 | 서버 측 로그인·대화 저장소 없음. 대화 문맥은 요청의 `conversation_context`에 포함 |

기존 GET 목록·상세·facets API 계약은 변경되지 않는다. 브라우저에서 `http://localhost:3000` → `http://localhost:8000`으로 요청할 수 있도록 FastAPI의 CORS 설정에 `POST`가 허용되어 있다. CORS 허용 출처는 서버 설정(`cors_origins`)에 따른다.

### 10.2 요청 JSON 스키마

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `domain` | `"notebooks" \| "cars" \| null` | 아니요 | 사용자가 선택한 분야. 생략 시 모델 분류; 분야가 불확실하면 확인 질문 |
| `message` | `string` | **예** | 공백만으로 구성할 수 없음. 양끝 공백 제거 후 1~2,000자 |
| `conversation_context` | `object \| null` | 아니요 | 바로 이전 유효한 검색 상태를 클라이언트가 전달. 저장소에서 자동 복원하지 않음 |

`conversation_context`가 객체라면 다음 두 키를 포함한다.

| 문맥 필드 | 타입 | 제약 |
|---|---|---|
| `domain` | `"notebooks" \| "cars"` | 필수; 최상위 `domain`을 함께 제공하면 동일해야 함 |
| `filters` | `object` | 선택적(기본 `{}`), 최대 32개 필드. 해당 분야의 기존 `NotebookFilters` 또는 `CarFilters`에서 허용하는 키만 사용 |

요청 모델과 대화 문맥 모델은 **알 수 없는 최상위 키를 허용하지 않는다**. 문맥 필터의 문자열 길이는 최대 200자이며, 값은 매 요청마다 다시 검증한다. 가격·RAM·무게·주행거리·정렬·페이지 등의 허용값 및 범위는 3·4절의 기존 필터 모델과 같다. `page` 기본값 1, `page_size` 기본값 20, 최댓값 100.

**최초 검색 요청 예시:**

```http
POST /api/ai/search
Content-Type: application/json
```

```json
{
  "domain": "notebooks",
  "message": "150만 원 이하에서 RAM 16GB 이상인 노트북 찾아줘.",
  "conversation_context": null
}
```

**후속 검색 요청 예시:** 최초 검색이 성공했고 응답의 `applied_filters`가 `{ "min_ram_gb": 16, "max_price_krw": 1500000 }`인 경우:

```json
{
  "domain": "notebooks",
  "message": "RAM을 32GB 이상으로 바꿔줘",
  "conversation_context": {
    "domain": "notebooks",
    "filters": {"min_ram_gb": 16, "max_price_krw": 1500000}
  }
}
```

모델이 요청을 `refine`으로 분류하고 `min_ram_gb=32`를 추출하면 기존 가격 조건을 보존한 채 RAM 조건을 갱신한다. `sort_only` 요청은 기존 필터를 유지하고 `page=1`로 재설정할 수 있다. 다만 의도 분류·조건 추출은 **실제 LLM의 동작에 의존**하므로 문장만으로 항상 기대한 값이 추출된다고 보장할 수 없다.

### 10.3 성공 응답 (HTTP 200)

| 필드 | 타입 | 설명 |
|---|---|---|
| `domain` | `"notebooks" \| "cars" \| null` | 결정된 검색 분야 |
| `applied_filters` | `object` | Pydantic 검증을 통과한 실제 적용 필터. 미지정 필드는 일반적으로 생략 |
| `clarification_required` | `boolean` | 확인 질문 필요 여부 |
| `clarification_question` | `string \| null` | 사용자에게 다시 물어볼 질문 |
| `items` | `NotebookItem[] \| CarItem[]` | 분야별 기존 검색 목록 아이템과 같은 필드 구조(3·4절 참고) |
| `total` | `integer \| null` | 필터 일치 건수. 확인 질문 단계에서는 `null` |
| `page` / `page_size` / `total_pages` | `integer \| null` | 페이지 정보. 확인 질문 단계에서는 모두 `null` |
| `answer` | `string` | 적용 조건과 **실제 조회 건수**에 근거한 규칙 기반 설명 또는 확인 질문 |
| `data_notice` | `string` | 수집 당시 가격·데이터 스냅샷 안내 |

**0건 검색 결과 예시** (형식 설명용, Fake LLM 또는 실제 어댑터가 올바른 필터를 반환하고 DB 조회 결과가 0건인 경우):

```json
{
  "domain": "notebooks",
  "applied_filters": {"min_ram_gb": 16, "max_price_krw": 1500000},
  "clarification_required": false,
  "clarification_question": null,
  "items": [],
  "total": 0,
  "page": 1,
  "page_size": 20,
  "total_pages": 0,
  "answer": "최소 RAM(GB) 16, 최고 가격(원) 1,500,000 조건에 맞는 노트북 검색 결과는 0건입니다. 조건을 자동으로 완화하지 않았습니다.",
  "data_notice": "노트북 가격은 관측된 구성 중 최저가 기준이며, 데이터는 수집 시점의 스냅샷입니다."
}
```

**확인 질문 응답 예시** (형식 설명용):

```json
{
  "domain": "notebooks",
  "applied_filters": {},
  "clarification_required": true,
  "clarification_question": "가벼운 노트북의 무게 기준을 알려주세요.",
  "items": [],
  "total": null,
  "page": null,
  "page_size": null,
  "total_pages": null,
  "answer": "가벼운 노트북의 무게 기준을 알려주세요.",
  "data_notice": "노트북 가격은 관측된 구성 중 최저가 기준이며, 데이터는 수집 시점의 스냅샷입니다."
}
```

확인 질문은 검색 결과가 0건이라는 뜻이 아니다. 프론트엔드는 `clarification_required=true`일 때 `items`를 검색 결과로 렌더링하지 말고 질문을 표시해야 한다. **현재 구현은 확인 질문 시 `applied_filters={}`를 반환하므로, 후속 대화를 위해 필요한 마지막 성공 문맥은 클라이언트가 자체 보관**해야 한다.

### 10.4 오류 응답 및 상태 코드

현재 구현의 오류 응답은 공통 규칙과 같이 `code`, `message`, `details`를 포함한다.

| HTTP | `code` | 의미 | 권장 UI 표시 |
|---|---|---|---|
| 422 | `INVALID_AI_REQUEST` | 필수 필드·길이·형식 오류, 문맥 필터 미지원, 범위 오류, 분야 불일치 | 잘못된 입력/이전 검색 조건 수정 안내 |
| 502 | `AI_OUTPUT_INVALID` | LLM 응답 JSON·스키마가 유효하지 않거나 미지원 필터 반환 | AI 응답 처리 실패 및 재시도 안내 |
| 502 | `AI_MODEL_ERROR` | 실제 LLM 어댑터의 호출 실패 | 모델 서비스 요청 실패 안내 |
| 503 | `AI_MODEL_UNAVAILABLE` | LLM 제공자가 미설정 (`UnconfiguredLLM`) | AI 검색 미설정 상태 안내; **Fake 결과로 조용히 대체 금지** |
| 503 | `DB_UNAVAILABLE` | 검색 실행 중 SQLAlchemy DB 오류 | 데이터베이스 연결 오류 안내 |
| 500 | `INTERNAL_ERROR` | 예상치 못한 내부 오류 | 일반 오류 안내 |

**현재 기본 설정에서 실제로 기대되는 응답(503):**

```json
{
  "code": "AI_MODEL_UNAVAILABLE",
  "message": "AI 모델이 설정되지 않았습니다.",
  "details": null
}
```

### 10.5 프론트엔드 연동 체크포인트

- 기존 GET 필터 검색 UI는 그대로 유지하고, 새 채팅 UI에서만 `POST /api/ai/search`를 사용한다.
- 요청은 `Content-Type: application/json`과 `Accept: application/json`으로 전송한다.
- `domain`에 따라 `items`를 기존 노트북·자동차 카드 모델로 표시한다. 분야를 모를 때는 카드 렌더링 전에 사용자 확인을 받는다.
- 성공한 응답에서는 `applied_filters`를 화면에 표시하고, **다음 요청의 `conversation_context.filters`로 재사용**할 수 있다. 사용자에게 보이는 기존 조건과 실제 전송 조건을 일치시킨다.
- `clarification_required=true`면 결과 카드 대신 확인 질문을 우선 표시한다. 이전 성공 문맥을 임의로 지우지 않는다.
- `total=0`은 정상 200 응답이며, 임의 필터 완화나 존재하지 않는 상품 추가를 하지 않는다.
- `AI_MODEL_UNAVAILABLE`·`AI_MODEL_ERROR`·`AI_OUTPUT_INVALID`·`DB_UNAVAILABLE`은 서로 다른 장애 원인이므로 구분해 표시한다.
- 노트북의 `price_krw`는 **관측 구성 최저가**, 자동차의 `price_krw`는 **수집 당시 판매 희망가**이며 실시간 판매·재고를 보증하지 않는다.
- Fake LLM은 개발·테스트 의존성 오버라이드에만 사용한다. 실제 서비스 모드에서 모델 미설정을 Fake 검색 성공으로 위장하지 않는다.

### 10.6 현재 구현 범위와 후속 작업

- **구현됨:** FastAPI AI 검색 라우트, LangGraph 의도 분류·필터 추출·검증·확인 질문·기존 SQL 검색 연결·규칙 기반 설명, 입력 검증, HTTP 오류 처리, POST CORS.
- **테스트됨:** 로컬 `pytest tests/backend -q` **56 passed** (기존 테스트 포함). AI 경로는 Fake LLM 및 검색 함수 대체로 검증됨.
- **미완료:** 실제 LLM 어댑터/API 키 설정, 프론트엔드 AI 채팅 UI, 실제 PostgreSQL을 통한 AI 경로 통합 테스트, 실제 자연어 이해 정확도 평가.
- **미도입:** MCP 서버, RAG/벡터 DB, 신규 업무 DB 테이블, 서버 측 대화 저장소.

신규 프론트엔드 구현은 본 계약을 기준으로 진행한다. 실제 모델 제공자 연결 이후에도 필드 구조를 변경하려면 별도 PR에서 프론트엔드와 백엔드의 계약을 함께 검토한다.
