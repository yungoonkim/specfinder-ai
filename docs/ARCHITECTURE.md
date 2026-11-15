# SpecFinder AI — 사람이 이해하는 시스템 구조

> **문서 성격:** 설계된 구조(목표)를 설명하는 문서입니다. 아직 구현·동작이 확인되지 않은 파일과 함수는 **예정**으로 표시합니다.
> 기준: `docs/PRD.md`, `docs/TECH_STACK.md`, `docs/API_CONTRACT.md`, `docs/PROJECT_STRUCTURE.md`
> 갱신 시점: 주요 모듈·데이터 흐름이 바뀌거나 통합 검증을 완료했을 때. 매 코드 수정마다 갱신하지 않습니다.

## 1. 사용자 눈높이 한 문장

노트북 또는 자동차 탭에서 조건을 선택하면, **Next.js 화면**이 **FastAPI**에 요청하고, FastAPI가 **PostgreSQL의 해당 테이블**을 조회해 목록으로 돌려주는 서비스입니다.

## 2. 전체 흐름 (설계)

```text
[사용자 브라우저]
  노트북 탭 / 자동차 탭
         |
         v
[frontend/ — Next.js + React + TypeScript]
  체크박스·가격 범위·정렬·페이지
         | HTTP GET /api/notebooks 또는 /api/cars
         v
[backend/ — FastAPI + Pydantic]
  파라미터 검증 → 검색 서비스 함수 호출
         | SQLAlchemy 매개변수화 SELECT
         v
[PostgreSQL — 2개 테이블]
  notebooks / cars
         |
         v
FastAPI가 JSON {items, total, page, page_size} 반환
         |
         v
Next.js가 카드·결과 건수·빈 결과/오류 표시
```

**React**는 화면의 상호작용을 담당하는 UI 라이브러리입니다. **Next.js**는 React 페이지와 라우팅/렌더링을 담당하는 프레임워크입니다. **Node.js**는 Next.js 개발 서버와 서버 측 JavaScript 실행에 쓰이는 런타임입니다. DB SQL 검색은 **Node.js가 아니라 Python FastAPI**가 담당합니다.

## 3. 실제로 RAM 16GB 이상을 선택하면? (구현 후 확인할 경로)

1. 사용자가 노트북 화면에서 `RAM ≥ 16GB`를 선택합니다.
2. 프론트 필터 상태가 `min_ram_gb=16`으로 바뀝니다.
3. API 모듈이 `GET /api/notebooks?min_ram_gb=16`을 요청합니다.
4. FastAPI가 Pydantic으로 값의 범위를 확인합니다.
5. 검색 서비스가 `notebooks.ram_gb >= 16`에 해당하는 매개변수화 SQL을 구성합니다.
6. PostgreSQL에서 찾은 데이터를 API 계약의 JSON 구조로 반환합니다.
7. 화면에서 결과 개수와 노트북 카드를 갱신합니다.

> 위 1~7은 **목표 동작 흐름**입니다. 실제 파일명·함수명·성공 여부는 소스 구현 후 해당 경로를 읽어서 확정합니다.

## 4. 역할별 예정 경로

| 역할 | 예정 파일/디렉터리 | 무엇을 담당? | 현재 실제 구현 확인 |
|---|---|---|---|
| 화면 및 페이지 | `frontend/app/notebooks/`, `frontend/app/cars/` | 탭 및 화면 라우팅 | 미확인 |
| 필터·결과 UI | `frontend/components/` | 사용자 입력·검색 결과 표현 | 미확인 |
| API 호출 | `frontend/lib/api.ts` | FastAPI HTTP 요청과 응답 수신 | 미확인 |
| API 타입 | `frontend/types/api.ts` | 프론트에서 쓰는 JSON 타입 | 미확인 |
| FastAPI 진입점 | `backend/app/main.py` | 앱 실행, CORS, 라우터 구성 | 미확인 |
| API 라우터 | `backend/app/routers/` | 요청 검증·응답 | 미확인 |
| SQL 검색 서비스 | `backend/app/services/` | 필터 조합, 페이징, 정렬 | 미확인 |
| DB 테이블 모델 | `backend/app/models.py` | `notebooks`, `cars` 매핑 | 미확인 |
| CSV 적재 | `data/scripts/` | 원본 CSV → 정규화 DB 적재 | 미확인 |
| 데이터 원본 | `data/raw/` | CSV 원본 보존 | 미확인 |

경로가 실제 구현과 달라지면 **계약 변경 여부를 확인한 뒤 이 표를 수정**합니다. 폴더를 계획대로 만드는 것이 목적이 아니라 실행되는 코드를 이해하기 위한 지도입니다.

## 5. 데이터가 들어오는 흐름 (설계)

```text
원본 CSV (내용 수정·삭제 금지)
    |
    v
Python 스크립트: 문자열 우선 읽기, ID/날짜/가격/NULL 검증
    |
    v
PostgreSQL  notebooks / cars
    ├─ 검색용 정형 컬럼
    └─ raw_data JSONB: 원본 컬럼 보존
```

- 노트북: `product_code BIGINT`; 최저 관측 가격과 해당 구성 가격은 서로 다릅니다.
- 전기차: `listing_id TEXT`(`:` 포함 가능); 가격은 수집 당시 희망가입니다.
- NULL을 임의로 0으로 만들지 않습니다. 원본 컬럼과 전처리 규칙은 `docs/DATA_DICTIONARY.md`가 최종 기준입니다.

## 6. 나중에 LangGraph를 붙일 위치

```text
[2차] 자연어 채팅 → backend/app/agents/ (예정)
                            |
                            v
                  기존 Python SQL 검색 서비스 재사용
                            |
                            v
                       PostgreSQL
```

MVP에서는 LangGraph·AI 채팅·RAG를 구현하지 않습니다. 추후에도 SQL 조건 필터는 기존 검색 함수를 재사용합니다.

## 7. 통합 이후 실제 구조 기록 양식

다음 항목은 **코드 구현·병합 이후 실제 내용을 확인한 다음에만** 채웁니다.

```md
### [사용자 동작명]
- 화면 컴포넌트: `frontend/...` / 함수명:
- API 호출 코드: `frontend/...` / 함수명:
- FastAPI 라우터: `backend/...` / 함수명:
- SQL 서비스: `backend/...` / 함수명:
- DB 테이블·핵심 컬럼:
- 사용자가 직접 확인하는 방법:
- 실제 확인 결과/미확인 사항:
- 근거: PR/커밋:
```

**문서 원칙:** 구현 전에는 설계/예정, 실제 소스 확인 후에는 현재 동작을 구분하여 적습니다.
