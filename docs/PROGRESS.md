# SpecFinder AI — 개발 진행 현황

> 기준일: **2026-11-15 (KST)** · 검증 기준: GitHub `main`의 PR #1·#2·#3 병합 상태, 로컬 PostgreSQL 직접 조회, pytest 실행 결과, Gemini Computer Use 최종 QA 아카이브.
> **현재 단계:** SQL 필터 검색 MVP 핵심 기능 안정화 완료. AI 자연어 검색은 아직 구현하지 않음.
> 담당: 공통 문서는 통합 담당자가 문서 전용 PR로 갱신한다.

## 1. 현재 한눈에 보기

| 항목 | 현재 상태 | 근거 |
|---|---|---|
| 프론트엔드 | 구현·통합 확인 | [PR #1](https://github.com/yungoonkim/specfinder-ai/pull/1), 최종 브라우저 QA |
| FastAPI 검색·상세·facets | 구현·통합 확인 | [PR #2](https://github.com/yungoonkim/specfinder-ai/pull/2), 실제 DB API 조회 |
| PostgreSQL 데이터 | 적재·직접 확인 | `notebooks` 2,181건, `cars` 302건, 2026-11-15 로컬 조회 |
| 입력 검증·Decimal JSON | 수정·재검증 완료 | [PR #3](https://github.com/yungoonkim/specfinder-ai/pull/3), 19개 pytest + 브라우저 QA |
| 브라우저 회귀 테스트 | **36개 시나리오 PASS / 0 FAIL** | Gemini Computer Use QA 최종 보고서 및 로그 |
| 서버 장애 테스트 | **2개 BLOCKED** | DB 중단 시 503, API 중단 시 Mock 미대체 — 실제 중단 테스트 미실행 |
| 자연어 검색/채팅 | **미구현 (2차)** | `docs/AI_SEARCH_PHASE2_PLAN.md` |

**판정:** 현재 스냅샷 기준 MVP 핵심 기능 안정화 완료. 2개 장애 복원력 시나리오는 완료 처리하지 않으며 별도 검증 과제로 유지한다.

## 2. 기능 현황

| 기능 | 담당 | 상태 | 관측 근거 |
|---|---|---|---|
| CSV → PostgreSQL 2개 테이블 적재 | Codex + 로컬 통합 | 통합 확인 | 2,181/302건 직접 SQL 조회 |
| 노트북 검색·facets·상세 API | Codex | 통합 확인 | HTTP 200, 조건·정렬·상세 QA |
| 자동차 검색·facets·상세 API | Codex | 통합 확인 | HTTP 200, `direct:61386067` ID 검증 |
| 두 탭·검색 패널·카드·상세 UI | Gemini | 통합 확인 | 브라우저 QA A·C·D |
| 정렬·페이징·0건·결측값·반응형 | Gemini + Codex | 통합 확인 | 브라우저 QA C·D·E |
| 422 `INVALID_FILTER` · JSON number | Codex | 수정·통합 확인 | PR #3 및 QA B-1(6종)·B-2 |
| 503 / 네트워크 단절에서의 UI 처리 | Gemini + Codex | 후속 검증 | 실제 장애 테스트 2개 BLOCKED |
| LangGraph·LLM·채팅 UI | 2차 개발 | 미구현 | 구현 전 별도 API 계약 및 테스트 설계 필요 |

## 3. 최근 작업

| 일자 | 사용자 관점에서 달라진 점 | 근거 |
|---|---|---|
| 2026-11-15 | Gemini 프론트엔드 MVP 통합 | [PR #1](https://github.com/yungoonkim/specfinder-ai/pull/1) |
| 2026-11-15 | Codex FastAPI 검색 MVP 통합 | [PR #2](https://github.com/yungoonkim/specfinder-ai/pull/2) |
| 2026-11-15 | Windows 10 / Docker PostgreSQL 연결, 실제 데이터 2,483건 적재 및 API 조회 | 로컬 명령 출력 기록 |
| 2026-11-15 | Computer Use 1차 테스트에서 범위 검증 HTTP 500·Decimal 문자열 오류 발견 | 1차 QA 아카이브 |
| 2026-11-15 | 범위 역전 422 및 JSON 숫자 직렬화 수정 병합 | [PR #3](https://github.com/yungoonkim/specfinder-ai/pull/3) · 병합 SHA `92456d1` |
| 2026-11-15 | pytest 19 PASS 및 실데이터 브라우저 회귀 시나리오 36 PASS | `docs/tests/FINAL_REGRESSION_REPORT_2026-11-15.md` |

## 4. 아직 남은 과제와 결정

- **BLOCKED 유지:** PostgreSQL 실제 중단 후 HTTP 503, FastAPI 중단 후 Mock 미대체. 종료가 필요한 테스트는 별도 허가·격리 환경에서 수행한다. 앞서 제출된 19개 pytest 코드만으로 DB 중단 테스트 통과는 입증되지 않는다.
- **데이터 한계:** CSV 수집 당시의 스냅샷이므로 실시간 가격·재고를 보장하지 않는다. 자동차 공통 `source_url`은 개별 매물 상세 URL이 아니다.
- **가격 정책:** 노트북 검색 가격은 최저 관측 구성 가격, 자동차는 판매 희망가이다. `NULL`을 0으로 대체하지 않는다.
- **다음 단계:** 이 문서 포함 공통 문서 마감 PR 병합 → 별도 브랜치에서 LangGraph 자연어 검색 구현 → Gemini 채팅 UI 통합 → AI 검색 품질 평가.

## 5. 증거 자료

- 최종 QA: `docs/tests/FINAL_REGRESSION_REPORT_2026-11-15.md`
- 증거 목록: `docs/tests/QA_EVIDENCE_INDEX.md`
- 개발 흐름: `docs/DEVELOPMENT_HISTORY.md`
- 외부 보존용 원본 ZIP: `specfinder-qa-final-regression-20261115.zip` (사용자 로컬 Downloads, 저장소에는 민감정보·원본 CSV를 포함하지 않음)
