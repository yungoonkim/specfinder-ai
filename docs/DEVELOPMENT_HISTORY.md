# SpecFinder AI — 기획부터 MVP 안정화까지의 개발 흐름

> 작성 기준: 2026-11-15. PR, 로컬 실행 기록, QA 보고서에 근거해 확인 가능한 사실만 적었다.

## 1. 목표·범위 결정

초기 제품 목표는 노트북과 중고 전기차 데이터를 하나의 웹서비스에서 조건 검색하는 것이다. MVP 범위는 **두 탭, CSV → PostgreSQL 적재, 필터, 검색 결과, 정렬, 페이지네이션, 상세 페이지, 오류/결측 안내**다. 로그인·실시간 재고·LLM·RAG는 MVP에서 제외했다.

백엔드를 Python FastAPI로 분리한 이유는 2차 개발에서 LangGraph/LLM이 기존 SQL 검색 서비스를 그대로 호출하도록 하기 위해서다.

## 2. 협업·형상관리 방식

| 역할 | 작업 산출물 | 코드 관리 |
|---|---|---|
| Gemini | Next.js/React/TypeScript 프론트엔드, Browser Subagent QA | [PR #1](https://github.com/yungoonkim/specfinder-ai/pull/1) |
| Codex Cloud | FastAPI/SQLAlchemy 백엔드, 안정화 수정·회귀 테스트 | [PR #2](https://github.com/yungoonkim/specfinder-ai/pull/2), [PR #3](https://github.com/yungoonkim/specfinder-ai/pull/3) |
| 사용자 PC (Windows 10) | Docker PostgreSQL 구동, CSV 적재, 실제 API 및 웹 통합 검증 | GitHub `main` 동기화·PR 병합 |

Codex Cloud GitHub 쓰기 권한에서 403이 발생해 패치(`git format-patch` 형식)를 로컬에 적용한 후 별도 브랜치로 Push하고 PR로 병합했다. 이는 원격 작업 환경과 로컬 검증 환경을 분리한 사례다.

## 3. 날짜별 핵심 진행 (2026-11-15)

1. **설계 확정:** `docs/PRD.md`, API 계약, 데이터 사전, 기술 아키텍처 및 담당 범위를 공유.
2. **독립 구현:** Gemini 프론트엔드와 Codex 백엔드 개발 후 PR #1·#2를 `main`에 병합.
3. **운영환경 연결:** Windows 10 + Docker Desktop(WSL2)에서 PostgreSQL 16을 독립 컨테이너 `specfinder-postgres`로 구동(Windows 포트 5433). Python 3.12 가상환경에서 FastAPI 실행.
4. **실데이터 적재:** 노트북 CSV 2,181행/42열, 자동차 CSV 302행/41열을 각각 `notebooks`/`cars`에 적재하고 SQL로 건수 확인.
5. **전체 통합 테스트:** Gemini Computer Use에서 노트북·자동차 필터/상세/결측/반응형 UI를 검사. 서버 `min > max` HTTP 500과 Decimal JSON 문자열 문제 발견.
6. **원인 분석·수정:** Codex가 FastAPI 쿼리 검증 경로 및 Decimal 응답 직렬화를 고치고 격리된 pytest 19개를 추가. 초기 의존성 오기 `httpx2`도 `httpx`로 수정.
7. **PR #3 병합:** 로컬에서 테스트 19 PASS 후 GitHub PR #3으로 수정 병합(merge commit `92456d1`).
8. **실제 DB 재검증:** 노트북 2,181건, 자동차 302건, JSON 숫자 응답, 역전 범위 HTTP 422를 로컬 FastAPI에서 확인.
9. **Browser Subagent 최종 QA:** 실데이터·Mock 비활성화 상태에서 브라우저 회귀 시나리오 **36 PASS / 0 FAIL**, 실제 서버 중단 시나리오 **2 BLOCKED**를 보고.
10. **문서 마감:** 현재 문서 패키지에서 이력·아키텍처·QA 자료를 정리. (문서 PR 병합은 별도로 확인해야 함.)

## 4. 무엇을 어떻게 테스트했나?

| 검증 계층 | 검증 방식 | 주요 증거 |
|---|---|---|
| DB | Docker 컨테이너 내부 `psql`에서 테이블 건수 조회 | 노트북 2,181건, 자동차 302건 |
| Backend | Windows PowerShell `Invoke-RestMethod`, `curl.exe` | 200 목록, JSON number, 422 오류 |
| Unit/regression | FastAPI `TestClient`와 Mock DB 세션 | pytest 19 passed |
| Browser | Gemini Antigravity `/browser`에서 실제 Chrome 조작 | 36개 시나리오 PASS, 2개 장애 시나리오 BLOCKED |
| Evidence | Markdown 보고서, JSON 로그, 스크린샷 | `docs/tests/` |

**신뢰성 주의:** Browser QA는 Gemini 에이전트가 작성한 보고·증거에 근거한다. 이 기록을 라이브 서버를 반복적으로 중단하는 장애 테스트의 대체 결과로 해석하지 않는다.

## 5. 수정 전·후의 구체적 예

| 문제 | 수정 전 | 수정 후 |
|---|---|---|
| 역전 가격 범위 검색 | HTTP 500 `INTERNAL_ERROR` | HTTP 422 `INVALID_FILTER` + `details.field` |
| Decimal RAM | JSON `"16.0"` | JSON `16` |
| Decimal 무게 | JSON `"1.740"` | JSON `1.74` |
| 의존성 | `httpx2` 오기 | `httpx`로 정정 |

## 6. 후속 개발 로드맵

1. 문서 PR 검토·병합(현재 자료는 패키지/브랜치에서 관리).
2. **2차 백엔드:** LLM으로 자연어 → 허용된 필터 JSON 변환, LangGraph로 기존 검색 함수 호출.
3. **2차 프론트엔드:** 노트북·자동차 탭에 AI 채팅 UI 추가.
4. AI 검색용 평가 질문셋 작성·실행: 숫자 조건 정확성, 모호한 표현, 결측값, 환각/사실성, 오류 처리.
5. 충분한 평가 후 필요할 때만 RAG/벡터 검색 도입.

관련 상세 설계: `docs/AI_SEARCH_PHASE2_PLAN.md`.
