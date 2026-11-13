# SpecFinder AI — AI 코딩 에이전트 공통 작업 규칙

> 저장소: https://github.com/yungoonkim/specfinder-ai  
> 이 파일은 **저장소 루트 `AGENTS.md`** 에 둔다. Codex·Gemini·DeepSeek 작업 지시의 공통 기준이다.

## 1. 프로젝트 목표와 확정 기술

- 하나의 통합 웹서비스에서 **노트북 탭**과 **자동차 탭**을 제공한다.
- 프론트엔드: `frontend/` — Next.js App Router + React + TypeScript(strict) + Tailwind CSS.
- 백엔드: `backend/` — Python FastAPI + Pydantic + SQLAlchemy.
- DB: PostgreSQL **`notebooks`, `cars` 두 테이블만**. 데이터 출처는 두 개의 기존 CSV다.
- MVP: CSV 적재, 필터 검색, 정렬, 페이지네이션, 상세 화면, 기본 로딩/오류/빈 결과 처리.
- **LangGraph, AI 채팅 검색, RAG, 회원/인증, 가격 이력/추가 업무 테이블은 MVP 이후에 도입**한다.
- 개발 원칙: **필수 기능 전체를 먼저 구현 → `main` 통합 → 전체 프로그램 통합 테스트 → 오류 수정·안정화 → 기능 확장**. 구현 중에는 구동 확인과 치명적 오류 점검만 진행한다. 기능마다 광범위한 테스트 통과를 강제하지 않는다.

## 2. 반드시 읽을 문서 (우선순위)

1. `docs/PRD.md`: 목표 및 MVP 범위
2. `docs/API_CONTRACT.md`: API 경로, 필터, 응답·오류 구조 (프론트·백엔드 공동 기준)
3. `docs/DATA_DICTIONARY.md`: CSV 필드, 전처리, DB 매핑 및 NULL 정책
4. `docs/PROJECT_STRUCTURE.md`: 파일 경로와 담당 범위
5. `docs/TECH_STACK.md`: 기술 스택 선정 근거

문서가 상충하면 **무단 추측/무단 변경하지 말고** 차이와 수정 제안을 명시한다. 계약 수정은 `main`에 먼저 반영한 뒤 두 작업 브랜치에 동기화한다.

## 3. 역할과 수정 영역

| 담당 | 브랜치 | 쓰기 가능 경로 | 주요 결과물 |
|---|---|---|---|
| Gemini / Antigravity | `feature/ui` | `frontend/**` | 두 탭, 검색 폼, 결과 카드, 상세 페이지, 상태 UI |
| GPT Codex | `feature/backend` | `backend/**`, `data/scripts/**`, `tests/backend/**` | 2개 테이블, CSV 적재, FastAPI 조회 API |
| DeepSeek / OpenRouter | 검토용 (브랜치 상시 불필요) | 기본적으로 **직접 수정 없음** | 테스트 질문, 코드·데이터 품질 리뷰 |
| 통합 담당(사용자 또는 위임된 Codex) | `main` 또는 `feature/integration` | 공통 문서/설정과 통합 수정 | PR 병합, 전체 통합 테스트, 안정화 |

**공통 파일(루트 설정·`docs/**`·`.github/**`)은 각 에이전트가 임의로 바꾸지 않는다.** 변경 제안은 작업 결과 보고서나 PR 설명에 남긴다. 사용자 승인 후 통합 담당자가 변경한다.

## 4. 구현 제약

- ORM 또는 바인딩된 SQL로만 데이터 조회한다. 문자열 연결 방식의 SQL 금지.
- 프론트엔드에서 PostgreSQL 직접 연결 및 비밀키 노출 금지. 모든 데이터 조회는 FastAPI로 수행한다.
- `frontend/types/`의 TS 필드명과 `backend/app/schemas.py`의 Pydantic 모델은 `docs/API_CONTRACT.md`의 이름과 nullable 정책을 그대로 따른다.
- 상품 ID와 매물 ID를 원본대로 유지한다: 노트북 `product_code BIGINT`, 자동차 `listing_id TEXT`(`:` 포함 가능).
- 노트북 가격: 검색 기준은 `min_observed_configuration_price_krw`, 대표 구성 가격은 `own_configuration_price_krw`로 구분.
- 전기차 가격은 `asking_price_krw` (수집 당시 희망가). 재고·현재 가격으로 표시 금지.
- 결측값은 NULL로 남겨 검색 결과에서 올바르게 처리하고, 숫자 0 등으로 보정하지 않는다.
- 원본 파일을 삭제하거나 임의 변경하지 않는다. CSV 원본 42/41개 컬럼을 `raw_data JSONB`에 보존한다.
- 임의의 현재 상품 가격, 실시간 매물 상태, 배터리 정보, 제품 추천 점수를 생성하지 않는다.
- 개발 편의를 이유로 새 DB 테이블·Redis·벡터 DB·마이크로서비스·LangGraph 등을 추가하지 않는다.
- Next.js와 FastAPI 각각의 환경변수는 `.env.example`로 예시만 커밋한다. 실제 비밀번호·토큰·DB 접속정보 커밋 금지.

## 5. Git과 병렬 작업 규칙

1. `main`을 기반으로 `feature/ui`, `feature/backend` 브랜치를 만든다.
2. **동시 작업 시 Git worktree**로 각 브랜치별 서로 다른 로컬 폴더를 사용한다.
3. 각 브랜치는 담당 디렉터리만 수정한다. 다른 브랜치 코드를 덮어쓰기 위해 복사·붙여넣기하지 않는다.
4. API 계약이나 DB 스키마 변경이 필요하면 `docs/API_CONTRACT.md` 또는 `docs/DATA_DICTIONARY.md` 변경을 **제안만** 한다.
5. 구현 중 정상 실행 가능한 상태를 유지하도록 노력하되, 대규모 통합 테스트는 기능이 모두 연결된 후 수행한다.
6. UI·백엔드 작업 완료 후 각각 Pull Request를 열어 변경 파일을 검토하고 순차적으로 `main`에 병합한다.
7. 최종 통합에서 프론트·백엔드 HTTP 통신, CORS 설정, NULL 처리, 정렬/페이징, 빈 결과와 오류를 테스트한다.

## 6. 보고 형식 (매 작업 종료 시)

- 구현한 기능과 변경된 파일 경로
- 실행 명령 / 간단히 확인한 기본 동작
- 미완료 항목과 제한 사항
- API/DB 계약 변경 필요 여부 (있으면 구체적으로)
- 다른 담당자가 알아야 할 연동 사항

## 7. 코딩 품질 기준

- 필요한 부분만 구현한다. MVP 목적과 무관한 대규모 리팩터링 금지.
- TypeScript는 strict 유지. Python API 입력/응답은 Pydantic으로 검증.
- 숫자 경계와 잘못된 필터에 대한 기본 입력 검증은 작성한다. 완성 후 통합 테스트에서 집중 검증한다.
- 백엔드 코드는 검색 서비스 함수와 HTTP 라우터를 분리한다. LangGraph 추가 시 해당 검색 함수를 재사용할 수 있도록 한다.
- DB 스키마는 하나의 명시적 생성 스크립트 또는 관리 가능한 마이그레이션으로 유지한다. 첫 MVP에서는 별도 이력 테이블을 만들지 않는다.

## 8. 담당 AI별 시작 지시

### Gemini / Antigravity

`docs/PRD.md`, `docs/API_CONTRACT.md`, `docs/DATA_DICTIONARY.md`, `docs/PROJECT_STRUCTURE.md`를 읽고 `frontend/`만 작업하라. 노트북/자동차 탭, 필터, 목록/상세, 로딩/0건/오류 UI를 구현하라. API 응답이 아직 없으면 계약과 동일한 로컬 mock 데이터를 사용하고 실제 API 연결 지점을 명확히 남겨라. 계약을 무단 수정하지 말라.

### GPT Codex

같은 문서를 읽고 `backend/`, `data/scripts/`, `tests/backend/`를 작업하라. PostgreSQL 2개 테이블, 정확한 CSV 전처리와 멱등 적재, 필터 검색/상세/facets/health API를 구현하라. `raw_data`에 모든 원본 컬럼을 보존하라. MVP에서는 AI 기능이나 새 테이블을 구현하지 말라.

### DeepSeek / OpenRouter

코드 직접 수정 대신 제공된 API 계약·데이터 사전을 기준으로 통합 테스트 시나리오, 잘못된 필터·NULL·이상치·가격 기준 혼동 사례와 리뷰 체크리스트를 생성하라. 발견한 문제는 재현 방법과 예상/실제 결과를 구분하여 보고하라.
