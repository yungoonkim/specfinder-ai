# SpecFinder AI — 실제 구현 아키텍처 (MVP v0.1.0)

> 기준: 2026-11-15, GitHub `main` PR #1·#2·#3 병합 후 코드와 실데이터 통합 검증 결과.
> **현재 구현**과 **2차 개발 예정**을 명확히 분리한다.

## 1. 실제 실행 구성

```text
[사용자 Chrome 브라우저]
       │ 탭/필터/정렬/상세 조작
       ▼
[Next.js + React + TypeScript]  http://localhost:3000
  frontend/app/, frontend/components/, frontend/lib/api.ts
       │ 브라우저에서 FastAPI HTTP GET · JSON 교환
       ▼
[FastAPI + Pydantic + SQLAlchemy]  http://127.0.0.1:8000
  backend/app/main.py → routers/ → services/
       │ 검증된 파라미터를 이용한 SQLAlchemy SELECT
       ▼
[PostgreSQL 16 — Docker Desktop / WSL2]
  Windows 127.0.0.1:5433 → 컨테이너 5432
  notebooks: 2,181행 / cars: 302행 (테스트 스냅샷)
       │ 검색 결과
       ▼
FastAPI JSON {items, total, page, page_size, total_pages}
       │
       ▼
React의 카드·상세·페이지네이션·오류 UI
```

세 서버는 개발 PC에서 독립 실행된다. **Docker는 DBMS가 아니라 PostgreSQL 프로세스를 컨테이너로 실행하는 환경**이다. Next.js 개발 서버는 Node.js에서 실행되고, React UI는 브라우저에서 상호작용한다.

## 2. 실제 파일별 역할

| 경로 | 역할 | 확인 상태 |
|---|---|---|
| `frontend/app/notebooks/`, `frontend/app/cars/` | 노트북·자동차 라우팅/페이지 | 구현 |
| `frontend/components/` | 필터·결과 카드·UI 상태 | 구현 |
| `frontend/lib/api.ts` | API_BASE_URL, 요청·오류 처리, Mock fallback 설정 | 구현 |
| `backend/app/main.py` | FastAPI 애플리케이션, CORS·예외 핸들러 | 구현 |
| `backend/app/routers/notebooks.py`, `cars.py` | 목록·facets·상세 API, 검색 쿼리 모델 검증 | 구현 |
| `backend/app/schemas.py` | Pydantic 필터·응답 모델 및 Decimal JSON 숫자 직렬화 | 구현 |
| `backend/app/services/notebook_search.py`, `car_search.py` | SQL 조건 조합·정렬·페이지네이션·상세 조회 | 구현 |
| `backend/app/database.py`, `models.py` | PostgreSQL 접속 세션·ORM 매핑 | 구현 |
| `data/scripts/` | CSV 적재 스크립트 | 구현 |
| `tests/backend/test_api_stabilization.py` | FastAPI TestClient 격리 회귀 테스트 19개 | 구현·실행 |

## 3. 실제 요청 처리 예

1. 사용자가 `/notebooks`에서 RAM `≥16GB`, 관측 최저가 `≤1,500,000원`을 입력한다.
2. `frontend/lib/api.ts`가 `GET /api/notebooks?min_ram_gb=16&max_price_krw=1500000` 같은 요청을 만든다.
3. `backend/app/routers/notebooks.py`에서 `NotebookFilters`를 FastAPI `Query()`로 검증한다.
4. 잘못된 범위면 DB 검색을 수행하지 않고 **422 `INVALID_FILTER`**를 반환한다.
5. 유효하면 `search_notebooks`가 `notebooks.ram_gb`, `notebooks.min_observed_configuration_price_krw`로 조건 SQL을 실행한다.
6. PostgreSQL이 검색 결과를 반환하고 FastAPI가 JSON으로 응답한다. `ram_gb` 등 Decimal은 응답 JSON에서만 number로 변환한다.
7. React가 카드·총 건수·페이지 및 필터 조건을 표시한다.

자동차도 같은 구조이며 `search_cars`가 `cars` 테이블을 조회한다. 자동차 `listing_id`는 `direct:61386067`처럼 `:`를 포함할 수 있어 문자열로 보존한다.

## 4. 데이터/검증 정책

- DB 업무 테이블은 `notebooks`, `cars` **2개**이며 원본의 전체 CSV 필드는 각 테이블의 `raw_data JSONB`에 보존한다.
- 노트북 `price_krw` = `min_observed_configuration_price_krw` (최저 관측 구성 가격); 자동차 `price_krw` = `asking_price_krw` (희망가).
- 누락값은 `null`/`정보 없음` 처리, 조건이 있는 경우 NULL 값은 필터에 일치하지 않음.
- 자동차 `source_url`은 수집 데이터 전체에서 공통 검색 URL이며, 개별 매물 상세 링크를 임의로 생성하지 않는다.
- 원본 데이터는 수집 시점의 스냅샷이며 실시간 시세와 판매 상태를 보장하지 않는다.
- `NEXT_PUBLIC_USE_MOCK=false`와 브라우저 sessionStorage 설정을 함께 확인해야 실데이터 모드를 확정할 수 있다.

## 5. 검사·수정 이력

- 1차 Computer Use QA에서 역전 범위 오류가 HTTP 500, 노트북 Decimal JSON이 문자열이었던 문제 발견.
- PR #3으로 검색 쿼리 모델을 `Depends()` → `Query()`로 변경하고 요청 오류를 HTTP 422로 정리.
- Decimal은 DB/검색 로직에서는 유지하고 HTTP JSON 직렬화에서만 숫자로 변환.
- 로컬 pytest 19 PASS, 실제 DB 2,181/302건 조회, Browser QA 36 PASS 보고. 실제 서버 중단 테스트 2건은 BLOCKED.

## 6. 2차 개발 예정 — 현재 구현된 기능 아님

```text
[Next.js 채팅창]       (미구현)
      │ 자연어 요청
      ▼
[FastAPI AI 검색 API]   (설계 예정)
      │
[LLM → 검증된 필터 JSON → LangGraph 검색 Tool]
      │
[기존 search_notebooks / search_cars] → PostgreSQL
      │
[근거가 있는 결과 카드 + 검색 조건 설명]
```

2차에서도 SQL 조회 함수를 재사용하고, LLM이 임의의 가격·사양·매물 사실을 만들어내지 못하도록 검색 결과를 응답 근거로 삼는다. AI 검색 API의 정확한 형태는 별도 계약을 확정한 후 구현한다.
