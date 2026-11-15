# SpecFinder AI — 변경 이력

> 사용자에게 실제로 달라진 기능과 검증된 결함 수정을 중심으로 기록한다. 구현 전·테스트 전의 항목을 완료로 쓰지 않는다.

## [Unreleased] — 2차 자연어 검색 개발 전

- **예정:** LangGraph 자연어 필터 추출, AI 채팅 UI, 검색 품질 평가. 아직 구현되지 않았다.
- **후속 검증:** DB 중단 시 503 및 FastAPI 중단 시 Mock 미대체 (실제 중단 테스트 2개 BLOCKED).

## [v0.1.0 — SQL 검색 MVP 안정화] — 2026-11-15

### 추가됨

- 노트북 탭: 제조사·CPU·GPU·RAM·관측 최저가·무게 조건 검색, 정렬, 페이지 이동, 상세 및 다나와 원본 링크. ([PR #1](https://github.com/yungoonkim/specfinder-ai/pull/1), [PR #2](https://github.com/yungoonkim/specfinder-ai/pull/2))
- 자동차 탭: 제조사·모델·등록연도·희망가·주행거리·지역 조건 검색, 정렬, 페이지 이동, 상세. `:`가 포함된 매물 ID 지원. (PR #1·#2)
- 데이터 출처 표시, 0건/로딩/오류 상태, 결측값 `정보 없음`, 모바일 반응형 UI. (PR #1)
- PostgreSQL 2개 테이블과 CSV 적재 스크립트; 원본 컬럼을 `raw_data JSONB`에 보존. (PR #2)

### 수정됨

- 검색 필터의 `min > max`를 서버 오류(500) 대신 요청 오류(422 `INVALID_FILTER`)로 반환하도록 수정. ([PR #3](https://github.com/yungoonkim/specfinder-ai/pull/3))
- 노트북 RAM·화면 크기·무게 Decimal을 JSON 응답에서 숫자로 직렬화; `NULL` 유지. (PR #3)
- 회귀 테스트 19개 추가 및 테스트 의존성 `httpx` 정정. (PR #3)

### 검증

- 로컬 Python/FastAPI → Docker PostgreSQL 직접 연결과 두 테이블 총 2,483건 조회 확인.
- Codex Cloud 및 Windows 로컬의 격리된 회귀 테스트 각각 19 PASS 보고.
- Gemini Browser Subagent의 최종 브라우저 회귀 시나리오 36 PASS, 0 FAIL; 서버 중단 테스트 2 BLOCKED.
- 상세: `docs/tests/FINAL_REGRESSION_REPORT_2026-11-15.md`.

### 알려진 제한

- 노트북·차량 가격 및 매물 여부는 **수집 시점 데이터**이며 실시간 정확도를 보증하지 않는다.
- 자동차 CSV의 개별 매물 상세 URL 미확보: K Car 공통 검색 URL을 개별 매물 링크처럼 취급하지 않는다.
- LLM·LangGraph·AI 채팅·RAG는 이 버전에 포함하지 않는다.
- 라이브 DB/백엔드 실제 중단 장애 시나리오는 미실행이다.
